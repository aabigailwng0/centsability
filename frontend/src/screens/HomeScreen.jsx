import { useGame } from '../context/GameContext.jsx';

export default function HomeScreen() {
  const { play, openAbout } = useGame();

  return (
    <section className="screen screen--home" aria-labelledby="home-title">
      <h1 id="home-title" className="visually-hidden" tabIndex={-1}>
        Centsability
      </h1>
      <div className="home-art">
        <img src="/assets/home_page.png" alt="" />
        <button type="button" className="home-hotspot home-hotspot--play" onClick={play}>
          Play
        </button>
        <button type="button" className="home-hotspot home-hotspot--about" onClick={openAbout}>
          About us
        </button>
      </div>
    </section>
  );
}
