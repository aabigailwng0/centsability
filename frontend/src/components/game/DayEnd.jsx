import { useEffect, useState } from 'react';
import {
  DAY_NEXT,
  DAY_STARS,
  DAY_STRONG,
  DAY_WEAK,
  dayEndPhoto,
} from '../../config/dayEndLayout.js';
import { useGame } from '../../context/GameContext.jsx';

function regionStyle(region) {
  return {
    left: `${region.left}%`,
    top: `${region.top}%`,
    width: `${region.width}%`,
    height: `${region.height}%`,
  };
}

function visitStars(customer) {
  const scores = customer?.scores ?? {};
  return (scores.listen ?? 0)
    + (scores.strategize ?? 0)
    + (scores.prioritize ?? 0)
    + (scores.conclude ?? 0);
}

function isNote(note) {
  return note
    && typeof note.topic === 'string'
    && typeof note.stars === 'number'
    && Array.isArray(note.points)
    && note.points.length === 3
    && note.points.every((point) => typeof point === 'string');
}

function localReview(customers) {
  const ranked = [...customers].sort((a, b) => visitStars(b) - visitStars(a));
  const strong = ranked[0];
  const weak = ranked[ranked.length - 1];
  const blank = (customer) => ({
    topic: customer?.topic ?? 'visit',
    stars: visitStars(customer),
    points: [
      'The notes could not be written just now.',
      'Identification, strategies, and reasoning are saved from this visit.',
      'The details will show the next time the desk can write them.',
    ],
  });
  return { strong: blank(strong), weak: blank(weak) };
}

function DayNote({ note, waiting }) {
  if (!note) return <p>{waiting}</p>;
  return (
    <>
      <p className="day-note__title">{note.topic} ({note.stars})</p>
      <ul>
        {note.points.map((point) => <li key={point}>{point}</li>)}
      </ul>
    </>
  );
}

export default function DayEnd({ debug }) {
  const { day, avatar, starTotal } = useGame();
  const [review, setReview] = useState(null);
  useEffect(() => {
    if (!day) return undefined;
    const controller = new AbortController();
    const visits = day.customers.map((customer) => ({
      topic: customer.topic,
      listenText: customer.listenAnswer ?? '',
      listenScore: customer.scores.listen ?? 0,
      strategyIds: customer.chosenStrategyIds ?? [],
      priorityId: customer.chosenPriorityId ?? '',
      reason: customer.concludeReason ?? '',
      concludeScore: customer.scores.conclude ?? 0,
    }));

    fetch('/api/grade/day', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ visits }),
      signal: controller.signal,
    })
      .then(async (response) => {
        const data = await response.json().catch(() => ({}));
        if (!response.ok || !isNote(data.strong) || !isNote(data.weak)) {
          throw new Error('The day notes could not be written.');
        }
        setReview(data);
      })
      .catch((error) => {
        if (error.name === 'AbortError') return;
        setReview(localReview(day.customers));
      });

    return () => controller.abort();
  }, [day]);

  return (
    <div className="stage-scene">
      <div className={`stage-frame stage-frame--wide${debug ? ' stage-frame--debug' : ''}`}>
        <img src={dayEndPhoto(avatar?.id)} alt="" />
        <h1 className="visually-hidden" tabIndex={-1}>The day is done</h1>
        <p className="stage2-stars" style={regionStyle(DAY_STARS)} aria-live="polite">
          <span className="star-mark" aria-hidden="true">★ </span>
          <span className="visually-hidden">Stars: </span>
          {starTotal}
        </p>
        <div className="day-note" style={regionStyle(DAY_STRONG)}>
          <DayNote note={review?.strong} waiting="Looking over what went well…" />
        </div>
        <div className="day-note" style={regionStyle(DAY_WEAK)}>
          <DayNote note={review?.weak} waiting="Looking over what to practice…" />
        </div>
        <button type="button" className="btn btn--primary stage2-submit" style={regionStyle(DAY_NEXT)}>
          Next day
        </button>
      </div>
    </div>
  );
}
