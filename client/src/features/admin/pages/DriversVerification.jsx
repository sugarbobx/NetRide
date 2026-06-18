import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { BadgeCheck, Clock } from 'lucide-react';
import api from '../../../lib/api';

export default function DriversVerification() {
  const { t } = useTranslation();
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetch = async () => {
    setLoading(true);
    const { data } = await api.get('/admin/users', { params: { role: 'DRIVER' } });
    setDrivers(data.users);
    setLoading(false);
  };

  useEffect(() => { fetch(); }, []);

  const handleVerify = async (id) => {
    await api.patch(`/admin/users/${id}/verify`);
    fetch();
  };

  const pending = drivers.filter((d) => !d.isVerified);
  const verified = drivers.filter((d) => d.isVerified);

  return (
    <div className="animate-fade-in">
      <h1 className="text-2xl font-bold text-brand-text mb-6">{t('admin.drivers')}</h1>

      {loading ? (
        <div className="flex items-center justify-center h-32"><div className="w-6 h-6 border-2 border-brand-cta border-t-transparent rounded-full animate-spin" /></div>
      ) : (
        <>
          {/* Pending */}
          <div className="mb-6">
            <h2 className="text-sm font-semibold text-brand-warning uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <Clock size={13} /> En attente ({pending.length})
            </h2>
            <div className="space-y-2">
              {pending.map((d) => (
                <div key={d.id} className="bg-brand-surface border border-brand-warning/30 rounded-xl px-4 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-brand-card flex items-center justify-center font-bold text-brand-text">{d.name[0]}</div>
                    <div>
                      <p className="font-medium text-brand-text">{d.name}</p>
                      <p className="text-brand-muted text-xs">{d.phone}</p>
                    </div>
                  </div>
                  <button onClick={() => handleVerify(d.id)}
                    className="flex items-center gap-1.5 bg-brand-cta hover:bg-brand-cta-hover text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors cursor-pointer">
                    <BadgeCheck size={13} /> {t('admin.verify')}
                  </button>
                </div>
              ))}
              {pending.length === 0 && <p className="text-brand-muted text-sm">Aucun conducteur en attente</p>}
            </div>
          </div>

          {/* Verified */}
          <div>
            <h2 className="text-sm font-semibold text-brand-cta uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <BadgeCheck size={13} /> Vérifiés ({verified.length})
            </h2>
            <div className="bg-brand-surface border border-brand-border rounded-2xl shadow-glass overflow-hidden">
              {verified.map((d, i) => (
                <div key={d.id} className={`px-4 py-3 flex items-center gap-3 ${i < verified.length - 1 ? 'border-b border-brand-border' : ''}`}>
                  <div className="w-8 h-8 rounded-full bg-brand-card flex items-center justify-center font-bold text-brand-text text-sm">{d.name[0]}</div>
                  <div className="flex-1">
                    <p className="font-medium text-brand-text text-sm">{d.name}</p>
                    <p className="text-brand-muted text-xs">{d.phone}</p>
                  </div>
                  <BadgeCheck size={16} className="text-brand-cta" />
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
