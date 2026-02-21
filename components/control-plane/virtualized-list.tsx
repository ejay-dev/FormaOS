'use client';

import { useMemo, useState } from 'react';

type VirtualizedListProps<T> = {
  items: T[];
  itemHeight: number;
  height: number;
  overscan?: number;
  renderItem: (item: T, index: number) => React.ReactNode;
  getKey: (item: T, index: number) => string;
};

export function VirtualizedList<T>({
  items,
  itemHeight,
  height,
  overscan = 6,
  renderItem,
  getKey,
}: VirtualizedListProps<T>) {
  const [scrollTop, setScrollTop] = useState(0);

  const totalHeight = items.length * itemHeight;

  const { startIndex, endIndex } = useMemo(() => {
    const start = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
    const visibleCount = Math.ceil(height / itemHeight) + overscan * 2;
    const end = Math.min(items.length, start + visibleCount);
    return { startIndex: start, endIndex: end };
  }, [height, itemHeight, items.length, overscan, scrollTop]);

  const visibleItems = items.slice(startIndex, endIndex);

  return (
    <div
      className="overflow-y-auto"
      style={{ height }}
      onScroll={(event) => setScrollTop(event.currentTarget.scrollTop)}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        <div style={{ transform: `translateY(${startIndex * itemHeight}px)` }}>
          {visibleItems.map((item, localIndex) => {
            const absoluteIndex = startIndex + localIndex;
            return (
              <div key={getKey(item, absoluteIndex)} style={{ height: itemHeight }}>
                {renderItem(item, absoluteIndex)}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
