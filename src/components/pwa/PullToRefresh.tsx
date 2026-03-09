import { useState, useRef, useCallback, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { useIsPWA } from '@/hooks/useIsPWA';
import { useIsMobile } from '@/hooks/use-mobile';
import { useQueryClient } from '@tanstack/react-query';
import { cn } from '@/lib/utils';

const THRESHOLD = 80;
const MAX_PULL = 120;

export function PullToRefresh({ scrollRef }: { scrollRef: React.RefObject<HTMLElement | null> }) {
  const isPWA = useIsPWA();
  const isMobile = useIsMobile();
  const queryClient = useQueryClient();
  const [pullDistance, setPullDistance] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const startY = useRef(0);
  const pulling = useRef(false);

  const handleTouchStart = useCallback((e: TouchEvent) => {
    const el = scrollRef.current;
    if (!el || el.scrollTop > 5) return;
    startY.current = e.touches[0].clientY;
    pulling.current = true;
  }, [scrollRef]);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!pulling.current || refreshing) return;
    const diff = e.touches[0].clientY - startY.current;
    if (diff < 0) { pulling.current = false; return; }
    // Rubber-band effect
    const distance = Math.min(diff * 0.5, MAX_PULL);
    setPullDistance(distance);
    if (distance > 10) e.preventDefault();
  }, [refreshing]);

  const handleTouchEnd = useCallback(async () => {
    if (!pulling.current) return;
    pulling.current = false;
    if (pullDistance >= THRESHOLD && !refreshing) {
      setRefreshing(true);
      setPullDistance(THRESHOLD * 0.6);
      await queryClient.invalidateQueries();
      await new Promise(r => setTimeout(r, 600));
      setRefreshing(false);
    }
    setPullDistance(0);
  }, [pullDistance, refreshing, queryClient]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el || !isPWA || !isMobile) return;
    el.addEventListener('touchstart', handleTouchStart, { passive: true });
    el.addEventListener('touchmove', handleTouchMove, { passive: false });
    el.addEventListener('touchend', handleTouchEnd);
    return () => {
      el.removeEventListener('touchstart', handleTouchStart);
      el.removeEventListener('touchmove', handleTouchMove);
      el.removeEventListener('touchend', handleTouchEnd);
    };
  }, [scrollRef, isPWA, isMobile, handleTouchStart, handleTouchMove, handleTouchEnd]);

  if (!isPWA || !isMobile) return null;

  const progress = Math.min(pullDistance / THRESHOLD, 1);

  return (
    <div
      className={cn(
        'flex items-center justify-center overflow-hidden transition-[height] duration-200',
        refreshing && 'duration-300'
      )}
      style={{ height: pullDistance > 0 ? `${pullDistance}px` : 0 }}
    >
      <div
        className="text-muted-foreground"
        style={{
          opacity: progress,
          transform: `rotate(${progress * 360}deg) scale(${0.5 + progress * 0.5})`,
          transition: refreshing ? 'none' : 'transform 0.1s',
        }}
      >
        <Loader2 className={cn('h-5 w-5', refreshing && 'animate-spin')} />
      </div>
    </div>
  );
}
