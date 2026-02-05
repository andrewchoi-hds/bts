'use client';

import { useState } from 'react';
import { ROLES, LEVEL_ICONS, type Role, type Level, type TeamMember, type AIModel } from '@/types';
import { v4 as uuidv4 } from 'uuid';

interface TeamBuilderProps {
  goal: string;
  defaultModel?: AIModel;
  onComplete: (members: TeamMember[]) => void;
  onBack: () => void;
}

interface SelectedMember {
  role: Role;
  level: Level;
  name: string;
  personality: string;
  speakingStyle: string;
  model: AIModel;
}

// AI 모델 정보
const AI_MODELS: { id: AIModel; name: string; icon: string; description: string; color: string }[] = [
  { id: 'gemini', name: 'Gemini', icon: '🔷', description: '창의적·다재다능', color: 'blue' },
  { id: 'gpt', name: 'GPT', icon: '🟢', description: '논리적·정확함', color: 'green' },
  { id: 'claude', name: 'Claude', icon: '🟠', description: '분석적·신중함', color: 'orange' },
];

// 유저 역할은 junior/senior 대신 다른 유형 사용
type UserType = 'difficult' | 'beginner' | 'power' | 'elderly';

const USER_TYPES: { id: UserType; label: string; levelMap: Level }[] = [
  { id: 'difficult', label: '까다로운', levelMap: 'junior' },
  { id: 'beginner', label: '초보', levelMap: 'senior' },
];

// 기본 팀원 프리셋
const DEFAULT_MEMBERS: Record<Role, Record<Level, Omit<SelectedMember, 'role' | 'level' | 'model'>>> = {
  planner: {
    junior: { name: '민준', personality: '열정적이고 아이디어가 넘침', speakingStyle: '친근하고 호기심 가득한 말투' },
    senior: { name: '서연', personality: '체계적이고 신중함', speakingStyle: '논리적이고 차분한 말투' },
  },
  designer: {
    junior: { name: '지호', personality: '트렌디하고 감각적', speakingStyle: '밝고 에너지 넘치는 말투' },
    senior: { name: '수아', personality: '미니멀리즘 추구, 디테일에 강함', speakingStyle: '세련되고 정제된 말투' },
  },
  developer: {
    junior: { name: '도윤', personality: '새로운 기술에 관심 많음', speakingStyle: '직접적이고 실용적인 말투' },
    senior: { name: '지민', personality: '안정성과 확장성 중시', speakingStyle: '기술적이고 꼼꼼한 말투' },
  },
  qa: {
    junior: { name: '예준', personality: '꼼꼼하고 집요함', speakingStyle: '질문이 많고 탐구적인 말투' },
    senior: { name: '현우', personality: '리스크 감지 능력 뛰어남', speakingStyle: '객관적이고 분석적인 말투' },
  },
  marketer: {
    junior: { name: '시우', personality: '트렌드 민감, SNS 능통', speakingStyle: '캐주얼하고 재치있는 말투' },
    senior: { name: '하윤', personality: '데이터 기반 의사결정', speakingStyle: '설득력 있고 전략적인 말투' },
  },
  analyst: {
    junior: { name: '준서', personality: '숫자에 강하고 호기심 많음', speakingStyle: '데이터로 말하는 스타일' },
    senior: { name: '지유', personality: '인사이트 도출 능력 탁월', speakingStyle: '스토리텔링으로 설명하는 스타일' },
  },
  security: {
    junior: { name: '태현', personality: '보안 트렌드에 민감', speakingStyle: '경고하듯 조심스러운 말투' },
    senior: { name: '정우', personality: '철저하고 의심이 많음', speakingStyle: '단호하고 원칙적인 말투' },
  },
  user: {
    junior: { name: '민수', personality: '불만이 많고 까다로움, 사소한 것에도 컴플레인', speakingStyle: '짜증 섞인 말투, 왜 이렇게 불편하냐고 따짐' },
    senior: { name: '영희', personality: '디지털 기기에 익숙하지 않음, 이해가 느림', speakingStyle: '이게 뭔지 모르겠다며 계속 질문' },
  },
};

// 유저 역할 라벨 (junior/senior 대신)
const USER_LEVEL_LABELS: Record<Level, string> = {
  junior: '까다로운',
  senior: '초보',
};

const ROLE_COLORS: Record<Role, { gradient: string; bg: string; border: string; text: string }> = {
  planner: { gradient: 'from-amber-400 to-orange-500', bg: 'bg-amber-500/10', border: 'border-amber-500/30', text: 'text-amber-400' },
  designer: { gradient: 'from-pink-400 to-rose-500', bg: 'bg-pink-500/10', border: 'border-pink-500/30', text: 'text-pink-400' },
  developer: { gradient: 'from-cyan-400 to-blue-500', bg: 'bg-cyan-500/10', border: 'border-cyan-500/30', text: 'text-cyan-400' },
  qa: { gradient: 'from-emerald-400 to-green-500', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', text: 'text-emerald-400' },
  marketer: { gradient: 'from-purple-400 to-violet-500', bg: 'bg-purple-500/10', border: 'border-purple-500/30', text: 'text-purple-400' },
  analyst: { gradient: 'from-blue-400 to-indigo-500', bg: 'bg-blue-500/10', border: 'border-blue-500/30', text: 'text-blue-400' },
  security: { gradient: 'from-red-400 to-rose-600', bg: 'bg-red-500/10', border: 'border-red-500/30', text: 'text-red-400' },
  user: { gradient: 'from-slate-400 to-gray-500', bg: 'bg-slate-500/10', border: 'border-slate-500/30', text: 'text-slate-400' },
};

// 추천 팀 조합
interface TeamPreset {
  id: string;
  name: string;
  description: string;
  icon: string;
  members: { role: Role; level: Level }[];
}

const TEAM_PRESETS: TeamPreset[] = [
  {
    id: 'product',
    name: '프로덕트 팀',
    description: '균형 잡힌 제품 개발',
    icon: '🚀',
    members: [
      { role: 'planner', level: 'senior' },
      { role: 'developer', level: 'senior' },
      { role: 'designer', level: 'junior' },
    ],
  },
  {
    id: 'market-validation',
    name: '시장 검증 팀',
    description: '아이디어 검증 & 시장 분석',
    icon: '📈',
    members: [
      { role: 'marketer', level: 'senior' },
      { role: 'analyst', level: 'junior' },
      { role: 'planner', level: 'junior' },
    ],
  },
  {
    id: 'user-centric',
    name: '사용자 중심 팀',
    description: 'UX 개선 & 사용자 피드백',
    icon: '💬',
    members: [
      { role: 'designer', level: 'senior' },
      { role: 'user', level: 'junior' },
      { role: 'user', level: 'senior' },
    ],
  },
  {
    id: 'security-review',
    name: '보안 검토 팀',
    description: '보안 취약점 & 품질 검증',
    icon: '🔒',
    members: [
      { role: 'security', level: 'senior' },
      { role: 'developer', level: 'senior' },
      { role: 'qa', level: 'junior' },
    ],
  },
  {
    id: 'full-stack',
    name: '풀스택 팀',
    description: '전체 관점에서 검토',
    icon: '⚡',
    members: [
      { role: 'planner', level: 'senior' },
      { role: 'developer', level: 'junior' },
      { role: 'designer', level: 'junior' },
      { role: 'qa', level: 'senior' },
      { role: 'security', level: 'junior' },
    ],
  },
];

export default function TeamBuilder({ goal, defaultModel = 'gemini', onComplete, onBack }: TeamBuilderProps) {
  const [selectedMembers, setSelectedMembers] = useState<SelectedMember[]>([
    { role: 'planner', level: 'junior', ...DEFAULT_MEMBERS.planner.junior, model: defaultModel },
    { role: 'planner', level: 'senior', ...DEFAULT_MEMBERS.planner.senior, model: defaultModel },
  ]);
  const [editingMember, setEditingMember] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<Omit<SelectedMember, 'role' | 'level'>>({
    name: '',
    personality: '',
    speakingStyle: '',
    model: defaultModel,
  });

  // 토글: 추가/제거
  const toggleMember = (role: Role, level: Level) => {
    const existingIndex = selectedMembers.findIndex(m => m.role === role && m.level === level);

    if (existingIndex >= 0) {
      setSelectedMembers(prev => prev.filter((_, i) => i !== existingIndex));
    } else {
      const defaults = DEFAULT_MEMBERS[role][level];
      setSelectedMembers(prev => [
        ...prev,
        { role, level, ...defaults, model: defaultModel },
      ]);
    }
  };

  // 추천 팀 조합 적용
  const applyPreset = (preset: TeamPreset) => {
    const newMembers: SelectedMember[] = preset.members.map(m => ({
      role: m.role,
      level: m.level,
      ...DEFAULT_MEMBERS[m.role][m.level],
      model: defaultModel,
    }));
    setSelectedMembers(newMembers);
  };

  const removeMember = (index: number) => {
    setSelectedMembers(prev => prev.filter((_, i) => i !== index));
    if (editingMember === index) {
      setEditingMember(null);
    }
  };

  const startEditing = (index: number) => {
    const member = selectedMembers[index];
    setEditForm({
      name: member.name,
      personality: member.personality,
      speakingStyle: member.speakingStyle,
      model: member.model,
    });
    setEditingMember(index);
  };

  const saveEditing = () => {
    if (editingMember === null) return;

    setSelectedMembers(prev =>
      prev.map((m, i) => (i === editingMember ? { ...m, ...editForm } : m))
    );
    setEditingMember(null);
  };

  const cancelEditing = () => {
    setEditingMember(null);
  };

  const handleComplete = () => {
    const members: TeamMember[] = selectedMembers.map(m => ({
      id: uuidv4(),
      role: m.role,
      level: m.level,
      name: m.name,
      model: m.model,
      persona: {
        personality: m.personality,
        speakingStyle: m.speakingStyle,
        perspective: m.role === 'user'
          ? (m.level === 'junior' ? '불만 가득한 까다로운 고객 시점' : '어려워하는 초보 사용자 시점')
          : (m.level === 'junior' ? '새로운 시각과 트렌드 중심' : '경험과 검증 중심'),
        strengths: m.role === 'user'
          ? (m.level === 'junior'
            ? ['문제점 발견', '불편함 지적', '개선 요구']
            : ['이해도 테스트', '접근성 검토', '설명 필요 지점 발견'])
          : (m.level === 'junior'
            ? ['창의성', '트렌드 파악', '새로운 아이디어']
            : ['리스크 관리', '실현 가능성 검토', '품질 보증']),
      },
    }));
    onComplete(members);
  };

  const getRoleInfo = (roleId: Role) => ROLES.find(r => r.id === roleId)!;

  // 역할별 레벨 라벨 가져오기
  const getLevelLabel = (role: Role, level: Level): string => {
    if (role === 'user') {
      return USER_LEVEL_LABELS[level];
    }
    return level === 'junior' ? '주니어' : '시니어';
  };

  const getLevelIcon = (role: Role, level: Level): string => {
    if (role === 'user') {
      return level === 'junior' ? '😤' : '🤔';
    }
    return LEVEL_ICONS[level];
  };

  return (
    <div className="min-h-screen pt-8 pb-8 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6 animate-slideUp">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <h2 className="text-2xl sm:text-3xl font-semibold mb-2">
                팀 구성하기
              </h2>
              <p className="text-[var(--text-primary)]/70">
                역할을 클릭하여 팀원을 추가/제거하세요
              </p>
            </div>

            <div className="shrink-0 px-4 py-2.5 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)]">
              <p className="text-xs text-[var(--text-muted)] uppercase tracking-wider mb-1" style={{ fontFamily: 'var(--font-jetbrains)' }}>
                목표
              </p>
              <p className="text-sm font-medium truncate max-w-[280px]">{goal}</p>
            </div>
          </div>
        </div>

        {/* Team Presets - Clickable */}
        <div className="mb-6">
          <h3 className="text-sm font-medium text-[var(--text-primary)] mb-3">추천 팀 조합</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-3">
            {TEAM_PRESETS.map(preset => (
              <button
                key={preset.id}
                onClick={() => applyPreset(preset)}
                className="px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)] hover:border-[var(--accent-cyan)]/50 hover:bg-[var(--accent-cyan)]/5 transition-all group text-left"
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm sm:text-base">{preset.icon}</span>
                  <span className="font-medium text-xs sm:text-sm group-hover:text-[var(--accent-cyan)] transition-colors truncate">{preset.name}</span>
                </div>
                <p className="text-[10px] sm:text-xs text-[var(--text-secondary)] line-clamp-1">{preset.description}</p>
              </button>
            ))}
          </div>
        </div>

        <div className="grid lg:grid-cols-5 gap-6">
          {/* Role Selection - 3 columns */}
          <div className="lg:col-span-3 space-y-4">
            {/* Role Cards */}
            <div className="grid sm:grid-cols-2 gap-3">
              {ROLES.map((role) => {
                const colors = ROLE_COLORS[role.id];
                const isUserRole = role.id === 'user';

                return (
                  <div
                    key={role.id}
                    className="p-4 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)] hover:border-[var(--border-default)] transition-colors"
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${colors.gradient} flex items-center justify-center text-lg shadow-lg`}>
                        {role.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm">{role.nameKo}</h4>
                        <p className="text-xs text-[var(--text-secondary)] truncate">{role.description}</p>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      {(['junior', 'senior'] as Level[]).map(level => {
                        const isSelected = selectedMembers.some(
                          m => m.role === role.id && m.level === level
                        );
                        const memberName = isSelected
                          ? selectedMembers.find(m => m.role === role.id && m.level === level)?.name
                          : DEFAULT_MEMBERS[role.id][level].name;

                        return (
                          <button
                            key={level}
                            onClick={() => toggleMember(role.id, level)}
                            className={`flex-1 py-2.5 px-2 rounded-xl text-xs font-medium transition-all flex flex-col items-center gap-1 ${
                              isSelected
                                ? `${colors.bg} border-2 ${colors.border} ${colors.text}`
                                : 'bg-[var(--bg-tertiary)] border border-[var(--border-subtle)] hover:bg-[var(--bg-hover)] hover:border-[var(--border-default)] text-[var(--text-secondary)]'
                            }`}
                          >
                            <span className="flex items-center gap-1">
                              <span>{getLevelIcon(role.id, level)}</span>
                              <span>{getLevelLabel(role.id, level)}</span>
                            </span>
                            <span className={`text-[11px] font-medium ${isSelected ? '' : 'text-[var(--text-secondary)]'}`}>
                              {memberName}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Selected Team - 2 columns */}
          <div className="lg:col-span-2 space-y-4">
            <div className="sticky top-4">
              <div className="rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)] overflow-hidden">
                <div className="px-4 py-3 border-b border-[var(--border-subtle)] flex items-center justify-between">
                  <h3 className="font-medium">구성된 팀</h3>
                  <span className="text-xs px-2 py-1 rounded-full bg-[var(--accent-cyan)]/10 text-[var(--accent-cyan)]">
                    {selectedMembers.length}명
                  </span>
                </div>

                {selectedMembers.length === 0 ? (
                  <div className="p-8 text-center">
                    <div className="text-3xl mb-2">👥</div>
                    <p className="text-sm text-[var(--text-secondary)]">
                      왼쪽에서 역할을 클릭하거나<br />추천 조합을 선택하세요
                    </p>
                  </div>
                ) : (
                  <div className="max-h-[420px] overflow-y-auto">
                    {selectedMembers.map((member, index) => {
                      const roleInfo = getRoleInfo(member.role);
                      const colors = ROLE_COLORS[member.role];
                      const isEditing = editingMember === index;

                      return (
                        <div
                          key={`${member.role}-${member.level}-${index}`}
                          className={`p-3 border-b border-[var(--border-subtle)] last:border-b-0 transition-colors ${
                            isEditing ? 'bg-[var(--bg-tertiary)]' : 'hover:bg-[var(--bg-tertiary)]/50'
                          }`}
                        >
                          {isEditing ? (
                            // 편집 모드
                            <div className="space-y-3">
                              <div className="flex items-center gap-2 mb-2">
                                <div className={`w-7 h-7 rounded-lg bg-gradient-to-br ${colors.gradient} flex items-center justify-center text-sm`}>
                                  {roleInfo.icon}
                                </div>
                                <span className="font-medium text-sm">{roleInfo.nameKo}</span>
                                <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                                  member.level === 'junior'
                                    ? 'bg-emerald-500/15 text-emerald-400'
                                    : 'bg-purple-500/15 text-purple-400'
                                }`}>
                                  {getLevelIcon(member.role, member.level)} {getLevelLabel(member.role, member.level)}
                                </span>
                              </div>

                              <div>
                                <label className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider">이름</label>
                                <input
                                  type="text"
                                  value={editForm.name}
                                  onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                                  className="w-full mt-1 px-3 py-2.5 sm:px-2 sm:py-1.5 text-sm rounded-lg bg-[var(--bg-primary)] border border-[var(--border-subtle)] focus:border-[var(--accent-cyan)] outline-none"
                                  placeholder="이름"
                                />
                              </div>

                              <div>
                                <label className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider">성격</label>
                                <input
                                  type="text"
                                  value={editForm.personality}
                                  onChange={(e) => setEditForm(prev => ({ ...prev, personality: e.target.value }))}
                                  className="w-full mt-1 px-3 py-2.5 sm:px-2 sm:py-1.5 text-sm rounded-lg bg-[var(--bg-primary)] border border-[var(--border-subtle)] focus:border-[var(--accent-cyan)] outline-none"
                                  placeholder="예: 열정적이고 아이디어가 넘침"
                                />
                              </div>

                              <div>
                                <label className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider">말투</label>
                                <input
                                  type="text"
                                  value={editForm.speakingStyle}
                                  onChange={(e) => setEditForm(prev => ({ ...prev, speakingStyle: e.target.value }))}
                                  className="w-full mt-1 px-3 py-2.5 sm:px-2 sm:py-1.5 text-sm rounded-lg bg-[var(--bg-primary)] border border-[var(--border-subtle)] focus:border-[var(--accent-cyan)] outline-none"
                                  placeholder="예: 친근하고 호기심 가득한 말투"
                                />
                              </div>

                              <div>
                                <label className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider">AI 모델</label>
                                <div className="grid grid-cols-3 gap-1.5 mt-1">
                                  {AI_MODELS.map(model => (
                                    <button
                                      key={model.id}
                                      type="button"
                                      onClick={() => setEditForm(prev => ({ ...prev, model: model.id }))}
                                      className={`px-2 py-2 rounded-lg text-xs font-medium transition-all flex flex-col items-center gap-0.5 ${
                                        editForm.model === model.id
                                          ? model.color === 'blue'
                                            ? 'bg-blue-500/20 border-2 border-blue-500/50 text-blue-400'
                                            : model.color === 'green'
                                              ? 'bg-green-500/20 border-2 border-green-500/50 text-green-400'
                                              : 'bg-orange-500/20 border-2 border-orange-500/50 text-orange-400'
                                          : 'bg-[var(--bg-tertiary)] border border-[var(--border-subtle)] hover:bg-[var(--bg-hover)] text-[var(--text-secondary)]'
                                      }`}
                                    >
                                      <span>{model.icon}</span>
                                      <span>{model.name}</span>
                                    </button>
                                  ))}
                                </div>
                              </div>

                              <div className="flex gap-2 pt-1">
                                <button
                                  onClick={saveEditing}
                                  className="flex-1 py-1.5 text-xs font-medium rounded-lg bg-[var(--accent-cyan)]/10 text-[var(--accent-cyan)] hover:bg-[var(--accent-cyan)]/20 transition-colors"
                                >
                                  저장
                                </button>
                                <button
                                  onClick={cancelEditing}
                                  className="flex-1 py-1.5 text-xs font-medium rounded-lg bg-[var(--bg-hover)] text-[var(--text-secondary)] hover:bg-[var(--bg-active)] transition-colors"
                                >
                                  취소
                                </button>
                              </div>
                            </div>
                          ) : (
                            // 일반 모드
                            <div className="flex items-start gap-3">
                              <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${colors.gradient} flex items-center justify-center text-sm shadow-md shrink-0`}>
                                {roleInfo.icon}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium text-sm">{member.name}</span>
                                  <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                                    member.level === 'junior'
                                      ? 'bg-emerald-500/15 text-emerald-400'
                                      : 'bg-purple-500/15 text-purple-400'
                                  }`}>
                                    {getLevelIcon(member.role, member.level)} {getLevelLabel(member.role, member.level)}
                                  </span>
                                  {/* AI 모델 표시 */}
                                  <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                                    member.model === 'gemini'
                                      ? 'bg-blue-500/15 text-blue-400'
                                      : member.model === 'gpt'
                                        ? 'bg-green-500/15 text-green-400'
                                        : 'bg-orange-500/15 text-orange-400'
                                  }`}>
                                    {AI_MODELS.find(m => m.id === member.model)?.icon} {AI_MODELS.find(m => m.id === member.model)?.name}
                                  </span>
                                </div>
                                <p className="text-xs text-[var(--text-secondary)]">{roleInfo.nameKo}</p>
                                <p className="text-[11px] text-[var(--text-tertiary)] mt-1 truncate" title={member.personality}>
                                  {member.personality}
                                </p>
                              </div>
                              <div className="flex gap-1 shrink-0">
                                <button
                                  onClick={() => startEditing(index)}
                                  className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--accent-cyan)] hover:bg-[var(--accent-cyan)]/10 transition-colors"
                                  title="편집"
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                                    <path d="m15 5 4 4" />
                                  </svg>
                                </button>
                                <button
                                  onClick={() => removeMember(index)}
                                  className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-red-400 hover:bg-red-500/10 transition-colors"
                                  title="제거"
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M18 6 6 18" />
                                    <path d="m6 6 12 12" />
                                  </svg>
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Action */}
                <div className="p-3 border-t border-[var(--border-subtle)] bg-[var(--bg-tertiary)]/30">
                  <button
                    onClick={handleComplete}
                    disabled={selectedMembers.length === 0}
                    className="w-full btn btn-primary disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <span>협업 시작</span>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M5 12h14" />
                      <path d="m12 5 7 7-7 7" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* User Role Tip */}
              <div className="mt-4 p-3 rounded-xl bg-gradient-to-r from-slate-500/10 to-gray-500/10 border border-[var(--border-default)]">
                <div className="flex items-start gap-2">
                  <span>👤</span>
                  <div className="text-xs text-[var(--text-secondary)]">
                    <strong className="text-[var(--text-primary)]">사용자 역할</strong>은 실제 유저 관점에서 피드백을 제공합니다.
                    까다로운 유저는 문제점을, 초보 유저는 이해하기 어려운 부분을 찾아냅니다.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
