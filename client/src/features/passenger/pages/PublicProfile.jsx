import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, BadgeCheck, Star, Calendar, MessageSquare } from 'lucide-react';
import api from '../../../lib/api';

function formatDate(iso) {
  return new Intl.DateTimeFormat('fr-CM', { year: 'numeric', month: 'long' }).format(new Date(iso));
}

// Feature 29: Public driver portfolio page at /profile/:id
export default function PublicProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get(`/users/${id}`),
      api.get(`/users/${id}/reviews`),
    ]).then(([{ data: u }, { data: r }]) => {
      setUser(u);
      setReviews(r);
    }).finally(() => setLoading(false));
  }, [id]);

  if (loading) return (
    <div className="min-h-screen bg-brand-bg flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-brand-cta border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!user) return (
    <div className="min-h-screen bg-brand-bg flex flex-col items-center justify-center gap-4 text-brand-muted">
      <p>Profil introuvable</p>
      <button onClick={() => navigate(-1)} className="text-brand-cta hover:underline cursor-pointer text-sm">Retour</button>
    </div>
  );

  return (
    <div className="min-h-screen bg-brand-bg pt-24 pb-12 px-4">
      <div className="max-w-lg mx-auto">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-brand-muted hover:text-brand-text mb-6 transition-colors cursor-pointer">
          <ArrowLeft size={18} /> Retour
        </button>

        {/* Hero card */}
        <div className="bg-brand-surface border border-brand-border rounded-2xl p-6 shadow-glass mb-4">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 rounded-full bg-brand-card flex items-center justify-center text-brand-text font-bold text-2xl">
              {user.name?.[0]}
            </div>
            <div>
              <div className="flex items-center gap-1.5 mb-0.5">
                <h1 className="text-xl font-bold text-brand-text">{user.name}</h1>
                {user.isVerified && <BadgeCheck size={18} className="text-brand-cta" />}
              </div>
              <p className="text-brand-muted text-sm">{
                { PASSENGER: 'Passager', DRIVER: 'Conducteur', SUPER_ADMIN: 'Super Admin', SUB_ADMIN: 'Sous-admin' }[user.role] ?? user.role
              }</p>
              {(user.ratingCount ?? 0) > 0 && (
                <div className="flex items-center gap-1 text-brand-warning text-sm mt-0.5">
                  <Star size={13} fill="currentColor" />
                  <span>{user.ratingAvg?.toFixed(1)} ({user.ratingCount} avis)</span>
                </div>
              )}
            </div>
          </div>

          {user.bio && (
            <p className="text-brand-muted text-sm leading-relaxed border-t border-brand-border pt-4">{user.bio}</p>
          )}

          <div className="flex items-center gap-1.5 text-xs text-brand-muted mt-4 pt-3 border-t border-brand-border">
            <Calendar size={12} />
            <span>Membre depuis {formatDate(user.createdAt)}</span>
          </div>
        </div>

        {/* Reviews list */}
        <div className="bg-brand-surface border border-brand-border rounded-2xl p-5 shadow-glass">
          <div className="flex items-center gap-2 mb-4">
            <MessageSquare size={16} className="text-brand-muted" />
            <p className="text-sm font-semibold text-brand-muted uppercase tracking-wider">
              Avis reçus ({reviews.length})
            </p>
          </div>

          {reviews.length === 0 ? (
            <p className="text-brand-muted text-sm text-center py-6">Aucun avis pour le moment.</p>
          ) : (
            <div className="space-y-4">
              {reviews.map((r) => (
                <div key={r.id} className="border-b border-brand-border last:border-0 pb-4 last:pb-0">
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-brand-card flex items-center justify-center text-xs font-bold text-brand-text">
                        {r.reviewer?.name?.[0] ?? '?'}
                      </div>
                      <span className="text-sm font-medium text-brand-text">{r.reviewer?.name ?? 'Anonyme'}</span>
                    </div>
                    <div className="flex gap-0.5">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star key={s} size={12}
                          className={r.rating >= s ? 'text-brand-warning' : 'text-brand-border'}
                          fill={r.rating >= s ? 'currentColor' : 'none'} />
                      ))}
                    </div>
                  </div>
                  {r.comment && <p className="text-brand-muted text-sm leading-relaxed">{r.comment}</p>}
                  <p className="text-xs text-brand-muted/60 mt-1">
                    {new Intl.DateTimeFormat('fr-CM', { dateStyle: 'medium' }).format(new Date(r.createdAt))}
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
