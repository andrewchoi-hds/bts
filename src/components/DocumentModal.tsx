'use client';

import { useState, useCallback, useEffect } from 'react';
import type { DocumentVersion } from '@/types';
import MarkdownViewer from './MarkdownViewer';

interface DocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  goal: string;
  versions: DocumentVersion[];
  currentVersion: number;
  isGenerating: boolean;
  onGenerate: () => void;
  onRefine: (feedback: string) => void;
  onVersionChange: (version: number) => void;
}

export default function DocumentModal({
  isOpen,
  onClose,
  goal,
  versions,
  currentVersion,
  isGenerating,
  onGenerate,
  onRefine,
  onVersionChange,
}: DocumentModalProps) {
  const [feedbackInput, setFeedbackInput] = useState('');
  const [showFeedbackInput, setShowFeedbackInput] = useState(false);
  const [showVersionHistory, setShowVersionHistory] = useState(false);
  const [showIdeSelector, setShowIdeSelector] = useState(false);

  const currentDoc = versions.find(v => v.version === currentVersion);
  const latestVersion = versions.length > 0 ? Math.max(...versions.map(v => v.version)) : 0;

  // ESC 키로 모달 닫기
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  const handleRefineSubmit = useCallback(() => {
    if (feedbackInput.trim()) {
      onRefine(feedbackInput.trim());
      setFeedbackInput('');
      setShowFeedbackInput(false);
    }
  }, [feedbackInput, onRefine]);

  const handleDownload = useCallback(() => {
    if (!currentDoc) return;
    const blob = new Blob([currentDoc.content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${goal.replace(/\s+/g, '_')}_v${currentDoc.version}_기획서.md`;
    a.click();
    URL.revokeObjectURL(url);
  }, [currentDoc, goal]);

  const handleCopy = useCallback(() => {
    if (!currentDoc) return;
    navigator.clipboard.writeText(currentDoc.content);
  }, [currentDoc]);

  // IDE에서 열기
  const handleOpenInIde = useCallback((ide: 'cursor' | 'vscode' | 'claude') => {
    if (!currentDoc) return;

    // 기획서 내용을 클립보드에 복사
    navigator.clipboard.writeText(currentDoc.content);

    if (ide === 'claude') {
      // Claude Code (터미널)용 프롬프트 생성 - agents, skills 포함
      const prompt = `# 프로젝트 생성 요청

다음 PRD(기획서)를 바탕으로 **완전한 프로젝트**를 생성해주세요.

---

## PRD (Product Requirements Document)

${currentDoc.content}

---

## 생성 요구사항

### 1. 프로젝트 구조
- 기획서의 기술 스택 섹션을 참고하여 적절한 프레임워크 선택
- 클린 아키텍처 원칙에 따른 폴더 구조
- 필요한 패키지 설치 (package.json 또는 requirements.txt)

### 2. 핵심 기능 구현
- PRD의 MVP 기능 목록 기반으로 핵심 컴포넌트/모듈 구현
- 기본적인 UI 레이아웃 (기획서의 UX/UI 방향성 참고)
- API 엔드포인트 스캐폴딩 (필요시)

### 3. Claude Code 설정 (중요!)

#### 3.1 CLAUDE.md 파일 생성
프로젝트 루트에 \`.claude/CLAUDE.md\` 생성:
\`\`\`markdown
# [프로젝트명] - Claude Code 설정

## 프로젝트 개요
[PRD 요약]

## 기술 스택
[사용된 기술 목록]

## 주요 명령어
- \`/dev\` - 개발 서버 실행
- \`/test\` - 테스트 실행
- \`/build\` - 프로덕션 빌드

## 코드 컨벤션
[프로젝트에 맞는 컨벤션]

## 폴더 구조
[생성된 구조 설명]
\`\`\`

#### 3.2 커스텀 Skills 생성
\`.claude/commands/\` 폴더에 프로젝트 맞춤형 스킬(슬래시 커맨드) 정의:

**feature.md** - 새 기능 추가
\`\`\`markdown
---
description: 새 기능을 추가합니다
arguments: <기능명>
---

# /feature - 새 기능 추가

$ARGUMENTS 기능을 이 프로젝트에 추가합니다.

## 절차
1. 요구사항 분석
2. 관련 컴포넌트/모듈 생성
3. 라우팅 추가 (필요시)
4. 테스트 작성
5. 문서 업데이트
\`\`\`

**component.md** - 컴포넌트 생성
\`\`\`markdown
---
description: 새 컴포넌트를 생성합니다
arguments: <컴포넌트명>
---

# /component $ARGUMENTS

프로젝트 컨벤션에 맞게 $ARGUMENTS 컴포넌트를 생성합니다.
\`\`\`

**api.md** - API 엔드포인트 생성
\`\`\`markdown
---
description: 새 API 엔드포인트를 생성합니다
arguments: <엔드포인트명>
---

# /api $ARGUMENTS

RESTful 규칙에 따라 $ARGUMENTS API 엔드포인트를 생성합니다.
\`\`\`

**review.md** - 코드 리뷰
\`\`\`markdown
---
description: 코드 변경사항을 리뷰합니다
arguments: [파일경로 또는 staged]
---

# /review $ARGUMENTS

코드 리뷰를 수행합니다.

## 체크리스트
- 코드 품질 및 가독성
- 버그 가능성 및 엣지 케이스
- 보안 취약점 (OWASP Top 10)
- 성능 이슈
- 컨벤션 준수
- 테스트 커버리지
\`\`\`

**test.md** - 테스트 생성/실행
\`\`\`markdown
---
description: 테스트를 생성하거나 실행합니다
arguments: [generate|run] <대상>
---

# /test $ARGUMENTS

- \`/test generate <파일>\` - 해당 파일의 테스트 코드 생성
- \`/test run\` - 전체 테스트 실행
- \`/test run <파일>\` - 특정 파일 테스트 실행
\`\`\`

**refactor.md** - 리팩토링
\`\`\`markdown
---
description: 코드를 리팩토링합니다
arguments: <파일경로>
---

# /refactor $ARGUMENTS

코드 품질 개선을 위한 리팩토링을 수행합니다.

## 개선 항목
- 중복 코드 제거
- 함수/클래스 분리
- 네이밍 개선
- 복잡도 감소
- SOLID 원칙 적용
\`\`\`

**doc.md** - 문서 생성
\`\`\`markdown
---
description: 문서를 생성합니다
arguments: [readme|api|component] <대상>
---

# /doc $ARGUMENTS

- \`/doc readme\` - README.md 생성/업데이트
- \`/doc api\` - API 문서 생성
- \`/doc component <이름>\` - 컴포넌트 문서 생성
\`\`\`

**debug.md** - 디버깅 도우미
\`\`\`markdown
---
description: 버그를 분석하고 해결책을 제안합니다
arguments: <에러메시지 또는 설명>
---

# /debug $ARGUMENTS

버그를 분석하고 해결책을 제안합니다.

## 분석 과정
1. 에러 메시지 파싱
2. 관련 코드 탐색
3. 근본 원인 분석
4. 해결책 제안
5. 재발 방지 방안
\`\`\`

#### 3.3 팀 에이전트 설정
\`.claude/agents/\` 폴더에 BTS 팀원 에이전트 정의:

**planner.md** - 기획자 에이전트
\`\`\`markdown
---
name: planner
description: 기획자 에이전트 - 전략 수립, 요구사항 정의, 우선순위 결정
---

# 기획자 (Planner) 에이전트

당신은 10년차 시니어 프로덕트 매니저입니다.

## 전문 분야
- 사용자 문제 정의 (Jobs-to-be-Done)
- PRD 작성 및 요구사항 정의
- 우선순위 결정 (RICE, MoSCoW)
- 스테이크홀더 커뮤니케이션

## 사용 시나리오
- 새 기능 기획 검토
- 요구사항 명확화
- 스펙 문서 작성
- 우선순위 조정
\`\`\`

**designer.md** - 디자이너 에이전트
\`\`\`markdown
---
name: designer
description: 디자이너 에이전트 - UI/UX 설계, 사용자 경험 최적화
---

# 디자이너 (Designer) 에이전트

당신은 Big Tech 출신의 시니어 프로덕트 디자이너입니다.

## 전문 분야
- 사용자 리서치와 페르소나
- 인터랙션 디자인
- 디자인 시스템 (Atomic Design)
- 접근성 (A11y)

## 사용 시나리오
- UI 컴포넌트 설계 리뷰
- UX 플로우 검토
- 디자인 시스템 구축
- 사용성 개선 제안
\`\`\`

**developer.md** - 개발자 에이전트
\`\`\`markdown
---
name: developer
description: 개발자 에이전트 - 아키텍처 설계, 코드 리뷰, 기술 검토
---

# 개발자 (Developer) 에이전트

당신은 FAANG급 테크 리드입니다.

## 전문 분야
- 시스템 설계 (확장성, 가용성)
- 클린 코드와 SOLID 원칙
- 성능 최적화
- 보안 (OWASP Top 10)

## 사용 시나리오
- 아키텍처 설계 검토
- 코드 리뷰
- 기술 스택 선정
- 성능 병목 분석
\`\`\`

**qa.md** - QA 에이전트
\`\`\`markdown
---
name: qa
description: QA 에이전트 - 품질 검증, 테스트 전략, 버그 탐지
---

# QA (Quality Assurance) 에이전트

당신은 품질 보증 분야의 수석 엔지니어입니다.

## 전문 분야
- 테스트 전략 (피라미드, 트로피 모델)
- 경계값 분석, 동등 분할
- 자동화 테스트 설계
- 탐색적 테스팅

## 사용 시나리오
- 테스트 케이스 생성
- 엣지 케이스 발견
- 버그 리포트 작성
- 품질 메트릭 분석
\`\`\`

**marketer.md** - 마케터 에이전트
\`\`\`markdown
---
name: marketer
description: 마케터 에이전트 - 시장 분석, GTM 전략, 그로스
---

# 마케터 (Marketer) 에이전트

당신은 유니콘 스타트업 CMO급 마케터입니다.

## 전문 분야
- 그로스 해킹 (AARRR)
- 고객 세그먼테이션
- 브랜드 포지셔닝
- 퍼포먼스 마케팅 (CAC, LTV)

## 사용 시나리오
- 런칭 전략 수립
- 타겟 고객 정의
- 마케팅 카피 작성
- 경쟁사 분석
\`\`\`

**analyst.md** - 분석가 에이전트
\`\`\`markdown
---
name: analyst
description: 분석가 에이전트 - 데이터 분석, KPI 설계, 인사이트 도출
---

# 데이터 분석가 (Analyst) 에이전트

당신은 데이터 사이언스 리드입니다.

## 전문 분야
- 가설 기반 분석
- A/B 테스트 설계
- 코호트/퍼널 분석
- 데이터 시각화

## 사용 시나리오
- KPI 설계
- 실험 설계 및 분석
- 대시보드 설계
- 데이터 기반 의사결정
\`\`\`

#### 3.3 settings.json
\`.claude/settings.json\`:
\`\`\`json
{
  "project": {
    "name": "[프로젝트명]",
    "type": "[web/mobile/backend/etc]"
  }
}
\`\`\`

### 4. 기본 설정 파일
- .gitignore
- .env.example
- README.md (프로젝트 설명, 설치 방법, 실행 방법)
- 린터/포매터 설정 (ESLint, Prettier 등)

---

## 진행 순서

1. 먼저 프로젝트 폴더를 생성하고 초기화
2. 기본 구조와 설정 파일 생성
3. 핵심 기능의 스캐폴딩 구현
4. Claude Code 설정 (.claude/ 폴더) 생성
5. 개발 서버 실행 가능 상태로 마무리

시작해주세요!`;
      navigator.clipboard.writeText(prompt);
      alert('Claude Code용 프롬프트가 클립보드에 복사되었습니다.\n\n1. 터미널에서 프로젝트 폴더로 이동\n2. "claude" 명령어 실행\n3. 프롬프트 붙여넣기');
    } else {
      // VS Code / Cursor 열기
      const protocol = ide === 'cursor' ? 'cursor' : 'vscode';
      // 새 창 열기 시도
      window.open(`${protocol}://file/new`, '_blank');
      alert(`${ide === 'cursor' ? 'Cursor' : 'VS Code'}가 열립니다.\n기획서가 클립보드에 복사되었으니 새 파일에 붙여넣기 하세요.`);
    }

    setShowIdeSelector(false);
  }, [currentDoc]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-[90vw] max-w-5xl h-[90vh] bg-[var(--bg-primary)] rounded-2xl border border-[var(--border-default)] shadow-2xl flex flex-col overflow-hidden animate-slideUp">
        {/* Header */}
        <div className="shrink-0 px-6 py-4 border-b border-[var(--border-subtle)] bg-[var(--bg-secondary)]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-purple-500 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                  <polyline points="14 2 14 8 20 8" />
                </svg>
              </div>
              <div>
                <h2 className="text-lg font-semibold">{goal}</h2>
                <p className="text-sm text-[var(--text-tertiary)]">PRD (Product Requirements Document)</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Version Selector */}
              {versions.length > 0 && (
                <div className="relative">
                  <button
                    onClick={() => setShowVersionHistory(!showVersionHistory)}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[var(--bg-tertiary)] border border-[var(--border-subtle)] hover:border-[var(--border-default)] transition-colors"
                  >
                    <span className="text-sm font-medium">v{currentVersion}</span>
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`transition-transform ${showVersionHistory ? 'rotate-180' : ''}`}>
                      <path d="m6 9 6 6 6-6" />
                    </svg>
                    {currentVersion < latestVersion && (
                      <span className="w-2 h-2 rounded-full bg-[var(--accent-cyan)] animate-pulse" />
                    )}
                  </button>

                  {/* Version Dropdown */}
                  {showVersionHistory && (
                    <div className="absolute top-full right-0 mt-2 w-72 bg-[var(--bg-secondary)] rounded-xl border border-[var(--border-default)] shadow-2xl overflow-hidden z-10">
                      <div className="p-3 border-b border-[var(--border-subtle)]">
                        <h4 className="text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-wider">버전 히스토리</h4>
                      </div>
                      <div className="max-h-64 overflow-y-auto">
                        {[...versions].reverse().map((v) => (
                          <button
                            key={v.id}
                            onClick={() => {
                              onVersionChange(v.version);
                              setShowVersionHistory(false);
                            }}
                            className={`w-full p-3 text-left hover:bg-[var(--bg-tertiary)] transition-colors border-b border-[var(--border-subtle)] last:border-b-0 ${
                              v.version === currentVersion ? 'bg-[var(--accent-cyan)]/10' : ''
                            }`}
                          >
                            <div className="flex items-center justify-between mb-1">
                              <span className={`text-sm font-medium ${v.version === currentVersion ? 'text-[var(--accent-cyan)]' : ''}`}>
                                버전 {v.version}
                                {v.version === latestVersion && (
                                  <span className="ml-2 text-xs px-1.5 py-0.5 rounded bg-[var(--accent-green)]/15 text-[var(--accent-green)]">
                                    최신
                                  </span>
                                )}
                              </span>
                              <span className="text-xs text-[var(--text-muted)]">
                                {new Date(v.createdAt).toLocaleString('ko-KR', {
                                  month: 'short',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </span>
                            </div>
                            {v.changes && (
                              <p className="text-xs text-[var(--text-tertiary)] line-clamp-2">{v.changes}</p>
                            )}
                            {v.feedback && (
                              <p className="text-xs text-[var(--accent-purple)] mt-1 line-clamp-1">
                                피드백: {v.feedback}
                              </p>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Close Button */}
              <button
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-[var(--bg-tertiary)] text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 6 6 18" />
                  <path d="m6 6 12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          {isGenerating ? (
            <div className="flex flex-col items-center justify-center h-full gap-6">
              <div className="relative">
                <div className="w-16 h-16 border-4 border-[var(--accent-cyan)]/20 border-t-[var(--accent-cyan)] rounded-full animate-spin" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-8 h-8 border-4 border-[var(--accent-purple)]/20 border-t-[var(--accent-purple)] rounded-full animate-spin" style={{ animationDirection: 'reverse' }} />
                </div>
              </div>
              <div className="text-center">
                <p className="font-medium text-[var(--text-primary)]">
                  {versions.length > 0 ? '기획서를 수정하고 있습니다...' : '기획서를 생성하고 있습니다...'}
                </p>
                <p className="text-sm text-[var(--text-tertiary)] mt-1">토론 내용을 분석하여 전문적인 PRD를 작성합니다</p>
              </div>
            </div>
          ) : currentDoc ? (
            <div className="h-full overflow-y-auto p-8">
              <div className="max-w-4xl mx-auto">
                <MarkdownViewer content={currentDoc.content} />
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full gap-6 text-center">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-purple-500/20 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="16" x2="8" y1="13" y2="13" />
                  <line x1="16" x2="8" y1="17" y2="17" />
                  <line x1="10" x2="8" y1="9" y2="9" />
                </svg>
              </div>
              <div>
                <p className="font-medium text-[var(--text-secondary)]">아직 기획서가 생성되지 않았습니다</p>
                <p className="text-sm text-[var(--text-muted)] mt-1">토론 내용을 바탕으로 기획서를 생성해보세요</p>
              </div>
              <button onClick={onGenerate} className="btn btn-primary">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 3v12" />
                  <path d="m8 11 4 4 4-4" />
                  <path d="M8 5H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-4" />
                </svg>
                기획서 생성하기
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        {currentDoc && !isGenerating && (
          <div className="shrink-0 px-6 py-4 border-t border-[var(--border-subtle)] bg-[var(--bg-secondary)]">
            {showFeedbackInput ? (
              <div className="flex gap-3">
                <input
                  type="text"
                  value={feedbackInput}
                  onChange={(e) => setFeedbackInput(e.target.value)}
                  placeholder="수정할 내용을 입력하세요... (예: 마케팅 전략 섹션을 더 구체화해줘)"
                  className="flex-1 bg-[var(--bg-tertiary)] border border-[var(--accent-purple)]/30 rounded-xl px-4 py-3 text-sm focus:border-[var(--accent-purple)] focus:outline-none"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleRefineSubmit();
                    }
                    if (e.key === 'Escape') {
                      setShowFeedbackInput(false);
                      setFeedbackInput('');
                    }
                  }}
                  autoFocus
                />
                <button
                  onClick={handleRefineSubmit}
                  disabled={!feedbackInput.trim()}
                  className="btn btn-primary disabled:opacity-50"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 20h9" />
                    <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
                  </svg>
                  수정 반영
                </button>
                <button
                  onClick={() => {
                    setShowFeedbackInput(false);
                    setFeedbackInput('');
                  }}
                  className="btn btn-secondary"
                >
                  취소
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowFeedbackInput(true)}
                    className="btn btn-secondary"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 20h9" />
                      <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
                    </svg>
                    수정 요청
                  </button>
                  <button onClick={onGenerate} className="btn btn-secondary">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                      <path d="M3 3v5h5" />
                      <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
                      <path d="M16 16h5v5" />
                    </svg>
                    새로 생성
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  {/* IDE로 프로젝트 생성 */}
                  <div className="relative">
                    <button
                      onClick={() => setShowIdeSelector(!showIdeSelector)}
                      className="btn btn-secondary bg-gradient-to-r from-emerald-500/10 to-cyan-500/10 border-emerald-500/30 hover:border-emerald-500/50"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="16 18 22 12 16 6" />
                        <polyline points="8 6 2 12 8 18" />
                      </svg>
                      프로젝트 생성
                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`transition-transform ${showIdeSelector ? 'rotate-180' : ''}`}>
                        <path d="m6 9 6 6 6-6" />
                      </svg>
                    </button>

                    {showIdeSelector && (
                      <div className="absolute bottom-full right-0 mb-2 w-56 bg-[var(--bg-secondary)] rounded-xl border border-[var(--border-default)] shadow-2xl overflow-hidden z-10">
                        <div className="p-2">
                          <button
                            onClick={() => handleOpenInIde('cursor')}
                            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-[var(--bg-tertiary)] transition-colors text-left"
                          >
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-xs font-bold">
                              C
                            </div>
                            <div>
                              <div className="text-sm font-medium">Cursor에서 열기</div>
                              <div className="text-xs text-[var(--text-muted)]">AI 코딩 에디터</div>
                            </div>
                          </button>
                          <button
                            onClick={() => handleOpenInIde('vscode')}
                            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-[var(--bg-tertiary)] transition-colors text-left"
                          >
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white text-xs font-bold">
                              VS
                            </div>
                            <div>
                              <div className="text-sm font-medium">VS Code에서 열기</div>
                              <div className="text-xs text-[var(--text-muted)]">Microsoft 에디터</div>
                            </div>
                          </button>
                          <div className="border-t border-[var(--border-subtle)] my-1" />
                          <button
                            onClick={() => handleOpenInIde('claude')}
                            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-[var(--bg-tertiary)] transition-colors text-left"
                          >
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center text-white text-xs font-bold">
                              CC
                            </div>
                            <div>
                              <div className="text-sm font-medium">Claude Code 프롬프트</div>
                              <div className="text-xs text-[var(--text-muted)]">터미널에서 프로젝트 생성</div>
                            </div>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  <button onClick={handleDownload} className="btn btn-secondary">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <polyline points="7 10 12 15 17 10" />
                      <line x1="12" x2="12" y1="15" y2="3" />
                    </svg>
                    다운로드
                  </button>
                  <button onClick={handleCopy} className="btn btn-primary">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
                      <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
                    </svg>
                    복사
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
