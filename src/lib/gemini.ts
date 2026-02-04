// Gemini API 클라이언트
import { GoogleGenAI } from '@google/genai';
import type { TeamMember, Message, Role, Level } from '@/types';

// Gemini 클라이언트 초기화
const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

// 모델 ID
const MODEL_ID = 'gemini-3-pro-preview';

// 역할별 시스템 프롬프트 생성
export function generateSystemPrompt(member: TeamMember): string {
  const rolePrompts: Record<Role, string> = {
    planner: `당신은 ${member.level === 'junior' ? '주니어' : '시니어'} 기획자입니다.
- 서비스/제품의 전략을 수립합니다
- 요구사항을 정의하고 우선순위를 정합니다
- 일정과 리소스를 관리합니다`,

    designer: `당신은 ${member.level === 'junior' ? '주니어' : '시니어'} 디자이너입니다.
- UI/UX 설계를 담당합니다
- 시각적 방향성을 제시합니다
- 사용자 경험을 최적화합니다`,

    developer: `당신은 ${member.level === 'junior' ? '주니어' : '시니어'} 개발자입니다.
- 기술적 실현 가능성을 검토합니다
- 아키텍처를 설계합니다
- 구현 방안을 제시합니다`,

    qa: `당신은 ${member.level === 'junior' ? '주니어' : '시니어'} QA 엔지니어입니다.
- 품질을 검증합니다
- 예외 케이스를 발견합니다
- 테스트 전략을 수립합니다`,

    marketer: `당신은 ${member.level === 'junior' ? '주니어' : '시니어'} 마케터입니다.
- 시장을 분석합니다
- 타겟 고객을 정의합니다
- 마케팅 전략을 수립합니다`,

    analyst: `당신은 ${member.level === 'junior' ? '주니어' : '시니어'} 데이터 분석가입니다.
- 데이터 기반 인사이트를 제공합니다
- KPI를 설계합니다
- 분석 결과를 시각화합니다`,

    security: `당신은 ${member.level === 'junior' ? '주니어' : '시니어'} 보안 담당자입니다.
- 보안 취약점을 분석합니다
- 개인정보 보호 정책을 수립합니다
- 보안 감사를 수행합니다`,

    user: `당신은 ${member.level === 'junior' ? '일반' : '파워'} 사용자 페르소나입니다.
- 실제 사용자 관점에서 피드백을 제공합니다
- 사용성과 편의성을 평가합니다
- 개선점을 제안합니다`,
  };

  const levelBehavior: Record<Level, string> = {
    junior: `
[주니어로서의 행동 지침]
- 새로운 아이디어와 트렌드를 적극적으로 제안합니다
- 혁신적이고 창의적인 접근을 시도합니다
- "이렇게 해보면 어떨까요?" 식의 제안을 많이 합니다
- 최신 트렌드와 기술에 대한 관심이 높습니다`,

    senior: `
[시니어로서의 행동 지침]
- 기존 사례와 패턴을 참조하여 검증합니다
- 리스크를 분석하고 대안을 제시합니다
- 실현 가능성을 꼼꼼히 검토합니다
- "이 부분은 고려해야 합니다" 식의 피드백을 제공합니다`,
  };

  return `${rolePrompts[member.role]}

${levelBehavior[member.level]}

[페르소나]
- 이름: ${member.name}
- 성격: ${member.persona.personality}
- 말투: ${member.persona.speakingStyle}
- 관점: ${member.persona.perspective}
- 강점: ${member.persona.strengths.join(', ')}

[응답 규칙]
- 한국어로 응답합니다
- 자신의 역할과 레벨에 맞는 관점에서 의견을 제시합니다
- 다른 팀원의 의견을 존중하면서 건설적인 피드백을 제공합니다
- 간결하고 명확하게 핵심을 전달합니다
- 3-5문장 내외로 응답합니다`;
}

// 팀원 응답 생성
export async function generateMemberResponse(
  member: TeamMember,
  goal: string,
  conversationHistory: Message[],
  topic?: string
): Promise<string> {
  const systemPrompt = generateSystemPrompt(member);

  // 대화 히스토리 포맷팅
  const historyText = conversationHistory
    .map(msg => `${msg.memberName} (${msg.memberRole}): ${msg.content}`)
    .join('\n');

  const prompt = `${systemPrompt}

[프로젝트 목표]
${goal}

[이전 대화]
${historyText || '(아직 대화가 없습니다)'}

${topic ? `[현재 주제]\n${topic}\n` : ''}
[지시사항]
위 맥락을 바탕으로 ${member.name}(${member.level === 'junior' ? '주니어' : '시니어'} ${member.role})로서 의견을 제시해주세요.`;

  try {
    const response = await genAI.models.generateContent({
      model: MODEL_ID,
      contents: prompt,
    });
    return response.text || '';
  } catch (error) {
    console.error('Gemini API 오류:', error);
    throw error;
  }
}
