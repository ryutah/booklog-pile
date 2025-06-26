import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getUserIdFromRequest } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const userId = getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json({ message: '認証エラー' }, { status: 401 });
    }

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    // 今月の読了データを取得
    const monthlyCompletedEntries = await prisma.booklogEntry.findMany({
      where: {
        userId,
        status: '読了',
        completedAt: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
      },
      include: {
        book: {
          select: {
            pageCount: true,
          },
        },
      },
    });

    const monthlyReadCount = monthlyCompletedEntries.length;
    const monthlyPageCount = monthlyCompletedEntries.reduce(
      (sum, entry) => sum + (entry.book.pageCount || 0),
      0
    );

    // 過去12ヶ月の読了履歴を取得
    const oneYearAgo = new Date(now.getFullYear() - 1, now.getMonth(), 1);
    const allCompletedEntries = await prisma.booklogEntry.findMany({
      where: {
        userId,
        status: '読了',
        completedAt: {
          gte: oneYearAgo,
        },
      },
      select: {
        completedAt: true,
      },
      orderBy: {
        completedAt: 'asc',
      },
    });

    // 月ごとに集計
    const historyMap = new Map<string, number>();
    for (let i = 0; i < 12; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      historyMap.set(monthKey, 0);
    }

    allCompletedEntries.forEach(entry => {
      if (entry.completedAt) {
        const monthKey = `${entry.completedAt.getFullYear()}-${String(entry.completedAt.getMonth() + 1).padStart(2, '0')}`;
        if (historyMap.has(monthKey)) {
          historyMap.set(monthKey, (historyMap.get(monthKey) || 0) + 1);
        }
      }
    });
    
    const history = Array.from(historyMap.entries())
      .map(([month, count]) => ({ month, count }))
      .sort((a, b) => a.month.localeCompare(b.month));

    return NextResponse.json({
      monthlyReadCount,
      monthlyPageCount,
      history,
    });

  } catch (error) {
    console.error('Get stats error:', error);
    return NextResponse.json(
      { message: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
