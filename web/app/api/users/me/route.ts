import { NextResponse, NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { getUserIdFromRequest } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    // --- 認証 ---
    const userId = getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json({ message: '認証エラー' }, { status: 401 });
    }

    // --- ユーザー情報を取得 ---
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      // このケースは通常発生し得ない (トークンがあるのにDBにユーザーがいない)
      return NextResponse.json(
        { message: 'ユーザーが見つかりません' },
        { status: 404 }
      );
    }

    // --- パスワードハッシュを除いたユーザー情報を返す ---
    const { passwordHash: _, ...userWithoutPassword } = user;

    return NextResponse.json(userWithoutPassword);

  } catch (error) {
    console.error('Get user info error:', error);
    return NextResponse.json(
      { message: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
