'use client';

import { useMemo } from 'react';
import type { Message, Role, DocumentVersion } from '@/types';

interface TimelineEvent {
  id: string;
  type: 'stage' | 'message' | 'document';
  stage?: 'brainstorming' | 'discussion' | 'review' | 'execution';
  memberName?: string;
  memberRole?: Role;
  content?: string;
  keyPoints?: string[];
  documentVersion?: number;
  timestamp: Date;
}

interface CollaborationTimelineProps {
  messages: Message[];
  documentVersions: DocumentVersion[];
}

const STAGE_COLORS: Record<string, { bg: string; border: string; text: string; icon: string }> = {
  brainstorming: {
    bg: 'bg-cyan-500/10',
    border: 'border-cyan-500',
    text: 'text-cyan-400',
    icon: '💡',
  },
  discussion: {
    bg: 'bg-purple-500/10',
    border: 'border-purple-500',
    text: 'text-purple-400',
    icon: '💬',
  },
  review: {
    bg: 'bg-green-500/10',
    border: 'border-green-500',
    text: 'text-green-400',
    icon: '🔍',
  },
  execution: {
    bg: 'bg-amber-500/10',
    border: 'border-amber-500',
    text: 'text-amber-400',
    icon: '⚡',
  },
};

const STAGE_NAMES: Record<string, string> = {
  brainstorming: '브레인스토밍',
  discussion: '토론',
  review: '리뷰',
  execution: '실행',
};

// 메시지에서 핵심 포인트 추출
function extractKeyPointsFromMessage(content: string): string[] {
  const regex = /\[\[(.*?)\]\]/g;
  const keyPoints: string[] = [];
  let match;
  while ((match = regex.exec(content)) !== null) {
    keyPoints.push(match[1]);
  }
  return keyPoints;
}

// 메시지를 타임라인 이벤트로 변환
function convertToTimeline(messages: Message[], documentVersions: DocumentVersion[]): TimelineEvent[] {
  const events: TimelineEvent[] = [];
  let currentStage: string | null = null;

  messages.forEach((msg) => {
    // 시스템 메시지에서 단계 시작 감지
    if (msg.memberId === 'system' && msg.content.includes('단계를 시작합니다')) {
      let stage: 'brainstorming' | 'discussion' | 'review' | 'execution' = 'brainstorming';
      if (msg.content.includes('브레인스토밍')) stage = 'brainstorming';
      else if (msg.content.includes('토론')) stage = 'discussion';
      else if (msg.content.includes('리뷰')) stage = 'review';
      else if (msg.content.includes('실행')) stage = 'execution';

      currentStage = stage;
      events.push({
        id: msg.id,
        type: 'stage',
        stage,
        timestamp: new Date(msg.timestamp),
      });
      return;
    }

    // 일반 메시지 (시스템, 사용자 제외)
    if (msg.memberId !== 'system' && msg.memberId !== 'user') {
      const keyPoints = extractKeyPointsFromMessage(msg.content);
      events.push({
        id: msg.id,
        type: 'message',
        stage: currentStage as 'brainstorming' | 'discussion' | 'review' | 'execution',
        memberName: msg.memberName,
        memberRole: msg.memberRole,
        content: msg.content,
        keyPoints,
        timestamp: new Date(msg.timestamp),
      });
    }
  });

  // 문서 버전 추가
  documentVersions.forEach((doc) => {
    events.push({
      id: doc.id,
      type: 'document',
      documentVersion: doc.version,
      content: doc.changes,
      timestamp: new Date(doc.createdAt),
    });
  });

  // 시간순 정렬
  return events.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
}

export default function CollaborationTimeline({ messages, documentVersions }: CollaborationTimelineProps) {
  const timeline = useMemo(
    () => convertToTimeline(messages, documentVersions),
    [messages, documentVersions]
  );

  // 핵심 포인트만 모으기
  const allKeyPoints = useMemo(() => {
    const points: { point: string; memberName: string; stage: string }[] = [];
    timeline.forEach((event) => {
      if (event.type === 'message' && event.keyPoints && event.keyPoints.length > 0) {
        event.keyPoints.forEach((point) => {
          points.push({
            point,
            memberName: event.memberName || '',
            stage: event.stage || 'brainstorming',
          });
        });
      }
    });
    return points;
  }, [timeline]);

  if (timeline.length === 0) {
    return (
      <div className="p-4 text-center text-[var(--text-muted)]">
        아직 협업 기록이 없습니다.
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* 핵심 포인트 요약 - 고정 */}
      {allKeyPoints.length > 0 && (
        <div className="shrink-0 p-4 rounded-xl bg-gradient-to-r from-cyan-500/10 to-purple-500/10 border border-[var(--border-subtle)] mb-4">
          <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--accent-cyan)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
            핵심 포인트 ({allKeyPoints.length})
          </h4>
          <div className="flex flex-wrap gap-2">
            {allKeyPoints.slice(0, 8).map((kp, idx) => (
              <span
                key={idx}
                className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs ${
                  STAGE_COLORS[kp.stage]?.bg || 'bg-[var(--bg-tertiary)]'
                } ${STAGE_COLORS[kp.stage]?.text || 'text-[var(--text-secondary)]'}`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-current" />
                {kp.point}
              </span>
            ))}
            {allKeyPoints.length > 8 && (
              <span className="text-xs text-[var(--text-muted)] px-2 py-1">
                +{allKeyPoints.length - 8}개 더
              </span>
            )}
          </div>
        </div>
      )}

      {/* 타임라인 - 스크롤 영역 */}
      <div className="flex-1 overflow-y-auto overscroll-contain relative pl-4">
        {/* 세로 라인 */}
        <div className="absolute left-[7px] top-0 bottom-0 w-0.5 bg-[var(--border-subtle)]" />

        <div className="space-y-3">
          {timeline.map((event) => {
            if (event.type === 'stage') {
              const stageConfig = STAGE_COLORS[event.stage || 'brainstorming'];
              return (
                <div key={event.id} className="relative flex items-center gap-3">
                  {/* 노드 */}
                  <div className={`absolute -left-4 w-4 h-4 rounded-full ${stageConfig.bg} border-2 ${stageConfig.border} flex items-center justify-center text-[8px]`}>
                    {stageConfig.icon}
                  </div>
                  <div className={`ml-4 px-3 py-2 rounded-lg ${stageConfig.bg} border border-${stageConfig.border.split('-')[1]}-500/30`}>
                    <span className={`text-sm font-medium ${stageConfig.text}`}>
                      {STAGE_NAMES[event.stage || 'brainstorming']} 시작
                    </span>
                  </div>
                </div>
              );
            }

            if (event.type === 'message') {
              return (
                <div key={event.id} className="relative flex items-start gap-3">
                  {/* 노드 */}
                  <div className="absolute -left-4 w-2 h-2 mt-2 rounded-full bg-[var(--border-default)]" />
                  <div className="ml-4 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium">{event.memberName}</span>
                      <span className="text-xs text-[var(--text-muted)]">
                        {event.timestamp.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    {event.keyPoints && event.keyPoints.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {event.keyPoints.map((point, idx) => (
                          <span
                            key={idx}
                            className="text-xs px-2 py-0.5 rounded bg-[var(--accent-cyan)]/10 text-[var(--accent-cyan)]"
                          >
                            {point}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            }

            if (event.type === 'document') {
              return (
                <div key={event.id} className="relative flex items-center gap-3">
                  {/* 노드 */}
                  <div className="absolute -left-4 w-4 h-4 rounded-full bg-green-500/20 border-2 border-green-500 flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-green-500">
                      <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                    </svg>
                  </div>
                  <div className="ml-4 px-3 py-2 rounded-lg bg-green-500/10 border border-green-500/30">
                    <span className="text-sm font-medium text-green-400">
                      기획서 v{event.documentVersion}
                      {event.content && (
                        <span className="ml-2 font-normal text-[var(--text-muted)]">
                          - {event.content}
                        </span>
                      )}
                    </span>
                  </div>
                </div>
              );
            }

            return null;
          })}
        </div>
      </div>
    </div>
  );
}
