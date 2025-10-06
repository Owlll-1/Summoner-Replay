// give us an await wait function
import { setTimeout as wait } from "node:timers/promises";
// LRUCache is a simple in-memory cache to avoid repeating requests
import { LRUCache } from "lru-cache";
// Bottleneck helps us limit how often we call Riot's API
import Bottleneck from "bottleneck";
// import our Region type so we can type-check region parameters
import type { Region } from "./regions.js";

// Get your API key from .env
const KEY = process.env.RIOT_TOKEN!;
if (!KEY) {
  console.warn("⚠️  RIOT_TOKEN not set yet. Add it to server/.env before calling Riot.");
}

// A simple rate limiter so we don't spam Riot's API
const limiter = new Bottleneck({ minTime: 60 }); // ~16 requests/sec

// Cache up to 500 responses for 10 minutes
const cache = new LRUCache<string, any>({ max: 500, ttl: 1000 * 60 * 10 });

async function _fetch(host: string, path: string) {
  const url = `https://${host}${path}`;

  // Cache check
  const cached = cache.get(url);
  if (cached) return cached;

  // Request w/ Riot Key
  const res = await fetch(url, { headers: { "X-Riot-Token": KEY } });

  // Backoff & retry on 429
  if (res.status === 429) { // Too Many Requests
    const retryAfter = Number(res.headers.get("Retry-After") || 1);
    // wait that many seconds, then retry
    await wait(retryAfter * 1000);
    return _fetch(host, path);
  }

  //Error handling for other error responses
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`${res.status} ${text}`);
  }

  // Parse JSON and cache result 
  const json = await res.json();
  cache.set(url, json);
  return json;
}

// Public helper for region APIs that can be called directly.
// Riot's API is region-specific, so we need to know which host to call.
// Have Bottleneck limit calls to avoid spamming Riot.
export function riot(region: Region, path: string) {
  const host = `${region}.api.riotgames.com`;
  return limiter.schedule(() => _fetch(host, path));
}
