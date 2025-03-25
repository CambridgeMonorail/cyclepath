type GameMenuProps = {
  onStartGame: () => void;
  isGameOver: boolean;
};

export const GameMenu = ({ onStartGame, isGameOver }: GameMenuProps) => {
  return (
    <div
      className="absolute inset-0 flex flex-col items-center justify-center bg-dark-navy/80"
      role="dialog"
      aria-modal="true"
      aria-label={isGameOver ? "Game Over Menu" : "Game Start Menu"}
    >
      <div className="bg-deep-purple p-8 rounded-lg shadow-lg max-w-md w-full mx-4">
        <h1 className="font-outrun text-4xl font-bold italic mb-6 text-neon-pink text-center">
          {isGameOver ? 'Game Over!' : 'Welcome to Cyclepath'}
        </h1>

        <div className="text-cyan-blue mb-8 space-y-4">
          <h2 className="font-outrun text-xl mb-2">Controls:</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>Use <kbd className="bg-neon-orange px-2 py-1 rounded text-deep-purple">W</kbd> or <kbd className="bg-neon-orange px-2 py-1 rounded text-deep-purple">↑</kbd> to move forward</li>
            <li>Use <kbd className="bg-neon-orange px-2 py-1 rounded text-deep-purple">S</kbd> or <kbd className="bg-neon-orange px-2 py-1 rounded text-deep-purple">↓</kbd> to move backward</li>
            <li>Use <kbd className="bg-neon-orange px-2 py-1 rounded text-deep-purple">A</kbd> or <kbd className="bg-neon-orange px-2 py-1 rounded text-deep-purple">←</kbd> to turn left</li>
            <li>Use <kbd className="bg-neon-orange px-2 py-1 rounded text-deep-purple">D</kbd> or <kbd className="bg-neon-orange px-2 py-1 rounded text-deep-purple">→</kbd> to turn right</li>
          </ul>

          <p className="mt-4">Avoid obstacles and reach your destination!</p>
        </div>

        <div className="flex justify-center">
          <button
            onClick={onStartGame}
            className="bg-neon-orange hover:bg-bright-pink text-deep-purple font-outrun text-xl px-8 py-4 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-neon-pink focus:ring-offset-2 focus:ring-offset-deep-purple"
            aria-label={isGameOver ? "Retry Game" : "Start Game"}
          >
            {isGameOver ? 'Try Again' : 'Start Game'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default GameMenu;
