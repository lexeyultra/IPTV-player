import { describe, it, expect, vi } from "vitest";
import {
  parseM3UPlaylist,
  getSmartLogo,
  SAMPLE_M3U_PLAYLIST,
  CATEGORIES,
} from "../samplePlaylist";

describe("parseM3UPlaylist", () => {
  it("parses a valid M3U playlist with multiple channels", () => {
    const channels = parseM3UPlaylist(SAMPLE_M3U_PLAYLIST);
    expect(channels.length).toBeGreaterThan(0);
    channels.forEach((ch) => {
      expect(ch.id).toBeTruthy();
      expect(ch.name).toBeTruthy();
      expect(ch.url).toMatch(/^https?:\/\//);
      expect(ch.category).toBeTruthy();
    });
  });

  it("extracts channel name from #EXTINF line", () => {
    const m3u = `#EXTM3U
#EXTINF:-1 group-title="News", My News Channel
http://example.com/stream.m3u8`;
    const channels = parseM3UPlaylist(m3u);
    expect(channels).toHaveLength(1);
    expect(channels[0].name).toBe("My News Channel");
  });

  it("extracts group-title from #EXTINF line", () => {
    const m3u = `#EXTM3U
#EXTINF:-1 group-title="Sports", ESPN Live
http://example.com/espn.m3u8`;
    const channels = parseM3UPlaylist(m3u);
    expect(channels[0].originalGroup).toBe("Sports");
  });

  it("extracts tvg-logo from #EXTINF line", () => {
    const m3u = `#EXTM3U
#EXTINF:-1 tvg-logo="http://logo.png" group-title="Music", Music TV
http://example.com/music.m3u8`;
    const channels = parseM3UPlaylist(m3u);
    expect(channels[0].logo).toBe("http://logo.png");
  });

  it("uses 'None' when group-title is missing", () => {
    const m3u = `#EXTM3U
#EXTINF:-1, Random Channel
http://example.com/random.m3u8`;
    const channels = parseM3UPlaylist(m3u);
    expect(channels[0].originalGroup).toBe("None");
  });

  it("assigns default name when #EXTINF has no comma", () => {
    const m3u = `#EXTM3U
#EXTINF:-1 group-title="Kids"
http://example.com/kids.m3u8`;
    const channels = parseM3UPlaylist(m3u);
    expect(channels[0].name).toBe("Неизвестный канал");
  });

  it("skips URLs without preceding #EXTINF", () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const m3u = `#EXTM3U
http://orphan-url.com/stream.m3u8
#EXTINF:-1 group-title="News", Valid Channel
http://example.com/valid.m3u8`;
    const channels = parseM3UPlaylist(m3u);
    expect(channels).toHaveLength(1);
    expect(channels[0].name).toBe("Valid Channel");
    warnSpy.mockRestore();
  });

  it("skips non-URL lines shorter than 6 chars after #EXTINF", () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const m3u = `#EXTM3U
#EXTINF:-1 group-title="News", Broken Channel
abc
#EXTINF:-1 group-title="Music", Good Channel
http://example.com/good.m3u8`;
    const channels = parseM3UPlaylist(m3u);
    expect(channels).toHaveLength(1);
    expect(channels[0].name).toBe("Good Channel");
    warnSpy.mockRestore();
  });

  it("returns empty array for empty input", () => {
    expect(parseM3UPlaylist("")).toEqual([]);
  });

  it("returns empty array for only comments", () => {
    expect(parseM3UPlaylist("#EXTM3U\n# some comment")).toEqual([]);
  });

  it("handles Windows-style line endings (\\r\\n)", () => {
    const m3u = "#EXTM3U\r\n#EXTINF:-1 group-title=\"News\", Win Channel\r\nhttp://example.com/win.m3u8";
    const channels = parseM3UPlaylist(m3u);
    expect(channels).toHaveLength(1);
    expect(channels[0].name).toBe("Win Channel");
  });

  it("parses multiple channels correctly", () => {
    const m3u = `#EXTM3U
#EXTINF:-1 group-title="Kids", Channel A
http://a.com/stream.m3u8
#EXTINF:-1 group-title="Sports", Channel B
http://b.com/stream.m3u8
#EXTINF:-1 group-title="News", Channel C
http://c.com/stream.m3u8`;
    const channels = parseM3UPlaylist(m3u);
    expect(channels).toHaveLength(3);
    expect(channels.map((c) => c.name)).toEqual(["Channel A", "Channel B", "Channel C"]);
  });

  it("generates unique IDs for channels", () => {
    const m3u = `#EXTM3U
#EXTINF:-1 group-title="News", Same Name
http://a.com/stream.m3u8
#EXTINF:-1 group-title="Music", Same Name
http://b.com/stream.m3u8`;
    const channels = parseM3UPlaylist(m3u);
    expect(channels[0].id).not.toBe(channels[1].id);
  });

  it("accepts rtmp:// URLs", () => {
    const m3u = `#EXTM3U
#EXTINF:-1 group-title="Other", RTMP Stream
rtmp://example.com/live/stream`;
    const channels = parseM3UPlaylist(m3u);
    expect(channels).toHaveLength(1);
    expect(channels[0].url).toContain("rtmp://");
  });
});

describe("getSmartLogo", () => {
  it("returns parsed logo if valid", () => {
    expect(getSmartLogo("Any", "http://logo.png")).toBe("http://logo.png");
  });

  it("ignores empty parsed logo", () => {
    const logo = getSmartLogo("NASA TV", "");
    expect(logo).toContain("rocket");
  });

  it("ignores unsplash logos", () => {
    const logo = getSmartLogo("Kids TV", "https://unsplash.com/photo.jpg");
    expect(logo).not.toContain("unsplash");
  });

  it("returns NASA logo for NASA channels", () => {
    expect(getSmartLogo("NASA TV", "")).toContain("rocket");
  });

  it("returns kids logo for cartoon channels", () => {
    expect(getSmartLogo("Cartoon Network", "")).toContain("baby-chick");
  });

  it("returns movie logo for cinema channels", () => {
    expect(getSmartLogo("Classic Cinema", "")).toContain("clapper-board");
  });

  it("returns sport logo for red bull", () => {
    expect(getSmartLogo("Red Bull TV", "")).toContain("soccer-ball");
  });

  it("returns music logo for music channels", () => {
    expect(getSmartLogo("Deluxe Music", "")).toContain("headphone");
  });

  it("returns news logo for euronews", () => {
    expect(getSmartLogo("Euronews", "")).toContain("newspaper");
  });

  it("returns default TV logo for unknown channels", () => {
    expect(getSmartLogo("Random Channel XYZ", "")).toContain("television");
  });
});

describe("CATEGORIES", () => {
  it("has 8 categories", () => {
    expect(CATEGORIES).toHaveLength(8);
  });

  it("each category has required fields", () => {
    CATEGORIES.forEach((cat) => {
      expect(cat.id).toBeTruthy();
      expect(cat.ru).toBeTruthy();
      expect(cat.en).toBeTruthy();
      expect(cat.color).toBeTruthy();
    });
  });

  it("includes all expected category IDs", () => {
    const ids = CATEGORIES.map((c) => c.id);
    expect(ids).toContain("Kids");
    expect(ids).toContain("Family");
    expect(ids).toContain("Science");
    expect(ids).toContain("Music");
    expect(ids).toContain("Movies");
    expect(ids).toContain("Sports");
    expect(ids).toContain("News");
    expect(ids).toContain("Other");
  });
});

describe("Category determination (integration)", () => {
  it("classifies kids channels by group-title", () => {
    const m3u = `#EXTM3U
#EXTINF:-1 group-title="Kids", Some Kids Show
http://example.com/kids.m3u8`;
    const channels = parseM3UPlaylist(m3u);
    expect(channels[0].category).toBe("Kids");
  });

  it("classifies news channels by group-title", () => {
    const m3u = `#EXTM3U
#EXTINF:-1 group-title="News", Breaking News
http://example.com/news.m3u8`;
    const channels = parseM3UPlaylist(m3u);
    expect(channels[0].category).toBe("News");
  });

  it("classifies music channels by group-title", () => {
    const m3u = `#EXTM3U
#EXTINF:-1 group-title="Music", Music TV
http://example.com/music.m3u8`;
    const channels = parseM3UPlaylist(m3u);
    expect(channels[0].category).toBe("Music");
  });

  it("classifies by channel name keywords when no group-title", () => {
    const m3u = `#EXTM3U
#EXTINF:-1, Discovery Nature Documentary
http://example.com/discovery.m3u8`;
    const channels = parseM3UPlaylist(m3u);
    expect(channels[0].category).toBe("Science");
  });

  it("falls back to Other for unclassified channels", () => {
    const m3u = `#EXTM3U
#EXTINF:-1, Generic Channel XYZ
http://example.com/generic.m3u8`;
    const channels = parseM3UPlaylist(m3u);
    expect(channels[0].category).toBe("Other");
  });

  it("classifies Russian keyword 'новости' as News", () => {
    const m3u = `#EXTM3U
#EXTINF:-1, Новости 24
http://example.com/news24.m3u8`;
    const channels = parseM3UPlaylist(m3u);
    expect(channels[0].category).toBe("News");
  });

  it("classifies Russian keyword 'фильм' as Movies", () => {
    const m3u = `#EXTM3U
#EXTINF:-1, Фильм HD
http://example.com/film.m3u8`;
    const channels = parseM3UPlaylist(m3u);
    expect(channels[0].category).toBe("Movies");
  });

  it("group-title takes precedence over name keywords", () => {
    const m3u = `#EXTM3U
#EXTINF:-1 group-title="Sports", News About Sports
http://example.com/sportsnews.m3u8`;
    const channels = parseM3UPlaylist(m3u);
    expect(channels[0].category).toBe("Sports");
  });
});
