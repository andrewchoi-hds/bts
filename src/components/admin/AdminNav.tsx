'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navItems = [
  {
    href: '/admin',
    label: '대시보드',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect width="7" height="9" x="3" y="3" rx="1" />
        <rect width="7" height="5" x="14" y="3" rx="1" />
        <rect width="7" height="9" x="14" y="12" rx="1" />
        <rect width="7" height="5" x="3" y="16" rx="1" />
      </svg>
    ),
  },
  {
    href: '/admin/users',
    label: '사용자 관리',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
];

export default function AdminNav() {
  const pathname = usePathname();

  return (
    <nav className="w-64 h-full bg-[var(--bg-secondary)] border-r border-[var(--border-subtle)] flex flex-col shrink-0">
      {/* Header */}
      <div className="p-6 border-b border-[var(--border-subtle)]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2a10 10 0 1 0 10 10 4 4 0 0 1-5-5 4 4 0 0 1-5-5" />
              <path d="M8.5 8.5v.01" />
              <path d="M16 15.5v.01" />
              <path d="M12 12v.01" />
              <path d="M11 17v.01" />
              <path d="M7 14v.01" />
            </svg>
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight">Admin</h1>
            <p className="text-xs text-[var(--text-muted)]">BTS 관리자</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 p-4 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                isActive
                  ? 'bg-amber-500/10 text-amber-500'
                  : 'text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)]'
              }`}
            >
              <span className={isActive ? 'text-amber-500' : 'text-[var(--text-muted)]'}>
                {item.icon}
              </span>
              <span className="font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-[var(--border-subtle)]">
        <Link
          href="/"
          className="flex items-center gap-3 px-4 py-3 rounded-xl text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)] transition-all"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m15 18-6-6 6-6" />
          </svg>
          <span className="font-medium">BTS로 돌아가기</span>
        </Link>
      </div>
    </nav>
  );
}
