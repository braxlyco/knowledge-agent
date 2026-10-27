import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

async function freePort() {
  const server = createServer();
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const port = server.address().port;
  server.close();
  await once(server, 'close');
  return port;
}

test('local server serves the app and reaches an Ollama-compatible endpoint', async t => {
  const modelPort = await freePort();
  const appPort = await freePort();
  const model = createServer(async (req, res) => {
    res.setHeader('content-type', 'application/json');
    if (req.url === '/api/tags') return res.end(JSON.stringify({ models: [{ name: 'test-model' }] }));
    if (req.url === '/api/chat') {
      let body = '';
      for await (const chunk of req) body += chunk;
      assert.match(body, /Returns policy/);
      return res.end(JSON.stringify({ message: { content: 'Within 14 days [1].' } }));
    }
    res.statusCode = 404; res.end('{}');
  });
  model.listen(modelPort, '127.0.0.1');
  await once(model, 'listening');
  t.after(async () => { model.close(); await once(model, 'close'); });

  const app = spawn(process.execPath, ['server/server.js'], { cwd: root, env: { ...process.env, PORT: String(appPort), OLLAMA_URL: `http://127.0.0.1:${modelPort}`, OLLAMA_MODEL: 'test-model' }, stdio: 'ignore' });
  t.after(() => app.kill());
  const base = `http://127.0.0.1:${appPort}`;
  let ready = false;
  for (let i = 0; i < 60; i++) {
    try { if ((await fetch(`${base}/api/health`)).ok) { ready = true; break; } }
    catch { await delay(50); }
  }
  assert.equal(ready, true, 'the local server should start');
  assert.equal((await (await fetch(`${base}/api/health`)).json()).available, true);
  assert.match(await (await fetch(base)).text(), /Answers with/);

  const request = { question: 'When is a refund allowed?', sources: [{ title: 'Returns policy', text: 'Refunds are allowed within 14 days.' }] };
  const response = await fetch(`${base}/api/ask`, { method: 'POST', headers: { 'content-type': 'application/json', origin: base }, body: JSON.stringify(request) });
  assert.equal(response.status, 200);
  assert.equal((await response.json()).answer, 'Within 14 days [1].');
  const blocked = await fetch(`${base}/api/ask`, { method: 'POST', headers: { 'content-type': 'application/json', origin: 'https://example.com' }, body: JSON.stringify(request) });
  assert.equal(blocked.status, 403);
});
