import { MessageCircle } from 'lucide-react';

// Feature 32: Messaging placeholder — preserves nav structure while deferring WebSocket logic
export default function MessagesPlaceholder() {
  return (
    <div className="min-h-screen bg-brand-bg pt-24 pb-12 px-4 flex items-center justify-center">
      <div className="w-full max-w-sm text-center">
        <div className="w-20 h-20 rounded-2xl bg-brand-surface border border-brand-border flex items-center justify-center mx-auto mb-6 shadow-glass">
          <MessageCircle size={36} className="text-brand-muted opacity-60" />
        </div>
        <h2 className="text-xl font-bold text-brand-text mb-2">Messagerie</h2>
        <p className="text-brand-muted text-sm leading-relaxed">
          La messagerie arrive bientôt.<br />
          Messaging coming soon.
        </p>
        <div className="mt-6 inline-flex items-center gap-2 px-4 py-2 bg-brand-surface border border-brand-border rounded-full text-xs text-brand-muted">
          <span className="w-1.5 h-1.5 rounded-full bg-brand-warning animate-pulse" />
          En développement
        </div>
      </div>
    </div>
  );
}
