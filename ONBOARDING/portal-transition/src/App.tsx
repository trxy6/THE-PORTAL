import React, { useState } from 'react';
import { PortalState, PORTAL_THEMES, PortalTheme } from './types';
import PortalLobby from './components/PortalLobby';
import PortalWalkthrough from './components/PortalWalkthrough';
import PortalDestination from './components/PortalDestination';

export default function App() {
  const [activeTheme, setActiveTheme] = useState<PortalTheme>(PORTAL_THEMES[0]);
  const [currentState, setCurrentState] = useState<PortalState>('LOBBY');

  const handleThemeSelect = (theme: PortalTheme) => {
    setActiveTheme(theme);
  };

  const handleActivatePortal = () => {
    setCurrentState('WALKTHROUGH');
  };

  const handleWalkthroughComplete = () => {
    setCurrentState('DESTINATION');
  };

  const handleResetPortal = () => {
    setCurrentState('LOBBY');
  };

  return (
    <main className="w-full min-h-screen bg-black font-sans selection:bg-purple-500/30 selection:text-white">
      {currentState === 'LOBBY' && (
        <PortalLobby
          activeTheme={activeTheme}
          themes={PORTAL_THEMES}
          onThemeSelect={handleThemeSelect}
          onActivatePortal={handleActivatePortal}
        />
      )}

      {currentState === 'WALKTHROUGH' && (
        <PortalWalkthrough
          activeTheme={activeTheme}
          onComplete={handleWalkthroughComplete}
        />
      )}

      {currentState === 'DESTINATION' && (
        <PortalDestination
          activeTheme={activeTheme}
          onReset={handleResetPortal}
        />
      )}
    </main>
  );
}
