import React from 'react';
import MemberCard from './MemberCard';
import { useSeatingContext } from '../../hooks/useSeating';

export default function Slot({ pult, si, c }) {
  const { part } = useSeatingContext();
  const name = pult.slots[si];
  const isVn = part === "Vn1st" || part === "Vn2nd";
  
  let label = si === 0 ? "オモテ" : "ウラ";
  if (isVn) {
    label = si === 0 ? "ウラ" : "オモテ";
  }

  return (
    <div className="slot" data-pultid={pult.id} data-slot={si}>
      <div className="slot-lbl">{label}</div>
      {name ? (
        <MemberCard name={name} pultId={pult.id} si={si} c={c} />
      ) : (
        <div className="slot-empty" data-pultid={pult.id} data-slot={si}>－</div>
      )}
    </div>
  );
}