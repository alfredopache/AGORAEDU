const fs = require('fs');
const fsp = fs.promises;
const path = require('path');

const ASIGN_DIR = path.join(__dirname, '..', 'data', 'asignaturas');
const DATA_DIR = path.join(__dirname, '..', 'data');
const INDEX_PATH = path.join(ASIGN_DIR, 'index.json');

async function ensureDir(dir) {
  try { await fsp.access(dir); } catch (e) { await fsp.mkdir(dir, { recursive: true }); }
}

async function processFile(full, rel) {
  const stat = await fsp.stat(full);
  const ext = path.extname(full).toLowerCase();
  if (!['.pdf', '.txt', '.md', '.json'].includes(ext)) return null;
  let text = null;
  if (ext === '.txt' || ext === '.md' || ext === '.json') {
    try { text = await fsp.readFile(full, 'utf8'); } catch (e) { text = null; }
  }
  return {
    filename: path.basename(full),
    path: rel,
    ext,
    size: stat.size,
    mtime: stat.mtime.toISOString(),
    text: text ? text.slice(0, 200000) : null
  };
}

async function main() {
  await ensureDir(ASIGN_DIR);
  const sources = [ASIGN_DIR, DATA_DIR];
  const items = [];
  for (const src of sources) {
    let entries = [];
    try { entries = await fsp.readdir(src); } catch (e) { continue; }
    for (const name of entries) {
      const full = path.join(src, name);
      try {
        const stat = await fsp.stat(full);
        if (!stat.isFile()) continue;
        const rel = path.relative(path.join(__dirname, '..'), full).replace(/\\/g, '/');
        const info = await processFile(full, rel);
        if (info) items.push(info);
      } catch (e) {
        // ignore
      }
    }
  }
  const out = { generatedAt: new Date().toISOString(), items };
  await fsp.writeFile(INDEX_PATH, JSON.stringify(out, null, 2), 'utf8');
  console.log('Quick index created at', INDEX_PATH);
}

main().catch(err => { console.error(err && err.message ? err.message : err); process.exit(1); });
