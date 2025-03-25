import { useState } from 'react';
import GameScene from './GameScene';
import GameMenu from './GameMenu';

export const Game = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [gameKey, setGameKey] = useState(0);

  const handleStartGame = () => {
    setGameKey(prev => prev + 1); // Force new obstacle generation
    setIsPlaying(true);
    setIsGameOver(false);
  };

  const handleGameOver = () => {
    setIsGameOver(true);
    setIsPlaying(false);
  };

  return (
    <div
      className="relative w-full h-screen bg-dark-navy"
      role="main"
      aria-label="Cyclepath Game"
    >
      <GameScene
        key={gameKey}
        isPlaying={isPlaying}
        onGameOver={handleGameOver}
      />

      {!isPlaying && (
        <GameMenu
          onStartGame={handleStartGame}
          isGameOver={isGameOver}
        />
      )}
    </div>
  );
};

export default Game;
