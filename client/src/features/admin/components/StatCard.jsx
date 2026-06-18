export default function StatCard({ label, value, icon: Icon, color = 'text-brand-cta', trend }) {
  return (
    <div className="bg-brand-surface border border-brand-border rounded-2xl p-5 shadow-glass">
      <div className="flex items-start justify-between mb-3">
        <p className="text-brand-muted text-sm font-medium">{label}</p>
        <div className={`w-9 h-9 rounded-xl bg-brand-card flex items-center justify-center ${color}`}>
          <Icon size={18} />
        </div>
      </div>
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
      {trend && <p className="text-brand-muted text-xs mt-1">{trend}</p>}
    </div>
  );
}
