import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { TrendingUp } from 'lucide-react';
import api from '../../../lib/api';

function formatXAF(amount) {
  return new Intl.NumberFormat('fr-CM', { style: 'currency', currency: 'XAF', maximumFractionDigits: 0 }).format(amount);
}

export default function Financials() {
  const { t } = useTranslation();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/admin/financials').then(({ data }) => setData(data)).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-2 border-brand-cta border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="animate-fade-in">
      <h1 className="text-2xl font-bold text-brand-text mb-6">{t('admin.financials')}</h1>

      <div className="bg-brand-surface border border-brand-cta/30 rounded-2xl p-6 shadow-glass mb-6 flex items-center justify-between">
        <div>
          <p className="text-brand-muted text-sm mb-1">Revenus totaux collectés</p>
          <p className="text-3xl font-bold text-brand-cta">{formatXAF(data?.total ?? 0)}</p>
        </div>
        <div className="w-12 h-12 rounded-xl bg-brand-cta/10 flex items-center justify-center text-brand-cta">
          <TrendingUp size={24} />
        </div>
      </div>

      <div className="bg-brand-surface border border-brand-border rounded-2xl shadow-glass overflow-hidden">
        <div className="px-5 py-4 border-b border-brand-border">
          <h2 className="font-semibold text-brand-text">Transactions récentes</h2>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-brand-card/50 border-b border-brand-border">
            <tr>
              {['Passager', 'Trajet', 'Montant', 'Date'].map((h) => (
                <th key={h} className="text-left text-brand-muted font-medium px-4 py-3">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data?.bookings?.map((b) => (
              <tr key={b.id} className="border-b border-brand-border last:border-0 hover:bg-brand-card/30 transition-colors">
                <td className="px-4 py-3 text-brand-text">{b.passenger?.name}</td>
                <td className="px-4 py-3 text-brand-muted">{b.ride?.originCity} → {b.ride?.destinationCity}</td>
                <td className="px-4 py-3 font-semibold text-brand-cta">{formatXAF(b.totalPrice)}</td>
                <td className="px-4 py-3 text-brand-muted">{new Date(b.createdAt).toLocaleDateString('fr-CM')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
