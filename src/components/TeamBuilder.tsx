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
  model: AIModel;
}

const AI_MODELS: { id: AIModel; name: string; icon: string }[] = [
  { id: 'gemini', name: 'Gemini', icon: '✦' },
  { id: 'gpt', name: 'GPT-5.2', icon: '◆' },
  { id: 'claude', name: 'Claude', icon: '◈' },
];

const DEFAULT_NAMES: Record<Role, Record<Level, string>> = {
  planner: { junior: '민준', senior: '서연' },
  designer: { junior: '지호', senior: '수아' },
  developer: { junior: '도윤', senior: '지민' },
  qa: { junior: '예준', senior: '현우' },
  marketer: { junior: '시우', senior: '하윤' },
  analyst: { junior: '준서', senior: '지유' },
};

const ROLE_COLORS: Record<Role, { gradient: string; bg: string; border: string }> = {
  planner: { gradient: 'from-amber-400 to-orange-500', bg: 'bg-amber-500/10', border: 'border-amber-500/30' },
  designer: { gradient: 'from-pink-400 to-rose-500', bg: 'bg-pink-500/10', border: 'border-pink-500/30' },
  developer: { gradient: 'from-cyan-400 to-blue-500', bg: 'bg-cyan-500/10', border: 'border-cyan-500/30' },
  qa: { gradient: 'from-emerald-400 to-green-500', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30' },
  marketer: { gradient: 'from-purple-400 to-violet-500', bg: 'bg-purple-500/10', border: 'border-purple-500/30' },
  analyst: { gradient: 'from-blue-400 to-indigo-500', bg: 'bg-blue-500/10', border: 'border-blue-500/30' },
};

export default function TeamBuilder({ goal, defaultModel: initialModel = 'gemini', onComplete, onBack }: TeamBuilderProps) {
  const [selectedMembers, setSelectedMembers] = useState<SelectedMember[]>([
    { role: 'planner', level: 'junior', name: DEFAULT_NAMES.planner.junior, model: initialModel },
    { role: 'planner', level: 'senior', name: DEFAULT_NAMES.planner.senior, model: initialModel },
  ]);
  const [defaultModel, setDefaultModel] = useState<AIModel>(initialModel);

  const addMember = (role: Role, level: Level) => {
    const exists = selectedMembers.some(m => m.role === role && m.level === level);
    if (exists) return;

    setSelectedMembers(prev => [
      ...prev,
      { role, level, name: DEFAULT_NAMES[role][level], model: defaultModel },
    ]);
  };

  const removeMember = (index: number) => {
    setSelectedMembers(prev => prev.filter((_, i) => i !== index));
  };

  const changeMemberModel = (index: number, model: AIModel) => {
    setSelectedMembers(prev =>
      prev.map((m, i) => (i === index ? { ...m, model } : m))
    );
  };

  const applyModelToAll = (model: AIModel) => {
    setDefaultModel(model);
    setSelectedMembers(prev => prev.map(m => ({ ...m, model })));
  };

  const handleComplete = () => {
    const members: TeamMember[] = selectedMembers.map(m => ({
      id: uuidv4(),
      role: m.role,
      level: m.level,
      name: m.name,
      model: m.model,
      persona: {
        personality: m.level === 'junior' ? '열정적이고 호기심이 많음' : '신중하고 분석적',
        speakingStyle: m.level === 'junior' ? '친근하고 에너지 넘치는 말투' : '차분하고 논리적인 말투',
        perspective: m.level === 'junior' ? '새로운 시각과 트렌드 중심' : '경험과 검증 중심',
        strengths: m.level === 'junior'
          ? ['창의성', '트렌드 파악', '새로운 아이디어']
          : ['리스크 관리', '실현 가능성 검토', '품질 보증'],
      },
    }));
    onComplete(members);
  };

  const getRoleInfo = (roleId: Role) => ROLES.find(r => r.id === roleId)!;

  return (
    <div className="min-h-screen pt-20 pb-8 px-4 sm:px-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8 animate-slideUp">
          <button
            onClick={onBack}
            className="inline-flex items-center gap-2 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors mb-4"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m12 19-7-7 7-7" />
              <path d="M19 12H5" />
            </svg>
            <span>뒤로</span>
          </button>

          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <h2 className="text-2xl sm:text-3xl font-semibold mb-2">
                팀 구성하기
              </h2>
              <p className="text-[var(--text-secondary)]">
                목표 달성을 위한 최적의 팀을 구성하세요
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

        <div className="grid lg:grid-cols-5 gap-6">
          {/* Role Selection - 3 columns */}
          <div className="lg:col-span-3 space-y-4">
            {/* Model Selection */}
            <div className="p-4 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)]">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium">AI 모델</span>
                <span className="text-xs text-[var(--text-muted)]">전체 적용</span>
              </div>
              <div className="flex gap-2">
                {AI_MODELS.map(model => (
                  <button
                    key={model.id}
                    onClick={() => applyModelToAll(model.id)}
                    className={`flex-1 py-2.5 px-3 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                      defaultModel === model.id
                        ? 'bg-[var(--accent-cyan)]/10 border-2 border-[var(--accent-cyan)] text-[var(--accent-cyan)]'
                        : 'bg-[var(--bg-tertiary)] border border-[var(--border-subtle)] hover:border-[var(--border-default)] text-[var(--text-secondary)]'
                    }`}
                  >
                    <span>{model.icon}</span>
                    <span>{model.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Role Cards */}
            <div className="grid sm:grid-cols-2 gap-3">
              {ROLES.map((role) => {
                const colors = ROLE_COLORS[role.id];
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
                        <p className="text-xs text-[var(--text-muted)] truncate">{role.description}</p>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      {(['junior', 'senior'] as Level[]).map(level => {
                        const isSelected = selectedMembers.some(
                          m => m.role === role.id && m.level === level
                        );
                        return (
                          <button
                            key={level}
                            onClick={() => addMember(role.id, level)}
                            disabled={isSelected}
                            className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all flex items-center justify-center gap-1.5 ${
                              isSelected
                                ? `${colors.bg} ${colors.border} border text-[var(--text-muted)]`
                                : 'bg-[var(--bg-tertiary)] border border-[var(--border-subtle)] hover:bg-[var(--bg-hover)] hover:border-[var(--border-default)]'
                            }`}
                          >
                            <span>{LEVEL_ICONS[level]}</span>
                            <span>{level === 'junior' ? '주니어' : '시니어'}</span>
                            {isSelected && <span className="text-[var(--accent-green)]">✓</span>}
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
            <div className="sticky top-20">
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
                    <p className="text-sm text-[var(--text-muted)]">팀원을 추가해주세요</p>
                  </div>
                ) : (
                  <div className="max-h-[400px] overflow-y-auto">
                    {selectedMembers.map((member, index) => {
                      const roleInfo = getRoleInfo(member.role);
                      const colors = ROLE_COLORS[member.role];
                      const modelInfo = AI_MODELS.find(m => m.id === member.model)!;
                      return (
                        <div
                          key={index}
                          className="p-3 border-b border-[var(--border-subtle)] last:border-b-0 hover:bg-[var(--bg-tertiary)]/50 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${colors.gradient} flex items-center justify-center text-sm shadow-md`}>
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
                                  {LEVEL_ICONS[member.level]} {member.level === 'junior' ? 'Jr' : 'Sr'}
                                </span>
                              </div>
                              <p className="text-xs text-[var(--text-muted)]">{roleInfo.nameKo}</p>
                            </div>
                            <button
                              onClick={() => removeMember(index)}
                              className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-red-400 hover:bg-red-500/10 transition-colors"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M18 6 6 18" />
                                <path d="m6 6 12 12" />
                              </svg>
                            </button>
                          </div>
                          {/* Model selector */}
                          <div className="mt-2 ml-12 flex gap-1">
                            {AI_MODELS.map(model => (
                              <button
                                key={model.id}
                                onClick={() => changeMemberModel(index, model.id)}
                                className={`px-2 py-1 rounded text-[10px] transition-all flex items-center gap-1 ${
                                  member.model === model.id
                                    ? 'bg-[var(--bg-hover)] text-[var(--text-primary)]'
                                    : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
                                }`}
                              >
                                <span>{model.icon}</span>
                                <span>{model.name}</span>
                              </button>
                            ))}
                          </div>
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

              {/* Tips */}
              <div className="mt-4 p-3 rounded-xl bg-[var(--bg-tertiary)]/30 border border-[var(--border-subtle)]">
                <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                  <span className="text-[var(--accent-cyan)]">💡 Tip:</span> 주니어는 새로운 아이디어를, 시니어는 검증과 리스크 관리를 담당합니다.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
