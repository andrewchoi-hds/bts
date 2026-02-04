// BTS (Build Team Service) - 타입 정의

// 역할 타입
export type Role =
  | 'planner'    // 기획자
  | 'designer'   // 디자이너
  | 'developer'  // 개발자
  | 'qa'         // QA 엔지니어
  | 'marketer'   // 마케터
  | 'analyst'    // 데이터 분석가
  | 'security'   // 보안 담당자
  | 'user';      // 사용자 (페르소나)

// 레벨 타입
export type Level = 'junior' | 'senior';

// AI 모델 타입
export type AIModel = 'gemini' | 'claude' | 'gpt';

// 역할 정보
export interface RoleInfo {
  id: Role;
  name: string;
  nameKo: string;
  description: string;
  icon: string;
}

// 팀원 정의
export interface TeamMember {
  id: string;
  role: Role;
  level: Level;
  name: string;
  persona: Persona;
  model: AIModel;
}

// 페르소나 정의
export interface Persona {
  personality: string;      // 성격
  speakingStyle: string;    // 말투
  perspective: string;      // 관점
  strengths: string[];      // 강점
}

// 메시지 정의
export interface Message {
  id: string;
  memberId: string;
  memberName: string;
  memberRole: Role;
  memberLevel: Level;
  content: string;
  timestamp: Date;
}

// 팀 정의
export interface Team {
  id: string;
  goal: string;
  members: TeamMember[];
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
}

// 협업 모드
export type CollaborationMode =
  | 'brainstorming'  // 브레인스토밍
  | 'discussion'     // 토론
  | 'review'         // 리뷰
  | 'execution';     // 실행

// 결과물 타입
export type OutputType =
  | 'plan'           // 기획서
  | 'proposal'       // 제안서
  | 'design-guide'   // 디자인 가이드
  | 'tech-spec'      // 기술 스펙
  | 'analysis'       // 분석 리포트
  | 'test-plan';     // 테스트 계획

// 프로젝트 설정
export interface ProjectSettings {
  defaultModel: AIModel;
  memberModels: Record<string, AIModel>;  // memberId -> model
}

// 역할 상수
export const ROLES: RoleInfo[] = [
  {
    id: 'planner',
    name: 'Planner',
    nameKo: '기획자',
    description: '전략 수립, 요구사항 정의, 일정 관리',
    icon: '📋',
  },
  {
    id: 'designer',
    name: 'Designer',
    nameKo: '디자이너',
    description: 'UI/UX 설계, 시각적 방향 제시',
    icon: '🎨',
  },
  {
    id: 'developer',
    name: 'Developer',
    nameKo: '개발자',
    description: '기술 검토, 구현 가능성 분석',
    icon: '💻',
  },
  {
    id: 'qa',
    name: 'QA Engineer',
    nameKo: 'QA 엔지니어',
    description: '품질 검증, 예외 케이스 발견',
    icon: '🔍',
  },
  {
    id: 'marketer',
    name: 'Marketer',
    nameKo: '마케터',
    description: '시장 분석, 포지셔닝 전략',
    icon: '📢',
  },
  {
    id: 'analyst',
    name: 'Data Analyst',
    nameKo: '데이터 분석가',
    description: '데이터 기반 의사결정 지원',
    icon: '📊',
  },
  {
    id: 'security',
    name: 'Security Manager',
    nameKo: '보안 담당자',
    description: '보안 취약점 검토, 개인정보 보호',
    icon: '🛡️',
  },
  {
    id: 'user',
    name: 'User Persona',
    nameKo: '사용자',
    description: '실제 사용자 관점에서 피드백 제공',
    icon: '👤',
  },
];

// 레벨 아이콘
export const LEVEL_ICONS: Record<Level, string> = {
  junior: '🌱',
  senior: '🌳',
};

// 기획서 버전
export interface DocumentVersion {
  id: string;
  version: number;
  content: string;
  feedback?: string;        // 이 버전 생성 시 반영된 피드백
  changes?: string;         // 변경 사항 요약
  createdAt: string;
}

// 세션 히스토리 (DB 저장용)
export interface SessionHistory {
  id: string;
  goal: string;
  members: TeamMember[];
  messages: Message[];
  generatedOutput: string | null;
  documentVersions: DocumentVersion[];  // 버전 히스토리
  currentVersion: number;               // 현재 보고 있는 버전
  createdAt: string;  // ISO string for JSON serialization
  updatedAt: string;
}
