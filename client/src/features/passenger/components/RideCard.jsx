import { useTranslation } from 'react-i18next';
import { MapPin, Clock, Users, Star, BadgeCheck, FileText, Shield } from 'lucide-react';
import { Link } from 'react-router-dom';

function formatXAF(amount) {
  return new Intl.NumberFormat('fr-CM', { style: 'currency', currency: 'XAF', maximumFractionDigits: 0 }).format(amount);
}

function formatDate(iso) {
  return new Intl.DateTimeFormat('fr-CM', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }).format(new Date(iso));
}

export default function RideCard({ ride, womenOnly }) {
  const { t } = useTranslation();
  const { driver } = ride;

  return (
    <Link to={`/rides/${ride.id}`} className="block group cursor-pointer">
      <div className="bg-brand-surface border border-brand-border hover:border-brand-cta/50 rounded-2xl p-5 transition-all duration-200 shadow-glass hover:shadow-cta/10 animate-fade-in">
        {/* Route */}
        <div className="flex items-start gap-3 mb-4">
          <div className="flex flex-col items-center gap-1 pt-1">
            <div className="w-2.5 h-2.5 rounded-full bg-brand-cta" />
            <div className="w-0.5 h-8 bg-brand-border" />
            <div className="w-2.5 h-2.5 rounded-full border-2 border-brand-cta" />
          </div>
          <div className="flex-1">
            <div className="mb-2">
              <p className="font-semibold text-brand-text">{ride.originCity}</p>
              <p className="text-brand-muted text-xs">{ride.originAddress}</p>
            </div>
            <div>
              <p className="font-semibold text-brand-text">{ride.destinationCity}</p>
              <p className="text-brand-muted text-xs">{ride.destinationAddress}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xl font-bold text-brand-cta">{formatXAF(ride.pricePerSeat)}</p>
            <p className="text-brand-muted text-xs">{t('ride.price')}</p>
          </div>
        </div>

        {/* Notes */}
        {ride.notes && (
          <div className="flex items-start gap-1.5 bg-brand-card/60 rounded-xl px-3 py-2 mb-3">
            <FileText size={12} className="text-brand-muted mt-0.5 shrink-0" />
            <p className="text-brand-muted text-xs leading-relaxed">{ride.notes}</p>
          </div>
        )}

        {/* Meta */}
        <div className="flex items-center gap-4 text-sm text-brand-muted mb-4">
          <span className="flex items-center gap-1.5"><Clock size={14} /> {formatDate(ride.departureAt)}</span>
          <span className="flex items-center gap-1.5"><Users size={14} /> {ride.seatsAvailable} {t('ride.seats')}</span>
        </div>

        {/* Driver */}
        <div className="flex items-center justify-between pt-3 border-t border-brand-border">
          <div className="flex items-center gap-2.5">
            <div className="relative w-8 h-8 shrink-0">
              <div className="w-8 h-8 rounded-full bg-brand-card flex items-center justify-center text-brand-text font-semibold text-sm">
                {driver?.name?.[0] ?? '?'}
              </div>
              {driver?.gender === 'F' && (
                <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-pink-500 flex items-center justify-center">
                  <Shield size={9} className="text-white" />
                </div>
              )}
            </div>
            <div>
              <div className="flex items-center gap-1">
                <span className="text-sm font-medium text-brand-text">{driver?.name ?? 'Conducteur'}</span>
                {driver?.isVerified && <BadgeCheck size={14} className="text-brand-cta" />}
                {driver?.gender === 'F' && womenOnly && (
                  <span className="text-xs font-semibold text-pink-400 bg-pink-400/10 px-1.5 py-0.5 rounded-full">Femme Vérifiée</span>
                )}
              </div>
              {driver?.ratingAvg != null && (
                <div className="flex items-center gap-1 text-brand-warning text-xs">
                  <Star size={11} fill="currentColor" />
                  <span>{driver.ratingAvg.toFixed(1)} ({driver.ratingCount})</span>
                </div>
              )}
            </div>
          </div>
          <span className="text-xs font-medium text-brand-cta group-hover:underline">{t('ride.book')} →</span>
        </div>
      </div>
    </Link>
  );
}
