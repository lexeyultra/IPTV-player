import { useState, useEffect, useRef, useCallback } from "react";

export function useFullscreen() {
  const [isPlayerFullscreen, setIsPlayerFullscreen] = useState<boolean>(false);
  const playerContainerRef = useRef<HTMLDivElement | null>(null);

  const toggleFullscreen = useCallback(() => {
    const container = playerContainerRef.current;
    if (!container) return;

    if (!isPlayerFullscreen) {
      setIsPlayerFullscreen(true);
      if (container.requestFullscreen) {
        container.requestFullscreen().catch(err => {
          console.log("Browser fullscreen blocked/not supported, using inline fallback.", err);
        });
      }
    } else {
      setIsPlayerFullscreen(false);
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(err => console.log(err));
      }
    }
  }, [isPlayerFullscreen]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsPlayerFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []);

  return { isPlayerFullscreen, setIsPlayerFullscreen, playerContainerRef, toggleFullscreen };
}
