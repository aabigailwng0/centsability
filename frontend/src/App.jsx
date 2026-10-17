import { useEffect, useRef } from 'react';
import { SCREENS, useGame } from './context/GameContext.jsx';
import HomeScreen from './screens/HomeScreen.jsx';
import AboutScreen from './screens/AboutScreen.jsx';
import AvatarSelectScreen from './screens/AvatarSelectScreen.jsx';
import GameScreen from './screens/GameScreen.jsx';

const SCREEN_COMPONENTS = {
  [SCREENS.HOME]: HomeScreen,
  [SCREENS.ABOUT]: AboutScreen,
  [SCREENS.AVATAR_SELECT]: AvatarSelectScreen,
  [SCREENS.GAME]: GameScreen,
};

export default function App() {
  const { screen } = useGame();
  const Screen = SCREEN_COMPONENTS[screen];
  const mainRef = useRef(null);
  const isFirstRender = useRef(true);

  // When the screen changes, move focus to the new screen's heading so
  // keyboard and screen-reader users land at the top of the new content.
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    mainRef.current?.querySelector('h1')?.focus();
  }, [screen]);

  return (
    <>
      <a className="skip-link" href="#main">
        Skip to main content
      </a>
      <main id="main" ref={mainRef} className="app">
        <Screen />
      </main>
    </>
  );
}
