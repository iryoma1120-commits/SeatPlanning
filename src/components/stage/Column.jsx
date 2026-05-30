import React from 'react';
import Pult from './Pult';

export default function Column({ label, pults, c }) {
  return (
    <div className="col" style={{ '--col-border': c.border, '--col-text': c.text, '--col-badge': c.badge }}>
      <div className="col-label">{label}</div>
      {pults.map((p, i) => <Pult key={p.id} pult={p} num={i + 1} c={c} />)}
    </div>
  );
}