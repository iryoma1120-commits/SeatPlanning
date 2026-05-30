import { createContext, useContext, useState, useEffect } from 'react';
import { useSeatingContext } from './useSeating';

const DragDropContext = createContext();
export const useDragDropContext = () => useContext(DragDropContext);

export const DragDropProvider = ({ children }) => {
  const { doSwap, doSwapPults } = useSeatingContext();
  const [ghost, setGhost] = useState(null);
  const [activeDrag, setActiveDrag] = useState(null);
  const [pultDrag, setPultDrag] = useState(null);

  useEffect(() => {
    const handleMove = (e) => {
      if (ghost) {
        setGhost(prev => ({ ...prev, x: e.clientX, y: e.clientY }));
        if (activeDrag) {
          document.querySelectorAll(".slot.hl-slot").forEach(el => el.classList.remove("hl-slot"));
          const under = document.elementsFromPoint(e.clientX, e.clientY);
          const sl = under.find(el => el.dataset?.slot != null && el.dataset?.pultid && el.classList.contains("slot"));
          if (sl) sl.classList.add("hl-slot");
        }
      }
    };
    const handleUp = (e) => {
      if (activeDrag) {
        document.querySelectorAll(".slot.hl-slot").forEach(el => el.classList.remove("hl-slot"));
        const under = document.elementsFromPoint(e.clientX, e.clientY);
        const sl = under.find(el => el.dataset?.slot != null && el.dataset?.pultid && (el.classList.contains("slot") || el.classList.contains("slot-empty")));
        if (sl) {
          const dp = sl.dataset.pultid, ds = +sl.dataset.slot;
          if (dp !== activeDrag.srcPultId || ds !== activeDrag.srcSlotIdx) {
            doSwap(activeDrag.srcPultId, activeDrag.srcSlotIdx, dp, ds);
          }
        }
      }
      setGhost(null);
      setActiveDrag(null);
      setPultDrag(null);
    };

    if (ghost) {
      window.addEventListener("pointermove", handleMove);
      window.addEventListener("pointerup", handleUp);
      window.addEventListener("pointercancel", handleUp);
    }
    return () => {
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerup", handleUp);
      window.removeEventListener("pointercancel", handleUp);
    };
  }, [ghost, activeDrag, doSwap]);

  return (
    <DragDropContext.Provider value={{ setGhost, setActiveDrag, pultDrag, setPultDrag, ghost, activeDrag }}>
      {children}
    </DragDropContext.Provider>
  );
};