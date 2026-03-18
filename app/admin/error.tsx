'use client';

export default function AdminError({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <div className="p-6">
      <div className="rounded-lg border border-red-800/40 bg-red-950/30 p-5">
        <h2 className="text-lg font-semibold text-red-200">Admin page failed</h2>
        <p className="mt-2 text-sm text-red-100/80">{error.message}</p>
        <button
          onClick={reset}
          className="mt-4 rounded-md border border-red-700/60 bg-red-900/30 px-3 py-1.5 text-sm text-red-100 hover:bg-red-900/40"
        >
          Retry
        </button>
      </div>
    </div>
  );
}
