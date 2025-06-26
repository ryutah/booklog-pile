'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { apiClient } from '@/contexts/AuthContext';
import { Book } from '@/lib/generated/prisma';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { BooklogEntry } from '@/lib/types';

export default function SearchPage() {
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Book[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [myBookIsbns, setMyBookIsbns] = useState<Set<string>>(new Set());
  const [isFetchingMyBooks, setIsFetchingMyBooks] = useState(true);
  const [addedBooks, setAddedBooks] = useState<Set<string>>(new Set()); // For optimistic UI

  useEffect(() => {
    if (!isAuthLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthLoading, isAuthenticated, router]);

  useEffect(() => {
    if (isAuthenticated) {
      setIsFetchingMyBooks(true);
      apiClient.get<BooklogEntry[]>('/booklog')
        .then(response => {
          const isbns = new Set(response.data.map(entry => entry.bookIsbn));
          setMyBookIsbns(isbns);
        })
        .catch(err => {
          console.error("Failed to fetch user's booklog", err);
        })
        .finally(() => {
          setIsFetchingMyBooks(false);
        });
    }
  }, [isAuthenticated]);

  if (isAuthLoading || !isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <p>読み込み中...</p>
      </div>
    );
  }

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setIsLoading(true);
    setError(null);
    setResults([]);

    try {
      const response = await apiClient.get('/books/search', {
        params: { keyword: query },
      });
      setResults(response.data);
    } catch (err) {
      console.error('Search failed:', err);
      setError('書籍の検索に失敗しました。');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddBook = async (isbn: string) => {
    // Optimistic update
    setAddedBooks((prev) => new Set(prev).add(isbn));

    try {
      await apiClient.post('/booklog', { isbn });
      // Update the "ground truth" state on success
      setMyBookIsbns((prev) => new Set(prev).add(isbn));
    } catch (err: any) {
      // Revert optimistic update on failure
      setAddedBooks((prev) => {
        const newSet = new Set(prev);
        newSet.delete(isbn);
        return newSet;
      });

      if (err.response?.data?.message) {
        // Don't show alert if the book is just "already added"
        if (err.response.status !== 400 || !err.response.data.message.includes('既に追加されています')) {
          alert(err.response.data.message);
        }
      } else {
        alert('本の追加に失敗しました。');
      }
      console.error('Failed to add book:', err);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="sticky top-0 z-10 bg-white/80 shadow-sm backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between py-4 px-4 sm:px-6 lg:px-8">
          <h1 className="text-xl font-bold text-gray-900">
            本を探す
          </h1>
          <Link href="/dashboard" className="text-sm font-medium text-indigo-600 hover:text-indigo-500">
            &lt; ダッシュボードへ戻る
          </Link>
        </div>
      </header>

      <main className="py-8">
        <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
          <div className="px-4 sm:px-0">
            <form onSubmit={handleSearch} className="flex gap-2">
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="タイトル、著者名、ISBN..."
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
              <button
                type="submit"
                disabled={isLoading}
                className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 disabled:opacity-50"
              >
                {isLoading ? '検索中...' : '検索'}
              </button>
            </form>
          </div>

          <div className="mt-8">
            {error && <p className="text-center text-red-500">{error}</p>}
            
            {isLoading && <p className="text-center text-gray-500">検索しています...</p>}

            {!isLoading && results.length === 0 && !error && (
              <div className="py-12 text-center">
                {isFetchingMyBooks ? (
                  <p className="text-gray-500">あなたの本棚を読み込み中...</p>
                ) : (
                  <p className="text-gray-500">検索結果はここに表示されます。</p>
                )}
              </div>
            )}

            {results.length > 0 && (
              <div className="overflow-hidden bg-white shadow sm:rounded-md">
                <ul role="list" className="divide-y divide-gray-200">
                  {results.map((book) => {
                    const isAdded = myBookIsbns.has(book.isbn) || addedBooks.has(book.isbn);
                    return (
                      <li key={book.isbn}>
                        <div className="flex items-center px-4 py-4 sm:px-6">
                          <div className="flex min-w-0 flex-1 items-center">
                            <div className="flex-shrink-0">
                              <Image
                                src={book.thumbnailUrl || '/placeholder-cover.svg'}
                                alt={`「${book.title}」の書影`}
                                width={48}
                                height={72}
                                className="h-18 w-12 rounded-sm object-cover"
                              />
                            </div>
                            <div className="min-w-0 flex-1 px-4 md:grid md:grid-cols-2 md:gap-4">
                              <div>
                                <p className="truncate text-sm font-medium text-indigo-600">{book.title}</p>
                                <p className="mt-2 flex items-center text-sm text-gray-500">
                                  <span className="truncate">{book.author || '著者不明'}</span>
                                </p>
                              </div>
                              <div className="hidden md:block">
                                <div>
                                  <p className="text-sm text-gray-900">
                                    出版社: {book.publisher || 'N/A'}
                                  </p>
                                  <p className="mt-2 text-sm text-gray-500">
                                    出版日: {book.publishedDate || 'N/A'}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                          <div>
                            <button
                              onClick={() => handleAddBook(book.isbn)}
                              disabled={isAdded}
                              className="inline-flex items-center rounded-full border border-transparent bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:bg-gray-400"
                            >
                              {isAdded ? '追加済み' : '追加'}
                            </button>
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
