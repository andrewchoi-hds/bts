'use client';

import { useState, useCallback } from 'react';
import type { SessionHistory, DocumentVersion } from '@/types';
import MarkdownViewer from './MarkdownViewer';
import { useAlert } from './AlertModal';

interface ArchiveViewProps {
  history: SessionHistory[];
  onDeleteSession: (sessionId: string) => void;
}

export default function ArchiveView({
  history,
  onDeleteSession,
}: ArchiveViewProps) {
  const { confirm } = useAlert();
  const [selectedSession, setSelectedSession] = useState<SessionHistory | null>(null);
  const [selectedVersion, setSelectedVersion] = useState<DocumentVersion | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCopiedToast, setShowCopiedToast] = useState(false);
  const [showIdeSelector, setShowIdeSelector] = useState(false);
  const [ideNotification, setIdeNotification] = useState<{ ide: string; message: string } | null>(null);

  // 기획서가 있는 세션만 필터링
  const sessionsWithDocs = history.filter(
    s => s.documentVersions && s.documentVersions.length > 0
  );

  // 검색 필터링
  const filteredSessions = sessionsWithDocs.filter(s =>
    s.goal.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelectSession = (session: SessionHistory) => {
    setSelectedSession(session);
    if (session.documentVersions && session.documentVersions.length > 0) {
      const latestVersion = session.documentVersions.reduce((a, b) =>
        a.version > b.version ? a : b
      );
      setSelectedVersion(latestVersion);
    }
  };

  const handleClose = () => {
    setSelectedSession(null);
    setSelectedVersion(null);
  };

  const handleDownload = () => {
    if (!selectedVersion || !selectedSession) return;
    const blob = new Blob([selectedVersion.content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedSession.goal.replace(/\s+/g, '_')}_v${selectedVersion.version}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCopy = () => {
    if (selectedVersion) {
      navigator.clipboard.writeText(selectedVersion.content);
      setShowCopiedToast(true);
      setTimeout(() => setShowCopiedToast(false), 2000);
    }
  };

  // IDE에서 열기
  const handleOpenInIde = useCallback((ide: 'cursor' | 'vscode' | 'claude') => {
    if (!selectedVersion || !selectedSession) return;

    if (ide === 'claude') {
      // Claude Code용 프롬프트 생성 - agents, skills 포함
      const prompt = `# 프로젝트 생성 요청

다음 PRD(기획서)를 바탕으로 **완전한 프로젝트**를 생성해주세요.

---

## PRD (Product Requirements Document)

${selectedVersion.content}

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

#### 3.4 settings.json
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
      setIdeNotification({
        ide: 'Claude Code',
        message: '프롬프트가 복사되었습니다. 터미널에서 claude 실행 후 붙여넣기하세요.'
      });
    } else {
      // 기획서 내용을 클립보드에 복사
      navigator.clipboard.writeText(selectedVersion.content);
      // VS Code / Cursor 열기
      const protocol = ide === 'cursor' ? 'cursor' : 'vscode';
      const ideName = ide === 'cursor' ? 'Cursor' : 'VS Code';
      window.open(`${protocol}://file/new`, '_blank');
      setIdeNotification({
        ide: ideName,
        message: '기획서가 복사되었습니다. 새 파일에 붙여넣기하세요.'
      });
    }

    setShowIdeSelector(false);
    setTimeout(() => setIdeNotification(null), 4000);
  }, [selectedVersion, selectedSession]);

  // 빈 상태
  if (sessionsWithDocs.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center mb-6">
          <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
          </svg>
        </div>
        <h2 className="text-xl font-semibold mb-2">아직 기획서가 없습니다</h2>
        <p className="text-[var(--text-secondary)] max-w-md">
          협업을 통해 기획서를 생성하면<br />
          여기에서 모든 기획서를 확인할 수 있어요.
        </p>
      </div>
    );
  }

  // 문서 뷰어 (선택된 경우)
  if (selectedSession && selectedVersion) {
    return (
      <div className="flex-1 flex flex-col h-full">
        {/* Header */}
        <div className="shrink-0 px-8 py-5 border-b border-[var(--border-subtle)] bg-[var(--bg-secondary)]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={handleClose}
                className="p-2 rounded-lg hover:bg-[var(--bg-tertiary)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m15 18-6-6 6-6" />
                </svg>
              </button>
              <div className="min-w-0 flex-1">
                <h3 className="font-semibold text-base sm:text-lg truncate">{selectedSession.goal}</h3>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-sm text-[var(--text-tertiary)]">
                    버전 {selectedVersion.version}
                  </span>
                  {selectedVersion.feedback && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--accent-purple)]/15 text-[var(--accent-purple)]">
                      피드백 반영
                    </span>
                  )}
                  <span className="text-xs text-[var(--text-muted)]">
                    {new Date(selectedVersion.createdAt).toLocaleString('ko-KR')}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Version Selector */}
              {selectedSession.documentVersions && selectedSession.documentVersions.length > 1 && (
                <select
                  value={selectedVersion.version}
                  onChange={(e) => {
                    const version = selectedSession.documentVersions?.find(
                      v => v.version === Number(e.target.value)
                    );
                    if (version) setSelectedVersion(version);
                  }}
                  className="bg-[var(--bg-tertiary)] border border-[var(--border-subtle)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[var(--accent-cyan)]"
                >
                  {[...selectedSession.documentVersions]
                    .sort((a, b) => b.version - a.version)
                    .map((v) => (
                      <option key={v.id} value={v.version}>
                        v{v.version} {v.changes ? `- ${v.changes.slice(0, 20)}` : ''}
                      </option>
                    ))}
                </select>
              )}

              <button onClick={handleDownload} className="btn btn-secondary">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" x2="12" y1="15" y2="3" />
                </svg>
                다운로드
              </button>
              <button onClick={handleCopy} className="btn btn-secondary">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
                  <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
                </svg>
                복사
              </button>
              {/* IDE Selector */}
              <div className="relative">
                <button
                  onClick={() => setShowIdeSelector(!showIdeSelector)}
                  className="btn btn-primary"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="16 18 22 12 16 6" />
                    <polyline points="8 6 2 12 8 18" />
                  </svg>
                  코드로 만들기
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`transition-transform ${showIdeSelector ? 'rotate-180' : ''}`}>
                    <path d="m6 9 6 6 6-6" />
                  </svg>
                </button>

                {showIdeSelector && (
                  <div className="absolute right-0 top-full mt-2 w-48 bg-[var(--bg-secondary)] rounded-xl border border-[var(--border-default)] shadow-2xl overflow-hidden z-50 animate-fadeIn">
                    <div className="p-1">
                      <button
                        onClick={() => handleOpenInIde('cursor')}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm hover:bg-[var(--bg-tertiary)] transition-colors"
                      >
                        <span className="w-6 h-6 rounded bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-xs font-bold">C</span>
                        <span>Cursor</span>
                      </button>
                      <button
                        onClick={() => handleOpenInIde('vscode')}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm hover:bg-[var(--bg-tertiary)] transition-colors"
                      >
                        <span className="w-6 h-6 rounded bg-blue-500 flex items-center justify-center text-white text-xs font-bold">VS</span>
                        <span>VS Code</span>
                      </button>
                      <button
                        onClick={() => handleOpenInIde('claude')}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm hover:bg-[var(--bg-tertiary)] transition-colors"
                      >
                        <span className="w-6 h-6 rounded bg-gradient-to-br from-orange-400 to-amber-500 flex items-center justify-center text-white text-xs font-bold">Cl</span>
                        <span>Claude Code</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Document Content */}
        <div className="flex-1 overflow-y-auto overscroll-contain p-8">
          <div className="max-w-4xl mx-auto">
            <MarkdownViewer content={selectedVersion.content} />
          </div>
        </div>

        {/* Toast */}
        {showCopiedToast && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 px-4 py-2 rounded-lg bg-[var(--accent-green)] text-white text-sm font-medium shadow-lg animate-fadeIn">
            클립보드에 복사되었습니다
          </div>
        )}

        {/* IDE Notification */}
        {ideNotification && (
          <div className="fixed bottom-6 right-6 max-w-sm p-4 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-default)] shadow-2xl animate-slideUp">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--accent-cyan)] to-[var(--accent-purple)] flex items-center justify-center shrink-0">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="16 18 22 12 16 6" />
                  <polyline points="8 6 2 12 8 18" />
                </svg>
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-sm">{ideNotification.ide}</h4>
                <p className="text-sm text-[var(--text-secondary)] mt-0.5">{ideNotification.message}</p>
              </div>
              <button
                onClick={() => setIdeNotification(null)}
                className="p-1 rounded-lg hover:bg-[var(--bg-tertiary)] text-[var(--text-muted)]"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 6 6 18" />
                  <path d="m6 6 12 12" />
                </svg>
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // 기획서 목록
  return (
    <div className="flex-1 flex flex-col h-full">
      {/* Header */}
      <div className="shrink-0 px-8 py-6 border-b border-[var(--border-subtle)]">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold">기획서 아카이브</h1>
              <p className="text-sm text-[var(--text-secondary)] mt-1">생성된 기획서를 확인하고 관리하세요</p>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-subtle)]">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--accent-purple)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
              </svg>
              <span className="text-sm font-medium">{sessionsWithDocs.length}개 문서</span>
            </div>
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
              placeholder="기획서 검색..."
              className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-subtle)] rounded-xl pl-12 pr-4 py-3 focus:border-[var(--accent-cyan)] focus:outline-none transition-colors"
            />
          </div>
        </div>
      </div>

      {/* Document List */}
      <div className="flex-1 overflow-y-auto overscroll-contain p-8">
        {filteredSessions.length === 0 ? (
          <div className="text-center py-12 text-[var(--text-secondary)]">
            검색 결과가 없습니다
          </div>
        ) : (
          <div className="grid gap-4 max-w-4xl mx-auto">
            {filteredSessions.map((session) => {
              const latestVersion = session.documentVersions?.reduce((a, b) =>
                a.version > b.version ? a : b
              );

              return (
                <div
                  key={session.id}
                  onClick={() => handleSelectSession(session)}
                  className="p-4 sm:p-5 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)] hover:border-[var(--accent-purple)]/50 transition-all cursor-pointer group"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-3 sm:gap-4 min-w-0 flex-1">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center shrink-0">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--accent-purple)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="sm:w-6 sm:h-6">
                          <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                          <polyline points="14 2 14 8 20 8" />
                        </svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-base sm:text-lg truncate group-hover:text-[var(--accent-purple)] transition-colors">
                          {session.goal}
                        </h3>
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2">
                          <span className="flex items-center gap-1 text-xs sm:text-sm text-[var(--text-tertiary)]">
                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
                            </svg>
                            v{latestVersion?.version || 1}
                          </span>
                          <span className="flex items-center gap-1 text-xs sm:text-sm text-[var(--text-tertiary)]">
                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <circle cx="12" cy="12" r="10" />
                              <polyline points="12 6 12 12 16 14" />
                            </svg>
                            {session.documentVersions?.length || 0}개 버전
                          </span>
                          <span className="flex items-center gap-1 text-xs sm:text-sm text-[var(--text-tertiary)]">
                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                              <circle cx="9" cy="7" r="4" />
                            </svg>
                            {session.members.length}명
                          </span>
                        </div>
                        <p className="text-xs text-[var(--text-muted)] mt-2">
                          {new Date(session.updatedAt).toLocaleDateString('ko-KR', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={async (e) => {
                          e.stopPropagation();
                          const confirmed = await confirm({
                            title: '기획서 삭제',
                            message: '이 기획서를 삭제하시겠습니까?',
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
                      <div className="p-2 rounded-lg text-[var(--text-muted)] group-hover:text-[var(--accent-purple)] transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="m9 18 6-6-6-6" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
