import { useEffect, useState } from 'react';
import Stage1 from '../components/game/Stage1.jsx';
import Stage2 from '../components/game/Stage2.jsx';
import Stage3 from '../components/game/Stage3.jsx';
import Stage4 from '../components/game/Stage4.jsx';
import DayEnd from '../components/game/DayEnd.jsx';
import { useGame } from '../context/GameContext.jsx';

export default function GameScreen() {
  const { day, avatar, goHome, setCustomers, finishCustomer } = useGame();
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

  useEffect(() => {
    if (!day) setPhase('stage1');
  }, [day]);

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

  if (phase === 'day-end') {
    return (
      <>
        <DayEnd debug={debug} />
        <QuitButton onQuit={goHome} />
      </>
    );
  }

  const customer = day.customers[day.customerIndex];
  const lastCustomer = day.customerIndex >= day.customers.length - 1;

  if (phase === 'stage4') {
    return (
      <>
        <Stage4
          customer={customer}
          debug={debug}
          lastCustomer={lastCustomer}
          onNext={() => {
            finishCustomer();
            setPhase(lastCustomer ? 'day-end' : 'stage1');
          }}
        />
        <QuitButton onQuit={goHome} />
      </>
    );
  }

  if (phase === 'stage3') {
    return (
      <>
        <Stage3
          customer={customer}
          avatarId={avatar?.id}
          debug={debug}
          onFinished={() => setPhase('stage4')}
        />
        <QuitButton onQuit={goHome} />
      </>
    );
  }

  if (phase === 'stage2') {
    return (
      <>
        <Stage2
          customer={customer}
          avatarId={avatar?.id}
          debug={debug}
          onFinished={() => setPhase('stage3')}
        />
        <QuitButton onQuit={goHome} />
      </>
    );
  }

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
