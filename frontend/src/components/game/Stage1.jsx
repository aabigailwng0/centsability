import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { STAGE_HOTSPOTS } from '../../config/stageLayout.js';
import { useGame } from '../../context/GameContext.jsx';
import StageFrame from './StageFrame.jsx';

const MIN_ANSWER = 20;
const MAX_ANSWER = 200;

const PAGE_LABEL = {
  1: 'The desk is empty.',
  2: 'A customer walks up.',
  3: 'Press Listen when you are ready.',
  4: 'Read the customer’s problem.',
  5: 'What is this customer’s core problem?',
  6: 'Ready for the next step.',
};

function hotspotStyle(region) {
  return {
    left: `${region.left}%`,
    top: `${region.top}%`,
    width: `${region.width}%`,
    height: `${region.height}%`,
  };
}

export default function Stage1({ customer, debug, onFinished }) {
  const { trimmedNickname, starTotal, submitListenAnswer } = useGame();
  const [page, setPage] = useState(1);
  const [answer, setAnswer] = useState('');
  const [noteOpen, setNoteOpen] = useState(false);
  const submitted = useRef(false);

  useEffect(() => {
    if (page !== 1 && page !== 2 && page !== 4) return undefined;
    const delay = page === 1 ? 3000 : page === 2 ? 2000 : 8000;
    const timer = window.setTimeout(() => setPage((current) => current + 1), delay);
    return () => window.clearTimeout(timer);
  }, [page]);

  useEffect(() => {
    if (!noteOpen) return undefined;
    const onKey = (event) => {
      if (event.key === 'Escape') setNoteOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [noteOpen]);

  const answerLength = answer.length;
  const answerReady = answerLength >= MIN_ANSWER && answerLength <= MAX_ANSWER;

  const confirmAnswer = () => {
    if (!answerReady || submitted.current) return;
    submitted.current = true;
    submitListenAnswer(customer.topic, answer);
    setPage(6);
  };

  return (
    <StageFrame
      page={page}
      animal={customer.animal}
      nickname={trimmedNickname}
      starTotal={starTotal}
      debug={debug}
    >
      <h1 className="visually-hidden" tabIndex={-1}>
        {PAGE_LABEL[page]}
      </h1>
      <p className="visually-hidden" aria-live="polite">{PAGE_LABEL[page]}</p>

      {page === 3 && (
        <button
          type="button"
          className="stage-hit"
          style={hotspotStyle(STAGE_HOTSPOTS.listen)}
          onClick={() => setPage(4)}
        >
          Listen
        </button>
      )}

      {page === 4 && (
        <>
          <p className="issue-text issue-text--fade" style={hotspotStyle(STAGE_HOTSPOTS.issue)}>
            {customer.issueText}
          </p>
          <button
            type="button"
            className="btn btn--primary stage-visible-btn"
            style={hotspotStyle(STAGE_HOTSPOTS.page4Continue)}
            onClick={() => setPage(5)}
          >
            Continue
          </button>
        </>
      )}

      {page === 5 && (
        <>
          <button
            type="button"
            className="stage-hit"
            style={hotspotStyle(STAGE_HOTSPOTS.note)}
            onClick={() => setNoteOpen(true)}
            aria-label="Open the customer's issue"
          >
            Note
          </button>
          <form
            className="listen-panel"
            style={hotspotStyle(STAGE_HOTSPOTS.answer)}
            onSubmit={(event) => {
              event.preventDefault();
              confirmAnswer();
            }}
          >
            <label htmlFor="core-problem" className="label">
              What is this customer’s core problem?
            </label>
            <textarea
              id="core-problem"
              className="input listen-panel__input"
              value={answer}
              maxLength={MAX_ANSWER}
              onChange={(event) => setAnswer(event.target.value)}
              required
              aria-describedby="answer-count"
            />
            <p id="answer-count" className="hint">
              {answerLength}/{MAX_ANSWER} characters. At least {MIN_ANSWER} to confirm.
            </p>
            <button type="submit" className="btn btn--primary" disabled={!answerReady || submitted.current}>
              Confirm
            </button>
          </form>
          {noteOpen && createPortal(
            <div className="note-overlay" role="presentation" onClick={() => setNoteOpen(false)}>
              <div
                className="card note-dialog"
                role="dialog"
                aria-modal="true"
                aria-labelledby="note-title"
                onClick={(event) => event.stopPropagation()}
              >
                <h2 id="note-title" className="heading">Customer’s Issue</h2>
                <p>{customer.issueText}</p>
                <button type="button" className="btn btn--secondary" onClick={() => setNoteOpen(false)}>
                  Close
                </button>
              </div>
            </div>,
            document.body,
          )}
        </>
      )}

      {page === 6 && (
        <button
          type="button"
          className="stage-hit"
          style={hotspotStyle(STAGE_HOTSPOTS.continue)}
          onClick={onFinished}
        >
          Continue
        </button>
      )}
    </StageFrame>
  );
}
