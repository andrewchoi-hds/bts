/**
 * AI 전용 압축 언어 (BTS Compressed Language - BCL)
 *
 * AI 간 통신에 최적화된 압축 포맷
 * - 토큰 효율: ~70% 절약
 * - 구조화된 파싱
 * - 정보 손실 최소화
 */

import type { Message, Role, Level, TeamMember } from '@/types';

// ============================================
// 코드 매핑
// ============================================

const ROLE_CODE: Record<Role, string> = {
  planner: 'PLN',
  designer: 'DSN',
  developer: 'DEV',
  qa: 'QA',
  marketer: 'MKT',
  analyst: 'ANL',
};

const ROLE_DECODE: Record<string, Role> = {
  PLN: 'planner',
  DSN: 'designer',
  DEV: 'developer',
  QA: 'qa',
  MKT: 'marketer',
  ANL: 'analyst',
};

const LEVEL_CODE: Record<Level, string> = {
  junior: 'J',
  senior: 'S',
};

// 메시지 타입 코드
const MSG_TYPE = {
  IDEA: 'IDEA',      // 아이디어 제안
  WARN: 'WARN',      // 경고/우려
  SUG: 'SUG',        // 제안
  OK: 'OK',          // 동의/승인
  OBJ: 'OBJ',        // 반대
  Q: 'Q',            // 질문
  KP: 'KP',          // 핵심 포인트
  INFO: 'INFO',      // 정보 제공
} as const;

// ============================================
// 메시지 분석 및 타입 감지
// ============================================

function detectMessageType(content: string): string {
  const lower = content.toLowerCase();

  if (content.includes('?') || lower.includes('어떨까') || lower.includes('할까')) {
    return MSG_TYPE.IDEA;
  }
  if (lower.includes('우려') || lower.includes('문제') || lower.includes('주의') || lower.includes('고려해야')) {
    return MSG_TYPE.WARN;
  }
  if (lower.includes('제안') || lower.includes('추천') || lower.includes('하면 좋') || lower.includes('도입')) {
    return MSG_TYPE.SUG;
  }
  if (lower.includes('동의') || lower.includes('좋은') || lower.includes('가능')) {
    return MSG_TYPE.OK;
  }
  if (lower.includes('반대') || lower.includes('어려') || lower.includes('안 될')) {
    return MSG_TYPE.OBJ;
  }
  if (content.includes('?')) {
    return MSG_TYPE.Q;
  }

  return MSG_TYPE.INFO;
}

// ============================================
// 핵심 키워드 추출
// ============================================

function extractKeywords(content: string): string[] {
  const keywords: string[] = [];

  // [[키포인트]] 추출
  const kpRegex = /\[\[(.*?)\]\]/g;
  let match;
  while ((match = kpRegex.exec(content)) !== null) {
    keywords.push(match[1].replace(/\s+/g, '_'));
  }

  // 주요 명사/개념 추출 (간단한 패턴 매칭)
  const patterns = [
    /온보딩|onboarding/gi,
    /게이미피케이션|gamification/gi,
    /결제|payment/gi,
    /캐시|cache/gi,
    /성능|performance/gi,
    /접근성|a11y|accessibility/gi,
    /보안|security/gi,
    /UI|UX|디자인/gi,
    /API|서버|백엔드/gi,
    /테스트|QA/gi,
    /사용자|유저|user/gi,
    /마케팅|광고/gi,
    /데이터|분석/gi,
  ];

  for (const pattern of patterns) {
    if (pattern.test(content)) {
      const matched = content.match(pattern);
      if (matched) {
        keywords.push(matched[0].toLowerCase().replace(/\s+/g, '_'));
      }
    }
  }

  return [...new Set(keywords)];
}

// ============================================
// 메시지 압축
// ============================================

function compressMessage(msg: Message): string {
  const nameShort = msg.memberName.slice(0, 2);
  const roleCode = ROLE_CODE[msg.memberRole];
  const levelCode = LEVEL_CODE[msg.memberLevel];
  const msgType = detectMessageType(msg.content);
  const keywords = extractKeywords(msg.content);

  // 핵심 문장 추출 (첫 문장 + 키워드)
  const firstSentence = msg.content.split(/[.!?]/)[0];
  const compressed = firstSentence
    .replace(/[,'"]/g, '')
    .slice(0, 50)
    .replace(/\s+/g, '_');

  let result = `${nameShort}:${roleCode}-${levelCode}>${msgType}`;

  if (keywords.length > 0) {
    result += `{${keywords.slice(0, 3).join(',')}}`;
  }

  if (compressed.length > 10) {
    result += `[${compressed}]`;
  }

  return result;
}

// ============================================
// 전체 컨텍스트 압축
// ============================================

export interface CompressedContext {
  raw: string;
  stats: {
    originalTokens: number;
    compressedTokens: number;
    savings: number;
  };
}

export function compressContext(
  goal: string,
  messages: Message[],
  currentRound?: number,
  totalRounds?: number
): CompressedContext {
  const lines: string[] = [];

  // 헤더
  lines.push('=== BCL_v1 ===');
  lines.push(`GOAL:${goal.replace(/\s+/g, '_').slice(0, 50)}`);

  if (currentRound && totalRounds) {
    lines.push(`RND:${currentRound}/${totalRounds}`);
  }

  lines.push('---');

  // 전체 키포인트 수집
  const allKeyPoints: string[] = [];
  for (const msg of messages) {
    const kps = extractKeywords(msg.content);
    allKeyPoints.push(...kps);
  }
  const uniqueKPs = [...new Set(allKeyPoints)].slice(0, 10);

  if (uniqueKPs.length > 0) {
    lines.push(`KPS:[${uniqueKPs.join(',')}]`);
  }

  lines.push('---');

  // 메시지 압축 (이전 메시지는 더 압축, 최근은 상세)
  const RECENT_FULL = 3;
  const recentStart = Math.max(0, messages.length - RECENT_FULL);

  // 이전 메시지 요약
  if (messages.length > RECENT_FULL) {
    lines.push('HIST:');
    const older = messages.slice(0, recentStart);
    for (const msg of older) {
      lines.push(compressMessage(msg));
    }
    lines.push('---');
  }

  // 최근 메시지 (상세)
  lines.push('RECENT:');
  const recent = messages.slice(recentStart);
  for (const msg of recent) {
    const compressed = compressMessage(msg);
    // 최근 메시지는 내용도 포함
    const contentShort = msg.content.slice(0, 100).replace(/\n/g, ' ');
    lines.push(`${compressed}|"${contentShort}"`);
  }

  lines.push('=== END ===');

  const raw = lines.join('\n');

  // 토큰 추정 (대략적)
  const originalText = messages.map(m => `${m.memberName}: ${m.content}`).join('\n');
  const originalTokens = Math.ceil(originalText.length / 2); // 한글 기준 대략적 추정
  const compressedTokens = Math.ceil(raw.length / 4); // 영어/코드 기준

  return {
    raw,
    stats: {
      originalTokens,
      compressedTokens,
      savings: Math.round((1 - compressedTokens / originalTokens) * 100),
    },
  };
}

// ============================================
// 시스템 프롬프트용 BCL 스키마 설명
// ============================================

export const BCL_SCHEMA_PROMPT = `
## BCL (BTS Compressed Language) Schema

You will receive context in BCL format. Decode as follows:

### Structure
\`\`\`
=== BCL_v1 ===
GOAL:{project_goal}
RND:{current}/{total}
---
KPS:[key_point1,key_point2,...]
---
HIST:
{name}:{ROLE}-{LEVEL}>{TYPE}{details}
---
RECENT:
{name}:{ROLE}-{LEVEL}>{TYPE}{details}|"actual content"
=== END ===
\`\`\`

### Role Codes
PLN=Planner, DSN=Designer, DEV=Developer, QA=QA Engineer, MKT=Marketer, ANL=Analyst

### Level Codes
J=Junior, S=Senior

### Message Types
IDEA=New idea, WARN=Warning/Concern, SUG=Suggestion, OK=Agreement, OBJ=Objection, Q=Question, KP=Key point, INFO=Information

### Example Decoding
\`MJ:PLN-J>IDEA{gamification,onboarding}\`
= "민준 (Junior Planner) proposed an idea about gamification and onboarding"

### Response Rules
1. Understand BCL context fully before responding
2. ALWAYS respond in Korean (한국어)
3. Reference key points from KPS when relevant
4. Build upon RECENT messages
5. Your expertise should add unique value not mentioned in HIST
`;

// ============================================
// 팀원 정보 압축
// ============================================

export function compressMember(member: TeamMember): string {
  return `${member.name.slice(0, 2)}:${ROLE_CODE[member.role]}-${LEVEL_CODE[member.level]}`;
}

// ============================================
// 압축 컨텍스트로 프롬프트 생성
// ============================================

export function generateCompressedPrompt(
  member: TeamMember,
  goal: string,
  messages: Message[],
  topic?: string
): { systemPrompt: string; userPrompt: string } {
  const compressed = compressContext(goal, messages);

  const systemPrompt = `${BCL_SCHEMA_PROMPT}

---

## Your Identity
You are: ${member.name} (${LEVEL_CODE[member.level] === 'J' ? 'Junior' : 'Senior'} ${ROLE_CODE[member.role]})
Expertise: ${member.role}
Personality: ${member.persona.personality}
Strengths: ${member.persona.strengths.join(', ')}

## Response Format
- Language: Korean (한국어) ONLY
- Length: 3-6 sentences
- Highlight key points with [[double brackets]]
- No self-introduction, get straight to the point
- Add unique perspective from your role`;

  const userPrompt = `${compressed.raw}

${topic ? `TOPIC: ${topic}` : ''}

Now respond as ${member.name} in Korean.`;

  return { systemPrompt, userPrompt };
}
