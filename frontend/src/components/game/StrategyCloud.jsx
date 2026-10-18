import { useLayoutEffect, useRef } from 'react';

function innerStyle(button, text) {
  return {
    left: `${((text.left - button.left) / button.width) * 100}%`,
    top: `${((text.top - button.top) / button.height) * 100}%`,
    width: `${(text.width / button.width) * 100}%`,
    height: `${(text.height / button.height) * 100}%`,
  };
}

export default function StrategyCloud({ cloud, text, selected, rejecting, onToggle }) {
  const boxRef = useRef(null);
  const textRef = useRef(null);

  useLayoutEffect(() => {
    const box = boxRef.current;
    const el = textRef.current;
    if (!box || !el) return undefined;
    const fit = () => {
      let size = 1.05;
      el.style.fontSize = `${size}cqi`;
      while (el.scrollHeight > box.clientHeight + 1 && size > 0.48) {
        size = Math.round((size - 0.04) * 100) / 100;
        el.style.fontSize = `${size}cqi`;
      }
    };
    fit();
    const frame = window.requestAnimationFrame(fit);
    return () => window.cancelAnimationFrame(frame);
  }, [text]);

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
