import { useState, useEffect, useRef, useCallback } from "react";

export function useOsd() {
  const [osdMessage, setOsdMessage] = useState<string | null>(null);
  const osdTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showOsd = useCallback((msg: string) => {
    if (osdTimerRef.current) {
      clearTimeout(osdTimerRef.current);
    }
    setOsdMessage(msg);
    osdTimerRef.current = setTimeout(() => {
      setOsdMessage(null);
    }, 1500);
  }, []);

  useEffect(() => {
    return () => {
      if (osdTimerRef.current) {
        clearTimeout(osdTimerRef.current);
      }
    };
  }, []);

  return { osdMessage, showOsd };
}
