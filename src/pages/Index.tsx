import React, { useState } from 'react';
import { GameModeSelector } from '@/components/GameModeSelector';
import { RacingGame, GameMode } from '@/components/RacingGame';
import { Leaderboard } from '@/components/Leaderboard';

type AppState = 'menu' | 'playing' | 'leaderboard';

const Index = () => {
  const [appState, setAppState] = useState<AppState>('menu');
  const [selectedMode, setSelectedMode] = useState<GameMode>('classic');

  const handleSelectMode = (mode: GameMode) => {
    setSelectedMode(mode);
    setAppState('playing');
  };

  const handleGameEnd = (score: number, time: number) => {
    // Here you could save the score to leaderboard
    // For now, we'll just return to menu
    setTimeout(() => {
      setAppState('menu');
    }, 3000);
  };

  const handleBackToMenu = () => {
    setAppState('menu');
  };

  const handleShowLeaderboard = () => {
    setAppState('leaderboard');
  };

  switch (appState) {
    case 'playing':
      return (
        <RacingGame 
          mode={selectedMode}
          onGameEnd={handleGameEnd}
          onBack={handleBackToMenu}
        />
      );
    
    case 'leaderboard':
      return (
        <Leaderboard onBack={handleBackToMenu} />
      );
    
    default:
      return (
        <GameModeSelector 
          onSelectMode={handleSelectMode}
          onShowLeaderboard={handleShowLeaderboard}
        />
      );
  }
};

export default Index;
