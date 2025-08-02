import React, { useEffect, useRef, useState, useCallback, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { PerspectiveCamera, OrbitControls } from '@react-three/drei';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Car3D } from './Car3D';
import { Road3D } from './Road3D';
import { Environment3D } from './Environment3D';
import * as THREE from 'three';

export type GameMode = 'classic' | 'timeAttack' | 'quickRace' | 'endless' | 'competition';

interface GameState {
  mode: GameMode;
  score: number;
  time: number;
  speed: number;
  position: number;
  lap: number;
  isPlaying: boolean;
  isPaused: boolean;
  gameOver: boolean;
  playerX: number;
  enemies: Array<{ 
    x: number; 
    z: number; 
    speed: number; 
    lane: number; 
    color: string;
    aggressiveness?: number; // Competition mode feature
  }>;
  roadOffset: number;
  countdown: number;
  nitroBoost: number; // Competition mode feature
  health: number; // Competition mode feature
  perfectDriving: number; // Competition mode feature
  lastCollision: number;
  competitionRank: number; // Competition mode feature
}

interface RacingGame3DProps {
  mode: GameMode;
  onGameEnd: (score: number, time: number) => void;
  onBack: () => void;
}

const LANES = [-2, 0, 2];
const LANE_WIDTH = 2;
const ENEMY_COLORS = ['#ff4444', '#44ff44', '#4444ff', '#ffff44', '#ff44ff', '#44ffff'];

export const RacingGame3D: React.FC<RacingGame3DProps> = ({ mode, onGameEnd, onBack }) => {
  const gameLoopRef = useRef<number>();
  const keysRef = useRef<Set<string>>(new Set());
  const cameraRef = useRef<THREE.PerspectiveCamera>(null);
  
  const [gameState, setGameState] = useState<GameState>({
    mode,
    score: 0,
    time: 0,
    speed: 5,
    position: 0,
    lap: 1,
    isPlaying: false,
    isPaused: false,
    gameOver: false,
    playerX: 0,
    enemies: [],
    roadOffset: 0,
    countdown: 3,
    nitroBoost: 100,
    health: 100,
    perfectDriving: 0,
    lastCollision: 0,
    competitionRank: 1,
  });

  // Game mode configurations
  const getModeConfig = useCallback((mode: GameMode) => {
    switch (mode) {
      case 'timeAttack':
        return { 
          timeLimit: 60, 
          targetScore: 10000, 
          enemies: 8, 
          maxSpeed: 15,
          hasNitro: false,
          hasHealth: false,
          aggressiveAI: false
        };
      case 'quickRace':
        return { 
          timeLimit: 30, 
          targetScore: 5000, 
          enemies: 6, 
          maxSpeed: 12,
          hasNitro: false,
          hasHealth: false,
          aggressiveAI: false
        };
      case 'competition':
        return { 
          timeLimit: 120, 
          targetScore: 25000, 
          enemies: 15, 
          maxSpeed: 20,
          hasNitro: true,
          hasHealth: true,
          aggressiveAI: true
        };
      case 'endless':
        return { 
          timeLimit: Infinity, 
          targetScore: Infinity, 
          enemies: 10, 
          maxSpeed: 18,
          hasNitro: false,
          hasHealth: false,
          aggressiveAI: false
        };
      default: // classic
        return { 
          timeLimit: 90, 
          targetScore: 15000, 
          enemies: 8, 
          maxSpeed: 15,
          hasNitro: false,
          hasHealth: false,
          aggressiveAI: false
        };
    }
  }, []);

  // Initialize game
  const initGame = useCallback(() => {
    const config = getModeConfig(mode);
    setGameState(prev => ({
      ...prev,
      score: 0,
      time: 0,
      speed: 5,
      position: 0,
      lap: 1,
      isPlaying: false,
      isPaused: false,
      gameOver: false,
      playerX: 0,
      enemies: Array.from({ length: config.enemies }, (_, i) => ({
        x: LANES[Math.floor(Math.random() * LANES.length)],
        z: -i * 3 - 5,
        speed: 3 + Math.random() * 2,
        lane: Math.floor(Math.random() * LANES.length),
        color: ENEMY_COLORS[Math.floor(Math.random() * ENEMY_COLORS.length)],
        aggressiveness: config.aggressiveAI ? Math.random() * 0.5 + 0.5 : 0.2,
      })),
      roadOffset: 0,
      countdown: 3,
      nitroBoost: 100,
      health: 100,
      perfectDriving: 0,
      lastCollision: 0,
      competitionRank: 1,
    }));
  }, [mode, getModeConfig]);

  // Start countdown
  const startCountdown = useCallback(() => {
    let count = 3;
    const countdownInterval = setInterval(() => {
      setGameState(prev => ({ ...prev, countdown: count }));
      count--;
      if (count < 0) {
        clearInterval(countdownInterval);
        setGameState(prev => ({ ...prev, isPlaying: true, countdown: 0 }));
      }
    }, 1000);
  }, []);

  // Input handling
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keysRef.current.add(e.code);
      if (e.code === 'Space') {
        e.preventDefault();
        if (!gameState.isPlaying && !gameState.gameOver) {
          startCountdown();
        } else if (gameState.isPlaying) {
          setGameState(prev => ({ ...prev, isPaused: !prev.isPaused }));
        }
      }
      if (e.code === 'Escape') {
        onBack();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysRef.current.delete(e.code);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [gameState.isPlaying, gameState.gameOver, startCountdown, onBack]);

  // Game loop
  useEffect(() => {
    if (!gameState.isPlaying || gameState.isPaused) return;

    const gameLoop = () => {
      setGameState(prev => {
        const config = getModeConfig(prev.mode);
        let newState = { ...prev };

        // Update time
        newState.time += 1/60;

        // Handle input
        let newPlayerX = prev.playerX;
        let newSpeed = prev.speed;
        let usedNitro = false;

        if (keysRef.current.has('ArrowLeft') && newPlayerX > -4) {
          newPlayerX -= 0.1;
        }
        if (keysRef.current.has('ArrowRight') && newPlayerX < 4) {
          newPlayerX += 0.1;
        }
        if (keysRef.current.has('ArrowUp')) {
          newSpeed = Math.min(newSpeed + 0.3, config.maxSpeed);
        } else if (keysRef.current.has('ArrowDown')) {
          newSpeed = Math.max(newSpeed - 0.5, 2);
        } else {
          newSpeed = Math.max(newSpeed - 0.1, 5);
        }

        // Nitro boost (Competition mode)
        if (config.hasNitro && keysRef.current.has('ShiftLeft') && prev.nitroBoost > 0) {
          newSpeed = Math.min(newSpeed + 0.8, config.maxSpeed + 5);
          newState.nitroBoost = Math.max(prev.nitroBoost - 0.5, 0);
          usedNitro = true;
        } else if (config.hasNitro && !usedNitro) {
          newState.nitroBoost = Math.min(prev.nitroBoost + 0.1, 100);
        }

        newState.playerX = newPlayerX;
        newState.speed = newSpeed;
        newState.position += newSpeed;
        newState.roadOffset = (newState.roadOffset + newSpeed) % 10;

        // Update perfect driving score
        if (Math.abs(newPlayerX) < 1 && newSpeed > config.maxSpeed * 0.8) {
          newState.perfectDriving += 1;
        }

        // Update enemies with AI
        newState.enemies = prev.enemies.map((enemy, index) => {
          let newZ = enemy.z + enemy.speed;
          let newX = enemy.x;
          let newLane = enemy.lane;

          // Respawn enemy if too far ahead
          if (newZ > 15) {
            newZ = -20 - Math.random() * 10;
            newLane = Math.floor(Math.random() * LANES.length);
            newX = LANES[newLane];
            return {
              ...enemy,
              x: newX,
              z: newZ,
              lane: newLane,
              speed: 3 + Math.random() * 3,
              color: ENEMY_COLORS[Math.floor(Math.random() * ENEMY_COLORS.length)],
            };
          }

          // Competition mode: Aggressive AI
          if (config.aggressiveAI && enemy.aggressiveness) {
            const distanceToPlayer = Math.abs(newZ - 0);
            if (distanceToPlayer < 5 && Math.random() < enemy.aggressiveness * 0.1) {
              // Try to block player
              const playerLane = Math.round((newPlayerX + 2) / 2);
              if (Math.abs(enemy.lane - playerLane) === 1) {
                newLane = playerLane;
                newX = LANES[newLane];
              }
            }
          }

          return { ...enemy, x: newX, z: newZ, lane: newLane };
        });

        // Collision detection
        const playerRect = {
          x: newPlayerX - 0.4,
          z: -0.8,
          width: 0.8,
          height: 1.6,
        };

        let collisionDetected = false;
        for (const enemy of newState.enemies) {
          const enemyRect = {
            x: enemy.x - 0.4,
            z: enemy.z - 0.8,
            width: 0.8,
            height: 1.6,
          };

          if (
            playerRect.x < enemyRect.x + enemyRect.width &&
            playerRect.x + playerRect.width > enemyRect.x &&
            playerRect.z < enemyRect.z + enemyRect.height &&
            playerRect.z + playerRect.height > enemyRect.z
          ) {
            collisionDetected = true;
            break;
          }
        }

        if (collisionDetected) {
          newState.lastCollision = newState.time;
          
          if (config.hasHealth) {
            // Competition mode: Health system
            newState.health = Math.max(prev.health - 10, 0);
            if (newState.health <= 0) {
              newState.gameOver = true;
              newState.isPlaying = false;
            }
          } else {
            // Other modes: Instant game over
            newState.gameOver = true;
            newState.isPlaying = false;
          }
        }

        // Update score with bonuses
        let scoreMultiplier = 1;
        if (config.hasNitro && usedNitro) scoreMultiplier += 0.5;
        if (newState.perfectDriving > 60) scoreMultiplier += 0.3; // Perfect driving bonus
        if (newSpeed > config.maxSpeed * 0.9) scoreMultiplier += 0.2; // High speed bonus

        newState.score += newSpeed * 10 * scoreMultiplier;

        // Competition mode: Calculate rank
        if (config.aggressiveAI) {
          const playerProgress = newState.position;
          let rank = 1;
          newState.enemies.forEach(enemy => {
            if (enemy.z > 0) rank++;
          });
          newState.competitionRank = Math.min(rank, config.enemies + 1);
        }

        // Check game end conditions
        if (config.timeLimit !== Infinity && newState.time >= config.timeLimit) {
          newState.gameOver = true;
          newState.isPlaying = false;
        }

        if (newState.gameOver) {
          onGameEnd(newState.score, newState.time);
        }

        return newState;
      });

      gameLoopRef.current = requestAnimationFrame(gameLoop);
    };

    gameLoopRef.current = requestAnimationFrame(gameLoop);

    return () => {
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current);
      }
    };
  }, [gameState.isPlaying, gameState.isPaused, getModeConfig, onGameEnd]);

  useEffect(() => {
    initGame();
  }, [initGame]);

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    const milliseconds = Math.floor((time % 1) * 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}.${milliseconds.toString().padStart(3, '0')}`;
  };

  const config = getModeConfig(gameState.mode);

  return (
    <div className="min-h-screen bg-game-dark-bg flex flex-col">
      {/* Top HUD */}
      <div className="p-4 flex justify-between items-center">
        <Button 
          onClick={onBack}
          variant="outline"
          className="border-game-neon-blue text-game-neon-blue hover:bg-game-neon-blue hover:text-primary-foreground"
        >
          ← Back
        </Button>
        
        <Badge 
          variant="outline" 
          className="border-game-neon-pink text-game-neon-pink text-lg px-4 py-2"
        >
          {mode.charAt(0).toUpperCase() + mode.slice(1)} Mode
        </Badge>

        <div className="text-right">
          <div className="text-game-neon-green font-bold">Speed: {Math.floor(gameState.speed * 10)} mph</div>
          {config.aggressiveAI && (
            <div className="text-game-neon-yellow font-bold">Rank: #{gameState.competitionRank}</div>
          )}
        </div>
      </div>

      {/* Game Stats */}
      <div className="px-4 mb-4">
        <Card className="bg-card/90 backdrop-blur-sm border-border/50 p-4">
          <div className="grid grid-cols-4 gap-4 text-center mb-4">
            <div>
              <div className="text-game-neon-blue font-bold">Score</div>
              <div className="text-xl font-mono text-foreground">{Math.floor(gameState.score)}</div>
            </div>
            <div>
              <div className="text-game-neon-green font-bold">Time</div>
              <div className="text-xl font-mono text-foreground">{formatTime(gameState.time)}</div>
            </div>
            <div>
              <div className="text-game-neon-yellow font-bold">Distance</div>
              <div className="text-xl font-mono text-foreground">{Math.floor(gameState.position / 10)} m</div>
            </div>
            <div>
              <div className="text-game-neon-pink font-bold">Perfect</div>
              <div className="text-xl font-mono text-foreground">{Math.floor(gameState.perfectDriving / 60)}s</div>
            </div>
          </div>

          {/* Competition Mode Features */}
          {config.hasNitro && (
            <div className="mb-2">
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm text-game-neon-blue">Nitro Boost</span>
                <span className="text-sm text-foreground">{Math.floor(gameState.nitroBoost)}%</span>
              </div>
              <Progress value={gameState.nitroBoost} className="h-2" />
            </div>
          )}

          {config.hasHealth && (
            <div className="mb-2">
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm text-game-racing-red">Health</span>
                <span className="text-sm text-foreground">{Math.floor(gameState.health)}%</span>
              </div>
              <Progress 
                value={gameState.health} 
                className="h-2"
                // @ts-ignore
                style={{ '--progress-color': gameState.health > 30 ? '#22c55e' : '#ef4444' }}
              />
            </div>
          )}
        </Card>
      </div>

      {/* 3D Game View */}
      <div className="flex-1 relative">
        <Canvas
          camera={{ position: [0, 3, 5], fov: 75 }}
          style={{ width: '100%', height: '100%' }}
        >
          <Suspense fallback={null}>
            {/* Lighting */}
            <ambientLight intensity={0.6} />
            <directionalLight position={[10, 10, 5]} intensity={1} />
            <directionalLight position={[-10, 10, 5]} intensity={0.5} />

            {/* Camera */}
            <PerspectiveCamera 
              ref={cameraRef}
              makeDefault 
              position={[gameState.playerX * 0.3, 2, 3]} 
              fov={75}
            />

            {/* Game Environment */}
            <Road3D speed={gameState.speed} />
            <Environment3D speed={gameState.speed} />

            {/* Player Car */}
            <Car3D
              position={[gameState.playerX, 0, 0]}
              color="#ff0000"
              isPlayer={true}
              speed={gameState.speed}
            />

            {/* Enemy Cars */}
            {gameState.enemies.map((enemy, index) => (
              <Car3D
                key={index}
                position={[enemy.x, 0, enemy.z]}
                color={enemy.color}
                isPlayer={false}
                speed={enemy.speed}
              />
            ))}

            {/* Fog for depth */}
            <fog attach="fog" args={['#1a1a2e', 10, 50]} />
          </Suspense>
        </Canvas>

        {/* Game Overlays */}
        {gameState.countdown > 0 && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50">
            <div className="text-center">
              <div className="text-8xl font-bold text-game-neon-yellow animate-neon-pulse">
                {gameState.countdown}
              </div>
              <div className="text-2xl text-game-neon-pink mt-4">Get Ready!</div>
            </div>
          </div>
        )}

        {!gameState.isPlaying && !gameState.gameOver && gameState.countdown === 0 && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50">
            <div className="text-center">
              <div className="text-game-neon-blue text-3xl font-bold mb-4 animate-neon-pulse">
                Press SPACE to Start
              </div>
              <div className="text-game-neon-pink text-lg mb-4">
                Use arrow keys to control your car
              </div>
              {config.hasNitro && (
                <div className="text-game-neon-yellow text-lg">
                  Hold SHIFT for Nitro Boost!
                </div>
              )}
            </div>
          </div>
        )}

        {gameState.isPaused && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/70">
            <div className="text-center">
              <div className="text-game-neon-yellow text-4xl font-bold mb-4">PAUSED</div>
              <div className="text-game-neon-pink text-lg">Press SPACE to resume</div>
            </div>
          </div>
        )}

        {gameState.gameOver && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/80">
            <Card className="bg-card p-8 text-center">
              <h2 className="text-3xl font-bold text-game-racing-red mb-4">GAME OVER</h2>
              <div className="space-y-2 mb-6">
                <div className="text-xl">Final Score: <span className="text-game-neon-blue font-bold">{Math.floor(gameState.score)}</span></div>
                <div className="text-xl">Time Survived: <span className="text-game-neon-green font-bold">{formatTime(gameState.time)}</span></div>
                {config.aggressiveAI && (
                  <div className="text-xl">Final Rank: <span className="text-game-neon-yellow font-bold">#{gameState.competitionRank}</span></div>
                )}
              </div>
              <Button onClick={onBack} className="bg-game-neon-blue hover:bg-game-neon-blue/80">
                Back to Menu
              </Button>
            </Card>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="p-4 text-center text-muted-foreground">
        <div className="flex justify-center gap-6 text-sm">
          <span>↑ Accelerate</span>
          <span>↓ Brake</span>
          <span>← → Steer</span>
          {config.hasNitro && <span className="text-game-neon-blue">SHIFT Nitro</span>}
          <span>SPACE Pause</span>
          <span>ESC Exit</span>
        </div>
      </div>
    </div>
  );
};
