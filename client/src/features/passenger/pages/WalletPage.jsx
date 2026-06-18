import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Wallet, TrendingUp, TrendingDown, Gift, Loader, Plus, Minus, Smartphone, Banknote } from 'lucide-react';
import api from '../../../lib/api';
import { useToast } from '../../../shared/components/Toast';

function formatXAF(n) {
  return new Intl.NumberFormat('fr-CM', { style: 'currency', currency: 'XAF', maximumFractionDigits: 0 }).format(n);
}

function TxIcon({ type }) {
  if (type === 'CREDIT')   return <TrendingUp size={16} className="text-brand-cta" />;
  if (type === 'CASHBACK') return <Gift size={16} className="text-brand-warning" />;
  return <TrendingDown size={16} className="text-brand-danger" />;
}

const PAY_METHODS = [
  { value: 'MTN MoMo',    icon: Smartphone, label: 'MTN MoMo' },
  { value: 'Orange Money', icon: Smartphone, label: 'Orange Money' },
  { value: 'Espèces',     icon: Banknote,   label: 'Espèces' },
];

export default function WalletPage() {
  const navigate = useNavigate();
  const toast = useToast();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('topup'); // topup | withdraw
  const [amount, setAmount] = useState('');
  const [payMethod, setPayMethod] = useState('MTN MoMo');
  const [busy, setBusy] = useState(false);

  const load = () => {
    setLoading(true);
    api.get('/wallet/me')
      .then(({ data: d }) => setData(d))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const submit = async (e) => {
    e.preventDefault();
    const num = parseInt(amount);
    if (!num || num <= 0) { toast('Montant invalide', 'error'); return; }
    setBusy(true);
    try {
      const endpoint = tab === 'topup' ? '/wallet/topup' : '/wallet/withdraw';
      const { data: res } = await api.post(endpoint, { amount: num, method: payMethod });
      setData((d) => ({ ...d, balance: res.balance, transactions: [res.transaction, ...(d?.transactions ?? [])] }));
      setAmount('');
      toast(tab === 'topup' ? `${formatXAF(num)} crédités !` : `${formatXAF(num)} retirés !`, 'success');
    } catch (err) {
      toast(err.response?.data?.error ?? 'Erreur', 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-brand-bg pt-24 pb-12 px-4">
      <div className="max-w-lg mx-auto">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-brand-muted hover:text-brand-text mb-6 transition-colors cursor-pointer">
          <ArrowLeft size={18} /> Retour
        </button>

        {/* Balance card */}
        <div className="bg-brand-surface border border-brand-cta/30 rounded-2xl p-6 shadow-glass mb-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-1">
            <Wallet size={18} className="text-brand-cta" />
            <p className="text-brand-muted text-sm font-medium">Solde disponible</p>
          </div>
          {loading ? (
            <div className="flex justify-center py-2"><Loader size={20} className="animate-spin text-brand-cta" /></div>
          ) : (
            <p className="text-4xl font-bold text-brand-cta">{formatXAF(data?.balance ?? 0)}</p>
          )}
        </div>

        {/* Topup / Withdraw form */}
        <div className="bg-brand-surface border border-brand-border rounded-2xl p-5 shadow-glass mb-4">
          <div className="flex gap-2 mb-4">
            {[{ id: 'topup', label: 'Recharger', icon: Plus }, { id: 'withdraw', label: 'Retirer', icon: Minus }].map(({ id, label, icon: Icon }) => (
              <button key={id} onClick={() => setTab(id)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-semibold transition-colors cursor-pointer
                  ${tab === id ? 'bg-brand-cta text-white shadow-cta' : 'bg-brand-card text-brand-muted hover:text-brand-text'}`}>
                <Icon size={15} /> {label}
              </button>
            ))}
          </div>

          <form onSubmit={submit} className="space-y-3">
            <label className="block">
              <span className="text-xs text-brand-muted block mb-1">Montant (XAF)</span>
              <input type="number" min={100} step={500} value={amount} onChange={(e) => setAmount(e.target.value)}
                placeholder="ex: 5000"
                className="w-full bg-brand-card border border-brand-border rounded-xl px-4 py-3 text-brand-text placeholder-brand-muted focus:outline-none focus:border-brand-cta transition-colors" />
            </label>

            <div>
              <span className="text-xs text-brand-muted block mb-1.5">Méthode</span>
              <div className="grid grid-cols-3 gap-2">
                {PAY_METHODS.map(({ value, icon: Icon, label }) => (
                  <button key={value} type="button" onClick={() => setPayMethod(value)}
                    className={`flex flex-col items-center gap-1 py-2.5 rounded-xl border text-xs font-medium transition-colors cursor-pointer
                      ${payMethod === value ? 'border-brand-cta text-brand-cta bg-brand-cta/5' : 'border-brand-border text-brand-muted hover:border-brand-cta/50'}`}>
                    <Icon size={15} /> {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Quick amount pills */}
            <div className="flex gap-2 flex-wrap">
              {[1000, 2500, 5000, 10000].map((v) => (
                <button key={v} type="button" onClick={() => setAmount(String(v))}
                  className="px-3 py-1 rounded-lg bg-brand-card border border-brand-border text-xs text-brand-muted hover:border-brand-cta hover:text-brand-cta transition-colors cursor-pointer">
                  {formatXAF(v)}
                </button>
              ))}
            </div>

            <button type="submit" disabled={busy}
              className="w-full bg-brand-cta hover:bg-brand-cta-hover disabled:opacity-50 text-white font-semibold py-3.5 rounded-xl transition-colors cursor-pointer shadow-cta">
              {busy ? <span className="flex items-center justify-center gap-2"><Loader size={15} className="animate-spin" /> Traitement...</span>
                : tab === 'topup' ? `Recharger${amount ? ` — ${formatXAF(parseInt(amount) || 0)}` : ''}` : `Retirer${amount ? ` — ${formatXAF(parseInt(amount) || 0)}` : ''}`}
            </button>
          </form>
        </div>

        {/* Transaction history */}
        <div className="bg-brand-surface border border-brand-border rounded-2xl p-5 shadow-glass">
          <p className="text-sm font-semibold text-brand-muted uppercase tracking-wider mb-4">
            Historique des transactions
          </p>
          {loading ? (
            <div className="flex justify-center py-6"><Loader size={20} className="animate-spin text-brand-cta" /></div>
          ) : !data?.transactions?.length ? (
            <p className="text-brand-muted text-sm text-center py-6">Aucune transaction.</p>
          ) : (
            <div className="space-y-3">
              {data.transactions.map((tx) => (
                <div key={tx.id} className="flex items-center gap-3 py-2 border-b border-brand-border last:border-0">
                  <div className="w-8 h-8 rounded-full bg-brand-card flex items-center justify-center shrink-0">
                    <TxIcon type={tx.type} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-brand-text truncate">{tx.description}</p>
                    <p className="text-xs text-brand-muted">
                      {new Intl.DateTimeFormat('fr-CM', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(tx.createdAt))}
                    </p>
                  </div>
                  <p className={`font-bold text-sm shrink-0 ${tx.type === 'DEBIT' ? 'text-brand-danger' : 'text-brand-cta'}`}>
                    {tx.type === 'DEBIT' ? '-' : '+'}{formatXAF(tx.amount)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
