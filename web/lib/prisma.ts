import { PrismaClient } from '@/lib/generated/prisma';

// Next.js の開発環境では、ホットリロードによって PrismaClient が
// 大量にインスタンス化されてしまうのを防ぐための常套句です。
// 参考: https://pris.ly/d/help/next-js-best-practices

declare global {
  // allow global `var` declarations
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

const prisma = global.prisma || new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  global.prisma = prisma;
}

export default prisma;
