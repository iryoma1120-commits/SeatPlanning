import React, { useState } from 'react';
import { AuthProvider } from './hooks/useAuth';
import { SeatingProvider } from './hooks/useSeating';
import { DragDropProvider } from './hooks/useDragDrop';
import Header from './components/layout/Header';
import Panel from './components/layout/Panel';
import Stage from './components/stage/Stage';
import Ghost from './components/shared/Ghost';
import MemberManagerView from './components/members/MemberManagerView';
import AuthModal from './components/modal/AuthModal';

function MainLayout() {
  const [activeTab, setActiveTab] = useState('seating'); // 'seating' | 'members'
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  return (
    <>
      <Header 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        onOpenAuth={() => setIsAuthModalOpen(true)}
      />
      
      {activeTab === 'seating' ? (
        <main>
          <Panel onSwitchToMembers={() => setActiveTab('members')} />
          <Stage onSwitchToMembers={() => setActiveTab('members')} />
          <Ghost />
        </main>
      ) : (
        <main>
          <MemberManagerView onOpenAuth={() => setIsAuthModalOpen(true)} />
        </main>
      )}

      <AuthModal 
        isOpen={isAuthModalOpen} 
        onClose={() => setIsAuthModalOpen(false)} 
      />
    </>
  );
}

function App() {
  return (
    <AuthProvider>
      <SeatingProvider>
        <DragDropProvider>
          <MainLayout />
        </DragDropProvider>
      </SeatingProvider>
    </AuthProvider>
  );
}

export default App;