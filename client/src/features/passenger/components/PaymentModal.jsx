import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Smartphone, Loader2, CheckCircle, Banknote } from 'lucide-react';
import api from '../../../lib/api';

function formatXAF(amount) {
  return new Intl.NumberFormat('fr-CM', { style: 'currency', currency: 'XAF', maximumFractionDigits: 0 }).format(amount);
}

export default function PaymentModal({ booking, onClose, onSuccess }) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('idle'); // idle | pending | success | error
  const [error, setError] = useState('');

  const isCash = booking.paymentMethod === 'CASH';

  const handlePay = async () => {
    setLoading(true); setStatus('pending'); setError('');
    try {
      const { data } = await api.post('/payments/initiate', { bookingId: booking.id });
      if (data.status === 'CASH') {
        setStatus('success');
        return;
      }
      // Poll status every 3s up to 10 times (mock resolves immediately)
      let attempts = 0;
      const poll = async () => {
        attempts++;
        const { data: statusData } = await api.get(`/payments/status/${data.reference}`);
        if (statusData.status === 'SUCCESSFUL') { setStatus('success'); return; }
        if (attempts < 10) setTimeout(poll, 3000);
        else setStatus('error');
      };
      await poll();
    } catch (err) {
      setError(err.response?.data?.error ?? t('common.error'));
      setStatus('error');
    } finally { setLoading(false); }
  };

  if (status === 'success') {
    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4">
        <div className="w-full max-w-sm bg-brand-surface border border-brand-border rounded-2xl shadow-glass animate-slide-up">
          <div className="p-6 text-center space-y-4">
            <div className="w-16 h-16 bg-brand-cta/10 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle size={32} className="text-brand-cta" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-brand-text">{t('booking.successTitle')}</h3>
              <p className="text-brand-muted text-sm mt-1">
                {isCash ? 'Réservation confirmée. Payez le conducteur au départ.' : t('booking.successMessage')}
              </p>
            </div>
            <button onClick={onSuccess}
              className="w-full bg-brand-cta hover:bg-brand-cta-hover text-white font-semibold py-3 rounded-xl transition-colors cursor-pointer shadow-cta">
              {t('booking.viewMyBookings')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4">
      <div className="w-full max-w-sm bg-brand-surface border border-brand-border rounded-2xl shadow-glass animate-slide-up">
        <div className="flex items-center justify-between p-5 border-b border-brand-border">
          <h3 className="font-semibold text-brand-text">{t('booking.confirm')}</h3>
          <button onClick={onClose} className="text-brand-muted hover:text-brand-text transition-colors cursor-pointer"><X size={20} /></button>
        </div>

        <div className="p-5 space-y-4">
          <div className="bg-brand-card rounded-xl p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-brand-muted">{t('booking.seats')}</span>
              <span className="text-brand-text font-medium">{booking.seatsBooked}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-brand-muted text-sm">{t('booking.total')}</span>
              <span className="text-brand-cta font-bold text-lg">{formatXAF(booking.totalPrice)}</span>
            </div>
          </div>

          {/* Payment method badge */}
          <div className="flex gap-2">
            {isCash ? (
              <div className="flex-1 flex items-center gap-2 px-3 py-2.5 rounded-xl border border-brand-cta text-brand-cta bg-brand-cta/5 text-sm font-medium">
                <Banknote size={14} /> Espèces
              </div>
            ) : (
              ['MTN_MOMO', 'ORANGE_MONEY'].map((method) => (
                <div key={method} className={`flex-1 flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm font-medium ${booking.paymentMethod === method ? 'border-brand-cta text-brand-cta bg-brand-cta/5' : 'border-brand-border text-brand-muted'}`}>
                  <Smartphone size={14} />
                  {method === 'MTN_MOMO' ? 'MTN MoMo' : 'Orange Money'}
                </div>
              ))
            )}
          </div>

          {isCash && (
            <div className="bg-brand-warning/10 border border-brand-warning/30 rounded-xl px-4 py-3 text-brand-warning text-sm">
              Payez directement le conducteur lors du départ.
            </div>
          )}

          {status === 'pending' && (
            <div className="flex items-center gap-3 bg-brand-warning/10 border border-brand-warning/30 rounded-xl px-4 py-3">
              <Loader2 size={18} className="text-brand-warning animate-spin" />
              <span className="text-brand-warning text-sm">{t('booking.paymentInProgress')}</span>
            </div>
          )}

          {error && <p className="text-brand-danger text-sm">{error}</p>}

          <button onClick={handlePay} disabled={loading}
            className="w-full bg-brand-cta hover:bg-brand-cta-hover disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition-colors cursor-pointer">
            {loading ? <Loader2 size={18} className="animate-spin mx-auto" /> : isCash ? 'Confirmer la réservation' : t('booking.pay')}
          </button>
        </div>
      </div>
    </div>
  );
}
