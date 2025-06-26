'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { apiClient } from '@/contexts/AuthContext';
import { BookStatus } from '@/lib/generated/prisma';
import { BooklogEntry } from '@/lib/types';
import BookCard from '@/components/book-card';

export default function DashboardPage() {
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<BookStatus>('積読');
  const [booklog, setBooklog] = useState<BooklogEntry[]>([]);
  const [isFetchingBooks, setIsFetchingBooks] = useState(true);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, isLoading, router]);

  useEffect(() => {
    if (isAuthenticated) {
      const fetchBooklog = async () => {
        setIsFetchingBooks(true);
        try {
          const response = await apiClient.get('/booklog');
          setBooklog(response.data);
        } catch (error) {
          console.error('Failed to fetch booklog:', error);
        } finally {
          setIsFetchingBooks(false);
        }
      };
      fetchBooklog();
    }
  }, [isAuthenticated]);

  const handleStatusChange = async (entryId: string, newStatus: BookStatus) => {
    // Optimistic UI update
    const originalBooklog = [...booklog];
    const updatedBooklog = booklog.map((entry) =>
      entry.id === entryId ? { ...entry, status: newStatus } : entry
    );
    setBooklog(updatedBooklog);

    try {
      await apiClient.patch(`/booklog/${entryId}`, { status: newStatus });
      // The state is already updated optimistically.
    } catch (error) {
      console.error('Failed to update status:', error);
      // If the API call fails, revert to the original state
      setBooklog(originalBooklog);
      alert('ステータスの更新に失敗しました。');
    }
  };

  const handleDelete = async (entryId: string) => {
    if (!window.confirm('この本を本棚から削除しますか？\nこの操作は元に戻せません。')) {
      return;
    }

    const originalBooklog = [...booklog];
    const updatedBooklog = booklog.filter((entry) => entry.id !== entryId);
    setBooklog(updatedBooklog);

    try {
      await apiClient.delete(`/booklog/${entryId}`);
      // State is already updated optimistically.
    } catch (error) {
      console.error('Failed to delete book:', error);
      setBooklog(originalBooklog);
      alert('本の削除に失敗しました。');
    }
  };

  const filteredBooklog = useMemo(() => {
    return booklog.filter((entry) => entry.status === activeTab);
  }, [booklog, activeTab]);

  const TABS: { label: string; status: BookStatus }[] = [
    { label: '積読', status: '積読' },
    { label: '読書中', status: '読書中' },
    { label: '読了', status: '読了' },
  ];

  const getCountForStatus = (status: BookStatus) => {
    return booklog.filter((entry) => entry.status === status).length;
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <p>読み込み中...</p>
      </div>
    );
  }

  return isAuthenticated && user ? (
    <div className="min-h-screen bg-gray-50">
      <header className="sticky top-0 z-10 bg-white/80 shadow-sm backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between py-4 px-4 sm:px-6 lg:px-8">
          <h1 className="text-xl font-bold text-gray-900">
            Booklog Pile
          </h1>
          <div className="flex items-center space-x-4">
            <Link href="/stats" className="hidden text-sm font-medium text-gray-500 hover:text-gray-700 sm:block">
              読書ログ
            </Link>
            <button
              onClick={logout}
              className="rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white shadow-sm hover:bg-indigo-700"
            >
              ログアウト
            </button>
          </div>
        </div>
      </header>
      <main className="py-8">
        <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
          <div className="px-4 sm:px-0">
            <h2 className="text-2xl font-bold leading-tight text-gray-900">
              {user.username}さんの本棚
            </h2>
          </div>

          <div className="mt-6">
            <div className="border-b border-gray-200">
              <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                {TABS.map((tab) => (
                  <button
                    key={tab.status}
                    onClick={() => setActiveTab(tab.status)}
                    className={`${
                      activeTab === tab.status
                        ? 'border-indigo-500 text-indigo-600'
                        : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                    } whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium`}
                  >
                    {tab.label}
                    <span className="ml-2 inline-block rounded-full bg-gray-200 px-2.5 py-0.5 text-xs font-medium text-gray-800">
                      {getCountForStatus(tab.status)}
                    </span>
                  </button>
                ))}
              </nav>
            </div>
          </div>

          <div className="mt-8">
            {isFetchingBooks ? (
              <div className="py-12 text-center">
                <p className="text-gray-500">本棚を読み込んでいます...</p>
              </div>
            ) : filteredBooklog.length > 0 ? (
              <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
                {filteredBooklog.map((entry) => (
                  <BookCard
                    key={entry.id}
                    entry={entry}
                    onStatusChange={handleStatusChange}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            ) : (
              <div className="rounded-lg border-2 border-dashed border-gray-300 py-12 text-center">
                <h3 className="text-sm font-medium text-gray-900">本がありません</h3>
                <p className="mt-1 text-sm text-gray-500">
                  右下の「+」ボタンから新しい本を追加しましょう。
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
      
      <Link href="/search" className="fixed bottom-8 right-8 flex h-14 w-14 items-center justify-center rounded-full bg-indigo-600 text-white shadow-lg transition-transform hover:scale-110 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
        </svg>
        <span className="sr-only">本を追加する</span>
      </Link>
    </div>
  ) : null;
}
