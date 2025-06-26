'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth, apiClient } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface ReadingStats {
  monthlyReadCount: number;
  monthlyPageCount: number;
  history: { month: string; count: number }[];
}

export default function StatsPage() {
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<ReadingStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthLoading, isAuthenticated, router]);

  useEffect(() => {
    if (isAuthenticated) {
      const fetchStats = async () => {
        setIsLoading(true);
        try {
          const response = await apiClient.get('/stats/me');
          setStats(response.data);
        } catch (err) {
          console.error('Failed to fetch stats:', err);
          setError('統計データの取得に失敗しました。');
        } finally {
          setIsLoading(false);
        }
      };
      fetchStats();
    }
  }, [isAuthenticated]);

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

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="sticky top-0 z-10 bg-white/80 shadow-sm backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between py-4 px-4 sm:px-6 lg:px-8">
          <h1 className="text-xl font-bold text-gray-900">読書ログ</h1>
          <Link href="/dashboard" className="flex-shrink-0 text-sm font-medium text-indigo-600 hover:text-indigo-500">
            &lt; ダッシュボードへ戻る
          </Link>
        </div>
      </header>

      <main className="py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900">あなたの読書ログ</h2>
          </div>

          {stats ? (
            <div className="mt-8 space-y-8">
              <dl className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <div className="overflow-hidden rounded-lg bg-white px-4 py-5 shadow sm:p-6">
                  <dt className="truncate text-sm font-medium text-gray-500">今月の読了冊数</dt>
                  <dd className="mt-1 text-3xl font-semibold tracking-tight text-gray-900">
                    {stats.monthlyReadCount} 冊
                  </dd>
                </div>
                <div className="overflow-hidden rounded-lg bg-white px-4 py-5 shadow sm:p-6">
                  <dt className="truncate text-sm font-medium text-gray-500">今月の総ページ数</dt>
                  <dd className="mt-1 text-3xl font-semibold tracking-tight text-gray-900">
                    {stats.monthlyPageCount.toLocaleString()} ページ
                  </dd>
                </div>
              </dl>

              <div className="overflow-hidden rounded-lg bg-white shadow">
                <div className="px-4 py-5 sm:p-6">
                  <h3 className="text-base font-semibold leading-6 text-gray-900">月別読了数（過去12ヶ月）</h3>
                  <div className="mt-6" style={{ width: '100%', height: 350 }}>
                    <ResponsiveContainer>
                      <BarChart
                        data={stats.history}
                        margin={{
                          top: 5,
                          right: 20,
                          left: -10,
                          bottom: 5,
                        }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis
                          dataKey="month"
                          tickFormatter={(tick) => {
                            const parts = tick.split('-');
                            return parts.length === 2 ? `${parseInt(parts[1], 10)}月` : tick;
                          }}
                          fontSize={12}
                        />
                        <YAxis allowDecimals={false} />
                        <Tooltip
                          formatter={(value) => [`${value}冊`, '読了数']}
                          labelFormatter={(label) => {
                            const parts = label.split('-');
                            return parts.length === 2 ? `${parts[0]}年${parseInt(parts[1], 10)}月` : label;
                          }}
                        />
                        <Legend verticalAlign="top" height={36} />
                        <Bar dataKey="count" fill="#818cf8" name="読了数" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <p className="mt-8 text-center text-gray-500">統計データを表示できませんでした。</p>
          )}
        </div>
      </main>
    </div>
  );
}
