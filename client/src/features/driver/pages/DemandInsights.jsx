import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Zap, TrendingUp, TrendingDown, Minus, Bell, Loader, DollarSign } from 'lucide-react';
import api from '../../../lib/api';

function formatXAF(n) {
  return new Intl.NumberFormat('fr-CM', { style: 'currency', currency: 'XAF', maximumFractionDigits: 0 }).format(n);
}

function DemandBadge({ demand }) {
  const cfg = {
    HAUTE:   { cls: 'bg-brand-danger/10 text-brand-danger',   label: 'Haute' },
    MOYENNE: { cls: 'bg-brand-warning/10 text-brand-warning', label: 'Moyenne' },
    FAIBLE:  { cls: 'bg-brand-muted/10 text-brand-muted',     label: 'Faible' },
  }[demand] || { cls: 'bg-brand-card text-brand-muted', label: demand };
  return <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${cfg.cls}`}>{cfg.label}</span>;
}

function AlertItem({ alert }) {
  const cfg = {
    HIGH:   { icon: TrendingUp,   cls: 'text-brand-danger border-brand-danger/20 bg-brand-danger/5' },
    MEDIUM: { icon: Minus,        cls: 'text-brand-warning border-brand-warning/20 bg-brand-warning/5' },
    LOW:    { icon: TrendingDown, cls: 'text-brand-muted border-brand-border bg-brand-card/50' },
  }[alert.severity] || { icon: Bell, cls: 'text-brand-muted border-brand-border' };
  const Icon = cfg.icon;
  return (
    <div className={`flex items-start gap-3 p-3 rounded-xl border ${cfg.cls}`}>
      <Icon size={16} className="shrink-0 mt-0.5" />
      <p className="text-sm">{alert.message}</p>
    </div>
  );
}

export default function DemandInsights() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/ai/insights')
      .then(({ data: d }) => setData(d))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-brand-bg pt-24 pb-12 px-4">
      <div className="max-w-xl mx-auto">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-brand-muted hover:text-brand-text mb-6 transition-colors cursor-pointer">
          <ArrowLeft size={18} /> Retour
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-brand-cta/10 flex items-center justify-center">
            <Zap size={20} className="text-brand-cta" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-brand-text">AI Route Optimizer</h1>
            <p className="text-brand-muted text-sm">Analyse de la demande en temps réel</p>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-12"><Loader size={24} className="animate-spin text-brand-cta" /></div>
        ) : !data ? (
          <p className="text-center text-brand-muted py-8">Données indisponibles.</p>
        ) : (
          <>
            {/* Weekly estimate */}
            <div className="bg-brand-surface border border-brand-cta/30 rounded-2xl p-5 shadow-glass mb-4 text-center">
              <div className="flex items-center justify-center gap-2 mb-1">
                <DollarSign size={16} className="text-brand-cta" />
                <p className="text-brand-muted text-sm">Estimation revenus cette semaine</p>
              </div>
              <p className="text-3xl font-bold text-brand-cta">{formatXAF(data.weeklyEarningsEstimate)}</p>
              <p className="text-xs text-brand-muted mt-1">Basé sur les trajets actifs et la demande actuelle</p>
            </div>

            {/* Smart alerts */}
            <div className="bg-brand-surface border border-brand-border rounded-2xl p-5 shadow-glass mb-4">
              <div className="flex items-center gap-2 mb-3">
                <Bell size={16} className="text-brand-muted" />
                <p className="font-semibold text-brand-text text-sm">Alertes intelligentes</p>
              </div>
              <div className="space-y-2">
                {data.alerts.map((a, i) => <AlertItem key={i} alert={a} />)}
              </div>
            </div>

            {/* Hot routes heatmap */}
            <div className="bg-brand-surface border border-brand-border rounded-2xl p-5 shadow-glass">
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp size={16} className="text-brand-muted" />
                <p className="font-semibold text-brand-text text-sm">Carte de chaleur des routes</p>
              </div>
              <div className="space-y-3">
                {data.hotRoutes.map((r, i) => (
                  <div key={i} className="flex items-start justify-between gap-3 py-3 border-b border-brand-border last:border-0">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium text-brand-text text-sm">{r.route}</p>
                        <DemandBadge demand={r.demand} />
                      </div>
                      <p className="text-xs text-brand-muted">{r.suggestion}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-bold text-brand-cta">{formatXAF(r.avgPrice)}</p>
                      <p className="text-xs text-brand-muted">{r.bookingsThisWeek} résa/sem</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
