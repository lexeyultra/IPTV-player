import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useParserLogs } from "../hooks/useParserLogs";
import { useOsd } from "../hooks/useOsd";
import { useFavorites } from "../hooks/useFavorites";
import { useControlsTimer } from "../hooks/useControlsTimer";
import { useVolumeHud } from "../hooks/useVolumeHud";

describe("useParserLogs", () => {
  it("starts with empty logs", () => {
    const { result } = renderHook(() => useParserLogs());
    expect(result.current.parserLogs).toEqual([]);
  });

  it("adds logs via addParserLogs", () => {
    const { result } = renderHook(() => useParserLogs());
    act(() => {
      result.current.addParserLogs(["test log 1", "test log 2"]);
    });
    expect(result.current.parserLogs).toEqual(["test log 1", "test log 2"]);
  });

  it("appends logs to existing ones", () => {
    const { result } = renderHook(() => useParserLogs());
    act(() => {
      result.current.addParserLogs(["log 1"]);
    });
    act(() => {
      result.current.addParserLogs(["log 2"]);
    });
    expect(result.current.parserLogs).toEqual(["log 1", "log 2"]);
  });

  it("limits logs to 200 entries", () => {
    const { result } = renderHook(() => useParserLogs());
    act(() => {
      const manyLogs = Array.from({ length: 250 }, (_, i) => `log ${i}`);
      result.current.addParserLogs(manyLogs);
    });
    expect(result.current.parserLogs.length).toBe(200);
    expect(result.current.parserLogs[0]).toBe("log 50");
    expect(result.current.parserLogs[199]).toBe("log 249");
  });

  it("supports functional updater", () => {
    const { result } = renderHook(() => useParserLogs());
    act(() => {
      result.current.addParserLogs(["initial"]);
    });
    act(() => {
      result.current.addParserLogs((prev) => ["from updater"]);
    });
    expect(result.current.parserLogs).toEqual(["initial", "from updater"]);
  });
});

describe("useOsd", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  it("starts with null message", () => {
    const { result } = renderHook(() => useOsd());
    expect(result.current.osdMessage).toBeNull();
  });

  it("shows OSD message", () => {
    const { result } = renderHook(() => useOsd());
    act(() => {
      result.current.showOsd("Hello");
    });
    expect(result.current.osdMessage).toBe("Hello");
  });

  it("clears OSD message after timeout", () => {
    const { result } = renderHook(() => useOsd());
    act(() => {
      result.current.showOsd("Hello");
    });
    act(() => {
      vi.advanceTimersByTime(1500);
    });
    expect(result.current.osdMessage).toBeNull();
  });

  it("replaces previous message on new showOsd call", () => {
    const { result } = renderHook(() => useOsd());
    act(() => {
      result.current.showOsd("First");
    });
    act(() => {
      result.current.showOsd("Second");
    });
    expect(result.current.osdMessage).toBe("Second");
  });
});

describe("useFavorites", () => {
  const mockAddLogs = vi.fn();

  beforeEach(() => {
    mockAddLogs.mockClear();
    localStorage.clear();
  });

  it("starts with empty favorites", () => {
    const { result } = renderHook(() => useFavorites(mockAddLogs));
    expect(result.current.favoriteUrls).toEqual([]);
  });

  it("toggles favorite on", () => {
    const { result } = renderHook(() => useFavorites(mockAddLogs));
    act(() => {
      result.current.toggleFavorite({ url: "http://test.com", name: "Test" } as any);
    });
    expect(result.current.favoriteUrls).toContain("http://test.com");
  });

  it("toggles favorite off", () => {
    const { result } = renderHook(() => useFavorites(mockAddLogs));
    act(() => {
      result.current.toggleFavorite({ url: "http://test.com", name: "Test" } as any);
    });
    act(() => {
      result.current.toggleFavorite({ url: "http://test.com", name: "Test" } as any);
    });
    expect(result.current.favoriteUrls).not.toContain("http://test.com");
  });

  it("calls addParserLogs with correct message", () => {
    const { result } = renderHook(() => useFavorites(mockAddLogs));
    act(() => {
      result.current.toggleFavorite({ url: "http://test.com", name: "My Channel" } as any);
    });
    expect(mockAddLogs).toHaveBeenCalledWith(["💖 Добавлен в избранное: \"My Channel\""]);
  });
});

describe("useControlsTimer", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  it("starts with controls visible", () => {
    const { result } = renderHook(() => useControlsTimer());
    expect(result.current.showPlayerControls).toBe(true);
  });

  it("hides controls after 15 seconds", () => {
    const { result } = renderHook(() => useControlsTimer());
    act(() => {
      result.current.resetControlsTimer();
    });
    act(() => {
      vi.advanceTimersByTime(15000);
    });
    expect(result.current.showPlayerControls).toBe(false);
  });

  it("resets timer on resetControlsTimer call", () => {
    const { result } = renderHook(() => useControlsTimer());
    act(() => {
      result.current.resetControlsTimer();
    });
    act(() => {
      vi.advanceTimersByTime(10000);
    });
    act(() => {
      result.current.resetControlsTimer();
    });
    act(() => {
      vi.advanceTimersByTime(10000);
    });
    expect(result.current.showPlayerControls).toBe(true);
  });
});

describe("useVolumeHud", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  it("starts with HUD hidden", () => {
    const { result } = renderHook(() => useVolumeHud());
    expect(result.current.showVolumeHud).toBe(false);
  });

  it("shows HUD on trigger", () => {
    const { result } = renderHook(() => useVolumeHud());
    act(() => {
      result.current.triggerVolumeHud();
    });
    expect(result.current.showVolumeHud).toBe(true);
  });

  it("hides HUD after 2 seconds", () => {
    const { result } = renderHook(() => useVolumeHud());
    act(() => {
      result.current.triggerVolumeHud();
    });
    act(() => {
      vi.advanceTimersByTime(2000);
    });
    expect(result.current.showVolumeHud).toBe(false);
  });

  it("resets timer on multiple triggers", () => {
    const { result } = renderHook(() => useVolumeHud());
    act(() => {
      result.current.triggerVolumeHud();
    });
    act(() => {
      vi.advanceTimersByTime(1500);
    });
    act(() => {
      result.current.triggerVolumeHud();
    });
    act(() => {
      vi.advanceTimersByTime(1500);
    });
    expect(result.current.showVolumeHud).toBe(true);
  });
});
