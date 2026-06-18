import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Car, Search, Calendar, LayoutDashboard, LogOut, Plus, User, MessageCircle, Menu, X, Wallet, Zap, Building2 } from 'lucide-react';
import { useAuthStore } from '../../lib/auth';
import LanguageToggle from './LanguageToggle';

const roleLinks = {
  PASSENGER: [
    { to: '/',            icon: Search,        key: 'nav.search' },
    { to: '/bookings',    icon: Calendar,       key: 'nav.myBookings' },
    { to: '/wallet',      icon: Wallet,         key: 'nav.wallet' },
    { to: '/messages',    icon: MessageCircle,  key: 'nav.messages' },
  ],
  DRIVER: [
    { to: '/driver/rides',     icon: Car,           key: 'nav.myRides' },
    { to: '/driver/rides/new', icon: Plus,          key: 'nav.newRide' },
    { to: '/driver/insights',  icon: Zap,           key: 'nav.insights' },
    { to: '/messages',         icon: MessageCircle, key: 'nav.messages' },
  ],
  SUPER_ADMIN: [
    { to: '/admin',    icon: LayoutDashboard, key: 'nav.dashboard' },
    { to: '/corporate', icon: Building2,      key: 'nav.corporate' },
  ],
  SUB_ADMIN:   [{ to: '/admin', icon: LayoutDashboard, key: 'nav.dashboard' }],
};

export default function Navbar() {
  const { t } = useTranslation();
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const links = user ? (roleLinks[user.role] ?? roleLinks.PASSENGER) : [];
  const handleLogout = () => { logout(); navigate('/login'); setMobileOpen(false); };
  const closeMobile = () => setMobileOpen(false);

  return (
    <>
      <nav className="fixed top-4 left-4 right-4 z-50 bg-brand-surface/80 backdrop-blur-md border border-brand-border rounded-2xl px-4 py-3 flex items-center justify-between shadow-glass">
        <Link to="/" className="flex items-center gap-2 cursor-pointer" onClick={closeMobile}>
          <div className="w-8 h-8 bg-brand-cta rounded-lg flex items-center justify-center">
            <Car size={18} className="text-white" />
          </div>
          <span className="font-bold text-brand-text text-lg tracking-tight">{t('app.name')}</span>
        </Link>

        {/* Desktop nav links */}
        <div className="hidden md:flex items-center gap-1">
          {links.map(({ to, icon: Icon, key }) => (
            <Link key={to} to={to}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-colors duration-200 cursor-pointer
                ${location.pathname === to
                  ? 'bg-brand-cta/10 text-brand-cta'
                  : 'text-brand-muted hover:text-brand-text hover:bg-brand-card'}`}>
              <Icon size={16} />
              {t(key)}
            </Link>
          ))}
        </div>

        {/* Right controls */}
        <div className="flex items-center gap-2">
          <LanguageToggle />
          {user ? (
            <>
              <Link to="/profile"
                className="hidden md:flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-brand-muted hover:text-brand-text hover:bg-brand-card transition-colors cursor-pointer">
                <User size={16} />
                <span className="hidden sm:block">{user.name.split(' ')[0]}</span>
              </Link>
              <button onClick={handleLogout}
                className="hidden md:flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm text-brand-danger hover:bg-brand-danger/10 transition-colors cursor-pointer">
                <LogOut size={16} />
              </button>

              {/* Mobile hamburger */}
              <button onClick={() => setMobileOpen(true)}
                className="md:hidden p-2 rounded-xl text-brand-muted hover:text-brand-text hover:bg-brand-card transition-colors cursor-pointer"
                aria-label={t('nav.menu')}>
                <Menu size={20} />
              </button>
            </>
          ) : (
            <Link to="/login"
              className="px-4 py-2 bg-brand-cta hover:bg-brand-cta-hover text-white text-sm font-semibold rounded-xl transition-colors cursor-pointer">
              Connexion
            </Link>
          )}
        </div>
      </nav>

      {/* Mobile bottom-sheet menu */}
      {mobileOpen && (
        <>
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] md:hidden" onClick={closeMobile} />
          <div className="fixed bottom-0 left-0 right-0 z-[70] md:hidden bg-brand-surface border-t border-brand-border rounded-t-2xl shadow-glass animate-slide-up">
            {/* User header */}
            <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-brand-border">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-brand-card flex items-center justify-center text-brand-text font-bold">
                  {user?.name?.[0]}
                </div>
                <div>
                  <p className="text-sm font-semibold text-brand-text leading-none">{user?.name}</p>
                  <p className="text-xs text-brand-muted mt-0.5">{user?.phone}</p>
                </div>
              </div>
              <button onClick={closeMobile}
                className="p-1.5 rounded-xl text-brand-muted hover:text-brand-text hover:bg-brand-card transition-colors cursor-pointer">
                <X size={18} />
              </button>
            </div>

            {/* Nav links */}
            <div className="px-3 py-3 space-y-1">
              {links.map(({ to, icon: Icon, key }) => (
                <Link key={to} to={to} onClick={closeMobile}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors cursor-pointer
                    ${location.pathname === to
                      ? 'bg-brand-cta/10 text-brand-cta'
                      : 'text-brand-muted hover:text-brand-text hover:bg-brand-card'}`}>
                  <Icon size={18} />
                  {t(key)}
                </Link>
              ))}
              <Link to="/profile" onClick={closeMobile}
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-brand-muted hover:text-brand-text hover:bg-brand-card transition-colors cursor-pointer">
                <User size={18} />
                {t('nav.profile')}
              </Link>
            </div>

            {/* Logout */}
            <div className="px-3 pb-8 border-t border-brand-border">
              <button onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-brand-danger hover:bg-brand-danger/10 transition-colors cursor-pointer mt-1">
                <LogOut size={18} />
                {t('nav.logout')}
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );
}
