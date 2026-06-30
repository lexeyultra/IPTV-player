import { useState, useRef, useCallback } from "react";
import type { Channel } from "../samplePlaylist";

export function useChannelScanner(
  showOsd: (msg: string) => void,
  addParserLogs: (logs: string[]) => void,
  setChannels: (channels: Channel[] | ((prev: Channel[]) => Channel[])) => void,
  setActiveChannel: (ch: Channel | null) => void,
  setSelectedCategory: (cat: string) => void,
) {
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [scanProgress, setScanProgress] = useState<{ current: number; total: number; availableCount: number } | null>(null);
  const [scanCanceled, setScanCanceled] = useState<boolean>(false);
  const scanCanceledRef = useRef<boolean>(false);
  const activeChannelRef = useRef<Channel | null>(null);

  const syncActiveChannel = useCallback((ch: Channel | null) => {
    activeChannelRef.current = ch;
  }, []);

  const cancelScan = useCallback(() => {
    scanCanceledRef.current = true;
    setScanCanceled(true);
    showOsd("🛑 Сканирование отменено");
  }, [showOsd]);

  const scanChannels = useCallback(async (channelsToScan: Channel[]) => {
    if (channelsToScan.length === 0) return;
    setIsScanning(true);
    setScanCanceled(false);
    scanCanceledRef.current = false;
    setScanProgress({ current: 0, total: channelsToScan.length, availableCount: 0 });
    addParserLogs([`🔍 Запущено сканирование ${channelsToScan.length} каналов на доступность...`]);

    const originalChannels = [...channelsToScan];
    const scannedChannels: Channel[] = [];
    const batchSize = 6;

    for (let i = 0; i < channelsToScan.length; i += batchSize) {
      if (scanCanceledRef.current) {
        addParserLogs([`🛑 Сканирование отменено пользователем.`]);
        break;
      }

      const batch = channelsToScan.slice(i, i + batchSize);
      const results = await Promise.all(
        batch.map(async (ch) => {
          try {
            const resp = await fetch(`/api/check-stream?url=${encodeURIComponent(ch.url)}`);
            if (resp.ok) {
              const data = await resp.json();
              return { ch, available: !!data.available };
            }
          } catch (e) {
            console.error("Error checking stream", ch.url, e);
          }
          return { ch, available: false };
        })
      );

      const availableBatch = results.filter(r => r.available).map(r => r.ch);
      scannedChannels.push(...availableBatch);

      setScanProgress(prev => {
        if (!prev) return null;
        const nextCurrent = Math.min(prev.current + batch.length, prev.total);
        return {
          current: nextCurrent,
          total: prev.total,
          availableCount: prev.availableCount + availableBatch.length
        };
      });
    }

    setIsScanning(false);
    setScanProgress(null);

    if (scanCanceledRef.current) {
      setChannels(originalChannels);
      showOsd("🛑 Сканирование отменено, список каналов восстановлен");
    } else if (scannedChannels.length === 0) {
      showOsd("⚠️ Ни один канал не прошел проверку доступности!");
      addParserLogs([`⚠️ Ни один канал из проверенных не доступен.`]);
    } else {
      showOsd(`✅ Доступно ${scannedChannels.length} из ${channelsToScan.length} каналов!`);
      addParserLogs([
        `✅ Сканирование завершено! Оставлено доступных каналов: ${scannedChannels.length} (недоступных: ${channelsToScan.length - scannedChannels.length})`
      ]);
      setChannels(scannedChannels);

      const currentActive = activeChannelRef.current;
      const isCurrentStillAvailable = scannedChannels.some(ch => ch.url === currentActive?.url);
      if (!isCurrentStillAvailable) {
        setActiveChannel(scannedChannels[0]);
        setSelectedCategory(scannedChannels[0].category);
      }
    }
  }, [showOsd, addParserLogs, setChannels, setActiveChannel, setSelectedCategory]);

  return {
    isScanning,
    scanProgress,
    scanCanceled,
    cancelScan,
    scanChannels,
    syncActiveChannel,
  };
}
