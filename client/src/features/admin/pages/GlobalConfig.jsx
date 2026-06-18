import { useState, useEffect } from 'react';
import { Settings, Save, Loader2 } from 'lucide-react';
import api from '../../../lib/api';
import { useToast } from '../../../shared/components/Toast';

const CONFIG_LABELS = {
  platform_fee_percent:              { label: 'Frais plateforme (%)', hint: 'Commission perçue par NetRide sur chaque transaction' },
  max_seats_per_booking:             { label: 'Max places par réservation', hint: 'Limite de places réservables en une fois' },
  booking_cancellation_window_hours: { label: 'Fenêtre annulation (heures)', hint: 'Délai avant départ pour annulation sans pénalité' },
};

// Feature 43: Global platform configuration controller (SUPER_ADMIN only)
export default function GlobalConfig() {
  const toast = useToast();
  const [configs, setConfigs] = useState([]);
  const [values, setValues] = useState({});
  const [saving, setSaving] = useState({});
  const [loading, setLoading] = useState(true);
  const [newKey, setNewKey] = useState('');
  const [newVal, setNewVal] = useState('');
  const [adding, setAdding] = useState(false);

  const fetchConfigs = () => {
    api.get('/admin/config').then(({ data }) => {
      setConfigs(data);
      const v = {};
      data.forEach((c) => { v[c.key] = c.value; });
      setValues(v);
    }).finally(() => setLoading(false));
  };

  useEffect(fetchConfigs, []);

  const save = async (key) => {
    setSaving((s) => ({ ...s, [key]: true }));
    try {
      await api.put(`/admin/config/${key}`, { value: values[key] });
      toast(`"${key}" mis à jour`, 'success');
    } catch (err) {
      toast(err.response?.data?.error ?? 'Erreur', 'error');
    } finally {
      setSaving((s) => ({ ...s, [key]: false }));
    }
  };

  const addNew = async () => {
    if (!newKey.trim() || !newVal.trim()) return;
    setAdding(true);
    try {
      await api.put(`/admin/config/${newKey.trim()}`, { value: newVal.trim() });
      toast('Configuration ajoutée', 'success');
      setNewKey(''); setNewVal('');
      fetchConfigs();
    } catch (err) {
      toast(err.response?.data?.error ?? 'Erreur', 'error');
    } finally { setAdding(false); }
  };

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <div className="w-8 h-8 border-2 border-brand-cta border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-2">
        <Settings size={20} className="text-brand-cta" />
        <h1 className="text-2xl font-bold text-brand-text">Configuration globale</h1>
      </div>
      <p className="text-brand-muted text-sm">Modifiez les paramètres de la plateforme sans redéploiement.</p>

      <div className="bg-brand-surface border border-brand-border rounded-2xl shadow-glass overflow-hidden">
        <div className="divide-y divide-brand-border">
          {configs.map((c) => {
            const meta = CONFIG_LABELS[c.key] || { label: c.key, hint: '' };
            return (
              <div key={c.key} className="p-5 flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="flex-1">
                  <p className="text-sm font-semibold text-brand-text">{meta.label}</p>
                  {meta.hint && <p className="text-xs text-brand-muted mt-0.5">{meta.hint}</p>}
                  <p className="text-xs text-brand-muted/50 font-mono mt-1">{c.key}</p>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    value={values[c.key] ?? ''}
                    onChange={(e) => setValues((v) => ({ ...v, [c.key]: e.target.value }))}
                    className="w-32 bg-brand-card border border-brand-border rounded-xl px-3 py-2 text-sm text-brand-text focus:outline-none focus:border-brand-cta transition-colors"
                  />
                  <button onClick={() => save(c.key)} disabled={saving[c.key]}
                    className="flex items-center gap-1.5 px-3 py-2 bg-brand-cta hover:bg-brand-cta-hover text-white text-xs font-semibold rounded-xl transition-colors cursor-pointer disabled:opacity-50">
                    {saving[c.key] ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
                    Sauver
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Add new config key */}
      <div className="bg-brand-surface border border-brand-border rounded-2xl p-5 shadow-glass">
        <p className="text-sm font-semibold text-brand-muted uppercase tracking-wider mb-3">Ajouter une variable</p>
        <div className="flex flex-col sm:flex-row gap-3">
          <input value={newKey} onChange={(e) => setNewKey(e.target.value)} placeholder="Clé (ex: max_trips_per_day)"
            className="flex-1 bg-brand-card border border-brand-border rounded-xl px-3 py-2.5 text-sm text-brand-text placeholder-brand-muted focus:outline-none focus:border-brand-cta" />
          <input value={newVal} onChange={(e) => setNewVal(e.target.value)} placeholder="Valeur"
            className="w-32 bg-brand-card border border-brand-border rounded-xl px-3 py-2.5 text-sm text-brand-text placeholder-brand-muted focus:outline-none focus:border-brand-cta" />
          <button onClick={addNew} disabled={adding || !newKey || !newVal}
            className="px-4 py-2.5 bg-brand-cta hover:bg-brand-cta-hover text-white text-sm font-semibold rounded-xl cursor-pointer disabled:opacity-50 transition-colors">
            {adding ? <Loader2 size={14} className="animate-spin mx-auto" /> : 'Ajouter'}
          </button>
        </div>
      </div>
    </div>
  );
}
