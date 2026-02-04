'use client';

import { useState } from 'react';
import type { SessionHistory } from '@/types';
import { useAlert } from './AlertModal';

interface HistoryViewProps {
  history: SessionHistory[];
  onLoadSession: (session: SessionHistory) => void;
  onDeleteSession: (sessionId: string) => void;
  onClearHistory: () => void;
}

export default function HistoryView({
  history,
  onLoadSession,
  onDeleteSession,
  onClearHistory,
}: HistoryViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const { confirm } = useAlert();

  const filteredHistory = history.filter(session =>
    session.goal.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (history.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
        <div className="w-20 h-20 rounded-2xl bg-[var(--bg-tertiary)] flex items-center justify-center mb-6">
          <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
        </div>
        <h2 className="text-xl font-semibold mb-2">아직 히스토리가 없습니다</h2>
        <p className="text-[var(--text-secondary)] max-w-md">
          새 협업을 시작하면 여기에 세션 기록이 저장됩니다.<br />
          이전에 진행한 토론을 언제든 이어갈 수 있어요.
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full">
      {/* Header */}
      <div className="shrink-0 px-8 py-6 border-b border-[var(--border-subtle)]">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold">히스토리</h1>
              <p className="text-sm text-[var(--text-secondary)] mt-1">이전 협업 세션을 확인하고 이어서 진행하세요</p>
            </div>
          {history.length > 0 && (
            <button
              onClick={async () => {
                const confirmed = await confirm({
                  title: '전체 삭제',
                  message: '모든 히스토리를 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다.',
                  type: 'warning',
                  confirmText: '삭제',
                  cancelText: '취소',
                });
                if (confirmed) {
                  onClearHistory();
                }
              }}
              className="text-sm text-red-400 hover:text-red-300 px-3 py-1.5 rounded-lg hover:bg-red-500/10 transition-colors"
            >
              전체 삭제
            </button>
          )}
        </div>

          {/* Search */}
          <div className="relative">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="absolute left-4 top-1/2 -translate-y-1/2">
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.3-4.3" />
            </svg>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="세션 검색..."
              className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-subtle)] rounded-xl pl-12 pr-4 py-3 focus:border-[var(--accent-cyan)] focus:outline-none transition-colors"
            />
          </div>
        </div>
      </div>

      {/* Session List */}
      <div className="flex-1 overflow-y-auto overscroll-contain p-8">
        {filteredHistory.length === 0 ? (
          <div className="text-center py-12 text-[var(--text-secondary)]">
            검색 결과가 없습니다
          </div>
        ) : (
          <div className="grid gap-4 max-w-4xl mx-auto">
            {filteredHistory.map((session) => (
              <div
                key={session.id}
                onClick={() => onLoadSession(session)}
                className="p-5 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)] hover:border-[var(--accent-cyan)]/50 transition-all cursor-pointer group"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-lg truncate group-hover:text-[var(--accent-cyan)] transition-colors">
                      {session.goal}
                    </h3>
                    <div className="flex items-center gap-4 mt-3">
                      <span className="flex items-center gap-1.5 text-sm text-[var(--text-tertiary)]">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                          <circle cx="9" cy="7" r="4" />
                          <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                        </svg>
                        {session.members.length}명
                      </span>
                      <span className="flex items-center gap-1.5 text-sm text-[var(--text-tertiary)]">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                        </svg>
                        {session.messages.length}개 메시지
                      </span>
                      {session.documentVersions && session.documentVersions.length > 0 && (
                        <span className="flex items-center gap-1.5 text-sm text-[var(--accent-green)]">
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                            <polyline points="14 2 14 8 20 8" />
                          </svg>
                          기획서 v{Math.max(...session.documentVersions.map(v => v.version))}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-[var(--text-muted)] mt-3">
                      {new Date(session.updatedAt).toLocaleDateString('ko-KR', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={async (e) => {
                        e.stopPropagation();
                        const confirmed = await confirm({
                          title: '세션 삭제',
                          message: '이 세션을 삭제하시겠습니까?',
                          type: 'warning',
                          confirmText: '삭제',
                          cancelText: '취소',
                        });
                        if (confirmed) {
                          onDeleteSession(session.id);
                        }
                      }}
                      className="p-2 rounded-lg text-[var(--text-muted)] hover:text-red-400 hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition-all"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M3 6h18" />
                        <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                        <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                      </svg>
                    </button>
                    <div className="p-2 rounded-lg text-[var(--text-muted)] group-hover:text-[var(--accent-cyan)] transition-colors">
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="m9 18 6-6-6-6" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
