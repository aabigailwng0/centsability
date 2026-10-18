import { useGame } from '../../context/GameContext.jsx';

export default function Stage4Placeholder() {
  const { starTotal } = useGame();

  return (
    <section className="screen screen--center" aria-labelledby="stage4-title">
      <p className="star-total" aria-live="polite">
        <span aria-hidden="true">★ </span>
        <span className="visually-hidden">Stars: </span>
        {starTotal}
      </p>
      <h1 id="stage4-title" className="heading card title-card" tabIndex={-1}>
        Stage 4 coming soon
      </h1>
      <p className="card">The next part of this customer’s visit is not built yet.</p>
    </section>
  );
}
