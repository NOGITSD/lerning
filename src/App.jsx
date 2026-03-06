import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useProgress } from './hooks/useProgress';
import HomePage from './pages/HomePage';
import LevelMap from './pages/LevelMap';
import ChallengePage from './pages/ChallengePage';
import './index.css';

function App() {
  const progressHook = useProgress();

  return (
    <BrowserRouter>
      <div className="bg-grid" />
      <div className="bg-gradient-overlay" />
      <Routes>
        <Route path="/" element={<HomePage progress={progressHook} />} />
        <Route path="/levels/:lang" element={<LevelMap progress={progressHook} />} />
        <Route path="/challenge/:lang/:level" element={<ChallengePage progress={progressHook} />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
