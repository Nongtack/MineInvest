import { useEffect, useState, useCallback } from "react";

export function usePullToRefresh(onRefresh: () => Promise<void>, threshold = 80) {
  const [pullProgress, setPullProgress] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [startY, setStartY] = useState(0);
  const [isPulling, setIsPulling] = useState(false);

  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (window.scrollY === 0) {
      setStartY(e.touches[0].clientY);
      setIsPulling(true);
    }
  }, []);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!isPulling || isRefreshing) return;
    
    const y = e.touches[0].clientY;
    const deltaY = y - startY;

    if (deltaY > 0 && window.scrollY === 0) {
      // Add resistance to the pull
      const progress = Math.min(deltaY * 0.4, threshold + 20);
      setPullProgress(progress);
      
      // Prevent default scrolling when pulling
      if (e.cancelable) e.preventDefault();
    }
  }, [isPulling, isRefreshing, startY, threshold]);

  const handleTouchEnd = useCallback(async () => {
    if (!isPulling) return;
    setIsPulling(false);

    if (pullProgress >= threshold && !isRefreshing) {
      setIsRefreshing(true);
      setPullProgress(threshold); // Hold at threshold while refreshing
      
      try {
        await onRefresh();
      } finally {
        setIsRefreshing(false);
        setPullProgress(0);
      }
    } else {
      // Spring back
      setPullProgress(0);
    }
  }, [isPulling, pullProgress, threshold, isRefreshing, onRefresh]);

  useEffect(() => {
    document.addEventListener("touchstart", handleTouchStart, { passive: true });
    document.addEventListener("touchmove", handleTouchMove, { passive: false });
    document.addEventListener("touchend", handleTouchEnd, { passive: true });

    return () => {
      document.removeEventListener("touchstart", handleTouchStart);
      document.removeEventListener("touchmove", handleTouchMove);
      document.removeEventListener("touchend", handleTouchEnd);
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd]);

  return { pullProgress, isRefreshing };
}
