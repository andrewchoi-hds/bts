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
    const failCount = await prisma.aPIUsageLog.count({
      where: { createdAt: { gte: startDate }, success: false },
    });

    return NextResponse.json({
      overview: {
        totalTokens: totalStats._sum.totalTokens || 0,
        totalRequests: totalStats._count,
        avgLatency: Math.round(totalStats._avg.latencyMs || 0),
        userCount,
        activeUsers: activeUsers.length,
        sessionCount,
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
    });
  } catch (error) {
    console.error('Admin stats error:', error);
    return NextResponse.json(
      { error: '통계 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
