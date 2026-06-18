import { NavLink, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { LayoutDashboard, Users, Car, DollarSign, ShieldCheck, ClipboardList, UserCog, LogOut, X, Settings, MessageSquare } from 'lucide-react';
import { useAuthStore } from '../../../lib/auth';

const ALL_LINKS = [
  { to: '/admin', icon: LayoutDashboard, key: 'admin.dashboard', end: true },
  { to: '/admin/users', icon: Users, key: 'admin.users', permission: 'MANAGE_USERS' },
  { to: '/admin/drivers', icon: ShieldCheck, key: 'admin.drivers', permission: 'VERIFY_DRIVERS' },
  { to: '/admin/rides', icon: Car, key: 'admin.rides', permission: 'MANAGE_RIDES' },
  { to: '/admin/financials', icon: DollarSign, key: 'admin.financials', permission: 'VIEW_FINANCIALS' },
  { to: '/admin/sub-admins', icon: UserCog, key: 'admin.subAdmins', permission: 'MANAGE_SUB_ADMINS', superOnly: true },
  { to: '/admin/audit', icon: ClipboardList, key: 'admin.auditLogs', superOnly: true },
  { to: '/admin/config', icon: Settings, key: 'admin.config', superOnly: true },
];

export default function AdminSidebar({ open, onClose }) {
  const { t } = useTranslation();
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const links = ALL_LINKS.filter((l) => {
    if (l.superOnly) return user?.role === 'SUPER_ADMIN';
    if (l.permission) return user?.role === 'SUPER_ADMIN' || user?.permissions?.includes(l.permission);
    return true;
  });

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={onClose}
        />
      )}

      <aside className={`fixed top-0 left-0 h-screen w-60 bg-brand-surface border-r border-brand-border flex flex-col z-40 transition-transform duration-300
        ${open ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
        {/* Logo */}
        <div className="px-5 py-6 border-b border-brand-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-brand-cta rounded-lg flex items-center justify-center">
              <Car size={16} className="text-white" />
            </div>
            <div>
              <p className="font-bold text-brand-text text-sm leading-none">NetRide</p>
              <p className="text-brand-muted text-xs">Admin Panel</p>
            </div>
          </div>
          <button onClick={onClose} className="md:hidden text-brand-muted hover:text-brand-text transition-colors cursor-pointer">
            <X size={18} />
          </button>
        </div>

        {/* User badge */}
        <div className="px-4 py-3 border-b border-brand-border">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-brand-card flex items-center justify-center text-brand-text font-bold text-sm">
              {user?.name?.[0]}
            </div>
            <div className="min-w-0">
              <p className="text-brand-text text-sm font-medium truncate">{user?.name}</p>
              <p className="text-brand-muted text-xs">{user?.role === 'SUPER_ADMIN' ? 'Super Admin' : 'Sous-admin'}</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {links.map(({ to, icon: Icon, key, end }) => (
            <NavLink key={to} to={to} end={end} onClick={onClose}
              className={({ isActive }) => `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors cursor-pointer ${isActive ? 'bg-brand-cta/10 text-brand-cta' : 'text-brand-muted hover:text-brand-text hover:bg-brand-card'}`}>
              <Icon size={16} />
              {t(key)}
            </NavLink>
          ))}
        </nav>

        <div className="px-3 pb-5">
          <button onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-brand-danger hover:bg-brand-danger/10 transition-colors cursor-pointer">
            <LogOut size={16} /> {t('nav.logout')}
          </button>
        </div>
      </aside>
    </>
  );
}
