import React from 'react';
import { SeatingProvider } from './hooks/useSeating';
import { DragDropProvider } from './hooks/useDragDrop';
import Header from './components/layout/Header';
import Panel from './components/layout/Panel';
import Stage from './components/stage/Stage';
import Ghost from './components/shared/Ghost';

function App() {
  return (
    <SeatingProvider>
      <DragDropProvider>
        <Header />
        <Panel />
        <Stage />
        <Ghost />
      </DragDropProvider>
    </SeatingProvider>
  );
}

export default App;