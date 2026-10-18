import { useGame } from '../../context/GameContext.jsx';

const TOPIC_LABELS = {
  budgeting: 'budgeting',
  saving: 'saving',
  debt: 'debt',
};

function visitTotal(customer) {
  const scores = customer.scores;
  return (scores.listen ?? 0)
    + (scores.strategize ?? 0)
    + (scores.prioritize ?? 0)
    + (scores.conclude ?? 0);
}

export default function DayEnd() {
  const { day, starTotal } = useGame();
  const ranked = [...(day?.customers ?? [])].sort((a, b) => visitTotal(b) - visitTotal(a));
  const best = ranked[0];
  const weakest = ranked[ranked.length - 1];
  const tied = best && weakest && visitTotal(best) === visitTotal(weakest);

  return (
    <section className="screen screen--center" aria-labelledby="day-end-title">
      <p className="star-total" aria-live="polite">
        <span className="star-mark" aria-hidden="true">★ </span>
        <span className="visually-hidden">Stars: </span>
        {starTotal}
      </p>
      <h1 id="day-end-title" className="heading card title-card" tabIndex={-1}>
        The day is done
      </h1>
      <p className="card">
        You earned {starTotal} stars out of 200.
        {tied && ' Both visits came out even.'}
        {!tied && best && ` You understood ${TOPIC_LABELS[best.topic]} best.`}
        {!tied && weakest && ` ${TOPIC_LABELS[weakest.topic]} is the one to practice next.`}
      </p>
    </section>
  );
}
