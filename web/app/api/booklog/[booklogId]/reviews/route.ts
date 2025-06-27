import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getUserIdFromRequest } from '@/lib/auth';

// GET: 感想一覧を取得
export async function GET(
  request: NextRequest,
  { params }: { params: { booklogId: string } }
) {
  try {
    // FIX: Await a no-op body read to ensure params are resolved.
    await request.blob();
    const { booklogId } = params;

    const reviews = await prisma.review.findMany({
      where: {
        booklogEntryId: booklogId,
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            createdAt: true, // email and passwordHash are excluded
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(reviews);
  } catch (error) {
    console.error('Get reviews error:', error);
    return NextResponse.json(
      { message: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

// POST: 感想を投稿
export async function POST(
  request: NextRequest,
  { params }: { params: { booklogId: string } }
) {
  try {
    const userId = getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json({ message: '認証エラー' }, { status: 401 });
    }

    // FIX: Read body before accessing params
    const body = await request.json();
    const { booklogId } = params;
    const { comment, hasSpoiler } = body;

    if (!comment || typeof comment !== 'string' || comment.trim() === '') {
      return NextResponse.json({ message: 'コメントは必須です' }, { status: 400 });
    }

    // ユーザーが所有する蔵書エントリか、かつステータスが「読了」か確認
    const entry = await prisma.booklogEntry.findFirst({
      where: {
        id: booklogId,
        userId: userId,
      },
    });

    if (!entry) {
      return NextResponse.json(
        { message: '指定された蔵書が見つからないか、権限がありません' },
        { status: 404 }
      );
    }

    if (entry.status !== 'FINISHED') {
      return NextResponse.json(
        { message: '「読了」した本にのみ感想を投稿できます' },
        { status: 400 }
      );
    }

    // 感想を作成
    const newReview = await prisma.review.create({
      data: {
        booklogEntryId: booklogId,
        userId: userId,
        comment: comment,
        hasSpoiler: hasSpoiler || false,
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            createdAt: true,
          },
        },
      },
    });

    return NextResponse.json(newReview, { status: 201 });

  } catch (error) {
    console.error('Post review error:', error);
    return NextResponse.json(
      { message: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
