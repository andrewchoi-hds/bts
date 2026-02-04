import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET(request: Request) {
  const session = await auth();

  // 관리자 권한 확인
  if (!session?.user?.id || session.user.role !== 'admin') {
    return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const days = parseInt(searchParams.get('days') || '30');

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  try {
    // 전체 통계
    const totalStats = await prisma.aPIUsageLog.aggregate({
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
    });

    // 일별 통계 (최근 30일)
    const dailyStats = await prisma.aPIUsageLog.groupBy({
      by: ['createdAt'],
      where: { createdAt: { gte: startDate } },
      _sum: { totalTokens: true },
      _count: true,
    });

    // 일별 데이터를 날짜별로 집계
    const dailyMap = new Map<string, { tokens: number; count: number }>();
    dailyStats.forEach(stat => {
      const date = new Date(stat.createdAt).toISOString().split('T')[0];
      const existing = dailyMap.get(date) || { tokens: 0, count: 0 };
      dailyMap.set(date, {
        tokens: existing.tokens + (stat._sum.totalTokens || 0),
        count: existing.count + stat._count,
      });
    });

    const dailyData = Array.from(dailyMap.entries())
      .map(([date, data]) => ({
        date,
        tokens: data.tokens,
        requests: data.count,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // 프로바이더별 통계
    const providerStats = await prisma.aPIUsageLog.groupBy({
      by: ['provider'],
      where: { createdAt: { gte: startDate } },
      _sum: { totalTokens: true },
      _count: true,
    });

    // 엔드포인트별 통계
    const endpointStats = await prisma.aPIUsageLog.groupBy({
      by: ['endpoint'],
      where: { createdAt: { gte: startDate } },
      _sum: { totalTokens: true },
      _count: true,
    });

    // 사용자 수
    const userCount = await prisma.user.count();

    // 활성 사용자 (최근 7일 이내 API 사용)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const activeUsers = await prisma.aPIUsageLog.groupBy({
      by: ['userId'],
      where: { createdAt: { gte: sevenDaysAgo } },
    });

    // 총 세션 수
    const sessionCount = await prisma.teamSession.count();

    // 성공/실패 비율
    const successCount = await prisma.aPIUsageLog.count({
      where: { createdAt: { gte: startDate }, success: true },
    });

    // 총 메시지 수
    const messageCount = await prisma.message.count();

    // 총 문서 수
    const documentCount = await prisma.document.count();

    // 평균 팀 사이즈
    const teamMemberStats = await prisma.teamMember.groupBy({
      by: ['sessionId'],
      _count: true,
    });
    const avgTeamSize = teamMemberStats.length > 0
      ? Math.round((teamMemberStats.reduce((sum, t) => sum + t._count, 0) / teamMemberStats.length) * 10) / 10
      : 0;

    // 역할 분포
    const roleStats = await prisma.teamMember.groupBy({
      by: ['role'],
      _count: true,
    });
    const totalMembers = roleStats.reduce((sum, r) => sum + r._count, 0);

    // 프로바이더별 비용 계산 (추정)
    // Gemini: $0.000125/1K input, $0.000375/1K output (평균 $0.00025/1K)
    // OpenAI: $0.0015/1K input, $0.002/1K output (평균 $0.00175/1K)
    const costByProvider = providerStats.map(p => {
      const tokens = p._sum.totalTokens || 0;
      let costPer1K = 0.00025; // default: gemini
      if (p.provider.toLowerCase() === 'openai') costPer1K = 0.00175;
      if (p.provider.toLowerCase() === 'claude') costPer1K = 0.003;
      return {
        name: p.provider,
        tokens,
        cost: Math.round((tokens / 1000) * costPer1K * 100) / 100,
      };
    });

    return NextResponse.json({
      overview: {
        totalTokens: totalStats._sum.totalTokens || 0,
        totalRequests: totalStats._count,
        avgLatency: Math.round(totalStats._avg.latencyMs || 0),
        userCount,
        activeUsers: activeUsers.length,
        sessionCount,
        messageCount,
        documentCount,
        avgTeamSize,
        successRate: totalStats._count > 0 ? Math.round((successCount / totalStats._count) * 100) : 100,
      },
      daily: dailyData,
      byProvider: providerStats.map(p => ({
        name: p.provider,
        tokens: p._sum.totalTokens || 0,
        requests: p._count,
      })),
      byEndpoint: endpointStats.map(e => ({
        name: e.endpoint,
        tokens: e._sum.totalTokens || 0,
        requests: e._count,
      })),
      roleDistribution: roleStats.map(r => ({
        role: r.role,
        count: r._count,
        percentage: totalMembers > 0 ? Math.round((r._count / totalMembers) * 100) : 0,
      })),
      costByProvider,
    });
  } catch (error) {
    console.error('Admin stats error:', error);
    return NextResponse.json(
      { error: '통계 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
