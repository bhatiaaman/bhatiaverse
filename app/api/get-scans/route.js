import { getAllScans } from '../../lib/scanStore';

export async function GET(request) {
  const scans = getAllScans();
  return Response.json(scans);
}