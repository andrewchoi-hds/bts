// Zustand 스토어 - 팀 상태 관리
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import type {
  Team,
  TeamMember,
  Message,
  Role,
  Level,
  AIModel,
  CollaborationMode,
  ProjectSettings,
  SessionHistory,
  DocumentVersion
} from '@/types';

const MAX_HISTORY_COUNT = 10;

interface TeamState {
  // 상태
  team: Team | null;
  isLoading: boolean;
  error: string | null;
  collaborationMode: CollaborationMode;
  settings: ProjectSettings;

  // 히스토리
  history: SessionHistory[];

  // 팀 관리
  createTeam: (goal: string) => void;
  addMember: (role: Role, level: Level, name: string) => void;
  removeMember: (memberId: string) => void;
  clearTeam: () => void;

  // 메시지 관리
  addMessage: (memberId: string, content: string) => void;
  clearMessages: () => void;

  // 설정 관리
  setCollaborationMode: (mode: CollaborationMode) => void;
  setDefaultModel: (model: AIModel) => void;
  setMemberModel: (memberId: string, model: AIModel) => void;

  // 로딩/에러 상태
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;

  // 히스토리 관리
  saveToHistory: (messages: Message[], generatedOutput: string | null) => void;
  loadFromHistory: (sessionId: string) => SessionHistory | null;
  deleteFromHistory: (sessionId: string) => void;
  clearHistory: () => void;

  // 버전 관리
  addDocumentVersion: (content: string, feedback?: string, changes?: string) => DocumentVersion | null;
  getCurrentDocument: () => DocumentVersion | null;
  setCurrentVersion: (version: number) => void;
}

// 기본 페르소나 생성
function createDefaultPersona(role: Role, level: Level) {
  const juniorTraits = {
    personality: '열정적이고 호기심이 많음',
    speakingStyle: '친근하고 에너지 넘치는 말투',
    perspective: '새로운 시각과 트렌드 중심',
    strengths: ['창의성', '트렌드 파악', '새로운 아이디어'],
  };

  const seniorTraits = {
    personality: '신중하고 분석적',
    speakingStyle: '차분하고 논리적인 말투',
    perspective: '경험과 검증 중심',
    strengths: ['리스크 관리', '실현 가능성 검토', '품질 보증'],
  };

  return level === 'junior' ? juniorTraits : seniorTraits;
}

// 기본 이름 생성
const defaultNames: Record<Role, Record<Level, string>> = {
  planner: { junior: '민준', senior: '서연' },
  designer: { junior: '지호', senior: '수아' },
  developer: { junior: '도윤', senior: '지민' },
  qa: { junior: '예준', senior: '현우' },
  marketer: { junior: '시우', senior: '하윤' },
  analyst: { junior: '준서', senior: '지유' },
};

export const useTeamStore = create<TeamState>()(
  persist(
    (set, get) => ({
  // 초기 상태
  team: null,
  isLoading: false,
  error: null,
  collaborationMode: 'brainstorming',
  settings: {
    defaultModel: 'gemini',
    memberModels: {},
  },
  history: [],

  // 팀 생성
  createTeam: (goal: string) => {
    const team: Team = {
      id: uuidv4(),
      goal,
      members: [],
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    set({ team, error: null });
  },

  // 팀원 추가
  addMember: (role: Role, level: Level, name?: string) => {
    const { team, settings } = get();
    if (!team) return;

    const member: TeamMember = {
      id: uuidv4(),
      role,
      level,
      name: name || defaultNames[role][level],
      persona: createDefaultPersona(role, level),
      model: settings.defaultModel,
    };

    set({
      team: {
        ...team,
        members: [...team.members, member],
        updatedAt: new Date(),
      },
    });
  },

  // 팀원 제거
  removeMember: (memberId: string) => {
    const { team } = get();
    if (!team) return;

    set({
      team: {
        ...team,
        members: team.members.filter(m => m.id !== memberId),
        updatedAt: new Date(),
      },
    });
  },

  // 팀 초기화
  clearTeam: () => {
    set({ team: null, error: null });
  },

  // 메시지 추가
  addMessage: (memberId: string, content: string) => {
    const { team } = get();
    if (!team) return;

    const member = team.members.find(m => m.id === memberId);
    if (!member) return;

    const message: Message = {
      id: uuidv4(),
      memberId,
      memberName: member.name,
      memberRole: member.role,
      memberLevel: member.level,
      content,
      timestamp: new Date(),
    };

    set({
      team: {
        ...team,
        messages: [...team.messages, message],
        updatedAt: new Date(),
      },
    });
  },

  // 메시지 초기화
  clearMessages: () => {
    const { team } = get();
    if (!team) return;

    set({
      team: {
        ...team,
        messages: [],
        updatedAt: new Date(),
      },
    });
  },

  // 협업 모드 설정
  setCollaborationMode: (mode: CollaborationMode) => {
    set({ collaborationMode: mode });
  },

  // 기본 모델 설정
  setDefaultModel: (model: AIModel) => {
    set(state => ({
      settings: {
        ...state.settings,
        defaultModel: model,
      },
    }));
  },

  // 팀원별 모델 설정
  setMemberModel: (memberId: string, model: AIModel) => {
    set(state => ({
      settings: {
        ...state.settings,
        memberModels: {
          ...state.settings.memberModels,
          [memberId]: model,
        },
      },
    }));
  },

  // 로딩 상태
  setLoading: (loading: boolean) => {
    set({ isLoading: loading });
  },

  // 에러 상태
  setError: (error: string | null) => {
    set({ error });
  },

  // 히스토리에 저장
  saveToHistory: (messages: Message[], generatedOutput: string | null) => {
    const { team, history } = get();
    if (!team || messages.length === 0) return;

    const now = new Date().toISOString();
    const existingIndex = history.findIndex(h => h.id === team.id);
    const existingSession = existingIndex >= 0 ? history[existingIndex] : null;

    const session: SessionHistory = {
      id: team.id,
      goal: team.goal,
      members: team.members,
      messages,
      generatedOutput,
      documentVersions: existingSession?.documentVersions || [],
      currentVersion: existingSession?.currentVersion || 0,
      createdAt: existingSession?.createdAt || now,
      updatedAt: now,
    };

    let newHistory: SessionHistory[];
    if (existingIndex >= 0) {
      // 기존 세션 업데이트
      newHistory = [...history];
      newHistory[existingIndex] = session;
    } else {
      // 새 세션 추가 (최대 개수 제한)
      newHistory = [session, ...history].slice(0, MAX_HISTORY_COUNT);
    }

    set({ history: newHistory });
  },

  // 히스토리에서 불러오기
  loadFromHistory: (sessionId: string) => {
    const { history } = get();
    return history.find(h => h.id === sessionId) || null;
  },

  // 히스토리에서 삭제
  deleteFromHistory: (sessionId: string) => {
    const { history } = get();
    set({ history: history.filter(h => h.id !== sessionId) });
  },

  // 히스토리 전체 삭제
  clearHistory: () => {
    set({ history: [] });
  },

  // 문서 버전 추가
  addDocumentVersion: (content: string, feedback?: string, changes?: string) => {
    const { team, history } = get();
    if (!team) return null;

    const existingIndex = history.findIndex(h => h.id === team.id);
    if (existingIndex < 0) return null;

    const session = history[existingIndex];
    const newVersion = session.documentVersions.length + 1;

    const version: DocumentVersion = {
      id: uuidv4(),
      version: newVersion,
      content,
      feedback,
      changes,
      createdAt: new Date().toISOString(),
    };

    const updatedSession: SessionHistory = {
      ...session,
      documentVersions: [...session.documentVersions, version],
      currentVersion: newVersion,
      generatedOutput: content, // 최신 버전을 기본으로
      updatedAt: new Date().toISOString(),
    };

    const newHistory = [...history];
    newHistory[existingIndex] = updatedSession;
    set({ history: newHistory });

    return version;
  },

  // 현재 문서 가져오기
  getCurrentDocument: () => {
    const { team, history } = get();
    if (!team) return null;

    const session = history.find(h => h.id === team.id);
    if (!session || session.documentVersions.length === 0) return null;

    return session.documentVersions.find(v => v.version === session.currentVersion) || null;
  },

  // 현재 버전 변경
  setCurrentVersion: (version: number) => {
    const { team, history } = get();
    if (!team) return;

    const existingIndex = history.findIndex(h => h.id === team.id);
    if (existingIndex < 0) return;

    const session = history[existingIndex];
    const targetVersion = session.documentVersions.find(v => v.version === version);
    if (!targetVersion) return;

    const updatedSession: SessionHistory = {
      ...session,
      currentVersion: version,
      updatedAt: new Date().toISOString(),
    };

    const newHistory = [...history];
    newHistory[existingIndex] = updatedSession;
    set({ history: newHistory });
  },
}),
    {
      name: 'bts-storage',
      partialize: (state) => ({
        history: state.history,
        settings: state.settings,
      }),
    }
  )
);
