import React from 'react';
import MemberCard from './MemberCard';

export default function Slot({ pult, si, c }) {
  const name = pult.slots[si];
  return (
    <div className="slot" data-pultid={pult.id} data-slot={si}>
      <div className="slot-lbl">{si === 0 ? "オモテ" : "ウラ"}</div>
      {name ? (
        <MemberCard name={name} pultId={pult.id} si={si} c={c} />
      ) : (
        <div className="slot-empty" data-pultid={pult.id} data-slot={si}>－</div>
      )}
    </div>
  );
}