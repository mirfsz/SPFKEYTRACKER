import React, { useEffect, useRef } from 'react';
import { REASON_LABELS } from '../data/keyData';

const visibleForFilter = (key, filter) => {
  if (filter === 'in') return key.condition === 'usable' && key.location === 'in';
  if (filter === 'out') return key.condition === 'usable' && key.location === 'out';
  if (filter === 'unusable') return key.condition === 'unusable';
  if (filter === 'review') return key.needsReview;
  return true;
};

const KeyGrid = ({ keys, mode, filter, selected, onToggle, onSelect, onSelectRange, selecting }) => {
  const gesture = useRef(null);
  const suppressClick = useRef(false);
  const timer = useRef(null);
  const grid = useRef(null);
  useEffect(() => () => clearTimeout(timer.current), []);
  useEffect(() => {
    const element = grid.current;
    const preventScroll = (event) => { if (gesture.current?.active) event.preventDefault(); };
    element.addEventListener('touchmove', preventScroll, { passive: false });
    return () => element.removeEventListener('touchmove', preventScroll);
  }, []);
  const range = (end) => {
    const start = gesture.current.start;
    onSelectRange(Object.values(keys).filter(key => key.number >= Math.min(start, end)
      && key.number <= Math.max(start, end) && visibleForFilter(key, filter)
      && (mode === 'manage' || key.condition === 'usable')).map(key => key.number));
  };
  const begin = (event, number) => {
    if (event.button && event.button !== 0) return;
    suppressClick.current = false;
    gesture.current = { start: number, x: event.clientX, y: event.clientY, active: false };
    if (event.pointerType === 'touch') {
      timer.current = setTimeout(() => {
        if (!gesture.current) return;
        gesture.current.active = true;
        suppressClick.current = true;
        range(number);
      }, 420);
    }
  };
  const move = (event) => {
    const current = gesture.current;
    if (!current) return;
    const distance = Math.hypot(event.clientX - current.x, event.clientY - current.y);
    if (event.pointerType === 'touch' && !current.active && distance > 8) {
      clearTimeout(timer.current);
      gesture.current = null;
      return;
    }
    const tile = document.elementFromPoint(event.clientX, event.clientY)?.closest('[data-key]');
    if (!tile) return;
    const end = Number(tile.dataset.key);
    if (current.active || (event.pointerType !== 'touch' && end !== current.start)) {
      current.active = true;
      suppressClick.current = true;
      range(end);
    }
  };
  const finish = () => { clearTimeout(timer.current); gesture.current = null; };
  return (
  <section className="key-board" aria-label="Keys 1 to 54">
    <div className="board-legend" aria-hidden="true">
      <span><i className="dot in" />In fridge</span>
      <span><i className="dot out" />Drawn</span>
      <span><i className="dot unusable" />Unusable</span>
    </div>
    <p className="selection-help">{selecting || mode === 'manage' ? 'Tap keys or drag across a range to select.' : 'Drag to select several · On phone, hold then slide'}</p>
    <div ref={grid} className={`key-grid ${selecting || mode === 'manage' ? 'selection-mode' : ''}`} onPointerMove={move} onPointerUp={finish} onPointerCancel={finish} onPointerLeave={finish}>
      {Object.values(keys).map((key) => {
        const isSelected = selected.includes(key.number);
        const state = key.condition === 'unusable' ? 'unusable' : key.location;
        const hidden = !visibleForFilter(key, filter);
        const label = key.condition === 'unusable'
          ? `Key ${key.number}, unusable${key.reason ? `, ${REASON_LABELS[key.reason]}` : ''}`
          : `Key ${key.number}, ${key.location === 'in' ? 'in fridge' : 'drawn out'}`;
        return (
          <button
            key={key.number}
            data-key={key.number}
            className={`key-tile ${state} ${isSelected ? 'selected' : ''} ${key.needsReview ? 'review' : ''} ${hidden ? 'filtered' : ''}`}
            onPointerDown={(event) => begin(event, key.number)}
            onContextMenu={(event) => event.preventDefault()}
            onClick={() => {
              if (suppressClick.current) { suppressClick.current = false; return; }
              if (mode === 'manage' || selecting) onSelect(key.number);
              else onToggle(key.number);
            }}
            aria-label={mode === 'manage' ? `${label}. ${isSelected ? 'Selected' : 'Not selected'}` : label}
            aria-pressed={mode === 'manage' || selecting ? isSelected : undefined}
          >
            <span className="key-number">{key.number}</span>
            {key.condition === 'unusable' && <span className="inactive-mark" aria-hidden="true" />}
            {key.number >= 51 && <span className="key-type">L{key.number - 50}</span>}
            {key.needsReview && <span className="review-mark" aria-hidden="true">!</span>}
          </button>
        );
      })}
    </div>
  </section>
  );
};

export default KeyGrid;
