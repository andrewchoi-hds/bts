'use client';

interface StatsCardProps {
  label: string;
  value: string | number;
  subValue?: string;
  icon: React.ReactNode;
  color: 'cyan' | 'purple' | 'green' | 'amber';
}

const colorStyles = {
  cyan: {
    bg: 'bg-cyan-500/10',
    text: 'text-cyan-400',
    gradient: 'from-cyan-500 to-blue-500',
  },
  purple: {
    bg: 'bg-purple-500/10',
    text: 'text-purple-400',
    gradient: 'from-purple-500 to-pink-500',
  },
  green: {
    bg: 'bg-green-500/10',
    text: 'text-green-400',
    gradient: 'from-green-500 to-emerald-500',
  },
  amber: {
    bg: 'bg-amber-500/10',
    text: 'text-amber-400',
    gradient: 'from-amber-500 to-orange-500',
  },
};

export default function StatsCard({ label, value, subValue, icon, color }: StatsCardProps) {
  const styles = colorStyles[color];

  return (
    <div className="p-5 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)] hover:border-[var(--border-default)] transition-colors">
      <div className="flex items-start justify-between mb-3">
        <div className={`p-2.5 rounded-lg ${styles.bg}`}>
          <div className={styles.text}>{icon}</div>
        </div>
      </div>
      <div>
        <p className="text-2xl font-bold">{value}</p>
        <p className="text-sm text-[var(--text-muted)] mt-1">{label}</p>
        {subValue && (
          <p className={`text-xs ${styles.text} mt-1`}>{subValue}</p>
        )}
      </div>
    </div>
  );
}
