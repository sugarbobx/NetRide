import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, Star, Zap, Crown, ArrowLeft, Loader } from 'lucide-react';
import api from '../../../lib/api';
import { useToast } from '../../../shared/components/Toast';

function formatXAF(n) {
  return new Intl.NumberFormat('fr-CM', { style: 'currency', currency: 'XAF', maximumFractionDigits: 0 }).format(n);
}

const PLANS = [
  {
    id: 'EXPLORATEUR',
    name: 'Explorateur',
    price: 0,
    icon: Star,
    color: 'border-brand-border',
    badge: null,
    features: ['3 trajets/mois offerts', 'Recherche de trajets', 'Paiement mobile', 'Support standard'],
  },
  {
    id: 'NAVETTEUR',
    name: 'Navetteur',
    price: 4990,
    icon: Zap,
    color: 'border-brand-cta',
    badge: 'Populaire',
    features: ['Trajets illimités', 'Priorité de réservation', 'Cashback 5% sur chaque trajet', 'Support prioritaire', 'Historique avancé'],
  },
  {
    id: 'PRO',
    name: 'Pro',
    price: 9990,
    icon: Crown,
    color: 'border-brand-warning',
    badge: 'Premium',
    features: ['Tout Navetteur inclus', 'Mode Femme Vérifiée', 'Score de confiance boosté', 'Remise 10% chez partenaires', 'Support dédié 24/7', 'Accès bêta nouvelles fonctions'],
  },
];

export default function SubscriptionPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const [current, setCurrent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [subscribing, setSubscribing] = useState('');

  useEffect(() => {
    api.get('/subscription/me')
      .then(({ data }) => setCurrent(data.plan))
      .finally(() => setLoading(false));
  }, []);

  const subscribe = async (planId) => {
    if (planId === current) return;
    setSubscribing(planId);
    try {
      const { data } = await api.post('/subscription/subscribe', { plan: planId });
      setCurrent(data.plan);
      toast(`Abonnement ${data.details.name} activé !`, 'success');
    } catch (err) {
      toast(err.response?.data?.error ?? 'Erreur lors de la souscription', 'error');
    } finally {
      setSubscribing('');
    }
  };

  return (
    <div className="min-h-screen bg-brand-bg pt-24 pb-12 px-4">
      <div className="max-w-2xl mx-auto">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-brand-muted hover:text-brand-text mb-6 transition-colors cursor-pointer">
          <ArrowLeft size={18} /> Retour
        </button>

        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-brand-text mb-2">NetRide Pass</h1>
          <p className="text-brand-muted">Choisissez le plan qui correspond à votre rythme de voyage.</p>
        </div>

        {loading ? (
          <div className="flex justify-center py-12"><Loader size={24} className="animate-spin text-brand-cta" /></div>
        ) : (
          <div className="space-y-4">
            {PLANS.map((plan) => {
              const Icon = plan.icon;
              const isActive = current === plan.id;
              const isBusy = subscribing === plan.id;

              return (
                <div key={plan.id}
                  className={`bg-brand-surface border-2 rounded-2xl p-5 shadow-glass transition-all ${plan.color} ${isActive ? 'shadow-cta/10' : ''}`}>
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                        plan.id === 'EXPLORATEUR' ? 'bg-brand-card' :
                        plan.id === 'NAVETTEUR'   ? 'bg-brand-cta/10' : 'bg-brand-warning/10'
                      }`}>
                        <Icon size={20} className={
                          plan.id === 'EXPLORATEUR' ? 'text-brand-muted' :
                          plan.id === 'NAVETTEUR'   ? 'text-brand-cta' : 'text-brand-warning'
                        } />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h2 className="font-bold text-brand-text text-lg">{plan.name}</h2>
                          {plan.badge && (
                            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                              plan.id === 'NAVETTEUR' ? 'bg-brand-cta/10 text-brand-cta' : 'bg-brand-warning/10 text-brand-warning'
                            }`}>{plan.badge}</span>
                          )}
                        </div>
                        <p className="text-brand-muted text-sm">
                          {plan.price === 0 ? 'Gratuit' : `${formatXAF(plan.price)} / mois`}
                        </p>
                      </div>
                    </div>
                    {isActive && (
                      <span className="text-xs font-semibold text-brand-cta bg-brand-cta/10 px-3 py-1 rounded-full">Actif</span>
                    )}
                  </div>

                  <ul className="space-y-2 mb-4">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-center gap-2 text-sm text-brand-muted">
                        <Check size={14} className="text-brand-cta shrink-0" />
                        {f}
                      </li>
                    ))}
                  </ul>

                  <button
                    onClick={() => subscribe(plan.id)}
                    disabled={isActive || !!subscribing}
                    className={`w-full py-3 rounded-xl font-semibold text-sm transition-colors cursor-pointer disabled:cursor-not-allowed
                      ${isActive
                        ? 'bg-brand-card text-brand-muted cursor-default'
                        : plan.id === 'NAVETTEUR'
                          ? 'bg-brand-cta hover:bg-brand-cta-hover text-white shadow-cta disabled:opacity-50'
                          : plan.id === 'PRO'
                            ? 'bg-brand-warning/10 hover:bg-brand-warning/20 text-brand-warning border border-brand-warning/30 disabled:opacity-50'
                            : 'bg-brand-card hover:bg-brand-border text-brand-muted disabled:opacity-50'
                      }`}>
                    {isBusy ? <span className="flex items-center justify-center gap-2"><Loader size={15} className="animate-spin" /> Activation...</span>
                      : isActive ? 'Plan actuel'
                      : plan.price === 0 ? 'Passer à Explorateur'
                      : `Souscrire — ${formatXAF(plan.price)}/mois`}
                  </button>
                </div>
              );
            })}
          </div>
        )}

        <p className="text-center text-xs text-brand-muted mt-6">
          Paiement simulé en mode démo. Aucun vrai débit ne sera effectué.
        </p>
      </div>
    </div>
  );
}
