import type { Book, BooklogEntry as PrismaBooklogEntry } from '@prisma/client';

/**
 * PrismaのBooklogEntry型に、リレーション先のBookの型情報を含めた拡張型
 */
export interface BooklogEntry extends PrismaBooklogEntry {
  book: Book;
}
