import { useState } from 'react';
import { STAGE4_NOTE, STAGE4_PANEL } from '../../config/stageLayout.js';
import { useGame } from '../../context/GameContext.jsx';
import IssueNote from './IssueNote.jsx';
import StageFrame from './StageFrame.jsx';

const MIN_REASON = 20;
const MAX_REASON = 300;

const STAGE_ROWS = [
  ['listen', 'Problem Identification'],
  ['strategize', 'Strategies'],
  ['prioritize', 'Best Choice'],
  ['conclude', 'Reasoning'],
];

function regionStyle(region) {
  return {
    left: `${region.left}%`,
    top: `${region.top}%`,
    width: `${region.width}%`,
    height: `${region.height}%`,
  };
}

export default function Stage4({ customer, debug, lastCustomer, onNext }) {
  const { trimmedNickname, starTotal, recordConclude } = useGame();
  const [noteOpen, setNoteOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [result, setResult] = useState(null);

  const chosen = (customer.strategies ?? []).find((item) => item.id === customer.chosenPriorityId);
  const ready = reason.trim().length >= MIN_REASON && reason.length <= MAX_REASON;
  const scores = {
    ...customer.scores,
    conclude: result?.score ?? customer.scores.conclude,
  };

  const submitReason = async (event) => {
    event.preventDefault();
    if (!chosen || !ready || submitting || result) return;
    setSubmitting(true);
    setSubmitError('');
    try {
      const response = await fetch('/api/grade/conclude', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: customer.topic,
          reason,
          chosenId: chosen.id,
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || typeof data.score !== 'number' || !data.answer?.strategy) {
        throw new Error(data.error || 'That answer could not be checked.');
      }
      recordConclude(data.score, data.feedback, data.answer);
      setResult(data);
    } catch (error) {
      setSubmitError(error.message || 'That answer could not be checked.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <StageFrame
      page={10}
      animal={customer.animal}
      nickname={trimmedNickname}
      starTotal={starTotal}
      debug={debug}
    >
      <h1 className="visually-hidden" tabIndex={-1}>
        {result ? 'How this visit went.' : 'Explain why this strategy is best.'}
      </h1>
      <IssueNote
        region={STAGE4_NOTE}
        issueText={customer.issueText}
        open={noteOpen}
        onOpen={() => setNoteOpen(true)}
        onClose={() => setNoteOpen(false)}
      />
      <div className="conclude-panel" style={regionStyle(STAGE4_PANEL)}>
        {result ? (
          <>
            <p className="label">Best Strategy</p>
            <p className="conclude-panel__strategy">{result.answer.strategy}</p>
            <p>{result.answer.explanation}</p>
            <ul className="conclude-scores">
              {STAGE_ROWS.map(([key, label]) => (
                <li key={key}>
                  <span>{label}</span>
                  <span>
                    <span className="star-mark" aria-hidden="true">★ </span>
                    {scores[key] == null ? '…' : scores[key]}
                  </span>
                </li>
              ))}
            </ul>
            <button type="button" className="btn btn--primary" onClick={onNext}>
              {lastCustomer ? 'Finish the day' : 'Next customer'}
            </button>
          </>
        ) : (
          <form onSubmit={submitReason}>
            <p className="label">Why is this the best strategy?</p>
            {chosen ? (
              <p className="conclude-panel__strategy">{chosen.text}</p>
            ) : (
              <p role="alert">The strategy from the last step is missing.</p>
            )}
            <label className="visually-hidden" htmlFor="strategy-reason">
              Why is this the best strategy?
            </label>
            <textarea
              id="strategy-reason"
              className="input listen-panel__input"
              value={reason}
              maxLength={MAX_REASON}
              onChange={(event) => setReason(event.target.value)}
              required
              aria-describedby="reason-count"
            />
            <p id="reason-count" className="hint">
              {reason.length}/{MAX_REASON} characters. At least {MIN_REASON} to submit.
            </p>
            {submitError && <p className="listen-panel__error" role="alert">{submitError}</p>}
            <button type="submit" className="btn btn--primary" disabled={!chosen || !ready || submitting}>
              {submitting ? 'Sending…' : 'Submit'}
            </button>
          </form>
        )}
      </div>
    </StageFrame>
  );
}
