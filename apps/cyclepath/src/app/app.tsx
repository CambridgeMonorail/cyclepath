import { useState } from 'react';
import { GameScene } from './components/GameScene';
import { GameMenu } from './components/GameMenu';

export function App() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [gameOver, setGameOver] = useState(false);

  // Start the game
  const handleStart = () => {
    setIsPlaying(true);
    setGameOver(false);
  };

  // Handle game over
  const handleGameOver = () => {
    setIsPlaying(false);
    setGameOver(true);
  };

  return (
    <div className="w-screen h-screen">
      <GameScene isPlaying={isPlaying} onGameOver={handleGameOver} />

      {/* Only show game menu when not playing */}
      {!isPlaying && (
        <GameMenu onStartGame={handleStart} isGameOver={gameOver} />
      )}
    </div>
  );
}

export default App;
