'use client';

import { useState } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import MobileBottomNav from './MobileBottomNav';

export type NavItem = 'home' | 'history' | 'archive';

interface LNBProps {
  activeItem: NavItem;
  onNavigate: (item: NavItem) => void;
  isCollaborating?: boolean;
  historyCount?: number;
  archiveCount?: number;
}

export default function LNB({ activeItem, onNavigate, isCollaborating, historyCount = 0, archiveCount = 0 }: LNBProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const isAdmin = session?.user?.role === 'admin';

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
    <>
      {/* 모바일 바텀 네비게이션 */}
      <MobileBottomNav
        activeItem={activeItem}
        onNavigate={onNavigate}
        historyCount={historyCount}
        archiveCount={archiveCount}
      />

      {/* 태블릿/데스크톱 사이드바 */}
      <nav className={`hidden md:flex h-full bg-[var(--bg-secondary)] border-r border-[var(--border-subtle)] flex-col shrink-0 transition-all duration-300 ${
        isCollapsed ? 'w-16' : 'w-64'
      }`}>
        {/* Logo */}
        <div className={`p-4 ${isCollapsed ? 'px-2' : 'p-6'} border-b border-[var(--border-subtle)]`}>
          <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'}`}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--accent-cyan)] to-[var(--accent-purple)] flex items-center justify-center shrink-0">
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </div>
            {!isCollapsed && (
              <div>
                <h1 className="text-lg font-bold tracking-tight">BTS</h1>
                <p className="text-xs text-[var(--text-muted)]">Build Team Service</p>
              </div>
            )}
          </div>
        </div>

        {/* Navigation */}
        <div className={`flex-1 ${isCollapsed ? 'p-2' : 'p-4'} space-y-1`}>
          {navItems.map((item) => {
            const isActive = activeItem === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                title={isCollapsed ? item.label : undefined}
                className={`w-full flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'} ${
                  isCollapsed ? 'p-3' : 'px-4 py-3'
                } rounded-xl transition-all group ${
                  isActive
                    ? 'bg-[var(--accent-cyan)]/10 text-[var(--accent-cyan)]'
                    : 'text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)]'
                }`}
              >
                <span className={`relative ${isActive ? 'text-[var(--accent-cyan)]' : 'text-[var(--text-muted)] group-hover:text-[var(--text-secondary)]'}`}>
                  {item.icon}
                  {isCollapsed && item.badge && (
                    <span
                      className="absolute -top-1 -right-1 text-[8px] min-w-[14px] h-3.5 flex items-center justify-center px-1 rounded-full"
                      style={{
                        backgroundColor: `color-mix(in srgb, ${item.badgeColor} 25%, transparent)`,
                        color: item.badgeColor
                      }}
                    >
                      {item.badge}
                    </span>
                  )}
                </span>
                {!isCollapsed && (
                  <>
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
                  </>
                )}
              </button>
            );
          })}

          {/* 관리자 메뉴 - admin role만 표시 */}
          {isAdmin && (
            <>
              <div className={`${isCollapsed ? 'my-2' : 'my-3'} border-t border-[var(--border-subtle)]`} />
              <button
                onClick={() => router.push('/admin')}
                title={isCollapsed ? '관리자' : undefined}
                className={`w-full flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'} ${
                  isCollapsed ? 'p-3' : 'px-4 py-3'
                } rounded-xl transition-all group text-[var(--text-secondary)] hover:bg-amber-500/10 hover:text-amber-500`}
              >
                <span className="text-[var(--text-muted)] group-hover:text-amber-500">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                </span>
                {!isCollapsed && <span className="font-medium">관리자</span>}
              </button>
            </>
          )}
        </div>

        {/* Collapse Toggle (태블릿에서만 표시) */}
        <div className={`${isCollapsed ? 'p-2' : 'px-4'} pb-2 hidden lg:block`}>
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="w-full p-2 rounded-lg hover:bg-[var(--bg-tertiary)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors flex items-center justify-center"
            title={isCollapsed ? '사이드바 펼치기' : '사이드바 접기'}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className={`transition-transform ${isCollapsed ? 'rotate-180' : ''}`}
            >
              <path d="m11 17-5-5 5-5" />
              <path d="m18 17-5-5 5-5" />
            </svg>
          </button>
        </div>

        {/* Footer */}
        <div className={`${isCollapsed ? 'p-2' : 'p-4'} border-t border-[var(--border-subtle)] space-y-3`}>
          {/* User Info & Logout */}
          {session?.user && (
            <div className={`flex items-center ${isCollapsed ? 'justify-center p-2' : 'justify-between px-4 py-3'} rounded-xl bg-[var(--bg-tertiary)]`}>
              {isCollapsed ? (
                <button
                  onClick={() => signOut({ callbackUrl: '/login' })}
                  className="p-2 rounded-lg hover:bg-[var(--bg-primary)] text-[var(--text-muted)] hover:text-[var(--accent-red)] transition-colors"
                  title="로그아웃"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                    <polyline points="16 17 21 12 16 7" />
                    <line x1="21" x2="9" y1="12" y2="12" />
                  </svg>
                </button>
              ) : (
                <>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[var(--accent-cyan)] to-[var(--accent-purple)] flex items-center justify-center text-white text-sm font-bold">
                      {session.user.name?.charAt(0).toUpperCase() || 'U'}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{session.user.name}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => signOut({ callbackUrl: '/login' })}
                    className="p-2 rounded-lg hover:bg-[var(--bg-primary)] text-[var(--text-muted)] hover:text-[var(--accent-red)] transition-colors"
                    title="로그아웃"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                      <polyline points="16 17 21 12 16 7" />
                      <line x1="21" x2="9" y1="12" y2="12" />
                    </svg>
                  </button>
                </>
              )}
            </div>
          )}

          {/* Tagline */}
          {!isCollapsed && (
            <div className="px-4 py-2">
              <p className="text-xs text-[var(--text-muted)]">AI 가상 팀과 함께 아이디어를 기획서로</p>
            </div>
          )}
        </div>
      </nav>
    </>
  );
}
