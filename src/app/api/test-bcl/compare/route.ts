/**
 * BCL vs 일반 모드 품질 비교 테스트
 *
 * 동일한 입력으로 두 모드의 실제 AI 응답을 비교
 */

import { NextRequest, NextResponse } from 'next/server';
import { generateText } from '@/lib/ai-providers';
import { compressContext, generateCompressedPrompt, BCL_SCHEMA_PROMPT } from '@/lib/ai-language';
import type { Message, TeamMember, Role, Level } from '@/types';

// 테스트용 샘플 데이터
const sampleGoal = '음식 배달 앱 MVP 기획';

const sampleMessages: Message[] = [
  {
    id: 'm1',
    memberId: '1',
    memberName: '민준',
    memberRole: 'planner' as Role,
    memberLevel: 'junior' as Level,
    content: '음식 배달앱에서 [[신규 사용자 온보딩]]에 게이미피케이션을 도입하면 어떨까요? 첫 주문 시 뱃지를 주고, 3회 주문하면 등급이 올라가는 식으로요. 경쟁사들은 대부분 쿠폰만 주는데, 이런 재미 요소가 차별점이 될 것 같아요.',
    timestamp: new Date('2024-01-01T10:00:00'),
  },
  {
    id: 'm2',
    memberId: '2',
    memberName: '서연',
    memberRole: 'designer' as Role,
    memberLevel: 'senior' as Level,
    content: '게이미피케이션 자체는 좋은 접근이에요. 다만 [[접근성]] 관점에서 색맹 사용자를 고려해야 해요. 뱃지 색상만으로 구분하면 안 됩니다. 아이콘 형태나 텍스트 라벨을 병행해야 해요.',
    timestamp: new Date('2024-01-01T10:01:00'),
  },
  {
    id: 'm3',
    memberId: '3',
    memberName: '지민',
    memberRole: 'developer' as Role,
    memberLevel: 'senior' as Level,
    content: '기술적으로 뱃지 시스템은 구현 가능합니다. 다만 [[실시간 랭킹]]은 부하가 클 수 있어요. Redis 같은 캐시 레이어 도입을 고려해야 합니다. MVP에서는 단순한 등급 시스템으로 시작하는 게 좋겠습니다.',
    timestamp: new Date('2024-01-01T10:02:00'),
  },
  {
    id: 'm4',
    memberId: '4',
    memberName: '현우',
    memberRole: 'qa' as Role,
    memberLevel: 'senior' as Level,
    content: '결제 타임아웃 시 뱃지 적립이 롤백되는 케이스도 테스트해야 해요. [[결제 실패 시나리오]]가 복잡해질 수 있습니다. 트랜잭션 일관성 문제도 고려해야 합니다.',
    timestamp: new Date('2024-01-01T10:03:00'),
  },
  {
    id: 'm5',
    memberId: '5',
    memberName: '시우',
    memberRole: 'marketer' as Role,
    memberLevel: 'junior' as Level,
    content: '마케팅 관점에서 게이미피케이션은 [[바이럴 요소]]로 활용할 수 있어요! "나 오늘 골드 등급 달성!" 같은 공유 기능을 넣으면 자연스러운 입소문이 가능합니다.',
    timestamp: new Date('2024-01-01T10:04:00'),
  },
];

// 응답할 팀원 (데이터 분석가)
const respondingMember: TeamMember = {
  id: '6',
  name: '지유',
  role: 'analyst' as Role,
  level: 'senior' as Level,
  model: 'gemini',
  persona: {
    personality: '논리적이고 데이터 중심적',
    speakingStyle: '분석적, 근거 기반',
    perspective: '정량적 접근',
    strengths: ['데이터 분석', 'KPI 설계', '실험 설계'],
  },
};

// 일반 모드 시스템 프롬프트 (기존)
function generateNormalSystemPrompt(member: TeamMember, goal: string): string {
  return `# 역할 정의
당신은 "${goal}" 프로젝트에 참여한 **시니어 데이터 분석가**입니다.
이름: ${member.name}

**핵심 역량:**
- 가설 기반 분석과 실험 설계 (A/B 테스트)
- 통계적 유의성과 인과관계 추론
- 코호트 분석과 퍼널 분석
- KPI 설계와 데이터 시각화

**사고 패턴:**
1. 측정 가능성 → 이 지표를 실제로 측정할 수 있는가?
2. 인과 vs 상관 → 단순 상관관계가 아닌 인과관계인가?
3. Actionable Insight → 이 분석 결과로 무엇을 바꿀 수 있는가?

# 응답 규칙
1. **언어**: 반드시 한국어로 응답
2. **형식**: 자기소개 없이 바로 본론
3. **분량**: 3-6문장
4. **핵심 강조**: 중요한 포인트는 [[이중 대괄호]]로 감싸서 강조`;
}

// 일반 모드 사용자 프롬프트 (기존 방식)
function generateNormalUserPrompt(goal: string, messages: Message[], topic: string): string {
  const historyText = messages
    .map(msg => `[${msg.memberName}(${msg.memberRole})]: ${msg.content}`)
    .join('\n\n');

  return `# 프로젝트 컨텍스트
**목표**: ${goal}

# 이전 토론 내용
${historyText}

# 현재 단계
**논의 주제**: ${topic}

---

**지시사항**: 위 맥락을 바탕으로, 지유(시니어 데이터 분석가)의 전문적 관점에서 의견을 제시하세요.

- 이전 대화에서 이미 언급된 내용을 단순 반복하지 마세요
- 당신의 역할에서만 볼 수 있는 고유한 인사이트를 추가하세요
- 구체적인 제안이나 우려사항을 명확히 표현하세요`;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const testType = searchParams.get('type') || 'response'; // 'response' or 'document'

  const topic = '토론: 게이미피케이션 도입에 대한 데이터 관점 의견';

  try {
    const startTime = Date.now();

    // ========================================
    // 1. 일반 모드 (한국어 전체)
    // ========================================
    const normalSystemPrompt = generateNormalSystemPrompt(respondingMember, sampleGoal);
    const normalUserPrompt = generateNormalUserPrompt(sampleGoal, sampleMessages, topic);

    const normalStart = Date.now();
    const normalResponse = await generateText('gemini', normalSystemPrompt, normalUserPrompt);
    const normalTime = Date.now() - normalStart;

    // ========================================
    // 2. BCL 모드 (압축 언어)
    // ========================================
    const compressed = compressContext(sampleGoal, sampleMessages);
    const bclPrompts = generateCompressedPrompt(respondingMember, sampleGoal, sampleMessages, topic);

    const bclStart = Date.now();
    const bclResponse = await generateText('gemini', bclPrompts.systemPrompt, bclPrompts.userPrompt);
    const bclTime = Date.now() - bclStart;

    // ========================================
    // 3. 품질 분석
    // ========================================
    const analyzeResponse = (text: string) => {
      const keyPoints = (text.match(/\[\[(.*?)\]\]/g) || []).map(m => m.replace(/[\[\]]/g, ''));
      const sentences = text.split(/[.!?]/).filter(s => s.trim().length > 0);
      const hasDataPerspective = /KPI|지표|측정|데이터|분석|A\/B|코호트|퍼널|전환율|리텐션/i.test(text);
      const referencesContext = /온보딩|게이미피케이션|뱃지|접근성|랭킹|결제|바이럴/i.test(text);

      return {
        length: text.length,
        sentences: sentences.length,
        keyPoints,
        keyPointCount: keyPoints.length,
        hasDataPerspective,
        referencesContext,
        isKorean: /[가-힣]/.test(text),
      };
    };

    const normalAnalysis = analyzeResponse(normalResponse.text);
    const bclAnalysis = analyzeResponse(bclResponse.text);

    // ========================================
    // 4. 토큰 사용량 추정
    // ========================================
    const normalInputTokens = Math.ceil((normalSystemPrompt.length + normalUserPrompt.length) / 2);
    const bclInputTokens = Math.ceil((bclPrompts.systemPrompt.length + bclPrompts.userPrompt.length) / 4);

    const totalTime = Date.now() - startTime;

    return NextResponse.json({
      testInfo: {
        goal: sampleGoal,
        messageCount: sampleMessages.length,
        respondingAs: `${respondingMember.name} (${respondingMember.level} ${respondingMember.role})`,
        topic,
      },
      comparison: {
        normal: {
          mode: '일반 모드 (한국어 전체)',
          response: normalResponse.text,
          analysis: normalAnalysis,
          timing: {
            responseTime: `${normalTime}ms`,
            estimatedInputTokens: normalInputTokens,
          },
        },
        bcl: {
          mode: 'BCL 모드 (압축 언어)',
          response: bclResponse.text,
          analysis: bclAnalysis,
          timing: {
            responseTime: `${bclTime}ms`,
            estimatedInputTokens: bclInputTokens,
          },
          compression: compressed.stats,
        },
      },
      summary: {
        tokenSavings: `${Math.round((1 - bclInputTokens / normalInputTokens) * 100)}%`,
        timeDiff: `${normalTime - bclTime}ms (${normalTime > bclTime ? 'BCL이 더 빠름' : '일반이 더 빠름'})`,
        qualityComparison: {
          keyPointsNormal: normalAnalysis.keyPointCount,
          keyPointsBCL: bclAnalysis.keyPointCount,
          bothHaveDataPerspective: normalAnalysis.hasDataPerspective && bclAnalysis.hasDataPerspective,
          bothReferenceContext: normalAnalysis.referencesContext && bclAnalysis.referencesContext,
          bothInKorean: normalAnalysis.isKorean && bclAnalysis.isKorean,
        },
      },
      totalTestTime: `${totalTime}ms`,
    });
  } catch (error) {
    console.error('테스트 오류:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '테스트 중 오류 발생' },
      { status: 500 }
    );
  }
}
