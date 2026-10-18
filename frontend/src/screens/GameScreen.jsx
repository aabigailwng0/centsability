import { useEffect, useState } from 'react';
import Stage1 from '../components/game/Stage1.jsx';
import Stage2Placeholder from '../components/game/Stage2Placeholder.jsx';
import { useGame } from '../context/GameContext.jsx';

export default function GameScreen() {
  const { day, goHome, setCustomers } = useGame();
  const [phase, setPhase] = useState('stage1');
  const [loadError, setLoadError] = useState('');
  const debug = new URLSearchParams(window.location.search).get('debug') === '1';

  useEffect(() => {
    if (day) return undefined;
    const controller = new AbortController();
    setLoadError('');

    fetch('/api/game/start', { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error('The desk could not open.');
        return response.json();
      })
      .then((data) => {
        if (!Array.isArray(data.customers) || data.customers.length === 0) {
          throw new Error('The desk could not open.');
        }
        setCustomers(data.customers);
      })
      .catch((error) => {
        if (error.name !== 'AbortError') setLoadError('The desk could not open. Is the server running?');
      });

    return () => controller.abort();
  }, [day, setCustomers]);

  if (loadError) {
    return (
      <section className="screen screen--center" aria-labelledby="game-error-title">
        <h1 id="game-error-title" className="heading card title-card" tabIndex={-1}>
          Desk closed
        </h1>
        <p className="card" role="alert">{loadError}</p>
        <button type="button" className="btn btn--secondary" onClick={goHome}>
          Back
        </button>
      </section>
    );
  }

  if (!day) {
    return (
      <section className="screen screen--center" aria-labelledby="game-loading-title">
        <h1 id="game-loading-title" className="heading" tabIndex={-1}>
          Opening the desk…
        </h1>
      </section>
    );
  }

  if (phase === 'stage2') {
    return (
      <>
        <Stage2Placeholder />
        <QuitButton onQuit={goHome} />
      </>
    );
  }

  const customer = day.customers[day.customerIndex];
  return (
    <>
      <Stage1
        customer={customer}
        debug={debug}
        onFinished={() => setPhase('stage2')}
      />
      <QuitButton onQuit={goHome} />
    </>
  );
}

function QuitButton({ onQuit }) {
  return (
    <button type="button" className="btn btn--quit" onClick={onQuit}>
      Quit
    </button>
  );
}
