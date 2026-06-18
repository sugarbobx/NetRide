import { useState } from 'react';
import { AlertTriangle, Phone, Share2, X, MapPin } from 'lucide-react';
import { useAuthStore } from '../../lib/auth';

export default function SOSButton({ rideId }) {
  const { user } = useAuthStore();
  const [open, setOpen] = useState(false);
  const [sent, setSent] = useState(false);

  if (!rideId || !user) return null;

  const shareLink = `${window.location.origin}/tracking/${rideId}`;

  const handleAlert = () => {
    setSent(true);
    setTimeout(() => { setSent(false); setOpen(false); }, 3000);
  };

  return (
    <>
      {/* Floating SOS button */}
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-[55] w-14 h-14 rounded-full bg-brand-danger shadow-lg flex items-center justify-center text-white font-bold text-xs hover:scale-110 transition-transform cursor-pointer"
        aria-label="SOS">
        <AlertTriangle size={22} />
      </button>

      {/* SOS panel */}
      {open && (
        <>
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60]" onClick={() => setOpen(false)} />
          <div className="fixed bottom-0 left-0 right-0 z-[70] bg-brand-surface border-t border-brand-danger/50 rounded-t-2xl p-5 animate-slide-up">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <AlertTriangle size={20} className="text-brand-danger" />
                <h2 className="font-bold text-brand-text">Assistance d'urgence</h2>
              </div>
              <button onClick={() => setOpen(false)} className="p-1.5 rounded-xl text-brand-muted hover:bg-brand-card cursor-pointer">
                <X size={18} />
              </button>
            </div>

            {sent ? (
              <div className="text-center py-4">
                <p className="text-brand-cta font-semibold">Alerte envoyée !</p>
                <p className="text-brand-muted text-sm mt-1">Vos contacts d'urgence ont été notifiés.</p>
              </div>
            ) : (
              <div className="space-y-3 pb-4">
                {/* Emergency contacts */}
                {(user.emergencyContacts ?? []).length > 0 && (
                  <button onClick={handleAlert}
                    className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl bg-brand-danger/10 border border-brand-danger/30 text-brand-danger hover:bg-brand-danger/20 transition-colors cursor-pointer">
                    <Phone size={18} />
                    <div className="text-left">
                      <p className="font-semibold text-sm">Alerter mes contacts</p>
                      <p className="text-xs opacity-70">{user.emergencyContacts.map((c) => c.name).join(', ')}</p>
                    </div>
                  </button>
                )}

                <button
                  onClick={() => { navigator.clipboard?.writeText(shareLink); handleAlert(); }}
                  className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl bg-brand-card border border-brand-border text-brand-text hover:border-brand-cta/50 transition-colors cursor-pointer">
                  <Share2 size={18} className="text-brand-cta" />
                  <div className="text-left">
                    <p className="font-semibold text-sm">Partager ma position</p>
                    <p className="text-xs text-brand-muted">Copie le lien de suivi dans le presse-papiers</p>
                  </div>
                </button>

                <a href="tel:17"
                  className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl bg-brand-card border border-brand-border text-brand-text hover:border-brand-danger/50 transition-colors cursor-pointer">
                  <MapPin size={18} className="text-brand-warning" />
                  <div className="text-left">
                    <p className="font-semibold text-sm">Appeler le 17 (Police)</p>
                    <p className="text-xs text-brand-muted">Numéro d'urgence national</p>
                  </div>
                </a>
              </div>
            )}
          </div>
        </>
      )}
    </>
  );
}
