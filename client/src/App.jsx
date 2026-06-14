import { Routes, Route } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import { useAuth } from './context/AuthContext';
import MainLayout from './layouts/MainLayout';
import ProtectedRoute from './components/ProtectedRoute';
import Chatbot from './components/Chatbot';

const HomePage = lazy(() => import('./pages/HomePage'));
const LoginPage = lazy(() => import('./pages/auth/LoginPage'));
const RegisterPage = lazy(() => import('./pages/auth/RegisterPage'));
const HotelListPage = lazy(() => import('./pages/hotels/HotelListPage'));
const HotelDetailPage = lazy(() => import('./pages/hotels/HotelDetailPage'));
const BookingPage = lazy(() => import('./pages/bookings/BookingPage'));
const MyBookingsPage = lazy(() => import('./pages/bookings/MyBookingsPage'));
const ProfilePage = lazy(() => import('./pages/user/ProfilePage'));
const DashboardPage = lazy(() => import('./pages/admin/DashboardPage'));
const AboutPage = lazy(() => import('./pages/AboutPage'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));

const PageLoader = () => (
  <div className="min-h-[60vh] flex items-center justify-center bg-background">
    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-container" />
  </div>
);

function App() {
  const { isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-container" />
      </div>
    );
  }

  return (
    <>
      <Routes>
        <Route path="/" element={<MainLayout />}>
          <Route index element={<Suspense fallback={<PageLoader />}><HomePage /></Suspense>} />
          <Route path="login" element={<Suspense fallback={<PageLoader />}><LoginPage /></Suspense>} />
          <Route path="register" element={<Suspense fallback={<PageLoader />}><RegisterPage /></Suspense>} />
          <Route path="hotels" element={<Suspense fallback={<PageLoader />}><HotelListPage /></Suspense>} />
          <Route path="hotels/:id" element={<Suspense fallback={<PageLoader />}><HotelDetailPage /></Suspense>} />
          <Route path="about" element={<Suspense fallback={<PageLoader />}><AboutPage /></Suspense>} />
          <Route
            path="book/:hotelId/:roomId"
            element={
              <ProtectedRoute>
                <Suspense fallback={<PageLoader />}><BookingPage /></Suspense>
              </ProtectedRoute>
            }
          />
          <Route
            path="my-bookings"
            element={
              <ProtectedRoute>
                <Suspense fallback={<PageLoader />}><MyBookingsPage /></Suspense>
              </ProtectedRoute>
            }
          />
          <Route
            path="profile"
            element={
              <ProtectedRoute>
                <Suspense fallback={<PageLoader />}><ProfilePage /></Suspense>
              </ProtectedRoute>
            }
          />
          <Route
            path="dashboard"
            element={
              <ProtectedRoute adminOnly>
                <Suspense fallback={<PageLoader />}><DashboardPage /></Suspense>
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Suspense fallback={<PageLoader />}><NotFoundPage /></Suspense>} />
        </Route>
      </Routes>
      <Chatbot />
    </>
  );
}

export default App;
