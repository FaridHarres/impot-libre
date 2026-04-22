import { useCallback, useRef } from 'react';

/**
 * Throttle slider updates via requestAnimationFrame for 60fps.
 * Prevents layout thrashing on rapid slider changes.
 */
export function useThrottledSlider(updateFn) {
  const rafRef = useRef(null);

  const throttledUpdate = useCallback((id, value) => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);

    rafRef.current = requestAnimationFrame(() => {
      updateFn(id, value);
    });
  }, [updateFn]);

  return throttledUpdate;
}

export default useThrottledSlider;
