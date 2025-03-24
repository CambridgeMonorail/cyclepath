import { Route, Routes } from 'react-router-dom';
import Game from './components/Game';

export function App() {
  return (
    <Routes>
      <Route path="/" element={<Game />} />
    </Routes>
  );
}

export default App;
