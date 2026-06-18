import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { User, Phone, Mail, FileText, Star, BadgeCheck, Wallet, Zap, Leaf, Plus, Trash2, Loader } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../../../lib/auth';
import api from '../../../lib/api';
import { useToast } from '../../../shared/components/Toast';
import TrustScoreBadge from '../../../shared/components/TrustScoreBadge';

function formatXAF(n) {
  return new Intl.NumberFormat('fr-CM', { style: 'currency', currency: 'XAF', maximumFractionDigits: 0 }).format(n ?? 0);
}

export default function Profile() {
  const { t } = useTranslation();
  const { user, setAuth } = useAuthStore();
  const toast = useToast();

  const [form, setForm] = useState({ name: user?.name ?? '', email: user?.email ?? '', bio: user?.bio ?? '' });
  const [loading, setLoading] = useState(false);

  // Extra data
  const [stats, setStats]         = useState(null);
  const [walletBalance, setWalletBalance] = useState(null);
  const [subscription, setSubscription]  = useState(null);
  const [contacts, setContacts]   = useState(user?.emergencyContacts ?? []);
  const [newContact, setNewContact] = useState({ name: '', phone: '' });
  const [savingContacts, setSavingContacts] = useState(false);

  useEffect(() => {
    Promise.allSettled([
      api.get('/profile/stats'),
      api.get('/wallet/me'),
      api.get('/subscription/me'),
    ]).then(([statsRes, walletRes, subRes]) => {
      if (statsRes.status === 'fulfilled') setStats(statsRes.value.data);
      if (walletRes.status === 'fulfilled') setWalletBalance(walletRes.value.data.balance);
      if (subRes.status === 'fulfilled') setSubscription(subRes.value.data);
    });
  }, []);

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await api.patch('/users/me', form);
      const token = localStorage.getItem('netride_token');
      setAuth(token, data);
      toast(t('profile.saved'), 'success');
    } catch (err) {
      toast(err.response?.data?.error ?? t('common.error'), 'error');
    } finally { setLoading(false); }
  };

  const addContact = () => {
    if (!newContact.name || !newContact.phone) return;
    setContacts((c) => [...c, { ...newContact }]);
    setNewContact({ name: '', phone: '' });
  };

  const removeContact = (i) => setContacts((c) => c.filter((_, idx) => idx !== i));

  const saveContacts = async () => {
    setSavingContacts(true);
    try {
      await api.patch('/profile/emergency-contacts', { contacts });
      toast('Contacts mis à jour', 'success');
    } catch {
      toast('Erreur lors de la sauvegarde', 'error');
    } finally { setSavingContacts(false); }
  };

  return (
    <div className="min-h-screen bg-brand-bg pt-24 pb-12 px-4">
      <div className="max-w-lg mx-auto">
        <h1 className="text-2xl font-bold text-brand-text mb-6">{t('profile.title')}</h1>

        {/* Avatar + stats + trust score */}
        <div className="bg-brand-surface border border-brand-border rounded-2xl p-5 shadow-glass mb-4">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-14 h-14 rounded-full bg-brand-card flex items-center justify-center text-brand-text font-bold text-2xl">
              {user?.name?.[0]}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-1.5 mb-0.5">
                <p className="font-bold text-brand-text text-lg">{user?.name}</p>
                {user?.isVerified && <BadgeCheck size={16} className="text-brand-cta" />}
              </div>
              <p className="text-brand-muted text-sm">{
                { PASSENGER: 'Passager', DRIVER: 'Conducteur', SUPER_ADMIN: 'Super Admin', SUB_ADMIN: 'Sous-admin' }[user?.role] ?? user?.role
              }</p>
              {(user?.ratingCount ?? 0) > 0 && (
                <div className="flex items-center gap-1 text-brand-warning text-xs mt-0.5">
                  <Star size={11} fill="currentColor" />
                  <span>{user?.ratingAvg?.toFixed(1)} ({user?.ratingCount} avis)</span>
                </div>
              )}
            </div>
            {stats && <TrustScoreBadge score={stats.trustScore} size={56} />}
          </div>

          {/* CO₂ + rides stats */}
          {stats && (
            <div className="grid grid-cols-2 gap-3 pt-3 border-t border-brand-border">
              <div className="flex items-center gap-2">
                <Leaf size={16} className="text-brand-cta" />
                <div>
                  <p className="text-xs text-brand-muted">CO₂ économisé</p>
                  <p className="font-bold text-brand-text">{stats.co2Saved} kg</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Star size={16} className="text-brand-warning" />
                <div>
                  <p className="text-xs text-brand-muted">Trajets réalisés</p>
                  <p className="font-bold text-brand-text">{stats.totalRides}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Wallet + subscription quick links */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <Link to="/wallet" className="bg-brand-surface border border-brand-border hover:border-brand-cta/50 rounded-2xl p-4 shadow-glass transition-colors">
            <div className="flex items-center gap-2 mb-1">
              <Wallet size={16} className="text-brand-cta" />
              <p className="text-xs text-brand-muted font-medium">Portefeuille</p>
            </div>
            <p className="font-bold text-brand-cta text-lg">
              {walletBalance !== null ? formatXAF(walletBalance) : <Loader size={16} className="animate-spin" />}
            </p>
          </Link>
          <Link to="/subscription" className="bg-brand-surface border border-brand-border hover:border-brand-cta/50 rounded-2xl p-4 shadow-glass transition-colors">
            <div className="flex items-center gap-2 mb-1">
              <Zap size={16} className="text-brand-warning" />
              <p className="text-xs text-brand-muted font-medium">Abonnement</p>
            </div>
            <p className="font-bold text-brand-text text-sm">
              {subscription ? subscription.plan : <Loader size={14} className="animate-spin" />}
            </p>
          </Link>
        </div>

        {/* Profile form */}
        <form onSubmit={handleSave} className="bg-brand-surface border border-brand-border rounded-2xl p-6 shadow-glass space-y-4 mb-4">
          <label className="block">
            <span className="text-sm font-medium text-brand-muted mb-1.5 flex items-center gap-1.5"><User size={13} /> {t('auth.yourName')}</span>
            <input value={form.name} onChange={set('name')} required
              className="w-full bg-brand-card border border-brand-border rounded-xl px-4 py-3 text-brand-text placeholder-brand-muted focus:outline-none focus:border-brand-cta transition-colors mt-1" />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-brand-muted mb-1.5 flex items-center gap-1.5"><Phone size={13} /> {t('profile.phone')}</span>
            <input value={user?.phone ?? ''} disabled
              className="w-full bg-brand-card/50 border border-brand-border rounded-xl px-4 py-3 text-brand-muted cursor-not-allowed mt-1" />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-brand-muted mb-1.5 flex items-center gap-1.5"><Mail size={13} /> {t('profile.email')}</span>
            <input type="email" value={form.email} onChange={set('email')} placeholder="nom@exemple.cm"
              className="w-full bg-brand-card border border-brand-border rounded-xl px-4 py-3 text-brand-text placeholder-brand-muted focus:outline-none focus:border-brand-cta transition-colors mt-1" />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-brand-muted mb-1.5 flex items-center gap-1.5"><FileText size={13} /> {t('profile.bio')}</span>
            <textarea value={form.bio} onChange={set('bio')} rows={3} placeholder="Quelques mots sur vous..."
              className="w-full bg-brand-card border border-brand-border rounded-xl px-4 py-3 text-brand-text placeholder-brand-muted focus:outline-none focus:border-brand-cta transition-colors mt-1 resize-none" />
          </label>
          <button type="submit" disabled={loading}
            className="w-full bg-brand-cta hover:bg-brand-cta-hover disabled:opacity-50 text-white font-semibold py-3.5 rounded-xl transition-colors cursor-pointer shadow-cta">
            {loading ? t('common.loading') : t('profile.save')}
          </button>
        </form>

        {/* Emergency contacts */}
        <div className="bg-brand-surface border border-brand-border rounded-2xl p-5 shadow-glass">
          <p className="font-semibold text-brand-text mb-1">Contacts d'urgence SOS</p>
          <p className="text-xs text-brand-muted mb-4">Alertés automatiquement en cas d'urgence pendant un trajet.</p>

          <div className="space-y-2 mb-4">
            {contacts.map((c, i) => (
              <div key={i} className="flex items-center gap-2 bg-brand-card rounded-xl px-3 py-2">
                <div className="flex-1">
                  <p className="text-sm font-medium text-brand-text">{c.name}</p>
                  <p className="text-xs text-brand-muted">{c.phone}</p>
                </div>
                <button onClick={() => removeContact(i)}
                  className="p-1.5 rounded-lg text-brand-muted hover:text-brand-danger hover:bg-brand-danger/10 transition-colors cursor-pointer">
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-2 mb-3">
            <input value={newContact.name} onChange={(e) => setNewContact((c) => ({ ...c, name: e.target.value }))}
              placeholder="Nom"
              className="bg-brand-card border border-brand-border rounded-xl px-3 py-2 text-sm text-brand-text placeholder-brand-muted focus:outline-none focus:border-brand-cta transition-colors" />
            <input value={newContact.phone} onChange={(e) => setNewContact((c) => ({ ...c, phone: e.target.value }))}
              placeholder="+237 6XX..."
              className="bg-brand-card border border-brand-border rounded-xl px-3 py-2 text-sm text-brand-text placeholder-brand-muted focus:outline-none focus:border-brand-cta transition-colors" />
          </div>
          <div className="flex gap-2">
            <button onClick={addContact} type="button"
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-card border border-brand-border text-sm text-brand-muted hover:text-brand-cta hover:border-brand-cta transition-colors cursor-pointer">
              <Plus size={14} /> Ajouter
            </button>
            <button onClick={saveContacts} disabled={savingContacts}
              className="flex-1 py-2 rounded-xl bg-brand-cta hover:bg-brand-cta-hover text-white text-sm font-semibold shadow-cta disabled:opacity-50 cursor-pointer transition-colors">
              {savingContacts ? <span className="flex items-center justify-center gap-2"><Loader size={14} className="animate-spin" /> Sauvegarde...</span> : 'Sauvegarder'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
