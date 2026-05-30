import React, { useRef } from 'react';
import { useSeatingContext } from '../../hooks/useSeating';
import { useDragDropContext } from '../../hooks/useDragDrop';

export default function MemberCard({ name, pultId, si, c }) {
  const { allMembers, date } = useSeatingContext();
  const { setGhost, setActiveDrag, activeDrag } = useDragDropContext();
  const cardRef = useRef(null);
  const timerRef = useRef(null);

  const m = allMembers.find(x => x.name === name);
  const isDragging = activeDrag?.name === name;
  const att = m?.att[date];
  const isLate = att && ["△", "▽"].includes(att.status);

  const handlePointerDown = (e) => {
    e.stopPropagation();
    e.currentTarget.setPointerCapture(e.pointerId);
    timerRef.current = setTimeout(() => {
      const r = cardRef.current.getBoundingClientRect();
      setGhost({ html: cardRef.current.outerHTML, width: r.width, x: e.clientX, y: e.clientY });
      setActiveDrag({ name, srcPultId: pultId, srcSlotIdx: si });
    }, 130);
  };

  const handlePointerUp = () => {
    clearTimeout(timerRef.current);
  };

  return (
    <div ref={cardRef} className={`mc ${m?.isTop ? 'is-top' : ''} ${isDragging ? 'dragging' : ''}`}
         onPointerDown={handlePointerDown} onPointerUp={handlePointerUp} onPointerCancel={handlePointerUp}>
      {m?.isTop && <span className="mc-top-mark" style={{ color: c.text }}>♪</span>}
      <span className="mc-name" style={{ color: c.text }}>{name}</span>
      {isLate && <span className="mc-note">{att.status === "△" ? "⚠遅" : "⚠早"}</span>}
    </div>
  );
}