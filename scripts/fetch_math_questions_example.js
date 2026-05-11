(async () => {
  let fetchFn = globalThis.fetch;
  if (!fetchFn) {
    try {
      fetchFn = (await import('node-fetch')).default;
    } catch (e) {
      console.error('No fetch available. Install node-fetch or run in Node 18+.');
      process.exit(1);
    }
  }

  const base = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  const key = process.env.ACCESO_IA_KEY || null;
  const headers = {};
  if (key) headers['x-accesso-ia-key'] = key;

  try {
    const res = await fetchFn(`${base}/api/exams/math-questions`, { headers });
    const json = await res.json();
    console.log(JSON.stringify(json, null, 2));
  } catch (err) {
    console.error('Fetch error:', err && err.message ? err.message : err);
    process.exit(1);
  }
})();
