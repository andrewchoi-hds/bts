/**
 * 세션 상세 조회/수정/삭제 API
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import prisma from '@/lib/prisma';

// 세션에 메시지 추가
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { type, data } = body as {
      type: 'message' | 'document';
      data: {
        // message fields
        memberId?: string;
        memberName?: string;
        memberRole?: string;
        memberLevel?: string;
        content?: string;
        // document fields
        version?: number;
        changes?: string;
        feedback?: string;
      };
    };

    // 세션 소유권 확인
    const teamSession = await prisma.teamSession.findFirst({
      where: { id, userId: session.user.id },
    });

    if (!teamSession) {
      return NextResponse.json({ error: '세션을 찾을 수 없습니다.' }, { status: 404 });
    }

    if (type === 'message') {
      const message = await prisma.message.create({
        data: {
          sessionId: id,
          memberId: data.memberId || null,
          memberName: data.memberName || 'Unknown',
          memberRole: data.memberRole || 'user',
          memberLevel: data.memberLevel || 'junior',
          content: data.content || '',
        },
      });

      // 세션 업데이트 시간 갱신
      await prisma.teamSession.update({
        where: { id },
        data: { updatedAt: new Date() },
      });

      return NextResponse.json({ message });
    }

    if (type === 'document') {
      // 현재 최신 버전 확인
      const latestDoc = await prisma.document.findFirst({
        where: { sessionId: id },
        orderBy: { version: 'desc' },
      });

      const newVersion = (latestDoc?.version || 0) + 1;

      const document = await prisma.document.create({
        data: {
          sessionId: id,
          version: newVersion,
          content: data.content || '',
          changes: data.changes,
          feedback: data.feedback,
        },
      });

      // 세션 업데이트 시간 갱신
      await prisma.teamSession.update({
        where: { id },
        data: { updatedAt: new Date() },
      });

      return NextResponse.json({ document });
    }

    return NextResponse.json({ error: '잘못된 요청입니다.' }, { status: 400 });
  } catch (error) {
    console.error('세션 데이터 추가 오류:', error);
    return NextResponse.json(
      { error: '데이터 추가 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// 세션 삭제
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
    }

    const { id } = await params;

    // 세션이 현재 사용자의 것인지 확인
    const teamSession = await prisma.teamSession.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
    });

    if (!teamSession) {
      return NextResponse.json({ error: '세션을 찾을 수 없습니다.' }, { status: 404 });
    }

    // 세션 삭제 (cascade로 관련 데이터도 삭제됨)
    await prisma.teamSession.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('세션 삭제 오류:', error);
    return NextResponse.json(
      { error: '세션 삭제 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
