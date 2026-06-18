/**
 * Feature 12: Visual seat map grid showing booked vs. available seats.
 * Renders a car-interior-style layout.
 */
export default function SeatMap({ total, available }) {
  const booked = total - available;

  return (
    <div className="space-y-2">
      <p className="text-xs text-brand-muted font-medium mb-2">Plan des sièges — {available} libre(s) / {total} total</p>

      {/* Driver seat row */}
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 rounded-lg bg-brand-cta/20 border-2 border-brand-cta flex items-center justify-center text-brand-cta">
          <span className="text-xs">🚗</span>
        </div>
        <span className="text-xs text-brand-muted">Conducteur</span>
      </div>

      {/* Passenger seats grid */}
      <div className="grid grid-cols-4 gap-2">
        {Array.from({ length: total }).map((_, i) => {
          const isBooked = i < booked;
          return (
            <div key={i} className={`h-10 rounded-lg border-2 flex items-center justify-center text-xs font-bold transition-colors
              ${isBooked
                ? 'bg-brand-danger/10 border-brand-danger/50 text-brand-danger'
                : 'bg-brand-cta/10 border-brand-cta/40 text-brand-cta'}`}>
              {isBooked ? '✕' : i + 1}
            </div>
          );
        })}
      </div>

      <div className="flex gap-4 mt-2">
        <span className="flex items-center gap-1.5 text-xs text-brand-muted">
          <span className="w-3 h-3 rounded bg-brand-cta/20 border border-brand-cta/40 inline-block" /> Disponible
        </span>
        <span className="flex items-center gap-1.5 text-xs text-brand-muted">
          <span className="w-3 h-3 rounded bg-brand-danger/20 border border-brand-danger/40 inline-block" /> Réservé
        </span>
      </div>
    </div>
  );
}
