import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { ClipboardList } from 'lucide-react';
import api from '../../../lib/api';

const ACTION_COLORS = {
  VERIFY_DRIVER: 'text-brand-cta',
  BAN_USER: 'text-brand-danger',
  CREATE_SUB_ADMIN: 'text-blue-400',
  UPDATE_SUB_ADMIN_PERMISSIONS: 'text-brand-warning',
  CANCEL_RIDE: 'text-brand-danger',
};

export default function AuditLogs() {
  const { t } = useTranslation();
  const [logs, setLogs] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/admin/audit').then(({ data }) => { setLogs(data.logs); setTotal(data.total); }).finally(() => setLoading(false));
  }, []);

  return (
    <div className="animate-fade-in">
      <h1 className="text-2xl font-bold text-brand-text mb-6">{t('admin.auditLogs')} ({total})</h1>

      <div className="bg-brand-surface border border-brand-border rounded-2xl shadow-glass overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-32"><div className="w-6 h-6 border-2 border-brand-cta border-t-transparent rounded-full animate-spin" /></div>
        ) : logs.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-brand-muted">
            <ClipboardList size={32} className="mb-2 opacity-30" />
            <p className="text-sm">Aucun journal d'audit</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-brand-card/50 border-b border-brand-border">
              <tr>
                {[t('admin.action'), t('admin.actor'), t('admin.target'), t('admin.date')].map((h) => (
                  <th key={h} className="text-left text-brand-muted font-medium px-4 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id} className="border-b border-brand-border last:border-0 hover:bg-brand-card/30 transition-colors">
                  <td className="px-4 py-3">
                    <span className={`font-mono text-xs font-semibold ${ACTION_COLORS[log.action] ?? 'text-brand-muted'}`}>{log.action}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div>
                      <p className="text-brand-text">{log.actor?.name}</p>
                      <p className="text-brand-muted text-xs">{log.actor?.role}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-brand-muted font-mono text-xs">{log.targetId ? log.targetId.slice(0, 8) + '…' : '—'}</td>
                  <td className="px-4 py-3 text-brand-muted">{new Date(log.createdAt).toLocaleString('fr-CM')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
