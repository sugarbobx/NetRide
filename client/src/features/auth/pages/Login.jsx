import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Car, Phone, KeyRound, User, Users } from 'lucide-react';
import api from '../../../lib/api';
import { useAuthStore } from '../../../lib/auth';
import LanguageToggle from '../../../shared/components/LanguageToggle';
import { detectOperator, isValidCamPhone } from '../../../lib/phoneUtils';

const STEPS = { PHONE: 'phone', OTP: 'otp', NAME: 'name', ROLE: 'role', VEHICLE: 'vehicle' };
const NEW_USER_STEPS = [STEPS.NAME, STEPS.ROLE, STEPS.VEHICLE];

function OperatorBadge({ operator }) {
  if (!operator) return null;
  const isMtn = operator === 'mtn';
  return (
    <span className={`absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold px-2 py-0.5 rounded-full
      ${isMtn ? 'bg-yellow-400/20 text-yellow-400 border border-yellow-400/40' : 'bg-orange-400/20 text-orange-400 border border-orange-400/40'}`}>
      {isMtn ? 'MTN' : 'Orange'}
    </span>
  );
}

function RoleCard({ icon: Icon, title, description, badge, selected, onClick }) {
  return (
    <button type="button" onClick={onClick}
      className={`relative w-full flex flex-col items-center gap-3 p-5 rounded-2xl border-2 transition-all duration-200 cursor-pointer text-center
        ${selected ? 'border-brand-cta bg-brand-cta/10' : 'border-brand-border bg-brand-card hover:border-brand-cta/40 hover:bg-brand-surface'}`}>
      {badge && (
        <span className="absolute top-2.5 right-2.5 text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-brand-cta/20 text-brand-cta border border-brand-cta/30">
          {badge}
        </span>
      )}
      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-colors duration-200
        ${selected ? 'bg-brand-cta shadow-cta' : 'bg-brand-surface'}`}>
        <Icon size={26} className={selected ? 'text-white' : 'text-brand-muted'} />
      </div>
      <div>
        <p className={`font-semibold text-sm transition-colors ${selected ? 'text-brand-cta' : 'text-brand-text'}`}>{title}</p>
        <p className="text-xs text-brand-muted mt-0.5 leading-relaxed">{description}</p>
      </div>
      <span className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all duration-200
        ${selected ? 'bg-brand-cta border-brand-cta' : 'border-brand-border'}`}>
        {selected && (
          <svg viewBox="0 0 10 8" className="w-2.5 h-2 fill-none stroke-white stroke-2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M1 4l3 3 5-5" />
          </svg>
        )}
      </span>
    </button>
  );
}

export default function Login() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();

  const [mode, setMode]       = useState('login'); // 'login' | 'signup'
  const [step, setStep]       = useState(STEPS.PHONE);
  const [phone, setPhone]     = useState('');
  const [otp, setOtp]         = useState('');
  const [name, setName]       = useState('');
  const [role, setRole]       = useState('PASSENGER');
  const [vehicle, setVehicle] = useState({ make: '', model: '', plate: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const [isMock, setIsMock]   = useState(false);

  const operator   = detectOperator(phone);
  const phoneValid = isValidCamPhone(phone);
  const isNewUserStep = NEW_USER_STEPS.includes(step);

  const handleSendOtp = async (e) => {
    e.preventDefault();
    if (!phoneValid) { setError('Numero invalide. Format : +237 6XX XXX XXX'); return; }
    setError(''); setLoading(true);
    try {
      const { data } = await api.post('/auth/send-otp', { phone: phone.replace(/\s/g, '') });
      setIsMock(data.mock);
      setStep(STEPS.OTP);
    } catch (err) {
      setError(err.response?.data?.error ?? t('common.error'));
    } finally { setLoading(false); }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const { data } = await api.post('/auth/verify-otp', { phone: phone.replace(/\s/g, ''), code: otp });
      if (data.firstLogin) { setStep(STEPS.NAME); return; }
      setAuth(data.token, data.user);
      redirectAfterAuth(data.user.role);
    } catch (err) {
      if (err.response?.data?.firstLogin) { setStep(STEPS.NAME); }
      else setError(err.response?.data?.error ?? t('common.error'));
    } finally { setLoading(false); }
  };

  const handleNameSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) { setError('Votre nom est requis'); return; }
    setError('');
    setStep(STEPS.ROLE);
  };

  const handleRoleSubmit = (e) => {
    e.preventDefault();
    if (role === 'DRIVER') { setStep(STEPS.VEHICLE); return; }
    finalizeRegistration(null);
  };

  const handleVehicleSubmit = (e) => {
    e.preventDefault();
    finalizeRegistration(vehicle);
  };

  const finalizeRegistration = async (vehicleData) => {
    setError(''); setLoading(true);
    try {
      const { data } = await api.post('/auth/verify-otp', {
        phone: phone.replace(/\s/g, ''),
        code: otp,
        name,
        role,
        ...(vehicleData ? { vehicle: vehicleData } : {}),
      });
      setAuth(data.token, data.user);
      redirectAfterAuth(data.user.role);
    } catch (err) {
      setError(err.response?.data?.error ?? t('common.error'));
      setStep(STEPS.NAME);
    } finally { setLoading(false); }
  };

  const redirectAfterAuth = (userRole) => {
    if (userRole === 'DRIVER') navigate('/driver/rides');
    else if (['SUPER_ADMIN', 'SUB_ADMIN'].includes(userRole)) navigate('/admin');
    else navigate('/');
  };

  const progressIndex = NEW_USER_STEPS.indexOf(step);

  const headingText = isNewUserStep ? 'Creer un compte'
    : step === STEPS.PHONE && mode === 'signup' ? 'Creer un compte'
    : t('auth.welcome');

  const subtitleText =
    step === STEPS.NAME    ? 'Comment vous appelez-vous ?' :
    step === STEPS.ROLE    ? 'Comment utiliserez-vous NetRide ?' :
    step === STEPS.VEHICLE ? 'Informations sur votre vehicule' :
    step === STEPS.OTP     ? 'Entrez le code recu par SMS' :
    mode === 'signup'      ? 'Rejoignez des milliers de voyageurs au Cameroun' :
    t('auth.subtitle');

  return (
    <div className="min-h-screen bg-brand-bg flex flex-col items-center justify-center px-4">
      <div className="absolute top-4 right-4"><LanguageToggle /></div>

      <div className="w-full max-w-sm animate-slide-up">

        {/* Logo + heading */}
        <div className="flex flex-col items-center mb-6">
          <div className="w-16 h-16 bg-brand-cta rounded-2xl flex items-center justify-center shadow-cta mb-4">
            <Car size={32} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-brand-text">{headingText}</h1>
          <p className="text-brand-muted text-sm mt-1 text-center">{subtitleText}</p>
        </div>

        {/* Se connecter / Creer un compte tab switcher — PHONE step only */}
        {step === STEPS.PHONE && (
          <div className="flex gap-1 bg-brand-surface border border-brand-border rounded-xl p-1 mb-4">
            <button type="button" onClick={() => { setMode('login'); setError(''); }}
              className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-colors cursor-pointer
                ${mode === 'login' ? 'bg-brand-cta text-white shadow-cta' : 'text-brand-muted hover:text-brand-text'}`}>
              Se connecter
            </button>
            <button type="button" onClick={() => { setMode('signup'); setError(''); }}
              className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-colors cursor-pointer
                ${mode === 'signup' ? 'bg-brand-cta text-white shadow-cta' : 'text-brand-muted hover:text-brand-text'}`}>
              Creer un compte
            </button>
          </div>
        )}

        {/* Progress dots (new-user steps only) */}
        {isNewUserStep && (
          <div className="flex items-center justify-center gap-2 mb-6">
            {NEW_USER_STEPS.map((s, i) => (
              <div key={s}
                className={`h-1.5 rounded-full transition-all duration-300
                  ${i === progressIndex ? 'w-6 bg-brand-cta'
                    : i < progressIndex ? 'w-4 bg-brand-cta/50'
                    : 'w-4 bg-brand-border'}`}
              />
            ))}
          </div>
        )}

        <div className="bg-brand-surface border border-brand-border rounded-2xl p-6 shadow-glass">

          {/* PHONE */}
          {step === STEPS.PHONE && (
            <form onSubmit={handleSendOtp} className="space-y-4">
              <label className="block">
                <span className="text-sm font-medium text-brand-muted mb-1.5 block">{t('auth.phone')}</span>
                <div className="relative">
                  <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-muted" />
                  <input type="tel" value={phone}
                    onChange={(e) => { setPhone(e.target.value); setError(''); }}
                    placeholder={t('auth.phonePlaceholder')}
                    className="w-full bg-brand-card border border-brand-border rounded-xl pl-9 pr-20 py-3 text-brand-text placeholder-brand-muted focus:outline-none focus:border-brand-cta transition-colors"
                    required />
                  <OperatorBadge operator={operator} />
                </div>
                {operator && (
                  <p className="text-xs text-brand-muted mt-1">
                    {operator === 'mtn' ? 'MTN Mobile Money' : 'Orange Money'} detecte
                  </p>
                )}
              </label>
              {error && <p className="text-brand-danger text-sm">{error}</p>}
              <button type="submit" disabled={loading || !phoneValid}
                className="w-full bg-brand-cta hover:bg-brand-cta-hover disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition-colors duration-200 cursor-pointer">
                {loading ? t('auth.sending') : (mode === 'signup' ? 'Commencer l\'inscription' : t('auth.sendOtp'))}
              </button>
            </form>
          )}

          {/* OTP */}
          {step === STEPS.OTP && (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              {isMock && (
                <div className="bg-brand-warning/10 border border-brand-warning/30 rounded-xl px-4 py-2.5 text-brand-warning text-sm">
                  {t('auth.mockHint')}
                </div>
              )}
              <label className="block">
                <span className="text-sm font-medium text-brand-muted mb-1.5 block">{t('auth.otpCode')}</span>
                <div className="relative">
                  <KeyRound size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-muted" />
                  <input type="text" value={otp} onChange={(e) => setOtp(e.target.value)}
                    placeholder={t('auth.otpPlaceholder')} maxLength={4}
                    className="w-full bg-brand-card border border-brand-border rounded-xl pl-9 pr-4 py-3 text-brand-text placeholder-brand-muted focus:outline-none focus:border-brand-cta transition-colors tracking-widest text-center text-xl"
                    required autoFocus />
                </div>
              </label>
              {error && <p className="text-brand-danger text-sm">{error}</p>}
              <button type="submit" disabled={loading}
                className="w-full bg-brand-cta hover:bg-brand-cta-hover disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition-colors cursor-pointer">
                {loading ? t('auth.verifying') : t('auth.verify')}
              </button>
              <button type="button" onClick={() => { setStep(STEPS.PHONE); setError(''); }}
                className="w-full text-brand-muted text-sm hover:text-brand-text transition-colors cursor-pointer">
                {t('common.back')}
              </button>
            </form>
          )}

          {/* NAME */}
          {step === STEPS.NAME && (
            <form onSubmit={handleNameSubmit} className="space-y-4">
              <label className="block">
                <span className="text-sm font-medium text-brand-muted mb-1.5 block">{t('auth.yourName')}</span>
                <div className="relative">
                  <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-muted" />
                  <input type="text" value={name} onChange={(e) => { setName(e.target.value); setError(''); }}
                    placeholder={t('auth.namePlaceholder')}
                    className="w-full bg-brand-card border border-brand-border rounded-xl pl-9 pr-4 py-3 text-brand-text placeholder-brand-muted focus:outline-none focus:border-brand-cta transition-colors"
                    required autoFocus />
                </div>
              </label>
              {error && <p className="text-brand-danger text-sm">{error}</p>}
              <button type="submit" disabled={!name.trim()}
                className="w-full bg-brand-cta hover:bg-brand-cta-hover disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition-colors cursor-pointer">
                Continuer
              </button>
            </form>
          )}

          {/* ROLE */}
          {step === STEPS.ROLE && (
            <form onSubmit={handleRoleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <RoleCard icon={Users} title="Passager"
                  description="Recherchez et reservez des trajets"
                  selected={role === 'PASSENGER'} onClick={() => setRole('PASSENGER')} />
                <RoleCard icon={Car} title="Conducteur"
                  description="Proposez vos trajets et gagnez de l'argent"
                  badge="Revenus"
                  selected={role === 'DRIVER'} onClick={() => setRole('DRIVER')} />
              </div>
              {role === 'DRIVER' && (
                <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl px-3.5 py-2.5 text-amber-400 text-xs leading-relaxed">
                  Votre compte sera active apres verification de vos documents par l'equipe NetRide.
                </div>
              )}
              <button type="submit"
                className="w-full bg-brand-cta hover:bg-brand-cta-hover text-white font-semibold py-3 rounded-xl transition-colors cursor-pointer">
                {role === 'DRIVER' ? 'Continuer' : 'Creer mon compte'}
              </button>
              <button type="button" onClick={() => { setStep(STEPS.NAME); setError(''); }}
                className="w-full text-brand-muted text-sm hover:text-brand-text transition-colors cursor-pointer">
                {t('common.back')}
              </button>
            </form>
          )}

          {/* VEHICLE */}
          {step === STEPS.VEHICLE && (
            <form onSubmit={handleVehicleSubmit} className="space-y-3">
              <div className="bg-brand-cta/10 border border-brand-cta/20 rounded-xl px-3.5 py-2.5 flex items-start gap-2">
                <Car size={15} className="text-brand-cta shrink-0 mt-0.5" />
                <p className="text-xs text-brand-cta leading-relaxed">
                  Ces infos seront visibles par les passagers qui reservent vos trajets.
                </p>
              </div>
              <label className="block">
                <span className="text-sm font-medium text-brand-muted mb-1.5 block">Marque</span>
                <input type="text" value={vehicle.make}
                  onChange={(e) => setVehicle((v) => ({ ...v, make: e.target.value }))}
                  placeholder="Ex: Toyota"
                  className="w-full bg-brand-card border border-brand-border rounded-xl px-4 py-3 text-brand-text placeholder-brand-muted focus:outline-none focus:border-brand-cta transition-colors"
                  autoFocus />
              </label>
              <label className="block">
                <span className="text-sm font-medium text-brand-muted mb-1.5 block">Modele</span>
                <input type="text" value={vehicle.model}
                  onChange={(e) => setVehicle((v) => ({ ...v, model: e.target.value }))}
                  placeholder="Ex: Corolla"
                  className="w-full bg-brand-card border border-brand-border rounded-xl px-4 py-3 text-brand-text placeholder-brand-muted focus:outline-none focus:border-brand-cta transition-colors" />
              </label>
              <label className="block">
                <span className="text-sm font-medium text-brand-muted mb-1.5 block">Plaque d'immatriculation</span>
                <input type="text" value={vehicle.plate}
                  onChange={(e) => setVehicle((v) => ({ ...v, plate: e.target.value.toUpperCase() }))}
                  placeholder="Ex: LT-4521-A"
                  className="w-full bg-brand-card border border-brand-border rounded-xl px-4 py-3 text-brand-text placeholder-brand-muted focus:outline-none focus:border-brand-cta transition-colors tracking-wider font-mono" />
              </label>
              {error && <p className="text-brand-danger text-sm">{error}</p>}
              <button type="submit" disabled={loading}
                className="w-full bg-brand-cta hover:bg-brand-cta-hover disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition-colors cursor-pointer mt-1">
                {loading ? t('common.loading') : 'Creer mon compte'}
              </button>
              <button type="button" onClick={() => finalizeRegistration(null)} disabled={loading}
                className="w-full text-brand-muted text-sm hover:text-brand-text transition-colors cursor-pointer disabled:opacity-50">
                Completer plus tard
              </button>
            </form>
          )}
        </div>

        {/* Hint below card on PHONE step */}
        {step === STEPS.PHONE && (
          <p className="text-center text-brand-muted text-xs mt-4">
            {mode === 'login'
              ? 'Pas encore de compte ? Cliquez sur "Creer un compte".'
              : 'Deja membre ? Cliquez sur "Se connecter".'}
          </p>
        )}
      </div>
    </div>
  );
}
