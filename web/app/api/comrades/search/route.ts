import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getUserIdFromRequest } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const userId = getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json({ message: '認証エラー' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const isbn = searchParams.get('isbn');

    if (!isbn) {
      return NextResponse.json(
        { message: 'ISBNを指定してください' },
        { status: 400 }
      );
    }

    // 同じ本を「積読」している自分以外のユーザーを探す
    const comrades = await prisma.user.findMany({
      where: {
        id: {
          not: userId, // 自分自身は除外
        },
        booklogEntries: {
          some: {
            bookIsbn: isbn,
            status: 'TSUNDOKU',
          },
        },
      },
      select: {
        id: true,
        username: true,
        createdAt: true,
      },
      take: 10, // パフォーマンスのため、最大10件に制限
    });

    return NextResponse.json(comrades);

  } catch (error) {
    console.error('Comrade search error:', error);
    return NextResponse.json(
      { message: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
