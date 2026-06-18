import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Search, MapPin, Calendar, Users, ArrowLeftRight, SlidersHorizontal, BadgeCheck, Bus, Car, Shield } from 'lucide-react';
import api from '../../../lib/api';
import RideCard from '../components/RideCard';

const CAMEROON_CITIES = ['Douala', 'Yaoundé', 'Bafoussam', 'Bamenda', 'Garoua', 'Maroua', 'Ngaoundéré', 'Buea', 'Kumba', 'Bertoua', 'Ebolowa', 'Kribi'];

function RideSkeleton() {
  return (
    <div className="bg-brand-surface border border-brand-border rounded-2xl p-5 animate-pulse">
      <div className="flex gap-3 mb-4">
        <div className="flex flex-col items-center gap-1 pt-1">
          <div className="w-2.5 h-2.5 rounded-full bg-brand-card" />
          <div className="w-0.5 h-8 bg-brand-card" />
          <div className="w-2.5 h-2.5 rounded-full bg-brand-card" />
        </div>
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-brand-card rounded w-28" />
          <div className="h-3 bg-brand-card rounded w-20" />
          <div className="h-4 bg-brand-card rounded w-36" />
          <div className="h-3 bg-brand-card rounded w-24" />
        </div>
        <div className="h-6 bg-brand-card rounded w-20" />
      </div>
      <div className="flex gap-4 mb-4">
        <div className="h-4 bg-brand-card rounded w-32" />
        <div className="h-4 bg-brand-card rounded w-16" />
      </div>
      <div className="flex justify-between pt-3 border-t border-brand-border">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-brand-card" />
          <div>
            <div className="h-4 bg-brand-card rounded w-24 mb-1" />
            <div className="h-3 bg-brand-card rounded w-16" />
          </div>
        </div>
        <div className="h-4 bg-brand-card rounded w-16" />
      </div>
    </div>
  );
}

function BusRouteCard({ route }) {
  const depTime = new Intl.DateTimeFormat('fr-CM', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }).format(new Date(route.departureAt));
  const arrTime = new Intl.DateTimeFormat('fr-CM', { hour: '2-digit', minute: '2-digit' }).format(new Date(route.arrivalAt));

  return (
    <div className="bg-brand-surface border border-brand-border rounded-2xl p-5 shadow-glass animate-fade-in">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-brand-warning/10 flex items-center justify-center">
            <Bus size={16} className="text-brand-warning" />
          </div>
          <div>
            <p className="font-semibold text-brand-text text-sm">{route.company}</p>
            <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${route.busType === 'VIP' ? 'bg-brand-warning/10 text-brand-warning' : 'bg-brand-card text-brand-muted'}`}>{route.busType}</span>
          </div>
        </div>
        <p className="text-xl font-bold text-brand-cta">
          {new Intl.NumberFormat('fr-CM', { style: 'currency', currency: 'XAF', maximumFractionDigits: 0 }).format(route.pricePerSeat)}
        </p>
      </div>

      <div className="flex items-center gap-2 mb-3 text-sm">
        <div className="flex-1">
          <p className="font-medium text-brand-text">{route.originCity}</p>
          <p className="text-xs text-brand-muted">{route.pickupPoint}</p>
        </div>
        <div className="text-brand-muted text-xs">→</div>
        <div className="flex-1 text-right">
          <p className="font-medium text-brand-text">{route.destinationCity}</p>
          <p className="text-xs text-brand-muted">{route.dropoffPoint}</p>
        </div>
      </div>

      <div className="flex items-center justify-between text-xs text-brand-muted mb-3">
        <span>{depTime} — {arrTime}</span>
        <span>{route.seatsAvailable} place{route.seatsAvailable > 1 ? 's' : ''} dispo.</span>
      </div>

      {route.amenities?.length > 0 && (
        <div className="flex gap-1.5 flex-wrap mb-3">
          {route.amenities.map((a) => (
            <span key={a} className="text-xs bg-brand-card border border-brand-border px-2 py-0.5 rounded-full text-brand-muted">{a}</span>
          ))}
        </div>
      )}

      <button className="w-full py-2.5 rounded-xl bg-brand-warning/10 hover:bg-brand-warning/20 border border-brand-warning/30 text-brand-warning text-sm font-semibold transition-colors cursor-pointer">
        Réserver ce bus →
      </button>
    </div>
  );
}

export default function SearchRides() {
  const { t } = useTranslation();
  const [form, setForm] = useState({ origin: '', destination: '', date: '', seats: 1 });
  const [rides, setRides] = useState([]);
  const [busRoutes, setBusRoutes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [busLoading, setBusLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState('');
  const [validationError, setValidationError] = useState('');
  const [activeTab, setActiveTab] = useState('carpool'); // carpool | bus

  // Filters / sort
  const [sortBy, setSortBy] = useState('date');
  const [priceMin, setPriceMin] = useState('');
  const [priceMax, setPriceMax] = useState('');
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [womenOnly, setWomenOnly] = useState(false);

  const doSearch = useCallback(async (params) => {
    setLoading(true); setBusLoading(true);
    setError(''); setSearched(true);
    const busParams = {};
    if (params.origin) busParams.origin = params.origin;
    if (params.destination) busParams.destination = params.destination;
    if (params.date) busParams.date = params.date;

    try {
      const [ridesRes, busRes] = await Promise.allSettled([
        api.get('/rides', { params }),
        api.get('/buses', { params: busParams }),
      ]);
      if (ridesRes.status === 'fulfilled') setRides(ridesRes.value.data);
      else setError(t('common.error'));
      if (busRes.status === 'fulfilled') setBusRoutes(busRes.value.data);
    } finally {
      setLoading(false); setBusLoading(false);
    }
  }, [t]);

  useEffect(() => { doSearch({ seats: 1 }); }, [doSearch]);

  const handleSearch = (e) => {
    e.preventDefault();
    setValidationError('');
    if (form.origin && form.destination && form.origin === form.destination) {
      setValidationError(t('errors.sameCity'));
      return;
    }
    const params = { seats: form.seats };
    if (form.origin) params.origin = form.origin;
    if (form.destination) params.destination = form.destination;
    if (form.date) params.date = form.date;
    doSearch(params);
  };

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));
  const swapCities = () => setForm((f) => ({ ...f, origin: f.destination, destination: f.origin }));

  const displayRides = rides
    .filter((r) => !verifiedOnly || r.driver?.isVerified)
    .filter((r) => !womenOnly || r.driver?.gender === 'F')
    .filter((r) => !priceMin || r.pricePerSeat >= parseInt(priceMin))
    .filter((r) => !priceMax || r.pricePerSeat <= parseInt(priceMax))
    .sort((a, b) => {
      if (sortBy === 'price') return a.pricePerSeat - b.pricePerSeat;
      if (sortBy === 'rating') return (b.driver?.ratingAvg ?? 0) - (a.driver?.ratingAvg ?? 0);
      return new Date(a.departureAt) - new Date(b.departureAt);
    });

  const selectCls = 'w-full bg-brand-card border border-brand-border rounded-xl px-3 py-3 text-brand-text focus:outline-none focus:border-brand-cta transition-colors mt-1';

  return (
    <div className="min-h-screen bg-brand-bg pt-24 pb-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Hero */}
        <div className="text-center mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-brand-text mb-2">{t('search.title')}</h1>
          <p className="text-brand-muted">{t('app.tagline')}</p>
        </div>

        {/* Search Form */}
        <form onSubmit={handleSearch} className="bg-brand-surface border border-brand-border rounded-2xl p-5 shadow-glass mb-4 space-y-4">
          <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label>
                <span className="text-xs font-medium text-brand-muted mb-1 flex items-center gap-1"><MapPin size={12} /> {t('search.from')}</span>
                <select value={form.origin} onChange={set('origin')} className={selectCls}>
                  <option value="">— Toutes —</option>
                  {CAMEROON_CITIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </label>
              <label>
                <span className="text-xs font-medium text-brand-muted mb-1 flex items-center gap-1"><MapPin size={12} /> {t('search.to')}</span>
                <select value={form.destination} onChange={set('destination')} className={selectCls}>
                  <option value="">— Toutes —</option>
                  {CAMEROON_CITIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </label>
            </div>

            {(form.origin || form.destination) && (
              <button type="button" onClick={swapCities}
                className="flex items-center gap-1.5 text-xs text-brand-muted hover:text-brand-cta transition-colors cursor-pointer px-2 py-1 rounded-lg hover:bg-brand-card">
                <ArrowLeftRight size={13} /> {t('search.swap')}
              </button>
            )}
          </div>

          {validationError && <p className="text-brand-danger text-xs">{validationError}</p>}

          <div className="grid grid-cols-2 gap-4">
            <label>
              <span className="text-xs font-medium text-brand-muted mb-1 flex items-center gap-1"><Calendar size={12} /> {t('search.date')}</span>
              <input type="date" value={form.date} onChange={set('date')} min={new Date().toISOString().split('T')[0]}
                className={selectCls} />
            </label>
            <label>
              <span className="text-xs font-medium text-brand-muted mb-1 flex items-center gap-1"><Users size={12} /> {t('search.seats')}</span>
              <input type="number" min={1} max={8} value={form.seats} onChange={set('seats')} className={selectCls} />
            </label>
          </div>

          {/* Filters row */}
          <details className="group">
            <summary className="flex items-center gap-1.5 text-xs text-brand-muted hover:text-brand-text cursor-pointer select-none list-none">
              <SlidersHorizontal size={13} />
              {t('search.filters')}
              {(priceMin || priceMax || verifiedOnly || womenOnly) && (
                <span className="ml-1 px-1.5 py-0.5 bg-brand-cta/10 text-brand-cta rounded-full text-xs">
                  {[priceMin && '₣min', priceMax && '₣max', verifiedOnly && '✓', womenOnly && '♀'].filter(Boolean).join(' · ')}
                </span>
              )}
            </summary>
            <div className="mt-3 pt-3 border-t border-brand-border space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <label>
                  <span className="text-xs text-brand-muted block mb-1">{t('search.priceMin')}</span>
                  <input type="number" min={0} step={500} value={priceMin} onChange={(e) => setPriceMin(e.target.value)}
                    placeholder="0" className={selectCls + ' mt-0'} />
                </label>
                <label>
                  <span className="text-xs text-brand-muted block mb-1">{t('search.priceMax')}</span>
                  <input type="number" min={0} step={500} value={priceMax} onChange={(e) => setPriceMax(e.target.value)}
                    placeholder="∞" className={selectCls + ' mt-0'} />
                </label>
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={verifiedOnly} onChange={(e) => setVerifiedOnly(e.target.checked)}
                  className="w-4 h-4 rounded accent-brand-cta" />
                <span className="text-sm text-brand-text flex items-center gap-1">
                  <BadgeCheck size={14} className="text-brand-cta" /> {t('search.verifiedOnly')}
                </span>
              </label>
              {/* Women-only mode */}
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={womenOnly} onChange={(e) => setWomenOnly(e.target.checked)}
                  className="w-4 h-4 rounded accent-brand-cta" />
                <span className="text-sm text-brand-text flex items-center gap-1">
                  <Shield size={14} className="text-pink-400" />
                  <span>Mode Femme — conductrices uniquement</span>
                  <span className="text-xs text-pink-400 font-medium px-1.5 py-0.5 bg-pink-400/10 rounded-full">Nouveau</span>
                </span>
              </label>
            </div>
          </details>

          <button type="submit" disabled={loading}
            className="w-full bg-brand-cta hover:bg-brand-cta-hover disabled:opacity-60 text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-cta">
            <Search size={18} /> {loading ? t('common.loading') : t('search.search')}
          </button>
        </form>

        {error && <p className="text-brand-danger text-center mb-4">{error}</p>}

        {/* Tab switcher: Carpool vs Bus */}
        {searched && (
          <div className="flex gap-2 mb-4">
            <button onClick={() => setActiveTab('carpool')}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-colors cursor-pointer
                ${activeTab === 'carpool' ? 'bg-brand-cta text-white shadow-cta' : 'bg-brand-surface border border-brand-border text-brand-muted hover:text-brand-text'}`}>
              <Car size={15} /> Covoiturage
              {!loading && <span className="ml-1 text-xs opacity-70">({displayRides.length})</span>}
            </button>
            <button onClick={() => setActiveTab('bus')}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-colors cursor-pointer
                ${activeTab === 'bus' ? 'bg-brand-warning text-black shadow-cta' : 'bg-brand-surface border border-brand-border text-brand-muted hover:text-brand-text'}`}>
              <Bus size={15} /> Bus intercités
              {!busLoading && <span className="ml-1 text-xs opacity-70">({busRoutes.length})</span>}
            </button>
          </div>
        )}

        {/* Carpool tab */}
        {activeTab === 'carpool' && (
          <>
            {searched && !loading && (
              <div className="flex items-center justify-between mb-3">
                <p className="text-brand-muted text-sm">
                  {womenOnly && <span className="text-pink-400 font-medium mr-2">Mode Femme actif ·</span>}
                  {displayRides.length > 0 ? t('search.results', { count: displayRides.length }) : t('search.noResults')}
                </p>
                {rides.length > 0 && (
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-brand-muted">{t('search.sortBy')}:</span>
                    <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}
                      className="bg-brand-card border border-brand-border rounded-lg px-2 py-1 text-xs text-brand-text focus:outline-none focus:border-brand-cta cursor-pointer">
                      <option value="date">{t('search.sortDate')}</option>
                      <option value="price">{t('search.sortPrice')}</option>
                      <option value="rating">{t('search.sortRating')}</option>
                    </select>
                  </div>
                )}
              </div>
            )}

            {loading && <div className="space-y-3">{[1, 2, 3].map((i) => <RideSkeleton key={i} />)}</div>}

            {!loading && (
              <div className="space-y-3">
                {displayRides.map((ride) => <RideCard key={ride.id} ride={ride} womenOnly={womenOnly} />)}
                {searched && displayRides.length === 0 && (
                  <div className="text-center py-8 text-brand-muted text-sm">
                    {womenOnly ? 'Aucune conductrice disponible pour ce trajet. Essayez sans le filtre Femme.' : 'Aucun trajet ne correspond à vos filtres.'}
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {/* Bus tab */}
        {activeTab === 'bus' && (
          <>
            {busLoading && <div className="space-y-3">{[1, 2].map((i) => <RideSkeleton key={i} />)}</div>}
            {!busLoading && (
              <div className="space-y-3">
                {busRoutes.length === 0 ? (
                  <div className="text-center py-8 text-brand-muted text-sm">
                    Aucune ligne de bus disponible pour ce trajet.
                  </div>
                ) : (
                  busRoutes.map((r) => <BusRouteCard key={r.id} route={r} />)
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
