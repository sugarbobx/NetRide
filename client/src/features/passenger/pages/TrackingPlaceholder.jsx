import { useParams } from 'react-router-dom';
import MapView from '../../../shared/components/MapView';

// Feature 33: Live tracking placeholder — full-width map + coming-soon overlay
export default function TrackingPlaceholder() {
  const { rideId } = useParams();

  // Centered on Cameroon
  const cameroon = { lat: 3.848, lng: 11.502 };

  return (
    <div className="min-h-screen bg-brand-bg pt-16 flex flex-col">
      {/* Map fills the screen */}
      <div className="flex-1 relative">
        <MapView
          origin={cameroon}
          destination={null}
          className="absolute inset-0 w-full h-full"
        />

        {/* Frosted overlay card */}
        <div className="absolute inset-0 flex items-center justify-center p-4 pointer-events-none">
          <div className="bg-brand-surface/90 backdrop-blur-md border border-brand-border rounded-2xl shadow-glass p-6 text-center max-w-xs pointer-events-auto">
            <div className="w-12 h-12 rounded-xl bg-brand-cta/10 border border-brand-cta/30 flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">📍</span>
            </div>
            <h2 className="text-lg font-bold text-brand-text mb-1">Suivi en direct</h2>
            {rideId && (
              <p className="text-xs text-brand-muted/60 mb-2 font-mono">{rideId.slice(0, 8)}…</p>
            )}
            <p className="text-brand-muted text-sm leading-relaxed">
              Le suivi en direct arrive bientôt.<br />
              Live tracking coming soon.
            </p>
            <div className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 bg-brand-card border border-brand-border rounded-full text-xs text-brand-muted">
              <span className="w-1.5 h-1.5 rounded-full bg-brand-warning animate-pulse" />
              En développement
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
