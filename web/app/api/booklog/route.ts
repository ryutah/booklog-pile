import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getUserIdFromRequest } from '@/lib/auth';
import { BookStatus } from '@prisma/client';

export async function GET(request: NextRequest) {
  try {
    const userId = getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json({ message: '認証エラー' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') as BookStatus | null;

    const whereClause: { userId: string; status?: BookStatus } = { userId };
    if (status) {
      // A simple validation to ensure status is one of the enum values.
      if (Object.values(BookStatus).includes(status)) {
        whereClause.status = status;
      } else {
        return NextResponse.json({ message: '無効なステータスです' }, { status: 400 });
      }
    }

    const booklogEntries = await prisma.booklogEntry.findMany({
      where: whereClause,
      include: {
        book: true, // Include related book data
      },
      orderBy: {
        addedAt: 'desc',
      },
    });

    return NextResponse.json(booklogEntries);

  } catch (error) {
    console.error('Get booklog error:', error);
    return NextResponse.json(
      { message: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
