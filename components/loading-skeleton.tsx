export function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="card p-6">
            <div className="shimmer h-12 w-12 rounded-lg mb-4" />
            <div className="shimmer h-8 w-20 rounded mb-2" />
            <div className="shimmer h-4 w-32 rounded" />
          </div>
        ))}
      </div>

      <div className="card p-6">
        <div className="shimmer h-6 w-48 rounded mb-6" />
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="shimmer h-16 rounded-lg" />
          ))}
        </div>
      </div>
    </div>
  );
}