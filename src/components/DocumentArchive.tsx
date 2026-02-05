'use client';

import { useState, useEffect } from 'react';
import type { SessionHistory, DocumentVersion } from '@/types';
import MarkdownViewer from './MarkdownViewer';
import { useAlert } from './AlertModal';

interface DocumentArchiveProps {
  isOpen: boolean;
  onClose: () => void;
  history: SessionHistory[];
  onDeleteSession: (sessionId: string) => void;
}

export default function DocumentArchive({
  isOpen,
  onClose,
  history,
  onDeleteSession,
}: DocumentArchiveProps) {
  const { confirm } = useAlert();
  const [selectedSession, setSelectedSession] = useState<SessionHistory | null>(null);
  const [selectedVersion, setSelectedVersion] = useState<DocumentVersion | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

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
    // 최신 버전 선택
    if (session.documentVersions && session.documentVersions.length > 0) {
      const latestVersion = session.documentVersions.reduce((a, b) =>
        a.version > b.version ? a : b
      );
      setSelectedVersion(latestVersion);
    }
  };

  const handleBack = () => {
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-[90vw] max-w-6xl h-[85vh] bg-[var(--bg-primary)] rounded-2xl border border-[var(--border-default)] shadow-2xl flex overflow-hidden animate-slideUp">
        {/* Sidebar - Document List */}
        <div className="w-80 shrink-0 bg-[var(--bg-secondary)] border-r border-[var(--border-subtle)] flex flex-col">
          {/* Header */}
          <div className="p-4 border-b border-[var(--border-subtle)]">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
                  </svg>
                </div>
                <div>
                  <h2 className="font-semibold">기획서 아카이브</h2>
                  <p className="text-xs text-[var(--text-tertiary)]">{sessionsWithDocs.length}개 문서</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-[var(--bg-tertiary)] text-[var(--text-tertiary)]"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 6 6 18" />
                  <path d="m6 6 12 12" />
                </svg>
              </button>
            </div>

            {/* Search */}
            <div className="relative">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="absolute left-3 top-1/2 -translate-y-1/2">
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.3-4.3" />
              </svg>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="기획서 검색..."
                className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-subtle)] rounded-lg pl-10 pr-4 py-2 text-sm focus:border-[var(--accent-cyan)] focus:outline-none"
              />
            </div>
          </div>

          {/* Document List */}
          <div className="flex-1 overflow-y-auto p-2">
            {filteredSessions.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center p-4">
                <div className="w-16 h-16 rounded-2xl bg-[var(--bg-tertiary)] flex items-center justify-center mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                    <polyline points="14 2 14 8 20 8" />
                  </svg>
                </div>
                <p className="text-sm text-[var(--text-muted)]">
                  {searchQuery ? '검색 결과가 없습니다' : '생성된 기획서가 없습니다'}
                </p>
              </div>
            ) : (
              <div className="space-y-1">
                {filteredSessions.map((session) => {
                  const latestVersion = session.documentVersions?.reduce((a, b) =>
                    a.version > b.version ? a : b
                  );
                  const isSelected = selectedSession?.id === session.id;

                  return (
                    <div
                      key={session.id}
                      onClick={() => handleSelectSession(session)}
                      className={`w-full text-left p-3 rounded-xl transition-all group cursor-pointer ${
                        isSelected
                          ? 'bg-[var(--accent-cyan)]/10 border border-[var(--accent-cyan)]/30'
                          : 'hover:bg-[var(--bg-tertiary)] border border-transparent'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <h4 className={`font-medium text-sm truncate ${isSelected ? 'text-[var(--accent-cyan)]' : ''}`}>
                            {session.goal}
                          </h4>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-[var(--text-muted)]">
                              v{latestVersion?.version || 1}
                            </span>
                            <span className="text-xs text-[var(--text-muted)]">•</span>
                            <span className="text-xs text-[var(--text-muted)]">
                              {session.documentVersions?.length || 0}개 버전
                            </span>
                          </div>
                          <p className="text-xs text-[var(--text-tertiary)] mt-1">
                            {new Date(session.updatedAt).toLocaleDateString('ko-KR', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                            })}
                          </p>
                        </div>
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
                              if (selectedSession?.id === session.id) {
                                setSelectedSession(null);
                                setSelectedVersion(null);
                              }
                            }
                          }}
                          className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-red-400 hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition-all"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M3 6h18" />
                            <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                            <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Main Content - Document Viewer */}
        <div className="flex-1 flex flex-col min-w-0">
          {selectedSession && selectedVersion ? (
            <>
              {/* Document Header */}
              <div className="shrink-0 px-6 py-4 border-b border-[var(--border-subtle)] bg-[var(--bg-secondary)]">
                <div className="flex items-center justify-between gap-4">
                  <div className="min-w-0 flex-1 overflow-hidden">
                    <h3 className="font-semibold truncate">{selectedSession.goal}</h3>
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
                </div>
              </div>

              {/* Document Content */}
              <div className="flex-1 overflow-y-auto p-8">
                <div className="max-w-4xl mx-auto">
                  <MarkdownViewer content={selectedVersion.content} />
                </div>
              </div>

              {/* Document Footer */}
              <div className="shrink-0 px-6 py-4 border-t border-[var(--border-subtle)] bg-[var(--bg-secondary)]">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-[var(--text-tertiary)]">
                    팀원 {selectedSession.members.length}명 • 메시지 {selectedSession.messages.length}개
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleDownload}
                      className="btn btn-secondary"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                        <polyline points="7 10 12 15 17 10" />
                        <line x1="12" x2="12" y1="15" y2="3" />
                      </svg>
                      다운로드
                    </button>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(selectedVersion.content);
                      }}
                      className="btn btn-primary"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
                        <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
                      </svg>
                      복사
                    </button>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center mb-6">
                <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                  <polyline points="14 2 14 8 20 8" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-[var(--text-secondary)] mb-2">
                기획서를 선택하세요
              </h3>
              <p className="text-sm text-[var(--text-muted)]">
                왼쪽 목록에서 기획서를 선택하면<br />
                내용을 확인할 수 있습니다
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
