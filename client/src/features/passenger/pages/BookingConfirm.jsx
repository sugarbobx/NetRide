import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, MapPin, Clock, Users, Star, BadgeCheck, Smartphone, Banknote, Package, Navigation, LogIn } from 'lucide-react';
import api from '../../../lib/api';
import { useAuthStore } from '../../../lib/auth';
import PaymentModal from '../components/PaymentModal';
import MapView from '../../../shared/components/MapView';

function formatXAF(amount) {
  return new Intl.NumberFormat('fr-CM', { style: 'currency', currency: 'XAF', maximumFractionDigits: 0 }).format(amount);
}

// Feature 6 & 31: Hardcoded city coordinates for Cameroon hubs
const CITY_COORDS = {
  Douala:     { lat: 4.0511,  lng: 9.7679 },
  Yaoundé:    { lat: 3.8480,  lng: 11.5021 },
  Bafoussam:  { lat: 5.4777,  lng: 10.4174 },
  Bamenda:    { lat: 5.9527,  lng: 10.1463 },
  Garoua:     { lat: 9.3015,  lng: 13.3923 },
  Maroua:     { lat: 10.5918, lng: 14.3155 },
  Ngaoundéré: { lat: 7.3239,  lng: 13.5833 },
  Buea:       { lat: 4.1527,  lng: 9.2422 },
  Kumba:      { lat: 4.6363,  lng: 9.4469 },
  Bertoua:    { lat: 4.5774,  lng: 13.6839 },
  Ebolowa:    { lat: 2.9000,  lng: 11.1500 },
  Kribi:      { lat: 2.9398,  lng: 9.9099 },
};

export default function BookingConfirm() {
  const { id } = useParams();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const [ride, setRide] = useState(null);
  const [loading, setLoading] = useState(true);
  const [seats, setSeats] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState('MTN_MOMO');
  const [booking, setBooking] = useState(null);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPayment, setShowPayment] = useState(false);

  useEffect(() => {
    api.get(`/rides/${id}`).then(({ data }) => setRide(data)).finally(() => setLoading(false));
  }, [id]);

  if (loading) return (
    <div className="min-h-screen bg-brand-bg flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-brand-cta border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!ride) return (
    <div className="min-h-screen bg-brand-bg flex flex-col items-center justify-center gap-4 text-brand-muted">
      <MapPin size={40} className="opacity-30" />
      <p>Trajet introuvable</p>
      <button onClick={() => navigate(-1)} className="text-brand-cta hover:underline cursor-pointer text-sm">{t('common.back')}</button>
    </div>
  );

  const total = ride.pricePerSeat * seats;

  const handleBook = async () => {
    if (!user) { navigate('/login'); return; }
    setBookingLoading(true); setError('');
    try {
      const { data } = await api.post('/bookings', { rideId: ride.id, seatsBooked: seats, paymentMethod });
      setBooking(data);
      setShowPayment(true);
    } catch (err) {
      setError(err.response?.data?.error ?? t('common.error'));
    } finally { setBookingLoading(false); }
  };

  const PAYMENT_OPTIONS = [
    { value: 'MTN_MOMO', label: 'MTN MoMo', icon: Smartphone },
    { value: 'ORANGE_MONEY', label: 'Orange Money', icon: Smartphone },
    { value: 'CASH', label: 'Espèces', icon: Banknote },
  ];

  // Feature 31: Map coordinates from city names
  const originCoords = CITY_COORDS[ride.originCity];
  const destCoords = CITY_COORDS[ride.destinationCity];

  return (
    <div className="min-h-screen bg-brand-bg pt-24 pb-12 px-4">
      <div className="max-w-lg mx-auto">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-brand-muted hover:text-brand-text mb-6 transition-colors cursor-pointer">
          <ArrowLeft size={18} /> {t('common.back')}
        </button>

        {/* Ride detail card */}
        <div className="bg-brand-surface border border-brand-border rounded-2xl p-5 shadow-glass mb-4">
          <div className="flex items-start gap-3 mb-4">
            <div className="flex flex-col items-center gap-1 pt-1">
              <div className="w-2.5 h-2.5 rounded-full bg-brand-cta" />
              <div className="w-0.5 h-10 bg-brand-border" />
              <div className="w-2.5 h-2.5 rounded-full border-2 border-brand-cta" />
            </div>
            <div className="flex-1">
              <div className="mb-3">
                <p className="font-semibold text-brand-text">{ride.originCity}</p>
                <p className="text-brand-muted text-sm">{ride.originAddress}</p>
              </div>
              {ride.waypoints?.length > 0 && (
                <div className="mb-3 flex flex-wrap gap-1">
                  {ride.waypoints.map((w) => (
                    <span key={w} className="text-xs bg-brand-card border border-brand-border text-brand-muted px-2 py-0.5 rounded-full">{w}</span>
                  ))}
                </div>
              )}
              <div>
                <p className="font-semibold text-brand-text">{ride.destinationCity}</p>
                <p className="text-brand-muted text-sm">{ride.destinationAddress}</p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-4 text-sm text-brand-muted mb-3">
            <span className="flex items-center gap-1"><Clock size={14} />{new Date(ride.departureAt).toLocaleString('fr-CM')}</span>
            <span className="flex items-center gap-1"><Users size={14} />{ride.seatsAvailable} dispo.</span>
            {ride.acceptsColis && (
              <span className="flex items-center gap-1 text-brand-warning"><Package size={14} /> Colis acceptés</span>
            )}
          </div>

          {ride.notes && (
            <p className="text-xs text-brand-muted bg-brand-card rounded-xl px-3 py-2">{ride.notes}</p>
          )}
        </div>

        {/* Feature 31: Map with origin/destination pins */}
        {(originCoords || destCoords) && (
          <div className="mb-4 rounded-2xl overflow-hidden border border-brand-border shadow-glass" style={{ height: '176px' }}>
            <MapView
              origin={originCoords ? { ...originCoords, label: `${ride.originCity} — ${ride.originAddress}` } : null}
              destination={destCoords ? { ...destCoords, label: `${ride.destinationCity} — ${ride.destinationAddress}` } : null}
              className="h-full"
            />
          </div>
        )}

        {/* Feature 28 & 29: Driver card linking to public profile */}
        <Link to={`/profile/${ride.driver?.id}`} className="block mb-4">
          <div className="bg-brand-surface border border-brand-border rounded-2xl p-4 shadow-glass flex items-center gap-3 hover:border-brand-cta/50 transition-colors">
            <div className="w-12 h-12 rounded-full bg-brand-card flex items-center justify-center text-brand-text font-bold text-lg">
              {ride.driver?.name?.[0] ?? '?'}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-1.5">
                <span className="font-semibold text-brand-text">{ride.driver?.name ?? 'Conducteur'}</span>
                {ride.driver?.isVerified && <BadgeCheck size={16} className="text-brand-cta" />}
              </div>
              {ride.driver?.ratingAvg != null && (
                <div className="flex items-center gap-1 text-brand-warning text-sm">
                  <Star size={13} fill="currentColor" />
                  <span>{ride.driver.ratingAvg.toFixed(1)} ({ride.driver.ratingCount} avis)</span>
                </div>
              )}
            </div>
            <Navigation size={14} className="text-brand-muted" />
          </div>
        </Link>

        {/* Booking form */}
        <div className="bg-brand-surface border border-brand-border rounded-2xl p-5 shadow-glass space-y-4">
          {/* Feature 23: Seat stepper with live total */}
          <div>
            <label className="text-sm font-medium text-brand-muted block mb-2">{t('booking.seats')}</label>
            <div className="flex items-center gap-3">
              <button type="button" onClick={() => setSeats(Math.max(1, seats - 1))}
                className="w-10 h-10 rounded-xl bg-brand-card border border-brand-border text-brand-text hover:border-brand-cta transition-colors cursor-pointer text-lg font-bold">−</button>
              <span className="text-brand-text font-bold text-xl w-8 text-center">{seats}</span>
              <button type="button" onClick={() => setSeats(Math.min(ride.seatsAvailable, seats + 1))}
                disabled={seats >= ride.seatsAvailable}
                className="w-10 h-10 rounded-xl bg-brand-card border border-brand-border text-brand-text hover:border-brand-cta transition-colors cursor-pointer text-lg font-bold disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:border-brand-border">+</button>
              {seats >= ride.seatsAvailable && <span className="text-xs text-brand-muted">max</span>}
            </div>
          </div>

          {/* Feature 24: Payment method selector */}
          <div>
            <label className="text-sm font-medium text-brand-muted block mb-2">{t('booking.paymentMethod')}</label>
            <div className="grid grid-cols-3 gap-2">
              {PAYMENT_OPTIONS.map(({ value, label, icon: Icon }) => (
                <button key={value} type="button" onClick={() => setPaymentMethod(value)}
                  className={`flex flex-col items-center gap-1 py-3 rounded-xl border text-xs font-medium transition-colors cursor-pointer
                    ${paymentMethod === value ? 'border-brand-cta text-brand-cta bg-brand-cta/5' : 'border-brand-border text-brand-muted hover:border-brand-cta/50'}`}>
                  <Icon size={16} />{label}
                </button>
              ))}
            </div>
            {paymentMethod !== 'CASH' && (
              <p className="text-xs text-brand-muted mt-2">Une invite USSD sera envoyée sur votre téléphone.</p>
            )}
          </div>

          <div className="flex justify-between pt-2 border-t border-brand-border">
            <span className="text-brand-muted">{t('booking.total')}</span>
            <span className="text-brand-cta font-bold text-xl">{formatXAF(total)}</span>
          </div>

          {error && <p className="text-brand-danger text-sm">{error}</p>}

          {!user ? (
            <Link to="/login"
              className="w-full flex items-center justify-center gap-2 bg-brand-cta hover:bg-brand-cta-hover text-white font-semibold py-3.5 rounded-xl transition-colors cursor-pointer shadow-cta">
              <LogIn size={18} /> Connectez-vous pour réserver
            </Link>
          ) : (
            <button onClick={handleBook} disabled={bookingLoading}
              className="w-full bg-brand-cta hover:bg-brand-cta-hover disabled:opacity-50 text-white font-semibold py-3.5 rounded-xl transition-colors cursor-pointer shadow-cta">
              {bookingLoading ? t('common.loading') : t('booking.pay')}
            </button>
          )}
        </div>
      </div>

      {showPayment && booking && (
        <PaymentModal
          booking={booking}
          onClose={() => setShowPayment(false)}
          onSuccess={() => { setShowPayment(false); navigate('/bookings'); }}
        />
      )}
    </div>
  );
}
