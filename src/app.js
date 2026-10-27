import { sampleDocs } from './sample-docs.js';
import { documentFromText, previewAnswer, searchKnowledge } from './knowledge.js';

const $ = selector => document.querySelector(selector);
const question = $('#question');
const answerContent = $('#answer-content');
const evidenceList = $('#evidence-list');
const notice = $('#notice');
const modeButton = $('#mode-button');
let documents = structuredClone(sampleDocs);
let modelAvailable = false;
let modelName = '';
let useModel = false;
let currentAnswer = '';

const examples = [
  'How are urgent incidents handled?',
  'When can a customer request a refund?',
  'What happens after a new client signs?',
  'How is an invoice exception approved?'
];

function el(tag, className, content) { const item = document.createElement(tag); if (className) item.className = className; if (content != null) item.textContent = content; return item; }
function setNotice(text, error = false) { notice.textContent = text; notice.classList.toggle('error', error); }
function renderSources() {
  const sidebar = $('#sidebar-sources');
  sidebar.replaceChildren(...documents.map(doc => {
    const item = el('div', 'source-item');
    item.append(el('span', 'source-icon', '▤'), el('span', '', doc.title));
    return item;
  }));
}

function renderResult(result, askedQuestion) {
  currentAnswer = result.answer;
  $('#answer-mode').textContent = result.mode === 'local-ai' ? `LOCAL AI · ${modelName}` : 'RETRIEVAL PREVIEW';
  const heading = el('div', 'answer-question'); heading.append(el('span', '', 'YOUR QUESTION'), el('strong', '', askedQuestion));
  const body = el('p', 'answer-text', result.answer);
  answerContent.replaceChildren(heading, body);
  $('#copy-button').disabled = false;
  $('#source-count').textContent = String(result.sources.length);
  if (!result.sources.length) { evidenceList.replaceChildren(el('p', 'no-evidence', 'No matching passage. Add a relevant document or ask a different question.')); return; }
  evidenceList.replaceChildren(...result.sources.map((source, index) => {
    const card = el('article', 'evidence-item');
    const top = el('div', 'evidence-top'); top.append(el('span', 'citation', `[${index + 1}]`), el('strong', '', source.title));
    card.append(top, el('div', 'evidence-heading', source.heading), el('p', '', source.text));
    return card;
  }));
}

async function ask(text) {
  const value = text.trim();
  if (!value) return;
  question.value = value;
  const button = $('#ask-button'); button.disabled = true; button.firstChild.textContent = 'Working... ';
  setNotice(useModel ? 'Asking the local Ollama model with relevant excerpts...' : 'Selecting relevant passages in your browser...');
  try {
    const hits = searchKnowledge(value, documents);
    let result = previewAnswer(value, documents);
    if (useModel && hits.length) {
      const response = await fetch('/api/ask', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ question: value, sources: hits.map(hit => ({ title: `${hit.title} — ${hit.heading}`, text: hit.text })) }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Local AI request failed.');
      result = { answer: data.answer, sources: hits, mode: 'local-ai' };
    }
    renderResult(result, value);
    setNotice(result.sources.length ? `Found ${result.sources.length} relevant passage${result.sources.length === 1 ? '' : 's'}. Check the evidence before using the answer.` : 'No source supports this question. The agent will not guess.');
  } catch (error) { setNotice(error.message || 'Could not answer the question.', true); }
  finally { button.disabled = false; button.firstChild.textContent = 'Ask agent '; }
}

$('#examples').replaceChildren(...examples.map(text => {
  const button = el('button', '', text); button.type = 'button'; button.addEventListener('click', () => ask(text)); return button;
}));
$('#ask-form').addEventListener('submit', event => { event.preventDefault(); ask(question.value); });
$('#copy-button').addEventListener('click', async () => {
  try { await navigator.clipboard.writeText(currentAnswer); $('#copy-button').textContent = 'Copied ✓'; setTimeout(() => $('#copy-button').textContent = 'Copy answer', 1800); }
  catch { setNotice('Clipboard access is unavailable in this browser.', true); }
});
$('#file-input').addEventListener('change', async event => {
  const files = [...event.target.files];
  const currentUploads = documents.filter(doc => doc.type === 'Your local file').length;
  if (currentUploads + files.length > 5) { setNotice('You can add up to 5 local files per session.', true); event.target.value = ''; return; }
  for (const file of files) {
    if (!/\.(txt|md)$/i.test(file.name) || file.size > 25000) { setNotice(`Skipped ${file.name}: choose a .txt or .md file under 25 KB.`, true); continue; }
    try { documents.push(documentFromText(file.name, await file.text())); }
    catch (error) { setNotice(`Skipped ${file.name}: ${error.message}`, true); }
  }
  event.target.value = '';
  renderSources();
  if (question.value.trim()) ask(question.value);
  else setNotice('Your local file is ready to search. It has not been uploaded.');
});
$('#reset-button').addEventListener('click', () => { documents = structuredClone(sampleDocs); renderSources(); question.value = ''; currentAnswer = ''; answerContent.replaceChildren(el('p', 'reset-message', 'Sample sources restored. Ask another question.')); evidenceList.replaceChildren(el('p', '', 'Relevant passages appear here after a question.')); $('#source-count').textContent = '0'; $('#copy-button').disabled = true; setNotice('Sample sources restored.'); });
modeButton.addEventListener('click', () => { useModel = !useModel; $('#mode-title').textContent = useModel ? `Local AI · ${modelName}` : 'Retrieval demo'; $('#mode-description').textContent = useModel ? 'Relevant excerpts are sent to Ollama on this computer.' : 'Evidence is selected in your browser; no AI model is called.'; modeButton.textContent = useModel ? 'Use retrieval demo' : 'Use local AI'; if (question.value.trim()) ask(question.value); });

async function detectModel() {
  try {
    const response = await fetch('/api/health', { signal: AbortSignal.timeout(3000) });
    if (!response.ok || !response.headers.get('content-type')?.includes('application/json')) return;
    const data = await response.json();
    if (!data.available) { setNotice(data.reason || 'Local AI is unavailable. The browser demo is ready.'); return; }
    modelAvailable = true; modelName = data.model; modeButton.hidden = false;
    setNotice(`Local Ollama model ${modelName} is available. You can switch modes.`);
  } catch { /* Static hosting has no local model endpoint. */ }
}

renderSources();
ask(examples[0]);
detectModel();
