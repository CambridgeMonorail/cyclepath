import { useState } from 'react';

type GameMenuProps = {
  onStartGame: () => void;
  isGameOver?: boolean;
};

export const GameMenu = ({ onStartGame, isGameOver = false }: GameMenuProps) => {
  return (
    <div className="absolute inset-0 flex items-center justify-center z-10 bg-black bg-opacity-50">
      <div className="bg-white p-8 rounded-lg shadow-lg text-center">
        <h1 className="text-3xl font-bold mb-6">CyclePath</h1>

        {isGameOver ? (
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-red-600 mb-2">Game Over!</h2>
            <p>You crashed! Try again to navigate the streets of Mill Road safely.</p>
          </div>
        ) : (
          <p className="mb-6">Navigate the streets of Mill Road and avoid obstacles to reach your destination!</p>
        )}

        <div className="space-y-4">
          <button
            onClick={onStartGame}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            {isGameOver ? 'Play Again' : 'Play'}
          </button>
        </div>

        <div className="mt-6 text-sm">
          <p>Controls:</p>
          <p>W/↑: Move forward</p>
          <p>S/↓: Move backward</p>
          <p>A/←: Turn left</p>
          <p>D/→: Turn right</p>
        </div>
      </div>
    </div>
  );
};

export default GameMenu;
