import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getUserIdFromRequest } from '@/lib/auth';
import { BookStatus } from '@/lib/generated/prisma';

interface RouteParams {
  params: {
    booklogId: string;
  };
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const userId = getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json({ message: '認証エラー' }, { status: 401 });
    }

    const { booklogId } = params;

    const entry = await prisma.booklogEntry.findFirst({
      where: {
        id: booklogId,
        userId: userId, // ユーザーが所有する蔵書エントリか確認
      },
      include: {
        book: true,
      },
    });

    if (!entry) {
      return NextResponse.json(
        { message: '指定された蔵書が見つからないか、権限がありません' },
        { status: 404 }
      );
    }

    return NextResponse.json(entry);

  } catch (error) {
    console.error('Get booklog entry error:', error);
    return NextResponse.json(
      { message: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
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

    // 更新データの準備
    const dataToUpdate: { status: BookStatus; completedAt?: Date | null } = {
      status: status,
    };

    // 読了ステータスが変更された場合のcompletedAtの処理
    if (status === 'FINISHED' && entry.status !== 'FINISHED') {
      dataToUpdate.completedAt = new Date();
    } else if (status !== 'FINISHED' && entry.status === 'FINISHED') {
      dataToUpdate.completedAt = null;
    }

    // ステータスを更新
    const updatedEntry = await prisma.booklogEntry.update({
      where: {
        id: booklogId,
      },
      data: dataToUpdate,
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

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const userId = getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json({ message: '認証エラー' }, { status: 401 });
    }

    const { booklogId } = params;

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

    // 蔵書を削除
    await prisma.booklogEntry.delete({
      where: {
        id: booklogId,
      },
    });

    return new NextResponse(null, { status: 204 }); // No Content

  } catch (error) {
    console.error('Delete booklog entry error:', error);
    return NextResponse.json(
      { message: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
