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
  const showAll = searchParams.get('showAll') === 'true';

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  try {
    // 전체 사용자 조회
    const totalUsers = await prisma.user.count();
    const allUsers = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        memo: true,
        createdAt: true,
        _count: {
          select: { teamSessions: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    });

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
    });

    const usageMap = new Map(userUsage.map(u => [u.userId, u]));

    // 활성 사용자 수 (기간 내 API 사용)
    const activeUserIds = new Set(userUsage.map(u => u.userId));

    // 사용자 정보와 사용량 결합
    const combinedData = allUsers.map(user => {
      const usage = usageMap.get(user.id);
      return {
        userId: user.id,
        username: user.username,
        name: user.name,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
        memo: user.memo,
        createdAt: user.createdAt,
        sessionCount: user._count.teamSessions,
        hasRecentActivity: activeUserIds.has(user.id),
        usage: usage ? {
          promptTokens: usage._sum.promptTokens || 0,
          completionTokens: usage._sum.completionTokens || 0,
          totalTokens: usage._sum.totalTokens || 0,
          requestCount: usage._count,
          avgLatency: Math.round(usage._avg.latencyMs || 0),
        } : {
          promptTokens: 0,
          completionTokens: 0,
          totalTokens: 0,
          requestCount: 0,
          avgLatency: 0,
        },
      };
    });

    // 활성/비활성 사용자 수
    const activeUsersCount = await prisma.user.count({ where: { isActive: true } });
    const inactiveUsersCount = await prisma.user.count({ where: { isActive: false } });

    return NextResponse.json({
      users: combinedData,
      pagination: {
        total: totalUsers,
        page,
        limit,
        totalPages: Math.ceil(totalUsers / limit),
      },
      summary: {
        totalUsers,
        activeUsers: activeUsersCount,
        inactiveUsers: inactiveUsersCount,
        recentlyActive: activeUserIds.size,
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

// 사용자 정보 변경 (역할, 활성화, 비고)
export async function PATCH(request: Request) {
  const session = await auth();

  if (!session?.user?.id || session.user.role !== 'admin') {
    return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { userId, role, isActive, memo } = body;

    if (!userId) {
      return NextResponse.json({ error: '사용자 ID가 필요합니다.' }, { status: 400 });
    }

    // 역할 변경 시 유효성 검사
    if (role !== undefined && !['user', 'admin'].includes(role)) {
      return NextResponse.json({ error: '잘못된 역할입니다.' }, { status: 400 });
    }

    // 자기 자신의 역할이나 활성 상태는 변경 불가
    if (userId === session.user.id && (role !== undefined || isActive !== undefined)) {
      return NextResponse.json(
        { error: '자신의 역할이나 활성 상태는 변경할 수 없습니다.' },
        { status: 400 }
      );
    }

    // 업데이트할 데이터 구성
    const updateData: { role?: string; isActive?: boolean; memo?: string } = {};
    if (role !== undefined) updateData.role = role;
    if (isActive !== undefined) updateData.isActive = isActive;
    if (memo !== undefined) updateData.memo = memo;

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        username: true,
        name: true,
        role: true,
        isActive: true,
        memo: true,
      },
    });

    return NextResponse.json({ user: updatedUser });
  } catch (error) {
    console.error('Update user error:', error);
    return NextResponse.json(
      { error: '사용자 정보 변경 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
