'use client';

import { useMemo } from 'react';
import { useTeamStore } from '@/store/teamStore';

export type NavItem = 'home' | 'history' | 'archive';

interface LNBProps {
  activeItem: NavItem;
  onNavigate: (item: NavItem) => void;
  isCollaborating?: boolean;
}

export default function LNB({ activeItem, onNavigate, isCollaborating }: LNBProps) {
  const { history } = useTeamStore();

  const historyCount = history.length;
  const archiveCount = useMemo(() =>
    history.filter(s => s.documentVersions && s.documentVersions.length > 0).length,
    [history]
  );

  const navItems = [
    {
      id: 'home' as NavItem,
      label: '새 협업',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 5v14" />
          <path d="M5 12h14" />
        </svg>
      ),
      badge: null,
    },
    {
      id: 'history' as NavItem,
      label: '히스토리',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
      ),
      badge: historyCount > 0 ? historyCount : null,
      badgeColor: 'var(--accent-cyan)',
    },
    {
      id: 'archive' as NavItem,
      label: '아카이브',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
        </svg>
      ),
      badge: archiveCount > 0 ? archiveCount : null,
      badgeColor: 'var(--accent-purple)',
    },
  ];

  if (isCollaborating) {
    return null; // 협업 진행 중에는 LNB 숨김
  }

  return (
    <nav className="w-64 h-full bg-[var(--bg-secondary)] border-r border-[var(--border-subtle)] flex flex-col shrink-0">
      {/* Logo */}
      <div className="p-6 border-b border-[var(--border-subtle)]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--accent-cyan)] to-[var(--accent-purple)] flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight">BTS</h1>
            <p className="text-xs text-[var(--text-muted)]">Build Team Service</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 p-4 space-y-1">
        {navItems.map((item) => {
          const isActive = activeItem === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all group ${
                isActive
                  ? 'bg-[var(--accent-cyan)]/10 text-[var(--accent-cyan)]'
                  : 'text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)]'
              }`}
            >
              <span className={isActive ? 'text-[var(--accent-cyan)]' : 'text-[var(--text-muted)] group-hover:text-[var(--text-secondary)]'}>
                {item.icon}
              </span>
              <span className="font-medium">{item.label}</span>
              {item.badge && (
                <span
                  className="ml-auto text-xs px-2 py-0.5 rounded-full"
                  style={{
                    backgroundColor: `color-mix(in srgb, ${item.badgeColor} 15%, transparent)`,
                    color: item.badgeColor
                  }}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-[var(--border-subtle)]">
        <div className="px-4 py-3 rounded-xl bg-[var(--bg-tertiary)]">
          <p className="text-xs text-[var(--text-muted)] mb-1">AI 가상 팀과 함께</p>
          <p className="text-sm font-medium text-[var(--text-secondary)]">아이디어를 기획서로</p>
        </div>
      </div>
    </nav>
  );
}
