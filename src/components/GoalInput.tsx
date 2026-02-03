'use client';

import { useState, useEffect, useRef } from 'react';
import type { AIModel } from '@/types';

interface GoalInputProps {
  onSubmit: (goal: string, model: AIModel) => void;
}

const AI_MODELS: { id: AIModel; name: string; icon: string; desc: string }[] = [
  { id: 'gemini', name: 'Gemini', icon: '✦', desc: 'Google AI' },
  { id: 'gpt', name: 'GPT-5.2', icon: '◆', desc: 'OpenAI' },
  { id: 'claude', name: 'Claude', icon: '◈', desc: 'Anthropic' },
];

const EXAMPLE_GOALS = [
  '신규 모바일 앱 기획서 작성',
  '마케팅 전략 수립',
  'UI/UX 개선 방안 도출',
  '기술 스펙 문서 작성',
  '경쟁사 분석 리포트',
];

export default function GoalInput({ onSubmit }: GoalInputProps) {
  const [goal, setGoal] = useState('');
  const [selectedModel, setSelectedModel] = useState<AIModel>('gemini');
  const [showModelSelector, setShowModelSelector] = useState(false);
  const [placeholder, setPlaceholder] = useState('');
  const [currentExampleIndex, setCurrentExampleIndex] = useState(0);
  const [isTyping, setIsTyping] = useState(true);
  const charIndexRef = useRef(0);
  const modelSelectorRef = useRef<HTMLDivElement>(null);

  // Close model selector on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (modelSelectorRef.current && !modelSelectorRef.current.contains(e.target as Node)) {
        setShowModelSelector(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Typewriter effect for placeholder
  useEffect(() => {
    const example = EXAMPLE_GOALS[currentExampleIndex];

    if (isTyping) {
      charIndexRef.current = 0;
      const typeInterval = setInterval(() => {
        if (charIndexRef.current <= example.length) {
          setPlaceholder(example.slice(0, charIndexRef.current));
          charIndexRef.current++;
        } else {
          clearInterval(typeInterval);
          setTimeout(() => setIsTyping(false), 2000);
        }
      }, 80);
      return () => clearInterval(typeInterval);
    } else {
      charIndexRef.current = example.length;
      const deleteInterval = setInterval(() => {
        if (charIndexRef.current > 0) {
          charIndexRef.current--;
          setPlaceholder(example.slice(0, charIndexRef.current));
        } else {
          clearInterval(deleteInterval);
          setCurrentExampleIndex(prev => (prev + 1) % EXAMPLE_GOALS.length);
          setIsTyping(true);
        }
      }, 40);
      return () => clearInterval(deleteInterval);
    }
  }, [currentExampleIndex, isTyping]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (goal.trim()) {
      onSubmit(goal.trim(), selectedModel);
    }
  };

  const currentModelInfo = AI_MODELS.find(m => m.id === selectedModel)!;

  return (
    <div className="w-full max-w-2xl px-4 sm:px-6 py-12 animate-slideUp">
        {/* Hero Section */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--accent-green)]/10 border border-[var(--accent-green)]/20 mb-6">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--accent-green)] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[var(--accent-green)]"></span>
            </span>
            <span className="text-xs font-medium text-[var(--accent-green)]" style={{ fontFamily: 'var(--font-jetbrains)' }}>
              AI 팀 대기중
            </span>
          </div>

          <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight mb-4 leading-tight">
            목표만 있으면,
            <br />
            <span className="gradient-text">팀은 우리가</span> 만들어요
          </h1>

          <p className="text-base sm:text-lg text-[var(--text-secondary)] leading-relaxed">
            달성하고 싶은 목표를 입력하면, AI 팀이 협업하여 결과물을 만들어 드립니다
          </p>
        </div>

        {/* Input Form */}
        <form onSubmit={handleSubmit} className="relative mb-8">
          <div className="relative group">
            {/* Glow effect */}
            <div className="absolute -inset-[2px] bg-gradient-to-r from-[var(--accent-cyan)] via-[var(--accent-purple)] to-[var(--accent-pink)] rounded-2xl opacity-0 group-hover:opacity-20 group-focus-within:opacity-30 blur-xl transition-all duration-500" />

            <div className="relative bg-[var(--bg-secondary)] rounded-2xl border border-[var(--border-default)] shadow-xl group-hover:border-[var(--border-strong)] transition-colors">
              <textarea
                value={goal}
                onChange={e => setGoal(e.target.value)}
                placeholder={placeholder + (goal === '' ? '|' : '')}
                rows={3}
                className="w-full bg-transparent px-5 py-4 text-base sm:text-lg resize-none focus:outline-none placeholder:text-[var(--text-muted)]"
                style={{ fontFamily: 'var(--font-space)' }}
              />

              <div className="flex items-center justify-between px-4 py-3 border-t border-[var(--border-subtle)] bg-[var(--bg-tertiary)]/30">
                {/* Model Selector */}
                <div className="relative" ref={modelSelectorRef}>
                  <button
                    type="button"
                    onClick={() => setShowModelSelector(!showModelSelector)}
                    className="flex items-center gap-2 text-sm px-3 py-2 rounded-xl bg-[var(--bg-tertiary)] hover:bg-[var(--bg-hover)] border border-[var(--border-subtle)] transition-all"
                  >
                    <span className="text-[var(--accent-cyan)]">{currentModelInfo.icon}</span>
                    <span className="font-medium" style={{ fontFamily: 'var(--font-jetbrains)' }}>{currentModelInfo.name}</span>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className={`text-[var(--text-muted)] transition-transform ${showModelSelector ? '-rotate-180' : ''}`}
                    >
                      <path d="m6 9 6 6 6-6" />
                    </svg>
                  </button>

                  {showModelSelector && (
                    <div className="absolute top-full left-0 mt-2 bg-[var(--bg-secondary)] rounded-xl border border-[var(--border-default)] shadow-2xl overflow-hidden min-w-[180px] animate-fadeIn z-50">
                      <div className="p-1">
                        {AI_MODELS.map(model => (
                          <button
                            key={model.id}
                            type="button"
                            onClick={() => {
                              setSelectedModel(model.id);
                              setShowModelSelector(false);
                            }}
                            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                              selectedModel === model.id
                                ? 'bg-[var(--accent-cyan)]/10 text-[var(--accent-cyan)]'
                                : 'hover:bg-[var(--bg-tertiary)]'
                            }`}
                          >
                            <span className={selectedModel === model.id ? 'text-[var(--accent-cyan)]' : 'text-[var(--text-muted)]'}>
                              {model.icon}
                            </span>
                            <div className="flex-1 text-left">
                              <div className="font-medium">{model.name}</div>
                              <div className="text-xs text-[var(--text-muted)]">{model.desc}</div>
                            </div>
                            {selectedModel === model.id && (
                              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="20 6 9 17 4 12" />
                              </svg>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={!goal.trim()}
                  className="btn btn-primary disabled:opacity-40 disabled:cursor-not-allowed disabled:transform-none"
                >
                  <span>시작하기</span>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M5 12h14" />
                    <path d="m12 5 7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </form>

        {/* Example Goals */}
        <div className="space-y-3">
          <p className="text-xs text-[var(--text-muted)] text-center uppercase tracking-wider" style={{ fontFamily: 'var(--font-jetbrains)' }}>
            예시
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            {EXAMPLE_GOALS.map((example, index) => (
              <button
                key={index}
                onClick={() => setGoal(example)}
                className="px-3 py-1.5 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-subtle)] text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] hover:border-[var(--border-default)] hover:text-[var(--text-primary)] transition-all"
              >
                {example}
              </button>
            ))}
          </div>
        </div>

        {/* Features */}
        <div className="mt-16 grid grid-cols-3 gap-4 sm:gap-8">
          {[
            { icon: '👥', value: '6', label: '역할' },
            { icon: '🎯', value: '2', label: '레벨' },
            { icon: '🤖', value: '3', label: 'AI 모델' },
          ].map((stat, index) => (
            <div
              key={index}
              className="text-center p-4 rounded-xl bg-[var(--bg-secondary)]/50 border border-[var(--border-subtle)]"
            >
              <div className="text-2xl mb-1">{stat.icon}</div>
              <div className="text-2xl font-semibold gradient-text" style={{ fontFamily: 'var(--font-jetbrains)' }}>
                {stat.value}
              </div>
              <div className="text-xs text-[var(--text-muted)] uppercase tracking-wider mt-1">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>
  );
}
