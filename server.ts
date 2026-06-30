import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import dns from "node:dns/promises";
import net from "node:net";
import rateLimit from "express-rate-limit";
import helmet from "helmet";

const MAX_PROXY_RESPONSE_BYTES = 2 * 1024 * 1024; // 2MB upper bound for M3U payloads

function isPrivateIpv4(ip: string): boolean {
  const parts = ip.split(".").map((part) => Number(part));
  if (parts.length !== 4 || parts.some((part) => Number.isNaN(part))) {
    return true;
  }

  const [a, b] = parts;
  return (
    a === 10 ||
    a === 127 ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    a === 0
  );
}

function isPrivateIpv6(ip: string): boolean {
  const normalized = ip.toLowerCase();
  return (
    normalized === "::1" ||
    normalized.startsWith("fc") ||
    normalized.startsWith("fd") ||
    normalized.startsWith("fe80:")
  );
}

function isPrivateIp(ip: string): boolean {
  if (net.isIPv4(ip)) return isPrivateIpv4(ip);
  if (net.isIPv6(ip)) return isPrivateIpv6(ip);
  return true;
}

interface ValidatedUrl {
  url: URL;
  resolvedIp: string;
}

async function validateRemoteHttpUrl(rawUrl: string): Promise<ValidatedUrl> {
  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    throw new Error("Invalid URL format");
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new Error("Only http/https URLs are allowed");
  }

  const hostname = parsed.hostname.toLowerCase();
  if (hostname === "localhost" || hostname.endsWith(".local")) {
    throw new Error("Local network hosts are not allowed");
  }

  if (net.isIP(hostname)) {
    if (isPrivateIp(hostname)) {
      throw new Error("Private or loopback IP targets are not allowed");
    }
    return { url: parsed, resolvedIp: hostname };
  }

  const resolved = await dns.lookup(hostname, { all: true, verbatim: true });
  if (resolved.length === 0) {
    throw new Error("Could not resolve target hostname");
  }

  let safeIp = "";
  for (const address of resolved) {
    if (isPrivateIp(address.address)) {
      throw new Error("Target resolves to private or loopback IP address");
    }
    safeIp = address.address;
  }

  return { url: parsed, resolvedIp: safeIp };
}

async function readTextWithLimit(response: Response, maxBytes: number): Promise<string> {
  if (!response.body) {
    return "";
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let totalBytes = 0;
  const chunks: string[] = [];

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    if (!value) continue;

    totalBytes += value.byteLength;
    if (totalBytes > maxBytes) {
      throw new Error(`Remote payload is too large (>${maxBytes} bytes)`);
    }
    chunks.push(decoder.decode(value, { stream: true }));
  }

  chunks.push(decoder.decode());
  return chunks.join("");
}

function buildFetchHeaders(resolvedIp: string, hostname: string): Record<string, string> {
  return {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept": "*/*",
    "Host": hostname,
  };
}

function buildFetchUrl(url: URL, resolvedIp: string): string {
  const secureUrl = new URL(url.toString());
  secureUrl.hostname = resolvedIp;
  return secureUrl.toString();
}

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;
  const APP_URL = process.env.APP_URL || "";

  app.use(helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
  }));

  app.use((req, res, next) => {
    console.log(`[Server] ${req.method} ${req.url}`);
    next();
  });

  const proxyLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 30,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: "Too many requests, please try again later" },
  });

  const streamCheckLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 60,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: "Too many requests, please try again later" },
  });

  // Proxy endpoint to fetch external M3U playlists and bypass CORS
  app.get("/api/proxy", proxyLimiter, async (req, res) => {
    const playlistUrlRaw = req.query.url as string;
    if (!playlistUrlRaw) {
      return res.status(400).json({ error: "Missing 'url' query parameter" });
    }

    try {
      const validated = await validateRemoteHttpUrl(playlistUrlRaw);
      const { url: playlistUrl, resolvedIp } = validated;
      const hostname = playlistUrl.hostname;
      console.log(`[Proxy] Fetching playlist from: ${hostname} (ip: ${resolvedIp})`);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const fetchUrl = buildFetchUrl(playlistUrl, resolvedIp);
      const headers = buildFetchHeaders(resolvedIp, hostname);

      const response = await fetch(fetchUrl, {
        signal: controller.signal,
        headers,
      });
      clearTimeout(timeoutId);

      if (!response.ok) {
        console.error(`[Proxy] Remote server returned status ${response.status} for ${hostname}`);
        return res.status(502).json({ error: "Failed to fetch playlist from remote server" });
      }

      const text = await readTextWithLimit(response, MAX_PROXY_RESPONSE_BYTES);

      const allowedOrigin = APP_URL || "*";
      res.setHeader("Content-Type", "text/plain; charset=utf-8");
      res.setHeader("Access-Control-Allow-Origin", allowedOrigin);
      res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
      res.setHeader("Pragma", "no-cache");
      res.setHeader("Expires", "0");

      return res.send(text);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      console.error("[Proxy] Error fetching playlist:", message);
      if (
        typeof message === "string" &&
        (message.includes("not allowed") ||
          message.includes("Invalid URL") ||
          message.includes("Only http/https"))
      ) {
        return res.status(400).json({ error: message });
      }
      if (typeof message === "string" && message.includes("too large")) {
        return res.status(413).json({ error: "Remote payload is too large" });
      }
      return res.status(500).json({ error: "Error fetching playlist" });
    }
  });

  // Endpoint to check stream availability quickly without downloading full content
  app.get("/api/check-stream", streamCheckLimiter, async (req, res) => {
    const streamUrlRaw = req.query.url as string;
    if (!streamUrlRaw) {
      return res.status(400).json({ error: "Missing 'url' query parameter" });
    }

    try {
      const validated = await validateRemoteHttpUrl(streamUrlRaw);
      const { url: streamUrl, resolvedIp } = validated;
      const hostname = streamUrl.hostname;
      const fetchUrl = buildFetchUrl(streamUrl, resolvedIp);
      const headers = buildFetchHeaders(resolvedIp, hostname);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3500);

      // 1. Try HEAD request first for efficiency
      try {
        const headResponse = await fetch(fetchUrl, {
          method: "HEAD",
          signal: controller.signal,
          headers,
        });
        clearTimeout(timeoutId);
        if (headResponse.ok) {
          return res.json({ available: true, status: headResponse.status });
        }
      } catch (_e) {
        // If HEAD request fails, fallback to GET below
      }

      // 2. Fallback to GET with a new abort controller so we can terminate immediately after response headers
      const getController = new AbortController();
      const getTimeoutId = setTimeout(() => getController.abort(), 3500);

      const getResponse = await fetch(fetchUrl, {
        method: "GET",
        signal: getController.signal,
        headers,
      });

      // Terminate connection immediately to avoid loading the media stream body
      getController.abort();
      clearTimeout(getTimeoutId);

      return res.json({
        available: getResponse.ok,
        status: getResponse.status,
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`[CheckStream] Error for ${req.query.url}:`, message);
      return res.json({ available: false, error: "Stream check failed" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  const host = process.env.NODE_ENV === "production" ? "127.0.0.1" : "0.0.0.0";
  app.listen(PORT, host, () => {
    console.log(`[Server] IPTV simulation server running on http://${host}:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("[Server] Start failure:", err);
});
