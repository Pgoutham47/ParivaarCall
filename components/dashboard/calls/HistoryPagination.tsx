import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";

export function HistoryPagination({
  page,
  hasNext,
  count,
  path,
}: {
  page: number;
  hasNext: boolean;
  count: number;
  path: string;
}) {
  if (page === 1 && !hasNext) return null;
  return (
    <nav
      aria-label="History pages"
      className="flex flex-wrap items-center justify-between gap-4 border-t border-sage-100 pt-5 text-sm"
    >
      <p className="text-sage-600">
        Page {page}
        <span className="mx-2 text-sage-300">·</span>
        {count} {count === 1 ? "result" : "results"}
      </p>
      <div className="flex items-center gap-2">
        {page > 1 ? (
          <Link
            className="focus-ring inline-flex min-h-11 items-center gap-2 rounded-lg border border-sage-200 bg-white px-3 font-medium text-sage-800 hover:bg-sage-50"
            href={`${path}?page=${page - 1}`}
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Newer
          </Link>
        ) : null}
        {hasNext ? (
          <Link
            className="focus-ring inline-flex min-h-11 items-center gap-2 rounded-lg border border-sage-200 bg-white px-3 font-medium text-sage-800 hover:bg-sage-50"
            href={`${path}?page=${page + 1}`}
          >
            Older
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        ) : null}
      </div>
    </nav>
  );
}
