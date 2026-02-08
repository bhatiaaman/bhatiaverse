import { getLatestScan, getAllScans } from "@/app/lib/scanStore";

export async function GET() {
  const latest = await getLatestScan();
  const history = await getAllScans();

  return Response.json({
    latest: latest || null,
    history: history || [],
  });
}