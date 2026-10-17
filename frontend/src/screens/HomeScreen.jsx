import { useGame } from '../context/GameContext.jsx';

export default function HomeScreen() {
  const { play, openAbout } = useGame();

  return (
    <section className="screen screen--center" aria-labelledby="home-title">
      <h1 id="home-title" className="title" tabIndex={-1}>
        Centsability
      </h1>
      <p className="tagline">Understanding Your Sense of Cents</p>
      <div className="button-row">
        <button type="button" className="btn btn--primary" onClick={play} aria-label="Play the game">
          Play
        </button>
        <button
          type="button"
          className="btn btn--secondary"
          onClick={openAbout}
          aria-label="About Centsability"
        >
          About
        </button>
      </div>
    </section>
  );
}
