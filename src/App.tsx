import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import StatsPage from './pages/StatsPage';
import PosterPage from './pages/PosterPage';
import SettingsPage from './pages/SettingsPage';

function App() {
  return (
    <HashRouter>
      <div
        style={{
          display: 'flex',
          height: '100%',
          background: 'var(--bg-primary)',
        }}
      >
        {/* 侧边栏 */}
        <Sidebar />

        {/* 页面内容 */}
        <main style={{ flex: 1, overflow: 'hidden' }}>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/stats" element={<StatsPage />} />
            <Route path="/poster" element={<PosterPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </HashRouter>
  );
}

export default App;
