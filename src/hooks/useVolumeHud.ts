import { useState, useEffect, useRef, useCallback } from "react";

export function useVolumeHud() {
  const [showVolumeHud, setShowVolumeHud] = useState<boolean>(false);
  const volumeHudTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isFirstVolumeRender = useRef<boolean>(true);

  const triggerVolumeHud = useCallback(() => {
    setShowVolumeHud(true);
    if (volumeHudTimeoutRef.current) {
      clearTimeout(volumeHudTimeoutRef.current);
    }
    volumeHudTimeoutRef.current = setTimeout(() => {
      setShowVolumeHud(false);
    }, 2000);
  }, []);

  useEffect(() => {
    return () => {
      if (volumeHudTimeoutRef.current) {
        clearTimeout(volumeHudTimeoutRef.current);
      }
    };
  }, []);

  return { showVolumeHud, triggerVolumeHud, isFirstVolumeRender };
}
