import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Ban } from 'lucide-react';
import api from '../../../lib/api';

const STATUS_COLORS = {
  ACTIVE: 'text-brand-cta bg-brand-cta/10 border-brand-cta/30',
  CANCELLED: 'text-brand-danger bg-brand-danger/10 border-brand-danger/30',
  COMPLETED: 'text-brand-muted bg-brand-card border-brand-border',
};

function formatXAF(amount) {
  return new Intl.NumberFormat('fr-CM', { style: 'currency', currency: 'XAF', maximumFractionDigits: 0 }).format(amount);
}

export default function RidesOverview() {
  const { t } = useTranslation();
  const [rides, setRides] = useState([]);
  const [total, setTotal] = useState(0);
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);

  const fetch = async () => {
    setLoading(true);
    const params = statusFilter ? { status: statusFilter } : {};
    const { data } = await api.get('/admin/rides', { params });
    setRides(data.rides);
    setTotal(data.total);
    setLoading(false);
  };

  useEffect(() => { fetch(); }, [statusFilter]);

  const handleCancel = async (id) => {
    if (!confirm('Annuler ce trajet ?')) return;
    await api.patch(`/admin/rides/${id}/cancel`);
    fetch();
  };

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-brand-text">{t('admin.rides')} ({total})</h1>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-brand-surface border border-brand-border rounded-xl px-3 py-2 text-brand-text text-sm focus:outline-none focus:border-brand-cta transition-colors">
          <option value="">Tous</option>
          {['ACTIVE', 'CANCELLED', 'COMPLETED'].map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      <div className="bg-brand-surface border border-brand-border rounded-2xl shadow-glass overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-32"><div className="w-6 h-6 border-2 border-brand-cta border-t-transparent rounded-full animate-spin" /></div>
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b border-brand-border bg-brand-card/50">
              <tr>
                {['Trajet', 'Conducteur', 'Départ', 'Prix/place', 'Statut', ''].map((h) => (
                  <th key={h} className="text-left text-brand-muted font-medium px-4 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rides.map((r) => (
                <tr key={r.id} className="border-b border-brand-border last:border-0 hover:bg-brand-card/30 transition-colors">
                  <td className="px-4 py-3 font-medium text-brand-text">{r.originCity} → {r.destinationCity}</td>
                  <td className="px-4 py-3 text-brand-muted">{r.driver?.name}</td>
                  <td className="px-4 py-3 text-brand-muted">{new Date(r.departureAt).toLocaleDateString('fr-CM')}</td>
                  <td className="px-4 py-3 text-brand-cta font-semibold">{formatXAF(r.pricePerSeat)}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${STATUS_COLORS[r.status]}`}>{t(`ride.status.${r.status}`)}</span>
                  </td>
                  <td className="px-4 py-3">
                    {r.status === 'ACTIVE' && (
                      <button onClick={() => handleCancel(r.id)} className="text-brand-danger hover:text-red-400 transition-colors cursor-pointer"><Ban size={15} /></button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
