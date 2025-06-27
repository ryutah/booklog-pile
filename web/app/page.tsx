'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import Image from 'next/image';

export default function HomePage() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading || isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <p>読み込み中...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 font-[family-name:var(--font-geist-sans)]">
      {/* Header */}
      <header className="absolute top-0 w-full py-5 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="flex items-center">
            <Image src="/placeholder-cover.svg" alt="Booklog Pile Logo" width={32} height={32} />
            <span className="ml-3 text-xl font-bold text-gray-900">Booklog Pile</span>
          </div>
          <div className="space-x-2">
            <Link href="/login" className="rounded-md px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100">
              ログイン
            </Link>
            <Link href="/register" className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700">
              新規登録
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex items-center justify-center pt-20">
        <div className="mx-auto max-w-7xl py-16 px-4 text-center sm:py-24 sm:px-6 lg:px-8">
          <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 sm:text-5xl md:text-6xl">
            <span className="block">「積読」、解消しませんか？</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-gray-500 sm:text-xl">
            Booklog Pileは、あなたの「読みたい」を「読んだ」に変えるためのSNS。<br />
            同じ本を読む仲間と一緒に、積読リストを片付けましょう。
          </p>
          <div className="mt-10">
            <Link href="/register" className="rounded-md bg-indigo-600 px-8 py-3 text-lg font-medium text-white shadow-lg transition-transform hover:scale-105 hover:bg-indigo-700">
              無料で始める
            </Link>
          </div>
        </div>
      </main>

      {/* Features Section */}
      <section className="bg-white py-20 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-extrabold text-gray-900">主な機能</h2>
            <p className="mx-auto mt-4 max-w-2xl text-md text-gray-500">
              読書がもっと楽しく、続くようになる機能を揃えました。
            </p>
          </div>
          <div className="mt-16 grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-3">
            <div className="text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-indigo-100 text-indigo-600">
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
              </div>
              <h3 className="mt-5 text-lg font-medium text-gray-900">かんたん蔵書登録</h3>
              <p className="mt-2 text-base text-gray-500">
                ISBNスキャンやキーワード検索で、読みたい本をすぐに自分の本棚に追加できます。
              </p>
            </div>
            <div className="text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-indigo-100 text-indigo-600">
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"></path></svg>
              </div>
              <h3 className="mt-5 text-lg font-medium text-gray-900">ステータス管理</h3>
              <p className="mt-2 text-base text-gray-500">
                「積読」「読書中」「読了」のステータスで、自分の読書状況を一目で把握できます。
              </p>
            </div>
            <div className="text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-indigo-100 text-indigo-600">
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
              </div>
              <h3 className="mt-5 text-lg font-medium text-gray-900">&quot;同志&quot;マッチング</h3>
              <p className="mt-2 text-base text-gray-500">
                同じ本を「積読」している他のユーザーと繋がり、モチベーションを高め合えます。
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-800">
        <div className="mx-auto max-w-7xl py-12 px-4 sm:px-6 lg:px-8">
          <p className="text-center text-base text-gray-400">
            &copy; 2025 Booklog Pile. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
