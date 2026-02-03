'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { ROLES, LEVEL_ICONS, type TeamMember, type Message, type Role, type CollaborationMode, type DocumentVersion } from '@/types';
import { v4 as uuidv4 } from 'uuid';
import DocumentModal from './DocumentModal';
import { useTeamStore } from '@/store/teamStore';

interface ChatRoomProps {
  goal: string;
  members: TeamMember[];
  onBack: () => void;
  initialMessages?: Message[] | null;
  initialOutput?: string | null;
}

const ROLE_STYLES: Record<Role, { border: string; bg: string; gradient: string; text: string }> = {
  planner: { border: 'border-l-amber-400', bg: 'bg-amber-500/10', gradient: 'from-amber-400 to-orange-500', text: 'text-amber-400' },
  designer: { border: 'border-l-pink-400', bg: 'bg-pink-500/10', gradient: 'from-pink-400 to-rose-500', text: 'text-pink-400' },
  developer: { border: 'border-l-cyan-400', bg: 'bg-cyan-500/10', gradient: 'from-cyan-400 to-blue-500', text: 'text-cyan-400' },
  qa: { border: 'border-l-emerald-400', bg: 'bg-emerald-500/10', gradient: 'from-emerald-400 to-green-500', text: 'text-emerald-400' },
  marketer: { border: 'border-l-purple-400', bg: 'bg-purple-500/10', gradient: 'from-purple-400 to-violet-500', text: 'text-purple-400' },
  analyst: { border: 'border-l-blue-400', bg: 'bg-blue-500/10', gradient: 'from-blue-400 to-indigo-500', text: 'text-blue-400' },
};

// 핵심 포인트 파싱 및 렌더링 함수
function renderHighlightedContent(content: string): React.ReactNode {
  // [[텍스트]] 패턴을 찾아서 하이라이트 처리
  const parts = content.split(/(\[\[.*?\]\])/g);

  return parts.map((part, index) => {
    if (part.startsWith('[[') && part.endsWith(']]')) {
      const highlightedText = part.slice(2, -2);
      return (
        <span
          key={index}
          className="inline-flex items-center gap-1 px-2 py-0.5 mx-0.5 rounded-md bg-gradient-to-r from-cyan-500/20 to-purple-500/20 border border-cyan-500/30 text-[var(--accent-cyan)] font-medium text-sm cursor-default hover:from-cyan-500/30 hover:to-purple-500/30 transition-colors"
          title="핵심 포인트"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
          </svg>
          {highlightedText}
        </span>
      );
    }
    return part;
  });
}

// 메시지들에서 핵심 포인트 추출
function extractKeyPoints(messages: Message[]): { point: string; memberName: string; role: Role }[] {
  const keyPoints: { point: string; memberName: string; role: Role }[] = [];
  const regex = /\[\[(.*?)\]\]/g;

  messages.forEach(msg => {
    if (msg.memberId === 'system' || msg.memberId === 'user') return;

    let match;
    while ((match = regex.exec(msg.content)) !== null) {
      keyPoints.push({
        point: match[1],
        memberName: msg.memberName,
        role: msg.memberRole,
      });
    }
  });

  return keyPoints;
}

const COLLABORATION_MODES: { id: CollaborationMode; name: string; icon: string; topic: string }[] = [
  { id: 'brainstorming', name: '브레인스토밍', icon: '💡', topic: '이 프로젝트의 핵심 아이디어나 방향성에 대해 자유롭게 의견을 제시해주세요.' },
  { id: 'discussion', name: '토론', icon: '💬', topic: '이전 의견들을 바탕으로 찬성/반대 의견이나 보완할 점을 제시해주세요.' },
  { id: 'review', name: '리뷰', icon: '🔍', topic: '지금까지 논의된 내용을 검토하고 개선점이나 리스크를 지적해주세요.' },
  { id: 'execution', name: '실행', icon: '⚡', topic: '구체적인 실행 계획이나 다음 단계를 제안해주세요.' },
];

// 자동 토론 라운드 설정
const AUTO_DISCUSSION_ROUNDS = [
  { mode: 'brainstorming' as CollaborationMode, participants: 'all' },
  { mode: 'discussion' as CollaborationMode, participants: 'partial' },
  { mode: 'review' as CollaborationMode, participants: 'seniors' },
];

export default function ChatRoom({ goal, members, onBack, initialMessages, initialOutput }: ChatRoomProps) {
  const [messages, setMessages] = useState<Message[]>(initialMessages || []);
  const [isTyping, setIsTyping] = useState<string | null>(null);
  const [mode, setMode] = useState<CollaborationMode>('brainstorming');
  const [userInput, setUserInput] = useState('');
  const [showDocumentModal, setShowDocumentModal] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [currentRound, setCurrentRound] = useState(0);
  const [isAutoMode, setIsAutoMode] = useState(false);
  const [discussionComplete, setDiscussionComplete] = useState(!!initialMessages && initialMessages.length > 0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [feedbackMode, setFeedbackMode] = useState(false);
  const [pendingRound, setPendingRound] = useState<number | null>(null);
  const [documentVersions, setDocumentVersions] = useState<DocumentVersion[]>([]);
  const [currentDocVersion, setCurrentDocVersion] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isInitializedRef = useRef(!!initialMessages && initialMessages.length > 0);
  const { saveToHistory, createTeam, addDocumentVersion, setCurrentVersion } = useTeamStore();

  // Create team on mount if not loading from history
  useEffect(() => {
    if (!initialMessages) {
      createTeam(goal);
    }
  }, [goal, initialMessages, createTeam]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // API 호출 함수
  const callGeminiAPI = useCallback(async (member: TeamMember, topic?: string, conversationMessages?: Message[]): Promise<string> => {
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          member,
          goal,
          messages: conversationMessages || messages,
          topic,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'API 호출 실패');
      }

      const data = await response.json();
      setApiError(null);
      return data.content;
    } catch (error) {
      console.error('API 오류:', error);
      setApiError(error instanceof Error ? error.message : 'API 호출 중 오류 발생');
      throw error;
    }
  }, [goal, messages]);

  // 피드백 콜백 ref (async함수에서 상태 접근용)
  const feedbackResolveRef = useRef<((feedback: string | null) => void) | null>(null);

  // 피드백 대기 함수
  const waitForFeedback = useCallback((): Promise<string | null> => {
    return new Promise((resolve) => {
      feedbackResolveRef.current = resolve;
      setFeedbackMode(true);
    });
  }, []);

  // 피드백 제출 처리
  const handleFeedbackSubmit = useCallback((feedback: string | null) => {
    setFeedbackMode(false);
    if (feedbackResolveRef.current) {
      feedbackResolveRef.current(feedback);
      feedbackResolveRef.current = null;
    }
  }, []);

  // 단일 라운드 실행
  const executeRound = useCallback(async (
    roundIndex: number,
    currentMessages: Message[],
    userFeedback?: string | null
  ): Promise<Message[]> => {
    const round = AUTO_DISCUSSION_ROUNDS[roundIndex];
    setCurrentRound(roundIndex + 1);
    setMode(round.mode);

    // 사용자 피드백이 있으면 먼저 추가
    if (userFeedback) {
      const feedbackMessage: Message = {
        id: uuidv4(),
        memberId: 'user',
        memberName: '나',
        memberRole: 'planner',
        memberLevel: 'senior',
        content: `[피드백] ${userFeedback}`,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, feedbackMessage]);
      currentMessages = [...currentMessages, feedbackMessage];
    }

    // 라운드 시작 시스템 메시지
    const systemMessage: Message = {
      id: uuidv4(),
      memberId: 'system',
      memberName: '시스템',
      memberRole: 'planner',
      memberLevel: 'senior',
      content: `📍 ${COLLABORATION_MODES.find(m => m.id === round.mode)?.name} 단계를 시작합니다.`,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, systemMessage]);
    currentMessages = [...currentMessages, systemMessage];

    // 참여할 팀원 선택
    let participants: TeamMember[];
    if (round.participants === 'all') {
      participants = members;
    } else if (round.participants === 'seniors') {
      participants = members.filter(m => m.level === 'senior');
      if (participants.length === 0) participants = members.slice(0, 2);
    } else {
      participants = [...members].sort(() => Math.random() - 0.5).slice(0, Math.min(4, members.length));
    }

    const topicWithFeedback = userFeedback
      ? `${COLLABORATION_MODES.find(m => m.id === round.mode)?.topic || ''}\n\n사용자 피드백: ${userFeedback}`
      : COLLABORATION_MODES.find(m => m.id === round.mode)?.topic || '';

    for (const member of participants) {
      setIsTyping(member.id);
      await new Promise(resolve => setTimeout(resolve, 500));

      try {
        const response = await callGeminiAPI(member, topicWithFeedback, currentMessages);

        const newMessage: Message = {
          id: uuidv4(),
          memberId: member.id,
          memberName: member.name,
          memberRole: member.role,
          memberLevel: member.level,
          content: response,
          timestamp: new Date(),
        };

        setMessages(prev => [...prev, newMessage]);
        currentMessages = [...currentMessages, newMessage];
      } catch (error) {
        console.error('응답 생성 실패:', error);
      }

      setIsTyping(null);
      await new Promise(resolve => setTimeout(resolve, 200));
    }

    return currentMessages;
  }, [members, callGeminiAPI]);

  // 자동 토론 시작
  const startAutoDiscussion = useCallback(async () => {
    if (isAutoMode) return;
    setIsAutoMode(true);
    setDiscussionComplete(false);

    let currentMessages: Message[] = [];

    for (let roundIndex = 0; roundIndex < AUTO_DISCUSSION_ROUNDS.length; roundIndex++) {
      // 첫 번째 라운드가 아니면 피드백 요청
      if (roundIndex > 0) {
        setPendingRound(roundIndex);
        const feedback = await waitForFeedback();
        setPendingRound(null);
        currentMessages = await executeRound(roundIndex, currentMessages, feedback);
      } else {
        currentMessages = await executeRound(roundIndex, currentMessages);
      }

      // 라운드 간 짧은 대기
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    // 토론 완료
    setIsAutoMode(false);
    setDiscussionComplete(true);
    setCurrentRound(0);

    // 완료 메시지
    const completeMessage: Message = {
      id: uuidv4(),
      memberId: 'system',
      memberName: '시스템',
      memberRole: 'planner',
      memberLevel: 'senior',
      content: '✅ 팀 토론이 완료되었습니다. 결과물 생성 버튼을 눌러 기획서를 확인하세요!',
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, completeMessage]);
    currentMessages = [...currentMessages, completeMessage];

    // 히스토리에 저장
    saveToHistory(currentMessages, null);

  }, [members, isAutoMode, executeRound, waitForFeedback, saveToHistory]);

  // 협업 시작 시 자동 토론
  useEffect(() => {
    if (isInitializedRef.current) return;
    isInitializedRef.current = true;

    // 짧은 딜레이 후 자동 토론 시작
    const timer = setTimeout(() => {
      startAutoDiscussion();
    }, 1000);

    return () => clearTimeout(timer);
  }, [startAutoDiscussion]);

  const handleUserMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userInput.trim() || isTyping || isAutoMode) return;

    const userMessage: Message = {
      id: uuidv4(),
      memberId: 'user',
      memberName: '나',
      memberRole: 'planner',
      memberLevel: 'senior',
      content: userInput,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMessage]);
    const currentInput = userInput;
    setUserInput('');

    // 랜덤하게 2-3명의 팀원이 응답
    const respondingMembers = members
      .sort(() => Math.random() - 0.5)
      .slice(0, 2 + Math.floor(Math.random() * 2));

    for (const member of respondingMembers) {
      await new Promise(resolve => setTimeout(resolve, 500));
      setIsTyping(member.id);

      try {
        const response = await callGeminiAPI(member, currentInput);

        const newMessage: Message = {
          id: uuidv4(),
          memberId: member.id,
          memberName: member.name,
          memberRole: member.role,
          memberLevel: member.level,
          content: response,
          timestamp: new Date(),
        };

        setMessages(prev => [...prev, newMessage]);
      } catch (error) {
        console.error('응답 생성 실패:', error);
      }

      setIsTyping(null);
    }
  };

  // 결과물 생성 (새 버전)
  const generateOutput = useCallback(async () => {
    if (isGenerating || messages.length === 0) return;

    setIsGenerating(true);
    setShowDocumentModal(true);

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ goal, messages }),
      });

      if (!response.ok) {
        throw new Error('기획서 생성 실패');
      }

      const data = await response.json();

      // 새 버전 생성
      const newVersion = documentVersions.length + 1;
      const newDoc: DocumentVersion = {
        id: uuidv4(),
        version: newVersion,
        content: data.content,
        changes: '초기 생성',
        createdAt: new Date().toISOString(),
      };

      setDocumentVersions(prev => [...prev, newDoc]);
      setCurrentDocVersion(newVersion);

      // 히스토리에 저장
      saveToHistory(messages, data.content);
      addDocumentVersion(data.content, undefined, '초기 생성');
    } catch (error) {
      console.error('기획서 생성 오류:', error);
      setApiError('기획서 생성 중 오류가 발생했습니다.');
    } finally {
      setIsGenerating(false);
    }
  }, [goal, messages, isGenerating, documentVersions.length, saveToHistory, addDocumentVersion]);

  // 기획서 수정 (피드백 반영)
  const refineDocument = useCallback(async (feedback: string) => {
    const currentDoc = documentVersions.find(v => v.version === currentDocVersion);
    if (isGenerating || !currentDoc) return;

    setIsGenerating(true);

    try {
      const response = await fetch('/api/refine', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentDocument: currentDoc.content,
          feedback,
          goal,
        }),
      });

      if (!response.ok) {
        throw new Error('기획서 수정 실패');
      }

      const data = await response.json();

      // 새 버전 생성
      const newVersion = documentVersions.length + 1;
      const newDoc: DocumentVersion = {
        id: uuidv4(),
        version: newVersion,
        content: data.content,
        feedback,
        changes: data.changes || feedback.slice(0, 30),
        createdAt: new Date().toISOString(),
      };

      setDocumentVersions(prev => [...prev, newDoc]);
      setCurrentDocVersion(newVersion);

      // 히스토리에 저장
      saveToHistory(messages, data.content);
      addDocumentVersion(data.content, feedback, data.changes);
    } catch (error) {
      console.error('기획서 수정 오류:', error);
      setApiError('기획서 수정 중 오류가 발생했습니다.');
    } finally {
      setIsGenerating(false);
    }
  }, [goal, messages, documentVersions, currentDocVersion, isGenerating, saveToHistory, addDocumentVersion]);

  // 버전 변경
  const handleVersionChange = useCallback((version: number) => {
    setCurrentDocVersion(version);
    setCurrentVersion(version);
  }, [setCurrentVersion]);

  const getRoleInfo = (roleId: Role) => ROLES.find(r => r.id === roleId)!;
  const typingMember = members.find(m => m.id === isTyping);
  const currentModeInfo = COLLABORATION_MODES.find(m => m.id === mode);

  // 핵심 포인트 메모이제이션 (불필요한 재계산 방지)
  const keyPoints = useMemo(() => extractKeyPoints(messages), [messages]);

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="h-16 shrink-0 px-6 flex items-center justify-between border-b border-[var(--border-subtle)] bg-[var(--bg-secondary)]">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="p-2 rounded-lg hover:bg-[var(--bg-tertiary)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m15 18-6-6 6-6" />
            </svg>
          </button>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[var(--accent-cyan)] to-[var(--accent-purple)] flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </div>
            <div>
              <p className="text-xs text-[var(--text-muted)]">협업 진행 중</p>
              <p className="font-medium text-sm truncate max-w-md">{goal}</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Mode Indicator */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[var(--bg-tertiary)]">
            <span>{currentModeInfo?.icon}</span>
            <span className="text-sm font-medium">{currentModeInfo?.name}</span>
          </div>

          {/* Document Button */}
          {discussionComplete && (
            <button
              onClick={() => setShowDocumentModal(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--accent-green)]/10 text-[var(--accent-green)] hover:bg-[var(--accent-green)]/20 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                <polyline points="14 2 14 8 20 8" />
              </svg>
              <span className="text-sm font-medium">기획서</span>
              {documentVersions.length > 0 && (
                <span className="text-xs px-1.5 py-0.5 rounded-full bg-[var(--accent-green)]/20">
                  v{currentDocVersion}
                </span>
              )}
            </button>
          )}
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
      {/* Sidebar - Team Members */}
      <aside className="w-64 shrink-0 bg-[var(--bg-secondary)] border-r border-[var(--border-subtle)] hidden lg:flex flex-col">
        {/* 팀 구성 - 고정 높이 */}
        <div className="p-4 border-b border-[var(--border-subtle)] shrink-0">
          <h3 className="text-xs text-[var(--text-tertiary)] uppercase tracking-wider mb-3" style={{ fontFamily: 'var(--font-jetbrains)' }}>
            팀 구성 ({members.length}명)
          </h3>

          <div className="space-y-2 max-h-[180px] overflow-y-auto overscroll-contain pr-1">
            {members.map(member => {
              const roleInfo = getRoleInfo(member.role);
              const isActive = isTyping === member.id;
              const isJunior = member.level === 'junior';
              return (
                <div
                  key={member.id}
                  className={`flex items-center gap-3 p-2 rounded-lg transition-colors ${
                    isActive ? ROLE_STYLES[member.role].bg : 'hover:bg-[var(--bg-tertiary)]'
                  }`}
                >
                  <div className="relative">
                    <div className={`w-8 h-8 rounded-full ${ROLE_STYLES[member.role].bg} flex items-center justify-center text-sm`}>
                      {roleInfo.icon}
                    </div>
                    {isActive && (
                      <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-[var(--bg-secondary)]" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium truncate">{member.name}</span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                        isJunior
                          ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                          : 'bg-purple-500/15 text-purple-400 border border-purple-500/30'
                      }`}>
                        {isJunior ? 'Jr' : 'Sr'}
                      </span>
                    </div>
                    <p className="text-xs text-[var(--text-tertiary)] truncate">{roleInfo.nameKo}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Progress Indicator - 고정 높이 */}
        {isAutoMode && (
          <div className="p-4 border-b border-[var(--border-subtle)] shrink-0">
            <h3 className="text-xs text-[var(--text-tertiary)] uppercase tracking-wider mb-3" style={{ fontFamily: 'var(--font-jetbrains)' }}>
              진행 상황
            </h3>
            <div className="space-y-2">
              {AUTO_DISCUSSION_ROUNDS.map((round, index) => (
                <div
                  key={round.mode}
                  className={`flex items-center gap-2 text-sm ${
                    currentRound > index + 1
                      ? 'text-[var(--accent-green)]'
                      : currentRound === index + 1
                      ? 'text-[var(--accent-cyan)]'
                      : 'text-[var(--text-muted)]'
                  }`}
                >
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs ${
                    currentRound > index + 1
                      ? 'bg-[var(--accent-green)]/20'
                      : currentRound === index + 1
                      ? 'bg-[var(--accent-cyan)]/20 animate-pulse'
                      : 'bg-[var(--bg-tertiary)]'
                  }`}>
                    {currentRound > index + 1 ? '✓' : index + 1}
                  </span>
                  <span>{COLLABORATION_MODES.find(m => m.id === round.mode)?.name}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Collaboration Mode - 고정 높이 */}
        <div className="p-4 shrink-0">
          <h3 className="text-xs text-[var(--text-tertiary)] uppercase tracking-wider mb-3" style={{ fontFamily: 'var(--font-jetbrains)' }}>
            현재 모드
          </h3>
          <div className="p-3 rounded-lg bg-[var(--bg-tertiary)] border border-[var(--border-subtle)]">
            <div className="flex items-center gap-2">
              <span className="text-lg">{currentModeInfo?.icon}</span>
              <span className="font-medium">{currentModeInfo?.name}</span>
            </div>
          </div>
        </div>

        {/* Key Points Summary - 고정 높이, 독립 스크롤 */}
        {keyPoints.length > 0 && (
          <div className="p-4 border-t border-[var(--border-subtle)] shrink-0">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs text-[var(--text-tertiary)] uppercase tracking-wider" style={{ fontFamily: 'var(--font-jetbrains)' }}>
                핵심 포인트
              </h3>
              <span className="text-xs px-1.5 py-0.5 rounded-full bg-[var(--accent-cyan)]/15 text-[var(--accent-cyan)]">
                {keyPoints.length}
              </span>
            </div>
            <div className="max-h-[160px] overflow-y-auto space-y-2 pr-1 overscroll-contain">
              {keyPoints.map((kp, idx) => (
                <button
                  key={`${kp.point}-${idx}`}
                  onClick={() => {
                    setUserInput(prev => prev ? `${prev}, ${kp.point}` : kp.point);
                  }}
                  className="w-full text-left p-2 rounded-lg bg-[var(--bg-tertiary)] hover:bg-[var(--bg-hover)] border border-[var(--border-subtle)] hover:border-[var(--accent-cyan)]/30 transition-all group"
                >
                  <div className="flex items-start gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--accent-cyan)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 mt-0.5">
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                    </svg>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-[var(--text-primary)] group-hover:text-[var(--accent-cyan)] transition-colors line-clamp-2">
                        {kp.point}
                      </p>
                      <p className="text-xs text-[var(--text-muted)] mt-1 flex items-center gap-1">
                        <span className={`w-2 h-2 rounded-full bg-gradient-to-r ${ROLE_STYLES[kp.role].gradient}`} />
                        {kp.memberName}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
            <p className="text-[10px] text-[var(--text-muted)] mt-2 text-center">
              클릭하면 피드백에 추가됩니다
            </p>
          </div>
        )}

        {/* Spacer - 남은 공간 채우기 */}
        <div className="flex-1" />

        {/* API Status - 고정 위치 */}
        {apiError && (
          <div className="p-4 border-t border-[var(--border-subtle)] shrink-0">
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30">
              <p className="text-xs text-red-400">{apiError}</p>
            </div>
          </div>
        )}
      </aside>

      {/* Main Chat Area */}
      <main className="flex-1 flex flex-col min-w-0 min-h-0 h-[calc(100vh-4rem)]">
        {/* Chat Header */}
        <div className="h-16 shrink-0 bg-[var(--bg-secondary)] border-b border-[var(--border-subtle)] flex items-center justify-between px-6">
          <div>
            <h2 className="text-sm font-medium">{goal}</h2>
            <p className="text-xs text-[var(--text-tertiary)]">
              {currentModeInfo?.icon} {currentModeInfo?.name} 모드
              {isAutoMode && <span className="ml-2 text-[var(--accent-cyan)]">• 자동 진행 중...</span>}
              {discussionComplete && <span className="ml-2 text-[var(--accent-green)]">• 토론 완료</span>}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {!isAutoMode && !discussionComplete && (
              <button
                onClick={startAutoDiscussion}
                className="btn btn-secondary text-sm py-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="6 3 20 12 6 21 6 3" />
                </svg>
                토론 시작
              </button>
            )}
            <button
              onClick={() => {
                if (documentVersions.length > 0) {
                  setShowDocumentModal(true);
                } else {
                  generateOutput();
                }
              }}
              disabled={isGenerating || messages.length === 0}
              className={`btn text-sm py-2 ${discussionComplete ? 'btn-primary animate-pulse-glow' : 'btn-secondary'} disabled:opacity-50`}
            >
              {isGenerating ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  생성 중...
                </>
              ) : documentVersions.length > 0 ? (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                    <polyline points="14 2 14 8 20 8" />
                  </svg>
                  기획서 보기
                  <span className="text-xs px-1.5 py-0.5 rounded bg-white/20">v{currentDocVersion}</span>
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                    <polyline points="14 2 14 8 20 8" />
                  </svg>
                  기획서 생성
                </>
              )}
            </button>
          </div>
        </div>

        {/* Messages - Fixed Height with Internal Scroll */}
        <div className="flex-1 min-h-0 overflow-hidden p-4">
          <div className="h-full overflow-y-auto rounded-xl bg-[var(--bg-secondary)]/50 border border-[var(--border-subtle)] p-4 space-y-4 scroll-smooth">
            {messages.map((message, index) => {
              // 시스템 메시지
              if (message.memberId === 'system') {
                return (
                  <div key={message.id} className="flex justify-center animate-fadeIn">
                    <div className="px-4 py-2 rounded-full bg-[var(--bg-tertiary)] border border-[var(--border-subtle)]">
                      <p className="text-sm text-[var(--text-secondary)]">{message.content}</p>
                    </div>
                  </div>
                );
              }

              // 사용자 메시지
              if (message.memberId === 'user') {
                return (
                  <div key={message.id} className="flex justify-end animate-slideUp">
                    <div className="max-w-[70%] bg-gradient-to-br from-cyan-500/20 to-purple-500/20 rounded-2xl rounded-tr-sm p-4 border border-[var(--border-subtle)]">
                      <p className="text-[var(--text-primary)]" style={{ fontFamily: 'var(--font-space)' }}>
                        {message.content}
                      </p>
                    </div>
                  </div>
                );
              }

              // 팀원 메시지
              const roleInfo = getRoleInfo(message.memberRole);
              return (
                <div
                  key={message.id}
                  className={`flex gap-3 animate-slideUp border-l-2 pl-4 ${ROLE_STYLES[message.memberRole].border}`}
                  style={{ animationDelay: `${Math.min(index * 0.03, 0.3)}s` }}
                >
                  <div className={`w-10 h-10 rounded-full ${ROLE_STYLES[message.memberRole].bg} flex items-center justify-center shrink-0`}>
                    {roleInfo.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium">{message.memberName}</span>
                      <span className="text-xs text-[var(--text-tertiary)]">{roleInfo.nameKo}</span>
                      <span className="text-xs">{LEVEL_ICONS[message.memberLevel]}</span>
                      <span className="text-xs text-[var(--text-muted)]">
                        {new Date(message.timestamp).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-[var(--text-secondary)] leading-relaxed whitespace-pre-wrap" style={{ fontFamily: 'var(--font-space)' }}>
                      {renderHighlightedContent(message.content)}
                    </p>
                  </div>
                </div>
              );
            })}

            {/* Typing Indicator */}
            {typingMember && (
              <div className={`flex gap-3 animate-fadeIn border-l-2 pl-4 ${ROLE_STYLES[typingMember.role].border}`}>
                <div className={`w-10 h-10 rounded-full ${ROLE_STYLES[typingMember.role].bg} flex items-center justify-center shrink-0`}>
                  {getRoleInfo(typingMember.role).icon}
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">{typingMember.name}</span>
                  <span className="text-xs text-[var(--text-tertiary)]">생각 중...</span>
                  <div className="typing-indicator">
                    <span />
                    <span />
                    <span />
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Feedback Area (when in feedback mode) */}
        {feedbackMode && pendingRound !== null && (
          <div className="shrink-0 p-4 border-t border-[var(--border-subtle)] bg-gradient-to-r from-purple-500/10 to-cyan-500/10">
            <div className="mb-3">
              <div className="flex items-center gap-2 text-sm font-medium text-[var(--text-primary)]">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--accent-purple)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
                피드백 요청
              </div>
              <p className="text-xs text-[var(--text-tertiary)] mt-1">
                다음 단계({COLLABORATION_MODES.find(m => m.id === AUTO_DISCUSSION_ROUNDS[pendingRound].mode)?.name})에 반영할 피드백을 입력하세요.
              </p>
            </div>
            <div className="flex gap-3">
              <input
                type="text"
                value={userInput}
                onChange={e => setUserInput(e.target.value)}
                placeholder="예: 마케팅 관점도 고려해주세요..."
                className="flex-1 bg-[var(--bg-tertiary)] border border-[var(--accent-purple)]/30 rounded-xl px-4 py-3 text-sm focus:border-[var(--accent-purple)]"
                style={{ fontFamily: 'var(--font-space)' }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleFeedbackSubmit(userInput.trim() || null);
                    setUserInput('');
                  }
                }}
              />
              <button
                onClick={() => {
                  handleFeedbackSubmit(userInput.trim() || null);
                  setUserInput('');
                }}
                className="btn btn-primary"
              >
                {userInput.trim() ? '제출' : '건너뛰기'}
              </button>
            </div>
          </div>
        )}

        {/* Input Area */}
        {!feedbackMode && (
          <form onSubmit={handleUserMessage} className="shrink-0 p-4 border-t border-[var(--border-subtle)] bg-[var(--bg-secondary)]">
            <div className="flex gap-3">
              <input
                type="text"
                value={userInput}
                onChange={e => setUserInput(e.target.value)}
                placeholder={isAutoMode ? "자동 토론 진행 중..." : "팀에게 질문하거나 의견을 요청하세요..."}
                className="flex-1 bg-[var(--bg-tertiary)] border border-[var(--border-subtle)] rounded-xl px-4 py-3 text-sm focus:border-[var(--accent-cyan)]"
                style={{ fontFamily: 'var(--font-space)' }}
                disabled={isTyping !== null || isAutoMode}
              />
              <button
                type="submit"
                disabled={!userInput.trim() || isTyping !== null || isAutoMode}
                className="btn btn-primary disabled:opacity-50"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m22 2-7 20-4-9-9-4Z" />
                  <path d="M22 2 11 13" />
                </svg>
              </button>
            </div>
          </form>
        )}
      </main>
      </div>

      {/* Document Modal */}
      <DocumentModal
        isOpen={showDocumentModal}
        onClose={() => setShowDocumentModal(false)}
        goal={goal}
        versions={documentVersions}
        currentVersion={currentDocVersion}
        isGenerating={isGenerating}
        onGenerate={generateOutput}
        onRefine={refineDocument}
        onVersionChange={handleVersionChange}
      />
    </div>
  );
}
