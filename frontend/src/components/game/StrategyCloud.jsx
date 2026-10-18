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
      const height = box.clientHeight;
      const width = box.clientWidth;
      if (height < 8 || width < 8) return;
      let size = Math.round(Math.min(height * 0.42, width * 0.14));
      const min = 13;
      size = Math.max(size, min);
      el.style.fontSize = `${size}px`;
      while (el.scrollHeight > height + 1 && size > min) {
        size -= 1;
        el.style.fontSize = `${size}px`;
      }
    };
    fit();
    const frame = window.requestAnimationFrame(fit);
    const observer = new ResizeObserver(fit);
    observer.observe(box);
    return () => {
      window.cancelAnimationFrame(frame);
      observer.disconnect();
    };
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
