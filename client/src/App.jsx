import { useEffect, useState, Component } from 'react';
import { BrowserRouter, Routes, Route, Outlet, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Menu, WifiOff, RefreshCw } from 'lucide-react';
import { useAuthStore } from './lib/auth';
import { ToastProvider } from './shared/components/Toast';

class ErrorBoundary extends Component {
  constructor(props) { super(props); this.state = { error: null }; }
  static getDerivedStateFromError(error) { return { error }; }
  render() {
    if (this.state.error) {
      return (
        <div className="min-h-screen bg-brand-bg flex flex-col items-center justify-center px-4 text-center gap-4">
          <p className="text-brand-danger font-bold text-lg">Erreur — {this.state.error.message}</p>
          <pre className="text-brand-muted text-xs max-w-lg overflow-auto text-left bg-brand-card p-4 rounded-xl">
            {this.state.error.stack}
          </pre>
          <button onClick={() => window.location.reload()}
            className="flex items-center gap-2 px-4 py-2 bg-brand-cta text-white rounded-xl cursor-pointer">
            <RefreshCw size={16} /> Recharger
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
import Navbar from './shared/components/Navbar';
import ProtectedRoute from './shared/components/ProtectedRoute';
import AdminSidebar from './features/admin/components/AdminSidebar';

// Auth
import Login from './features/auth/pages/Login';

// Passenger
import SearchRides from './features/passenger/pages/SearchRides';
import BookingConfirm from './features/passenger/pages/BookingConfirm';
import MyBookings from './features/passenger/pages/MyBookings';
import Profile from './features/passenger/pages/Profile';
import PublicProfile from './features/passenger/pages/PublicProfile';
import MessagesPlaceholder from './features/passenger/pages/MessagesPlaceholder';
import TrackingPlaceholder from './features/passenger/pages/TrackingPlaceholder';

// Driver
import CreateRide from './features/driver/pages/CreateRide';
import MyRides from './features/driver/pages/MyRides';
import DemandInsights from './features/driver/pages/DemandInsights';

// New features
import SubscriptionPage from './features/passenger/pages/SubscriptionPage';
import WalletPage from './features/passenger/pages/WalletPage';
import CorporateDashboard from './features/corporate/pages/CorporateDashboard';

// Admin
import AdminDashboard from './features/admin/pages/Dashboard';
import UsersManagement from './features/admin/pages/UsersManagement';
import DriversVerification from './features/admin/pages/DriversVerification';
import RidesOverview from './features/admin/pages/RidesOverview';
import Financials from './features/admin/pages/Financials';
import SubAdmins from './features/admin/pages/SubAdmins';
import AuditLogs from './features/admin/pages/AuditLogs';
import GlobalConfig from './features/admin/pages/GlobalConfig';

// Feature 2: Offline indicator banner
function OfflineBanner() {
  const [online, setOnline] = useState(navigator.onLine);
  useEffect(() => {
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off); };
  }, []);
  if (online) return null;
  return (
    <div className="fixed top-0 inset-x-0 z-[80] bg-brand-warning text-black text-xs font-semibold flex items-center justify-center gap-2 py-2">
      <WifiOff size={13} /> Hors ligne — vos actions seront synchronisées à la reconnexion
    </div>
  );
}

function NotFound() {
  const { t } = useTranslation();
  return (
    <div className="min-h-screen bg-brand-bg flex flex-col items-center justify-center text-center px-4">
      <p className="text-brand-cta text-7xl font-bold mb-4">404</p>
      <h1 className="text-2xl font-bold text-brand-text mb-2">{t('error.notFound')}</h1>
      <p className="text-brand-muted mb-8">{t('error.notFoundMessage')}</p>
      <Link to="/" className="px-6 py-3 bg-brand-cta hover:bg-brand-cta-hover text-white font-semibold rounded-xl transition-colors cursor-pointer shadow-cta">
        {t('error.goHome')}
      </Link>
    </div>
  );
}

function PublicLayout() {
  return (
    <div className="bg-brand-bg min-h-screen font-sans">
      <Navbar />
      <Outlet />
    </div>
  );
}

function AdminLayout() {
  const { t } = useTranslation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="bg-brand-bg min-h-screen font-sans flex">
      <AdminSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <main className="flex-1 md:ml-60 p-4 md:p-8 overflow-y-auto min-h-screen">
        <div className="md:hidden flex items-center gap-3 mb-6">
          <button onClick={() => setSidebarOpen(true)}
            className="p-2.5 rounded-xl bg-brand-surface border border-brand-border text-brand-text hover:bg-brand-card transition-colors cursor-pointer"
            aria-label={t('nav.menu')}>
            <Menu size={20} />
          </button>
          <p className="font-bold text-brand-text">NetRide Admin</p>
        </div>
        <Outlet />
      </main>
    </div>
  );
}

export default function App() {
  const { fetchMe } = useAuthStore();
  useEffect(() => { fetchMe(); }, []);

  return (
    <ErrorBoundary>
    <BrowserRouter>
      <ToastProvider>
        <OfflineBanner />
        <Routes>
          <Route path="/login" element={<Login />} />

          {/* Public / Passenger */}
          <Route element={<PublicLayout />}>
            <Route path="/" element={<SearchRides />} />
            <Route path="/rides/:id" element={<BookingConfirm />} />

            {/* Feature 29: Public driver profile */}
            <Route path="/profile/:id" element={<PublicProfile />} />

            {/* Feature 32: Messaging placeholder */}
            <Route path="/messages" element={
              <ProtectedRoute roles={['PASSENGER', 'DRIVER', 'SUPER_ADMIN', 'SUB_ADMIN']}>
                <MessagesPlaceholder />
              </ProtectedRoute>
            } />

            <Route path="/bookings" element={
              <ProtectedRoute roles={['PASSENGER', 'DRIVER', 'SUPER_ADMIN', 'SUB_ADMIN']}>
                <MyBookings />
              </ProtectedRoute>
            } />
            <Route path="/profile" element={
              <ProtectedRoute roles={['PASSENGER', 'DRIVER', 'SUPER_ADMIN', 'SUB_ADMIN']}>
                <Profile />
              </ProtectedRoute>
            } />

            {/* Driver */}
            <Route path="/driver/rides" element={
              <ProtectedRoute roles={['DRIVER', 'SUPER_ADMIN']}>
                <MyRides />
              </ProtectedRoute>
            } />
            <Route path="/driver/rides/new" element={
              <ProtectedRoute roles={['DRIVER', 'SUPER_ADMIN']}>
                <CreateRide />
              </ProtectedRoute>
            } />

            {/* Feature 33: Live tracking placeholder */}
            <Route path="/tracking/:rideId" element={
              <ProtectedRoute roles={['PASSENGER', 'DRIVER', 'SUPER_ADMIN', 'SUB_ADMIN']}>
                <TrackingPlaceholder />
              </ProtectedRoute>
            } />

            {/* New features */}
            <Route path="/subscription" element={
              <ProtectedRoute roles={['PASSENGER', 'DRIVER', 'SUPER_ADMIN', 'SUB_ADMIN']}>
                <SubscriptionPage />
              </ProtectedRoute>
            } />
            <Route path="/wallet" element={
              <ProtectedRoute roles={['PASSENGER', 'DRIVER', 'SUPER_ADMIN', 'SUB_ADMIN']}>
                <WalletPage />
              </ProtectedRoute>
            } />
            <Route path="/corporate" element={
              <ProtectedRoute roles={['PASSENGER', 'DRIVER', 'SUPER_ADMIN', 'SUB_ADMIN']}>
                <CorporateDashboard />
              </ProtectedRoute>
            } />
            <Route path="/driver/insights" element={
              <ProtectedRoute roles={['DRIVER', 'SUPER_ADMIN']}>
                <DemandInsights />
              </ProtectedRoute>
            } />
          </Route>

          {/* Admin */}
          <Route path="/admin" element={
            <ProtectedRoute roles={['SUPER_ADMIN', 'SUB_ADMIN']}>
              <AdminLayout />
            </ProtectedRoute>
          }>
            <Route index element={<AdminDashboard />} />
            <Route path="users" element={<UsersManagement />} />
            <Route path="drivers" element={<DriversVerification />} />
            <Route path="rides" element={<RidesOverview />} />
            <Route path="financials" element={<Financials />} />
            <Route path="sub-admins" element={<SubAdmins />} />
            <Route path="audit" element={<AuditLogs />} />
            {/* Feature 43: Global config */}
            <Route path="config" element={<GlobalConfig />} />
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </ToastProvider>
    </BrowserRouter>
    </ErrorBoundary>
  );
}
