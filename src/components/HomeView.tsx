'use client';

import { useMemo } from 'react';
import GoalInput from './GoalInput';
import StatsCard from './dashboard/StatsCard';
import RoleChart from './dashboard/RoleChart';
import { useTeamStore } from '@/store/teamStore';
import type { AIModel } from '@/types';

interface HomeViewProps {
  onStartCollaboration: (goal: string, model: AIModel) => void;
}

export default function HomeView({ onStartCollaboration }: HomeViewProps) {
  const { history, getSessionStats, getRoleAnalysis } = useTeamStore();

  const stats = useMemo(() => getSessionStats(), [history]);
  const roleStats = useMemo(() => getRoleAnalysis(), [history]);

  const hasHistory = history.length > 0;

  return (
    <div className="flex-1 flex flex-col overflow-y-auto overscroll-contain">
      {/* 메인 입력 영역 */}
      <div className={`flex items-center justify-center ${hasHistory ? 'pt-8 pb-4' : 'flex-1'}`}>
        <GoalInput onSubmit={onStartCollaboration} />
      </div>

      {/* 대시보드 섹션 - 히스토리가 있는 경우에만 표시 */}
      {hasHistory && (
        <div className="px-4 md:px-8 pb-8 md:pb-24">
          <div className="max-w-4xl mx-auto space-y-6">
            {/* 섹션 헤더 */}
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[var(--accent-cyan)] to-[var(--accent-purple)] flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 3v18h18" />
                  <path d="m19 9-5 5-4-4-3 3" />
                </svg>
              </div>
              <div>
                <h2 className="text-lg font-semibold">나의 협업 현황</h2>
                <p className="text-xs text-[var(--text-muted)]">지금까지의 AI 팀 협업 통계</p>
              </div>
            </div>

            {/* 통계 카드 */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
              <StatsCard
                label="총 세션"
                value={stats.totalSessions}
                icon={
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                  </svg>
                }
                color="cyan"
              />
              <StatsCard
                label="총 메시지"
                value={stats.totalMessages}
                icon={
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M7 17L17 7" />
                    <path d="M7 7h10v10" />
                  </svg>
                }
                color="purple"
              />
              <StatsCard
                label="생성된 기획서"
                value={stats.totalDocuments}
                icon={
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                    <polyline points="14 2 14 8 20 8" />
                  </svg>
                }
                color="green"
              />
              <StatsCard
                label="평균 팀원 수"
                value={stats.avgTeamSize}
                subValue="명 / 세션"
                icon={
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                  </svg>
                }
                color="amber"
              />
            </div>

            {/* 역할 분석 */}
            {roleStats.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <RoleChart roleStats={roleStats} />

                {/* 최근 세션 */}
                <div className="p-4 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)]">
                  <h3 className="text-sm font-medium mb-4">최근 세션</h3>
                  <div className="space-y-3">
                    {history.slice(0, 3).map((session) => (
                      <div
                        key={session.id}
                        className="p-3 rounded-lg bg-[var(--bg-tertiary)] hover:bg-[var(--bg-hover)] transition-colors"
                      >
                        <p className="text-sm font-medium truncate">{session.goal}</p>
                        <div className="flex items-center gap-3 mt-2 text-xs text-[var(--text-muted)]">
                          <span>{session.members.length}명</span>
                          <span>·</span>
                          <span>{session.messages.length}개 메시지</span>
                          {session.documentVersions.length > 0 && (
                            <>
                              <span>·</span>
                              <span className="text-[var(--accent-green)]">
                                v{session.documentVersions.length}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
