import { useGame } from '../context/GameContext.jsx';

export default function AboutScreen() {
  const { goHome } = useGame();

  return (
    <section className="screen screen--center screen--over-home" aria-labelledby="about-title">
      <h1 id="about-title" className="heading card title-card" tabIndex={-1}>
        About Centsability
      </h1>
      <div className="card prose">
        <p>
          Centsability is a game about learning eerything finance related by helping others with their own money problems. You run a
          counter, and customers walk up with a real-world money problem.
        </p>
        <p>
          Your job is to listen, then give friendly, practical advice. The better your advice fits
          each customer&rsquo;s situation, the more money you earn.
        </p>
        <p>
          Learn about finances in a fun and engaging way with us!
        </p>
      </div>
      <div className="button-row">
        <button
          type="button"
          className="btn btn--secondary"
          onClick={goHome}
          aria-label="Back to home screen"
        >
          Back
        </button>
      </div>
    </section>
  );
}
