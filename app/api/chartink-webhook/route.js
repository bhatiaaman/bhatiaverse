// In-memory storage (resets on cold starts, but works for live data)
let latestScan = null;
let scanHistory = []; // Keep last 20 scans in memory

export async function POST(request) {
  try {
    const scanData = await request.json();
    
    // Enrich with timestamp
    const enrichedData = {
      ...scanData,
      receivedAt: new Date().toISOString(),
      id: Date.now()
    };

    // Store in memory
    latestScan = enrichedData;
    scanHistory.unshift(enrichedData);
    
    // Keep only last 20 scans
    if (scanHistory.length > 20) {
      scanHistory = scanHistory.slice(0, 20);
    }

    console.log('📊 Scan received:', enrichedData);

    return Response.json({ 
      success: true, 
      message: 'Scan received',
      timestamp: enrichedData.receivedAt
    });
    
  } catch (error) {
    console.error('❌ Webhook error:', error);
    return Response.json(
      { error: 'Processing failed' },
      { status: 500 }
    );
  }
}

// Export for other routes to access
export function getLatestScan() {
  return latestScan;
}

export function getScanHistory() {
  return scanHistory;
}