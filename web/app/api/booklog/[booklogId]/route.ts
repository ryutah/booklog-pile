import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getUserIdFromRequest } from '@/lib/auth';
import { BookStatus } from '@prisma/client';

interface PatchParams {
  params: {
    booklogId: string;
  };
}

export async function PATCH(request: NextRequest, { params }: PatchParams) {
  try {
    const userId = getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json({ message: '認証エラー' }, { status: 401 });
    }

    const { booklogId } = params;
    const body = await request.json();
    const { status } = body;

    if (!status || !Object.values(BookStatus).includes(status)) {
      return NextResponse.json({ message: '無効なステータスです' }, { status: 400 });
    }

    // ユーザーが所有する蔵書エントリか確認
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

    // ステータスを更新
    const updatedEntry = await prisma.booklogEntry.update({
      where: {
        id: booklogId,
      },
      data: {
        status: status,
      },
      include: {
        book: true,
      },
    });

    return NextResponse.json(updatedEntry);

  } catch (error) {
    console.error('Update booklog status error:', error);
    return NextResponse.json(
      { message: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
