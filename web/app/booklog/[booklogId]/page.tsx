'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth, apiClient } from '@/contexts/AuthContext';
import { BooklogEntry, SafeUser, ReviewWithUser } from '@/lib/types';
import axios from 'axios';

export default function BooklogDetailPage() {
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const booklogId = params.booklogId as string;

  const [entry, setEntry] = useState<BooklogEntry | null>(null);
  const [comrades, setComrades] = useState<SafeUser[]>([]);
  const [reviews, setReviews] = useState<ReviewWithUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [newComment, setNewComment] = useState('');
  const [hasSpoiler, setHasSpoiler] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [visibleSpoilers, setVisibleSpoilers] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!isAuthLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthLoading, isAuthenticated, router]);

  useEffect(() => {
    if (isAuthenticated && booklogId) {
      const fetchBooklogData = async () => {
        setIsLoading(true);
        setError(null);
        try {
          const entryResponse = await apiClient.get(`/booklog/${booklogId}`);
          const fetchedEntry: BooklogEntry = entryResponse.data;
          setEntry(fetchedEntry);

          if (fetchedEntry) {
            const [comradesResponse, reviewsResponse] = await Promise.all([
              apiClient.get('/comrades/search', {
                params: { isbn: fetchedEntry.book.isbn },
              }),
              apiClient.get(`/booklog/${booklogId}/reviews`),
            ]);
            setComrades(comradesResponse.data);
            setReviews(reviewsResponse.data);
          }
        } catch (err) {
          console.error('Failed to fetch booklog data:', err);
          setError('蔵書情報の取得に失敗しました。');
        } finally {
          setIsLoading(false);
        }
      };
      fetchBooklogData();
    }
  }, [isAuthenticated, booklogId]);

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !entry) return;

    setIsSubmitting(true);
    try {
      const response = await apiClient.post(`/booklog/${booklogId}/reviews`, {
        comment: newComment,
        hasSpoiler,
      });
      setReviews([response.data, ...reviews]); // 新しい感想をリストの先頭に追加
      setNewComment('');
      setHasSpoiler(false);
    } catch (err: unknown) {
      console.error('Failed to post review:', err);
      if (axios.isAxiosError(err) && err.response) {
        alert(err.response.data.message || '感想の投稿に失敗しました。');
      } else {
        alert('感想の投稿に失敗しました。');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleSpoiler = (reviewId: string) => {
    setVisibleSpoilers((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(reviewId)) {
        newSet.delete(reviewId);
      } else {
        newSet.add(reviewId);
      }
      return newSet;
    });
  };

  if (isAuthLoading || isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <p>読み込み中...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-red-500">{error}</p>
          <Link href="/dashboard" className="mt-4 inline-block text-indigo-600 hover:underline">
            ダッシュボードへ戻る
          </Link>
        </div>
      </div>
    );
  }

  if (!entry) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <p>蔵書情報が見つかりません。</p>
      </div>
    );
  }

  const { book } = entry;

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="sticky top-0 z-10 bg-white/80 shadow-sm backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between py-4 px-4 sm:px-6 lg:px-8">
          <h1 className="truncate text-xl font-bold text-gray-900">
            {book.title}
          </h1>
          <Link href="/dashboard" className="flex-shrink-0 text-sm font-medium text-indigo-600 hover:text-indigo-500">
            &lt; ダッシュボードへ戻る
          </Link>
        </div>
      </header>

      <main className="py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Book Info Section */}
          <div className="overflow-hidden bg-white shadow sm:rounded-lg">
            <div className="p-6 sm:flex">
              <div className="flex-shrink-0 sm:w-48">
                <Image
                  src={book.thumbnailUrl || '/placeholder-cover.svg'}
                  alt={`「${book.title}」の書影`}
                  width={192}
                  height={288}
                  className="h-72 w-48 rounded-md object-cover shadow-lg"
                />
              </div>
              <div className="mt-6 sm:mt-0 sm:ml-6">
                <h2 className="text-2xl font-bold text-gray-900">{book.title}</h2>
                <p className="mt-1 text-md text-gray-600">{book.author || '著者不明'}</p>
                <div className="mt-4 space-y-1 text-sm text-gray-500">
                  <p>出版社: {book.publisher || 'N/A'}</p>
                  <p>出版日: {book.publishedDate || 'N/A'}</p>
                  <p>ページ数: {book.pageCount ? `${book.pageCount}ページ` : 'N/A'}</p>
                </div>
                <p className="mt-4 text-sm text-gray-700">{book.description || '概要はありません。'}</p>
              </div>
            </div>
          </div>

          {/* Comrades and Reviews Section */}
          <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-3">
            {/* Comrades List */}
            <div className="lg:col-span-1">
              <div className="bg-white p-6 shadow sm:rounded-lg">
                <h3 className="text-lg font-medium text-gray-900">&quot;同志&quot;リスト</h3>
                <p className="mt-2 text-sm text-gray-500">
                  この本を「積読」している他のユーザーです。
                </p>
                <div className="mt-4">
                  {comrades.length > 0 ? (
                    <ul className="space-y-3">
                      {comrades.map((comrade) => (
                        <li key={comrade.id} className="flex items-center space-x-3">
                          <div className="flex-shrink-0">
                            <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-gray-200">
                              <span className="text-sm font-medium leading-none text-gray-600">
                                {comrade.username.charAt(0).toUpperCase()}
                              </span>
                            </span>
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium text-gray-900">
                              {comrade.username}
                            </p>
                          </div>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="rounded-lg border-2 border-dashed border-gray-200 p-4 text-center">
                      <p className="text-sm text-gray-400">
                        まだ誰もこの本を積んでいません。
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Reviews Section */}
            <div className="space-y-8 lg:col-span-2">
              {/* Review Form */}
              {entry.status === 'FINISHED' && (
                <div className="bg-white p-6 shadow sm:rounded-lg">
                  <h3 className="text-lg font-medium text-gray-900">感想を投稿する</h3>
                  <form onSubmit={handleReviewSubmit} className="mt-4 space-y-4">
                    <div>
                      <textarea
                        rows={4}
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        className="block w-full rounded-md border-gray-300 text-gray-900 placeholder-gray-900 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        placeholder="感想を書きましょう..."
                        required
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-start">
                        <div className="flex h-5 items-center">
                          <input
                            id="hasSpoiler"
                            name="hasSpoiler"
                            type="checkbox"
                            checked={hasSpoiler}
                            onChange={(e) => setHasSpoiler(e.target.checked)}
                            className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                          />
                        </div>
                        <div className="ml-3 text-sm">
                          <label htmlFor="hasSpoiler" className="font-medium text-gray-700">
                            ネタバレを含む
                          </label>
                        </div>
                      </div>
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50"
                      >
                        {isSubmitting ? '投稿中...' : '投稿する'}
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Review Timeline */}
              <div className="bg-white p-6 shadow sm:rounded-lg">
                <h3 className="text-lg font-medium text-gray-900">感想タイムライン</h3>
                <div className="mt-4">
                  {reviews.length > 0 ? (
                    <ul className="space-y-6">
                      {reviews.map((review) => (
                        <li key={review.id} className="flex space-x-4">
                          <div className="flex-shrink-0">
                            <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-gray-200">
                              <span className="text-md font-medium leading-none text-gray-600">
                                {review.user.username.charAt(0).toUpperCase()}
                              </span>
                            </span>
                          </div>
                          <div className="flex-1">
                            <div className="flex items-baseline justify-between">
                              <p className="text-sm font-medium text-gray-900">
                                {review.user.username}
                              </p>
                              <p className="text-xs text-gray-500">
                                {new Date(review.createdAt).toLocaleString('ja-JP')}
                              </p>
                            </div>
                            <div className="mt-2 text-sm text-gray-700">
                              {review.hasSpoiler && !visibleSpoilers.has(review.id) ? (
                                <button
                                  onClick={() => toggleSpoiler(review.id)}
                                  className="rounded-md bg-gray-100 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200"
                                >
                                  ネタバレを含む感想です (クリックで表示)
                                </button>
                              ) : (
                                <p className="whitespace-pre-wrap">{review.comment}</p>
                              )}
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="rounded-lg border-2 border-dashed border-gray-200 p-8 text-center">
                      <p className="text-sm text-gray-400">まだ感想はありません。</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
