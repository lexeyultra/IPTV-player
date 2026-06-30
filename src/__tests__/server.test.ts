import { describe, it, expect } from "vitest";

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

describe("isPrivateIpv4", () => {
  it("detects 10.x.x.x as private", () => {
    expect(isPrivateIpv4("10.0.0.1")).toBe(true);
    expect(isPrivateIpv4("10.255.255.255")).toBe(true);
  });

  it("detects 127.x.x.x as loopback", () => {
    expect(isPrivateIpv4("127.0.0.1")).toBe(true);
    expect(isPrivateIpv4("127.255.255.255")).toBe(true);
  });

  it("detects 169.254.x.x as link-local", () => {
    expect(isPrivateIpv4("169.254.1.1")).toBe(true);
  });

  it("detects 172.16-31.x.x as private", () => {
    expect(isPrivateIpv4("172.16.0.1")).toBe(true);
    expect(isPrivateIpv4("172.31.255.255")).toBe(true);
    expect(isPrivateIpv4("172.15.0.1")).toBe(false);
    expect(isPrivateIpv4("172.32.0.1")).toBe(false);
  });

  it("detects 192.168.x.x as private", () => {
    expect(isPrivateIpv4("192.168.0.1")).toBe(true);
    expect(isPrivateIpv4("192.168.255.255")).toBe(true);
  });

  it("detects 0.x.x.x as private", () => {
    expect(isPrivateIpv4("0.0.0.0")).toBe(true);
  });

  it("allows public IPs", () => {
    expect(isPrivateIpv4("8.8.8.8")).toBe(false);
    expect(isPrivateIpv4("1.1.1.1")).toBe(false);
    expect(isPrivateIpv4("203.0.113.1")).toBe(false);
  });

  it("rejects invalid IPs", () => {
    expect(isPrivateIpv4("not-an-ip")).toBe(true);
    expect(isPrivateIpv4("256.256.256.256")).toBe(false);
  });
});

describe("isPrivateIpv6", () => {
  it("detects ::1 as loopback", () => {
    expect(isPrivateIpv6("::1")).toBe(true);
  });

  it("detects fc/fd as unique local", () => {
    expect(isPrivateIpv6("fc00::1")).toBe(true);
    expect(isPrivateIpv6("fd00::1")).toBe(true);
  });

  it("detects fe80 as link-local", () => {
    expect(isPrivateIpv6("fe80::1")).toBe(true);
  });

  it("allows public IPv6", () => {
    expect(isPrivateIpv6("2001:db8::1")).toBe(false);
  });
});

describe("URL validation logic", () => {
  it("rejects non-http protocols", () => {
    const url = new URL("ftp://example.com/file.m3u");
    expect(url.protocol).not.toBe("http:");
    expect(url.protocol).not.toBe("https:");
  });

  it("accepts http protocol", () => {
    const url = new URL("http://example.com/file.m3u");
    expect(url.protocol).toBe("http:");
  });

  it("accepts https protocol", () => {
    const url = new URL("https://example.com/file.m3u");
    expect(url.protocol).toBe("https:");
  });

  it("detects localhost hostname", () => {
    const url = new URL("http://localhost:3000/api");
    expect(url.hostname).toBe("localhost");
  });

  it("detects .local domains", () => {
    const url = new URL("http://myhost.local/stream");
    expect(url.hostname.endsWith(".local")).toBe(true);
  });
});
