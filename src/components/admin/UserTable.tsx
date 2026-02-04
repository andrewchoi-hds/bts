'use client';

import { useState } from 'react';

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

interface UserTableProps {
  users: User[];
  onRoleChange: (userId: string, newRole: string) => Promise<void>;
  onActiveChange: (userId: string, isActive: boolean) => Promise<void>;
  onMemoChange: (userId: string, memo: string) => Promise<void>;
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

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export default function UserTable({ users, onRoleChange, onActiveChange, onMemoChange }: UserTableProps) {
  const [changingRole, setChangingRole] = useState<string | null>(null);
  const [changingActive, setChangingActive] = useState<string | null>(null);
  const [editingMemo, setEditingMemo] = useState<string | null>(null);
  const [memoValue, setMemoValue] = useState<string>('');
  const [savingMemo, setSavingMemo] = useState<string | null>(null);

  const handleRoleChange = async (userId: string, newRole: string) => {
    setChangingRole(userId);
    try {
      await onRoleChange(userId, newRole);
    } finally {
      setChangingRole(null);
    }
  };

  const handleActiveChange = async (userId: string, isActive: boolean) => {
    setChangingActive(userId);
    try {
      await onActiveChange(userId, isActive);
    } finally {
      setChangingActive(null);
    }
  };

  const startEditMemo = (user: User) => {
    setEditingMemo(user.userId);
    setMemoValue(user.memo || '');
  };

  const cancelEditMemo = () => {
    setEditingMemo(null);
    setMemoValue('');
  };

  const saveMemo = async (userId: string) => {
    setSavingMemo(userId);
    try {
      await onMemoChange(userId, memoValue);
      setEditingMemo(null);
      setMemoValue('');
    } finally {
      setSavingMemo(null);
    }
  };

  return (
    <div className="rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)] overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[var(--border-subtle)]">
              <th className="px-4 py-4 text-left text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider">
                사용자
              </th>
              <th className="px-4 py-4 text-center text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider">
                상태
              </th>
              <th className="px-4 py-4 text-left text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider">
                역할
              </th>
              <th className="px-4 py-4 text-right text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider">
                세션
              </th>
              <th className="px-4 py-4 text-right text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider">
                토큰
              </th>
              <th className="px-4 py-4 text-left text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider min-w-[200px]">
                비고
              </th>
              <th className="px-4 py-4 text-right text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider">
                가입일
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border-subtle)]">
            {users.map((user) => (
              <tr
                key={user.userId}
                className={`hover:bg-[var(--bg-tertiary)] transition-colors ${
                  !user.isActive ? 'opacity-60' : ''
                }`}
              >
                {/* 사용자 정보 */}
                <td className="px-4 py-4">
                  <div className="flex items-center gap-3">
                    <div className={`relative w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold ${
                      user.isActive
                        ? 'bg-gradient-to-br from-[var(--accent-cyan)] to-[var(--accent-purple)]'
                        : 'bg-gray-500'
                    }`}>
                      {(user.name || user.username).charAt(0).toUpperCase()}
                      {user.hasRecentActivity && (
                        <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-[var(--bg-secondary)]" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium">{user.name || user.username}</p>
                      <p className="text-xs text-[var(--text-muted)]">@{user.username}</p>
                    </div>
                  </div>
                </td>

                {/* 활성화 상태 */}
                <td className="px-4 py-4 text-center">
                  <button
                    onClick={() => handleActiveChange(user.userId, !user.isActive)}
                    disabled={changingActive === user.userId}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      user.isActive ? 'bg-green-500' : 'bg-gray-500'
                    } ${changingActive === user.userId ? 'opacity-50' : ''}`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        user.isActive ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </td>

                {/* 역할 */}
                <td className="px-4 py-4">
                  <select
                    value={user.role}
                    onChange={(e) => handleRoleChange(user.userId, e.target.value)}
                    disabled={changingRole === user.userId}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
                      user.role === 'admin'
                        ? 'bg-amber-500/10 text-amber-500 border-amber-500/30'
                        : 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)] border-[var(--border-subtle)]'
                    } ${changingRole === user.userId ? 'opacity-50' : ''}`}
                  >
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                  </select>
                </td>

                {/* 세션 수 */}
                <td className="px-4 py-4 text-right">
                  <span className="text-sm">{user.sessionCount}</span>
                </td>

                {/* 토큰 사용량 */}
                <td className="px-4 py-4 text-right">
                  <div>
                    <span className="font-medium text-sm">{formatNumber(user.usage.totalTokens)}</span>
                    {user.usage.requestCount > 0 && (
                      <p className="text-xs text-[var(--text-muted)]">
                        {formatNumber(user.usage.requestCount)} 요청
                      </p>
                    )}
                  </div>
                </td>

                {/* 비고 */}
                <td className="px-4 py-4">
                  {editingMemo === user.userId ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={memoValue}
                        onChange={(e) => setMemoValue(e.target.value)}
                        placeholder="비고 입력..."
                        className="flex-1 px-3 py-1.5 rounded-lg text-sm bg-[var(--bg-tertiary)] border border-[var(--border-subtle)] focus:border-amber-500 focus:outline-none"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') saveMemo(user.userId);
                          if (e.key === 'Escape') cancelEditMemo();
                        }}
                        autoFocus
                      />
                      <button
                        onClick={() => saveMemo(user.userId)}
                        disabled={savingMemo === user.userId}
                        className="p-1.5 rounded-lg bg-green-500/10 text-green-500 hover:bg-green-500/20 transition-colors"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M20 6 9 17l-5-5" />
                        </svg>
                      </button>
                      <button
                        onClick={cancelEditMemo}
                        className="p-1.5 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-colors"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M18 6 6 18" />
                          <path d="m6 6 12 12" />
                        </svg>
                      </button>
                    </div>
                  ) : (
                    <div
                      onClick={() => startEditMemo(user)}
                      className="group cursor-pointer flex items-center gap-2 text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
                    >
                      {user.memo ? (
                        <span className="truncate max-w-[180px]">{user.memo}</span>
                      ) : (
                        <span className="text-[var(--text-tertiary)] italic">비고 없음</span>
                      )}
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                        <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                        <path d="m15 5 4 4" />
                      </svg>
                    </div>
                  )}
                </td>

                {/* 가입일 */}
                <td className="px-4 py-4 text-right">
                  <span className="text-xs text-[var(--text-muted)]">
                    {formatDate(user.createdAt)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {users.length === 0 && (
        <div className="p-12 text-center">
          <p className="text-[var(--text-muted)]">데이터가 없습니다.</p>
        </div>
      )}
    </div>
  );
}
