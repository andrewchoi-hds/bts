'use client';

import type { Role } from '@/types';

interface RoleChartProps {
  roleStats: Array<{ role: Role; count: number }>;
}

const ROLE_CONFIG: Record<Role, { label: string; color: string; icon: string }> = {
  planner: { label: '기획자', color: 'bg-amber-500', icon: '📋' },
  designer: { label: '디자이너', color: 'bg-pink-500', icon: '🎨' },
  developer: { label: '개발자', color: 'bg-cyan-500', icon: '💻' },
  qa: { label: 'QA', color: 'bg-emerald-500', icon: '🔍' },
  marketer: { label: '마케터', color: 'bg-purple-500', icon: '📢' },
  analyst: { label: '분석가', color: 'bg-blue-500', icon: '📊' },
  security: { label: '보안 담당자', color: 'bg-red-500', icon: '🛡️' },
  user: { label: '사용자', color: 'bg-gray-500', icon: '👤' },
};

export default function RoleChart({ roleStats }: RoleChartProps) {
  const total = roleStats.reduce((sum, r) => sum + r.count, 0);

  if (total === 0) {
    return (
      <div className="p-4 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)]">
        <h3 className="text-sm font-medium mb-4">역할 분포</h3>
        <p className="text-center text-[var(--text-muted)] py-4">데이터가 없습니다</p>
      </div>
    );
  }

  // 가장 많이 사용된 역할 조합 계산
  const sortedRoles = [...roleStats].sort((a, b) => b.count - a.count);

  return (
    <div className="p-4 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)]">
      <h3 className="text-sm font-medium mb-4">역할 분포</h3>

      {/* 막대 그래프 */}
      <div className="space-y-3">
        {sortedRoles.map(({ role, count }) => {
          const config = ROLE_CONFIG[role];
          const percentage = total > 0 ? (count / total) * 100 : 0;

          return (
            <div key={role}>
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <span>{config.icon}</span>
                  <span className="text-sm">{config.label}</span>
                </div>
                <span className="text-sm text-[var(--text-muted)]">
                  {count}명 ({percentage.toFixed(0)}%)
                </span>
              </div>
              <div className="h-2 bg-[var(--bg-tertiary)] rounded-full overflow-hidden">
                <div
                  className={`h-full ${config.color} rounded-full transition-all duration-500`}
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* 선호 조합 */}
      {sortedRoles.length >= 2 && (
        <div className="mt-4 pt-4 border-t border-[var(--border-subtle)]">
          <p className="text-xs text-[var(--text-muted)] mb-2">자주 사용하는 조합</p>
          <div className="flex flex-wrap gap-2">
            {sortedRoles.slice(0, 3).map(({ role }) => {
              const config = ROLE_CONFIG[role];
              return (
                <span
                  key={role}
                  className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-[var(--bg-tertiary)] text-xs"
                >
                  <span>{config.icon}</span>
                  <span>{config.label}</span>
                </span>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
