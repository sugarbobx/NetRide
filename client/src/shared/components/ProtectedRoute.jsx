import { Navigate } from 'react-router-dom';
import { Car } from 'lucide-react';
import { useAuthStore } from '../../lib/auth';

export default function ProtectedRoute({ children, roles = [] }) {
  const { user, loading } = useAuthStore();

  if (loading) {
    return (
      <div className="min-h-screen bg-brand-bg flex flex-col items-center justify-center gap-4">
        <div className="w-14 h-14 bg-brand-cta rounded-2xl flex items-center justify-center shadow-cta">
          <Car size={28} className="text-white" />
        </div>
        <div className="w-8 h-8 border-2 border-brand-cta border-t-transparent rounded-full animate-spin" />
        <p className="text-brand-muted text-sm">Chargement...</p>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  if (roles.length > 0 && !roles.includes(user.role)) return <Navigate to="/" replace />;
  return children;
}
