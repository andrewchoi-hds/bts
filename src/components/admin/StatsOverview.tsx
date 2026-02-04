'use client';

interface StatsOverviewProps {
  stats: {
    totalTokens: number;
    totalRequests: number;
    avgLatency: number;
    userCount: number;
    activeUsers: number;
    sessionCount: number;
    messageCount: number;
    documentCount: number;
    avgTeamSize: number;
    successRate: number;
  };
}

function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toString();
}

export default function StatsOverview({ stats }: StatsOverviewProps) {
  // 첫 번째 행: 주요 세션 통계 (PPT 스타일)
  const primaryCards = [
    {
      label: 'Total Sessions',
      value: formatNumber(stats.sessionCount),
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      ),
      iconColor: 'text-cyan-400',
      bgColor: 'bg-cyan-500/10',
      borderColor: 'border-cyan-500/30',
    },
    {
      label: 'Messages',
      value: formatNumber(stats.messageCount),
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
      ),
      iconColor: 'text-purple-400',
      bgColor: 'bg-purple-500/10',
      borderColor: 'border-purple-500/30',
    },
    {
      label: 'Docs Generated',
      value: formatNumber(stats.documentCount),
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
          <polyline points="14 2 14 8 20 8" />
        </svg>
      ),
      iconColor: 'text-amber-400',
      bgColor: 'bg-amber-500/10',
      borderColor: 'border-amber-500/30',
    },
    {
      label: 'Avg Team Size',
      value: stats.avgTeamSize.toString(),
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      ),
      iconColor: 'text-green-400',
      bgColor: 'bg-green-500/10',
      borderColor: 'border-green-500/30',
    },
  ];

  // 두 번째 행: API/시스템 통계
  const secondaryCards = [
    {
      label: '총 토큰 사용량',
      value: formatNumber(stats.totalTokens),
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2v4" />
          <path d="m6.8 14-3.5 2" />
          <path d="m20.7 16-3.5-2" />
          <path d="M6.8 10 3.3 8" />
          <path d="m20.7 8-3.5 2" />
          <path d="m9 22 3-8 3 8" />
          <path d="M8 22h8" />
          <path d="M12 2a4.5 4.5 0 0 0-4.5 4.5c0 2 1.5 3.5 3 4.5l1.5 1 1.5-1c1.5-1 3-2.5 3-4.5A4.5 4.5 0 0 0 12 2z" />
        </svg>
      ),
      iconColor: 'text-cyan-400',
      bgColor: 'bg-cyan-500/10',
      borderColor: 'border-cyan-500/20',
    },
    {
      label: 'API 요청 수',
      value: formatNumber(stats.totalRequests),
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
        </svg>
      ),
      iconColor: 'text-purple-400',
      bgColor: 'bg-purple-500/10',
      borderColor: 'border-purple-500/20',
    },
    {
      label: '평균 응답시간',
      value: stats.avgLatency > 1000 ? `${(stats.avgLatency / 1000).toFixed(1)}s` : `${stats.avgLatency}ms`,
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
      ),
      iconColor: 'text-amber-400',
      bgColor: 'bg-amber-500/10',
      borderColor: 'border-amber-500/20',
    },
    {
      label: '총 사용자',
      value: stats.userCount.toString(),
      subValue: `활성: ${stats.activeUsers}`,
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      ),
      iconColor: 'text-green-400',
      bgColor: 'bg-green-500/10',
      borderColor: 'border-green-500/20',
    },
    {
      label: 'API 성공률',
      value: `${stats.successRate}%`,
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
          <path d="m9 11 3 3L22 4" />
        </svg>
      ),
      iconColor: stats.successRate >= 95 ? 'text-green-400' : 'text-red-400',
      bgColor: stats.successRate >= 95 ? 'bg-green-500/10' : 'bg-red-500/10',
      borderColor: stats.successRate >= 95 ? 'border-green-500/20' : 'border-red-500/20',
    },
  ];

  return (
    <div className="space-y-6">
      {/* 첫 번째 행: 주요 통계 (PPT 스타일 - 큰 카드) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {primaryCards.map((card, index) => (
          <div
            key={index}
            className={`p-6 rounded-xl bg-[var(--bg-secondary)] border-2 ${card.borderColor} hover:shadow-lg transition-all`}
          >
            <div className="flex items-center gap-3 mb-3">
              <div className={`p-2.5 rounded-lg ${card.bgColor}`}>
                <div className={card.iconColor}>
                  {card.icon}
                </div>
              </div>
              <span className="text-sm text-[var(--text-muted)] font-medium">{card.label}</span>
            </div>
            <p className="text-4xl font-bold tracking-tight">{card.value}</p>
          </div>
        ))}
      </div>

      {/* 두 번째 행: API/시스템 통계 */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {secondaryCards.map((card, index) => (
          <div
            key={index}
            className={`p-4 rounded-xl bg-[var(--bg-secondary)] border ${card.borderColor} hover:border-[var(--border-default)] transition-all`}
          >
            <div className="flex items-start justify-between mb-3">
              <div className={`p-2 rounded-lg ${card.bgColor}`}>
                <div className={card.iconColor}>
                  {card.icon}
                </div>
              </div>
            </div>
            <div>
              <p className="text-2xl font-bold tracking-tight">{card.value}</p>
              <p className="text-xs text-[var(--text-muted)] mt-1">{card.label}</p>
              {card.subValue && (
                <p className="text-xs text-[var(--accent-cyan)] mt-1 font-medium">{card.subValue}</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
