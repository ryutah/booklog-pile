import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password } = body;

    // --- バリデーション ---
    if (!email || !password) {
      return NextResponse.json(
        { message: 'メールアドレスとパスワードは必須です' },
        { status: 400 }
      );
    }

    // --- ユーザーを検索 ---
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      // ユーザーが存在しない場合でも、セキュリティのために曖昧なメッセージを返す
      return NextResponse.json(
        { message: '認証に失敗しました' },
        { status: 401 }
      );
    }

    // --- パスワードを比較 ---
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

    if (!isPasswordValid) {
      return NextResponse.json(
        { message: '認証に失敗しました' },
        { status: 401 }
      );
    }

    // --- JWTの秘密鍵をチェック ---
    if (!process.env.JWT_SECRET) {
      console.error('JWT_SECRET is not defined in .env file');
      // このエラーはクライアントに詳細を返すべきではない
      return NextResponse.json(
        { message: 'Internal Server Error' },
        { status: 500 }
      );
    }

    // --- JWTを生成 ---
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '1h' } // トークンの有効期限は1時間
    );

    // --- トークンを返す ---
    return NextResponse.json({ accessToken: token });
    
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { message: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
