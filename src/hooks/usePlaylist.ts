import { useState, useEffect, useRef, useCallback } from "react";
import { SAMPLE_M3U_PLAYLIST, CATEGORIES, parseM3UPlaylist, Channel } from "../samplePlaylist";
import { SavedItem } from "../types";

export function usePlaylist(addParserLogs: (logs: string[]) => void) {
  const [rawPlaylist, setRawPlaylist] = useState<string>(SAMPLE_M3U_PLAYLIST);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [isLoadingPlaylist, setIsLoadingPlaylist] = useState<boolean>(false);

  const [savedItems, setSavedItems] = useState<SavedItem[]>(() => {
    const local = localStorage.getItem("iptv_saved_items");
    if (local) {
      try {
        return JSON.parse(local);
      } catch (e) {
        console.error("Failed to parse saved items", e);
      }
    }
    return [
      {
        id: "demo-playlist",
        name: "📺 Стандартный Демо-Плейлист (M3U)",
        type: "m3u_raw",
        content: SAMPLE_M3U_PLAYLIST,
        createdAt: new Date().toLocaleDateString("ru-RU")
      },
      {
        id: "nasa-stream",
        name: "🚀 NASA TV Live Stream (HLS)",
        type: "single_stream",
        content: "http://nasa-i.akamaihd.net/hls/live/253565/NASA-NTV1-Public/master.m3u8",
        createdAt: new Date().toLocaleDateString("ru-RU")
      },
      {
        id: "redbull-stream",
        name: "🛹 Red Bull TV Live Stream (HLS)",
        type: "single_stream",
        content: "https://rbmn-live.akamaized.net/hls/live/590964/BoB/master.m3u8",
        createdAt: new Date().toLocaleDateString("ru-RU")
      },
      {
        id: "france24-stream",
        name: "🌐 France 24 Live Stream (HLS)",
        type: "single_stream",
        content: "https://static.france24.com/live/F24_EN_LO_HLS/live_tv.m3u8",
        createdAt: new Date().toLocaleDateString("ru-RU")
      }
    ];
  });

  const [activePlaylistId, setActivePlaylistId] = useState<string>(() => {
    return localStorage.getItem("iptv_active_playlist_id") || "demo-playlist";
  });

  const debounceTimerRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  const debouncedSetItem = useCallback((key: string, value: string) => {
    if (debounceTimerRef.current[key]) {
      clearTimeout(debounceTimerRef.current[key]);
    }
    debounceTimerRef.current[key] = setTimeout(() => {
      localStorage.setItem(key, value);
      delete debounceTimerRef.current[key];
    }, 500);
  }, []);

  useEffect(() => {
    return () => {
      Object.values(debounceTimerRef.current).forEach(clearTimeout);
    };
  }, []);

  useEffect(() => {
    debouncedSetItem("iptv_saved_items", JSON.stringify(savedItems));
  }, [savedItems, debouncedSetItem]);

  useEffect(() => {
    debouncedSetItem("iptv_active_playlist_id", activePlaylistId);
  }, [activePlaylistId, debouncedSetItem]);

  const fetchAbortRef = useRef<AbortController | null>(null);

  const fetchPlaylistData = async (url: string): Promise<string> => {
    if (fetchAbortRef.current) {
      fetchAbortRef.current.abort();
    }
    const controller = new AbortController();
    fetchAbortRef.current = controller;

    const trimmedUrl = url.trim();
    const cacheBust = Date.now();

    try {
      addParserLogs([`⚡ [1/2] Пытаемся загрузить через встроенный серверный прокси...`]);
      const response = await fetch(`/api/proxy?url=${encodeURIComponent(trimmedUrl)}&_nocache=${cacheBust}`, {
        cache: "no-store",
        signal: controller.signal,
        headers: {
          "Cache-Control": "no-cache",
          "Pragma": "no-cache"
        }
      });
      if (response.ok) {
        return await response.text();
      }
      console.warn("Local proxy returned error status:", response.status);
    } catch (e: unknown) {
      if (e instanceof Error && e.name === "AbortError") throw e;
      console.warn("Local proxy is unavailable or failed:", e);
    }

    try {
      addParserLogs([`⚡ [2/2] Пробуем прямое сетевое подключение без прокси...`]);
      const response = await fetch(trimmedUrl, {
        cache: "no-store",
        signal: controller.signal,
        headers: {
          "Cache-Control": "no-cache",
          "Pragma": "no-cache"
        }
      });
      if (response.ok) {
        return await response.text();
      }
      console.warn("Direct fetch returned error status:", response.status);
    } catch (e: unknown) {
      if (e instanceof Error && e.name === "AbortError") throw e;
      console.warn("Direct fetch failed:", e);
    }

    throw new Error("Не удалось загрузить плейлист через безопасные способы (встроенный прокси или прямое подключение). Проверьте URL, CORS и доступность источника.");
  };

  const loadSavedItem = useCallback(async (item: SavedItem) => {
    setActivePlaylistId(item.id);
    setIsLoadingPlaylist(true);
    addParserLogs([`📂 Переключение на источник: "${item.name}"...`]);

    try {
      if (item.type === "m3u_raw") {
        setRawPlaylist(item.content);
        addParserLogs([`✨ Загружен локальный M3U текст плейлиста.`]);
      } else if (item.type === "m3u_url") {
        addParserLogs([`🌐 Начинаем загрузку внешнего плейлиста: ${item.content}`]);
        const data = await fetchPlaylistData(item.content);
        setRawPlaylist(data);
        addParserLogs([`✨ Внешний плейлист успешно скачан и обработан!`]);
      } else if (item.type === "single_stream") {
        const wrappedRaw = `#EXTM3U\n#EXTINF:-1 tvg-logo="https://img.icons8.com/emoji/96/television.png" group-title="Other", ${item.name}\n${item.content}`;
        setRawPlaylist(wrappedRaw);
        addParserLogs([`✨ Прямой поток обернут в M3U-формат и подготовлен для воспроизведения.`]);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(err);
      addParserLogs([
        `❌ Ошибка переключения на источник "${item.name}": ${message}`
      ]);
    } finally {
      setIsLoadingPlaylist(false);
    }
  }, [addParserLogs]);

  const handleAddSavedItem = useCallback((name: string, type: "m3u_url" | "m3u_raw" | "single_stream", content: string) => {
    const newItem: SavedItem = {
      id: `saved-${Date.now()}`,
      name,
      type,
      content,
      createdAt: new Date().toLocaleDateString("ru-RU")
    };

    setSavedItems(prev => [...prev, newItem]);
    addParserLogs([`💾 Сохранен новый источник "${newItem.name}" (${newItem.type})`]);
    loadSavedItem(newItem);
  }, [addParserLogs, loadSavedItem]);

  const handleDeleteSavedItem = useCallback((id: string, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }
    const remaining = savedItems.filter(item => item.id !== id);
    setSavedItems(remaining);
    addParserLogs([`🗑️ Удален сохраненный источник с ID: ${id}`]);

    if (activePlaylistId === id) {
      const fallback = remaining[0];
      if (fallback) {
        loadSavedItem(fallback);
      } else {
        setRawPlaylist(SAMPLE_M3U_PLAYLIST);
        setActivePlaylistId("demo-playlist");
      }
    }
  }, [savedItems, activePlaylistId, addParserLogs, loadSavedItem]);

  useEffect(() => {
    addParserLogs(["🚀 Начало синтаксического анализа M3U плейлиста..."]);
    try {
      const parsed = parseM3UPlaylist(rawPlaylist);
      setChannels(parsed);

      const parsedLogs: string[] = [
        `✅ Анализ плейлиста завершен! Обнаружено каналов: ${parsed.length}`,
        `📂 Категоризация каналов по алгоритму M3U 'group-title' и ключевым словам:`
      ];

      const counts: Record<string, number> = {};
      parsed.forEach(ch => {
        counts[ch.category] = (counts[ch.category] || 0) + 1;
      });

      CATEGORIES.forEach(cat => {
        const count = counts[cat.id] || 0;
        parsedLogs.push(`   ↳ Категория "${cat.ru}" (${cat.id}): ${count} каналов`);
      });

      parsed.slice(0, 5).forEach((ch, idx) => {
        parsedLogs.push(`   🔍 [Канал #${idx + 1}] "${ch.name}" ➔ Группа: "${ch.originalGroup}" ➔ Определен в: "${ch.category}"`);
      });

      addParserLogs(parsedLogs);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      addParserLogs([`❌ Ошибка парсинга: ${message}`]);
    }
  }, [rawPlaylist, addParserLogs]);

  useEffect(() => {
    const savedActiveId = localStorage.getItem("iptv_active_playlist_id");
    if (savedActiveId && savedActiveId !== "demo-playlist") {
      const activeItem = savedItems.find(item => item.id === savedActiveId);
      if (activeItem) {
        loadSavedItem(activeItem);
      }
    }
  }, []);

  return {
    rawPlaylist,
    setRawPlaylist,
    channels,
    setChannels,
    isLoadingPlaylist,
    setIsLoadingPlaylist,
    savedItems,
    setSavedItems,
    activePlaylistId,
    setActivePlaylistId,
    fetchPlaylistData,
    loadSavedItem,
    handleAddSavedItem,
    handleDeleteSavedItem,
  };
}
