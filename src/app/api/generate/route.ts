import { NextRequest, NextResponse } from 'next/server';
import { generateLongText } from '@/lib/ai-providers';
import { logAPIUsage } from '@/lib/usage-logger';
import { auth } from '@/lib/auth';
import type { Message, AIModel } from '@/types';

export async function POST(request: NextRequest) {
  const session = await auth();
  const userId = session?.user?.id;

  // 인증 필수
  if (!userId) {
    return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { goal, messages, model = 'gemini', sessionId } = body as {
      goal: string;
      messages: Message[];
      model?: AIModel;
      sessionId?: string;
    };

    // 토론 내용 요약
    const discussionSummary = messages
      .filter(m => m.memberId !== 'system' && m.memberId !== 'user')
      .map(m => `[${m.memberName} (${m.memberLevel === 'junior' ? '주니어' : '시니어'})]: ${m.content}`)
      .join('\n\n');

    // 핵심 포인트 추출 (토론에서 [[...]] 로 강조된 부분)
    const keyPointsRegex = /\[\[(.*?)\]\]/g;
    const keyPoints: string[] = [];
    messages.forEach(m => {
      let match;
      while ((match = keyPointsRegex.exec(m.content)) !== null) {
        if (!keyPoints.includes(match[1])) {
          keyPoints.push(match[1]);
        }
      }
    });

    const prompt = `# 역할
당신은 McKinsey, BCG 수준의 전략 컨설턴트이자 시니어 프로덕트 매니저입니다.
팀 토론 내용을 분석하여 실행 가능하고 전문적인 기획서를 작성합니다.

# 프로젝트 목표
${goal}

# 팀 토론 내용
${discussionSummary}

# 토론에서 도출된 핵심 포인트
${keyPoints.length > 0 ? keyPoints.map((p, i) => `${i + 1}. ${p}`).join('\n') : '(추출된 핵심 포인트 없음)'}

---

# 작성 지침

토론 내용을 깊이 분석하여 아래 구조의 **전문적이고 실행 가능한 기획서**를 작성하세요.
단순 요약이 아닌, 컨설턴트 수준의 인사이트와 구조화된 분석을 제공하세요.

---

# ${goal}
## PRD (Product Requirements Document)

### Executive Summary
> 한 문단으로 프로젝트의 핵심 가치와 목표를 요약

### 1. 프로젝트 개요

#### 1.1 배경 및 문제 정의
- 해결하고자 하는 핵심 문제
- 현재 상황과 개선 기회
- 시장/사용자 관점의 필요성

#### 1.2 목표 및 성공 지표
| 목표 | 핵심 지표 (KPI) | 목표치 |
|------|----------------|--------|
| ... | ... | ... |

#### 1.3 프로젝트 범위
- **In-Scope**: 이번 단계에서 다룰 것
- **Out-of-Scope**: 향후 단계로 미룰 것

### 2. 사용자 분석

#### 2.1 타겟 페르소나
각 페르소나별로:
- **이름/특성**: (가상의 대표 사용자)
- **목표**: 달성하고자 하는 것
- **페인포인트**: 현재 겪는 어려움
- **니즈**: 필요로 하는 솔루션

#### 2.2 사용자 여정 (User Journey)
핵심 시나리오의 단계별 경험 흐름

### 3. 솔루션 설계

#### 3.1 핵심 가치 제안 (Value Proposition)
- 우리 솔루션만의 차별화 포인트
- 경쟁 대비 우위 요소

#### 3.2 기능 요구사항
**MVP (Must-Have)**
| 우선순위 | 기능 | 설명 | 사용자 가치 |
|---------|------|------|-----------|
| P0 | ... | ... | ... |

**향후 로드맵 (Nice-to-Have)**
| 단계 | 기능 | 예상 임팩트 |
|------|------|-----------|
| Phase 2 | ... | ... |

#### 3.3 비기능 요구사항
- 성능: 응답시간, 처리량 등
- 보안: 인증, 데이터 보호 등
- 확장성: 예상 트래픽, 성장 대응

### 4. 기술 아키텍처

#### 4.1 기술 스택 권장안
| 영역 | 기술 | 선정 이유 |
|------|------|----------|
| Frontend | ... | ... |
| Backend | ... | ... |
| Database | ... | ... |
| Infra | ... | ... |

#### 4.2 시스템 구조
핵심 컴포넌트와 데이터 흐름 설명

#### 4.3 기술적 고려사항
- 기술 부채 관리 방안
- 확장성 확보 전략

### 5. UX/UI 방향성

#### 5.1 디자인 원칙
핵심 UX 원칙 3-5가지

#### 5.2 주요 화면 구성
핵심 화면/플로우 설명

#### 5.3 접근성 고려사항
- 다양한 사용자를 위한 고려

### 6. 리스크 관리

| 리스크 | 발생 가능성 | 영향도 | 대응 전략 |
|--------|-----------|-------|----------|
| ... | 높음/중간/낮음 | 높음/중간/낮음 | ... |

### 7. 실행 계획

#### 7.1 마일스톤
| 단계 | 기간 | 산출물 | 담당 |
|------|------|--------|------|
| Phase 1 | ... | ... | ... |

#### 7.2 즉시 실행 항목 (Next Steps)
1. ...
2. ...
3. ...

#### 7.3 추가 검토 필요 사항
- 의사결정이 필요한 열린 질문들

---

## 작성 시 주의사항
- 토론에서 나온 **구체적인 아이디어와 우려사항을 반드시 반영**
- 추상적 표현 대신 **구체적인 예시, 수치, 방안** 제시
- 각 역할(기획/디자인/개발/QA/마케팅/분석)의 관점이 균형있게 반영
- 마크다운 테이블, 리스트를 활용해 **가독성 높게** 작성
- 실제 실행 가능한 수준의 **Actionable** 내용으로 구성`;

    const response = await generateLongText(model, prompt);

    // 사용량 로깅
    if (userId) {
      await logAPIUsage({
        userId,
        sessionId,
        provider: response.provider,
        model: response.model,
        endpoint: 'generate',
        usage: response.usage,
        latencyMs: response.latencyMs,
        success: true,
      });
    }

    return NextResponse.json({
      content: response.text,
      usage: response.usage,
    });
  } catch (error) {
    console.error('기획서 생성 오류:', error);

    if (userId) {
      await logAPIUsage({
        userId,
        provider: 'gemini',
        model: 'unknown',
        endpoint: 'generate',
        usage: { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
        success: false,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
      });
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : '기획서 생성 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
