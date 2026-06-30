import { useState, useEffect, useRef, useCallback } from "react";

export function useControlsTimer() {
  const [showPlayerControls, setShowPlayerControls] = useState<boolean>(true);
  const controlsTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const resetControlsTimer = useCallback(() => {
    setShowPlayerControls(true);
    if (controlsTimerRef.current) {
      clearTimeout(controlsTimerRef.current);
    }
    controlsTimerRef.current = setTimeout(() => {
      setShowPlayerControls(false);
    }, 15000);
  }, []);

  useEffect(() => {
    return () => {
      if (controlsTimerRef.current) {
        clearTimeout(controlsTimerRef.current);
      }
    };
  }, []);

  return { showPlayerControls, setShowPlayerControls, resetControlsTimer, controlsTimerRef };
}
