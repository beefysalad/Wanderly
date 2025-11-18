import { useState } from "react";

/**
 * Custom hook to manage navigation loading state
 * Provides consistent loading state management for navigation actions
 */
export function useNavigationLoading() {
  const [isNavigating, setIsNavigating] = useState(false);

  const startNavigation = () => setIsNavigating(true);
  const stopNavigation = () => setIsNavigating(false);

  const withNavigation = async <T>(
    action: () => Promise<T>,
    onComplete?: () => void
  ): Promise<T> => {
    setIsNavigating(true);
    try {
      const result = await action();
      if (onComplete) {
        onComplete();
      }
      return result;
    } finally {
      // Keep loading state for a brief moment to show feedback
      setTimeout(() => setIsNavigating(false), 300);
    }
  };

  return {
    isNavigating,
    setIsNavigating,
    startNavigation,
    stopNavigation,
    withNavigation,
  };
}
