import { useCallback, useEffect, useRef, useState } from 'react';
import {
  STAGE2_CLOUDS,
  STAGE2_NOTE,
  STAGE2_STARS,
  STAGE2_SUBMIT,
  STAGE2_TITLE,
  stage2Photo,
} from '../../config/stage2Layout.js';
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

export default function Stage2({ customer, avatarId, debug, onFinished }) {
  const { starTotal, recordStrategize } = useGame();
  const [page, setPage] = useState(7);
  const [noteOpen, setNoteOpen] = useState(false);
  const [holdForNote, setHoldForNote] = useState(false);
  const [strategies, setStrategies] = useState(null);
  const [loadError, setLoadError] = useState('');
  const [selected, setSelected] = useState([]);
  const [rejecting, setRejecting] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const noteOpenRef = useRef(false);
  const rejectTimer = useRef(0);

  useEffect(() => {
    noteOpenRef.current = noteOpen;
  }, [noteOpen]);

  useEffect(() => {
    if (page !== 7) return undefined;
    const timer = window.setTimeout(() => {
      if (noteOpenRef.current) setHoldForNote(true);
      else setPage(8);
    }, 2000);
    return () => window.clearTimeout(timer);
  }, [page]);

  useEffect(() => {
    if (page !== 7 || !holdForNote || noteOpen) return undefined;
    const timer = window.setTimeout(() => setPage(8), 1000);
    return () => window.clearTimeout(timer);
  }, [page, holdForNote, noteOpen]);

  useEffect(() => () => window.clearTimeout(rejectTimer.current), []);

  const loadStrategies = useCallback(() => {
    const controller = new AbortController();
    setLoadError('');
    fetch(`/api/game/strategies?topic=${encodeURIComponent(customer.topic)}`, {
      signal: controller.signal,
    })
      .then((response) => {
        if (!response.ok) throw new Error('The strategies could not be loaded.');
        return response.json();
      })
      .then((data) => {
        if (!Array.isArray(data.strategies) || data.strategies.length !== 5) {
          throw new Error('The strategies could not be loaded.');
        }
        setStrategies(data.strategies);
      })
      .catch((error) => {
        if (error.name !== 'AbortError') setLoadError('The strategies could not be loaded.');
      });
    return controller;
  }, [customer.topic]);

  useEffect(() => {
    const controller = loadStrategies();
    return () => controller.abort();
  }, [loadStrategies]);

  const toggleStrategy = (id) => {
    setSubmitError('');
    if (selected.includes(id)) {
      setSelected(selected.filter((item) => item !== id));
      return;
    }
    if (selected.length >= 2) {
      setRejecting(true);
      window.clearTimeout(rejectTimer.current);
      rejectTimer.current = window.setTimeout(() => setRejecting(false), 450);
      return;
    }
    setSelected([...selected, id]);
  };

  const submitStrategies = async () => {
    if (selected.length !== 2 || submitting) return;
    setSubmitting(true);
    setSubmitError('');
    try {
      const response = await fetch('/api/grade/strategize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: customer.topic, strategyIds: selected }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || typeof data.score !== 'number') {
        throw new Error(data.error || 'Those choices could not be saved.');
      }
      recordStrategize(strategies, selected, data.score);
      onFinished();
    } catch (error) {
      setSubmitError(error.message || 'Those choices could not be saved.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="stage-scene">
      <div className={`stage-frame stage-frame--wide${debug ? ' stage-frame--debug' : ''}`}>
        <img src={stage2Photo(page, avatarId)} alt="" />
        <p className="stage2-stars" style={regionStyle(STAGE2_STARS)} aria-live="polite">
          <span aria-hidden="true">★ </span>
          <span className="visually-hidden">Stars: </span>
          {starTotal}
        </p>
        <h1 className="visually-hidden" tabIndex={-1}>
          {page === 7 ? 'Review the customer’s issue.' : 'Choose the two best strategies.'}
        </h1>
        <IssueNote
          region={STAGE2_NOTE}
          issueText={customer.issueText}
          open={noteOpen}
          onOpen={() => setNoteOpen(true)}
          onClose={() => setNoteOpen(false)}
        />
        {page === 8 && (
          <>
            <p className="stage2-title" style={regionStyle(STAGE2_TITLE)}>
              Choose the two best strategies
            </p>
            {strategies && STAGE2_CLOUDS.map((cloud, index) => (
              <StrategyCloud
                key={cloud.id}
                cloud={cloud}
                text={strategies[index].text}
                selected={selected.includes(strategies[index].id)}
                rejecting={rejecting}
                onToggle={() => toggleStrategy(strategies[index].id)}
              />
            ))}
            {loadError && (
              <p className="stage2-alert" role="alert">
                {loadError}
                <button type="button" className="btn btn--secondary" onClick={loadStrategies}>
                  Retry
                </button>
              </p>
            )}
            {!loadError && !strategies && (
              <p className="stage2-alert">Loading strategies…</p>
            )}
            {submitError && <p className="stage2-alert" role="alert">{submitError}</p>}
            {rejecting && (
              <p className="visually-hidden" aria-live="polite">Pick only two strategies.</p>
            )}
            <button
              type="button"
              className="btn btn--primary stage2-submit"
              style={regionStyle(STAGE2_SUBMIT)}
              disabled={selected.length !== 2 || submitting || !strategies}
              onClick={submitStrategies}
            >
              {submitting ? 'Sending…' : 'Submit'}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
