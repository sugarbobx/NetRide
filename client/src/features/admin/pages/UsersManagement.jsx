import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Search, BadgeCheck, Ban } from 'lucide-react';
import api from '../../../lib/api';

const ROLE_COLORS = {
  SUPER_ADMIN: 'text-purple-400 bg-purple-400/10 border-purple-400/30',
  SUB_ADMIN: 'text-blue-400 bg-blue-400/10 border-blue-400/30',
  DRIVER: 'text-brand-cta bg-brand-cta/10 border-brand-cta/30',
  PASSENGER: 'text-brand-muted bg-brand-card border-brand-border',
};

export default function UsersManagement() {
  const { t } = useTranslation();
  const [users, setUsers] = useState([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [loading, setLoading] = useState(true);

  const fetch = async () => {
    setLoading(true);
    try {
      const params = {};
      if (search) params.search = search;
      if (roleFilter) params.role = roleFilter;
      const { data } = await api.get('/admin/users', { params });
      setUsers(data.users);
      setTotal(data.total);
    } finally { setLoading(false); }
  };

  useEffect(() => { fetch(); }, [search, roleFilter]);

  const handleVerify = async (id) => {
    await api.patch(`/admin/users/${id}/verify`);
    fetch();
  };

  const handleBan = async (id) => {
    if (!confirm('Bannir cet utilisateur ?')) return;
    await api.patch(`/admin/users/${id}/ban`);
    fetch();
  };

  return (
    <div className="animate-fade-in">
      <h1 className="text-2xl font-bold text-brand-text mb-6">{t('admin.users')} ({total})</h1>

      {/* Filters */}
      <div className="flex gap-3 mb-5">
        <div className="relative flex-1 max-w-xs">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-muted" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher..."
            className="w-full bg-brand-surface border border-brand-border rounded-xl pl-9 pr-4 py-2.5 text-brand-text placeholder-brand-muted text-sm focus:outline-none focus:border-brand-cta transition-colors" />
        </div>
        <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}
          className="bg-brand-surface border border-brand-border rounded-xl px-3 py-2.5 text-brand-text text-sm focus:outline-none focus:border-brand-cta transition-colors">
          <option value="">Tous les rôles</option>
          {['PASSENGER', 'DRIVER', 'SUB_ADMIN', 'SUPER_ADMIN'].map((r) => <option key={r} value={r}>{r}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="bg-brand-surface border border-brand-border rounded-2xl shadow-glass overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-32"><div className="w-6 h-6 border-2 border-brand-cta border-t-transparent rounded-full animate-spin" /></div>
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b border-brand-border bg-brand-card/50">
              <tr>
                {['Nom', 'Téléphone', 'Rôle', 'Statut', 'Actions'].map((h) => (
                  <th key={h} className="text-left text-brand-muted font-medium px-4 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b border-brand-border last:border-0 hover:bg-brand-card/30 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-brand-card flex items-center justify-center text-xs font-bold text-brand-text">{u.name[0]}</div>
                      <span className="text-brand-text font-medium">{u.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-brand-muted">{u.phone}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${ROLE_COLORS[u.role]}`}>{u.role}</span>
                  </td>
                  <td className="px-4 py-3">
                    {u.isVerified
                      ? <span className="flex items-center gap-1 text-brand-cta text-xs"><BadgeCheck size={13} /> {t('common.verified')}</span>
                      : <span className="text-brand-muted text-xs">{t('common.notVerified')}</span>}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {!u.isVerified && u.role === 'DRIVER' && (
                        <button onClick={() => handleVerify(u.id)} className="text-xs font-medium text-brand-cta hover:underline cursor-pointer">{t('admin.verify')}</button>
                      )}
                      <button onClick={() => handleBan(u.id)} className="text-xs font-medium text-brand-danger hover:underline cursor-pointer"><Ban size={13} /></button>
                    </div>
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
