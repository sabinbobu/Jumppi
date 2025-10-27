import { useEffect, useRef, useState, useCallback } from "react";
import { Button } from "./ui/button";
import { Pause, Play, ChevronLeft, ChevronRight, ArrowUp } from "lucide-react";

interface Platform {
  x: number;
  y: number;
  width: number;
  type: "normal" | "breaking" | "spring";
  broken?: boolean;
}

interface Enemy {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface Obstacle {
  x: number;
  y: number;
  size: number;
  type: "blackhole";
}

interface Bullet {
  x: number;
  y: number;
  velocityY: number;
}

interface Player {
  x: number;
  y: number;
  velocityX: number;
  velocityY: number;
  width: number;
  height: number;
}

export const GameCanvas = ({ 
  onGameOver, 
  onScoreUpdate 
}: { 
  onGameOver: (score: number) => void;
  onScoreUpdate: (score: number) => void;
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [score, setScore] = useState(0);
  const [currentStage, setCurrentStage] = useState(1);
  const gameStateRef = useRef({
    player: { x: 200, y: 400, velocityX: 0, velocityY: 0, width: 40, height: 50 } as Player,
    platforms: [] as Platform[],
    enemies: [] as Enemy[],
    obstacles: [] as Obstacle[],
    bullets: [] as Bullet[],
    cameraY: 0,
    isGameOver: false,
    keys: { left: false, right: false },
  });

  const CANVAS_WIDTH = 400;
  const CANVAS_HEIGHT = 600;
  const GRAVITY = 0.4;
  const JUMP_STRENGTH = -12;
  const MOVE_SPEED = 5;
  const PLATFORM_WIDTH = 80;
  const PLATFORM_HEIGHT = 15;

  const getStageFromScore = useCallback((score: number) => {
    if (score < 100) return 1;
    if (score < 300) return 2;
    if (score < 500) return 3;
    if (score < 1000) return 4;
    return 5;
  }, []);

  const getStageDifficulty = useCallback((stage: number) => {
    switch (stage) {
      case 1:
        return { minGap: 50, maxGap: 100, platformCount: 8, description: "Easy" };
      case 2:
        return { minGap: 70, maxGap: 130, platformCount: 6, description: "Medium" };
      case 3:
        return { minGap: 90, maxGap: 160, platformCount: 5, description: "Hard" };
      case 4:
        return { minGap: 110, maxGap: 190, platformCount: 4, description: "Expert" };
      default:
        return { minGap: 130, maxGap: 220, platformCount: 3, description: "Master" };
    }
  }, []);

  const generatePlatforms = useCallback((startY: number, stage: number) => {
    const difficulty = getStageDifficulty(stage);
    const platforms: Platform[] = [];
    let lastY = startY;

    for (let i = 0; i < difficulty.platformCount; i++) {
      const x = Math.random() * (CANVAS_WIDTH - PLATFORM_WIDTH);
      const gap = Math.random() * (difficulty.maxGap - difficulty.minGap) + difficulty.minGap;
      lastY -= gap;
      
      let type: "normal" | "breaking" | "spring" = "normal";
      const rand = Math.random();
      if (rand > 0.85) type = "spring";
      else if (rand > 0.7) type = "breaking";

      platforms.push({ x, y: lastY, width: PLATFORM_WIDTH, type });
    }
    return platforms;
  }, [getStageDifficulty]);

  const generateInitialPlatforms = useCallback(() => {
    const platforms: Platform[] = [];
    
    // Starting platform directly under player
    platforms.push({ 
      x: 180, 
      y: CANVAS_HEIGHT - 80, 
      width: PLATFORM_WIDTH, 
      type: "normal" 
    });

    // First jump - 3 easy platforms
    const firstJumpY = CANVAS_HEIGHT - 200;
    platforms.push({ x: 80, y: firstJumpY, width: PLATFORM_WIDTH, type: "normal" });
    platforms.push({ x: 200, y: firstJumpY - 20, width: PLATFORM_WIDTH, type: "normal" });
    platforms.push({ x: 320, y: firstJumpY, width: PLATFORM_WIDTH, type: "normal" });

    // Second jump - 3 easy platforms
    const secondJumpY = CANVAS_HEIGHT - 320;
    platforms.push({ x: 60, y: secondJumpY, width: PLATFORM_WIDTH, type: "normal" });
    platforms.push({ x: 180, y: secondJumpY - 20, width: PLATFORM_WIDTH, type: "normal" });
    platforms.push({ x: 300, y: secondJumpY, width: PLATFORM_WIDTH, type: "normal" });

    // Third jump - 3 easy platforms
    const thirdJumpY = CANVAS_HEIGHT - 440;
    platforms.push({ x: 100, y: thirdJumpY, width: PLATFORM_WIDTH, type: "normal" });
    platforms.push({ x: 220, y: thirdJumpY - 20, width: PLATFORM_WIDTH, type: "normal" });
    platforms.push({ x: 340, y: thirdJumpY, width: PLATFORM_WIDTH, type: "normal" });

    // Continue with normal generation from there (Stage 1 difficulty)
    const additionalPlatforms = generatePlatforms(thirdJumpY - 60, 1);
    platforms.push(...additionalPlatforms);

    return platforms;
  }, [generatePlatforms]);

  const generateEnemy = useCallback((y: number) => {
    if (Math.random() > 0.8) {
      return {
        x: Math.random() * (CANVAS_WIDTH - 40),
        y: y - 100,
        width: 50,
        height: 50,
      };
    }
    return null;
  }, []);

  const generateObstacle = useCallback((y: number) => {
    if (Math.random() > 0.9) {
      return {
        x: Math.random() * (CANVAS_WIDTH - 60),
        y: y - 100,
        size: 60,
        type: "blackhole" as const,
      };
    }
    return null;
  }, []);

  useEffect(() => {
    gameStateRef.current.platforms = generateInitialPlatforms();
  }, [generateInitialPlatforms]);

  const drawPlayer = useCallback((ctx: CanvasRenderingContext2D, player: Player, cameraY: number) => {
    const drawY = player.y - cameraY;
    
    // Body (yellow-green doodle character)
    ctx.fillStyle = "#D4DB5C";
    ctx.strokeStyle = "#000";
    ctx.lineWidth = 2;
    
    ctx.beginPath();
    ctx.arc(player.x + player.width / 2, drawY + 15, 15, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Nose/trunk
    ctx.fillStyle = "#D4DB5C";
    ctx.beginPath();
    ctx.arc(player.x + player.width / 2 + 15, drawY + 15, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Eyes
    ctx.fillStyle = "#000";
    ctx.beginPath();
    ctx.arc(player.x + player.width / 2 - 5, drawY + 12, 3, 0, Math.PI * 2);
    ctx.arc(player.x + player.width / 2 + 5, drawY + 12, 3, 0, Math.PI * 2);
    ctx.fill();

    // Legs (simple lines)
    ctx.strokeStyle = "#000";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(player.x + player.width / 2 - 8, drawY + 28);
    ctx.lineTo(player.x + player.width / 2 - 8, drawY + 40);
    ctx.moveTo(player.x + player.width / 2 + 8, drawY + 28);
    ctx.lineTo(player.x + player.width / 2 + 8, drawY + 40);
    ctx.stroke();
  }, []);

  const drawPlatform = useCallback((ctx: CanvasRenderingContext2D, platform: Platform, cameraY: number) => {
    const drawY = platform.y - cameraY;
    
    if (platform.type === "normal") {
      ctx.fillStyle = "#8FBC3F";
    } else if (platform.type === "breaking") {
      ctx.fillStyle = platform.broken ? "#6B4423" : "#8B5A3C";
    } else {
      ctx.fillStyle = "#8FBC3F";
    }
    
    ctx.strokeStyle = "#000";
    ctx.lineWidth = 2;
    
    // Draw rounded platform
    ctx.beginPath();
    ctx.ellipse(
      platform.x + platform.width / 2,
      drawY + PLATFORM_HEIGHT / 2,
      platform.width / 2,
      PLATFORM_HEIGHT / 2,
      0,
      0,
      Math.PI * 2
    );
    ctx.fill();
    ctx.stroke();

    // Spring indicator
    if (platform.type === "spring") {
      ctx.strokeStyle = "#F4A460";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(platform.x + platform.width / 2 - 10, drawY);
      ctx.lineTo(platform.x + platform.width / 2, drawY - 10);
      ctx.lineTo(platform.x + platform.width / 2 + 10, drawY);
      ctx.stroke();
    }
  }, []);

  const drawEnemy = useCallback((ctx: CanvasRenderingContext2D, enemy: Enemy, cameraY: number) => {
    const drawY = enemy.y - cameraY;
    
    // Blue flying enemy
    ctx.fillStyle = "#4A90E2";
    ctx.strokeStyle = "#000";
    ctx.lineWidth = 2;
    
    // Body
    ctx.beginPath();
    ctx.arc(enemy.x + enemy.width / 2, drawY + enemy.height / 2, 18, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Wings
    ctx.fillStyle = "#4A90E2";
    ctx.beginPath();
    ctx.ellipse(enemy.x + 5, drawY + enemy.height / 2, 15, 8, -0.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    
    ctx.beginPath();
    ctx.ellipse(enemy.x + enemy.width - 5, drawY + enemy.height / 2, 15, 8, 0.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Eyes
    ctx.fillStyle = "#FFD700";
    ctx.beginPath();
    ctx.arc(enemy.x + enemy.width / 2 - 6, drawY + enemy.height / 2 - 3, 5, 0, Math.PI * 2);
    ctx.arc(enemy.x + enemy.width / 2 + 6, drawY + enemy.height / 2 - 3, 5, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.fillStyle = "#000";
    ctx.beginPath();
    ctx.arc(enemy.x + enemy.width / 2 - 6, drawY + enemy.height / 2 - 3, 3, 0, Math.PI * 2);
    ctx.arc(enemy.x + enemy.width / 2 + 6, drawY + enemy.height / 2 - 3, 3, 0, Math.PI * 2);
    ctx.fill();
  }, []);

  const drawObstacle = useCallback((ctx: CanvasRenderingContext2D, obstacle: Obstacle, cameraY: number) => {
    const drawY = obstacle.y - cameraY;
    
    // Black hole
    const gradient = ctx.createRadialGradient(
      obstacle.x + obstacle.size / 2,
      drawY + obstacle.size / 2,
      0,
      obstacle.x + obstacle.size / 2,
      drawY + obstacle.size / 2,
      obstacle.size / 2
    );
    gradient.addColorStop(0, "#000");
    gradient.addColorStop(0.7, "#222");
    gradient.addColorStop(1, "#444");
    
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(obstacle.x + obstacle.size / 2, drawY + obstacle.size / 2, obstacle.size / 2, 0, Math.PI * 2);
    ctx.fill();
  }, []);

  const drawBullet = useCallback((ctx: CanvasRenderingContext2D, bullet: Bullet, cameraY: number) => {
    const drawY = bullet.y - cameraY;
    ctx.fillStyle = "#FF4444";
    ctx.beginPath();
    ctx.arc(bullet.x, drawY, 4, 0, Math.PI * 2);
    ctx.fill();
  }, []);

  const checkCollision = useCallback((rect1: any, rect2: any) => {
    return (
      rect1.x < rect2.x + rect2.width &&
      rect1.x + rect1.width > rect2.x &&
      rect1.y < rect2.y + rect2.height &&
      rect1.y + rect1.height > rect2.y
    );
  }, []);

  const gameLoop = useCallback(() => {
    if (isPaused || gameStateRef.current.isGameOver) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const state = gameStateRef.current;
    const { player, platforms, enemies, obstacles, bullets } = state;

    // Clear canvas
    ctx.fillStyle = "#EDE4D3";
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Update player horizontal movement
    if (state.keys.left) player.velocityX = -MOVE_SPEED;
    else if (state.keys.right) player.velocityX = MOVE_SPEED;
    else player.velocityX *= 0.8;

    // Update player position
    player.x += player.velocityX;
    player.velocityY += GRAVITY;
    player.y += player.velocityY;

    // Wrap around screen
    if (player.x < -player.width) player.x = CANVAS_WIDTH;
    if (player.x > CANVAS_WIDTH) player.x = -player.width;

    // Platform collisions (only when falling)
    if (player.velocityY > 0) {
      for (const platform of platforms) {
        if (!platform.broken && 
            player.y + player.height > platform.y &&
            player.y + player.height < platform.y + PLATFORM_HEIGHT + 10 &&
            player.x + player.width > platform.x &&
            player.x < platform.x + platform.width) {
          
          if (platform.type === "spring") {
            player.velocityY = JUMP_STRENGTH * 1.5;
          } else if (platform.type === "breaking") {
            platform.broken = true;
            player.velocityY = JUMP_STRENGTH;
          } else {
            player.velocityY = JUMP_STRENGTH;
          }
        }
      }
    }

    // Camera follow player when going up
    if (player.y < state.cameraY + CANVAS_HEIGHT / 3) {
      const diff = state.cameraY + CANVAS_HEIGHT / 3 - player.y;
      state.cameraY -= diff;
      
      // Update score based on height
      const newScore = Math.floor(-state.cameraY / 10);
      if (newScore > score) {
        setScore(newScore);
        onScoreUpdate(newScore);
        
        // Check for stage change
        const newStage = getStageFromScore(newScore);
        if (newStage > currentStage) {
          setCurrentStage(newStage);
        }
      }
    }

    // Generate new platforms, enemies, obstacles based on current stage
    const highestPlatform = Math.min(...platforms.map(p => p.y));
    if (highestPlatform > state.cameraY - CANVAS_HEIGHT) {
      const stage = getStageFromScore(score);
      const newPlatforms = generatePlatforms(highestPlatform, stage);
      platforms.push(...newPlatforms);
      
      newPlatforms.forEach(p => {
        const enemy = generateEnemy(p.y);
        if (enemy) enemies.push(enemy);
        
        const obstacle = generateObstacle(p.y);
        if (obstacle) obstacles.push(obstacle);
      });
    }

    // Update bullets
    for (let i = bullets.length - 1; i >= 0; i--) {
      bullets[i].y += bullets[i].velocityY;
      
      // Remove off-screen bullets
      if (bullets[i].y < state.cameraY - 100) {
        bullets.splice(i, 1);
      }
    }

    // Check bullet-enemy collisions
    for (let i = enemies.length - 1; i >= 0; i--) {
      for (let j = bullets.length - 1; j >= 0; j--) {
        if (checkCollision(
          { x: bullets[j].x - 4, y: bullets[j].y - 4, width: 8, height: 8 },
          enemies[i]
        )) {
          enemies.splice(i, 1);
          bullets.splice(j, 1);
          break;
        }
      }
    }

    // Check player-enemy collisions
    for (const enemy of enemies) {
      if (checkCollision(player, enemy)) {
        state.isGameOver = true;
        onGameOver(score);
        return;
      }
    }

    // Check player-obstacle collisions
    for (const obstacle of obstacles) {
      if (checkCollision(player, { x: obstacle.x, y: obstacle.y, width: obstacle.size, height: obstacle.size })) {
        state.isGameOver = true;
        onGameOver(score);
        return;
      }
    }

    // Game over if fell too far
    if (player.y > state.cameraY + CANVAS_HEIGHT + 100) {
      state.isGameOver = true;
      onGameOver(score);
      return;
    }

    // Remove off-screen objects
    state.platforms = platforms.filter(p => p.y < state.cameraY + CANVAS_HEIGHT + 200);
    state.enemies = enemies.filter(e => e.y < state.cameraY + CANVAS_HEIGHT + 200);
    state.obstacles = obstacles.filter(o => o.y < state.cameraY + CANVAS_HEIGHT + 200);

    // Draw everything
    platforms.forEach(p => drawPlatform(ctx, p, state.cameraY));
    enemies.forEach(e => drawEnemy(ctx, e, state.cameraY));
    obstacles.forEach(o => drawObstacle(ctx, o, state.cameraY));
    bullets.forEach(b => drawBullet(ctx, b, state.cameraY));
    drawPlayer(ctx, player, state.cameraY);
  }, [isPaused, score, currentStage, onGameOver, onScoreUpdate, generatePlatforms, generateEnemy, generateObstacle, drawPlayer, drawPlatform, drawEnemy, drawObstacle, drawBullet, checkCollision, getStageFromScore]);

  useEffect(() => {
    const animationId = setInterval(gameLoop, 1000 / 60);
    return () => clearInterval(animationId);
  }, [gameLoop]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft" || e.key === "a") gameStateRef.current.keys.left = true;
      if (e.key === "ArrowRight" || e.key === "d") gameStateRef.current.keys.right = true;
      if (e.key === " " || e.key === "ArrowUp") {
        e.preventDefault();
        shoot();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft" || e.key === "a") gameStateRef.current.keys.left = false;
      if (e.key === "ArrowRight" || e.key === "d") gameStateRef.current.keys.right = false;
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, []);

  const shoot = useCallback(() => {
    const state = gameStateRef.current;
    state.bullets.push({
      x: state.player.x + state.player.width / 2,
      y: state.player.y,
      velocityY: -10,
    });
  }, []);

  const handleCanvasClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    shoot();
  }, [shoot]);

  const handleMoveLeft = useCallback((pressed: boolean) => {
    gameStateRef.current.keys.left = pressed;
    if (pressed) gameStateRef.current.keys.right = false;
  }, []);

  const handleMoveRight = useCallback((pressed: boolean) => {
    gameStateRef.current.keys.right = pressed;
    if (pressed) gameStateRef.current.keys.left = false;
  }, []);

  return (
    <div className="relative flex flex-col items-center">
      <div className="absolute top-4 left-4 z-10 flex items-center gap-4">
        <div className="handwriting text-3xl font-bold">{score}</div>
        <div className="handwriting text-lg px-3 py-1 bg-accent/80 rounded-full border-2 border-foreground">
          Stage {currentStage}
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsPaused(!isPaused)}
          className="rounded-full bg-accent/80 hover:bg-accent"
        >
          {isPaused ? <Play className="h-6 w-6" /> : <Pause className="h-6 w-6" />}
        </Button>
      </div>

      <canvas
        ref={canvasRef}
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
        onClick={handleCanvasClick}
        className="border-4 border-foreground rounded-lg shadow-[4px_4px_0px_0px_rgba(0,0,0,0.3)] cursor-crosshair"
      />

      <div className="mt-4 text-center text-sm handwriting">
        <p className="hidden md:block">← → or A/D to move</p>
        <p className="hidden md:block">Click or SPACE to shoot</p>
        <p className="md:hidden">Use buttons below to control</p>
      </div>

      {/* Mobile touch controls */}
      <div className="md:hidden fixed bottom-8 left-0 right-0 px-6 z-20">
        <div className="flex justify-between items-end max-w-md mx-auto">
          {/* Left and Right buttons */}
          <div className="flex gap-3">
            <button
              onPointerDown={(e) => {
                e.preventDefault();
                handleMoveLeft(true);
              }}
              onPointerUp={(e) => {
                e.preventDefault();
                handleMoveLeft(false);
              }}
              onPointerLeave={(e) => {
                e.preventDefault();
                handleMoveLeft(false);
              }}
              className="h-16 w-16 rounded-full bg-accent/90 border-2 border-foreground shadow-[3px_3px_0px_0px_rgba(0,0,0,0.3)] active:translate-x-[3px] active:translate-y-[3px] active:shadow-none flex items-center justify-center touch-none"
            >
              <ChevronLeft className="h-8 w-8" />
            </button>
            
            <button
              onPointerDown={(e) => {
                e.preventDefault();
                handleMoveRight(true);
              }}
              onPointerUp={(e) => {
                e.preventDefault();
                handleMoveRight(false);
              }}
              onPointerLeave={(e) => {
                e.preventDefault();
                handleMoveRight(false);
              }}
              className="h-16 w-16 rounded-full bg-accent/90 border-2 border-foreground shadow-[3px_3px_0px_0px_rgba(0,0,0,0.3)] active:translate-x-[3px] active:translate-y-[3px] active:shadow-none flex items-center justify-center touch-none"
            >
              <ChevronRight className="h-8 w-8" />
            </button>
          </div>

          {/* Shoot button */}
          <button
            onPointerDown={(e) => {
              e.preventDefault();
              shoot();
            }}
            className="h-20 w-20 rounded-full bg-primary/90 border-2 border-foreground shadow-[3px_3px_0px_0px_rgba(0,0,0,0.3)] active:translate-x-[3px] active:translate-y-[3px] active:shadow-none flex items-center justify-center touch-none"
          >
            <ArrowUp className="h-10 w-10" />
          </button>
        </div>
      </div>
    </div>
  );
};
