import { useEffect, useState } from "react";
import { Button } from "./ui/button";

export const GameOver = ({
  score,
  onPlayAgain,
  onMenu,
}: {
  score: number;
  onPlayAgain: () => void;
  onMenu: () => void;
}) => {
  const [highScore, setHighScore] = useState(0);
  const [playerName, setPlayerName] = useState("Player");

  useEffect(() => {
    const savedHighScore = localStorage.getItem("doodleJumpHighScore");
    const savedName = localStorage.getItem("doodleJumpPlayerName");
    
    if (savedName) {
      setPlayerName(savedName);
    }

    if (savedHighScore) {
      const saved = parseInt(savedHighScore);
      setHighScore(saved);
      
      if (score > saved) {
        localStorage.setItem("doodleJumpHighScore", score.toString());
        setHighScore(score);
      }
    } else if (score > 0) {
      localStorage.setItem("doodleJumpHighScore", score.toString());
      setHighScore(score);
    }
  }, [score]);

  const handleNameChange = () => {
    const newName = prompt("Enter your name:", playerName);
    if (newName && newName.trim()) {
      const trimmedName = newName.trim().slice(0, 20); // Max 20 characters
      setPlayerName(trimmedName);
      localStorage.setItem("doodleJumpPlayerName", trimmedName);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8">
      <div className="max-w-md w-full space-y-8 animate-bounce-in">
        {/* Game Over Title */}
        <h1 className="text-5xl font-bold text-center handwriting text-foreground">
          Pi Jump
        </h1>
        <h2 className="text-3xl font-bold text-center handwriting text-foreground -mt-4">
          game over!
        </h2>

        {/* Scores */}
        <div className="space-y-3 text-center handwriting text-xl">
          <p>your score: {score}</p>
          <p>your high score: {highScore}</p>
          <p>overall high score: {highScore}</p>
          <div className="flex items-center justify-center gap-2">
            <p>your name: {playerName}</p>
            <button
              onClick={handleNameChange}
              className="text-primary underline text-sm hover:scale-105 transition-transform"
            >
              TAP TO CHANGE
            </button>
          </div>
        </div>

        {/* Buttons */}
        <div className="space-y-4 pt-4">
          <Button
            onClick={onPlayAgain}
            className="w-full game-button text-2xl handwriting py-6"
          >
            play again
          </Button>

          <Button
            disabled
            className="w-full game-button text-xl handwriting py-5 opacity-50 cursor-not-allowed"
          >
            remove ads
          </Button>

          <Button
            disabled
            className="w-full game-button text-xl handwriting py-5 opacity-50 cursor-not-allowed"
          >
            challenge friends
          </Button>

          <Button
            onClick={onMenu}
            className="w-full game-button text-2xl handwriting py-6"
          >
            menu
          </Button>
        </div>

        {/* Missions button */}
        <div className="text-center pt-4">
          <span className="text-sm handwriting text-muted-foreground">missions</span>
        </div>
      </div>
    </div>
  );
};
