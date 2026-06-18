import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Building2, Users, Plus, Trash2, Loader, BadgeCheck } from 'lucide-react';
import api from '../../../lib/api';
import { useToast } from '../../../shared/components/Toast';

function formatXAF(n) {
  return new Intl.NumberFormat('fr-CM', { style: 'currency', currency: 'XAF', maximumFractionDigits: 0 }).format(n);
}

export default function CorporateDashboard() {
  const navigate = useNavigate();
  const toast = useToast();

  const [company, setCompany] = useState(undefined); // undefined = loading, null = not found
  const [loading, setLoading] = useState(true);
  const [regForm, setRegForm] = useState({ name: '', monthlyBudget: '' });
  const [addPhone, setAddPhone] = useState('');
  const [busy, setBusy] = useState('');

  useEffect(() => {
    api.get('/corporate/me')
      .then(({ data }) => setCompany(data))
      .catch(() => setCompany(null))
      .finally(() => setLoading(false));
  }, []);

  const register = async (e) => {
    e.preventDefault();
    if (!regForm.name) return;
    setBusy('register');
    try {
      const { data } = await api.post('/corporate', { name: regForm.name, monthlyBudget: parseInt(regForm.monthlyBudget) || 50000 });
      setCompany(data);
      toast('Entreprise enregistrée !', 'success');
    } catch (err) {
      toast(err.response?.data?.error ?? 'Erreur', 'error');
    } finally { setBusy(''); }
  };

  const addEmployee = async (e) => {
    e.preventDefault();
    if (!addPhone) return;
    setBusy('add');
    try {
      const { data } = await api.post('/corporate/employees', { phone: addPhone });
      setCompany(data);
      setAddPhone('');
      toast('Employé ajouté !', 'success');
    } catch (err) {
      toast(err.response?.data?.error ?? 'Erreur', 'error');
    } finally { setBusy(''); }
  };

  const removeEmployee = async (id) => {
    setBusy(`del-${id}`);
    try {
      await api.delete(`/corporate/employees/${id}`);
      setCompany((c) => ({ ...c, employees: c.employees.filter((e) => e.id !== id), employeeIds: c.employeeIds.filter((i) => i !== id) }));
      toast('Employé retiré', 'success');
    } catch (err) {
      toast(err.response?.data?.error ?? 'Erreur', 'error');
    } finally { setBusy(''); }
  };

  return (
    <div className="min-h-screen bg-brand-bg pt-24 pb-12 px-4">
      <div className="max-w-xl mx-auto">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-brand-muted hover:text-brand-text mb-6 transition-colors cursor-pointer">
          <ArrowLeft size={18} /> Retour
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-brand-cta/10 flex items-center justify-center">
            <Building2 size={20} className="text-brand-cta" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-brand-text">Plan Corporate</h1>
            <p className="text-brand-muted text-sm">Gérez les trajets de votre équipe</p>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-12"><Loader size={24} className="animate-spin text-brand-cta" /></div>
        ) : !company ? (
          /* Registration form */
          <div className="bg-brand-surface border border-brand-border rounded-2xl p-6 shadow-glass">
            <h2 className="font-bold text-brand-text mb-1">Enregistrez votre entreprise</h2>
            <p className="text-brand-muted text-sm mb-5">Accédez aux tarifs préférentiels et gérez les déplacements de votre équipe.</p>

            <form onSubmit={register} className="space-y-4">
              <label className="block">
                <span className="text-xs text-brand-muted block mb-1">Nom de l'entreprise</span>
                <input value={regForm.name} onChange={(e) => setRegForm((f) => ({ ...f, name: e.target.value }))} required
                  placeholder="ex: MTN Cameroun"
                  className="w-full bg-brand-card border border-brand-border rounded-xl px-4 py-3 text-brand-text placeholder-brand-muted focus:outline-none focus:border-brand-cta transition-colors" />
              </label>
              <label className="block">
                <span className="text-xs text-brand-muted block mb-1">Budget mensuel (XAF)</span>
                <input type="number" min={10000} step={5000} value={regForm.monthlyBudget} onChange={(e) => setRegForm((f) => ({ ...f, monthlyBudget: e.target.value }))}
                  placeholder="50 000"
                  className="w-full bg-brand-card border border-brand-border rounded-xl px-4 py-3 text-brand-text placeholder-brand-muted focus:outline-none focus:border-brand-cta transition-colors" />
              </label>
              <button type="submit" disabled={busy === 'register'}
                className="w-full bg-brand-cta hover:bg-brand-cta-hover disabled:opacity-50 text-white font-semibold py-3.5 rounded-xl transition-colors cursor-pointer shadow-cta">
                {busy === 'register' ? <span className="flex items-center justify-center gap-2"><Loader size={15} className="animate-spin" /> Enregistrement...</span> : 'Créer le compte corporate'}
              </button>
            </form>
          </div>
        ) : (
          <>
            {/* Company stats */}
            <div className="bg-brand-surface border border-brand-border rounded-2xl p-5 shadow-glass mb-4">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="font-bold text-brand-text text-lg">{company.name}</h2>
                  <span className="text-xs font-semibold px-2 py-0.5 bg-brand-cta/10 text-brand-cta rounded-full">{company.plan}</span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-brand-card rounded-xl p-3">
                  <p className="text-brand-muted text-xs mb-1">Budget mensuel</p>
                  <p className="font-bold text-brand-text">{formatXAF(company.monthlyBudget)}</p>
                </div>
                <div className="bg-brand-card rounded-xl p-3">
                  <p className="text-brand-muted text-xs mb-1">Employés</p>
                  <p className="font-bold text-brand-text">{company.employees?.length ?? 0}</p>
                </div>
              </div>
            </div>

            {/* Add employee */}
            <div className="bg-brand-surface border border-brand-border rounded-2xl p-5 shadow-glass mb-4">
              <div className="flex items-center gap-2 mb-3">
                <Users size={16} className="text-brand-muted" />
                <p className="font-semibold text-brand-text text-sm">Ajouter un employé</p>
              </div>
              <form onSubmit={addEmployee} className="flex gap-2">
                <input value={addPhone} onChange={(e) => setAddPhone(e.target.value)}
                  placeholder="+237 6XX XXX XXX"
                  className="flex-1 bg-brand-card border border-brand-border rounded-xl px-3 py-2.5 text-brand-text placeholder-brand-muted text-sm focus:outline-none focus:border-brand-cta transition-colors" />
                <button type="submit" disabled={busy === 'add'}
                  className="flex items-center gap-1.5 px-4 py-2.5 bg-brand-cta hover:bg-brand-cta-hover text-white text-sm font-semibold rounded-xl shadow-cta disabled:opacity-50 cursor-pointer transition-colors">
                  {busy === 'add' ? <Loader size={14} className="animate-spin" /> : <><Plus size={14} /> Ajouter</>}
                </button>
              </form>
            </div>

            {/* Employee list */}
            <div className="bg-brand-surface border border-brand-border rounded-2xl p-5 shadow-glass">
              <p className="text-sm font-semibold text-brand-muted uppercase tracking-wider mb-3">
                Membres ({company.employees?.length ?? 0})
              </p>
              {!company.employees?.length ? (
                <p className="text-brand-muted text-sm text-center py-4">Aucun employé ajouté.</p>
              ) : (
                <div className="space-y-2">
                  {company.employees.map((emp) => (
                    <div key={emp.id} className="flex items-center gap-3 py-2 border-b border-brand-border last:border-0">
                      <div className="w-8 h-8 rounded-full bg-brand-card flex items-center justify-center text-brand-text font-bold text-sm">
                        {emp.name?.[0] ?? '?'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="text-sm font-medium text-brand-text truncate">{emp.name}</p>
                          {emp.isVerified && <BadgeCheck size={13} className="text-brand-cta shrink-0" />}
                        </div>
                        <p className="text-xs text-brand-muted">{emp.role === 'DRIVER' ? 'Conducteur' : 'Passager'}</p>
                      </div>
                      {emp.id !== company.adminId && (
                        <button onClick={() => removeEmployee(emp.id)} disabled={busy === `del-${emp.id}`}
                          className="p-1.5 rounded-lg text-brand-muted hover:text-brand-danger hover:bg-brand-danger/10 transition-colors cursor-pointer disabled:opacity-50">
                          {busy === `del-${emp.id}` ? <Loader size={14} className="animate-spin" /> : <Trash2 size={14} />}
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
