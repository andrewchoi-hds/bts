'use client';

import { useState, useCallback } from 'react';
import type { SessionHistory, DocumentVersion } from '@/types';
import MarkdownViewer from './MarkdownViewer';

interface ArchiveViewProps {
  history: SessionHistory[];
  onDeleteSession: (sessionId: string) => void;
}

export default function ArchiveView({
  history,
  onDeleteSession,
}: ArchiveViewProps) {
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
      // Claude Code용 프롬프트 생성
      const prompt = `# 프로젝트 생성 요청

다음 PRD(기획서)를 바탕으로 프로젝트를 생성해주세요.

## PRD
${selectedVersion.content}

## 요구사항
1. 기획서 기반 프로젝트 구조 생성
2. CLAUDE.md 파일 생성 (프로젝트 컨텍스트)
3. .claude/commands/ 에 슬래시 커맨드 정의 (/feature, /component, /api, /test, /review)
4. 핵심 기능 스캐폴딩
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
        <p className="text-[var(--text-muted)] max-w-md">
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
              <div>
                <h3 className="font-semibold text-lg">{selectedSession.goal}</h3>
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
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold">기획서 아카이브</h1>
            <p className="text-sm text-[var(--text-muted)] mt-1">생성된 기획서를 확인하고 관리하세요</p>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-subtle)]">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--accent-purple)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
            </svg>
            <span className="text-sm font-medium">{sessionsWithDocs.length}개 문서</span>
          </div>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
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

      {/* Document List */}
      <div className="flex-1 overflow-y-auto overscroll-contain p-8">
        {filteredSessions.length === 0 ? (
          <div className="text-center py-12 text-[var(--text-muted)]">
            검색 결과가 없습니다
          </div>
        ) : (
          <div className="grid gap-4 max-w-4xl">
            {filteredSessions.map((session) => {
              const latestVersion = session.documentVersions?.reduce((a, b) =>
                a.version > b.version ? a : b
              );

              return (
                <div
                  key={session.id}
                  onClick={() => handleSelectSession(session)}
                  className="p-5 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)] hover:border-[var(--accent-purple)]/50 transition-all cursor-pointer group"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center shrink-0">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--accent-purple)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                          <polyline points="14 2 14 8 20 8" />
                        </svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-lg truncate group-hover:text-[var(--accent-purple)] transition-colors">
                          {session.goal}
                        </h3>
                        <div className="flex items-center gap-4 mt-2">
                          <span className="flex items-center gap-1.5 text-sm text-[var(--text-tertiary)]">
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
                            </svg>
                            v{latestVersion?.version || 1}
                          </span>
                          <span className="flex items-center gap-1.5 text-sm text-[var(--text-tertiary)]">
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <circle cx="12" cy="12" r="10" />
                              <polyline points="12 6 12 12 16 14" />
                            </svg>
                            {session.documentVersions?.length || 0}개 버전
                          </span>
                          <span className="flex items-center gap-1.5 text-sm text-[var(--text-tertiary)]">
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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

                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm('이 기획서를 삭제하시겠습니까?')) {
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
