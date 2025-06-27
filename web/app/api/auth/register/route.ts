import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { username, email, password } = body;

    // --- バリデーション ---
    if (!username || !email || !password) {
      return NextResponse.json(
        { message: '必須項目が不足しています' },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { message: 'パスワードは8文字以上である必要があります' },
        { status: 400 }
      );
    }

    // --- ユーザーの重複チェック ---
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { message: 'このメールアドレスは既に使用されています' },
        { status: 400 }
      );
    }

    // --- パスワードのハッシュ化 ---
    const hashedPassword = await bcrypt.hash(password, 10);

    // --- ユーザーの作成 ---
    const user = await prisma.user.create({
      data: {
        username,
        email,
        passwordHash: hashedPassword,
      },
    });

    // --- パスワードハッシュを除いたユーザー情報を返す ---
    const { passwordHash: _, ...userWithoutPassword } = user;

    return NextResponse.json(userWithoutPassword, { status: 201 });
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { message: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
