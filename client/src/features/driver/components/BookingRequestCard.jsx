import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { User, Check, X, Loader2, AlertCircle } from 'lucide-react';
import api from '../../../lib/api';

const STATUS_COLORS = {
  PENDING: 'text-brand-warning bg-brand-warning/10 border-brand-warning/30',
  CONFIRMED: 'text-brand-cta bg-brand-cta/10 border-brand-cta/30',
  CANCELLED: 'text-brand-danger bg-brand-danger/10 border-brand-danger/30',
  COMPLETED: 'text-brand-muted bg-brand-card border-brand-border',
};

function formatXAF(amount) {
  return new Intl.NumberFormat('fr-CM', { style: 'currency', currency: 'XAF', maximumFractionDigits: 0 }).format(amount);
}

export default function BookingRequestCard({ booking, onUpdate }) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(null);
  const [error, setError] = useState('');

  const handleAction = async (action) => {
    setLoading(action);
    setError('');
    try {
      await api.patch(`/bookings/${booking.id}/${action}`);
      onUpdate?.();
    } catch (err) {
      setError(err.response?.data?.error ?? t('common.error'));
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="bg-brand-card border border-brand-border rounded-xl p-4 animate-fade-in">
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 rounded-full bg-brand-surface flex items-center justify-center text-brand-text font-bold shrink-0">
          {booking.passenger?.name?.[0] ?? <User size={16} />}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-brand-text truncate">{booking.passenger?.name}</p>
          <p className="text-brand-muted text-xs">{booking.seatsBooked} place(s) — {formatXAF(booking.totalPrice)}</p>
        </div>

        <span className={`text-xs font-semibold px-2 py-1 rounded-full border hidden sm:block ${STATUS_COLORS[booking.status]}`}>
          {t(`booking.status.${booking.status}`)}
        </span>

        {booking.status === 'PENDING' && (
          <div className="flex gap-2">
            <button onClick={() => handleAction('confirm')} disabled={!!loading}
              className="w-9 h-9 rounded-xl bg-brand-cta/10 border border-brand-cta/30 text-brand-cta hover:bg-brand-cta hover:text-white transition-colors cursor-pointer flex items-center justify-center disabled:opacity-50">
              {loading === 'confirm' ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
            </button>
            <button onClick={() => handleAction('cancel')} disabled={!!loading}
              className="w-9 h-9 rounded-xl bg-brand-danger/10 border border-brand-danger/30 text-brand-danger hover:bg-brand-danger hover:text-white transition-colors cursor-pointer flex items-center justify-center disabled:opacity-50">
              {loading === 'cancel' ? <Loader2 size={14} className="animate-spin" /> : <X size={14} />}
            </button>
          </div>
        )}
      </div>

      {error && (
        <p className="flex items-center gap-1.5 text-brand-danger text-xs mt-2">
          <AlertCircle size={12} /> {error}
        </p>
      )}
    </div>
  );
}
