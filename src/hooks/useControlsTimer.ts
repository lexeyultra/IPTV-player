import { useState, useEffect, useRef, useCallback } from "react";

export function useControlsTimer() {
  const [showPlayerControls, setShowPlayerControls] = useState<boolean>(true);
  const controlsTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const resetControlsTimer = useCallback(() => {
    setShowPlayerControls(true);
    if (controlsTimerRef.current) {
      clearTimeout(controlsTimerRef.current);
    }
    const isMobile = /iphone|ipad|ipod|android|blackberry|mini|windows\sphone|iemobile/i.test(navigator.userAgent.toLowerCase());
    controlsTimerRef.current = setTimeout(() => {
      setShowPlayerControls(false);
    }, isMobile ? 3000 : 15000);
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
