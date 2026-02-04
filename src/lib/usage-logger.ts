// API 사용량 로깅 유틸리티
import { prisma } from './prisma';
import type { TokenUsage } from './ai-providers';

export interface UsageLogParams {
  userId: string;
  sessionId?: string;
  provider: 'gemini' | 'openai';
  model: string;
  endpoint: 'chat' | 'generate' | 'refine';
  usage: TokenUsage;
  latencyMs?: number;
  success?: boolean;
  errorMessage?: string;
}

export async function logAPIUsage(params: UsageLogParams) {
  try {
    await prisma.aPIUsageLog.create({
      data: {
        userId: params.userId,
        sessionId: params.sessionId,
        provider: params.provider,
        model: params.model,
        endpoint: params.endpoint,
        promptTokens: params.usage.promptTokens,
        completionTokens: params.usage.completionTokens,
        totalTokens: params.usage.totalTokens,
        latencyMs: params.latencyMs,
        success: params.success ?? true,
        errorMessage: params.errorMessage,
      },
    });
  } catch (error) {
    // 로깅 실패는 주요 기능에 영향 없이 콘솔에만 출력
    console.error('[UsageLogger] 로깅 실패:', error);
  }
}

// 사용자별 일별 사용량 조회
export async function getUserDailyUsage(userId: string, days: number = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const usage = await prisma.aPIUsageLog.groupBy({
    by: ['createdAt'],
    where: {
      userId,
      createdAt: { gte: startDate },
    },
    _sum: {
      promptTokens: true,
      completionTokens: true,
      totalTokens: true,
    },
    _count: true,
  });

  return usage;
}

// 전체 통계 조회 (관리자용)
export async function getAdminStats(days: number = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const [totalStats, dailyStats, providerStats, userStats] = await Promise.all([
    // 전체 통계
    prisma.aPIUsageLog.aggregate({
      where: { createdAt: { gte: startDate } },
      _sum: {
        promptTokens: true,
        completionTokens: true,
        totalTokens: true,
      },
      _count: true,
      _avg: {
        latencyMs: true,
      },
    }),

    // 일별 통계
    prisma.$queryRaw`
      SELECT
        DATE(created_at) as date,
        SUM(total_tokens) as total_tokens,
        COUNT(*) as request_count
      FROM api_usage_logs
      WHERE created_at >= ${startDate}
      GROUP BY DATE(created_at)
      ORDER BY date DESC
    `,

    // 프로바이더별 통계
    prisma.aPIUsageLog.groupBy({
      by: ['provider'],
      where: { createdAt: { gte: startDate } },
      _sum: { totalTokens: true },
      _count: true,
    }),

    // 사용자별 통계 (상위 10명)
    prisma.aPIUsageLog.groupBy({
      by: ['userId'],
      where: { createdAt: { gte: startDate } },
      _sum: { totalTokens: true },
      _count: true,
      orderBy: { _sum: { totalTokens: 'desc' } },
      take: 10,
    }),
  ]);

  return {
    total: totalStats,
    daily: dailyStats,
    byProvider: providerStats,
    topUsers: userStats,
  };
}
