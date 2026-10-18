import { createContext, useCallback, useContext, useLayoutEffect, useMemo, useRef, useState } from 'react';

const CloudSizeContext = createContext(null);

export function CloudSizeGroup({ children }) {
  const reported = useRef(new Map());
  const [shared, setShared] = useState(null);
  const report = useCallback((id, size) => {
    if (reported.current.get(id) === size) return;
    reported.current.set(id, size);
    const next = Math.min(...reported.current.values());
    setShared((current) => (current === next ? current : next));
  }, []);
  const value = useMemo(() => ({ shared, report }), [shared, report]);
  return (
    <CloudSizeContext.Provider value={value}>
      {children}
    </CloudSizeContext.Provider>
  );
}

function innerStyle(button, text) {
  return {
    left: `${((text.left - button.left) / button.width) * 100}%`,
    top: `${((text.top - button.top) / button.height) * 100}%`,
    width: `${(text.width / button.width) * 100}%`,
    height: `${(text.height / button.height) * 100}%`,
  };
}

function naturalSize(box, el, scale) {
  const height = box.clientHeight;
  const width = box.clientWidth;
  if (height < 8 || width < 8) return null;
  let size = Math.round(Math.min(height * 0.42, width * 0.14) * 0.62 * scale);
  const min = 11;
  size = Math.max(size, min);
  el.style.fontSize = `${size}px`;
  while (el.scrollHeight > height + 1 && size > min) {
    size -= 1;
    el.style.fontSize = `${size}px`;
  }
  return size;
}

export default function StrategyCloud({
  cloud,
  text,
  selected,
  rejecting,
  onToggle,
  textScale = 1,
}) {
  const boxRef = useRef(null);
  const textRef = useRef(null);
  const group = useContext(CloudSizeContext);
  const shared = group?.shared ?? null;
  const report = group?.report;

  useLayoutEffect(() => {
    const box = boxRef.current;
    const el = textRef.current;
    if (!box || !el) return undefined;
    const fit = () => {
      const fitted = naturalSize(box, el, textScale);
      if (fitted == null) return;
      report?.(cloud.id, fitted);
      const applied = shared == null ? fitted : Math.min(shared, fitted);
      el.style.fontSize = `${applied}px`;
    };
    fit();
    const frame = window.requestAnimationFrame(fit);
    const observer = new ResizeObserver(fit);
    observer.observe(box);
    return () => {
      window.cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, [text, shared, cloud.id, report, textScale]);

  return (
    <button
      type="button"
      className={[
        'cloud-btn',
        selected ? 'cloud-btn--selected' : '',
        rejecting && selected ? 'cloud-btn--reject cloud-btn--shake' : '',
      ].filter(Boolean).join(' ')}
      style={{
        left: `${cloud.button.left}%`,
        top: `${cloud.button.top}%`,
        width: `${cloud.button.width}%`,
        height: `${cloud.button.height}%`,
      }}
      aria-pressed={selected}
      onClick={onToggle}
    >
      <span ref={boxRef} className="cloud-btn__text" style={innerStyle(cloud.button, cloud.text)}>
        <span ref={textRef} className="cloud-btn__fit">{text}</span>
      </span>
      {selected && <span className="cloud-btn__check" aria-hidden="true">✓</span>}
    </button>
  );
}
