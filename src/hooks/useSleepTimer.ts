import { useState, useEffect } from "react";

export function useSleepTimer(
  setIsPlaying: (v: boolean | ((prev: boolean) => boolean)) => void,
  addParserLogs: (logs: string[]) => void
) {
  const [sleepTimerMinutes, setSleepTimerMinutes] = useState<number>(0);
  const [sleepTimerSecondsLeft, setSleepTimerSecondsLeft] = useState<number | null>(null);

  useEffect(() => {
    if (sleepTimerSecondsLeft === null) return;
    if (sleepTimerSecondsLeft <= 0) {
      setSleepTimerSecondsLeft(null);
      setSleepTimerMinutes(0);
      setIsPlaying(false);
      addParserLogs(["⏱️ Сработал таймер сна! Воспроизведение остановлено."]);
      return;
    }
    const timer = setTimeout(() => {
      setSleepTimerSecondsLeft(prev => (prev !== null ? prev - 1 : null));
    }, 1000);
    return () => clearTimeout(timer);
  }, [sleepTimerSecondsLeft, setIsPlaying, addParserLogs]);

  return {
    sleepTimerMinutes,
    setSleepTimerMinutes,
    sleepTimerSecondsLeft,
    setSleepTimerSecondsLeft,
  };
}
