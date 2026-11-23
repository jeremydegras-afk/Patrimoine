// Récupère les clôtures mensuelles du CAC 40 et du S&P 500 et écrit data/indices.json.
// Lancé chaque jour par GitHub Actions (.github/workflows/update-indices.yml).
// Sources : Yahoo Finance, puis Stooq en secours. Aucune dépendance (Node 20+).
import { readFile, writeFile, mkdir } from 'node:fs/promises';

const OUT = 'data/indices.json';
const UA = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36';
const INDICES = [
  { key: 'cac40', yahoo: '^FCHI', stooq: '^cac' },
  { key: 'sp500', yahoo: '^GSPC', stooq: '^spx' }
];

const round2 = n => Math.round(n * 100) / 100;

// Yahoo : une bougie par mois ; la clôture du mois en cours = dernier cours connu
export function parseYahoo(json) {
  const res = json?.chart?.result?.[0];
  const ts = res?.timestamp, closes = res?.indicators?.quote?.[0]?.close;
  if (!Array.isArray(ts) || !Array.isArray(closes)) throw new Error('réponse Yahoo inattendue');
  // les bougies démarrent à minuit heure de la place : on lit donc le mois dans son fuseau (gère l'heure d'été)
  const fmt = new Intl.DateTimeFormat('en-CA', { timeZone: res.meta?.exchangeTimezoneName || 'UTC', year: 'numeric', month: '2-digit' });
  const out = {};
  ts.forEach((t, i) => {
    const c = closes[i];
    if (typeof c !== 'number' || !isFinite(c) || c <= 0) return;
    const p = Object.fromEntries(fmt.formatToParts(new Date(t * 1000)).map(x => [x.type, x.value]));
    out[`${p.year}-${p.month}`] = round2(c);
  });
  return out;
}

// Stooq : CSV "Date,Open,High,Low,Close,Volume", une ligne par mois
export function parseStooq(csv) {
  const lines = csv.trim().split(/\r?\n/);
  if (!/^Date,/i.test(lines[0] || '')) throw new Error('réponse Stooq inattendue');
  const out = {};
  for (const line of lines.slice(1)) {
    const [date, , , , close] = line.split(',');
    const c = parseFloat(close);
    if (/^\d{4}-\d{2}-\d{2}$/.test(date) && isFinite(c) && c > 0) out[date.slice(0, 7)] = round2(c);
  }
  return out;
}

async function get(url) {
  const r = await fetch(url, { headers: { 'User-Agent': UA, 'Accept': '*/*' } });
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return r;
}

async function fetchIndex(ix) {
  const sources = [
    async () => parseYahoo(await (await get(`https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ix.yahoo)}?interval=1mo&range=10y`)).json()),
    async () => parseYahoo(await (await get(`https://query2.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ix.yahoo)}?interval=1mo&range=10y`)).json()),
    async () => parseStooq(await (await get(`https://stooq.com/q/d/l/?s=${encodeURIComponent(ix.stooq)}&i=m`)).text())
  ];
  for (const [i, src] of sources.entries()) {
    try {
      const data = await src();
      if (Object.keys(data).length >= 12) return data;
      throw new Error('trop peu de points');
    } catch (e) {
      console.warn(`${ix.key} : source ${i + 1} en échec (${e.message})`);
    }
  }
  return null;
}

async function main() {
  let previous = {};
  try { previous = JSON.parse(await readFile(OUT, 'utf8')); } catch {}
  const out = { updated: previous.updated || null, source: 'Yahoo Finance / Stooq, clôtures mensuelles' };
  let ok = 0, changed = false;
  for (const ix of INDICES) {
    const fresh = await fetchIndex(ix);
    if (fresh) ok++;
    // on garde l'historique déjà connu et on le complète / corrige avec les valeurs fraîches
    const merged = { ...(previous[ix.key] || {}), ...(fresh || {}) };
    out[ix.key] = Object.fromEntries(Object.entries(merged).sort(([a], [b]) => a.localeCompare(b)));
    if (JSON.stringify(out[ix.key]) !== JSON.stringify(previous[ix.key] || {})) changed = true;
    const last = Object.keys(out[ix.key]).pop();
    console.log(`${ix.key} : ${Object.keys(out[ix.key]).length} mois, dernier ${last} = ${out[ix.key][last]}`);
  }
  if (ok === 0) { console.error('Aucune source disponible, fichier inchangé'); process.exit(1); }
  if (changed || !out.updated) out.updated = new Date().toISOString();
  await mkdir('data', { recursive: true });
  await writeFile(OUT, JSON.stringify(out, null, 1) + '\n');
  if (ok < INDICES.length) console.log('::warning::Un indice n\'a pas pu être rafraîchi, anciennes valeurs conservées');
}

if (process.argv[1] && import.meta.url.endsWith(process.argv[1].split(/[\\/]/).pop())) main();
