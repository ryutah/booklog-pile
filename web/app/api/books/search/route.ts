import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import { Book } from '@/lib/generated/prisma';

// Google Books APIからのレスポンスの型定義（必要な部分のみ）
interface GoogleBookVolume {
  volumeInfo: {
    title: string;
    authors?: string[];
    publisher?: string;
    publishedDate?: string;
    description?: string;
    pageCount?: number;
    imageLinks?: {
      thumbnail?: string;
    };
    industryIdentifiers?: {
      type: 'ISBN_10' | 'ISBN_13';
      identifier: string;
    }[];
  };
}

// Google Books APIのレスポンスをBookモデルに変換するヘルパー関数
function transformToBook(item: GoogleBookVolume): Book | null {
  const { volumeInfo } = item;
  const isbn13 = volumeInfo.industryIdentifiers?.find(
    (id) => id.type === 'ISBN_13'
  )?.identifier;

  // ISBN-13がないデータは除外する
  if (!isbn13) {
    return null;
  }

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
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const isbn = searchParams.get('isbn');
  const keyword = searchParams.get('keyword');

  if (!isbn && !keyword) {
    return NextResponse.json(
      { message: 'ISBNまたはキーワードを指定してください' },
      { status: 400 }
    );
  }

  // クエリを組み立てる (isbnが優先)
  const query = isbn ? `isbn:${isbn}` : keyword;

  try {
    const response = await axios.get(
      `https://www.googleapis.com/books/v1/volumes`,
      {
        params: {
          q: query,
          maxResults: 20, // 検索結果の最大数を20件に制限
        },
      }
    );

    if (!response.data.items || response.data.items.length === 0) {
      return NextResponse.json([], { status: 200 }); // 見つからなかった場合は空配列
    }

    const books: Book[] = response.data.items
      .map(transformToBook)
      .filter((book: Book | null): book is Book => book !== null);

    return NextResponse.json(books);

  } catch (error) {
    console.error('Book search error:', error);
    return NextResponse.json(
      { message: '書籍の検索中にエラーが発生しました' },
      { status: 500 }
    );
  }
}
