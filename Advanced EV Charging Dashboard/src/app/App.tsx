import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import MapView from './pages/MapView';
import DashboardView from './pages/DashboardView';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/map" replace />} />
        <Route path="/map" element={<MapView />} />
        <Route path="/dashboard" element={<DashboardView />} />
      </Routes>
    </BrowserRouter>
  );
}