import { useState, useEffect, useRef, useCallback } from "react";
import Hls from "hls.js";
import type { Channel } from "../samplePlaylist";

export function usePlayer(
  addParserLogs: (logs: string[]) => void,
) {
  const [activeChannel, setActiveChannel] = useState<Channel | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [volume, setVolume] = useState<number>(0.2);
  const [playerError, setPlayerError] = useState<string | null>(null);
  const [useFallbackVisualizer, setUseFallbackVisualizer] = useState<boolean>(false);
  const [aspectRatioMode, setAspectRatioMode] = useState<"contain" | "cover" | "fill">("contain");
  const [autoPlayCountdown, setAutoPlayCountdown] = useState<number | null>(null);
  const [isAutoPlayEnabled, setIsAutoPlayEnabled] = useState<boolean>(true);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const hlsRef = useRef<Hls | null>(null);

  const playNextChannelRef = useRef<(() => void) | null>(null);
  const playPrevChannelRef = useRef<(() => void) | null>(null);

  const setPlayNextChannel = useCallback((fn: () => void) => {
    playNextChannelRef.current = fn;
  }, []);

  const setPlayPrevChannel = useCallback((fn: () => void) => {
    playPrevChannelRef.current = fn;
  }, []);

  useEffect(() => {
    try {
      const volPercent = Math.round((isMuted ? 0 : volume) * 100);
      const win = window as unknown as Record<string, unknown>;
      const android = win.Android as { setSystemVolume?: (v: number) => void } | undefined;
      const tizen = win.tizen as { tvaudiocontrol?: { setVolume: (v: number) => void } } | undefined;
      if (android?.setSystemVolume) {
        android.setSystemVolume(volPercent);
      }
      if (tizen?.tvaudiocontrol) {
        tizen.tvaudiocontrol.setVolume(volPercent);
      }
    } catch (err) {
      console.warn("Native device volume bridge error:", err);
    }
  }, [volume, isMuted]);

  useEffect(() => {
    if (!activeChannel) return;

    setPlayerError(null);
    setUseFallbackVisualizer(false);
    setIsPlaying(true);
    setAutoPlayCountdown(null);

    const video = videoRef.current;
    if (!video) return;

    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    const streamUrl = activeChannel.url;

    const handleLoadedMetadata = () => {
      video.play().catch(e => {
        console.warn("Native HLS play blocked or failed, using simulation: ", e);
        setUseFallbackVisualizer(true);
      });
    };

    const handleNativeError = () => {
      console.warn("Native HLS failed to load stream, using simulation visualizer.");
      setUseFallbackVisualizer(true);
    };

    if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = streamUrl;
      video.addEventListener("loadedmetadata", handleLoadedMetadata);
      video.addEventListener("error", handleNativeError);
    } else if (Hls.isSupported()) {
      const hls = new Hls({
        maxMaxBufferLength: 10,
        enableWorker: true,
        lowLatencyMode: true,
      });
      hlsRef.current = hls;
      hls.loadSource(streamUrl);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        video.play().catch(e => {
          console.warn("HlsJS playback blocked, using simulation visualizer: ", e);
          setUseFallbackVisualizer(true);
        });
      });

      hls.on(Hls.Events.ERROR, (event, data) => {
        if (data.fatal) {
          console.warn(`HlsJS fatal error: ${data.type} - ${data.details}. Loading visualizer fallback.`);
          setUseFallbackVisualizer(true);
          hls.destroy();
          hlsRef.current = null;
        }
      });
    } else {
      setUseFallbackVisualizer(true);
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
      video.removeEventListener("loadedmetadata", handleLoadedMetadata);
      video.removeEventListener("error", handleNativeError);
    };
  }, [activeChannel]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (isPlaying) {
      video.play().catch(() => {});
    } else {
      video.pause();
    }
  }, [isPlaying]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = isMuted;
    video.volume = volume;
  }, [isMuted, volume]);

  useEffect(() => {
    if (useFallbackVisualizer && activeChannel && isAutoPlayEnabled) {
      setAutoPlayCountdown(10);
      addParserLogs([`⚠️ Поток "${activeChannel.name}" недоступен. Запуск 10-секундного таймера автопереключения...`]);
    } else {
      setAutoPlayCountdown(null);
    }
  }, [useFallbackVisualizer, activeChannel, isAutoPlayEnabled, addParserLogs]);

  useEffect(() => {
    if (autoPlayCountdown === null) return;
    if (autoPlayCountdown <= 0) {
      setAutoPlayCountdown(null);
      playNextChannelRef.current?.();
      return;
    }
    const timer = setTimeout(() => {
      setAutoPlayCountdown(prev => (prev !== null ? prev - 1 : null));
    }, 1000);
    return () => clearTimeout(timer);
  }, [autoPlayCountdown]);

  return {
    activeChannel,
    setActiveChannel,
    isPlaying,
    setIsPlaying,
    isMuted,
    setIsMuted,
    volume,
    setVolume,
    playerError,
    setPlayerError,
    useFallbackVisualizer,
    setUseFallbackVisualizer,
    aspectRatioMode,
    setAspectRatioMode,
    autoPlayCountdown,
    setAutoPlayCountdown,
    isAutoPlayEnabled,
    setIsAutoPlayEnabled,
    videoRef,
    hlsRef,
    setPlayNextChannel,
    setPlayPrevChannel,
  };
}
