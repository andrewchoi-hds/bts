// AI Provider 추상화 모듈
import { GoogleGenAI } from '@google/genai';
import OpenAI from 'openai';
import type { AIModel } from '@/types';

// 싱글톤 클라이언트
let geminiClient: GoogleGenAI | null = null;
let openaiClient: OpenAI | null = null;

function getGeminiClient(): GoogleGenAI {
  if (!geminiClient) {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY가 설정되지 않았습니다.');
    }
    geminiClient = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  }
  return geminiClient;
}

function getOpenAIClient(): OpenAI {
  if (!openaiClient) {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY가 설정되지 않았습니다.');
    }
    openaiClient = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }
  return openaiClient;
}

// 모델별 설정
const MODEL_CONFIG: Record<AIModel, { provider: 'gemini' | 'openai'; modelId: string }> = {
  gemini: { provider: 'gemini', modelId: 'gemini-3-pro-preview' },
  gpt: { provider: 'openai', modelId: 'gpt-5.2' },
  claude: { provider: 'openai', modelId: 'gpt-5.2' }, // Claude는 추후 Anthropic API로 교체 예정
};

// 통합 API 호출
export async function generateText(
  model: AIModel,
  systemPrompt: string,
  userPrompt: string
): Promise<string> {
  const config = MODEL_CONFIG[model];

  if (config.provider === 'gemini') {
    const client = getGeminiClient();
    const contents = `${systemPrompt}\n\n---\n\n${userPrompt}`;
    const response = await client.models.generateContent({
      model: config.modelId,
      contents,
    });
    return response.text || '';
  }

  if (config.provider === 'openai') {
    const client = getOpenAIClient();
    // GPT-5.2는 새 responses API 사용
    if (config.modelId.startsWith('gpt-5')) {
      const response = await client.responses.create({
        model: config.modelId,
        instructions: systemPrompt,
        input: userPrompt,
      });
      return response.output_text || '';
    }
    // 이전 모델은 chat completions API 사용
    const completion = await client.chat.completions.create({
      model: config.modelId,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.7,
      max_tokens: 1000,
    });
    return completion.choices[0]?.message?.content || '';
  }

  throw new Error(`지원하지 않는 모델: ${model}`);
}

// 긴 텍스트 생성용 (기획서 등)
export async function generateLongText(
  model: AIModel,
  prompt: string
): Promise<string> {
  const config = MODEL_CONFIG[model];

  if (config.provider === 'gemini') {
    const client = getGeminiClient();
    const response = await client.models.generateContent({
      model: config.modelId,
      contents: prompt,
    });
    return response.text || '';
  }

  if (config.provider === 'openai') {
    const client = getOpenAIClient();
    // GPT-5.2는 새 responses API 사용
    if (config.modelId.startsWith('gpt-5')) {
      const response = await client.responses.create({
        model: config.modelId,
        input: prompt,
      });
      return response.output_text || '';
    }
    // 이전 모델은 chat completions API 사용
    const completion = await client.chat.completions.create({
      model: config.modelId,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      max_tokens: 4000,
    });
    return completion.choices[0]?.message?.content || '';
  }

  throw new Error(`지원하지 않는 모델: ${model}`);
}

// 사용 가능한 모델 체크
export function getAvailableModels(): AIModel[] {
  const available: AIModel[] = [];

  if (process.env.GEMINI_API_KEY) {
    available.push('gemini');
  }
  if (process.env.OPENAI_API_KEY) {
    available.push('gpt');
    available.push('claude'); // GPT-5.2로 대체
  }

  return available;
}
