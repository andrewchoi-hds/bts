'use client';

import { useState, useEffect } from 'react';
import UserTable from '@/components/admin/UserTable';

interface User {
  userId: string;
  username: string;
  name: string | null;
  email: string | null;
  role: string;
  isActive: boolean;
  memo: string | null;
  createdAt: string;
  sessionCount: number;
  hasRecentActivity: boolean;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
    requestCount: number;
    avgLatency: number;
  };
}

interface UsersResponse {
  users: User[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  summary: {
    totalUsers: number;
    activeUsers: number;
    inactiveUsers: number;
    recentlyActive: number;
  };
}

export default function AdminUsersPage() {
  const [data, setData] = useState<UsersResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState(30);
  const [page, setPage] = useState(1);

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/admin/users?days=${period}&page=${page}`);
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || '사용자 목록을 불러오는데 실패했습니다.');
      }
      const result = await response.json();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : '알 수 없는 오류');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [period, page]);

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      const response = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, role: newRole }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || '역할 변경에 실패했습니다.');
      }

      fetchUsers();
    } catch (err) {
      alert(err instanceof Error ? err.message : '역할 변경 중 오류가 발생했습니다.');
    }
  };

  const handleActiveChange = async (userId: string, isActive: boolean) => {
    try {
      const response = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, isActive }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || '상태 변경에 실패했습니다.');
      }

      fetchUsers();
    } catch (err) {
      alert(err instanceof Error ? err.message : '상태 변경 중 오류가 발생했습니다.');
    }
  };

  const handleMemoChange = async (userId: string, memo: string) => {
    try {
      const response = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, memo }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || '비고 저장에 실패했습니다.');
      }

      fetchUsers();
    } catch (err) {
      alert(err instanceof Error ? err.message : '비고 저장 중 오류가 발생했습니다.');
    }
  };

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold">사용자 관리</h1>
          <p className="text-sm text-[var(--text-muted)] mt-1">
            전체 사용자 목록을 확인하고 관리하세요
          </p>
        </div>

        {/* Period Selector */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-[var(--text-muted)]">사용량 기간:</span>
          {[7, 14, 30, 90].map((days) => (
            <button
              key={days}
              onClick={() => {
                setPeriod(days);
                setPage(1);
              }}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
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

      {/* Summary Cards */}
      {data?.summary && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          <div className="p-4 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)]">
            <p className="text-2xl font-bold">{data.summary.totalUsers}</p>
            <p className="text-sm text-[var(--text-muted)]">전체 사용자</p>
          </div>
          <div className="p-4 rounded-xl bg-[var(--bg-secondary)] border border-green-500/20">
            <p className="text-2xl font-bold text-green-500">{data.summary.activeUsers}</p>
            <p className="text-sm text-[var(--text-muted)]">활성화된 사용자</p>
          </div>
          <div className="p-4 rounded-xl bg-[var(--bg-secondary)] border border-red-500/20">
            <p className="text-2xl font-bold text-red-400">{data.summary.inactiveUsers}</p>
            <p className="text-sm text-[var(--text-muted)]">비활성화된 사용자</p>
          </div>
          <div className="p-4 rounded-xl bg-[var(--bg-secondary)] border border-cyan-500/20">
            <p className="text-2xl font-bold text-cyan-400">{data.summary.recentlyActive}</p>
            <p className="text-sm text-[var(--text-muted)]">최근 {period}일 활동</p>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 border-2 border-amber-500/30 border-t-amber-500 rounded-full animate-spin" />
            <span className="text-[var(--text-muted)]">사용자 목록을 불러오는 중...</span>
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
            onClick={fetchUsers}
            className="px-4 py-2 rounded-lg bg-amber-500 text-white text-sm font-medium hover:bg-amber-600 transition-colors"
          >
            다시 시도
          </button>
        </div>
      ) : data ? (
        <>
          <UserTable
            users={data.users}
            onRoleChange={handleRoleChange}
            onActiveChange={handleActiveChange}
            onMemoChange={handleMemoChange}
          />

          {/* Pagination */}
          {data.pagination.totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-6">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-4 py-2 rounded-lg bg-[var(--bg-secondary)] text-sm font-medium disabled:opacity-50 hover:bg-[var(--bg-tertiary)] transition-colors"
              >
                이전
              </button>
              <span className="px-4 py-2 text-sm text-[var(--text-muted)]">
                {page} / {data.pagination.totalPages} (총 {data.pagination.total}명)
              </span>
              <button
                onClick={() => setPage(p => Math.min(data.pagination.totalPages, p + 1))}
                disabled={page === data.pagination.totalPages}
                className="px-4 py-2 rounded-lg bg-[var(--bg-secondary)] text-sm font-medium disabled:opacity-50 hover:bg-[var(--bg-tertiary)] transition-colors"
              >
                다음
              </button>
            </div>
          )}
        </>
      ) : null}
    </div>
  );
}
