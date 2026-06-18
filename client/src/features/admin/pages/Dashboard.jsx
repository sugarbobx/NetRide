import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Users, Car, ShoppingCart, TrendingUp, Lock, BadgeCheck } from 'lucide-react';
import api from '../../../lib/api';
import StatCard from '../components/StatCard';
import { useAuthStore } from '../../../lib/auth';

const REFRESH_INTERVAL = 30;

function formatXAF(amount) {
  return new Intl.NumberFormat('fr-CM', { style: 'currency', currency: 'XAF', maximumFractionDigits: 0 }).format(amount);
}

function formatDate(iso) {
  return new Intl.DateTimeFormat('fr-CM', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }).format(new Date(iso));
}

const STATUS_COLORS = {
  PENDING: 'text-brand-warning bg-brand-warning/10',
  CONFIRMED: 'text-brand-cta bg-brand-cta/10',
  CANCELLED: 'text-brand-danger bg-brand-danger/10',
  COMPLETED: 'text-brand-muted bg-brand-card',
};

export default function AdminDashboard() {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const [stats, setStats] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [countdown, setCountdown] = useState(REFRESH_INTERVAL);
  const timerRef = useRef(null);

  const hasFinancials = user?.role === 'SUPER_ADMIN' || user?.permissions?.includes('VIEW_FINANCIALS');

  const fetchData = async () => {
    try {
      const statsRes = await api.get('/admin/stats');
      setStats(statsRes.data);
      if (hasFinancials) {
        const bookingsRes = await api.get('/admin/recent-bookings');
        setBookings(bookingsRes.data);
      }
    } catch {
      // silently fail on auto-refresh
    } finally {
      setLoading(false);
      setCountdown(REFRESH_INTERVAL);
    }
  };

  useEffect(() => {
    fetchData();
    // Auto-refresh every 30s
    timerRef.current = setInterval(() => {
      fetchData();
    }, REFRESH_INTERVAL * 1000);
    return () => clearInterval(timerRef.current);
  }, []);

  // Countdown ticker
  useEffect(() => {
    const tick = setInterval(() => setCountdown((c) => (c > 0 ? c - 1 : REFRESH_INTERVAL)), 1000);
    return () => clearInterval(tick);
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-brand-cta border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-brand-text">{t('admin.dashboard')}</h1>
        <p className="text-xs text-brand-muted">{t('admin.refreshIn', { s: countdown })}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
        <StatCard label={t('admin.totalUsers')} value={stats?.users ?? 0} icon={Users} color="text-blue-400" />
        <StatCard label={t('admin.totalDrivers')} value={stats?.drivers ?? 0} icon={Car} color="text-brand-cta" />
        <StatCard label={t('admin.totalRides')} value={stats?.rides ?? 0} icon={ShoppingCart} color="text-brand-warning" />
        {hasFinancials ? (
          <StatCard label={t('admin.revenue')} value={formatXAF(stats?.revenue ?? 0)} icon={TrendingUp} color="text-emerald-400" />
        ) : (
          <div className="bg-brand-surface border border-brand-border rounded-2xl p-5 flex items-center gap-3 opacity-60">
            <Lock size={20} className="text-brand-muted" />
            <div>
              <p className="text-xs text-brand-muted">{t('admin.revenue')}</p>
              <p className="text-sm text-brand-muted italic">{t('admin.restrictedFinancials')}</p>
            </div>
          </div>
        )}
      </div>

      {/* Recent bookings table — only for users with VIEW_FINANCIALS */}
      {hasFinancials && (
        <div className="bg-brand-surface border border-brand-border rounded-2xl p-6 shadow-glass mb-6">
          <h2 className="font-semibold text-brand-text mb-4">{t('admin.recentBookings')}</h2>
          {bookings.length === 0 ? (
            <p className="text-brand-muted text-sm py-4 text-center">{t('admin.noBookings')}</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-brand-muted text-xs uppercase tracking-wider border-b border-brand-border">
                    <th className="text-left pb-3 pr-4">Passager</th>
                    <th className="text-left pb-3 pr-4">Trajet</th>
                    <th className="text-left pb-3 pr-4">Montant</th>
                    <th className="text-left pb-3 pr-4">Statut</th>
                    <th className="text-left pb-3">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brand-border">
                  {bookings.map((b) => (
                    <tr key={b.id} className="hover:bg-brand-card/50 transition-colors">
                      <td className="py-3 pr-4">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-brand-card flex items-center justify-center text-xs font-bold text-brand-text shrink-0">
                            {b.passenger?.name?.[0] ?? '?'}
                          </div>
                          <span className="text-brand-text truncate max-w-[120px]">{b.passenger?.name ?? '—'}</span>
                          {b.passenger?.isVerified && <BadgeCheck size={12} className="text-brand-cta shrink-0" />}
                        </div>
                      </td>
                      <td className="py-3 pr-4 text-brand-muted whitespace-nowrap">
                        {b.ride ? `${b.ride.originCity} → ${b.ride.destinationCity}` : '—'}
                      </td>
                      <td className="py-3 pr-4 text-brand-cta font-semibold whitespace-nowrap">
                        {formatXAF(b.totalPrice)}
                      </td>
                      <td className="py-3 pr-4">
                        <span className={`text-xs font-semibold px-2 py-1 rounded-full ${STATUS_COLORS[b.status] ?? ''}`}>
                          {b.status}
                        </span>
                      </td>
                      <td className="py-3 text-brand-muted whitespace-nowrap">{formatDate(b.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Quick stats */}
      <div className="bg-brand-surface border border-brand-border rounded-2xl p-6 shadow-glass">
        <h2 className="font-semibold text-brand-text mb-4">{t('admin.recentActivity')}</h2>
        <div className="space-y-3">
          {[
            { label: t('admin.totalBookings'), value: stats?.bookings ?? 0 },
            { label: t('admin.activeDrivers'), value: stats?.drivers ?? 0 },
            ...(hasFinancials ? [{ label: t('admin.revenue'), value: formatXAF(stats?.revenue ?? 0) }] : []),
          ].map(({ label, value }) => (
            <div key={label} className="flex justify-between py-2 border-b border-brand-border last:border-0">
              <span className="text-brand-muted text-sm">{label}</span>
              <span className="text-brand-text font-semibold">{value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
