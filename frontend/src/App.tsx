import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './hooks/useAuth';
import PlacarPage from './pages/PlacarPage';
import PlacarSlideshowPage from './pages/PlacarSlideshowPage';
import LoginPage from './pages/LoginPage';
import AdminPage from './pages/AdminPage';
import LandingPage from './pages/LandingPage';
import HouseScores from './pages/HouseScores';
import ProtectedRoute from './components/shared/ProtectedRoute';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Landing Page */}
            <Route path="/" element={<LandingPage />} />

            {/* Public Scoreboard */}
            <Route path="/placar/:casaId" element={<PlacarPage />} />
            <Route path="/placar" element={<PlacarSlideshowPage />} />
            <Route path="/pontuacao" element={<HouseScores />} />

            {/* Admin Routes */}
            <Route path="/login" element={<LoginPage />} />

            <Route element={<ProtectedRoute />}>
              <Route path="/admin/*" element={<AdminPage />} />
            </Route>

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
        <Toaster position="top-right" />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
