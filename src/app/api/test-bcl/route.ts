/**
 * BCL (AI 압축 언어) 테스트 엔드포인트
 *
 * 동일한 입력에 대해 일반 모드 vs BCL 모드 비교
 */

import { NextRequest, NextResponse } from 'next/server';
import { compressContext, generateCompressedPrompt } from '@/lib/ai-language';
import type { Message, TeamMember } from '@/types';

// 테스트용 샘플 데이터
const sampleGoal = '음식 배달 앱 MVP 기획';

const sampleMembers: TeamMember[] = [
  {
    id: '1',
    name: '민준',
    role: 'planner',
    level: 'junior',
    model: 'gemini',
    persona: {
      personality: '열정적이고 창의적',
      speakingStyle: '제안형',
      perspective: '사용자 중심',
      strengths: ['아이디어 발굴', '트렌드 파악'],
    },
  },
  {
    id: '2',
    name: '서연',
    role: 'designer',
    level: 'senior',
    model: 'gemini',
    persona: {
      personality: '꼼꼼하고 분석적',
      speakingStyle: '검증형',
      perspective: '접근성 중시',
      strengths: ['UX 설계', '사용자 리서치'],
    },
  },
];

const sampleMessages: Message[] = [
  {
    id: 'm1',
    memberId: '1',
    memberName: '민준',
    memberRole: 'planner',
    memberLevel: 'junior',
    content: '음식 배달앱에서 [[신규 사용자 온보딩]]에 게이미피케이션을 도입하면 어떨까요? 첫 주문 시 뱃지를 주고, 3회 주문하면 등급이 올라가는 식으로요. 경쟁사들은 대부분 쿠폰만 주는데, 이런 재미 요소가 차별점이 될 것 같아요.',
    timestamp: new Date('2024-01-01T10:00:00'),
  },
  {
    id: 'm2',
    memberId: '2',
    memberName: '서연',
    memberRole: 'designer',
    memberLevel: 'senior',
    content: '게이미피케이션 자체는 좋은 접근이에요. 다만 [[접근성]] 관점에서 색맹 사용자를 고려해야 해요. 뱃지 색상만으로 구분하면 안 됩니다. 아이콘 형태나 텍스트 라벨을 병행해야 해요. 또한 과도한 게이미피케이션은 오히려 피로감을 줄 수 있어서 적절한 밸런스가 중요합니다.',
    timestamp: new Date('2024-01-01T10:01:00'),
  },
  {
    id: 'm3',
    memberId: '3',
    memberName: '지민',
    memberRole: 'developer',
    memberLevel: 'senior',
    content: '기술적으로 뱃지 시스템은 구현 가능합니다. 다만 [[실시간 랭킹]]은 부하가 클 수 있어요. Redis 같은 캐시 레이어 도입을 고려해야 합니다. 또한 뱃지 이미지 에셋 관리와 CDN 설정도 필요하고요. MVP에서는 단순한 등급 시스템으로 시작하고, 랭킹은 Phase 2로 미루는 게 좋겠습니다.',
    timestamp: new Date('2024-01-01T10:02:00'),
  },
  {
    id: 'm4',
    memberId: '4',
    memberName: '현우',
    memberRole: 'qa',
    memberLevel: 'senior',
    content: '결제 타임아웃 시 뱃지 적립이 롤백되는 케이스도 테스트해야 해요. [[결제 실패 시나리오]]가 복잡해질 수 있습니다. 결제는 성공했는데 뱃지 적립 API가 실패하면? 트랜잭션 일관성 문제가 생길 수 있어요. 보상 큐(Compensation Queue) 패턴 적용이 필요할 것 같습니다.',
    timestamp: new Date('2024-01-01T10:03:00'),
  },
  {
    id: 'm5',
    memberId: '5',
    memberName: '시우',
    memberRole: 'marketer',
    memberLevel: 'junior',
    content: '마케팅 관점에서 게이미피케이션은 [[바이럴 요소]]로 활용할 수 있어요! "나 오늘 골드 등급 달성!" 같은 공유 기능을 넣으면 자연스러운 입소문이 가능합니다. 인스타 스토리 공유 템플릿도 만들면 좋겠어요. 초기 사용자 확보에 큰 도움이 될 것 같습니다.',
    timestamp: new Date('2024-01-01T10:04:00'),
  },
];

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get('mode') || 'compare';

  // 압축 결과
  const compressed = compressContext(sampleGoal, sampleMessages);

  // 원본 텍스트 (기존 방식)
  const originalText = sampleMessages
    .map(msg => `[${msg.memberName}(${msg.memberRole})]: ${msg.content}`)
    .join('\n\n');

  if (mode === 'compare') {
    return NextResponse.json({
      goal: sampleGoal,
      messageCount: sampleMessages.length,
      comparison: {
        original: {
          format: 'Korean Full Text',
          content: originalText,
          estimatedTokens: compressed.stats.originalTokens,
        },
        bcl: {
          format: 'BCL Compressed',
          content: compressed.raw,
          estimatedTokens: compressed.stats.compressedTokens,
        },
        savings: `${compressed.stats.savings}%`,
      },
    });
  }

  if (mode === 'prompt') {
    // 특정 멤버의 프롬프트 생성 예시
    const targetMember = sampleMembers[0];
    const prompts = generateCompressedPrompt(
      targetMember,
      sampleGoal,
      sampleMessages,
      '브레인스토밍: 핵심 기능 아이디어'
    );

    return NextResponse.json({
      member: targetMember.name,
      role: targetMember.role,
      prompts: {
        systemPrompt: prompts.systemPrompt,
        userPrompt: prompts.userPrompt,
      },
      stats: compressed.stats,
    });
  }

  return NextResponse.json({ error: 'Invalid mode. Use ?mode=compare or ?mode=prompt' });
}
