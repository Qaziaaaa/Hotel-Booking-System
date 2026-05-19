import { Routes, Route } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import MainLayout from './layouts/MainLayout';
import ProtectedRoute from './components/ProtectedRoute';

// Pages
import HomePage from './pages/HomePage';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import HotelListPage from './pages/hotels/HotelListPage';
import HotelDetailPage from './pages/hotels/HotelDetailPage';
import BookingPage from './pages/bookings/BookingPage';
import MyBookingsPage from './pages/bookings/MyBookingsPage';
import ProfilePage from './pages/user/ProfilePage';
import DashboardPage from './pages/admin/DashboardPage';
import AboutPage from './pages/AboutPage';
import NotFoundPage from './pages/NotFoundPage';
import Chatbot from './components/Chatbot';

function App() {
  const { isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-container"></div>
      </div>
    );
  }

  return (
    <>
      <Routes>
        {/* All pages inside MainLayout — Navbar + Footer */}
        <Route path="/" element={<MainLayout />}>
          <Route index element={<HomePage />} />
          <Route path="login" element={<LoginPage />} />
          <Route path="register" element={<RegisterPage />} />
          <Route path="hotels" element={<HotelListPage />} />
          <Route path="hotels/:id" element={<HotelDetailPage />} />
          <Route path="about" element={<AboutPage />} />
          <Route
            path="book/:hotelId/:roomId"
            element={
              <ProtectedRoute>
                <BookingPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="my-bookings"
            element={
              <ProtectedRoute>
                <MyBookingsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="profile"
            element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="dashboard"
            element={
              <ProtectedRoute adminOnly>
                <DashboardPage />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
      <Chatbot />
    </>
  );
}

export default App;
