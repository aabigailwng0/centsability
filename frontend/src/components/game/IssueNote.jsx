import { useEffect } from 'react';
import { createPortal } from 'react-dom';

function regionStyle(region) {
  return {
    left: `${region.left}%`,
    top: `${region.top}%`,
    width: `${region.width}%`,
    height: `${region.height}%`,
  };
}

export default function IssueNote({ region, issueText, open, onOpen, onClose }) {
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (event) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  return (
    <>
      <button
        type="button"
        className="stage-hit stage2-note"
        style={regionStyle(region)}
        onClick={onOpen}
        aria-label="Open the customer's issue"
      >
        Note
      </button>
      {open && createPortal(
        <div className="note-overlay" role="presentation" onClick={onClose}>
          <div
            className="card note-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="stage2-note-title"
            onClick={(event) => event.stopPropagation()}
          >
            <h2 id="stage2-note-title" className="heading">Customer’s Issue</h2>
            <p>{issueText}</p>
            <button type="button" className="btn btn--secondary" onClick={onClose}>
              Close
            </button>
          </div>
        </div>,
        document.body,
      )}
    </>
  );
}
