# 積読解消SNS「Booklog Pile」

このリポジトリは、積読解消SNS「Booklog Pile」のフロントエンドおよびバックエンド（Next.js API Routes）の実装です。

## 概要

「読もうと思って買ったのに、読まずに積んである本」…多くの人が抱えるこの「積読」を解消し、読書体験を共有するためのソーシャルネットワークサービスです。「積読」という共通の悩みを持つ人同士をつなげ、励まし合いながら読書を進めるモチベーションを育みます。

## 主要機能

- **ユーザー認証**: JWTを使用したセキュアなログイン・新規登録機能。
- **書籍検索**: Google Books APIを利用したキーワード・ISBNでの書籍検索。
- **蔵書管理**: 登録した本を「積読」「読書中」「読了」のステータスで管理。
- **感想投稿**: 読了した本に対して、ネタバレに配慮した感想を投稿・閲覧。
- **"同志"検索**: 同じ本を「積読」している他のユーザーを検索。
- **読書統計**: 月ごとの読了冊数などをグラフで可視化。

## 技術スタック

- **フレームワーク**: [Next.js](https://nextjs.org/) (App Router)
- **言語**: [TypeScript](https://www.typescriptlang.org/)
- **UI**: [React](https://react.dev/), [Tailwind CSS](https://tailwindcss.com/)
- **データベース**: [SQLite](https://www.sqlite.org/)
- **ORM**: [Prisma](https://www.prisma.io/)
- **APIクライアント**: [Axios](https://axios-http.com/)
- **状態管理**: React Context API
- **グラフ描画**: [Recharts](https://recharts.org/)
- **パッケージ管理**: [pnpm](https://pnpm.io/)

## ローカル開発環境のセットアップ

### 前提条件

- [Node.js](https://nodejs.org/) (v18.18.0 以上)
- [pnpm](https://pnpm.io/installation)

### 手順

1.  **リポジトリをクローンします。**

    ```bash
    git clone <repository-url>
    cd web
    ```

2.  **依存パッケージをインストールします。**

    ```bash
    pnpm install
    ```

3.  **環境変数を設定します。**
    `.env` ファイルをプロジェクトルート（`web/` ディレクトリ）に作成し、以下の内容を記述します。

    ```env
    # SQLite database file path
    DATABASE_URL="file:./dev.db"

    # JWT secret key for authentication
    # Generate with: openssl rand -hex 32
    JWT_SECRET="YOUR_SECRET_KEY_HERE"
    ```

    **Note:** `JWT_SECRET` は以下のコマンドで生成したランダムな文字列に置き換えてください。

    ```bash
    openssl rand -hex 32
    ```

4.  **(初回のみ) 既存のマイグレーションを削除します。**
    PostgreSQLから切り替えるため、古いマイグレーションファイルを削除します。

    ```bash
    rm -rf prisma/migrations
    ```

5.  **データベースのマイグレーションを実行します。**
    これにより、Prismaスキーマに基づいて`prisma/dev.db`というSQLiteデータベースファイルが作成されます。

    ```bash
    pnpm exec prisma migrate dev --name init
    ```

6.  **開発サーバーを起動します。**

    ```bash
    pnpm dev
    ```

7.  ブラウザで [http://localhost:3000](http://localhost:3000) を開きます。

## ディレクトリ構造

```
web/
├── app/                # Next.js App Router
│   ├── api/            # API Routes
│   ├── (main)/         # 認証後ページ (Route Group)
│   │   ├── dashboard/
│   │   ├── search/
│   │   ├── booklog/[booklogId]/
│   │   └── stats/
│   ├── login/          # ログインページ
│   ├── register/       # 新規登録ページ
│   └── page.tsx        # ランディングページ
├── components/         # 共通Reactコンポーネント
├── contexts/           # React Context (認証状態など)
├── lib/                # ヘルパー関数、Prismaクライアント、型定義
│   ├── generated/      # Prisma Client (自動生成)
│   ├── auth.ts
│   ├── prisma.ts
│   └── types.ts
├── prisma/             # Prismaスキーマとマイグレーション
│   ├── dev.db          # SQLiteデータベースファイル
│   └── schema.prisma
├── public/             # 静的ファイル (画像など)
├── .env                # (ローカル用) 環境変数ファイル
├── next.config.ts      # Next.js設定ファイル
└── package.json
```

## 実装済みAPIエンドポイント

- `POST /api/auth/register`: 新規ユーザー登録
- `POST /api/auth/login`: ログイン
- `GET /api/users/me`: 認証済みユーザー情報取得
- `GET /api/books/search`: 書籍検索
- `GET /api/booklog`: 蔵書リスト取得
- `POST /api/booklog`: 蔵書リストに本を追加
- `GET /api/booklog/[booklogId]`: 個別の蔵書情報取得
- `PATCH /api/booklog/[booklogId]`: 蔵書ステータス更新
- `DELETE /api/booklog/[booklogId]`: 蔵書削除
- `GET /api/booklog/[booklogId]/reviews`: 感想一覧取得
- `POST /api/booklog/[booklogId]/reviews`: 感想を投稿
- `GET /api/comrades/search`: "同志"を検索
- `GET /api/stats/me`: 読書統計を取得
