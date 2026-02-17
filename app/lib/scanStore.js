import { redis } from "./redis";

const NS = process.env.REDIS_NAMESPACE || 'default';

const KEY_LATEST  = `${NS}:latest_scan`;
const KEY_HISTORY = `${NS}:scan_history`;
const MAX_HISTORY = 20;

const KEY_SCANNER_LATEST_PREFIX  = `${NS}:scanner_latest:`;
const KEY_SCANNER_HISTORY_PREFIX = `${NS}:scanner_history:`;

function getDedupeKey(scan) {
  const alert = (scan?.alert_name || '').trim().toLowerCase();
  const trig  = (scan?.triggered_at || '').trim().toLowerCase();
  return `${alert}__${trig}`;
}

export async function setLatestScan(scan) {
  await redis.set(KEY_LATEST, scan);

  const history  = (await redis.get(KEY_HISTORY)) || [];
  const combined = [scan, ...history].filter(Boolean);

  const seen   = new Set();
  const deduped = [];
  for (const item of combined) {
    const key = getDedupeKey(item);
    if (!item?.alert_name || !item?.triggered_at) { deduped.push(item); continue; }
    if (!seen.has(key)) { seen.add(key); deduped.push(item); }
  }

  await redis.set(KEY_HISTORY, deduped.slice(0, MAX_HISTORY));
}

//getScannerSlug
function getScannerSlug(scanOrSlug) {
  if (!scanOrSlug) return '';
  const raw = typeof scanOrSlug === 'string'
    ? scanOrSlug
    : (scanOrSlug.scan_url || scanOrSlug.scan_name || scanOrSlug.alert_name || '');
  return String(raw).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

export async function setScannerScan(scan) {
  const slug = getScannerSlug(scan);
  if (!slug) return;

  const latestKey  = KEY_SCANNER_LATEST_PREFIX + slug;
  const historyKey = KEY_SCANNER_HISTORY_PREFIX + slug;

  await redis.set(latestKey, scan);

  const history  = (await redis.get(historyKey)) || [];
  const combined = [scan, ...history].filter(Boolean);

  const seen    = new Set();
  const deduped = [];
  for (const item of combined) {
    const key = getDedupeKey(item);
    if (!item?.alert_name || !item?.triggered_at) { deduped.push(item); continue; }
    if (!seen.has(key)) { seen.add(key); deduped.push(item); }
  }

  await redis.set(historyKey, deduped.slice(0, MAX_HISTORY));
}

export async function getScannerLatest(slug) {
  if (!slug) return null;
  return await redis.get(KEY_SCANNER_LATEST_PREFIX + getScannerSlug(slug));
}

export async function getScannerHistory(slug) {
  if (!slug) return [];
  return (await redis.get(KEY_SCANNER_HISTORY_PREFIX + getScannerSlug(slug))) || [];
}

export async function getLatestScan() {
  return await redis.get(KEY_LATEST);
}

export async function getAllScans() {
  return (await redis.get(KEY_HISTORY)) || [];
}