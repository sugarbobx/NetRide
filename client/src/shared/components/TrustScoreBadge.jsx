export default function TrustScoreBadge({ score = 0, size = 48, showLabel = true }) {
  const r = (size / 2) - 5;
  const circ = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(100, score));
  const offset = circ - (pct / 100) * circ;
  const color = score >= 80 ? '#22C55E' : score >= 55 ? '#F59E0B' : '#EF4444';
  const label = score >= 80 ? 'Élevé' : score >= 55 ? 'Moyen' : 'Faible';

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: 'rotate(-90deg)' }}>
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#1E293B" strokeWidth={4} />
          <circle cx={size / 2} cy={size / 2} r={r} fill="none"
            stroke={color} strokeWidth={4}
            strokeDasharray={circ} strokeDashoffset={offset}
            strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 0.6s ease' }} />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span style={{ color, fontSize: size * 0.26, fontWeight: 700, lineHeight: 1 }}>{pct}</span>
        </div>
      </div>
      {showLabel && <span className="text-xs font-medium" style={{ color }}>{label}</span>}
    </div>
  );
}
