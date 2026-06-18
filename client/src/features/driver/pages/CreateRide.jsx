import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { MapPin, Clock, Users, DollarSign, FileText, ArrowLeft, Plus, X, ChevronRight, ChevronLeft, Package, RefreshCw, AlertCircle, Check } from 'lucide-react';
import api from '../../../lib/api';
import { useToast } from '../../../shared/components/Toast';

const CITIES = ['Douala', 'Yaoundé', 'Bafoussam', 'Bamenda', 'Garoua', 'Maroua', 'Ngaoundéré', 'Buea', 'Kumba', 'Bertoua', 'Ebolowa', 'Kribi'];

// Feature 18: Common Cameroonian pickup landmarks
const PICKUP_PRESETS = [
  'Rond-Point Deido', 'Bekoko Carrefour', 'Carrefour Bonabéri', 'Gare Mvan',
  'Carrefour Simbock', 'Marché Mokolo', 'Carrefour Nlongkak', 'Gare Routière Bafoussam',
  'Marché Central Bamenda', 'Carrefour Bonamoussadi', 'Akwa Palace',
];

const DAYS = [
  { v: 1, label: 'Lun' }, { v: 2, label: 'Mar' }, { v: 3, label: 'Mer' },
  { v: 4, label: 'Jeu' }, { v: 5, label: 'Ven' }, { v: 6, label: 'Sam' }, { v: 0, label: 'Dim' },
];

const inputCls = 'w-full bg-brand-card border border-brand-border rounded-xl px-4 py-3 text-brand-text placeholder-brand-muted focus:outline-none focus:border-brand-cta transition-colors mt-1';
const selectCls = inputCls;

function Field({ label, icon: Icon, children }) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-brand-muted mb-1.5 flex items-center gap-1.5">
        {Icon && <Icon size={13} />} {label}
      </span>
      {children}
    </label>
  );
}

function StepDot({ active, done, label }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-colors
        ${done ? 'bg-brand-cta border-brand-cta text-white' : active ? 'border-brand-cta text-brand-cta bg-brand-cta/10' : 'border-brand-border text-brand-muted'}`}>
        {done ? <Check size={14} /> : label}
      </div>
    </div>
  );
}

export default function CreateRide() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const toast = useToast();

  // Feature 8: 3-step state
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    originCity: '', originAddress: '', destinationCity: '', destinationAddress: '',
    departureAt: '', seatsTotal: 4, pricePerSeat: 3000, notes: '',
    waypoints: [], acceptsColis: false, isRecurring: false, daysOfWeek: [], pickupNote: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [priceSuggestion, setPriceSuggestion] = useState(null);
  const [waypointInput, setWaypointInput] = useState('');

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));

  // Feature 9: Fetch price suggestion when both cities are chosen
  useEffect(() => {
    if (form.originCity && form.destinationCity && form.originCity !== form.destinationCity) {
      api.get('/rides/price-suggestion', { params: { origin: form.originCity, destination: form.destinationCity } })
        .then(({ data }) => setPriceSuggestion(data.suggestion))
        .catch(() => setPriceSuggestion(null));
    } else {
      setPriceSuggestion(null);
    }
  }, [form.originCity, form.destinationCity]);

  // Feature 10: Waypoint management
  const addWaypoint = () => {
    const w = waypointInput.trim();
    if (w && !form.waypoints.includes(w)) {
      setForm((f) => ({ ...f, waypoints: [...f.waypoints, w] }));
    }
    setWaypointInput('');
  };
  const removeWaypoint = (w) => setForm((f) => ({ ...f, waypoints: f.waypoints.filter((x) => x !== w) }));

  const toggleDay = (v) => setForm((f) => ({
    ...f,
    daysOfWeek: f.daysOfWeek.includes(v) ? f.daysOfWeek.filter((d) => d !== v) : [...f.daysOfWeek, v],
  }));

  // Feature 9: Overprice warning
  const isOverpriced = priceSuggestion && parseInt(form.pricePerSeat) > priceSuggestion.max * 1.5;

  const validateStep1 = () => {
    if (!form.originCity || !form.destinationCity) return 'Choisissez les villes de départ et d\'arrivée';
    if (form.originCity === form.destinationCity) return t('errors.sameCity');
    if (!form.originAddress || !form.destinationAddress) return 'Renseignez les points de départ et d\'arrivée précis';
    if (!form.departureAt) return 'Choisissez l\'heure de départ';
    return null;
  };

  const validateStep2 = () => {
    if (!form.seatsTotal || form.seatsTotal < 1) return 'Au moins 1 place requise';
    if (!form.pricePerSeat || form.pricePerSeat < 100) return 'Prix minimum : 100 XAF';
    return null;
  };

  const goNext = () => {
    const err = step === 1 ? validateStep1() : validateStep2();
    if (err) { setError(err); return; }
    setError('');
    setStep((s) => s + 1);
  };

  const handleSubmit = async () => {
    setLoading(true); setError('');
    try {
      await api.post('/rides', {
        ...form,
        seatsTotal: parseInt(form.seatsTotal),
        pricePerSeat: parseInt(form.pricePerSeat),
        departureAt: new Date(form.departureAt).toISOString(),
      });
      toast(t('driver.publishSuccess'), 'success');
      navigate('/driver/rides');
    } catch (err) {
      setError(err.response?.data?.error ?? t('common.error'));
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-brand-bg pt-24 pb-12 px-4">
      <div className="max-w-lg mx-auto">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-brand-muted hover:text-brand-text mb-6 transition-colors cursor-pointer">
          <ArrowLeft size={18} /> {t('common.back')}
        </button>

        <h1 className="text-2xl font-bold text-brand-text mb-6">{t('driver.createRide')}</h1>

        {/* Step indicator */}
        <div className="flex items-center justify-center gap-3 mb-6">
          <StepDot active={step === 1} done={step > 1} label="1" />
          <div className={`flex-1 h-0.5 ${step > 1 ? 'bg-brand-cta' : 'bg-brand-border'} transition-colors max-w-12`} />
          <StepDot active={step === 2} done={step > 2} label="2" />
          <div className={`flex-1 h-0.5 ${step > 2 ? 'bg-brand-cta' : 'bg-brand-border'} transition-colors max-w-12`} />
          <StepDot active={step === 3} done={false} label="3" />
        </div>

        <div className="bg-brand-surface border border-brand-border rounded-2xl p-6 shadow-glass space-y-5">

          {/* ── Step 1: Route & Time ── */}
          {step === 1 && (
            <>
              <p className="text-sm font-semibold text-brand-muted uppercase tracking-wider">Itinéraire & Horaire</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label={t('driver.originCity')} icon={MapPin}>
                  <select value={form.originCity} onChange={set('originCity')} className={selectCls}>
                    <option value="">— Sélectionner —</option>
                    {CITIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </Field>
                <Field label={t('driver.destinationCity')} icon={MapPin}>
                  <select value={form.destinationCity} onChange={set('destinationCity')} className={selectCls}>
                    <option value="">— Sélectionner —</option>
                    {CITIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </Field>
              </div>

              {/* Feature 18: Pickup presets — select fills the text input, then resets */}
              <Field label={t('driver.originAddress')} icon={MapPin}>
                <select
                  value=""
                  onChange={(e) => { if (e.target.value) setForm((f) => ({ ...f, originAddress: e.target.value })); }}
                  className={selectCls}>
                  <option value="">— Choisir un point connu —</option>
                  {PICKUP_PRESETS.map((p) => <option key={p} value={p}>{p}</option>)}
                </select>
                <input value={form.originAddress} onChange={set('originAddress')} placeholder="ou saisissez manuellement"
                  className={inputCls + ' mt-2'} />
              </Field>

              <Field label={t('driver.destinationAddress')} icon={MapPin}>
                <input value={form.destinationAddress} onChange={set('destinationAddress')}
                  placeholder="Ex: Gare Mvan" className={inputCls} />
              </Field>

              {/* Feature 10: Waypoints */}
              <div>
                <span className="text-sm font-medium text-brand-muted mb-1.5 flex items-center gap-1.5">
                  <MapPin size={13} /> Étapes intermédiaires (optionnel)
                </span>
                <div className="flex gap-2 mt-1">
                  <input value={waypointInput} onChange={(e) => setWaypointInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addWaypoint())}
                    placeholder="Ex: Edéa, Boumnyébel…"
                    className="flex-1 bg-brand-card border border-brand-border rounded-xl px-3 py-2.5 text-sm text-brand-text placeholder-brand-muted focus:outline-none focus:border-brand-cta transition-colors" />
                  <button type="button" onClick={addWaypoint}
                    className="px-3 py-2.5 bg-brand-card border border-brand-border rounded-xl text-brand-muted hover:text-brand-cta hover:border-brand-cta transition-colors cursor-pointer">
                    <Plus size={16} />
                  </button>
                </div>
                {form.waypoints.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {form.waypoints.map((w) => (
                      <span key={w} className="flex items-center gap-1 text-xs bg-brand-cta/10 text-brand-cta border border-brand-cta/30 rounded-full px-2.5 py-1">
                        {w}
                        <button type="button" onClick={() => removeWaypoint(w)} className="cursor-pointer hover:opacity-70">
                          <X size={11} />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <Field label={t('driver.departureTime')} icon={Clock}>
                <input value={form.departureAt} onChange={set('departureAt')} type="datetime-local"
                  min={new Date().toISOString().slice(0, 16)} className={inputCls} required />
              </Field>
            </>
          )}

          {/* ── Step 2: Seats, Price & Options ── */}
          {step === 2 && (
            <>
              <p className="text-sm font-semibold text-brand-muted uppercase tracking-wider">Places & Tarif</p>

              <div className="grid grid-cols-2 gap-4">
                <Field label={t('driver.totalSeats')} icon={Users}>
                  <input value={form.seatsTotal} onChange={set('seatsTotal')} type="number" min={1} max={20}
                    className={inputCls} required />
                </Field>
                <Field label={t('driver.pricePerSeat')} icon={DollarSign}>
                  <input value={form.pricePerSeat} onChange={set('pricePerSeat')} type="number" min={100} step={100}
                    className={inputCls} required />
                </Field>
              </div>

              {/* Feature 9: Price suggestion */}
              {priceSuggestion && (
                <div className="bg-brand-card border border-brand-border rounded-xl p-3 text-sm space-y-1">
                  <p className="text-brand-muted font-medium">Prix suggéré pour {form.originCity} → {form.destinationCity} ({priceSuggestion.distance} km)</p>
                  <p className="text-brand-cta font-bold">
                    {new Intl.NumberFormat('fr-CM', { style: 'currency', currency: 'XAF', maximumFractionDigits: 0 }).format(priceSuggestion.min)}
                    {' – '}
                    {new Intl.NumberFormat('fr-CM', { style: 'currency', currency: 'XAF', maximumFractionDigits: 0 }).format(priceSuggestion.max)}
                  </p>
                  <button type="button" onClick={() => setForm((f) => ({ ...f, pricePerSeat: priceSuggestion.suggested }))}
                    className="text-xs text-brand-cta hover:underline cursor-pointer">
                    Utiliser {new Intl.NumberFormat('fr-CM', { style: 'currency', currency: 'XAF', maximumFractionDigits: 0 }).format(priceSuggestion.suggested)}
                  </button>
                </div>
              )}

              {/* Feature 9: Overprice warning */}
              {isOverpriced && (
                <div className="flex items-start gap-2 bg-brand-warning/10 border border-brand-warning/30 rounded-xl px-3 py-2.5 text-brand-warning text-sm">
                  <AlertCircle size={15} className="mt-0.5 shrink-0" />
                  <span>Prix élevé — un prix plus bas accélère les réservations.</span>
                </div>
              )}

              <Field label={t('driver.notes')} icon={FileText}>
                <textarea value={form.notes} onChange={set('notes')} rows={3}
                  placeholder="Ex: Climatisation, bagages limités…"
                  className="w-full bg-brand-card border border-brand-border rounded-xl px-4 py-3 text-brand-text placeholder-brand-muted focus:outline-none focus:border-brand-cta transition-colors mt-1 resize-none" />
              </Field>

              {/* Feature 15: Colis toggle */}
              <label className="flex items-center gap-3 p-3 bg-brand-card border border-brand-border rounded-xl cursor-pointer hover:border-brand-cta/50 transition-colors">
                <input type="checkbox" checked={form.acceptsColis} onChange={set('acceptsColis')} className="w-4 h-4 rounded accent-brand-cta" />
                <Package size={16} className="text-brand-muted" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-brand-text">Accepte les colis</p>
                  <p className="text-xs text-brand-muted">Livraison de paquets le long du trajet</p>
                </div>
                <span className="text-xs bg-brand-warning/20 text-brand-warning border border-brand-warning/30 rounded-full px-2 py-0.5 font-medium">
                  Bientôt disponible
                </span>
              </label>

              {/* Feature 16: Recurring trip */}
              <label className="flex items-center gap-3 p-3 bg-brand-card border border-brand-border rounded-xl cursor-pointer hover:border-brand-cta/50 transition-colors">
                <input type="checkbox" checked={form.isRecurring} onChange={set('isRecurring')} className="w-4 h-4 rounded accent-brand-cta" />
                <RefreshCw size={16} className="text-brand-muted" />
                <div>
                  <p className="text-sm font-medium text-brand-text">Trajet récurrent</p>
                  <p className="text-xs text-brand-muted">Se répète certains jours de la semaine</p>
                </div>
              </label>

              {form.isRecurring && (
                <div className="flex flex-wrap gap-2 pl-2">
                  {DAYS.map(({ v, label }) => (
                    <button key={v} type="button" onClick={() => toggleDay(v)}
                      className={`text-xs font-semibold px-3 py-1.5 rounded-lg border cursor-pointer transition-colors
                        ${form.daysOfWeek.includes(v) ? 'bg-brand-cta text-white border-brand-cta' : 'border-brand-border text-brand-muted hover:border-brand-cta/50'}`}>
                      {label}
                    </button>
                  ))}
                </div>
              )}
            </>
          )}

          {/* ── Step 3: Review & Publish ── */}
          {step === 3 && (
            <>
              <p className="text-sm font-semibold text-brand-muted uppercase tracking-wider">Récapitulatif</p>

              <div className="bg-brand-card border border-brand-border rounded-xl p-4 space-y-3 text-sm">
                <div className="flex gap-3 items-start">
                  <div className="flex flex-col items-center gap-1 pt-0.5">
                    <div className="w-2 h-2 rounded-full bg-brand-cta" />
                    <div className="w-0.5 h-6 bg-brand-border" />
                    <div className="w-2 h-2 rounded-full border-2 border-brand-cta" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-brand-text">{form.originCity}</p>
                    <p className="text-brand-muted text-xs">{form.originAddress}</p>
                    {form.waypoints.length > 0 && (
                      <p className="text-brand-muted text-xs mt-1">Via : {form.waypoints.join(' → ')}</p>
                    )}
                    <p className="font-semibold text-brand-text mt-2">{form.destinationCity}</p>
                    <p className="text-brand-muted text-xs">{form.destinationAddress}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-brand-border text-brand-muted">
                  <span>Départ</span>
                  <span className="text-brand-text font-medium">{form.departureAt ? new Date(form.departureAt).toLocaleString('fr-CM') : '—'}</span>
                  <span>Places</span>
                  <span className="text-brand-text font-medium">{form.seatsTotal}</span>
                  <span>Prix/place</span>
                  <span className="text-brand-cta font-bold">
                    {new Intl.NumberFormat('fr-CM', { style: 'currency', currency: 'XAF', maximumFractionDigits: 0 }).format(form.pricePerSeat)}
                  </span>
                  {form.acceptsColis && <><span>Colis</span><span className="text-brand-text font-medium">Oui</span></>}
                  {form.isRecurring && <><span>Récurrent</span><span className="text-brand-text font-medium">{form.daysOfWeek.map((d) => DAYS.find((x) => x.v === d)?.label).join(', ')}</span></>}
                </div>

                <div className="pt-2 border-t border-brand-border flex justify-between">
                  <span className="text-brand-muted">Revenu max estimé</span>
                  <span className="text-brand-cta font-bold">
                    {new Intl.NumberFormat('fr-CM', { style: 'currency', currency: 'XAF', maximumFractionDigits: 0 }).format(form.pricePerSeat * form.seatsTotal)}
                  </span>
                </div>
              </div>
            </>
          )}

          {error && <p className="text-brand-danger text-sm flex items-center gap-1.5"><AlertCircle size={14} />{error}</p>}

          {/* Navigation buttons */}
          <div className="flex gap-3 pt-1">
            {step > 1 && (
              <button type="button" onClick={() => { setError(''); setStep((s) => s - 1); }}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border border-brand-border text-brand-muted hover:text-brand-text hover:bg-brand-card transition-colors cursor-pointer font-medium">
                <ChevronLeft size={16} /> Précédent
              </button>
            )}
            {step < 3 ? (
              <button type="button" onClick={goNext}
                className="flex-1 flex items-center justify-center gap-2 bg-brand-cta hover:bg-brand-cta-hover text-white font-semibold py-3 rounded-xl transition-colors cursor-pointer shadow-cta">
                Suivant <ChevronRight size={16} />
              </button>
            ) : (
              <button type="button" onClick={handleSubmit} disabled={loading}
                className="flex-1 bg-brand-cta hover:bg-brand-cta-hover disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition-colors cursor-pointer shadow-cta">
                {loading ? t('common.loading') : t('driver.publish')}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
