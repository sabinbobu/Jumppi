import { Button } from "../ui/button";
import { useEffect, useState } from "react";

export const MainMenu = ({ onPlay }: { onPlay: () => void }) => {
  const [playerName, setPlayerName] = useState("Player");
  const [highScore, setHighScore] = useState(0);

  useEffect(() => {
    const savedName = localStorage.getItem("doodleJumpPlayerName");
    const savedHighScore = localStorage.getItem("doodleJumpHighScore");
    
    if (savedName) {
      setPlayerName(savedName);
    }
    
    if (savedHighScore) {
      setHighScore(parseInt(savedHighScore));
    }
  }, []);

  const handlePlay = () => {
    // Prompt for name if not set
    if (playerName === "Player") {
      const name = prompt("Enter your name:", "Player");
      if (name && name.trim()) {
        const trimmedName = name.trim().slice(0, 20); // Max 20 characters
        setPlayerName(trimmedName);
        localStorage.setItem("doodleJumpPlayerName", trimmedName);
      }
    }
    onPlay();
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8">
      <div className="max-w-md w-full space-y-8">
        {/* Title */}
        <h1 className="text-6xl font-bold text-center handwriting text-foreground animate-float">
          Pi Jump
        </h1>

        {/* Player info */}
        {(playerName !== "Player" || highScore > 0) && (
          <div className="text-center space-y-2 handwriting text-lg">
            <p className="text-foreground">Player: {playerName}</p>
            <p className="text-foreground">Best Score: {highScore}</p>
          </div>
        )}

        {/* Decorative doodles */}
        <div className="flex justify-around items-center py-8">
          <div className="w-16 h-16 rounded-full bg-secondary border-2 border-foreground animate-wiggle" />
          <div className="w-20 h-12 bg-accent border-2 border-foreground rounded-full transform rotate-12" />
        </div>

        {/* Buttons */}
        <div className="space-y-4">
          <Button
            onClick={handlePlay}
            className="w-full game-button text-2xl handwriting py-6"
          >
            play
          </Button>
          
          <Button
            disabled
            className="w-full game-button text-2xl handwriting py-6 opacity-50 cursor-not-allowed"
          >
            multiplayer
          </Button>
        </div>

        {/* Bottom doodles */}
        <div className="flex justify-around items-end pt-8">
          <div className="w-12 h-8 bg-secondary border-2 border-foreground rounded-lg" />
          <div className="w-10 h-10 rounded-full bg-accent border-2 border-foreground" />
          <div className="w-14 h-10 bg-secondary border-2 border-foreground rounded-full" />
        </div>

        {/* Bottom navigation */}
        <div className="flex justify-around pt-8 text-sm handwriting text-muted-foreground">
          <span>store</span>
          <span>scores</span>
          <span>options</span>
        </div>
      </div>
    </div>
  );
};
