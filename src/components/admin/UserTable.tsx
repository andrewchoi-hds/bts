'use client';

import { useState } from 'react';

interface User {
  userId: string;
  username: string;
  name: string | null;
  email: string | null;
  role: string;
  createdAt: string;
  sessionCount: number;
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

export default function UserTable({ users, onRoleChange }: UserTableProps) {
  const [changingRole, setChangingRole] = useState<string | null>(null);

  const handleRoleChange = async (userId: string, newRole: string) => {
    setChangingRole(userId);
    try {
      await onRoleChange(userId, newRole);
    } finally {
      setChangingRole(null);
    }
  };

  return (
    <div className="rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)] overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[var(--border-subtle)]">
              <th className="px-6 py-4 text-left text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider">
                사용자
              </th>
              <th className="px-6 py-4 text-left text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider">
                역할
              </th>
              <th className="px-6 py-4 text-right text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider">
                세션 수
              </th>
              <th className="px-6 py-4 text-right text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider">
                토큰 사용량
              </th>
              <th className="px-6 py-4 text-right text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider">
                요청 수
              </th>
              <th className="px-6 py-4 text-right text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider">
                평균 응답시간
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border-subtle)]">
            {users.map((user) => (
              <tr
                key={user.userId}
                className="hover:bg-[var(--bg-tertiary)] transition-colors"
              >
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[var(--accent-cyan)] to-[var(--accent-purple)] flex items-center justify-center text-white text-sm font-bold">
                      {(user.name || user.username).charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-medium">{user.name || user.username}</p>
                      <p className="text-sm text-[var(--text-muted)]">@{user.username}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <select
                    value={user.role}
                    onChange={(e) => handleRoleChange(user.userId, e.target.value)}
                    disabled={changingRole === user.userId}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                      user.role === 'admin'
                        ? 'bg-amber-500/10 text-amber-500 border-amber-500/30'
                        : 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)] border-[var(--border-subtle)]'
                    } ${changingRole === user.userId ? 'opacity-50' : ''}`}
                  >
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                  </select>
                </td>
                <td className="px-6 py-4 text-right">
                  <span className="text-sm">{user.sessionCount}</span>
                </td>
                <td className="px-6 py-4 text-right">
                  <div>
                    <span className="font-medium">{formatNumber(user.usage.totalTokens)}</span>
                    <p className="text-xs text-[var(--text-muted)]">
                      {formatNumber(user.usage.promptTokens)} / {formatNumber(user.usage.completionTokens)}
                    </p>
                  </div>
                </td>
                <td className="px-6 py-4 text-right">
                  <span className="text-sm">{formatNumber(user.usage.requestCount)}</span>
                </td>
                <td className="px-6 py-4 text-right">
                  <span className="text-sm">{user.usage.avgLatency}ms</span>
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
