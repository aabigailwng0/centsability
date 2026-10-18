import { useState } from 'react';
import {
  STAGE3_CLOUDS,
  STAGE3_CONFIRM,
  STAGE3_NOTE,
  STAGE3_STARS,
  STAGE3_TITLE,
  stage3Photo,
} from '../../config/stage3Layout.js';
import { useGame } from '../../context/GameContext.jsx';
import IssueNote from './IssueNote.jsx';
import StrategyCloud from './StrategyCloud.jsx';

function regionStyle(region) {
  return {
    left: `${region.left}%`,
    top: `${region.top}%`,
    width: `${region.width}%`,
    height: `${region.height}%`,
  };
}

export default function Stage3({ customer, avatarId, debug, onFinished }) {
  const { starTotal, recordPrioritize } = useGame();
  const [noteOpen, setNoteOpen] = useState(false);
  const [selected, setSelected] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const chosen = (customer.chosenStrategyIds ?? [])
    .map((id) => (customer.strategies ?? []).find((item) => item.id === id))
    .filter(Boolean);
  const ready = chosen.length === 2;

  const choose = (id) => {
    setSubmitError('');
    setSelected(selected === id ? '' : id);
  };

  const confirmChoice = async () => {
    if (!ready || !selected || submitting) return;
    setSubmitting(true);
    setSubmitError('');
    try {
      const response = await fetch('/api/grade/prioritize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: customer.topic,
          strategyIds: chosen.map((item) => item.id),
          chosenId: selected,
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || typeof data.score !== 'number') {
        throw new Error(data.error || 'That choice could not be saved.');
      }
      recordPrioritize(selected, data.score);
      onFinished();
    } catch (error) {
      setSubmitError(error.message || 'That choice could not be saved.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="stage-scene">
      <div className={`stage-frame stage-frame--wide${debug ? ' stage-frame--debug' : ''}`}>
        <img src={stage3Photo(avatarId)} alt="" />
        <p className="stage2-stars" style={regionStyle(STAGE3_STARS)} aria-live="polite">
          <span className="star-mark" aria-hidden="true">★ </span>
          <span className="visually-hidden">Stars: </span>
          {starTotal}
        </p>
        <h1 className="visually-hidden" tabIndex={-1}>
          Select the single best strategy.
        </h1>
        <p className="stage2-title" style={regionStyle(STAGE3_TITLE)}>
          Select the single best strategy
        </p>
        <IssueNote
          region={STAGE3_NOTE}
          issueText={customer.issueText}
          open={noteOpen}
          onOpen={() => setNoteOpen(true)}
          onClose={() => setNoteOpen(false)}
        />
        {ready && STAGE3_CLOUDS.map((cloud, index) => (
          <StrategyCloud
            key={cloud.id}
            cloud={cloud}
            text={chosen[index].text}
            selected={selected === chosen[index].id}
            rejecting={false}
            onToggle={() => choose(chosen[index].id)}
          />
        ))}
        {!ready && (
          <p className="stage2-alert" role="alert">
            The two strategies from the last step are missing.
          </p>
        )}
        {submitError && <p className="stage2-alert" role="alert">{submitError}</p>}
        <button
          type="button"
          className="btn btn--primary stage2-submit"
          style={regionStyle(STAGE3_CONFIRM)}
          disabled={!ready || !selected || submitting}
          onClick={confirmChoice}
        >
          {submitting ? 'Sending…' : 'Confirm'}
        </button>
      </div>
    </div>
  );
}
