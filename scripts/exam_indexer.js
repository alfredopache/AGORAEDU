const fs = require('fs');
const fsp = require('fs').promises;
const path = require('path');
const pdfjs = require('pdfjs-dist');

const DIR = path.join(__dirname, '..', 'data', 'asignaturas');
const INDEX_PATH = path.join(DIR, 'index.json');

async function extractPdfText(filePath) {
  const data = new Uint8Array(fs.readFileSync(filePath));
  const loadingTask = pdfjs.getDocument({ data });
  const doc = await loadingTask.promise;
  let text = '';
  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();
    const strings = content.items.map(item => item.str || '');
    text += strings.join(' ') + '\n';
  }
  return text;
}

async function processFile(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === '.pdf') {
    const text = await extractPdfText(filePath);
    return { text };
  }
  if (ext === '.txt' || ext === '.md') {
    const text = await fsp.readFile(filePath, 'utf8');
    return { text };
  }
  if (ext === '.json') {
    const text = await fsp.readFile(filePath, 'utf8');
    try {
      const json = JSON.parse(text);
      return { text: JSON.stringify(json) };
    } catch (e) {
      return { text };
    }
  }
  return { skip: true };
}

async function ensureDirExists(dir) {
  try {
    await fsp.access(dir);
  } catch (e) {
    await fsp.mkdir(dir, { recursive: true });
  }
}

async function main() {
  try {
    await ensureDirExists(DIR);
    const entries = await fsp.readdir(DIR);
    const results = [];
    for (const name of entries) {
      const full = path.join(DIR, name);
      const stat = await fsp.stat(full);
      if (!stat.isFile()) continue;
      const ext = path.extname(full).toLowerCase();
      if (!['.pdf', '.txt', '.md', '.json'].includes(ext)) continue;
      const data = await processFile(full);
      if (data.skip) continue;
      results.push({
        filename: name,
        path: full,
        size: stat.size,
        mtime: stat.mtime.toISOString(),
        text: data.text ? data.text.slice(0, 200000) : ''
      });
    }
    await fsp.writeFile(INDEX_PATH, JSON.stringify({ generatedAt: new Date().toISOString(), items: results }, null, 2), 'utf8');
    console.log('Index creado en', INDEX_PATH);
  } catch (err) {
    console.error('Error:', err && err.message ? err.message : err);
    process.exit(1);
  }
}

main();
