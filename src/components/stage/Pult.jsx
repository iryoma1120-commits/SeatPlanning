import React from 'react';
import Slot from './Slot';
import { useDragDropContext } from '../../hooks/useDragDrop';
import { useSeatingContext } from '../../hooks/useSeating';

export default function Pult({ pult, num, c }) {
  const { setPultDrag, pultDrag } = useDragDropContext();
  const { doSwapPults } = useSeatingContext();

  const handlePointerDown = (e) => {
    e.stopPropagation();
    e.currentTarget.setPointerCapture(e.pointerId);
    setPultDrag(pult.id);
  };

  const handlePointerUp = () => {
    if (pultDrag && pultDrag !== pult.id) {
      doSwapPults(pultDrag, pult.id);
      setPultDrag(null);
    }
  };

  return (
    <div className="pult" id={`pult-${pult.id}`} style={{ '--pult-bg': c.bg, '--pult-border': c.border + "55" }} onPointerUp={handlePointerUp}>
      <div className="pult-top">
        <span className="pult-badge" style={{ background: c.badge }}>{num}プルト</span>
        <span className="pult-handle" onPointerDown={handlePointerDown} onPointerUp={() => setPultDrag(null)}>⠿</span>
      </div>
      <div className="slots">
        {[0, 1].map(si => <Slot key={si} pult={pult} si={si} c={c} />)}
      </div>
    </div>
  );
}