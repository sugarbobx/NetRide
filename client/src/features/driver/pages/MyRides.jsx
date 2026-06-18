import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import {
  Plus, Car, Users, Clock, ChevronDown, ChevronUp, CheckCircle,
  Loader2, Download, Pencil, TrendingUp, Wallet, Timer,
} from 'lucide-react';
import api from '../../../lib/api';
import BookingRequestCard from '../components/BookingRequestCard';
import SeatMap from '../components/SeatMap';
import { useToast } from '../../../shared/components/Toast';

const STATUS_COLORS = {
  ACTIVE: 'text-brand-cta bg-brand-cta/10 border-brand-cta/30',
  CANCELLED: 'text-brand-danger bg-brand-danger/10 border-brand-danger/30',
  COMPLETED: 'text-brand-muted bg-brand-card border-brand-border',
};

function formatXAF(amount) {
  return new Intl.NumberFormat('fr-CM', { style: 'currency', currency: 'XAF', maximumFractionDigits: 0 }).format(amount);
}

// Feature 14: Earnings stat card
function EarningCard({ label, value, icon: Icon, accent }) {
  return (
    <div className="bg-brand-surface border border-brand-border rounded-xl p-4">
      <div className="flex items-center gap-2 mb-1">
        <Icon size={14} className={accent} />
        <p className="text-xs text-brand-muted font-medium">{label}</p>
      </div>
      <p className={`text-lg font-bold ${accent}`}>{value}</p>
    </div>
  );
}

export default function MyRides() {
  const { t } = useTranslation();
  const toast = useToast();
  const [rides, setRides] = useState([]);
  const [earnings, setEarnings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);
  const [completing, setCompleting] = useState(null);
  const [downloadingManifest, setDownloadingManifest] = useState(null);
  const [editingSeats, setEditingSeats] = useState(null);
  const [seatInput, setSeatInput] = useState('');
  const [seatLoading, setSeatLoading] = useState(false);
  const [showSeatMap, setShowSeatMap] = useState(null);
  const [activeTab, setActiveTab] = useState('rides');

  const fetchAll = async () => {
    try {
      const [{ data: ridesData }, { data: earningsData }] = await Promise.all([
        api.get('/rides/driver/mine'),
        api.get('/rides/driver/earnings'),
      ]);
      setRides(ridesData);
      setEarnings(earningsData);
    } catch {
      // rides or earnings fetch failed — keep whatever loaded
    } finally {
      setLoading(false);
    }
  };

  useEffect(fetchAll, []);

  const handleComplete = async (rideId) => {
    setCompleting(rideId);
    try {
      await api.patch(`/rides/${rideId}/complete`);
      fetchAll();
      toast(t('ride.status.COMPLETED'), 'success');
    } catch (err) {
      toast(err.response?.data?.error ?? t('common.error'), 'error');
    } finally { setCompleting(null); }
  };

  // Feature 19: Manifest download
  const handleManifest = async (rideId) => {
    setDownloadingManifest(rideId);
    try {
      const res = await api.get(`/rides/${rideId}/manifest/download`, { responseType: 'blob' });
      const url = URL.createObjectURL(res.data);
      const a = document.createElement('a');
      a.href = url; a.download = `manifeste-${rideId.slice(0, 8)}.txt`; a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast('Erreur téléchargement manifeste', 'error');
    } finally { setDownloadingManifest(null); }
  };

  // Feature 17: Update seat count
  const handleSeatUpdate = async (rideId) => {
    const n = parseInt(seatInput);
    if (isNaN(n) || n < 0) { toast('Nombre invalide', 'error'); return; }
    setSeatLoading(true);
    try {
      await api.patch(`/rides/${rideId}/seats`, { seatsAvailable: n });
      toast('Places mises à jour', 'success');
      setEditingSeats(null);
      fetchAll();
    } catch (err) {
      toast(err.response?.data?.error ?? t('common.error'), 'error');
    } finally { setSeatLoading(false); }
  };

  if (loading) return (
    <div className="min-h-screen bg-brand-bg flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-brand-cta border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-brand-bg pt-24 pb-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-brand-text">{t('nav.myRides')}</h1>
          <Link to="/driver/rides/new" className="flex items-center gap-2 bg-brand-cta hover:bg-brand-cta-hover text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors cursor-pointer shadow-cta">
            <Plus size={16} /> {t('nav.newRide')}
          </Link>
        </div>

        {/* Tab switcher */}
        <div className="flex gap-1 bg-brand-surface border border-brand-border rounded-xl p-1 mb-5">
          {[{ key: 'rides', label: 'Mes trajets' }, { key: 'earnings', label: 'Revenus' }].map(({ key, label }) => (
            <button key={key} onClick={() => setActiveTab(key)}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer
                ${activeTab === key ? 'bg-brand-card text-brand-text' : 'text-brand-muted hover:text-brand-text'}`}>
              {label}
            </button>
          ))}
        </div>

        {/* ── Earnings Tab (Feature 14) ── */}
        {activeTab === 'earnings' && earnings && (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              <EarningCard label="Total" value={formatXAF(earnings.total)} icon={TrendingUp} accent="text-brand-cta" />
              <EarningCard label="Encaissé" value={formatXAF(earnings.paid)} icon={Wallet} accent="text-brand-cta" />
              <EarningCard label="En attente" value={formatXAF(earnings.pending)} icon={Timer} accent="text-brand-warning" />
            </div>

            {Object.keys(earnings.byMonth).length > 0 && (
              <div className="bg-brand-surface border border-brand-border rounded-2xl p-5 shadow-glass">
                <p className="text-sm font-semibold text-brand-muted uppercase tracking-wider mb-4">Par mois</p>
                <div className="space-y-2">
                  {Object.entries(earnings.byMonth).sort((a, b) => b[0].localeCompare(a[0])).map(([month, amount]) => (
                    <div key={month} className="flex justify-between items-center text-sm">
                      <span className="text-brand-muted">{month}</span>
                      <span className="font-bold text-brand-cta">{formatXAF(amount)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {earnings.recentBookings.length > 0 && (
              <div className="bg-brand-surface border border-brand-border rounded-2xl p-5 shadow-glass">
                <p className="text-sm font-semibold text-brand-muted uppercase tracking-wider mb-4">Réservations récentes</p>
                <div className="space-y-2">
                  {earnings.recentBookings.map((b) => (
                    <div key={b.id} className="flex justify-between items-center text-sm py-2 border-b border-brand-border last:border-0">
                      <span className="text-brand-muted">{b.ride?.originCity} → {b.ride?.destinationCity}</span>
                      <span className="font-bold text-brand-cta">{formatXAF(b.totalPrice)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Rides Tab ── */}
        {activeTab === 'rides' && (
          rides.length === 0 ? (
            <div className="text-center py-20 text-brand-muted">
              <div className="w-16 h-16 rounded-full bg-brand-surface border border-brand-border flex items-center justify-center mx-auto mb-4">
                <Car size={28} className="opacity-40" />
              </div>
              <p className="font-medium text-brand-text mb-2">{t('driver.noRides')}</p>
              <p className="text-sm mb-5">Proposez votre premier trajet dès maintenant.</p>
              <Link to="/driver/rides/new" className="inline-flex items-center gap-2 bg-brand-cta hover:bg-brand-cta-hover text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors cursor-pointer shadow-cta">
                <Plus size={15} /> {t('driver.createRide')}
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {rides.map((ride) => (
                <div key={ride.id} className="bg-brand-surface border border-brand-border rounded-2xl shadow-glass overflow-hidden">
                  <div className="p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="font-semibold text-brand-text">{ride.originCity} → {ride.destinationCity}</p>
                        {ride.waypoints?.length > 0 && (
                          <p className="text-xs text-brand-muted mt-0.5">Via {ride.waypoints.join(', ')}</p>
                        )}
                        <div className="flex items-center gap-3 mt-1 text-sm text-brand-muted">
                          <span className="flex items-center gap-1"><Clock size={13} />{new Date(ride.departureAt).toLocaleString('fr-CM')}</span>
                          <span className="flex items-center gap-1"><Users size={13} />{ride.seatsAvailable}/{ride.seatsTotal}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-brand-cta">{formatXAF(ride.pricePerSeat)}<span className="text-brand-muted text-xs font-normal">/place</span></p>
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${STATUS_COLORS[ride.status]}`}>
                          {t(`ride.status.${ride.status}`)}
                        </span>
                      </div>
                    </div>

                    {/* Action row */}
                    <div className="flex flex-wrap items-center gap-3 mt-2">
                      {ride.status === 'ACTIVE' && (
                        <>
                          {/* Feature 20: Mark complete */}
                          <button onClick={() => handleComplete(ride.id)} disabled={completing === ride.id}
                            className="flex items-center gap-1.5 text-xs text-brand-muted hover:text-brand-cta transition-colors cursor-pointer disabled:opacity-50">
                            {completing === ride.id ? <Loader2 size={13} className="animate-spin" /> : <CheckCircle size={13} />}
                            {t('driver.markCompleted')}
                          </button>

                          {/* Feature 12: Seat map toggle */}
                          <button onClick={() => setShowSeatMap(showSeatMap === ride.id ? null : ride.id)}
                            className="flex items-center gap-1.5 text-xs text-brand-muted hover:text-brand-cta transition-colors cursor-pointer">
                            <Users size={13} /> Plan des sièges
                          </button>

                          {/* Feature 17: Edit seat count */}
                          {editingSeats === ride.id ? (
                            <div className="flex items-center gap-1.5">
                              <input type="number" min={0} value={seatInput} onChange={(e) => setSeatInput(e.target.value)}
                                className="w-16 bg-brand-card border border-brand-border rounded-lg px-2 py-1 text-xs text-brand-text focus:outline-none focus:border-brand-cta" />
                              <button onClick={() => handleSeatUpdate(ride.id)} disabled={seatLoading}
                                className="text-xs bg-brand-cta text-white px-2 py-1 rounded-lg cursor-pointer disabled:opacity-50">
                                {seatLoading ? '…' : 'OK'}
                              </button>
                              <button onClick={() => setEditingSeats(null)} className="text-xs text-brand-muted hover:text-brand-text cursor-pointer">✕</button>
                            </div>
                          ) : (
                            <button onClick={() => { setEditingSeats(ride.id); setSeatInput(String(ride.seatsAvailable)); }}
                              className="flex items-center gap-1.5 text-xs text-brand-muted hover:text-brand-cta transition-colors cursor-pointer">
                              <Pencil size={13} /> Modifier places
                            </button>
                          )}
                        </>
                      )}

                      {/* Feature 19: Manifest download */}
                      <button onClick={() => handleManifest(ride.id)} disabled={downloadingManifest === ride.id}
                        className="flex items-center gap-1.5 text-xs text-brand-muted hover:text-brand-cta transition-colors cursor-pointer disabled:opacity-50 ml-auto">
                        {downloadingManifest === ride.id ? <Loader2 size={13} className="animate-spin" /> : <Download size={13} />}
                        Manifeste
                      </button>
                    </div>

                    {/* Feature 12: Seat map */}
                    {showSeatMap === ride.id && (
                      <div className="mt-3 pt-3 border-t border-brand-border">
                        <SeatMap total={ride.seatsTotal} available={ride.seatsAvailable} />
                      </div>
                    )}

                    {ride.bookings?.length > 0 && (
                      <button onClick={() => setExpanded(expanded === ride.id ? null : ride.id)}
                        className="flex items-center gap-2 text-sm text-brand-muted hover:text-brand-text transition-colors cursor-pointer mt-2">
                        {expanded === ride.id ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                        {ride.bookings.length} réservation(s)
                      </button>
                    )}
                  </div>

                  {expanded === ride.id && (
                    <div className="border-t border-brand-border p-4 space-y-2 bg-brand-card/50">
                      <p className="text-xs font-semibold text-brand-muted uppercase tracking-wider mb-3">{t('driver.manifest')}</p>
                      {ride.bookings.map((b) => (
                        <BookingRequestCard key={b.id} booking={b} onUpdate={fetchAll} />
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )
        )}
      </div>
    </div>
  );
}
