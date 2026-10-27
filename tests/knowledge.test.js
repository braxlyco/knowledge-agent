import test from 'node:test';
import assert from 'node:assert/strict';
import { sampleDocs } from '../src/sample-docs.js';
import { documentFromText, previewAnswer, searchKnowledge } from '../src/knowledge.js';

test('urgent incidents rank the support playbook first', () => {
  const hits = searchKnowledge('How are urgent incidents handled?', sampleDocs);
  assert.equal(hits[0].docId, 'support');
  assert.equal(hits[0].heading, 'Urgent incidents');
});

test('refund window question cites the policy', () => {
  const result = previewAnswer('When can I request a refund?', sampleDocs);
  assert.equal(result.sources[0].docId, 'returns');
  assert.match(result.answer, /14 calendar days/);
});

test('unsupported question does not invent an answer', () => {
  const result = previewAnswer('What is the weather on Mars?', sampleDocs);
  assert.equal(result.sources.length, 0);
  assert.match(result.answer, /won't guess/);
});

test('uploaded content becomes searchable without being persisted', () => {
  const doc = documentFromText('access.md', 'The access code rotates every Monday.');
  assert.equal(doc.type, 'Your local file');
  assert.equal(searchKnowledge('When does the access code rotate?', [doc])[0].docId, doc.id);
});
