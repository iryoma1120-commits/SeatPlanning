import React from 'react';
import { useDragDropContext } from '../../hooks/useDragDrop';

export default function Ghost() {
  const { ghost } = useDragDropContext();
  if (!ghost) return null;

  return (
    <div id="sg" style={{ display: 'block', width: ghost.width, left: ghost.x - ghost.width / 2, top: ghost.y - 18 }}
         dangerouslySetInnerHTML={{ __html: ghost.html }}>
    </div>
  );
}