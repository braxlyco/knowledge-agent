import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { askOllama, validateAsk } from './agent.js';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const port = Number(process.env.PORT || 5175);
const model = process.env.OLLAMA_MODEL || 'llama3.2:3b';
const baseUrl = process.env.OLLAMA_URL || 'http://127.0.0.1:11434';
const files = new Map([
  ['/', ['index.html', 'text/html; charset=utf-8']],
  ['/index.html', ['index.html', 'text/html; charset=utf-8']],
  ['/styles.css', ['styles.css', 'text/css; charset=utf-8']],
  ['/favicon.svg', ['favicon.svg', 'image/svg+xml']],
  ['/src/app.js', ['src/app.js', 'text/javascript; charset=utf-8']],
  ['/src/knowledge.js', ['src/knowledge.js', 'text/javascript; charset=utf-8']],
  ['/src/sample-docs.js', ['src/sample-docs.js', 'text/javascript; charset=utf-8']],
  ['/assets/preview.png', ['assets/preview.png', 'image/png']]
]);

function json(res, status, data) {
  res.writeHead(status, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', 'x-content-type-options': 'nosniff' });
  res.end(JSON.stringify(data));
}

async function readJson(req) {
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > 40000) throw new Error('Request is too large.');
    chunks.push(chunk);
  }
  try { return JSON.parse(Buffer.concat(chunks).toString('utf8')); }
  catch { throw new Error('Invalid JSON request.'); }
}

async function health() {
  try {
    const response = await fetch(`${baseUrl}/api/tags`, { signal: AbortSignal.timeout(3000) });
    if (!response.ok) return { available: false, model, reason: 'Ollama is not responding.' };
    const data = await response.json();
    const installed = Array.isArray(data.models) && data.models.some(item => item.name === model || item.model === model);
    return { available: installed, model, reason: installed ? null : `Pull ${model} in Ollama to enable model answers.` };
  } catch { return { available: false, model, reason: 'Start Ollama to enable model answers.' }; }
}

const server = createServer(async (req, res) => {
  const path = new URL(req.url, 'http://localhost').pathname;
  if (req.method === 'GET' && path === '/api/health') return json(res, 200, await health());
  if (req.method === 'POST' && path === '/api/ask') {
    const origin = req.headers.origin;
    if (origin && origin !== `http://127.0.0.1:${port}` && origin !== `http://localhost:${port}`) return json(res, 403, { error: 'Origin not allowed.' });
    if (!req.headers['content-type']?.startsWith('application/json')) return json(res, 415, { error: 'JSON content type required.' });
    try {
      const status = await health();
      if (!status.available) return json(res, 503, { error: status.reason });
      const input = validateAsk(await readJson(req));
      return json(res, 200, await askOllama(input, { model, baseUrl }));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Request failed.';
      return json(res, /required|must be|Provide|missing|too long|too large|Invalid JSON/.test(message) ? 400 : 502, { error: message });
    }
  }
  if (req.method !== 'GET' || !files.has(path)) return json(res, 404, { error: 'Not found.' });
  const [file, type] = files.get(path);
  try {
    const content = await readFile(join(root, file));
    res.writeHead(200, { 'content-type': type, 'x-content-type-options': 'nosniff' });
    res.end(content);
  } catch { json(res, 500, { error: 'Could not load the page.' }); }
});

server.listen(port, '127.0.0.1', () => console.log(`Knowledge Agent running at http://127.0.0.1:${port}`));
