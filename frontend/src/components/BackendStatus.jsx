import { useEffect, useState } from 'react';

// Tiny dev-time indicator proving the frontend can reach the backend through
// the Vite proxy (/api -> http://localhost:3001).
export default function BackendStatus() {
  const [status, setStatus] = useState('checking');

  useEffect(() => {
    const controller = new AbortController();
    fetch('/api/health', { signal: controller.signal })
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error(res.statusText))))
      .then((data) => setStatus(data.status === 'ok' ? 'online' : 'offline'))
      .catch((err) => {
        if (err.name !== 'AbortError') setStatus('offline');
      });
    return () => controller.abort();
  }, []);

  const text = {
    checking: 'Checking server…',
    online: 'Server: online',
    offline: 'Server: offline',
  }[status];

  return (
    <p className={`backend-status backend-status--${status}`} role="status">
      <span className="backend-status__dot" aria-hidden="true" />
      {text}
    </p>
  );
}
