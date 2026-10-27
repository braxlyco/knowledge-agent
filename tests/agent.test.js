import test from 'node:test';
import assert from 'node:assert/strict';
import { askOllama, buildMessages, validateAsk } from '../server/agent.js';

const caseInput = { question: 'When is a refund allowed?', sources: [{ title: 'Returns policy', text: 'Refunds are allowed within 14 days.' }] };

test('request validation limits source scope', () => {
  assert.deepEqual(validateAsk(caseInput), caseInput);
  assert.throws(() => validateAsk({ question: 'Hi', sources: [] }), /1–3/);
  assert.throws(() => validateAsk({ question: 'Hi', sources: [{ title: 'A', text: 'x'.repeat(1501) }] }), /too long/);
});

test('model prompt keeps source excerpts separate from instructions', () => {
  const messages = buildMessages(caseInput);
  assert.equal(messages[0].role, 'system');
  assert.match(messages[0].content, /Answer only from the supplied source excerpts/);
  assert.match(messages[1].content, /\[1\] Returns policy/);
});

test('Ollama adapter sends chat request and reads model response', async () => {
  let sent;
  const result = await askOllama(caseInput, { model: 'test-model', baseUrl: 'http://127.0.0.1:11434', fetchImpl: async (url, options) => {
    sent = { url, body: JSON.parse(options.body) };
    return { ok: true, json: async () => ({ message: { content: 'Within 14 days [1].' } }) };
  } });
  assert.equal(sent.url, 'http://127.0.0.1:11434/api/chat');
  assert.equal(sent.body.stream, false);
  assert.equal(sent.body.model, 'test-model');
  assert.equal(result.answer, 'Within 14 days [1].');
});
