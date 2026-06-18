import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Check } from 'lucide-react';
import api from '../../../lib/api';

const ALL_PERMISSIONS = ['MANAGE_USERS', 'VERIFY_DRIVERS', 'MANAGE_RIDES', 'VIEW_FINANCIALS', 'MANAGE_SUB_ADMINS'];

export default function SubAdmins() {
  const { t } = useTranslation();
  const [subAdmins, setSubAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ phone: '', name: '', email: '', permissions: [] });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const fetch = async () => {
    setLoading(true);
    const { data } = await api.get('/admin/sub-admins');
    setSubAdmins(data);
    setLoading(false);
  };

  useEffect(() => { fetch(); }, []);

  const togglePerm = (p) => setForm((f) => ({
    ...f,
    permissions: f.permissions.includes(p) ? f.permissions.filter((x) => x !== p) : [...f.permissions, p],
  }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true); setError('');
    try {
      await api.post('/admin/sub-admins', form);
      setShowForm(false);
      setForm({ phone: '', name: '', email: '', permissions: [] });
      fetch();
    } catch (err) {
      setError(err.response?.data?.error ?? t('common.error'));
    } finally { setSubmitting(false); }
  };

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-brand-text">{t('admin.subAdmins')}</h1>
        <button onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 bg-brand-cta hover:bg-brand-cta-hover text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors cursor-pointer">
          <Plus size={16} /> {t('admin.addSubAdmin')}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-brand-surface border border-brand-border rounded-2xl p-5 shadow-glass mb-6 space-y-4 animate-slide-up">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[['phone', 'Téléphone (+237...)', 'tel'], ['name', 'Nom complet', 'text'], ['email', 'Email (optionnel)', 'email']].map(([field, placeholder, type]) => (
              <input key={field} type={type} placeholder={placeholder} value={form[field]} onChange={(e) => setForm((f) => ({ ...f, [field]: e.target.value }))}
                required={field !== 'email'}
                className="bg-brand-card border border-brand-border rounded-xl px-4 py-2.5 text-brand-text placeholder-brand-muted text-sm focus:outline-none focus:border-brand-cta transition-colors" />
            ))}
          </div>
          <div>
            <p className="text-sm font-medium text-brand-muted mb-2">{t('admin.permissions')}</p>
            <div className="flex flex-wrap gap-2">
              {ALL_PERMISSIONS.map((p) => (
                <button key={p} type="button" onClick={() => togglePerm(p)}
                  className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-xl border transition-colors cursor-pointer ${form.permissions.includes(p) ? 'border-brand-cta text-brand-cta bg-brand-cta/10' : 'border-brand-border text-brand-muted hover:border-brand-cta/50'}`}>
                  {form.permissions.includes(p) && <Check size={11} />} {p.replace(/_/g, ' ')}
                </button>
              ))}
            </div>
          </div>
          {error && <p className="text-brand-danger text-sm">{error}</p>}
          <div className="flex gap-3">
            <button type="submit" disabled={submitting}
              className="bg-brand-cta hover:bg-brand-cta-hover disabled:opacity-50 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors cursor-pointer">
              {submitting ? t('common.loading') : t('common.confirm')}
            </button>
            <button type="button" onClick={() => setShowForm(false)} className="text-brand-muted text-sm hover:text-brand-text transition-colors cursor-pointer">
              {t('common.cancel')}
            </button>
          </div>
        </form>
      )}

      <div className="space-y-3">
        {loading ? (
          <div className="flex items-center justify-center h-32"><div className="w-6 h-6 border-2 border-brand-cta border-t-transparent rounded-full animate-spin" /></div>
        ) : subAdmins.map((sa) => (
          <div key={sa.id} className="bg-brand-surface border border-brand-border rounded-xl p-4 shadow-glass">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-medium text-brand-text">{sa.name}</p>
                <p className="text-brand-muted text-xs mt-0.5">{sa.phone} {sa.email && `· ${sa.email}`}</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-1.5 mt-3">
              {sa.permissions.map((p) => (
                <span key={p} className="text-xs font-medium px-2.5 py-1 rounded-full border border-brand-cta/30 text-brand-cta bg-brand-cta/5">
                  {p.replace(/_/g, ' ')}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
