/**
 * 회원가입 API
 */

import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import prisma from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const { username, password, name } = await request.json();

    // 유효성 검사
    if (!username || !password) {
      return NextResponse.json(
        { error: '아이디와 비밀번호는 필수입니다.' },
        { status: 400 }
      );
    }

    if (username.length < 3) {
      return NextResponse.json(
        { error: '아이디는 3자 이상이어야 합니다.' },
        { status: 400 }
      );
    }

    if (password.length < 4) {
      return NextResponse.json(
        { error: '비밀번호는 4자 이상이어야 합니다.' },
        { status: 400 }
      );
    }

    // 아이디 중복 확인
    const existingUser = await prisma.user.findUnique({
      where: { username },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: '이미 사용중인 아이디입니다.' },
        { status: 400 }
      );
    }

    // 비밀번호 해싱
    const hashedPassword = await bcrypt.hash(password, 12);

    // 사용자 생성
    const user = await prisma.user.create({
      data: {
        username,
        password: hashedPassword,
        name: name || username,
      },
    });

    return NextResponse.json({
      id: user.id,
      username: user.username,
      name: user.name,
    });
  } catch (error) {
    console.error('회원가입 오류:', error);
    const errorMessage = error instanceof Error ? error.message : '회원가입 중 오류가 발생했습니다.';
    return NextResponse.json(
      { error: errorMessage, details: String(error) },
      { status: 500 }
    );
  }
}
