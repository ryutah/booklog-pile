import { BooklogEntry } from '@/lib/types';
import Image from 'next/image';

interface BookCardProps {
  entry: BooklogEntry;
}

export default function BookCard({ entry }: BookCardProps) {
  const { book } = entry;

  return (
    <div className="group relative flex flex-col overflow-hidden rounded-lg border bg-white shadow-sm transition-shadow hover:shadow-md">
      <div className="relative h-48 w-full bg-gray-100 sm:h-56">
        <Image
          src={book.thumbnailUrl || '/placeholder-cover.svg'}
          alt={`「${book.title}」の書影`}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw"
          className="object-cover"
        />
      </div>
      <div className="flex flex-1 flex-col p-3">
        <h3 className="text-sm font-bold leading-tight text-gray-900">
          {book.title}
        </h3>
        <p className="mt-1 flex-1 text-xs text-gray-600">{book.author}</p>
        {/* TODO: ステータス変更ドロップダウンをここに追加 */}
      </div>
    </div>
  );
}
