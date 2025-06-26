import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getUserIdFromRequest } from '@/lib/auth';
import { BookStatus, Book } from '@prisma/client';
import axios from 'axios';

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

// Google Books APIからISBNで書籍情報を取得するヘルパー
async function fetchBookByIsbn(isbn: string): Promise<Book | null> {
  try {
    const response = await axios.get(
      `https://www.googleapis.com/books/v1/volumes`,
      { params: { q: `isbn:${isbn}` } }
    );

    if (!response.data.items || response.data.items.length === 0) {
      return null;
    }

    const volumeInfo = response.data.items[0].volumeInfo;
    const isbn13 = volumeInfo.industryIdentifiers?.find(
      (id: any) => id.type === 'ISBN_13'
    )?.identifier;

    if (!isbn13) return null;

    // サムネイルURLのhttpをhttpsに置換
    const thumbnailUrl = volumeInfo.imageLinks?.thumbnail?.replace(/^http:/, 'https:') || null;

    return {
      isbn: isbn13,
      title: volumeInfo.title,
      author: volumeInfo.authors?.join(', ') || null,
      publisher: volumeInfo.publisher || null,
      publishedDate: volumeInfo.publishedDate || null,
      description: volumeInfo.description || null,
      pageCount: volumeInfo.pageCount || null,
      thumbnailUrl: thumbnailUrl,
    };
  } catch (error) {
    console.error(`Failed to fetch book data for ISBN ${isbn}:`, error);
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json({ message: '認証エラー' }, { status: 401 });
    }

    const body = await request.json();
    const { isbn } = body;

    if (!isbn || typeof isbn !== 'string') {
      return NextResponse.json({ message: 'ISBNが必要です' }, { status: 400 });
    }

    // 蔵書に既に同じ本がないかチェック
    const existingEntry = await prisma.booklogEntry.findUnique({
      where: {
        userId_bookIsbn: {
          userId,
          bookIsbn: isbn,
        },
      },
    });

    if (existingEntry) {
      return NextResponse.json(
        { message: 'この本は既に追加されています' },
        { status: 400 }
      );
    }

    // booksテーブルに本が存在するかチェック
    let book = await prisma.book.findUnique({
      where: { isbn },
    });

    // booksテーブルに本が存在しない場合、外部APIから取得して保存
    if (!book) {
      const bookInfo = await fetchBookByIsbn(isbn);
      if (!bookInfo) {
        return NextResponse.json(
          { message: '有効な書籍情報が見つかりませんでした' },
          { status: 404 }
        );
      }
      book = await prisma.book.create({
        data: bookInfo,
      });
    }

    // 蔵書エントリを作成
    const newBooklogEntry = await prisma.booklogEntry.create({
      data: {
        userId,
        bookIsbn: isbn,
        status: '積読', // デフォルトステータス
      },
      include: {
        book: true, // 作成したエントリに書籍情報を含めて返す
      },
    });

    return NextResponse.json(newBooklogEntry, { status: 201 });

  } catch (error) {
    console.error('Add book to log error:', error);
    // Prismaのユニーク制約違反エラーをハンドリング
    if (error instanceof Error && 'code' in error && (error as any).code === 'P2002') {
        return NextResponse.json(
            { message: 'この本は既に追加されています' },
            { status: 400 }
        );
    }
    return NextResponse.json(
      { message: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
