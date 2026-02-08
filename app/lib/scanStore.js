// Use globalThis to persist across hot reloads in development
if (!globalThis.scanData) {
  globalThis.scanData = {
    latestScan: null,
    scanHistory: []
  };
}

export function setLatestScan(scan) {
  globalThis.scanData.latestScan = scan;
  globalThis.scanData.scanHistory.unshift(scan);
  
  if (globalThis.scanData.scanHistory.length > 20) {
    globalThis.scanData.scanHistory = globalThis.scanData.scanHistory.slice(0, 20);
  }
  
  console.log('✅ Scan stored:', globalThis.scanData.latestScan);
}

export function getLatestScan() {
  console.log('📖 Reading latest scan:', globalThis.scanData.latestScan);
  return globalThis.scanData.latestScan;
}

export function getScanHistory() {
  console.log('📖 Reading history:', globalThis.scanData.scanHistory.length, 'scans');
  return globalThis.scanData.scanHistory;
}

export function getAllScans() {
  return {
    latest: globalThis.scanData.latestScan,
    history: globalThis.scanData.scanHistory,
    count: globalThis.scanData.scanHistory.length
  };
}