import { getLatestScan, getAllScans, getScannerLatest, getScannerHistory } from "@/app/lib/scanStore";

export async function GET(request) {
  try {
    const url = new URL(request.url);
    const scanner = url.searchParams.get('scanner');

    if (scanner) {
      const latest = await getScannerLatest(scanner);
      const history = await getScannerHistory(scanner);
      return Response.json({ latest: latest || null, history: history || [] });
    }

    const latest = await getLatestScan();
    const history = await getAllScans();

    return Response.json({ latest: latest || null, history: history || [] });
  } catch (e) {
    console.error('get-scans error', e);
    return Response.json({ latest: null, history: [] }, { status: 500 });
  }
}