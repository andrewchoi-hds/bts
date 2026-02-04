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
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '20');

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  try {
    // 사용자별 토큰 사용량 집계
    const userUsage = await prisma.aPIUsageLog.groupBy({
      by: ['userId'],
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
      orderBy: {
        _sum: { totalTokens: 'desc' },
      },
    });

    // 사용자 정보 조회
    const userIds = userUsage.map(u => u.userId);
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: {
        id: true,
        username: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        _count: {
          select: { teamSessions: true },
        },
      },
    });

    const userMap = new Map(users.map(u => [u.id, u]));

    // 사용량 데이터와 사용자 정보 결합
    const combinedData = userUsage.map(usage => {
      const user = userMap.get(usage.userId);
      return {
        userId: usage.userId,
        username: user?.username || 'Unknown',
        name: user?.name || null,
        email: user?.email || null,
        role: user?.role || 'user',
        createdAt: user?.createdAt,
        sessionCount: user?._count.teamSessions || 0,
        usage: {
          promptTokens: usage._sum.promptTokens || 0,
          completionTokens: usage._sum.completionTokens || 0,
          totalTokens: usage._sum.totalTokens || 0,
          requestCount: usage._count,
          avgLatency: Math.round(usage._avg.latencyMs || 0),
        },
      };
    });

    // 페이지네이션
    const total = combinedData.length;
    const paginatedData = combinedData.slice((page - 1) * limit, page * limit);

    // 사용량이 없는 사용자도 포함 (선택적)
    const allUsers = await prisma.user.count();

    return NextResponse.json({
      users: paginatedData,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
      summary: {
        totalUsers: allUsers,
        activeUsers: total,
        inactiveUsers: allUsers - total,
      },
    });
  } catch (error) {
    console.error('Admin users error:', error);
    return NextResponse.json(
      { error: '사용자 목록 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// 사용자 역할 변경
export async function PATCH(request: Request) {
  const session = await auth();

  if (!session?.user?.id || session.user.role !== 'admin') {
    return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { userId, role } = body;

    if (!userId || !role || !['user', 'admin'].includes(role)) {
      return NextResponse.json({ error: '잘못된 요청입니다.' }, { status: 400 });
    }

    // 자기 자신의 역할은 변경 불가
    if (userId === session.user.id) {
      return NextResponse.json(
        { error: '자신의 역할은 변경할 수 없습니다.' },
        { status: 400 }
      );
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { role },
      select: {
        id: true,
        username: true,
        name: true,
        role: true,
      },
    });

    return NextResponse.json({ user: updatedUser });
  } catch (error) {
    console.error('Update user role error:', error);
    return NextResponse.json(
      { error: '역할 변경 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
