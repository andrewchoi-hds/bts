'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import LNB, { type NavItem } from '@/components/LNB';
import HomeView from '@/components/HomeView';
import HistoryView from '@/components/HistoryView';
import ArchiveView from '@/components/ArchiveView';
import TeamBuilder from '@/components/TeamBuilder';
import ChatRoom from '@/components/ChatRoom';
import type { TeamMember, Message, SessionHistory, AIModel } from '@/types';
import { useTeamStore } from '@/store/teamStore';

type CollaborationStep = 'idle' | 'team-building' | 'chatroom';

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();

  // 모든 hooks를 조건부 return 전에 선언
  const [activeNav, setActiveNav] = useState<NavItem>('home');
  const [collabStep, setCollabStep] = useState<CollaborationStep>('idle');
  const [goal, setGoal] = useState('');
  const [defaultModel, setDefaultModel] = useState<AIModel>('gemini');
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loadedMessages, setLoadedMessages] = useState<Message[] | null>(null);
  const [loadedOutput, setLoadedOutput] = useState<string | null>(null);

  const { history, deleteFromHistory, clearHistory } = useTeamStore();

  // 인증 체크
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  // 협업 시작
  const handleStartCollaboration = (newGoal: string, model: AIModel) => {
    setGoal(newGoal);
    setDefaultModel(model);
    setLoadedMessages(null);
    setLoadedOutput(null);
    setCollabStep('team-building');
  };

  // 팀 구성 완료
  const handleTeamComplete = (newMembers: TeamMember[]) => {
    setMembers(newMembers);
    setCollabStep('chatroom');
  };

  // 히스토리에서 세션 불러오기
  const handleLoadSession = (session: SessionHistory) => {
    setGoal(session.goal);
    setMembers(session.members);
    setLoadedMessages(session.messages);
    setLoadedOutput(session.generatedOutput);
    setCollabStep('chatroom');
  };

  // 대시보드로 돌아가기
  const handleBackToDashboard = () => {
    setCollabStep('idle');
    setGoal('');
    setMembers([]);
    setLoadedMessages(null);
    setLoadedOutput(null);
    setActiveNav('home');
  };

  // 팀 구성으로 돌아가기
  const handleBackToTeamBuilder = () => {
    setCollabStep('team-building');
  };

  // 목표 입력으로 돌아가기
  const handleBackToGoal = () => {
    setCollabStep('idle');
  };

  // 로딩 중
  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg-primary)]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-[var(--accent-cyan)]/20 border-t-[var(--accent-cyan)] rounded-full animate-spin" />
          <p className="text-[var(--text-muted)]">로딩 중...</p>
        </div>
      </div>
    );
  }

  // 미인증
  if (!session) {
    return null;
  }

  // 협업 진행 중인 경우 전체 화면
  if (collabStep === 'team-building') {
    return (
      <div className="min-h-screen bg-[var(--bg-primary)]">
        {/* Mini Header for Team Building */}
        <header className="h-16 px-6 flex items-center justify-between border-b border-[var(--border-subtle)] bg-[var(--bg-secondary)]">
          <div className="flex items-center gap-4">
            <button
              onClick={handleBackToGoal}
              className="p-2 rounded-lg hover:bg-[var(--bg-tertiary)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="m15 18-6-6 6-6" />
              </svg>
            </button>
            <div>
              <p className="text-xs text-[var(--text-muted)]">목표</p>
              <p className="font-medium truncate max-w-md">{goal}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm text-[var(--text-muted)]">
            <span className="w-6 h-6 rounded-full bg-[var(--accent-cyan)] text-white flex items-center justify-center text-xs font-medium">1</span>
            <span className="text-[var(--accent-cyan)]">팀 구성</span>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m9 18 6-6-6-6" />
            </svg>
            <span className="w-6 h-6 rounded-full bg-[var(--bg-tertiary)] flex items-center justify-center text-xs">2</span>
            <span>협업</span>
          </div>
        </header>

        <TeamBuilder
          goal={goal}
          defaultModel={defaultModel}
          onComplete={handleTeamComplete}
          onBack={handleBackToGoal}
        />
      </div>
    );
  }

  if (collabStep === 'chatroom') {
    return (
      <ChatRoom
        goal={goal}
        members={members}
        onBack={handleBackToDashboard}
        initialMessages={loadedMessages}
        initialOutput={loadedOutput}
      />
    );
  }

  // 대시보드 (기본 상태)
  return (
    <div className="h-screen bg-[var(--bg-primary)] flex overflow-hidden">
      {/* LNB */}
      <LNB
        activeItem={activeNav}
        onNavigate={setActiveNav}
      />

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-full overflow-hidden">
        {activeNav === 'home' && (
          <HomeView onStartCollaboration={handleStartCollaboration} />
        )}

        {activeNav === 'history' && (
          <HistoryView
            history={history}
            onLoadSession={handleLoadSession}
            onDeleteSession={deleteFromHistory}
            onClearHistory={clearHistory}
          />
        )}

        {activeNav === 'archive' && (
          <ArchiveView
            history={history}
            onDeleteSession={deleteFromHistory}
          />
        )}
      </main>
    </div>
  );
}
