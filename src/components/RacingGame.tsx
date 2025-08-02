import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import racingBg from '@/assets/racing-bg.png';
import raceCar from '@/assets/race-car.png';
import enemyCars from '@/assets/enemy-cars.png';
import finishLine from '@/assets/finish-line.png';

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
  enemies: Array<{ x: number; y: number; speed: number; lane: number }>;
  roadOffset: number;
  countdown: number;
}

interface RacingGameProps {
  mode: GameMode;
  onGameEnd: (score: number, time: number) => void;
  onBack: () => void;
}

const GAME_WIDTH = 800;
const GAME_HEIGHT = 600;
const ROAD_WIDTH = 400;
const PLAYER_SPEED = 5;
const ENEMY_SPEED = 3;
const LANES = [-150, -50, 50, 150];

export const RacingGame: React.FC<RacingGameProps> = ({ mode, onGameEnd, onBack }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameLoopRef = useRef<number>();
  const keysRef = useRef<Set<string>>(new Set());
  
  const [gameState, setGameState] = useState<GameState>({
    mode,
    score: 0,
    time: 0,
    speed: 0,
    position: 0,
    lap: 1,
    isPlaying: false,
    isPaused: false,
    gameOver: false,
    playerX: 0,
    enemies: [],
    roadOffset: 0,
    countdown: 3,
  });

  const [images, setImages] = useState<{[key: string]: HTMLImageElement}>({});

  // Load images
  useEffect(() => {
    const loadImages = async () => {
      const imageUrls = {
        background: racingBg,
        playerCar: raceCar,
        enemyCar: enemyCars,
        finish: finishLine,
      };

      const loadedImages: {[key: string]: HTMLImageElement} = {};
      
      for (const [key, url] of Object.entries(imageUrls)) {
        const img = new Image();
        img.src = url;
        await new Promise((resolve) => {
          img.onload = resolve;
        });
        loadedImages[key] = img;
      }
      
      setImages(loadedImages);
    };

    loadImages();
  }, []);

  // Game mode configurations
  const getModeConfig = useCallback((mode: GameMode) => {
    switch (mode) {
      case 'timeAttack':
        return { timeLimit: 60, targetScore: 10000, enemies: 8 };
      case 'quickRace':
        return { timeLimit: 30, targetScore: 5000, enemies: 6 };
      case 'competition':
        return { timeLimit: 120, targetScore: 25000, enemies: 12 };
      case 'endless':
        return { timeLimit: Infinity, targetScore: Infinity, enemies: 10 };
      default: // classic
        return { timeLimit: 90, targetScore: 15000, enemies: 8 };
    }
  }, []);

  // Initialize game
  const initGame = useCallback(() => {
    const config = getModeConfig(mode);
    setGameState(prev => ({
      ...prev,
      score: 0,
      time: 0,
      speed: 0,
      position: 0,
      lap: 1,
      isPlaying: false,
      isPaused: false,
      gameOver: false,
      playerX: 0,
      enemies: Array.from({ length: config.enemies }, (_, i) => ({
        x: LANES[Math.floor(Math.random() * LANES.length)],
        y: -i * 150 - 100,
        speed: ENEMY_SPEED + Math.random() * 2,
        lane: Math.floor(Math.random() * LANES.length),
      })),
      roadOffset: 0,
      countdown: 3,
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

        if (keysRef.current.has('ArrowLeft') && newPlayerX > -ROAD_WIDTH/2 + 40) {
          newPlayerX -= PLAYER_SPEED;
        }
        if (keysRef.current.has('ArrowRight') && newPlayerX < ROAD_WIDTH/2 - 40) {
          newPlayerX += PLAYER_SPEED;
        }
        if (keysRef.current.has('ArrowUp')) {
          newSpeed = Math.min(newSpeed + 0.5, 15);
        } else if (keysRef.current.has('ArrowDown')) {
          newSpeed = Math.max(newSpeed - 1, 0);
        } else {
          newSpeed = Math.max(newSpeed - 0.2, 5);
        }

        newState.playerX = newPlayerX;
        newState.speed = newSpeed;
        newState.position += newSpeed;
        newState.roadOffset = (newState.roadOffset + newSpeed) % 100;

        // Update enemies
        newState.enemies = prev.enemies.map(enemy => {
          let newY = enemy.y + enemy.speed + newSpeed * 0.5;
          if (newY > GAME_HEIGHT + 100) {
            newY = -200 - Math.random() * 500;
            return {
              ...enemy,
              x: LANES[Math.floor(Math.random() * LANES.length)],
              y: newY,
              speed: ENEMY_SPEED + Math.random() * 3,
            };
          }
          return { ...enemy, y: newY };
        });

        // Collision detection
        const playerRect = {
          x: newPlayerX - 25,
          y: GAME_HEIGHT - 120,
          width: 50,
          height: 80,
        };

        for (const enemy of newState.enemies) {
          const enemyRect = {
            x: enemy.x - 25,
            y: enemy.y,
            width: 50,
            height: 80,
          };

          if (
            playerRect.x < enemyRect.x + enemyRect.width &&
            playerRect.x + playerRect.width > enemyRect.x &&
            playerRect.y < enemyRect.y + enemyRect.height &&
            playerRect.y + playerRect.height > enemyRect.y
          ) {
            // Collision detected
            newState.gameOver = true;
            newState.isPlaying = false;
          }
        }

        // Update score
        newState.score += newSpeed * 10;

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

  // Render game
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || Object.keys(images).length === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    // Draw background
    if (images.background) {
      ctx.drawImage(images.background, 0, 0, GAME_WIDTH, GAME_HEIGHT);
    }

    // Draw road
    ctx.fillStyle = '#444';
    ctx.fillRect(GAME_WIDTH/2 - ROAD_WIDTH/2, 0, ROAD_WIDTH, GAME_HEIGHT);

    // Draw road lines
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 4;
    ctx.setLineDash([20, 20]);
    for (let i = 0; i < 4; i++) {
      const x = GAME_WIDTH/2 + LANES[i];
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, GAME_HEIGHT);
      ctx.stroke();
    }

    // Draw road center lines
    ctx.strokeStyle = '#ff0';
    ctx.lineWidth = 2;
    ctx.lineDashOffset = -gameState.roadOffset;
    ctx.beginPath();
    ctx.moveTo(GAME_WIDTH/2, 0);
    ctx.lineTo(GAME_WIDTH/2, GAME_HEIGHT);
    ctx.stroke();

    // Draw enemies
    if (images.enemyCar) {
      gameState.enemies.forEach(enemy => {
        ctx.drawImage(
          images.enemyCar,
          GAME_WIDTH/2 + enemy.x - 25,
          enemy.y,
          50,
          80
        );
      });
    }

    // Draw player car
    if (images.playerCar) {
      ctx.drawImage(
        images.playerCar,
        GAME_WIDTH/2 + gameState.playerX - 25,
        GAME_HEIGHT - 120,
        50,
        80
      );
    }

    // Draw countdown
    if (gameState.countdown > 0) {
      ctx.fillStyle = '#ff0';
      ctx.font = 'bold 72px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(gameState.countdown.toString(), GAME_WIDTH/2, GAME_HEIGHT/2);
    }

    // Draw game over
    if (gameState.gameOver) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
      ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
      
      ctx.fillStyle = '#ff0';
      ctx.font = 'bold 48px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('GAME OVER', GAME_WIDTH/2, GAME_HEIGHT/2);
      
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 24px monospace';
      ctx.fillText(`Final Score: ${Math.floor(gameState.score)}`, GAME_WIDTH/2, GAME_HEIGHT/2 + 60);
    }

  }, [gameState, images]);

  useEffect(() => {
    initGame();
  }, [initGame]);

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    const milliseconds = Math.floor((time % 1) * 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}.${milliseconds.toString().padStart(3, '0')}`;
  };

  return (
    <div className="min-h-screen bg-game-dark-bg flex flex-col items-center justify-center p-4">
      <div className="mb-4 flex gap-4 items-center">
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
      </div>

      <Card className="bg-card/90 backdrop-blur-sm border-border/50 p-6 mb-4">
        <div className="grid grid-cols-4 gap-6 text-center">
          <div>
            <div className="text-game-neon-blue font-bold text-lg">Score</div>
            <div className="text-2xl font-mono text-foreground">{Math.floor(gameState.score)}</div>
          </div>
          <div>
            <div className="text-game-neon-green font-bold text-lg">Time</div>
            <div className="text-2xl font-mono text-foreground">{formatTime(gameState.time)}</div>
          </div>
          <div>
            <div className="text-game-neon-yellow font-bold text-lg">Speed</div>
            <div className="text-2xl font-mono text-foreground">{Math.floor(gameState.speed * 10)} mph</div>
          </div>
          <div>
            <div className="text-game-racing-red font-bold text-lg">Distance</div>
            <div className="text-2xl font-mono text-foreground">{Math.floor(gameState.position / 10)} m</div>
          </div>
        </div>
      </Card>

      <div className="relative mb-4">
        <canvas
          ref={canvasRef}
          width={GAME_WIDTH}
          height={GAME_HEIGHT}
          className="border-2 border-game-neon-blue rounded-lg shadow-lg"
          style={{ 
            background: 'linear-gradient(180deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
            boxShadow: '0 0 30px rgba(0, 255, 255, 0.3)'
          }}
        />
        
        {!gameState.isPlaying && !gameState.gameOver && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-lg">
            <div className="text-center">
              <div className="text-game-neon-blue text-2xl font-bold mb-4 animate-neon-pulse">
                Press SPACE to Start
              </div>
              <div className="text-game-neon-pink text-lg">
                Use arrow keys to control your car
              </div>
            </div>
          </div>
        )}
        
        {gameState.isPaused && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/70 rounded-lg">
            <div className="text-center">
              <div className="text-game-neon-yellow text-3xl font-bold mb-4">PAUSED</div>
              <div className="text-game-neon-pink text-lg">Press SPACE to resume</div>
            </div>
          </div>
        )}
      </div>

      <div className="text-center text-muted-foreground">
        <div className="flex gap-6 text-sm">
          <span>↑ Accelerate</span>
          <span>↓ Brake</span>
          <span>← → Steer</span>
          <span>SPACE Pause</span>
          <span>ESC Exit</span>
        </div>
      </div>
    </div>
  );
};