import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { GameMode } from './RacingGame';

interface GameModeInfo {
  mode: GameMode;
  title: string;
  description: string;
  timeLimit: string;
  difficulty: 'Easy' | 'Medium' | 'Hard' | 'Insane';
  features: string[];
  color: string;
}

const gameModes: GameModeInfo[] = [
  {
    mode: 'classic',
    title: 'Classic Race',
    description: 'The original racing experience with balanced difficulty.',
    timeLimit: '90 seconds',
    difficulty: 'Medium',
    features: ['Standard AI cars', 'Progressive difficulty', 'Classic scoring'],
    color: 'game-neon-blue',
  },
  {
    mode: 'timeAttack',
    title: 'Time Attack',
    description: 'Race against the clock to achieve the highest score.',
    timeLimit: '60 seconds',
    difficulty: 'Hard',
    features: ['Fast-paced action', 'Score multipliers', 'Precision driving'],
    color: 'game-neon-yellow',
  },
  {
    mode: 'quickRace',
    title: 'Quick Race',
    description: 'Short and intense racing session for quick thrills.',
    timeLimit: '30 seconds',
    difficulty: 'Easy',
    features: ['Quick gameplay', 'Beginner friendly', 'Instant action'],
    color: 'game-neon-green',
  },
  {
    mode: 'endless',
    title: 'Endless Highway',
    description: 'Drive as far as you can on an infinite highway.',
    timeLimit: 'Unlimited',
    difficulty: 'Medium',
    features: ['Endless gameplay', 'Increasing difficulty', 'Survival mode'],
    color: 'game-neon-pink',
  },
  {
    mode: 'competition',
    title: 'Competition Mode',
    description: 'The ultimate challenge for racing masters.',
    timeLimit: '2 minutes',
    difficulty: 'Insane',
    features: ['Maximum AI cars', 'Extreme difficulty', 'Championship scoring'],
    color: 'game-racing-red',
  },
];

interface GameModeSelectorProps {
  onSelectMode: (mode: GameMode) => void;
  onShowLeaderboard: () => void;
}

export const GameModeSelector: React.FC<GameModeSelectorProps> = ({ 
  onSelectMode, 
  onShowLeaderboard 
}) => {
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Easy': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'Medium': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'Hard': return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      case 'Insane': return 'bg-red-500/20 text-red-400 border-red-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  return (
    <div className="min-h-screen bg-game-dark-bg relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-10 left-10 w-32 h-32 border-2 border-game-neon-blue rounded-full animate-pulse"></div>
        <div className="absolute top-32 right-20 w-24 h-24 border-2 border-game-neon-pink rounded-full animate-pulse delay-1000"></div>
        <div className="absolute bottom-20 left-32 w-40 h-40 border-2 border-game-neon-green rounded-full animate-pulse delay-2000"></div>
        <div className="absolute bottom-40 right-10 w-28 h-28 border-2 border-game-neon-yellow rounded-full animate-pulse delay-500"></div>
      </div>

      <div className="relative z-10 container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-6xl font-bold mb-4 bg-gradient-to-r from-game-neon-blue via-game-neon-pink to-game-neon-green bg-clip-text text-transparent animate-neon-pulse">
            NEON DASH
          </h1>
          <p className="text-xl text-muted-foreground mb-8">
            Choose your racing experience and hit the neon highway
          </p>
          
          <div className="flex gap-4 justify-center">
            <Button 
              onClick={onShowLeaderboard}
              variant="outline"
              className="border-game-neon-blue text-game-neon-blue hover:bg-game-neon-blue hover:text-primary-foreground"
            >
              🏆 Leaderboard
            </Button>
            <Button 
              variant="outline"
              className="border-game-neon-pink text-game-neon-pink hover:bg-game-neon-pink hover:text-primary-foreground"
            >
              ⚙️ Settings
            </Button>
          </div>
        </div>

        {/* Game Modes Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {gameModes.map((gameMode) => (
            <Card 
              key={gameMode.mode}
              className="bg-card/90 backdrop-blur-sm border-border/50 hover:border-game-neon-blue/50 transition-all duration-300 group cursor-pointer transform hover:scale-105"
              onClick={() => onSelectMode(gameMode.mode)}
            >
              <CardHeader className="pb-4">
                <div className="flex justify-between items-start mb-2">
                  <CardTitle className={`text-xl font-bold text-${gameMode.color} group-hover:animate-neon-pulse`}>
                    {gameMode.title}
                  </CardTitle>
                  <Badge 
                    variant="outline" 
                    className={getDifficultyColor(gameMode.difficulty)}
                  >
                    {gameMode.difficulty}
                  </Badge>
                </div>
                <CardDescription className="text-muted-foreground">
                  {gameMode.description}
                </CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-muted-foreground">Time Limit:</span>
                  <span className={`text-sm font-bold text-${gameMode.color}`}>
                    {gameMode.timeLimit}
                  </span>
                </div>
                
                <div className="space-y-2">
                  <span className="text-sm font-medium text-muted-foreground">Features:</span>
                  <ul className="space-y-1">
                    {gameMode.features.map((feature, index) => (
                      <li key={index} className="text-sm text-foreground flex items-center">
                        <span className={`w-2 h-2 rounded-full bg-${gameMode.color} mr-2`}></span>
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
                
                <Button 
                  className={`w-full bg-${gameMode.color}/20 hover:bg-${gameMode.color} text-${gameMode.color} hover:text-primary-foreground border border-${gameMode.color}/30 hover:border-${gameMode.color} transition-all duration-300`}
                  onClick={() => onSelectMode(gameMode.mode)}
                >
                  Start Race →
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Instructions */}
        <Card className="bg-card/80 backdrop-blur-sm border-border/50 max-w-4xl mx-auto">
          <CardHeader>
            <CardTitle className="text-center text-game-neon-blue">How to Play</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-bold text-game-neon-green mb-3">Controls</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Steer:</span>
                    <span className="font-mono text-foreground">← → Arrow Keys</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Accelerate:</span>
                    <span className="font-mono text-foreground">↑ Arrow Key</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Brake:</span>
                    <span className="font-mono text-foreground">↓ Arrow Key</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Pause:</span>
                    <span className="font-mono text-foreground">SPACE</span>
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="font-bold text-game-neon-pink mb-3">Objective</h4>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <p>• Avoid colliding with other cars</p>
                  <p>• Maintain high speed for maximum score</p>
                  <p>• Stay on the road for bonus points</p>
                  <p>• Survive as long as possible</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};