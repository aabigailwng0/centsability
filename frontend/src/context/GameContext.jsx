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

  const avatar = AVATARS.find((a) => a.id === avatarId) ?? null;
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

  const recordListenScore = useCallback((score, feedback) => {
    setDay((current) => {
      if (!current) return current;
      const customers = current.customers.map((customer, index) => {
        if (index !== current.customerIndex || customer.scores.listen != null) return customer;
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
    fetch('/api/grade/listen', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ topic, summary }),
    })
      .then(async (response) => {
        const data = await response.json().catch(() => ({}));
        if (listenRequest.current !== requestId) return;
        if (!response.ok || typeof data.score !== 'number') {
          recordListenScore(0, 'We could not check that answer, so this one scored 0.');
          return;
        }
        recordListenScore(data.score, data.feedback);
      })
      .catch(() => {
        if (listenRequest.current !== requestId) return;
        recordListenScore(0, 'We could not check that answer, so this one scored 0.');
      });
  }, [recordListenScore]);

  const starTotal = day
    ? day.customers.reduce((sum, customer) => sum + (customer.scores.listen ?? 0), 0)
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
    ],
  );

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}

export function useGame() {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error('useGame must be used inside <GameProvider>');
  return ctx;
}
