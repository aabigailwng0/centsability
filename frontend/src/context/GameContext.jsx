import { createContext, useCallback, useContext, useMemo, useState } from 'react';
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

  const avatar = AVATARS.find((a) => a.id === avatarId) ?? null;
  const trimmedNickname = nickname.trim();
  const canStart = avatar !== null && trimmedNickname.length > 0;

  const goHome = useCallback(() => setScreen(SCREENS.HOME), []);
  const openAbout = useCallback(() => setScreen(SCREENS.ABOUT), []);
  const play = useCallback(() => setScreen(SCREENS.AVATAR_SELECT), []);

  const selectAvatar = useCallback((id) => setAvatarId(id), []);
  const changeNickname = useCallback(
    (value) => setNickname(value.slice(0, NICKNAME_MAX_LENGTH)),
    [],
  );

  const startGame = useCallback(() => {
    if (canStart) setScreen(SCREENS.GAME);
  }, [canStart]);

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
    ],
  );

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}

export function useGame() {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error('useGame must be used inside <GameProvider>');
  return ctx;
}
