'use client';

import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import type { NavItem } from './LNB';

interface MobileBottomNavProps {
  activeItem: NavItem;
  onNavigate: (item: NavItem) => void;
  historyCount: number;
  archiveCount: number;
}

export default function MobileBottomNav({
  activeItem,
  onNavigate,
  historyCount,
  archiveCount,
}: MobileBottomNavProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const isAdmin = session?.user?.role === 'admin';

  const navItems = [
    {
      id: 'home' as NavItem,
      label: '새 협업',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
        </svg>
      ),
      badge: archiveCount > 0 ? archiveCount : null,
      badgeColor: 'var(--accent-purple)',
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-[var(--bg-secondary)] border-t border-[var(--border-subtle)] md:hidden safe-area-inset-bottom">
      <div className="flex items-center justify-around h-16 px-2">
        {navItems.map((item) => {
          const isActive = activeItem === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`flex flex-col items-center justify-center flex-1 h-full py-2 transition-colors relative ${
                isActive
                  ? 'text-[var(--accent-cyan)]'
                  : 'text-[var(--text-muted)]'
              }`}
            >
              <div className="relative">
                {item.icon}
                {item.badge && (
                  <span
                    className="absolute -top-1 -right-2 text-[10px] min-w-[16px] h-4 flex items-center justify-center px-1 rounded-full"
                    style={{
                      backgroundColor: `color-mix(in srgb, ${item.badgeColor} 25%, transparent)`,
                      color: item.badgeColor
                    }}
                  >
                    {item.badge}
                  </span>
                )}
              </div>
              <span className="text-[10px] mt-1 font-medium">{item.label}</span>
              {isActive && (
                <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-[var(--accent-cyan)] rounded-full" />
              )}
            </button>
          );
        })}

        {/* 관리자 버튼 - admin role만 표시 */}
        {isAdmin && (
          <button
            onClick={() => router.push('/admin')}
            className="flex flex-col items-center justify-center flex-1 h-full py-2 text-[var(--text-muted)] hover:text-amber-500 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
            <span className="text-[10px] mt-1 font-medium">관리자</span>
          </button>
        )}

        {/* 로그아웃 버튼 */}
        {session?.user && (
          <button
            onClick={() => signOut({ callbackUrl: '/login' })}
            className="flex flex-col items-center justify-center flex-1 h-full py-2 text-[var(--text-muted)] transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" x2="9" y1="12" y2="12" />
            </svg>
            <span className="text-[10px] mt-1 font-medium">로그아웃</span>
          </button>
        )}
      </div>
    </nav>
  );
}
