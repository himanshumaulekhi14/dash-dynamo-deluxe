import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { GameMode } from './RacingGame';

interface LeaderboardEntry {
  id: string;
  playerName: string;
  score: number;
  time: number;
  mode: GameMode;
  date: Date;
  rank: number;
}

interface LeaderboardProps {
  onBack: () => void;
}

export const Leaderboard: React.FC<LeaderboardProps> = ({ onBack }) => {
  const [leaderboardData, setLeaderboardData] = useState<{[key in GameMode]: LeaderboardEntry[]}>({
    classic: [],
    timeAttack: [],
    quickRace: [],
    endless: [],
    competition: [],
  });

  const [playerName, setPlayerName] = useState('');

  useEffect(() => {
    // Load leaderboard data from localStorage
    const loadLeaderboard = () => {
      try {
        const saved = localStorage.getItem('neonDashLeaderboard');
        if (saved) {
          const data = JSON.parse(saved);
          setLeaderboardData(data);
        }
      } catch (error) {
        console.error('Failed to load leaderboard:', error);
      }
    };

    loadLeaderboard();

    // Load player name
    const savedName = localStorage.getItem('neonDashPlayerName');
    if (savedName) {
      setPlayerName(savedName);
    }
  }, []);

  const addScore = (mode: GameMode, score: number, time: number) => {
    const newEntry: LeaderboardEntry = {
      id: Date.now().toString(),
      playerName: playerName || 'Anonymous',
      score,
      time,
      mode,
      date: new Date(),
      rank: 0,
    };

    setLeaderboardData(prev => {
      const newData = { ...prev };
      newData[mode] = [...newData[mode], newEntry]
        .sort((a, b) => b.score - a.score)
        .slice(0, 10)
        .map((entry, index) => ({ ...entry, rank: index + 1 }));

      // Save to localStorage
      try {
        localStorage.setItem('neonDashLeaderboard', JSON.stringify(newData));
      } catch (error) {
        console.error('Failed to save leaderboard:', error);
      }

      return newData;
    });
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    const milliseconds = Math.floor((time % 1) * 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}.${milliseconds.toString().padStart(3, '0')}`;
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString();
  };

  const getModeColor = (mode: GameMode) => {
    switch (mode) {
      case 'classic': return 'text-game-neon-blue';
      case 'timeAttack': return 'text-game-neon-yellow';
      case 'quickRace': return 'text-game-neon-green';
      case 'endless': return 'text-game-neon-pink';
      case 'competition': return 'text-game-racing-red';
      default: return 'text-foreground';
    }
  };

  const getModeTitle = (mode: GameMode) => {
    switch (mode) {
      case 'classic': return 'Classic Race';
      case 'timeAttack': return 'Time Attack';
      case 'quickRace': return 'Quick Race';
      case 'endless': return 'Endless Highway';
      case 'competition': return 'Competition';
      default: return mode;
    }
  };

  const getRankColor = (rank: number) => {
    switch (rank) {
      case 1: return 'text-yellow-400';
      case 2: return 'text-gray-300';
      case 3: return 'text-orange-400';
      default: return 'text-muted-foreground';
    }
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1: return '🥇';
      case 2: return '🥈';
      case 3: return '🥉';
      default: return `#${rank}`;
    }
  };

  const clearLeaderboard = () => {
    setLeaderboardData({
      classic: [],
      timeAttack: [],
      quickRace: [],
      endless: [],
      competition: [],
    });
    localStorage.removeItem('neonDashLeaderboard');
  };

  return (
    <div className="min-h-screen bg-game-dark-bg">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <Button 
            onClick={onBack}
            variant="outline"
            className="border-game-neon-blue text-game-neon-blue hover:bg-game-neon-blue hover:text-primary-foreground"
          >
            ← Back to Menu
          </Button>
          
          <h1 className="text-4xl font-bold bg-gradient-to-r from-game-neon-blue via-game-neon-pink to-game-neon-green bg-clip-text text-transparent">
            🏆 Leaderboard
          </h1>
          
          <Button 
            onClick={clearLeaderboard}
            variant="outline"
            className="border-game-racing-red text-game-racing-red hover:bg-game-racing-red hover:text-primary-foreground"
          >
            Clear All
          </Button>
        </div>

        {/* Player Name Input */}
        <Card className="bg-card/90 backdrop-blur-sm border-border/50 mb-8">
          <CardHeader>
            <CardTitle className="text-game-neon-green">Player Settings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4 items-center">
              <label className="text-muted-foreground">Player Name:</label>
              <input
                type="text"
                value={playerName}
                onChange={(e) => {
                  setPlayerName(e.target.value);
                  localStorage.setItem('neonDashPlayerName', e.target.value);
                }}
                placeholder="Enter your name"
                className="bg-background border border-border rounded px-3 py-2 text-foreground flex-1 max-w-sm"
              />
            </div>
          </CardContent>
        </Card>

        {/* Leaderboard Tabs */}
        <Tabs defaultValue="classic" className="w-full">
          <TabsList className="grid w-full grid-cols-5 mb-8">
            {Object.keys(leaderboardData).map((mode) => (
              <TabsTrigger 
                key={mode} 
                value={mode}
                className={`${getModeColor(mode as GameMode)} data-[state=active]:bg-primary/20`}
              >
                {getModeTitle(mode as GameMode)}
              </TabsTrigger>
            ))}
          </TabsList>

          {Object.entries(leaderboardData).map(([mode, entries]) => (
            <TabsContent key={mode} value={mode}>
              <Card className="bg-card/90 backdrop-blur-sm border-border/50">
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle className={`${getModeColor(mode as GameMode)} text-2xl`}>
                      {getModeTitle(mode as GameMode)} - Top 10
                    </CardTitle>
                    <Badge variant="outline" className="text-muted-foreground">
                      {entries.length} {entries.length === 1 ? 'entry' : 'entries'}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  {entries.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="text-6xl mb-4">🏁</div>
                      <div className="text-xl text-muted-foreground mb-2">No scores yet!</div>
                      <div className="text-muted-foreground">Be the first to set a record in this mode.</div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {entries.map((entry, index) => (
                        <div 
                          key={entry.id}
                          className={`flex items-center justify-between p-4 rounded-lg border transition-all duration-300 hover:scale-105 ${
                            index < 3 
                              ? 'bg-primary/10 border-primary/30' 
                              : 'bg-card border-border/50'
                          }`}
                        >
                          <div className="flex items-center gap-4">
                            <div className={`text-2xl font-bold ${getRankColor(entry.rank)}`}>
                              {getRankIcon(entry.rank)}
                            </div>
                            <div>
                              <div className="font-bold text-foreground">{entry.playerName}</div>
                              <div className="text-sm text-muted-foreground">
                                {formatDate(new Date(entry.date))}
                              </div>
                            </div>
                          </div>
                          
                          <div className="text-right">
                            <div className={`text-xl font-bold ${getModeColor(mode as GameMode)}`}>
                              {entry.score.toLocaleString()} pts
                            </div>
                            <div className="text-sm text-muted-foreground">
                              Time: {formatTime(entry.time)}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          ))}
        </Tabs>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
          <Card className="bg-card/90 backdrop-blur-sm border-border/50">
            <CardHeader>
              <CardTitle className="text-game-neon-blue">Total Games</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">
                {Object.values(leaderboardData).reduce((sum, entries) => sum + entries.length, 0)}
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-card/90 backdrop-blur-sm border-border/50">
            <CardHeader>
              <CardTitle className="text-game-neon-green">Best Score</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">
                {Math.max(
                  ...Object.values(leaderboardData).flat().map(entry => entry.score),
                  0
                ).toLocaleString()}
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-card/90 backdrop-blur-sm border-border/50">
            <CardHeader>
              <CardTitle className="text-game-neon-pink">Favorite Mode</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold text-foreground">
                {Object.entries(leaderboardData)
                  .sort((a, b) => b[1].length - a[1].length)[0]?.[0] 
                  ? getModeTitle(Object.entries(leaderboardData)
                      .sort((a, b) => b[1].length - a[1].length)[0][0] as GameMode)
                  : 'None'
                }
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};