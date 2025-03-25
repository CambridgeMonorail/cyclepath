import { useState } from 'react';
import GameScene from './GameScene';
import GameMenu from './GameMenu';

export const Game = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);

  const handleStartGame = () => {
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
      <GameScene isPlaying={isPlaying} onGameOver={handleGameOver} />

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
