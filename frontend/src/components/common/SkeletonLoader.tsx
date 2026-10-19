import React from 'react';

export const SkeletonKpiGrid: React.FC = () => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full">
      {[1, 2, 3, 4].map((i) => (
        <div
          key={i}
          className="bg-[#FFFFFF] border border-[#DFE5EC] rounded-xl p-5 shadow-xs relative overflow-hidden h-36 flex flex-col justify-between"
        >
          <div className="flex justify-between items-center">
            <div className="h-4 w-28 bg-[#F0F3F8] rounded-sm skeleton-shimmer" />
            <div className="h-6 w-16 bg-[#F0F3F8] rounded-full skeleton-shimmer" />
          </div>
          <div className="space-y-2">
            <div className="h-8 w-24 bg-[#F0F3F8] rounded-md skeleton-shimmer" />
            <div className="h-3 w-36 bg-[#F0F3F8] rounded-sm skeleton-shimmer" />
          </div>
        </div>
      ))}
    </div>
  );
};

export const SkeletonTable: React.FC<{ rows?: number }> = ({ rows = 5 }) => {
  return (
    <div className="bg-[#FFFFFF] border border-[#DFE5EC] rounded-xl overflow-hidden shadow-xs w-full">
      <div className="p-4 border-b border-[#F0F3F8] flex justify-between items-center">
        <div className="h-5 w-40 bg-[#F0F3F8] rounded-sm skeleton-shimmer" />
        <div className="flex gap-2">
          <div className="h-8 w-24 bg-[#F0F3F8] rounded-lg skeleton-shimmer" />
          <div className="h-8 w-24 bg-[#F0F3F8] rounded-lg skeleton-shimmer" />
        </div>
      </div>
      <div className="divide-y divide-[#F0F3F8]">
        {Array.from({ length: rows }).map((_, idx) => (
          <div key={idx} className="p-4 flex items-center justify-between gap-4">
            <div className="h-4 w-32 bg-[#F0F3F8] rounded-sm skeleton-shimmer" />
            <div className="h-4 w-20 bg-[#F0F3F8] rounded-sm skeleton-shimmer" />
            <div className="h-4 w-24 bg-[#F0F3F8] rounded-sm skeleton-shimmer" />
            <div className="h-4 w-20 bg-[#F0F3F8] rounded-sm skeleton-shimmer" />
            <div className="h-4 w-16 bg-[#F0F3F8] rounded-sm skeleton-shimmer" />
          </div>
        ))}
      </div>
    </div>
  );
};

export const SkeletonChart: React.FC<{ height?: string }> = ({ height = 'h-72' }) => {
  return (
    <div
      className={`bg-[#FFFFFF] border border-[#DFE5EC] rounded-xl p-5 shadow-xs flex flex-col justify-between ${height}`}
    >
      <div className="flex justify-between items-center mb-4">
        <div className="h-5 w-48 bg-[#F0F3F8] rounded-sm skeleton-shimmer" />
        <div className="h-6 w-32 bg-[#F0F3F8] rounded-md skeleton-shimmer" />
      </div>
      <div className="flex-1 flex items-end gap-3 pt-6 pb-2 px-2">
        {[40, 65, 80, 50, 90, 75, 45, 60].map((h, idx) => (
          <div key={idx} className="flex-1 flex flex-col items-center gap-2">
            <div
              className="w-full bg-[#F0F3F8] rounded-t-md skeleton-shimmer"
              style={{ height: `${h}%` }}
            />
            <div className="h-3 w-8 bg-[#F0F3F8] rounded-xs skeleton-shimmer" />
          </div>
        ))}
      </div>
    </div>
  );
};

export const SkeletonCard: React.FC<{ height?: string }> = ({ height = 'h-48' }) => {
  return (
    <div
      className={`bg-[#FFFFFF] border border-[#DFE5EC] rounded-xl p-5 shadow-xs flex flex-col justify-between ${height}`}
    >
      <div className="h-5 w-32 bg-[#F0F3F8] rounded-sm skeleton-shimmer" />
      <div className="space-y-3">
        <div className="h-4 w-full bg-[#F0F3F8] rounded-sm skeleton-shimmer" />
        <div className="h-4 w-5/6 bg-[#F0F3F8] rounded-sm skeleton-shimmer" />
        <div className="h-4 w-4/6 bg-[#F0F3F8] rounded-sm skeleton-shimmer" />
      </div>
      <div className="h-8 w-28 bg-[#F0F3F8] rounded-lg skeleton-shimmer" />
    </div>
  );
};
