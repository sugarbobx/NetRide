import { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle, XCircle, AlertCircle, X } from 'lucide-react';

const ToastCtx = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const toast = useCallback((message, type = 'success') => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000);
  }, []);

  const dismiss = (id) => setToasts((prev) => prev.filter((t) => t.id !== id));

  return (
    <ToastCtx.Provider value={toast}>
      {children}
      <div className="fixed top-20 right-4 z-[60] flex flex-col gap-2 pointer-events-none" style={{ width: '20rem', maxWidth: 'calc(100vw - 2rem)' }}>
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto flex items-start gap-3 px-4 py-3 rounded-xl border shadow-glass text-sm animate-slide-up
              ${t.type === 'success'
                ? 'bg-brand-surface border-brand-cta/40 text-brand-cta'
                : t.type === 'error'
                ? 'bg-brand-surface border-brand-danger/40 text-brand-danger'
                : 'bg-brand-surface border-brand-warning/40 text-brand-warning'
              }`}
          >
            <span className="mt-0.5 shrink-0">
              {t.type === 'success' ? <CheckCircle size={16} /> : t.type === 'error' ? <XCircle size={16} /> : <AlertCircle size={16} />}
            </span>
            <span className="flex-1 text-brand-text font-medium leading-snug">{t.message}</span>
            <button onClick={() => dismiss(t.id)} className="shrink-0 text-brand-muted hover:text-brand-text transition-colors cursor-pointer mt-0.5">
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}

export const useToast = () => useContext(ToastCtx);
