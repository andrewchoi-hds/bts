// AI Provider 추상화 모듈
import { GoogleGenAI } from '@google/genai';
import OpenAI from 'openai';
import type { AIModel } from '@/types';

// 토큰 사용량 타입
export interface TokenUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

// API 응답 타입
export interface AIResponse {
  text: string;
  usage: TokenUsage;
  latencyMs: number;
  provider: 'gemini' | 'openai';
  model: string;
}

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

// 통합 API 호출 (토큰 사용량 포함)
export async function generateText(
  model: AIModel,
  systemPrompt: string,
  userPrompt: string
): Promise<AIResponse> {
  const config = MODEL_CONFIG[model];
  const startTime = Date.now();

  if (config.provider === 'gemini') {
    const client = getGeminiClient();
    const contents = `${systemPrompt}\n\n---\n\n${userPrompt}`;
    const response = await client.models.generateContent({
      model: config.modelId,
      contents,
    });

    const latencyMs = Date.now() - startTime;

    // Gemini usageMetadata에서 토큰 정보 추출
    const usageMetadata = response.usageMetadata;
    const usage: TokenUsage = {
      promptTokens: usageMetadata?.promptTokenCount || 0,
      completionTokens: usageMetadata?.candidatesTokenCount || 0,
      totalTokens: usageMetadata?.totalTokenCount || 0,
    };

    return {
      text: response.text || '',
      usage,
      latencyMs,
      provider: 'gemini',
      model: config.modelId,
    };
  }

  if (config.provider === 'openai') {
    const client = getOpenAIClient();
    const latencyMs = Date.now() - startTime;

    // GPT-5.2는 새 responses API 사용
    if (config.modelId.startsWith('gpt-5')) {
      const response = await client.responses.create({
        model: config.modelId,
        instructions: systemPrompt,
        input: userPrompt,
      });

      // OpenAI responses API의 usage 정보 추출
      const usage: TokenUsage = {
        promptTokens: response.usage?.input_tokens || 0,
        completionTokens: response.usage?.output_tokens || 0,
        totalTokens: (response.usage?.input_tokens || 0) + (response.usage?.output_tokens || 0),
      };

      return {
        text: response.output_text || '',
        usage,
        latencyMs: Date.now() - startTime,
        provider: 'openai',
        model: config.modelId,
      };
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

    const usage: TokenUsage = {
      promptTokens: completion.usage?.prompt_tokens || 0,
      completionTokens: completion.usage?.completion_tokens || 0,
      totalTokens: completion.usage?.total_tokens || 0,
    };

    return {
      text: completion.choices[0]?.message?.content || '',
      usage,
      latencyMs: Date.now() - startTime,
      provider: 'openai',
      model: config.modelId,
    };
  }

  throw new Error(`지원하지 않는 모델: ${model}`);
}

// 긴 텍스트 생성용 (기획서 등) - 토큰 사용량 포함
export async function generateLongText(
  model: AIModel,
  prompt: string
): Promise<AIResponse> {
  const config = MODEL_CONFIG[model];
  const startTime = Date.now();

  if (config.provider === 'gemini') {
    const client = getGeminiClient();
    const response = await client.models.generateContent({
      model: config.modelId,
      contents: prompt,
    });

    const latencyMs = Date.now() - startTime;
    const usageMetadata = response.usageMetadata;
    const usage: TokenUsage = {
      promptTokens: usageMetadata?.promptTokenCount || 0,
      completionTokens: usageMetadata?.candidatesTokenCount || 0,
      totalTokens: usageMetadata?.totalTokenCount || 0,
    };

    return {
      text: response.text || '',
      usage,
      latencyMs,
      provider: 'gemini',
      model: config.modelId,
    };
  }

  if (config.provider === 'openai') {
    const client = getOpenAIClient();

    // GPT-5.2는 새 responses API 사용
    if (config.modelId.startsWith('gpt-5')) {
      const response = await client.responses.create({
        model: config.modelId,
        input: prompt,
      });

      const usage: TokenUsage = {
        promptTokens: response.usage?.input_tokens || 0,
        completionTokens: response.usage?.output_tokens || 0,
        totalTokens: (response.usage?.input_tokens || 0) + (response.usage?.output_tokens || 0),
      };

      return {
        text: response.output_text || '',
        usage,
        latencyMs: Date.now() - startTime,
        provider: 'openai',
        model: config.modelId,
      };
    }

    // 이전 모델은 chat completions API 사용
    const completion = await client.chat.completions.create({
      model: config.modelId,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      max_tokens: 4000,
    });

    const usage: TokenUsage = {
      promptTokens: completion.usage?.prompt_tokens || 0,
      completionTokens: completion.usage?.completion_tokens || 0,
      totalTokens: completion.usage?.total_tokens || 0,
    };

    return {
      text: completion.choices[0]?.message?.content || '',
      usage,
      latencyMs: Date.now() - startTime,
      provider: 'openai',
      model: config.modelId,
    };
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

// 모델 설정 가져오기
export function getModelConfig(model: AIModel) {
  return MODEL_CONFIG[model];
}
