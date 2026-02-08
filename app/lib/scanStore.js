import { redis } from "./redis";

const KEY_LATEST = "latest_scan";
const KEY_HISTORY = "scan_history";
const MAX_HISTORY = 20;

function getDedupeKey(scan) {
  const alert = (scan?.alert_name || "").trim().toLowerCase();
  const trig = (scan?.triggered_at || "").trim().toLowerCase();
  return `${alert}__${trig}`;
}

export async function setLatestScan(scan) {
  // Always store latest
  await redis.set(KEY_LATEST, scan);

  const history = (await redis.get(KEY_HISTORY)) || [];

  // New scan always goes first
  const combined = [scan, ...history].filter(Boolean);

  // Dedupe by alert_name + triggered_at
  const seen = new Set();
  const deduped = [];

  for (const item of combined) {
    const key = getDedupeKey(item);

    // If missing fields, don't dedupe too aggressively
    if (!item?.alert_name || !item?.triggered_at) {
      deduped.push(item);
      continue;
    }

    if (!seen.has(key)) {
      seen.add(key);
      deduped.push(item);
    }
  }

  // Keep only last 20
  const finalHistory = deduped.slice(0, MAX_HISTORY);

  await redis.set(KEY_HISTORY, finalHistory);
}

export async function getLatestScan() {
  return await redis.get(KEY_LATEST);
}

export async function getAllScans() {
  return (await redis.get(KEY_HISTORY)) || [];
}