import { useState, useEffect, useCallback } from "react";
import type { Channel } from "../samplePlaylist";

export function useFavorites(addParserLogs: (logs: string[]) => void) {
  const [favoriteUrls, setFavoriteUrls] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem("iptv_favorite_urls");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem("iptv_favorite_urls", JSON.stringify(favoriteUrls));
  }, [favoriteUrls]);

  const toggleFavorite = useCallback((ch: Channel, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }
    const isAlreadyFav = favoriteUrls.includes(ch.url);
    if (isAlreadyFav) {
      addParserLogs([`🤍 Удален из избранного: "${ch.name}"`]);
    } else {
      addParserLogs([`💖 Добавлен в избранное: "${ch.name}"`]);
    }
    setFavoriteUrls(prev =>
      isAlreadyFav ? prev.filter(url => url !== ch.url) : [...prev, ch.url]
    );
  }, [favoriteUrls, addParserLogs]);

  return { favoriteUrls, toggleFavorite };
}
