const stopWords = new Set(['a','an','and','are','as','at','be','by','can','do','does','for','from','how','i','in','is','it','of','on','or','our','the','to','we','what','when','where','who','with','within','you']);
export const tokens = text => [...new Set(String(text ?? '').toLowerCase().match(/[a-z0-9$]+/g) ?? [])].filter(word => word.length > 1 && !stopWords.has(word));

export function searchKnowledge(question, documents, limit = 3) {
  const words = tokens(question);
  if (!words.length) return [];
  return documents.flatMap(doc => doc.sections.map((section, index) => {
    const titleWords = tokens(`${doc.title} ${section.heading}`);
    const bodyWords = tokens(section.text);
    const score = words.reduce((sum, word) => sum + (titleWords.includes(word) ? 4 : 0) + (bodyWords.includes(word) ? 1 : 0), 0);
    return { id: `${doc.id}-${index}`, docId: doc.id, title: doc.title, heading: section.heading, text: section.text, score };
  })).filter(hit => hit.score > 0).sort((a, b) => b.score - a.score || a.title.localeCompare(b.title)).slice(0, limit);
}

export function previewAnswer(question, documents) {
  const sources = searchKnowledge(question, documents);
  if (!sources.length) return { answer: "I couldn't find support for that in the loaded sources. I won't guess. Try a different question or add a relevant document.", sources: [], mode: 'retrieval-demo' };
  const extracts = sources.slice(0, 2).map((source, index) => `${source.text} [${index + 1}]`);
  return { answer: extracts.join('\n\n'), sources, mode: 'retrieval-demo' };
}

export function documentFromText(filename, content) {
  const text = String(content ?? '').trim();
  if (!text || text.length > 20000) throw new Error('Choose a non-empty text file smaller than 20,000 characters.');
  const title = String(filename ?? 'Uploaded document').replace(/\.(txt|md)$/i, '').trim().slice(0, 80) || 'Uploaded document';
  const sections = text.split(/\n\s*\n/).map(part => part.trim()).filter(Boolean).slice(0, 25).map((part, index) => ({ heading: `Section ${index + 1}`, text: part.slice(0, 1500) }));
  return { id: `upload-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, title, type: 'Your local file', updated: 'This session', sections };
}
