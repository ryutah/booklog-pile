import { BooklogEntry } from '@/lib/types';
import { BookStatus } from '@/lib/generated/prisma';
import Image from 'next/image';
import Link from 'next/link';

interface BookCardProps {
  entry: BooklogEntry;
  onStatusChange: (entryId: string, newStatus: BookStatus) => void;
  onDelete: (entryId: string) => void;
}

const bookStatusLabels: Record<BookStatus, string> = {
  TSUNDOKU: '積読',
  READING: '読書中',
  FINISHED: '読了',
};

export default function BookCard({ entry, onStatusChange, onDelete }: BookCardProps) {
  const { book } = entry;

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    if (value === 'DELETE') {
      onDelete(entry.id);
      // Prevent the select from showing "--- 削除する ---" after click
      e.target.value = entry.status;
    } else {
      const newStatus = value as BookStatus;
      onStatusChange(entry.id, newStatus);
    }
  };

  return (
    <Link
      href={`/booklog/${entry.id}`}
      className="group relative flex flex-col overflow-hidden rounded-lg border bg-white shadow-sm transition-shadow hover:shadow-md"
    >
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
        <div className="mt-2">
          <select
            value={entry.status}
            onChange={handleSelectChange}
            className="w-full rounded-md border-gray-300 text-xs shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
            onClick={(e) => {
              e.preventDefault(); // Linkコンポーネントのナビゲーションを無効化
              e.stopPropagation(); // イベントのバブリングを停止
            }}
          >
            <option value="TSUNDOKU">{bookStatusLabels.TSUNDOKU}</option>
            <option value="READING">{bookStatusLabels.READING}</option>
            <option value="FINISHED">{bookStatusLabels.FINISHED}</option>
            <option disabled>──────────</option>
            <option value="DELETE" className="font-bold text-red-600">
              削除する
            </option>
          </select>
        </div>
      </div>
    </Link>
  );
}
