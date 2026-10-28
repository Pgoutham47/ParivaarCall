export default function Loading() {
  return (
    <div role="status" aria-live="polite" className="space-y-7">
      <span className="sr-only">Loading your care dashboard…</span>
      <div aria-hidden="true" className="space-y-3">
        <div className="h-3 w-28 animate-pulse rounded bg-sage-100" />
        <div className="h-8 w-3/4 max-w-sm animate-pulse rounded bg-sage-100" />
        <div className="h-4 w-2/3 max-w-md animate-pulse rounded bg-sage-100" />
      </div>
      <div aria-hidden="true" className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        {[0, 1, 2, 3].map((index) => (
          <div
            key={index}
            className="h-36 animate-pulse rounded-2xl border border-sage-100 bg-white"
          />
        ))}
      </div>
      <div
        aria-hidden="true"
        className="rounded-2xl border border-sage-100 bg-white p-6"
      >
        <div className="mb-6 h-5 w-40 animate-pulse rounded bg-sage-100" />
        {[0, 1, 2].map((index) => (
          <div key={index} className="flex gap-4 border-t border-sage-100 py-6">
            <div className="h-5 w-16 animate-pulse rounded bg-sage-100" />
            <div className="h-5 w-1/2 animate-pulse rounded bg-sage-100" />
          </div>
        ))}
      </div>
    </div>
  );
}
