import { useState } from "react";
import { MainMenu } from "@/components/MainMenu";
import { GameCanvas } from "@/components/GameCanvas";
import { GameOver } from "@/components/GameOver";

type GameState = "menu" | "playing" | "gameOver";

const Index = () => {
  const [gameState, setGameState] = useState<GameState>("menu");
  const [finalScore, setFinalScore] = useState(0);
  const [currentScore, setCurrentScore] = useState(0);

  const handlePlay = () => {
    setGameState("playing");
    setCurrentScore(0);
  };

  const handleGameOver = (score: number) => {
    setFinalScore(score);
    setGameState("gameOver");
  };

  const handlePlayAgain = () => {
    setGameState("playing");
    setCurrentScore(0);
  };

  const handleMenu = () => {
    setGameState("menu");
    setCurrentScore(0);
  };

  const handleScoreUpdate = (score: number) => {
    setCurrentScore(score);
  };

  return (
    <div className="min-h-screen flex items-center justify-center">
      {gameState === "menu" && <MainMenu onPlay={handlePlay} />}
      
      {gameState === "playing" && (
        <div className="py-8">
          <GameCanvas 
            onGameOver={handleGameOver}
            onScoreUpdate={handleScoreUpdate}
          />
        </div>
      )}
      
      {gameState === "gameOver" && (
        <GameOver
          score={finalScore}
          onPlayAgain={handlePlayAgain}
          onMenu={handleMenu}
        />
      )}
    </div>
  );
};

export default Index;
