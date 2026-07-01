import React, { useState, useEffect, useMemo, useCallback } from "react";
import { 
  motion, 
  AnimatePresence 
} from "motion/react";
import { 
  Tv, 
  Smartphone, 
  Search, 
  Play, 
  Pause, 
  RotateCcw, 
  ArrowRight, 
  ArrowLeft, 
  ArrowUp, 
  ArrowDown, 
  AlertCircle, 
  Settings, 
  Video, 
  Volume2,
  ListVideo,
  Trash2,
  Plus,
  Database,
  Moon,
  X,
  Maximize,
  Minimize,
  Heart,
  Keyboard
} from "lucide-react";
import { 
  CATEGORIES, 
} from "./samplePlaylist";
import { SettingsModal } from "./components/SettingsModal";
import { ChannelLogo } from "./components/ChannelLogo";

import { useParserLogs } from "./hooks/useParserLogs";
import { useOsd } from "./hooks/useOsd";
import { usePlayer } from "./hooks/usePlayer";
import { useFavorites } from "./hooks/useFavorites";
import { useSleepTimer } from "./hooks/useSleepTimer";
import { usePlaylist } from "./hooks/usePlaylist";
import { useChannelScanner } from "./hooks/useChannelScanner";
import { useDeviceDetection } from "./hooks/useDeviceDetection";
import { useFullscreen } from "./hooks/useFullscreen";
import { useControlsTimer } from "./hooks/useControlsTimer";
import { useVolumeHud } from "./hooks/useVolumeHud";

const ALL_CATEGORIES = [
  { id: "Playlists", ru: "🔌 Источники", en: "Sources", color: "from-violet-600 to-indigo-700" },
  { id: "All", ru: "📺 Все каналы", en: "All Channels", color: "from-sky-500 to-blue-600" },
  { id: "Favorites", ru: "⭐ Избранные", en: "Favorites", color: "from-rose-500 to-pink-600" },
  ...CATEGORIES
];

export default function App() {
  const { addParserLogs } = useParserLogs();
  const { osdMessage, showOsd } = useOsd();
  
  const player = usePlayer(addParserLogs);
  const { favoriteUrls, toggleFavorite } = useFavorites(addParserLogs);
  const { setSleepTimerMinutes, sleepTimerSecondsLeft, setSleepTimerSecondsLeft } = useSleepTimer(player.setIsPlaying, addParserLogs);
  const playlist = usePlaylist(addParserLogs);
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const scanner = useChannelScanner(showOsd, addParserLogs, playlist.setChannels, player.setActiveChannel, setSelectedCategory);
  const device = useDeviceDetection(showOsd);
  const fullscreen = useFullscreen();
  const controls = useControlsTimer();
  const volumeHud = useVolumeHud();

  const [searchQuery, setSearchQuery] = useState<string>("");
  const [visibleCount, setVisibleCount] = useState<number>(40);
  const [showSettingsModal, setShowSettingsModal] = useState<boolean>(false);
  const [focusedId, setFocusedId] = useState<string>("cat-News");
  const [showHotkeysModal, setShowHotkeysModal] = useState<boolean>(false);

  useEffect(() => {
    if (volumeHud.isFirstVolumeRender.current) {
      volumeHud.isFirstVolumeRender.current = false;
      return;
    }
    volumeHud.triggerVolumeHud();
  }, [player.volume, player.isMuted, volumeHud]);

  useEffect(() => {
    const savedName = localStorage.getItem(`iptv_last_channel_name_${playlist.activePlaylistId}`);
    const savedUrl = localStorage.getItem(`iptv_last_channel_url_${playlist.activePlaylistId}`);
    if (playlist.channels.length > 0) {
      let initialChannel = playlist.channels[0];
      if (savedUrl || savedName) {
        const found = playlist.channels.find(ch => ch.url === savedUrl || ch.name === savedName);
        if (found) {
          initialChannel = found;
          addParserLogs([`⏮️ Восстановлен последний воспроизводившийся канал: "${found.name}"`]);
        }
      }
      player.setActiveChannel(initialChannel);
      setSelectedCategory("All");
      setFocusedId("cat-All");
    }
  }, [playlist.channels, playlist.activePlaylistId]);

  useEffect(() => {
    if (player.activeChannel && playlist.activePlaylistId) {
      localStorage.setItem(`iptv_last_channel_name_${playlist.activePlaylistId}`, player.activeChannel.name);
      localStorage.setItem(`iptv_last_channel_url_${playlist.activePlaylistId}`, player.activeChannel.url);
    }
  }, [player.activeChannel, playlist.activePlaylistId]);

  useEffect(() => {
    scanner.syncActiveChannel(player.activeChannel);
  }, [player.activeChannel, scanner.syncActiveChannel]);

  const filteredChannels = useMemo(() => {
    return playlist.channels.filter(ch => {
      const isFav = favoriteUrls.includes(ch.url);
      const matchesCategory = selectedCategory === "All" 
        ? true 
        : selectedCategory === "Favorites" 
          ? isFav 
          : ch.category === selectedCategory;
      const matchesSearch = searchQuery === "" || 
        ch.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ch.originalGroup.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [playlist.channels, selectedCategory, searchQuery, favoriteUrls]);

  const renderedChannels = useMemo(() => {
    return filteredChannels.slice(0, visibleCount);
  }, [filteredChannels, visibleCount]);

  const activeGridLength = selectedCategory === "Playlists" ? playlist.savedItems.length : renderedChannels.length;

  const playNextChannel = useCallback(() => {
    if (filteredChannels.length === 0) return;
    const currentIdx = filteredChannels.findIndex(ch => ch.id === player.activeChannel?.id);
    const nextIdx = currentIdx !== -1 ? (currentIdx + 1) % filteredChannels.length : 0;
    player.setActiveChannel(filteredChannels[nextIdx]);
    addParserLogs([`⏭️ Автоматическое переключение на следующий канал: "${filteredChannels[nextIdx].name}"`]);
  }, [filteredChannels, player.activeChannel, player.setActiveChannel, addParserLogs]);

  const playPrevChannel = useCallback(() => {
    if (filteredChannels.length === 0) return;
    const currentIdx = filteredChannels.findIndex(ch => ch.id === player.activeChannel?.id);
    const prevIdx = currentIdx !== -1 ? (currentIdx - 1 + filteredChannels.length) % filteredChannels.length : 0;
    player.setActiveChannel(filteredChannels[prevIdx]);
    addParserLogs([`⏮️ Переключение на предыдущий канал: "${filteredChannels[prevIdx].name}"`]);
  }, [filteredChannels, player.activeChannel, player.setActiveChannel, addParserLogs]);

  useEffect(() => {
    player.setPlayNextChannel(playNextChannel);
    player.setPlayPrevChannel(playPrevChannel);
  }, [playNextChannel, playPrevChannel, player.setPlayNextChannel, player.setPlayPrevChannel]);

  useEffect(() => {
    controls.resetControlsTimer();
    return () => {
      if (controls.controlsTimerRef.current) {
        clearTimeout(controls.controlsTimerRef.current);
      }
    };
  }, [controls.resetControlsTimer, player.activeChannel]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      controls.resetControlsTimer();
      if (!device.isTvMode) return;

      if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Enter", "Escape"].includes(e.key)) {
        e.preventDefault();
      }

      const activeCategories = ALL_CATEGORIES.filter(cat => 
        cat.id === "Playlists" || cat.id === "Favorites" || playlist.channels.some(ch => ch.category === cat.id)
      );

      if (focusedId.startsWith("cat-")) {
        const currentCatId = focusedId.replace("cat-", "");
        const currentIdx = activeCategories.findIndex(c => c.id === currentCatId);

        if (e.key === "ArrowRight") {
          const nextIdx = (currentIdx + 1) % activeCategories.length;
          const nextCat = activeCategories[nextIdx].id;
          setFocusedId(`cat-${nextCat}`);
          setSelectedCategory(nextCat);
        } else if (e.key === "ArrowLeft") {
          const prevIdx = (currentIdx - 1 + activeCategories.length) % activeCategories.length;
          const prevCat = activeCategories[prevIdx].id;
          setFocusedId(`cat-${prevCat}`);
          setSelectedCategory(prevCat);
        } else if (e.key === "ArrowDown") {
          if (activeGridLength > 0) {
            setFocusedId("chan-0");
          }
        } else if (e.key === "Enter") {
          setSelectedCategory(currentCatId);
        }
      } else if (focusedId.startsWith("chan-")) {
        const currentChanIdx = parseInt(focusedId.replace("chan-", ""), 10);
        const columns = 2;

        if (e.key === "ArrowRight") {
          if (currentChanIdx < activeGridLength - 1) {
            setFocusedId(`chan-${currentChanIdx + 1}`);
          }
        } else if (e.key === "ArrowLeft") {
          if (currentChanIdx > 0) {
            setFocusedId(`chan-${currentChanIdx - 1}`);
          }
        } else if (e.key === "ArrowDown") {
          if (currentChanIdx + columns < activeGridLength) {
            setFocusedId(`chan-${currentChanIdx + columns}`);
          }
        } else if (e.key === "ArrowUp") {
          if (currentChanIdx - columns >= 0) {
            setFocusedId(`chan-${currentChanIdx - columns}`);
          } else {
            setFocusedId(`cat-${selectedCategory}`);
          }
        } else if (e.key === "Enter") {
          if (selectedCategory === "Playlists") {
            const targetItem = playlist.savedItems[currentChanIdx];
            if (targetItem) {
              playlist.loadSavedItem(targetItem);
            }
          } else {
            const targetChan = renderedChannels[currentChanIdx];
            if (targetChan) {
              player.setActiveChannel(targetChan);
            }
          }
        } else if (e.key === "Escape" || e.key === "Backspace") {
          setFocusedId(`cat-${selectedCategory}`);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [device.isTvMode, focusedId, renderedChannels, selectedCategory, playlist.channels, controls.resetControlsTimer, playlist.savedItems, playlist.loadSavedItem, player.setActiveChannel, activeGridLength]);

  useEffect(() => {
    const handlePlayerHotkeys = (e: KeyboardEvent) => {
      const activeEl = document.activeElement;
      if (
        activeEl && 
        (activeEl.tagName === "INPUT" || 
         activeEl.tagName === "TEXTAREA" || 
         activeEl.getAttribute("contenteditable") === "true")
      ) {
        return;
      }

      const key = e.key.toLowerCase();
      
      if (e.key === " " || key === "spacebar") {
        e.preventDefault();
        controls.resetControlsTimer();
        player.setIsPlaying(prev => {
          const nextVal = !prev;
          showOsd(nextVal ? "▶ Воспроизведение" : "⏸ Пауза");
          return nextVal;
        });
      } else if (key === "m" || e.key === "AudioVolumeMute" || e.key === "VolumeMute") {
        e.preventDefault();
        controls.resetControlsTimer();
        player.setIsMuted(prev => {
          const nextVal = !prev;
          showOsd(nextVal ? "🔇 Звук выключен" : "🔊 Звук включен");
          return nextVal;
        });
      } else if (key === "f") {
        e.preventDefault();
        controls.resetControlsTimer();
        fullscreen.toggleFullscreen();
        showOsd(!fullscreen.isPlayerFullscreen ? "📺 Во весь экран" : "📺 Обычный режим");
      } else if (e.key === "AudioVolumeUp" || e.key === "VolumeUp" || key === "+" || key === "=") {
        e.preventDefault();
        controls.resetControlsTimer();
        player.setVolume(prev => {
          const nextVal = Math.min(1, Math.round((prev + 0.05) * 100) / 100);
          showOsd(`🔊 Громкость: ${Math.round(nextVal * 100)}%`);
          return nextVal;
        });
        player.setIsMuted(false);
      } else if (e.key === "AudioVolumeDown" || e.key === "VolumeDown" || key === "-" || key === "_") {
        e.preventDefault();
        controls.resetControlsTimer();
        player.setVolume(prev => {
          const nextVal = Math.max(0, Math.round((prev - 0.05) * 100) / 100);
          showOsd(`🔊 Громкость: ${Math.round(nextVal * 100)}%`);
          return nextVal;
        });
        player.setIsMuted(false);
      }
    };

    window.addEventListener("keydown", handlePlayerHotkeys);
    return () => {
      window.removeEventListener("keydown", handlePlayerHotkeys);
    };
  }, [fullscreen.isPlayerFullscreen, fullscreen.toggleFullscreen, controls.resetControlsTimer, showOsd, player]);

  useEffect(() => {
    if (!device.isTvMode) return;
    const element = document.getElementById(focusedId);
    if (element) {
      element.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
        inline: "center"
      });
    }
  }, [focusedId, device.isTvMode]);

  useEffect(() => {
    setVisibleCount(40);
  }, [selectedCategory, searchQuery]);

  useEffect(() => {
    setVisibleCount(40);
  }, [selectedCategory, searchQuery]);

  const handlePlayerDoubleClick = useCallback((e: React.MouseEvent) => {
    if (device.isTvMode) return;
    const target = e.target as HTMLElement;
    if (target.closest('button') || target.closest('input') || target.closest('select') || target.closest('a')) {
      return;
    }
    fullscreen.toggleFullscreen();
  }, [device.isTvMode, fullscreen.toggleFullscreen]);

  const lastTapRef = React.useRef<number>(0);

  const handlePlayerTouchStart = useCallback((e: React.TouchEvent) => {
    controls.resetControlsTimer();
    if (device.isTvMode) return;

    const now = Date.now();
    const DOUBLE_TAP_DELAY = 300;
    if (now - lastTapRef.current < DOUBLE_TAP_DELAY) {
      const target = e.target as HTMLElement;
      if (!target.closest('button') && !target.closest('input') && !target.closest('select') && !target.closest('a')) {
        fullscreen.toggleFullscreen();
      }
      lastTapRef.current = 0;
    } else {
      lastTapRef.current = now;
    }
  }, [device.isTvMode, controls.resetControlsTimer, fullscreen.toggleFullscreen]);

  const handleLoadPlaylistUrl = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    const playlistUrl = (e.target as HTMLFormElement).querySelector<HTMLInputElement>("input")?.value || "";
    if (!playlistUrl.trim()) return;

    playlist.setIsLoadingPlaylist(true);
    addParserLogs([`🌐 Отправка запроса для: ${playlistUrl}`]);

    try {
      const data = await playlist.fetchPlaylistData(playlistUrl);
      playlist.setRawPlaylist(data);
      addParserLogs([`✨ Плейлист успешно загружен и передан парсеру!`]);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(err);
      addParserLogs([
        `❌ Ошибка загрузки URL: ${message}`,
        `💡 Подсказка: Убедитесь, что URL возвращает корректный текстовый M3U поток.`
      ]);
    } finally {
      playlist.setIsLoadingPlaylist(false);
    }
  }, [playlist, addParserLogs]);

  const triggerTvDpad = useCallback((direction: "Up" | "Down" | "Left" | "Right" | "Enter" | "Back") => {
    controls.resetControlsTimer();
    const activeCategories = ALL_CATEGORIES.filter(cat => 
      cat.id === "Playlists" || cat.id === "Favorites" || playlist.channels.some(ch => ch.category === cat.id)
    );

    if (direction === "Back") {
      setFocusedId(`cat-${selectedCategory}`);
      return;
    }

    if (focusedId.startsWith("cat-")) {
      const currentCatId = focusedId.replace("cat-", "");
      const currentIdx = activeCategories.findIndex(c => c.id === currentCatId);

      if (direction === "Right") {
        const nextIdx = (currentIdx + 1) % activeCategories.length;
        const nextCat = activeCategories[nextIdx].id;
        setFocusedId(`cat-${nextCat}`);
        setSelectedCategory(nextCat);
      } else if (direction === "Left") {
        const prevIdx = (currentIdx - 1 + activeCategories.length) % activeCategories.length;
        const prevCat = activeCategories[prevIdx].id;
        setFocusedId(`cat-${prevCat}`);
        setSelectedCategory(prevCat);
      } else if (direction === "Down") {
        if (activeGridLength > 0) {
          setFocusedId("chan-0");
        }
      } else if (direction === "Enter") {
        setSelectedCategory(currentCatId);
      }
    } else if (focusedId.startsWith("chan-")) {
      const currentChanIdx = parseInt(focusedId.replace("chan-", ""), 10);
      const columns = 2;

      if (direction === "Right") {
        if (currentChanIdx < activeGridLength - 1) {
          setFocusedId(`chan-${currentChanIdx + 1}`);
        }
      } else if (direction === "Left") {
        if (currentChanIdx > 0) {
          setFocusedId(`chan-${currentChanIdx - 1}`);
        }
      } else if (direction === "Down") {
        if (currentChanIdx + columns < activeGridLength) {
          setFocusedId(`chan-${currentChanIdx + columns}`);
        }
      } else if (direction === "Up") {
        if (currentChanIdx - columns >= 0) {
          setFocusedId(`chan-${currentChanIdx - columns}`);
        } else {
          setFocusedId(`cat-${selectedCategory}`);
        }
      } else if (direction === "Enter") {
        if (selectedCategory === "Playlists") {
          const targetItem = playlist.savedItems[currentChanIdx];
          if (targetItem) {
            playlist.loadSavedItem(targetItem);
          }
        } else {
          const targetChan = renderedChannels[currentChanIdx];
          if (targetChan) {
            player.setActiveChannel(targetChan);
          }
        }
      }
    }
  }, [controls.resetControlsTimer, playlist.channels, playlist.savedItems, playlist.loadSavedItem, selectedCategory, focusedId, activeGridLength, renderedChannels, player.setActiveChannel]);

  return (
    <div className="min-h-screen bg-pure-black text-white font-sans flex flex-col selection:bg-bright-cyan selection:text-pure-black">
      
      {/* Header */}
      <header className="border-b border-deep-azure/20 bg-[#0A111F]/80 backdrop-blur-md px-6 py-3 flex items-center justify-between gap-4 z-10 sticky top-0">
        <div className="flex items-center gap-2">
          <Tv className="w-5 h-5 text-bright-cyan" />
          <h1 className="font-sans font-bold text-sm uppercase tracking-wider text-white">
            IPTV
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowSettingsModal(true)}
            className="flex items-center justify-center p-2 rounded-xl transition-all duration-300 border bg-midnight-blue border-deep-azure/40 text-slate-300 hover:text-white hover:border-bright-cyan cursor-pointer"
            title="Настройки и код"
          >
            <Settings className="w-4 h-4 text-bright-cyan animate-spin-slow" />
          </button>

          <div className="flex items-center bg-midnight-blue border border-deep-azure/40 p-1 rounded-xl">
            <button
              onClick={() => { if (device.isTvMode) device.setIsTvMode(false); }}
              className={`p-1.5 rounded-lg transition-all duration-300 cursor-pointer ${
                !device.isTvMode 
                  ? "bg-deep-azure text-emerald-400 border border-emerald-500/20" 
                  : "text-slate-400 hover:text-slate-200"
              }`}
              title="Мобильный режим"
            >
              <Smartphone className="w-4 h-4" />
            </button>
            <button
              onClick={() => { 
                if (!device.isTvMode) {
                  device.setIsTvMode(true);
                  setFocusedId(`cat-${selectedCategory}`);
                }
              }}
              className={`p-1.5 rounded-lg transition-all duration-300 cursor-pointer ${
                device.isTvMode 
                  ? "bg-deep-azure text-bright-cyan border border-bright-cyan/20" 
                  : "text-slate-400 hover:text-slate-200"
              }`}
              title="Режим Android TV"
            >
              <Tv className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 flex flex-col items-center justify-start p-4 md:p-6 overflow-y-auto w-full max-w-4xl mx-auto gap-6">
        
        <section className="w-full flex flex-col gap-6">
          
          <div className="relative rounded-2xl overflow-hidden border border-deep-azure/60 bg-pure-black shadow-2xl flex flex-col">

            <div className="p-4 flex flex-col gap-4">

              {/* Video Player */}
              <div 
                ref={fullscreen.playerContainerRef}
                onMouseMove={controls.resetControlsTimer}
                onTouchStart={handlePlayerTouchStart}
                onClick={(e) => {
                  controls.resetControlsTimer();
                  if (device.showLandscapeSidebar) {
                    device.setShowLandscapeSidebar(false);
                  }
                }}
                onDoubleClick={handlePlayerDoubleClick}
                className={`relative w-full max-w-full overflow-hidden bg-black flex flex-col justify-between group shadow-lg transition-all duration-300 z-40
                  ${fullscreen.isPlayerFullscreen 
                    ? "fixed inset-0 w-screen h-screen rounded-none" 
                    : "aspect-video rounded-[4px]"
                  }
                `}
              >
                
                <video
                  ref={player.videoRef}
                  className={`absolute inset-0 w-full h-full mx-auto my-auto
                    ${player.aspectRatioMode === "contain" ? "object-contain max-w-full max-h-full" : ""}
                    ${player.aspectRatioMode === "cover" ? "object-cover" : ""}
                    ${player.aspectRatioMode === "fill" ? "object-fill" : ""}
                    ${player.useFallbackVisualizer ? "hidden" : "block"}
                  `}
                  playsInline
                />

                {/* Top Overlay Bar */}
                <div 
                  className={`absolute top-0 inset-x-0 bg-gradient-to-b from-black/85 via-black/40 to-transparent p-4 flex justify-between items-center transition-all duration-300 z-45
                    ${controls.showPlayerControls ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4 pointer-events-none"}
                  `}
                >
                  <span className="text-emerald-400 font-sans font-medium px-2 py-0.5 rounded-[4px] bg-emerald-500/10 border border-emerald-500/20 text-[9px] flex items-center gap-1 shadow-[0_0_10px_rgba(16,185,129,0.15)]">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span>{device.deviceType} • {device.orientation === "landscape" ? "Горизонтально 📱" : "Вертикально 📱"}</span>
                  </span>

                  <div className="flex items-center gap-2 bg-transparent text-white">
                    <Moon className="w-3 h-3 text-indigo-400" />
                    <span className="text-[10px] font-sans font-semibold tracking-wide">
                      Таймер сна:{" "}
                      <span className="font-mono text-indigo-300 font-bold">
                        {sleepTimerSecondsLeft !== null 
                          ? `${Math.floor(sleepTimerSecondsLeft / 60)}м` 
                          : "выкл"
                        }
                      </span>
                    </span>
                    <div className="flex items-center gap-1.5 ml-1 border-l border-slate-700/50 pl-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          const currentMins = sleepTimerSecondsLeft !== null ? Math.floor(sleepTimerSecondsLeft / 60) : 0;
                          const newMinutes = Math.max(0, currentMins - 5);
                          if (newMinutes === 0) {
                            setSleepTimerMinutes(0);
                            setSleepTimerSecondsLeft(null);
                            showOsd("⏰ Таймер сна выключен");
                          } else {
                            setSleepTimerMinutes(newMinutes);
                            setSleepTimerSecondsLeft(newMinutes * 60);
                            showOsd(`⏰ Таймер сна уменьшен до ${newMinutes} минут`);
                          }
                        }}
                        disabled={sleepTimerSecondsLeft === null}
                        className="px-1.5 py-0.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 rounded-[3px] text-[9px] font-bold cursor-pointer transition-colors text-slate-300 hover:text-white"
                        title="Уменьшить на 5 минут"
                      >
                        -5м
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          const currentMins = sleepTimerSecondsLeft !== null ? Math.floor(sleepTimerSecondsLeft / 60) : 0;
                          const newMinutes = currentMins === 0 ? 5 : currentMins + 5;
                          setSleepTimerMinutes(newMinutes);
                          setSleepTimerSecondsLeft(newMinutes * 60);
                          showOsd(`⏰ Таймер сна увеличен до ${newMinutes} минут`);
                        }}
                        className="px-1.5 py-0.5 bg-indigo-950/80 hover:bg-indigo-900/80 text-indigo-300 border border-indigo-500/30 hover:border-indigo-500/50 rounded-[3px] text-[9px] font-bold cursor-pointer transition-colors"
                        title="Увеличить на 5 минут"
                      >
                        +5м
                      </button>
                    </div>
                  </div>
                </div>

                {/* OSD Message */}
                <AnimatePresence>
                  {osdMessage && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.85, y: -10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.9, y: -10 }}
                      className="absolute top-4 right-4 bg-pure-black/85 backdrop-blur-md border border-bright-cyan/40 px-3 py-1.5 rounded-[4px] text-white font-sans text-xs font-semibold tracking-wide flex items-center gap-2 z-50 shadow-[0_0_15px_rgba(226,232,240,0.25)]"
                    >
                      <span className="w-1.5 h-1.5 bg-bright-cyan rounded-full animate-pulse" />
                      <span>{osdMessage}</span>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Auto-play Countdown */}
                {player.autoPlayCountdown !== null && (
                  <div className="absolute top-12 left-4 right-4 bg-red-950/95 border border-red-500/50 backdrop-blur-md rounded-[4px] p-3 flex flex-col sm:flex-row items-center justify-between gap-3 z-40 shadow-[0_0_20px_rgba(239,68,68,0.25)]">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-[4px] bg-red-500/20 border border-red-500 flex items-center justify-center text-red-400 font-mono text-xs font-bold animate-pulse">
                        {player.autoPlayCountdown}
                      </div>
                      <div className="text-left">
                        <div className="text-xs font-semibold text-white">Поток недоступен / Ошибка воспроизведения</div>
                        <div className="text-[10px] text-slate-300">Следующий канал будет запущен автоматически</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          player.setAutoPlayCountdown(null);
                          playNextChannel();
                        }}
                        className="px-2.5 py-1 bg-red-600 hover:bg-red-500 text-white rounded-[4px] text-[10px] font-bold transition-all cursor-pointer"
                      >
                        Пропустить
                      </button>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          player.setAutoPlayCountdown(null);
                          player.setIsAutoPlayEnabled(false);
                          addParserLogs(["❌ Автопереключение при ошибках отключено пользователем."]);
                        }}
                        className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-[4px] text-[10px] font-medium transition-all cursor-pointer"
                      >
                        Отмена
                      </button>
                    </div>
                  </div>
                )}

                {/* Fallback Visualizer */}
                {(!player.activeChannel || player.useFallbackVisualizer) && (
                  <div className="absolute inset-0 bg-gradient-to-b from-[#0A111F] to-black flex flex-col items-center justify-center p-6 text-center">
                    <div className="w-12 h-12 rounded-[4px] bg-deep-azure/10 border border-deep-azure/30 flex items-center justify-center mb-3">
                      <Tv className="w-6 h-6 text-bright-cyan/60" />
                    </div>
                    <h4 className="text-white font-sans font-medium text-xs tracking-wider uppercase">
                      {player.activeChannel ? player.activeChannel.name : "ОЖИДАНИЕ ВЫБОРА"}
                    </h4>
                    <p className="text-[10px] text-slate-500 mt-1 font-mono uppercase tracking-widest">
                      {player.activeChannel ? `${CATEGORIES.find(c => c.id === player.activeChannel!.category)?.ru || player.activeChannel!.category}` : "Выберите IPTV канал"}
                    </p>
                  </div>
                )}

                {/* Bottom Controls Overlay */}
                <div 
                  className={`absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent p-4 flex flex-col gap-2 transition-all duration-300 z-30
                    ${controls.showPlayerControls ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"}
                  `}
                >
                  <div className="w-full bg-slate-800 h-1 rounded-[4px] overflow-hidden relative">
                    <div className="absolute left-0 top-0 bottom-0 bg-bright-cyan w-3/4 shadow-[0_0_6px_#E2E8F0]"></div>
                  </div>

                  <div className="flex justify-between items-center text-xs overflow-hidden">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          player.setIsPlaying(!player.isPlaying);
                        }}
                        className="p-1.5 hover:bg-slate-800 rounded-full transition-colors text-white cursor-pointer"
                      >
                        {player.isPlaying ? <Pause className="w-4 h-4 text-bright-cyan" /> : <Play className="w-4 h-4 text-white" />}
                      </button>
                      <div className="flex items-center gap-1.5 group/volume bg-slate-900/40 px-2 py-1 rounded-[4px] border border-slate-800/40">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            player.setIsMuted(!player.isMuted);
                            showOsd(!player.isMuted ? "🔇 Звук выключен" : `🔊 Громкость: ${Math.round(player.volume * 100)}%`);
                          }}
                          className="p-1 hover:bg-slate-800 rounded-full transition-colors text-white cursor-pointer"
                          title={player.isMuted ? "Включить звук" : "Выключить звук"}
                        >
                          <Volume2 className={`w-3.5 h-3.5 ${player.isMuted ? "text-rose-400 line-through" : "text-slate-300 hover:text-bright-cyan"}`} />
                        </button>
                        <input
                          type="range"
                          min="0"
                          max="1"
                          step="0.05"
                          value={player.isMuted ? 0 : player.volume}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value);
                            player.setVolume(val);
                            if (player.isMuted && val > 0) {
                              player.setIsMuted(false);
                            }
                            showOsd(`🔊 Громкость: ${Math.round(val * 100)}%`);
                          }}
                          onClick={(e) => e.stopPropagation()}
                          onTouchStart={(e) => e.stopPropagation()}
                          className="w-12 h-1 bg-slate-800 rounded-[4px] appearance-none cursor-pointer accent-bright-cyan transition-all duration-300 md:group-hover/volume:w-16"
                          title="Регулировка громкости"
                        />
                        <span className="text-[10px] font-mono text-slate-400 w-6 text-right select-none">
                          {Math.round((player.isMuted ? 0 : player.volume) * 100)}%
                        </span>
                      </div>

                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          device.setShowLandscapeSidebar(!device.showLandscapeSidebar);
                        }}
                        className={`p-1.5 hover:bg-slate-800 rounded-[4px] transition-all flex items-center gap-1 cursor-pointer text-[11px] font-semibold font-sans h-8 px-2.5 rounded-[4px] border
                          ${device.showLandscapeSidebar 
                            ? "bg-bright-cyan/25 text-bright-cyan border-bright-cyan/40" 
                            : "text-slate-300 hover:text-bright-cyan bg-slate-900/60 border-slate-700/50"
                          }
                        `}
                        title="Каталог каналов"
                      >
                        <ListVideo className="w-3.5 h-3.5" />
                        <span>Каналы</span>
                      </button>

                      <span className="text-xs text-slate-200 font-medium">
                        {player.activeChannel ? player.activeChannel.name : "Канал не выбран"}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-slate-400 font-mono text-[10px] flex-shrink-0">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          player.setAspectRatioMode((prev) => {
                            if (prev === "contain") return "cover";
                            if (prev === "cover") return "fill";
                            return "contain";
                          });
                          const nextMode = player.aspectRatioMode === "contain" ? "cover" : player.aspectRatioMode === "cover" ? "fill" : "contain";
                          const labels: Record<string, string> = {
                            contain: "Вписать (оригинал)",
                            cover: "Заполнить (без полос)",
                            fill: "Растянуть на весь экран"
                          };
                          showOsd(`📺 Масштаб: ${labels[nextMode]}`);
                        }}
                        className="px-2 py-0.5 bg-[#121B2E] border border-bright-cyan/20 text-bright-cyan hover:bg-[#1a2742] transition-colors rounded-[4px] text-[10px] cursor-pointer font-sans select-none font-medium shadow-[0_0_8px_rgba(0,209,255,0.1)]"
                        title="Изменить режим экрана (убрать черные полосы)"
                      >
                        {player.aspectRatioMode === "contain" && "Масштаб: Вписать"}
                        {player.aspectRatioMode === "cover" && "Масштаб: Заполнить"}
                        {player.aspectRatioMode === "fill" && "Масштаб: Растянуть"}
                      </button>

                      <span className="px-1.5 py-0.5 bg-bright-cyan/10 text-bright-cyan border border-bright-cyan/20 rounded-[4px] hidden sm:inline">
                        1080P HD
                      </span>
                      <span className="hidden md:inline">HLS / AAC</span>

                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          fullscreen.toggleFullscreen();
                        }}
                        className="p-1.5 hover:bg-slate-800/80 rounded-full transition-colors text-slate-300 hover:text-bright-cyan ml-1 cursor-pointer"
                        title={fullscreen.isPlayerFullscreen ? "Свернуть" : "Развернуть во весь экран"}
                      >
                        {fullscreen.isPlayerFullscreen ? (
                          <Minimize className="w-4 h-4" />
                        ) : (
                          <Maximize className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Left Sidebar */}
                <AnimatePresence>
                  {device.showLandscapeSidebar && (
                    <motion.div
                      initial={{ x: "-100%", opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      exit={{ x: "-100%", opacity: 0 }}
                      transition={{ type: "spring", damping: 25, stiffness: 220 }}
                      className="absolute left-0 top-0 bottom-0 w-80 bg-[#0A111F]/60 backdrop-blur-md border-r border-bright-cyan/20 z-50 flex flex-col p-4 shadow-[5px_0_25px_rgba(0,0,0,0.8)] text-left"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex justify-between items-center mb-4 pb-2 border-b border-deep-azure/20">
                        <div className="flex items-center gap-2">
                          <ListVideo className="w-4 h-4 text-bright-cyan animate-pulse" />
                          <h4 className="font-sans font-bold text-xs uppercase tracking-wider text-white">Каталог каналов</h4>
                        </div>
                        <button
                          onClick={() => device.setShowLandscapeSidebar(false)}
                          className="p-1.5 hover:bg-slate-800 rounded-[4px] text-slate-400 hover:text-white transition-colors cursor-pointer"
                          title="Закрыть каталог"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="relative mb-3">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                        <input
                          type="text"
                          placeholder="Поиск по названию..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="w-full bg-[#121B2E] border border-deep-azure/40 rounded-[4px] pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-bright-cyan"
                        />
                      </div>

                      <div className="mb-3 flex items-center gap-2">
                        <span className="text-[10px] text-slate-500 uppercase tracking-wider font-mono">Категория:</span>
                        <select
                          value={selectedCategory}
                          onChange={(e) => setSelectedCategory(e.target.value)}
                          className="flex-1 bg-[#121B2E] border border-deep-azure/40 text-xs text-bright-cyan font-semibold rounded-[4px] px-2 py-1 focus:outline-none focus:border-bright-cyan cursor-pointer"
                        >
                          {ALL_CATEGORIES.map(cat => (
                            <option key={cat.id} value={cat.id}>
                              {cat.ru}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="flex-1 overflow-y-auto pr-1 space-y-1.5 scrollbar-thin scrollbar-thumb-bright-cyan/20 scrollbar-track-transparent">
                        {selectedCategory === "Playlists" ? (
                          playlist.savedItems.map((item) => {
                            const isActive = playlist.activePlaylistId === item.id;
                            return (
                              <div
                                key={item.id}
                                onClick={() => {
                                  playlist.loadSavedItem(item);
                                  showOsd(`📂 Источник: ${item.name}`);
                                }}
                                className={`flex items-center justify-between gap-2.5 p-2 rounded-[4px] border transition-all duration-200 cursor-pointer text-left hover:scale-[1.02] active:scale-[0.98]
                                  ${isActive 
                                    ? "bg-violet-950/40 border-violet-500/50 text-white shadow-[0_0_10px_rgba(139,92,246,0.15)]" 
                                    : "bg-[#0A111F]/30 border-transparent hover:bg-slate-800/40 hover:border-deep-azure/20 text-slate-300"
                                  }
                                `}
                              >
                                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                  <div className="w-8 h-8 rounded-[4px] bg-black/40 border border-deep-azure/30 flex items-center justify-center flex-shrink-0">
                                    <Database className="w-4 h-4 text-violet-400" />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="text-xs font-semibold truncate leading-tight">{item.name}</div>
                                    <div className="text-[9px] font-mono text-slate-500 uppercase mt-0.5">
                                      {item.type === "m3u_url" && "🔗 M3U URL"}
                                      {item.type === "m3u_raw" && "📝 Текст M3U"}
                                      {item.type === "single_stream" && "🎥 HLS Поток"}
                                    </div>
                                  </div>
                                </div>
                                {item.type === "m3u_url" && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      playlist.loadSavedItem(item);
                                      showOsd(`♻️ Обновление: ${item.name}`);
                                    }}
                                    className="p-1.5 rounded bg-black/20 hover:bg-black/50 border border-deep-azure/20 hover:border-bright-cyan/50 text-slate-400 hover:text-bright-cyan transition-all"
                                    title="Обновить плейлист с сервера"
                                  >
                                    <RotateCcw className="w-3 h-3" />
                                  </button>
                                )}
                              </div>
                            );
                          })
                        ) : (
                          filteredChannels.map((ch) => {
                            const isCurrentActive = player.activeChannel?.id === ch.id;
                            const isFav = favoriteUrls.includes(ch.url);

                            return (
                              <div
                                key={ch.id}
                                onClick={() => {
                                  player.setActiveChannel(ch);
                                  device.setShowLandscapeSidebar(false);
                                  showOsd(`📺 Канал: ${ch.name}`);
                                }}
                                className={`flex items-center justify-between gap-2 p-2 rounded-[4px] border transition-all duration-200 cursor-pointer text-left hover:scale-[1.02] active:scale-[0.98]
                                  ${isCurrentActive 
                                    ? "bg-emerald-950/40 border-emerald-500/50 text-white shadow-[0_0_10px_rgba(16,185,129,0.15)]" 
                                    : "bg-[#0A111F]/30 border-transparent hover:bg-slate-800/40 hover:border-deep-azure/20 text-slate-300"
                                  }
                                `}
                              >
                                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                  <div className="w-8 h-8 rounded-[4px] bg-black/40 border border-deep-azure/30 flex items-center justify-center p-1 flex-shrink-0">
                                    <ChannelLogo 
                                      src={ch.logo} 
                                      name={ch.name}
                                      className="max-w-full max-h-full object-contain"
                                    />
                                  </div>
                                  <div className="min-w-0">
                                    <div className="text-xs font-semibold truncate leading-tight">{ch.name}</div>
                                    <div className="text-[9px] font-mono text-slate-500 mt-0.5 truncate">
                                      {ch.originalGroup !== "None" ? ch.originalGroup : "Без группы"}
                                    </div>
                                  </div>
                                </div>

                                <div className="flex items-center gap-1">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      toggleFavorite(ch, e);
                                    }}
                                    className={`p-1 rounded transition-colors ${isFav ? "text-rose-500" : "text-slate-500 hover:text-rose-400"}`}
                                  >
                                    <Heart className={`w-3 h-3 ${isFav ? "fill-rose-500" : ""}`} />
                                  </button>
                                  {isCurrentActive && (
                                    <span className="flex h-1.5 w-1.5 relative flex-shrink-0">
                                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                      <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                                    </span>
                                  )}
                                </div>
                              </div>
                            );
                          })
                        )}
                        
                        {((selectedCategory === "Playlists" && playlist.savedItems.length === 0) || (selectedCategory !== "Playlists" && filteredChannels.length === 0)) && (
                          <div className="py-8 text-center bg-black/20 border border-deep-azure/10 rounded-[4px] px-4 flex flex-col items-center justify-center">
                            <span className="text-[11px] text-slate-500 font-sans">Список пуст</span>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

              </div>

              {/* Category Chips */}
              <div className="flex flex-col gap-2">
                <div className="flex gap-2.5 overflow-x-auto pb-2 scrollbar-none snap-x">
                  {ALL_CATEGORIES.map((cat) => {
                    const isSelected = selectedCategory === cat.id;
                    const chipId = `cat-${cat.id}`;
                    const isFocused = device.isTvMode && focusedId === chipId;
                    
                    const catCount = cat.id === "Playlists"
                      ? playlist.savedItems.length
                      : cat.id === "All"
                      ? playlist.channels.length
                      : cat.id === "Favorites"
                      ? playlist.channels.filter(ch => favoriteUrls.includes(ch.url)).length
                      : playlist.channels.filter(ch => ch.category === cat.id).length;

                    return (
                      <motion.button
                        key={cat.id}
                        id={chipId}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        animate={{ 
                          scale: isFocused ? 1.15 : 1,
                          zIndex: isFocused ? 10 : 1
                        }}
                        transition={{ type: "spring", stiffness: 350, damping: 25 }}
                        onClick={() => {
                          setSelectedCategory(cat.id);
                          setFocusedId(chipId);
                        }}
                        className={`snap-center flex-shrink-0 px-4 py-2.5 rounded-full text-xs font-semibold tracking-wide border flex items-center gap-2 cursor-pointer
                          ${isSelected 
                            ? "bg-deep-azure border-bright-cyan text-white shadow-[0_0_15px_rgba(226,232,240,0.25)]" 
                            : "bg-midnight-blue/80 border-deep-azure/40 text-slate-300 hover:border-deep-azure hover:bg-midnight-blue hover:text-white"
                          }
                          ${isFocused 
                            ? "border-2 border-bright-cyan shadow-[0_0_18px_#E2E8F0] ring-2 ring-bright-cyan/30 bg-deep-azure text-white" 
                            : ""
                          }
                        `}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? "bg-bright-cyan animate-pulse" : "bg-slate-500"}`}></span>
                        <span>{cat.ru}</span>
                        <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-mono ${isSelected ? "bg-bright-cyan/20 text-bright-cyan" : "bg-black/40 text-slate-400"}`}>
                          {catCount}
                        </span>
                      </motion.button>
                    );
                  })}
                </div>
              </div>

              {/* Search Input */}
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="🔍 Поиск каналов по названию..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-midnight-blue border border-deep-azure/60 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-bright-cyan"
                />
              </div>

              {/* Channel Grid */}
              <div className="flex flex-col gap-3">
                <div className="flex justify-between items-center text-[11px] text-slate-500 font-medium">
                  <span>{ALL_CATEGORIES.find(c => c.id === selectedCategory)?.ru}</span>
                  <span className="font-mono">
                    {selectedCategory === "Playlists" ? `${playlist.savedItems.length} источников` : `${filteredChannels.length} каналов`}
                  </span>
                </div>

                <div className="max-h-[380px] overflow-y-auto pr-1 select-none border border-deep-azure/10 rounded-[28px] p-2 bg-black/10 scrollbar-thin scrollbar-thumb-bright-cyan/20 scrollbar-track-transparent">
                  <div className="grid grid-cols-4 sm:grid-cols-4 md:grid-cols-5 gap-2 sm:gap-3">
                    <AnimatePresence mode="popLayout">
                      {selectedCategory === "Playlists" ? (
                        playlist.savedItems.map((item, idx) => {
                          const itemId = `chan-${idx}`;
                          const isFocused = device.isTvMode && focusedId === itemId;
                          const isActive = playlist.activePlaylistId === item.id;

                          return (
                            <motion.div
                              key={item.id}
                              id={itemId}
                              layout
                              initial={{ opacity: 0, scale: 0.9 }}
                              animate={{ 
                                opacity: 1, 
                                scale: isFocused ? 1.15 : 1,
                                zIndex: isFocused ? 10 : 1
                              }}
                              whileHover={{ 
                                scale: isFocused ? 1.15 : 1.05,
                                zIndex: 12
                              }}
                              exit={{ opacity: 0, scale: 0.8 }}
                              transition={{ type: "spring", stiffness: 350, damping: 25 }}
                              onClick={() => {
                                playlist.loadSavedItem(item);
                                setFocusedId(itemId);
                              }}
                              className={`group aspect-square rounded-[14px] sm:rounded-[24px] bg-midnight-blue p-2 sm:p-4 flex flex-col justify-between relative overflow-hidden border cursor-pointer
                                ${isActive 
                                  ? "border-violet-500 bg-gradient-to-b from-midnight-blue to-violet-950/20 shadow-[0_0_15px_rgba(139,92,246,0.15)]" 
                                  : "border-deep-azure/40 hover:border-deep-azure"
                                }
                                ${isFocused 
                                  ? "border-2 border-bright-cyan shadow-[0_0_20px_#E2E8F0] ring-2 ring-bright-cyan/40 bg-gradient-to-b from-midnight-blue to-deep-azure/60" 
                                  : ""
                                }
                              `}
                            >
                              <div className="flex justify-between items-start w-full">
                                <div className="w-8 h-8 sm:w-12 sm:h-12 bg-black/40 rounded-lg sm:rounded-xl border border-deep-azure/30 flex items-center justify-center p-1 sm:p-2 group-hover:scale-105 transition-transform">
                                  {item.type === "single_stream" ? (
                                    <Video className="w-3.5 sm:w-5 h-3.5 sm:h-5 text-bright-cyan" />
                                  ) : (
                                    <Database className="w-3.5 sm:w-5 h-3.5 sm:h-5 text-violet-400" />
                                  )}
                                </div>

                                <div className="flex items-center gap-1">
                                  {item.type === "m3u_url" && (
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        playlist.loadSavedItem(item);
                                        showOsd(`♻️ Обновление: ${item.name}`);
                                      }}
                                      className="p-1 sm:p-1.5 rounded-md sm:rounded-lg border bg-black/40 border-deep-azure/30 text-slate-400 hover:text-bright-cyan hover:border-bright-cyan/50 transition-all duration-200 cursor-pointer hover:scale-110 active:scale-95 z-20"
                                      title="Обновить плейлист"
                                    >
                                      <RotateCcw className="w-3 sm:w-3.5 h-3 sm:h-3.5" />
                                    </button>
                                  )}
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      playlist.handleDeleteSavedItem(item.id, e);
                                    }}
                                    className="p-1 sm:p-1.5 rounded-md sm:rounded-lg border bg-black/40 border-deep-azure/30 text-slate-400 hover:text-red-400 hover:border-red-500/50 transition-all duration-200 cursor-pointer hover:scale-110 active:scale-95 z-20"
                                    title="Удалить источник"
                                  >
                                    <Trash2 className="w-3 sm:w-3.5 h-3 sm:h-3.5" />
                                  </button>

                                  {isActive && (
                                    <span className="flex h-1.5 w-1.5 sm:h-2 sm:w-2 relative">
                                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-violet-400 opacity-75"></span>
                                      <span className="relative inline-flex rounded-full h-1.5 w-1.5 sm:h-2 sm:w-2 bg-violet-500"></span>
                                    </span>
                                  )}
                                </div>
                              </div>

                              <div className="mt-2 sm:mt-4 text-left">
                                <h4 className="text-[9px] sm:text-xs font-semibold text-white tracking-wide line-clamp-2 leading-tight group-hover:text-bright-cyan transition-colors">
                                  {item.name}
                                </h4>
                                <span className="text-[8px] sm:text-[9px] font-mono text-slate-400 mt-0.5 sm:mt-1 block uppercase">
                                  {item.type === "m3u_url" && "🔗 M3U"}
                                  {item.type === "m3u_raw" && "📝 M3U"}
                                  {item.type === "single_stream" && "🎥 HLS"}
                                </span>
                              </div>

                              {isFocused && (
                                <div className="absolute inset-0 border border-bright-cyan/20 rounded-[14px] sm:rounded-[24px] pointer-events-none animate-pulse"></div>
                              )}
                            </motion.div>
                          );
                        })
                      ) : (
                        renderedChannels.map((ch, idx) => {
                          const chanId = `chan-${idx}`;
                          const isFocused = device.isTvMode && focusedId === chanId;
                          const isCurrentActive = player.activeChannel?.id === ch.id;
                          const isFav = favoriteUrls.includes(ch.url);

                          return (
                            <motion.div
                              key={ch.id}
                              id={chanId}
                              layout
                              initial={{ opacity: 0, scale: 0.9 }}
                              animate={{ 
                                opacity: 1, 
                                scale: isFocused ? 1.15 : 1,
                                zIndex: isFocused ? 10 : 1
                              }}
                              whileHover={{ 
                                scale: isFocused ? 1.15 : 1.05,
                                zIndex: 12
                              }}
                              exit={{ opacity: 0, scale: 0.8 }}
                              transition={{ type: "spring", stiffness: 350, damping: 25 }}
                              onClick={() => {
                                player.setActiveChannel(ch);
                                setFocusedId(chanId);
                              }}
                              className={`group aspect-square rounded-[14px] sm:rounded-[24px] bg-midnight-blue p-2 sm:p-4 flex flex-col justify-between relative overflow-hidden border cursor-pointer
                                ${isCurrentActive 
                                  ? "border-emerald-500 bg-gradient-to-b from-midnight-blue to-emerald-950/20" 
                                  : "border-deep-azure/40 hover:border-deep-azure"
                                }
                                ${isFocused 
                                  ? "border-2 border-bright-cyan shadow-[0_0_20px_#E2E8F0] ring-2 ring-bright-cyan/40 bg-gradient-to-b from-midnight-blue to-deep-azure/60" 
                                  : ""
                                }
                              `}
                            >
                              <div className="flex justify-between items-start w-full">
                                <div className="w-8 h-8 sm:w-12 sm:h-12 bg-black/40 rounded-lg sm:rounded-xl border border-deep-azure/30 flex items-center justify-center p-1 sm:p-2 group-hover:scale-105 transition-transform">
                                  <ChannelLogo 
                                    src={ch.logo} 
                                    name={ch.name}
                                    className="max-w-full max-h-full object-contain"
                                  />
                                </div>

                                <div className="flex items-center gap-1">
                                  <button
                                    onClick={(e) => toggleFavorite(ch, e)}
                                    className={`p-1 sm:p-1.5 rounded-md sm:rounded-lg border transition-all duration-200 cursor-pointer hover:scale-110 active:scale-95 z-20
                                      ${isFav 
                                        ? "bg-rose-500/25 border-rose-500 text-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.3)]" 
                                        : "bg-black/40 border-deep-azure/30 text-slate-400 hover:text-rose-400 hover:border-rose-400/50"
                                      }
                                    `}
                                    title={isFav ? "Удалить из избранного" : "Добавить в избранное"}
                                  >
                                    <Heart className={`w-3 sm:w-3.5 h-3 sm:h-3.5 ${isFav ? "fill-rose-500 text-rose-500" : ""}`} />
                                  </button>

                                  {isCurrentActive && (
                                    <span className="flex h-1.5 w-1.5 sm:h-2 sm:w-2 relative">
                                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                      <span className="relative inline-flex rounded-full h-1.5 w-1.5 sm:h-2 sm:w-2 bg-emerald-500"></span>
                                    </span>
                                  )}
                                </div>
                              </div>

                              <div className="mt-2 sm:mt-4 text-left">
                                <h4 className="text-[9px] sm:text-xs font-semibold text-white tracking-wide line-clamp-2 leading-tight group-hover:text-bright-cyan transition-colors">
                                  {ch.name}
                                </h4>
                                <span className="text-[8px] sm:text-[9px] font-mono text-slate-400 mt-0.5 sm:mt-1 block truncate">
                                  {ch.originalGroup !== "None" ? ch.originalGroup : "Без группы"}
                                </span>
                              </div>

                              {isFocused && (
                                <div className="absolute inset-0 border border-bright-cyan/20 rounded-[14px] sm:rounded-[24px] pointer-events-none animate-pulse"></div>
                              )}
                            </motion.div>
                          );
                        })
                      )}
                    </AnimatePresence>

                    {((selectedCategory === "Playlists" && playlist.savedItems.length === 0) || (selectedCategory !== "Playlists" && filteredChannels.length === 0)) && (
                      <div className="col-span-full py-12 text-center bg-midnight-blue/50 border border-deep-azure/30 rounded-3xl flex flex-col items-center justify-center p-6">
                        <AlertCircle className="w-8 h-8 text-slate-500 mb-2" />
                        {selectedCategory === "Playlists" ? (
                          <>
                            <span className="text-xs text-slate-400 font-semibold font-sans">Список источников пуст</span>
                            <p className="text-[10px] text-slate-500 mt-1 max-w-xs leading-relaxed font-sans">
                              Откройте настройки, чтобы добавить новые IPTV плейлисты или HLS трансляции!
                            </p>
                          </>
                        ) : selectedCategory === "Favorites" ? (
                          <>
                            <span className="text-xs text-slate-400 font-semibold">Список избранного пуст</span>
                            <p className="text-[10px] text-slate-500 mt-1 max-w-xs leading-relaxed">
                              Нажмите на сердечко на карточке любого канала, чтобы добавить его сюда!
                            </p>
                          </>
                        ) : (
                          <>
                            <span className="text-xs text-slate-400">Нет доступных каналов в этой категории</span>
                            <p className="text-[10px] text-slate-500 mt-1 max-w-xs leading-relaxed">
                              Попробуйте очистить фильтр поиска или сбросить плейлист к стандартному.
                            </p>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {selectedCategory !== "Playlists" && filteredChannels.length > 10 && (
                  <div className="text-[10px] text-slate-500 font-mono text-center flex items-center justify-center gap-1 mt-1 animate-pulse">
                    <span>Более 10 каналов в этой категории, используйте прокрутку (скролл) 👇</span>
                  </div>
                )}

                {selectedCategory !== "Playlists" && filteredChannels.length > visibleCount && (
                  <div className="flex justify-center mt-3">
                    <button
                      onClick={() => setVisibleCount(prev => prev + 40)}
                      className="px-6 py-2.5 bg-midnight-blue hover:bg-deep-azure border border-deep-azure/60 hover:border-bright-cyan text-xs font-semibold rounded-full flex items-center gap-2 text-bright-cyan hover:text-white transition-all shadow-md active:scale-95 cursor-pointer font-sans"
                    >
                      <Plus className="w-4 h-4 text-bright-cyan" />
                      <span>Показать еще (+40 каналов, осталось {filteredChannels.length - visibleCount})</span>
                    </button>
                  </div>
                )}
              </div>

            </div>
          </div>

          {/* D-Pad Controller */}
          {device.isTvMode && (
            <motion.div 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-midnight-blue/60 border border-deep-azure/50 rounded-3xl p-5 flex flex-col md:flex-row items-center gap-6 shadow-[0_15px_35px_rgba(0,0,0,0.5)]"
            >
              <div className="relative w-36 h-36 flex items-center justify-center bg-pure-black border border-deep-azure rounded-full shadow-[0_0_20px_rgba(0,0,0,0.8)] flex-shrink-0">
                <button onClick={() => triggerTvDpad("Up")} className="absolute top-2 w-10 h-8 hover:bg-deep-azure/60 text-slate-400 hover:text-bright-cyan rounded-t-lg flex items-center justify-center transition-colors border border-deep-azure/20 active:scale-95" title="Вверх">
                  <ArrowUp className="w-5 h-5" />
                </button>
                <button onClick={() => triggerTvDpad("Down")} className="absolute bottom-2 w-10 h-8 hover:bg-deep-azure/60 text-slate-400 hover:text-bright-cyan rounded-b-lg flex items-center justify-center transition-colors border border-deep-azure/20 active:scale-95" title="Вниз">
                  <ArrowDown className="w-5 h-5" />
                </button>
                <button onClick={() => triggerTvDpad("Left")} className="absolute left-2 w-8 h-10 hover:bg-deep-azure/60 text-slate-400 hover:text-bright-cyan rounded-l-lg flex items-center justify-center transition-colors border border-deep-azure/20 active:scale-95" title="Влево">
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <button onClick={() => triggerTvDpad("Right")} className="absolute right-2 w-8 h-10 hover:bg-deep-azure/60 text-slate-400 hover:text-bright-cyan rounded-r-lg flex items-center justify-center transition-colors border border-deep-azure/20 active:scale-95" title="Вправо">
                  <ArrowRight className="w-5 h-5" />
                </button>
                <button onClick={() => triggerTvDpad("Enter")} className="w-14 h-14 bg-deep-azure hover:bg-bright-cyan hover:text-pure-black border border-bright-cyan/40 text-white rounded-full font-bold text-xs flex items-center justify-center transition-all shadow-[0_0_10px_rgba(226,232,240,0.2)] active:scale-90" title="Выбрать / ОК">
                  ОК
                </button>
              </div>

              <div className="flex-1 flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 bg-bright-cyan/10 text-bright-cyan rounded text-[10px] uppercase font-mono tracking-wider">
                    D-PAD СИМУЛЯТОР TV
                  </span>
                  <span className="text-xs text-slate-400">Пульт ДУ активен</span>
                </div>
                <p className="text-xs text-slate-400">
                  Используйте стрелки клавиатуры или пульт для навигации. <strong>Enter</strong> — выбор, <strong>Esc</strong> — назад.
                </p>
                <div className="text-[10px] text-slate-500 font-mono">
                  Фокус: <span className="text-bright-cyan">{focusedId}</span>
                </div>
              </div>
            </motion.div>
          )}

        </section>

      </main>

      {/* Settings Modal */}
      <AnimatePresence>
        {showSettingsModal && (
          <SettingsModal
            isOpen={showSettingsModal}
            onClose={() => setShowSettingsModal(false)}
            savedItems={playlist.savedItems}
            activePlaylistId={playlist.activePlaylistId}
            onLoadSavedItem={playlist.loadSavedItem}
            onDeleteSavedItem={playlist.handleDeleteSavedItem}
            onAddSavedItem={playlist.handleAddSavedItem}
            isAutoPlayEnabled={player.isAutoPlayEnabled}
            setIsAutoPlayEnabled={player.setIsAutoPlayEnabled}
            onScanActivePlaylist={() => scanner.scanChannels(playlist.channels)}
            isScanning={scanner.isScanning}
          />
        )}
      </AnimatePresence>

      {/* Hotkeys Button */}
      <div className="fixed bottom-6 right-6 z-45 hidden md:block">
        <button
          onClick={() => setShowHotkeysModal(true)}
          className="flex items-center gap-2 px-3.5 py-2 bg-[#0A111F]/90 hover:bg-bright-cyan hover:text-pure-black border border-deep-azure/50 hover:border-bright-cyan rounded-full text-slate-300 font-sans text-xs transition-all duration-300 shadow-xl cursor-pointer hover:scale-105 active:scale-95 group shadow-bright-cyan/5"
          title="Горячие клавиши управления плеером"
        >
          <Keyboard className="w-3.5 h-3.5 text-bright-cyan group-hover:text-pure-black transition-colors" />
          <span className="font-semibold">Горячие клавиши</span>
        </button>
      </div>

      {/* Hotkeys Modal */}
      <AnimatePresence>
        {showHotkeysModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4"
            onClick={() => setShowHotkeysModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 350 }}
              className="bg-midnight-blue border border-bright-cyan/30 rounded-[32px] p-6 max-w-sm w-full relative shadow-[0_20px_50px_rgba(226,232,240,0.15)] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-bright-cyan/5 rounded-full blur-3xl pointer-events-none" />
              
              <div className="flex justify-between items-center mb-5">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-bright-cyan/15 rounded-lg border border-bright-cyan/30">
                    <Keyboard className="w-4 h-4 text-bright-cyan" />
                  </div>
                  <h3 className="font-sans font-bold text-sm uppercase tracking-wider text-white">
                    Горячие клавиши
                  </h3>
                </div>
                <button
                  onClick={() => setShowHotkeysModal(false)}
                  className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex flex-col gap-3.5 font-sans">
                <div className="text-[11px] text-slate-400 font-medium leading-relaxed mb-1">
                  Используйте клавиши клавиатуры на вашем компьютере для быстрого и удобного управления плеером:
                </div>

                <div className="grid grid-cols-1 gap-2.5">
                  <div className="flex items-center justify-between p-2.5 bg-pure-black/40 rounded-xl border border-deep-azure/20">
                    <span className="text-xs text-slate-300 font-medium">Воспроизведение / Пауза</span>
                    <kbd className="px-2 py-0.5 bg-bright-cyan/10 border border-bright-cyan/30 rounded text-bright-cyan font-mono text-[10px] font-bold shadow-sm">Space</kbd>
                  </div>
                  <div className="flex items-center justify-between p-2.5 bg-pure-black/40 rounded-xl border border-deep-azure/20">
                    <span className="text-xs text-slate-300 font-medium">Вкл / Выкл звук</span>
                    <kbd className="px-2 py-0.5 bg-[#0A111F] border border-deep-azure/40 rounded text-slate-300 font-mono text-[10px] font-bold shadow-sm">M</kbd>
                  </div>
                  <div className="flex items-center justify-between p-2.5 bg-pure-black/40 rounded-xl border border-deep-azure/20">
                    <span className="text-xs text-slate-300 font-medium">Регулировка громкости</span>
                    <kbd className="px-2 py-0.5 bg-[#0A111F] border border-deep-azure/40 rounded text-slate-300 font-mono text-[10px] font-bold shadow-sm">+ / -</kbd>
                  </div>
                  <div className="flex items-center justify-between p-2.5 bg-pure-black/40 rounded-xl border border-deep-azure/20">
                    <span className="text-xs text-slate-300 font-medium">Во весь экран</span>
                    <kbd className="px-2 py-0.5 bg-[#0A111F] border border-deep-azure/40 rounded text-slate-300 font-mono text-[10px] font-bold shadow-sm">F</kbd>
                  </div>
                  <div className="flex items-center justify-between p-2.5 bg-pure-black/40 rounded-xl border border-deep-azure/20">
                    <div className="flex flex-col">
                      <span className="text-xs text-slate-300 font-medium">Навигация в TV-режиме</span>
                      <span className="text-[9px] text-slate-500 font-mono">Перемещение по сетке</span>
                    </div>
                    <kbd className="px-2 py-0.5 bg-[#0A111F] border border-deep-azure/40 rounded text-slate-300 font-mono text-[10px] font-bold shadow-sm">↑ ↓ ← →</kbd>
                  </div>
                  <div className="flex items-center justify-between p-2.5 bg-pure-black/40 rounded-xl border border-deep-azure/20">
                    <span className="text-xs text-slate-300 font-medium">Выбрать канал / ОК</span>
                    <kbd className="px-2 py-0.5 bg-[#0A111F] border border-deep-azure/40 rounded text-slate-300 font-mono text-[10px] font-bold shadow-sm">Enter</kbd>
                  </div>
                  <div className="flex items-center justify-between p-2.5 bg-pure-black/40 rounded-xl border border-deep-azure/20">
                    <span className="text-xs text-slate-300 font-medium">Назад к категориям</span>
                    <kbd className="px-2 py-0.5 bg-[#0A111F] border border-deep-azure/40 rounded text-slate-300 font-mono text-[10px] font-bold shadow-sm">Esc / Backspace</kbd>
                  </div>
                </div>

                <div className="mt-2 text-center">
                  <button
                    onClick={() => setShowHotkeysModal(false)}
                    className="px-6 py-2.5 bg-bright-cyan hover:bg-white text-pure-black text-xs font-bold rounded-xl transition-all shadow-md shadow-bright-cyan/5 active:scale-95 cursor-pointer w-full font-sans"
                  >
                    Понятно
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer */}
      <footer className="border-t border-deep-azure/30 bg-midnight-blue/20 py-4 px-6 text-center text-xs text-slate-500 font-mono flex justify-between items-center gap-4 flex-wrap z-10">
        <div className="flex items-center gap-3">
          <span>© 2026 Android IPTV Player Codegen &amp; Simulator</span>
          <button 
            onClick={() => setShowHotkeysModal(true)}
            className="px-2 py-0.5 rounded bg-bright-cyan/15 hover:bg-bright-cyan/25 border border-bright-cyan/30 text-bright-cyan hover:text-white transition-all cursor-pointer font-sans text-[11px] font-semibold flex items-center gap-1"
          >
            <Keyboard className="w-3 h-3" />
            <span>Клавиши управления (Space, M, F)</span>
          </button>
        </div>
        <div className="flex items-center gap-3">
          <span className="px-2 py-0.5 rounded bg-midnight-blue border border-deep-azure/30">Jetpack Compose 1.6+</span>
          <span className="px-2 py-0.5 rounded bg-midnight-blue border border-deep-azure/30">Media3 ExoPlayer 1.2+</span>
          <span className="px-2 py-0.5 rounded bg-midnight-blue border border-bright-cyan/20 text-bright-cyan">Paging 3</span>
        </div>
      </footer>

      {/* Volume HUD */}
      <AnimatePresence>
        {volumeHud.showVolumeHud && (
          <motion.div
            initial={{ opacity: 0, x: 50, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 50, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 400, damping: 28 }}
            className={`fixed z-50 ${
              device.isTvMode 
                ? "right-10 top-1/2 -translate-y-1/2" 
                : "right-4 top-1/3"
            }`}
          >
            {device.isTvMode ? (
              <div className="bg-black/90 backdrop-blur-md border border-slate-800 rounded-2xl p-3.5 flex flex-col items-center gap-3.5 shadow-2xl shadow-black/80 w-[46px]">
                <span className="text-[10px] font-mono font-bold text-slate-400">
                  {player.isMuted ? "MUTE" : `${Math.round(player.volume * 100)}%`}
                </span>
                <div className="w-2.5 h-36 bg-slate-800 rounded-full relative overflow-hidden flex flex-col justify-end">
                  <motion.div 
                    animate={{ height: `${player.isMuted ? 0 : player.volume * 100}%` }}
                    transition={{ type: "spring", stiffness: 300, damping: 25 }}
                    className="w-full bg-bright-cyan rounded-full shadow-[0_0_8px_#E2E8F0]" 
                  />
                </div>
                <div className="p-1.5 bg-slate-900 rounded-full border border-slate-800">
                  <Volume2 className={`w-4 h-4 ${player.isMuted ? "text-rose-400 line-through" : "text-bright-cyan"}`} />
                </div>
              </div>
            ) : (
              <div className="bg-black/85 backdrop-blur-md border border-slate-800/80 rounded-2xl py-3 px-2.5 flex flex-col items-center gap-2.5 shadow-xl w-10">
                <div className="w-1.5 h-24 bg-slate-800/80 rounded-full relative overflow-hidden flex flex-col justify-end">
                  <motion.div 
                    animate={{ height: `${player.isMuted ? 0 : player.volume * 100}%` }}
                    className="w-full bg-bright-cyan rounded-full" 
                  />
                </div>
                <Volume2 className={`w-3.5 h-3.5 ${player.isMuted ? "text-rose-400 line-through" : "text-slate-400"}`} />
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Scanning Overlay */}
      <AnimatePresence>
        {scanner.isScanning && scanner.scanProgress && (
          <motion.div
            initial={{ opacity: 0, y: 50, x: "-50%" }}
            animate={{ opacity: 1, y: 0, x: "-50%" }}
            exit={{ opacity: 0, y: 50, x: "-50%" }}
            className="fixed bottom-24 left-1/2 z-50 bg-[#070B14]/95 border border-bright-cyan/40 px-5 py-3.5 rounded-2xl flex flex-col gap-2.5 shadow-[0_0_20px_rgba(226,232,240,0.25)] w-[90%] max-w-sm"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-bright-cyan animate-ping" />
                <span className="text-xs font-bold text-white uppercase tracking-wider font-sans">
                  Сканирование каналов...
                </span>
              </div>
              <button
                onClick={scanner.cancelScan}
                className="text-[10px] font-mono font-bold bg-red-950/40 hover:bg-red-900/40 border border-red-500/30 px-2 py-0.5 rounded text-red-400 hover:text-white transition-colors cursor-pointer"
              >
                Отмена
              </button>
            </div>

            <div className="flex flex-col gap-1">
              <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                <span>Прогресс: {scanner.scanProgress.current} / {scanner.scanProgress.total}</span>
                <span className="text-bright-cyan font-bold">Доступно: {scanner.scanProgress.availableCount}</span>
              </div>
              
              <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-bright-cyan shadow-[0_0_8px_#E2E8F0]"
                  style={{ width: `${(scanner.scanProgress.current / scanner.scanProgress.total) * 100}%` }}
                />
              </div>
            </div>

            <span className="text-[9px] text-slate-500 font-mono italic truncate">
              Удаляем недоступные потоки из вещания...
            </span>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
