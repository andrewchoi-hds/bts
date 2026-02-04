/**
 * BCL vs 일반 모드 기획서 생성 품질 비교
 */

import { NextRequest, NextResponse } from 'next/server';
import { generateLongText } from '@/lib/ai-providers';
import { compressContext } from '@/lib/ai-language';
import type { Message, Role, Level } from '@/types';

const sampleGoal = '음식 배달 앱 MVP 기획';

const sampleMessages: Message[] = [
  {
    id: 'm1', memberId: '1', memberName: '민준', memberRole: 'planner' as Role, memberLevel: 'junior' as Level,
    content: '음식 배달앱에서 [[신규 사용자 온보딩]]에 게이미피케이션을 도입하면 어떨까요? 첫 주문 시 뱃지를 주고, 3회 주문하면 등급이 올라가는 식으로요. 경쟁사들은 대부분 쿠폰만 주는데, 이런 재미 요소가 차별점이 될 것 같아요.',
    timestamp: new Date(),
  },
  {
    id: 'm2', memberId: '2', memberName: '서연', memberRole: 'designer' as Role, memberLevel: 'senior' as Level,
    content: '게이미피케이션 자체는 좋은 접근이에요. 다만 [[접근성]] 관점에서 색맹 사용자를 고려해야 해요. 뱃지 색상만으로 구분하면 안 됩니다. 아이콘 형태나 텍스트 라벨을 병행해야 해요. 또한 [[간결한 UI]]가 중요합니다.',
    timestamp: new Date(),
  },
  {
    id: 'm3', memberId: '3', memberName: '지민', memberRole: 'developer' as Role, memberLevel: 'senior' as Level,
    content: '기술적으로 뱃지 시스템은 구현 가능합니다. 다만 [[실시간 랭킹]]은 부하가 클 수 있어요. [[Redis 캐시]] 레이어 도입을 고려해야 합니다. MVP에서는 단순한 등급 시스템으로 시작하고, 랭킹은 Phase 2로 미루는 게 좋겠습니다.',
    timestamp: new Date(),
  },
  {
    id: 'm4', memberId: '4', memberName: '현우', memberRole: 'qa' as Role, memberLevel: 'senior' as Level,
    content: '[[결제 실패 시나리오]]가 복잡해질 수 있습니다. 결제는 성공했는데 뱃지 적립 API가 실패하면? [[트랜잭션 일관성]] 문제가 생길 수 있어요. 보상 큐(Compensation Queue) 패턴 적용이 필요할 것 같습니다.',
    timestamp: new Date(),
  },
  {
    id: 'm5', memberId: '5', memberName: '시우', memberRole: 'marketer' as Role, memberLevel: 'junior' as Level,
    content: '마케팅 관점에서 게이미피케이션은 [[바이럴 마케팅]]으로 활용할 수 있어요! "나 오늘 골드 등급 달성!" 같은 [[SNS 공유 기능]]을 넣으면 자연스러운 입소문이 가능합니다. [[인플루언서 협업]]도 고려해보면 좋겠어요.',
    timestamp: new Date(),
  },
  {
    id: 'm6', memberId: '6', memberName: '지유', memberRole: 'analyst' as Role, memberLevel: 'senior' as Level,
    content: '데이터 관점에서 [[핵심 KPI]]를 정의해야 합니다. 뱃지 획득 후 [[7일 리텐션]], [[주문 전환율]], [[공유율]] 등을 추적해야 해요. [[A/B 테스트]]로 게이미피케이션 유무에 따른 효과를 측정하는 것도 중요합니다.',
    timestamp: new Date(),
  },
];

// 일반 모드 기획서 생성 프롬프트
function getNormalDocPrompt(goal: string, messages: Message[]): string {
  const discussion = messages
    .map(m => `[${m.memberName}(${m.memberRole})]: ${m.content}`)
    .join('\n\n');

  const keyPoints = messages
    .flatMap(m => (m.content.match(/\[\[(.*?)\]\]/g) || []).map(k => k.replace(/[\[\]]/g, '')))
    .filter((v, i, a) => a.indexOf(v) === i);

  return `# 기획서 작성 요청

## 프로젝트 목표
${goal}

## 팀 토론 내용
${discussion}

## 도출된 핵심 포인트
${keyPoints.map((p, i) => `${i + 1}. ${p}`).join('\n')}

---

위 토론 내용을 바탕으로 **PRD(Product Requirements Document)**를 작성해주세요.

## 작성 형식

### 1. Executive Summary
- 프로젝트 개요 (2-3문장)
- 핵심 가치 제안

### 2. 문제 정의
- 해결하려는 문제
- 타겟 사용자

### 3. 솔루션 개요
- 핵심 기능 목록
- 차별화 포인트

### 4. 기능 상세
각 기능별:
- 기능명
- 설명
- 우선순위 (P0/P1/P2)
- 기술 고려사항

### 5. 성공 지표 (KPI)
- 측정 지표
- 목표 수치

### 6. 리스크 및 고려사항
- 기술적 리스크
- 비즈니스 리스크

### 7. 로드맵
- Phase 1 (MVP)
- Phase 2
- Phase 3

---

**작성 규칙:**
- 한국어로 작성
- 팀 토론에서 나온 의견을 반영
- 구체적인 수치와 예시 포함
- 마크다운 형식 사용`;
}

// BCL 모드 기획서 생성 프롬프트
function getBCLDocPrompt(goal: string, messages: Message[]): string {
  const compressed = compressContext(goal, messages);

  const keyPoints = messages
    .flatMap(m => (m.content.match(/\[\[(.*?)\]\]/g) || []).map(k => k.replace(/[\[\]]/g, '')))
    .filter((v, i, a) => a.indexOf(v) === i);

  return `# PRD Generation Request

## BCL Context
${compressed.raw}

## Extracted Key Points
${keyPoints.map((p, i) => `${i + 1}. ${p}`).join('\n')}

---

Generate a **PRD (Product Requirements Document)** based on the BCL context above.

## Output Format (in Korean)

### 1. Executive Summary
- Project overview (2-3 sentences)
- Core value proposition

### 2. Problem Definition
- Problem to solve
- Target users

### 3. Solution Overview
- Core features
- Differentiators

### 4. Feature Details
For each feature:
- Feature name
- Description
- Priority (P0/P1/P2)
- Technical considerations

### 5. Success Metrics (KPI)
- Metrics to track
- Target numbers

### 6. Risks & Considerations
- Technical risks
- Business risks

### 7. Roadmap
- Phase 1 (MVP)
- Phase 2
- Phase 3

---

**Rules:**
- Write in Korean (한국어)
- Incorporate all key points from BCL context
- Include specific numbers and examples
- Use markdown format`;
}

export async function GET(request: NextRequest) {
  try {
    const startTime = Date.now();

    // ========================================
    // 1. 일반 모드 기획서 생성
    // ========================================
    const normalPrompt = getNormalDocPrompt(sampleGoal, sampleMessages);
    const normalStart = Date.now();
    const normalDoc = await generateLongText('gemini', normalPrompt);
    const normalTime = Date.now() - normalStart;

    // ========================================
    // 2. BCL 모드 기획서 생성
    // ========================================
    const bclPrompt = getBCLDocPrompt(sampleGoal, sampleMessages);
    const bclStart = Date.now();
    const bclDoc = await generateLongText('gemini', bclPrompt);
    const bclTime = Date.now() - bclStart;

    // ========================================
    // 3. 품질 분석
    // ========================================
    const analyzeDoc = (doc: string) => {
      const sections = (doc.match(/^###?\s+.+$/gm) || []).length;
      const bulletPoints = (doc.match(/^[-*]\s+.+$/gm) || []).length;
      const hasKPI = /KPI|지표|전환율|리텐션|DAU|MAU/i.test(doc);
      const hasRoadmap = /Phase|로드맵|단계/i.test(doc);
      const hasPriority = /P0|P1|P2|우선순위/i.test(doc);

      // 키포인트 반영 확인
      const keyPointsToCheck = [
        '온보딩', '접근성', '실시간', '캐시', '결제', '바이럴', 'KPI', '리텐션', 'A/B'
      ];
      const reflectedKeyPoints = keyPointsToCheck.filter(kp =>
        doc.toLowerCase().includes(kp.toLowerCase())
      );

      return {
        length: doc.length,
        sections,
        bulletPoints,
        hasKPI,
        hasRoadmap,
        hasPriority,
        reflectedKeyPoints,
        keyPointCoverage: `${reflectedKeyPoints.length}/${keyPointsToCheck.length}`,
        isKorean: /[가-힣]/.test(doc),
      };
    };

    const normalAnalysis = analyzeDoc(normalDoc.text);
    const bclAnalysis = analyzeDoc(bclDoc.text);

    // 토큰 추정
    const normalTokens = Math.ceil(normalPrompt.length / 2);
    const bclTokens = Math.ceil(bclPrompt.length / 4);

    const totalTime = Date.now() - startTime;

    return NextResponse.json({
      testInfo: {
        goal: sampleGoal,
        messageCount: sampleMessages.length,
        testType: '기획서 생성 품질 비교',
      },
      comparison: {
        normal: {
          mode: '일반 모드 (한국어 전체)',
          document: normalDoc.text,
          analysis: normalAnalysis,
          timing: {
            generationTime: `${normalTime}ms`,
            estimatedInputTokens: normalTokens,
          },
        },
        bcl: {
          mode: 'BCL 모드 (압축 언어)',
          document: bclDoc.text,
          analysis: bclAnalysis,
          timing: {
            generationTime: `${bclTime}ms`,
            estimatedInputTokens: bclTokens,
          },
        },
      },
      summary: {
        tokenSavings: `${Math.round((1 - bclTokens / normalTokens) * 100)}%`,
        timeDiff: `${normalTime - bclTime}ms`,
        qualityComparison: {
          sectionsNormal: normalAnalysis.sections,
          sectionsBCL: bclAnalysis.sections,
          keyPointCoverageNormal: normalAnalysis.keyPointCoverage,
          keyPointCoverageBCL: bclAnalysis.keyPointCoverage,
          bothHaveKPI: normalAnalysis.hasKPI && bclAnalysis.hasKPI,
          bothHaveRoadmap: normalAnalysis.hasRoadmap && bclAnalysis.hasRoadmap,
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
