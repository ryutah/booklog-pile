import type { Book, BooklogEntry as PrismaBooklogEntry, User } from '@prisma/client';

/**
 * PrismaのBooklogEntry型に、リレーション先のBookの型情報を含めた拡張型
 */
export interface BooklogEntry extends PrismaBooklogEntry {
  book: Book;
}

/**
 * パスワードハッシュなど、機密情報を含まないユーザー情報の型
 */
export type SafeUser = Omit<User, 'passwordHash' | 'email'>;
