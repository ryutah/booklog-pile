-- CreateEnum
CREATE TYPE "BookStatus" AS ENUM ('積読', '読書中', '読了');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "books" (
    "isbn" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "author" TEXT,
    "publisher" TEXT,
    "published_date" TEXT,
    "description" TEXT,
    "page_count" INTEGER,
    "thumbnail_url" TEXT,

    CONSTRAINT "books_pkey" PRIMARY KEY ("isbn")
);

-- CreateTable
CREATE TABLE "booklog_entries" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "book_isbn" TEXT NOT NULL,
    "status" "BookStatus" NOT NULL,
    "added_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "booklog_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reviews" (
    "id" TEXT NOT NULL,
    "booklog_entry_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "comment" TEXT NOT NULL,
    "has_spoiler" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reviews_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "booklog_entries_user_id_book_isbn_key" ON "booklog_entries"("user_id", "book_isbn");

-- AddForeignKey
ALTER TABLE "booklog_entries" ADD CONSTRAINT "booklog_entries_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booklog_entries" ADD CONSTRAINT "booklog_entries_book_isbn_fkey" FOREIGN KEY ("book_isbn") REFERENCES "books"("isbn") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_booklog_entry_id_fkey" FOREIGN KEY ("booklog_entry_id") REFERENCES "booklog_entries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
