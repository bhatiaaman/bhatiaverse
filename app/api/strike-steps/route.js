import fs from 'fs';
import path from 'path';

function parseCSV(content) {
  const lines = content.split(/\r?\n/);
  const rows = [];
  for (const line of lines) {
    if (!line.trim()) continue;
    const parts = line.split(/[,\t]+/).map(s => s.trim());
    // expecting at least 4 columns: symbol, period, type, step
    if (parts.length < 4) continue;
    const [symbol, period, type, step] = parts;
    rows.push({ symbol, period, type, step: Number(step) });
  }
  return rows;
}

function heuristic(price) {
  const p = Number(price) || 0;
  if (p >= 5000) return 100;
  if (p >= 1000) return 50;
  if (p >= 300) return 20;
  return 10;
}

export async function GET(req) {
  try {
    const url = new URL(req.url);
    const symbol = url.searchParams.get('symbol') || '';
    const price = url.searchParams.get('price') || '';

    // CSV file expected at /data/nse_strike_steps.csv
    const csvPath = path.join(process.cwd(), 'data', 'nse_strike_steps.csv');
    if (!fs.existsSync(csvPath)) {
      return new Response(JSON.stringify({ step: heuristic(price), found: false }), { status: 200 });
    }

    const content = fs.readFileSync(csvPath, 'utf8');
    const rows = parseCSV(content);

    // find first row matching symbol and period M1
    const row = rows.find(r => r.symbol.toUpperCase() === String(symbol).toUpperCase() && String(r.period).toUpperCase() === 'M1');
    if (row && row.step) {
      return new Response(JSON.stringify({ step: row.step, found: true }), { status: 200 });
    }

    return new Response(JSON.stringify({ step: heuristic(price), found: false }), { status: 200 });
  } catch (err) {
    console.error('strike-steps error', err);
    return new Response(JSON.stringify({ step: 50, found: false }), { status: 500 });
  }
}
