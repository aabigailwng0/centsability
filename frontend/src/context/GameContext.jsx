import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import { AVATARS, NICKNAME_MAX_LENGTH } from '../config/avatars.js';

export const SCREENS = {
  HOME: 'home',
  ABOUT: 'about',
  AVATAR_SELECT: 'avatar-select',
  GAME: 'game',
};

const GameContext = createContext(null);

/**
 * Holds the current screen and the player's avatar + nickname.
 * All player actions are plain functions exposed here, so buttons (and later,
 * optional hardware input) can trigger exactly the same behavior.
 */
export function GameProvider({ children }) {
  const [screen, setScreen] = useState(SCREENS.HOME);
  const [avatarId, setAvatarId] = useState(null);
  const [nickname, setNickname] = useState('');
  // One day: two customers, current index, and a score slot per stage.
  const [day, setDay] = useState(null);
  // Bumped when the player leaves, so a late grade cannot land on a new day.
  const listenRequest = useRef(0);
  const dayRef = useRef(null);

  const avatar = AVATARS.find((a) => a.id === avatarId) ?? null;
  dayRef.current = day;
  const trimmedNickname = nickname.trim();
  const canStart = avatar !== null && trimmedNickname.length > 0;

  const goHome = useCallback(() => {
    listenRequest.current += 1;
    setScreen(SCREENS.HOME);
  }, []);
  const openAbout = useCallback(() => setScreen(SCREENS.ABOUT), []);
  const play = useCallback(() => setScreen(SCREENS.AVATAR_SELECT), []);

  const selectAvatar = useCallback((id) => setAvatarId(id), []);
  const changeNickname = useCallback(
    (value) => setNickname(value.slice(0, NICKNAME_MAX_LENGTH)),
    [],
  );

  const startGame = useCallback(() => {
    if (!canStart) return;
    listenRequest.current += 1;
    setDay(null);
    setScreen(SCREENS.GAME);
  }, [canStart]);

  const setCustomers = useCallback((customers) => {
    setDay({
      nickname: trimmedNickname,
      customerIndex: 0,
      customers: customers.map((customer) => ({
        ...customer,
        scores: { listen: null, strategize: null, prioritize: null, conclude: null },
        feedback: { listen: null, conclude: null },
      })),
    });
  }, [trimmedNickname]);

  const recordListenScore = useCallback((customerIndex, score, feedback) => {
    setDay((current) => {
      if (!current) return current;
      const customers = current.customers.map((customer, index) => {
        if (index !== customerIndex || customer.scores.listen != null) return customer;
        return {
          ...customer,
          scores: { ...customer.scores, listen: score },
          feedback: { ...customer.feedback, listen: feedback },
        };
      });
      return { ...current, customers };
    });
  }, []);

  const submitListenAnswer = useCallback((topic, summary) => {
    const requestId = ++listenRequest.current;
    const customerIndex = dayRef.current?.customerIndex ?? 0;
    setDay((current) => {
      if (!current) return current;
      const customers = current.customers.map((customer, index) => (
        index === customerIndex ? { ...customer, listenAnswer: summary } : customer
      ));
      return { ...current, customers };
    });
    fetch('/api/grade/listen', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ topic, summary }),
    })
      .then(async (response) => {
        const data = await response.json().catch(() => ({}));
        if (listenRequest.current !== requestId) return;
        if (!response.ok || typeof data.score !== 'number') {
          recordListenScore(customerIndex, 0, 'We could not check that answer, so this one scored 0.');
          return;
        }
        recordListenScore(customerIndex, data.score, data.feedback);
      })
      .catch(() => {
        if (listenRequest.current !== requestId) return;
        recordListenScore(customerIndex, 0, 'We could not check that answer, so this one scored 0.');
      });
  }, [recordListenScore]);

  const recordPrioritize = useCallback((chosenId, score) => {
    setDay((current) => {
      if (!current) return current;
      const customers = current.customers.map((customer, index) => {
        if (index !== current.customerIndex || customer.scores.prioritize != null) return customer;
        return {
          ...customer,
          chosenPriorityId: chosenId,
          scores: { ...customer.scores, prioritize: score },
        };
      });
      return { ...current, customers };
    });
  }, []);

  const recordConclude = useCallback((score, feedback, answer, reason) => {
    setDay((current) => {
      if (!current) return current;
      const customers = current.customers.map((customer, index) => {
        if (index !== current.customerIndex || customer.scores.conclude != null) return customer;
        return {
          ...customer,
          concludeAnswer: answer,
          concludeReason: reason,
          scores: { ...customer.scores, conclude: score },
          feedback: { ...customer.feedback, conclude: feedback },
        };
      });
      return { ...current, customers };
    });
  }, []);

  const finishCustomer = useCallback(() => {
    setDay((current) => {
      if (!current || current.customerIndex >= current.customers.length) return current;
      return { ...current, customerIndex: current.customerIndex + 1 };
    });
  }, []);

  const recordStrategize = useCallback((strategies, chosenIds, score) => {
    setDay((current) => {
      if (!current) return current;
      const customers = current.customers.map((customer, index) => {
        if (index !== current.customerIndex || customer.scores.strategize != null) return customer;
        return {
          ...customer,
          strategies,
          chosenStrategyIds: chosenIds,
          scores: { ...customer.scores, strategize: score },
        };
      });
      return { ...current, customers };
    });
  }, []);

  const starTotal = day
    ? day.customers.reduce((sum, customer, index) => {
      if (index >= day.customerIndex) return sum;
      const scores = customer.scores;
      return sum
        + (scores.listen ?? 0)
        + (scores.strategize ?? 0)
        + (scores.prioritize ?? 0)
        + (scores.conclude ?? 0);
    }, 0)
    : 0;

  const value = useMemo(
    () => ({
      screen,
      avatar,
      nickname,
      trimmedNickname,
      canStart,
      goHome,
      openAbout,
      play,
      selectAvatar,
      changeNickname,
      startGame,
      day,
      starTotal,
      setCustomers,
      recordListenScore,
      submitListenAnswer,
      recordStrategize,
      recordPrioritize,
      recordConclude,
      finishCustomer,
    }),
    [
      screen,
      avatar,
      nickname,
      trimmedNickname,
      canStart,
      goHome,
      openAbout,
      play,
      selectAvatar,
      changeNickname,
      startGame,
      day,
      starTotal,
      setCustomers,
      recordListenScore,
      submitListenAnswer,
      recordStrategize,
      recordPrioritize,
      recordConclude,
      finishCustomer,
    ],
  );

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}

export function useGame() {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error('useGame must be used inside <GameProvider>');
  return ctx;
}
