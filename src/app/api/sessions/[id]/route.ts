/**
 * 개별 세션 조회/수정/삭제 API
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import prisma from '@/lib/prisma';

// 세션 상세 조회
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    const { id } = await params;

    if (!session?.user?.id) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
    }

    const teamSession = await prisma.teamSession.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
      include: {
        members: true,
        messages: { orderBy: { createdAt: 'asc' } },
        documents: { orderBy: { version: 'desc' } },
      },
    });

    if (!teamSession) {
      return NextResponse.json({ error: '세션을 찾을 수 없습니다.' }, { status: 404 });
    }

    return NextResponse.json({
      id: teamSession.id,
      goal: teamSession.goal,
      status: teamSession.status,
      members: teamSession.members,
      messages: teamSession.messages.map((msg) => ({
        id: msg.id,
        memberId: msg.memberId,
        memberName: msg.memberName,
        memberRole: msg.memberRole,
        memberLevel: msg.memberLevel,
        content: msg.content,
        timestamp: msg.createdAt,
      })),
      documentVersions: teamSession.documents.map((doc) => ({
        id: doc.id,
        version: doc.version,
        content: doc.content,
        changes: doc.changes,
        feedback: doc.feedback,
        createdAt: doc.createdAt,
      })),
      createdAt: teamSession.createdAt,
      updatedAt: teamSession.updatedAt,
    });
  } catch (error) {
    console.error('세션 조회 오류:', error);
    return NextResponse.json(
      { error: '세션을 불러오는 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// 세션 업데이트 (메시지 추가, 문서 추가 등)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    const { id } = await params;

    if (!session?.user?.id) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
    }

    const body = await request.json();
    const { action, data } = body;

    // 세션 소유권 확인
    const teamSession = await prisma.teamSession.findFirst({
      where: { id, userId: session.user.id },
    });

    if (!teamSession) {
      return NextResponse.json({ error: '세션을 찾을 수 없습니다.' }, { status: 404 });
    }

    switch (action) {
      case 'addMessage': {
        const message = await prisma.message.create({
          data: {
            sessionId: id,
            memberId: data.memberId,
            memberName: data.memberName,
            memberRole: data.memberRole,
            memberLevel: data.memberLevel,
            content: data.content,
            round: data.round,
            stage: data.stage,
          },
        });

        // updatedAt 갱신
        await prisma.teamSession.update({
          where: { id },
          data: { updatedAt: new Date() },
        });

        return NextResponse.json({
          id: message.id,
          memberId: message.memberId,
          memberName: message.memberName,
          memberRole: message.memberRole,
          memberLevel: message.memberLevel,
          content: message.content,
          timestamp: message.createdAt,
        });
      }

      case 'addDocument': {
        // 현재 최신 버전 조회
        const latestDoc = await prisma.document.findFirst({
          where: { sessionId: id },
          orderBy: { version: 'desc' },
        });

        const newVersion = (latestDoc?.version || 0) + 1;

        const document = await prisma.document.create({
          data: {
            sessionId: id,
            version: newVersion,
            content: data.content,
            changes: data.changes,
            feedback: data.feedback,
          },
        });

        // updatedAt 갱신
        await prisma.teamSession.update({
          where: { id },
          data: { updatedAt: new Date() },
        });

        return NextResponse.json({
          id: document.id,
          version: document.version,
          content: document.content,
          changes: document.changes,
          feedback: document.feedback,
          createdAt: document.createdAt,
        });
      }

      case 'updateStatus': {
        const updated = await prisma.teamSession.update({
          where: { id },
          data: { status: data.status },
        });

        return NextResponse.json({ status: updated.status });
      }

      default:
        return NextResponse.json({ error: '알 수 없는 작업입니다.' }, { status: 400 });
    }
  } catch (error) {
    console.error('세션 업데이트 오류:', error);
    return NextResponse.json(
      { error: '세션 업데이트 중 오류가 발생했습니다.' },
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
    const { id } = await params;

    if (!session?.user?.id) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
    }

    // 세션 소유권 확인 후 삭제
    const deleted = await prisma.teamSession.deleteMany({
      where: {
        id,
        userId: session.user.id,
      },
    });

    if (deleted.count === 0) {
      return NextResponse.json({ error: '세션을 찾을 수 없습니다.' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('세션 삭제 오류:', error);
    return NextResponse.json(
      { error: '세션 삭제 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
