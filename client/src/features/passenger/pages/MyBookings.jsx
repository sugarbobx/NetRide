import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Calendar, MapPin, Clock, BadgeCheck, X, Star } from 'lucide-react';
import api from '../../../lib/api';
import { useToast } from '../../../shared/components/Toast';
import SOSButton from '../../../shared/components/SOSButton';

const STATUS_COLORS = {
  PENDING:   'text-brand-warning bg-brand-warning/10 border-brand-warning/30',
  CONFIRMED: 'text-brand-cta bg-brand-cta/10 border-brand-cta/30',
  CANCELLED: 'text-brand-danger bg-brand-danger/10 border-brand-danger/30',
  COMPLETED: 'text-brand-muted bg-brand-card border-brand-border',
};

const PAY_COLORS = {
  PENDING: 'text-brand-warning',
  PAID:    'text-brand-cta',
  FAILED:  'text-brand-danger',
};

function formatXAF(amount) {
  return new Intl.NumberFormat('fr-CM', { style: 'currency', currency: 'XAF', maximumFractionDigits: 0 }).format(amount);
}

function CancelDialog({ onConfirm, onCancel, loading }) {
  const { t } = useTranslation();
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-brand-surface border border-brand-border rounded-2xl shadow-glass p-6">
        <h3 className="font-semibold text-brand-text mb-2">{t('booking.cancelTitle')}</h3>
        <p className="text-brand-muted text-sm mb-5">{t('booking.cancelConfirm')}</p>
        <div className="flex gap-3">
          <button onClick={onCancel} disabled={loading}
            className="flex-1 py-2.5 rounded-xl border border-brand-border text-brand-muted hover:text-brand-text hover:bg-brand-card transition-colors cursor-pointer text-sm font-medium">
            {t('common.cancel')}
          </button>
          <button onClick={onConfirm} disabled={loading}
            className="flex-1 py-2.5 rounded-xl bg-brand-danger text-white hover:opacity-90 transition-opacity cursor-pointer text-sm font-medium disabled:opacity-50">
            {loading ? t('common.loading') : t('common.confirm')}
          </button>
        </div>
      </div>
    </div>
  );
}

// Feature 27: Interactive star rating + review submission form
function ReviewForm({ booking, onDone }) {
  const toast = useToast();
  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!rating) return;
    setLoading(true);
    try {
      await api.post(`/users/${booking.ride.driver.id}/reviews`, {
        rideId: booking.rideId,
        rating,
        comment: comment.trim() || undefined,
      });
      toast('Avis envoyé — merci !', 'success');
      onDone();
    } catch (err) {
      toast(err.response?.data?.error ?? 'Erreur envoi avis', 'error');
    } finally { setLoading(false); }
  };

  return (
    <div className="mt-3 pt-3 border-t border-brand-border space-y-3 animate-fade-in">
      <p className="text-xs font-semibold text-brand-muted uppercase tracking-wider">Évaluez ce trajet</p>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((s) => (
          <button key={s} type="button"
            onClick={() => setRating(s)}
            onMouseEnter={() => setHovered(s)}
            onMouseLeave={() => setHovered(0)}
            className="cursor-pointer transition-transform hover:scale-110">
            <Star size={24}
              className={(hovered || rating) >= s ? 'text-brand-warning' : 'text-brand-border'}
              fill={(hovered || rating) >= s ? 'currentColor' : 'none'} />
          </button>
        ))}
      </div>
      <textarea value={comment} onChange={(e) => setComment(e.target.value)} rows={2}
        placeholder="Commentaire optionnel…"
        className="w-full bg-brand-card border border-brand-border rounded-xl px-3 py-2 text-sm text-brand-text placeholder-brand-muted focus:outline-none focus:border-brand-cta resize-none" />
      <button onClick={submit} disabled={!rating || loading}
        className="w-full py-2.5 bg-brand-cta hover:bg-brand-cta-hover disabled:opacity-50 text-white text-sm font-semibold rounded-xl cursor-pointer transition-colors">
        {loading ? 'Envoi…' : 'Soumettre l\'avis'}
      </button>
    </div>
  );
}

export default function MyBookings() {
  const { t } = useTranslation();
  const toast = useToast();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cancelTarget, setCancelTarget] = useState(null);
  const [cancelling, setCancelling] = useState(false);
  const [reviewedIds, setReviewedIds] = useState(new Set());
  const [showReview, setShowReview] = useState(null);

  const fetchBookings = () => {
    api.get('/bookings/mine').then(({ data }) => setBookings(data)).finally(() => setLoading(false));
  };

  useEffect(fetchBookings, []);

  const handleCancel = async () => {
    if (!cancelTarget) return;
    setCancelling(true);
    try {
      await api.patch(`/bookings/${cancelTarget}/cancel`);
      toast(t('booking.cancelSuccess'), 'success');
      setCancelTarget(null);
      fetchBookings();
    } catch (err) {
      toast(err.response?.data?.error ?? t('common.error'), 'error');
    } finally { setCancelling(false); }
  };

  if (loading) return (
    <div className="min-h-screen bg-brand-bg flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-brand-cta border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-brand-bg pt-24 pb-12 px-4">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold text-brand-text mb-6">{t('nav.myBookings')}</h1>

        {bookings.length === 0 ? (
          <div className="text-center py-20 text-brand-muted">
            <div className="w-16 h-16 rounded-full bg-brand-surface border border-brand-border flex items-center justify-center mx-auto mb-4">
              <Calendar size={28} className="opacity-40" />
            </div>
            <p className="font-medium text-brand-text mb-1">{t('booking.noBookings')}</p>
            <p className="text-sm">Vos réservations apparaîtront ici.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {bookings.map((b) => {
              const ride = b.ride;
              if (!ride) return (
                <div key={b.id} className="bg-brand-surface border border-brand-border rounded-2xl p-5 shadow-glass opacity-50">
                  <p className="text-brand-muted text-sm italic">Trajet supprimé</p>
                </div>
              );
              const canReview = b.status === 'COMPLETED' && !reviewedIds.has(b.id);

              return (
                <div key={b.id} className="bg-brand-surface border border-brand-border rounded-2xl p-5 shadow-glass animate-fade-in">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <MapPin size={16} className="text-brand-cta mt-0.5" />
                      <div>
                        <p className="font-semibold text-brand-text">
                          {ride.originCity ?? '?'} → {ride.destinationCity ?? '?'}
                        </p>
                        <p className="text-brand-muted text-xs flex items-center gap-1 mt-0.5">
                          <Clock size={11} />{new Date(ride.departureAt).toLocaleString('fr-CM')}
                        </p>
                      </div>
                    </div>
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${STATUS_COLORS[b.status]}`}>
                      {t(`booking.status.${b.status}`)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-brand-border">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-brand-card flex items-center justify-center text-xs font-bold text-brand-text">
                        {ride.driver?.name?.[0] ?? '?'}
                      </div>
                      <div className="flex items-center gap-1 text-sm text-brand-text">
                        {ride.driver?.name ?? 'Conducteur inconnu'}
                        {ride.driver?.isVerified && <BadgeCheck size={12} className="text-brand-cta" />}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {b.status === 'PENDING' && (
                        <button onClick={() => setCancelTarget(b.id)}
                          className="flex items-center gap-1 text-xs text-brand-danger hover:opacity-70 transition-opacity cursor-pointer">
                          <X size={12} /> {t('booking.cancelTitle')}
                        </button>
                      )}
                      <div className="text-right">
                        <p className="font-bold text-brand-cta">{formatXAF(b.totalPrice)}</p>
                        <p className={`text-xs ${PAY_COLORS[b.paymentStatus]}`}>{t(`booking.paymentStatus.${b.paymentStatus}`)}</p>
                      </div>
                    </div>
                  </div>

                  {/* Feature 27: Review button unlocked only for COMPLETED bookings */}
                  {canReview && showReview !== b.id && (
                    <div className="mt-3 pt-3 border-t border-brand-border">
                      <button onClick={() => setShowReview(b.id)}
                        className="flex items-center gap-2 text-sm text-brand-cta hover:underline cursor-pointer">
                        <Star size={14} /> Laisser un avis
                      </button>
                    </div>
                  )}

                  {showReview === b.id && (
                    <ReviewForm
                      booking={b}
                      onDone={() => {
                        setReviewedIds((s) => new Set([...s, b.id]));
                        setShowReview(null);
                      }}
                    />
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {cancelTarget && (
        <CancelDialog
          onConfirm={handleCancel}
          onCancel={() => setCancelTarget(null)}
          loading={cancelling}
        />
      )}

      {/* SOS floating button for active (CONFIRMED) bookings */}
      {(() => {
        const activeBooking = bookings.find((b) => b.status === 'CONFIRMED' && b.ride?.status === 'ACTIVE');
        return activeBooking ? <SOSButton rideId={activeBooking.rideId} /> : null;
      })()}
    </div>
  );
}
