/**
 * 세션 목록 조회 및 생성 API
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import prisma from '@/lib/prisma';

// 세션 목록 조회
export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
    }

    const sessions = await prisma.teamSession.findMany({
      where: { userId: session.user.id },
      include: {
        members: true,
        messages: {
          orderBy: { createdAt: 'asc' },
        },
        documents: {
          orderBy: { version: 'desc' },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    // 프론트엔드 형식에 맞게 변환
    const formattedSessions = sessions.map((s) => ({
      id: s.id,
      goal: s.goal,
      status: s.status,
      members: s.members.map((m) => ({
        id: m.id,
        name: m.name,
        role: m.role,
        level: m.level,
        model: m.model,
        persona: m.persona,
      })),
      messages: s.messages.map((msg) => ({
        id: msg.id,
        memberId: msg.memberId,
        memberName: msg.memberName,
        memberRole: msg.memberRole,
        memberLevel: msg.memberLevel,
        content: msg.content,
        timestamp: msg.createdAt,
      })),
      documentVersions: s.documents.map((doc) => ({
        id: doc.id,
        version: doc.version,
        content: doc.content,
        changes: doc.changes,
        feedback: doc.feedback,
        createdAt: doc.createdAt,
      })),
      createdAt: s.createdAt,
      updatedAt: s.updatedAt,
    }));

    return NextResponse.json(formattedSessions);
  } catch (error) {
    console.error('세션 목록 조회 오류:', error);
    return NextResponse.json(
      { error: '세션 목록을 불러오는 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// 새 세션 생성
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
    }

    const { goal, members } = await request.json();

    if (!goal) {
      return NextResponse.json({ error: '목표는 필수입니다.' }, { status: 400 });
    }

    const newSession = await prisma.teamSession.create({
      data: {
        userId: session.user.id,
        goal,
        members: {
          create: members?.map((m: {
            name: string;
            role: string;
            level: string;
            model: string;
            persona: object;
          }) => ({
            name: m.name,
            role: m.role,
            level: m.level,
            model: m.model,
            persona: m.persona,
          })) || [],
        },
      },
      include: {
        members: true,
      },
    });

    return NextResponse.json({
      id: newSession.id,
      goal: newSession.goal,
      status: newSession.status,
      members: newSession.members,
      messages: [],
      documentVersions: [],
      createdAt: newSession.createdAt,
      updatedAt: newSession.updatedAt,
    });
  } catch (error) {
    console.error('세션 생성 오류:', error);
    return NextResponse.json(
      { error: '세션 생성 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
