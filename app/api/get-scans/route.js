import { getLatestScan, getScanHistory } from '../chartink-webhook/route';

export async function GET(request) {
  const latest = getLatestScan();
  const history = getScanHistory();

  return Response.json({
    latest: latest,
    history: history,
    count: history.length
  });
}