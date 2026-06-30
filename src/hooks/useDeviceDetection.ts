import { useState, useEffect, useRef } from "react";

export function useDeviceDetection(showOsd: (msg: string) => void) {
  const [isTvMode, setIsTvMode] = useState<boolean>(false);
  const [deviceType, setDeviceType] = useState<"ТВ" | "Смартфон" | "ПК">("ПК");
  const [orientation, setOrientation] = useState<"portrait" | "landscape">("portrait");
  const [showLandscapeSidebar, setShowLandscapeSidebar] = useState<boolean>(false);
  const lastOrientationRef = useRef<"portrait" | "landscape" | null>(null);

  useEffect(() => {
    const detectDeviceAndOrientation = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      const isLandscape = width > height;
      const currentOrientation = isLandscape ? "landscape" : "portrait";

      setOrientation(currentOrientation);

      const ua = navigator.userAgent.toLowerCase();
      const isTvUA = ua.includes("tv") || ua.includes("smarttv") || ua.includes("googletv") || ua.includes("appletv") || ua.includes("tizen") || ua.includes("webos") || ua.includes("hbbtv") || ua.includes("playstation") || ua.includes("xbox") || ua.includes("roku") || ua.includes("bravia") || ua.includes("viera");
      const isMobileUA = /iphone|ipad|ipod|android|blackberry|mini|windows\sphone|iemobile/i.test(ua);

      if (isTvUA) {
        setDeviceType("ТВ");
        setIsTvMode(true);
      } else if (isMobileUA) {
        setDeviceType("Смартфон");
        setIsTvMode(false);
      } else {
        setDeviceType("ПК");
      }

      if (lastOrientationRef.current !== currentOrientation) {
        if (currentOrientation === "landscape") {
          if (isMobileUA) {
            setShowLandscapeSidebar(false);
            showOsd("📱 Мобильный полноэкранный режим");
          } else {
            setShowLandscapeSidebar(true);
            showOsd("🔄 Поворот экрана: Горизонтальный режим");
          }
        } else if (lastOrientationRef.current !== null) {
          setShowLandscapeSidebar(false);
          if (isMobileUA) {
            showOsd("📱 Восстановлен интерфейс");
          } else {
            showOsd("🔄 Поворот экрана: Портретный режим");
          }
        }
        lastOrientationRef.current = currentOrientation;
      }
    };

    detectDeviceAndOrientation();

    window.addEventListener("resize", detectDeviceAndOrientation);
    window.addEventListener("orientationchange", detectDeviceAndOrientation);

    return () => {
      window.removeEventListener("resize", detectDeviceAndOrientation);
      window.removeEventListener("orientationchange", detectDeviceAndOrientation);
    };
  }, [showOsd]);

  return {
    isTvMode,
    setIsTvMode,
    deviceType,
    orientation,
    showLandscapeSidebar,
    setShowLandscapeSidebar,
  };
}
