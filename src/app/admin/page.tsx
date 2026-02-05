'use client';

import { useState, useEffect } from 'react';
import StatsOverview from '@/components/admin/StatsOverview';
import UsageChart from '@/components/admin/UsageChart';

interface AdminStats {
  overview: {
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
  daily: Array<{ date: string; tokens: number; requests: number }>;
  byProvider: Array<{ name: string; tokens: number; requests: number }>;
  byEndpoint: Array<{ name: string; tokens: number; requests: number }>;
  roleDistribution: Array<{ role: string; count: number; percentage: number }>;
  costByProvider: Array<{ name: string; tokens: number; cost: number }>;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState(30);

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/admin/stats?days=${period}`);
        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || '통계를 불러오는데 실패했습니다.');
        }
        const data = await response.json();
        setStats(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : '알 수 없는 오류');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [period]);

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 mb-6 sm:mb-8">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">대시보드</h1>
          <p className="text-xs sm:text-sm text-[var(--text-muted)] mt-1">
            API 사용량 및 사용자 현황
          </p>
        </div>

        {/* Period Selector */}
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
          {[7, 14, 30, 90].map((days) => (
            <button
              key={days}
              onClick={() => setPeriod(days)}
              className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
                period === days
                  ? 'bg-amber-500 text-white'
                  : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)]'
              }`}
            >
              {days}일
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 border-2 border-amber-500/30 border-t-amber-500 rounded-full animate-spin" />
            <span className="text-[var(--text-muted)]">통계를 불러오는 중...</span>
          </div>
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center h-64 gap-4">
          <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="rgb(239, 68, 68)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <path d="m15 9-6 6" />
              <path d="m9 9 6 6" />
            </svg>
          </div>
          <p className="text-[var(--text-secondary)]">{error}</p>
          <button
            onClick={() => setPeriod(period)}
            className="px-4 py-2 rounded-lg bg-amber-500 text-white text-sm font-medium hover:bg-amber-600 transition-colors"
          >
            다시 시도
          </button>
        </div>
      ) : stats ? (
        <div className="space-y-8">
          {/* Stats Overview */}
          <StatsOverview stats={stats.overview} />

          {/* Charts */}
          <UsageChart
            data={{
              daily: stats.daily,
              byProvider: stats.byProvider,
              byEndpoint: stats.byEndpoint,
              roleDistribution: stats.roleDistribution,
              costByProvider: stats.costByProvider,
            }}
          />
        </div>
      ) : null}
    </div>
  );
}
