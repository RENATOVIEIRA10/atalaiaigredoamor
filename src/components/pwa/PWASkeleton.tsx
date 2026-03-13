import { Skeleton } from '@/components/ui/skeleton';
import { SkeletonConcierge, SkeletonMetricCard } from '@/components/ui/skeletons';

/** Full-screen skeleton for PWA loading states */
export function PWAPageSkeleton() {
  return (
    <div className="space-y-4 p-1 animate-fade-in">
      {/* Hero skeleton */}
      <SkeletonConcierge />
      
      {/* Quick actions */}
      <div className="flex gap-3">
        <Skeleton className="h-12 flex-1 rounded-xl" />
        <Skeleton className="h-12 flex-1 rounded-xl" />
        <Skeleton className="h-12 flex-1 rounded-xl" />
      </div>

      {/* Cards */}
      <div className="grid grid-cols-2 gap-3">
        <SkeletonMetricCard accentGold />
        <SkeletonMetricCard />
      </div>
    </div>
  );
}

/** Card-level skeleton */
export function PWACardSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} className="h-20 w-full rounded-xl" />
      ))}
    </div>
  );
}
