import { NextRequest, NextResponse } from 'next/server';
import { generateLongText } from '@/lib/ai-providers';
import type { AIModel } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      currentDocument,
      feedback,
      goal,
      model = 'gemini'
    } = body as {
      currentDocument: string;
      feedback: string;
      goal: string;
      model?: AIModel;
    };

    const prompt = `# 역할
당신은 McKinsey, BCG 수준의 전략 컨설턴트이자 시니어 프로덕트 매니저입니다.
사용자의 피드백을 반영하여 기존 기획서를 개선합니다.

# 프로젝트 목표
${goal}

# 현재 기획서
${currentDocument}

# 사용자 피드백
"${feedback}"

---

# 작업 지침

1. **피드백 분석**: 사용자가 원하는 수정 사항을 정확히 파악하세요.

2. **수정 범위 결정**:
   - 피드백이 특정 섹션에 관한 것이면 해당 섹션만 수정
   - 전체적인 방향 수정이 필요하면 관련 섹션들을 함께 수정
   - 불필요하게 다른 부분을 변경하지 마세요

3. **품질 유지**:
   - 기존 기획서의 구조와 형식을 유지
   - 수정된 내용이 기존 내용과 자연스럽게 연결되도록
   - 전문성과 구체성 수준 유지

4. **변경 사항 명시**:
   - 문서 맨 끝에 "---" 구분선 후 변경 사항 요약을 추가하지 마세요
   - 깔끔하게 수정된 전체 문서만 출력하세요

# 출력
피드백이 반영된 **완전한 기획서 전체**를 마크다운 형식으로 출력하세요.
(변경된 부분만이 아닌, 수정이 반영된 전체 문서를 출력)`;

    const content = await generateLongText(model, prompt);

    // 변경 사항 요약 생성
    const summaryPrompt = `다음 피드백을 10단어 이내로 요약하세요. 요약만 출력하고 다른 설명은 하지 마세요.

피드백: "${feedback}"`;

    const changes = await generateLongText(model, summaryPrompt);

    return NextResponse.json({
      content,
      changes: changes.trim()
    });
  } catch (error) {
    console.error('기획서 수정 오류:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '기획서 수정 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
