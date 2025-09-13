// popup.js - ready to paste
document.addEventListener('DOMContentLoaded', () => {
  // Elements
  const adhdBtn = document.getElementById('adhdMode');
  const dyslexiaBtn = document.getElementById('dyslexiaMode');
  const adhdUI = document.getElementById('adhdUI');
  const dyslexiaUI = document.getElementById('dyslexiaUI');

  // default show ADHD UI for first open
  showUI('adhd');

  adhdBtn.addEventListener('click', () => showUI('adhd'));
  dyslexiaBtn.addEventListener('click', () => showUI('dyslexia'));

  setupADHD();
  setupDyslexia();
});

function showUI(mode) {
  const adhdUI = document.getElementById('adhdUI');
  const dyslexiaUI = document.getElementById('dyslexiaUI');
  if (mode === 'adhd') {
    adhdUI.style.display = 'block';
    dyslexiaUI.style.display = 'none';
  } else {
    adhdUI.style.display = 'none';
    dyslexiaUI.style.display = 'block';
  }
}

// ---------------- ADHD ----------------
function setupADHD() {
  const simplifySelectionBtn = document.getElementById('simplifySelection');
  const outputEl = document.getElementById('output');
  const loader = document.getElementById('loader');

  simplifySelectionBtn.addEventListener('click', async () => {
    try {
      if (!ensureApiKey(outputEl)) return;
      outputEl.innerText = 'Getting selected text...';
      show(loader);
      const selectedText = await getSelectedTextFromPage();
      hide(loader);
      if (!selectedText.trim()) return outputEl.innerText = '❗ Please select some text first.';
      outputEl.innerText = 'Simplifying...';
      show(loader);
      const chunked = chunkText(selectedText, 1000); // slightly bigger for summarization
      const parts = [];
      for (let i = 0; i < chunked.length; i++) {
        const part = await summarizeTextADHD(chunked[i]);
        parts.push(part);
      }
      hide(loader);
      outputEl.innerText = parts.join('\n\n');
    } catch (err) {
      hide(document.getElementById('loader'));
      console.error(err);
      outputEl.innerText = 'Error: ' + (err.message || err);
    }
  });
}

// ---------------- Dyslexia ----------------
function setupDyslexia() {
  const dysSelBtn = document.getElementById('dyslexiaSelection');
  const outputEl = document.getElementById('outputDyslexia');
  const loader = document.getElementById('loaderDys');
  const progressEl = document.getElementById('progress');

  dysSelBtn.addEventListener('click', async () => {
    try {
      if (!ensureApiKey(outputEl)) return;
      outputEl.innerText = 'Getting selected text...';
      show(loader);
      hide(progressEl);
      const selectedText = await getSelectedTextFromPage();
      hide(loader);
      if (!selectedText.trim()) return outputEl.innerText = '❗ Please select some text first.';
      // limit per chunk to 500 characters for reliable simplifying
      const MAX = 500;
      const chunks = chunkText(selectedText, MAX);
      const simplifiedParts = [];

      show(loader);
      if (chunks.length > 1) {
        progressEl.style.display = 'block';
        progressEl.innerText = `Processing 0 / ${chunks.length}`;
      }

      for (let i = 0; i < chunks.length; i++) {
        progressEl.innerText = `Processing ${i + 1} / ${chunks.length}`;
        const out = await simplifyTextDyslexia(chunks[i]);
        simplifiedParts.push(out);
      }

      hide(loader);
      progressEl.style.display = 'none';
      const final = simplifiedParts.join(' ');
      // sanitize basic HTML from model output then show in dyslexia style
      outputEl.innerHTML = `<div class="dyslexia-text">${escapeHtml(final)}</div>`;
    } catch (err) {
      hide(document.getElementById('loaderDys'));
      console.error(err);
      outputEl.innerText = 'Error: ' + (err.message || err);
    }
  });
}

// ---------------- Utilities ----------------
async function getSelectedTextFromPage() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  const results = await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: () => window.getSelection().toString()
  });
  return results[0]?.result || '';
}

function chunkText(text, maxLen) {
  if (!text) return [];
  const parts = [];
  let idx = 0;
  while (idx < text.length) {
    let chunk = text.slice(idx, idx + maxLen);
    // try not to cut mid-word: extend to next space if available and within reasonable bounds
    if (idx + maxLen < text.length) {
      const nextSpace = text.indexOf(' ', idx + maxLen);
      if (nextSpace !== -1 && nextSpace - idx <= maxLen + 30) {
        chunk = text.slice(idx, nextSpace);
        idx = nextSpace + 1;
      } else {
        idx = idx + maxLen;
      }
    } else {
      idx = idx + chunk.length;
    }
    parts.push(chunk.trim());
  }
  return parts;
}

function escapeHtml(unsafe) {
  return unsafe
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')
    .replaceAll('\n', '<br>');
}

function show(el){ if(el) el.style.display = 'block'; }
function hide(el){ if(el) el.style.display = 'none'; }

function ensureApiKey(outputEl) {
  if (typeof HUGGINGFACE_API_KEY === 'undefined' || !HUGGINGFACE_API_KEY.startsWith('hf_')) {
    if (outputEl) outputEl.innerText = '⚠ HuggingFace API key missing. Add it to config.js';
    return false;
  }
  return true;
}

// ---------------- Models / API calls ----------------
async function summarizeTextADHD(inputText) {
  const url = 'https://api-inference.huggingface.co/models/facebook/bart-large-cnn';
  return callHFModel(url, inputText);
}

async function simplifyTextDyslexia(inputText) {
  const url = "https://api-inference.huggingface.co/models/sshleifer/distilbart-cnn-12-6";
  const prompt = "Rewrite this text in very short, simple, dyslexia-friendly sentences. Use plain, easy words:\n\n" + inputText;
  return callHFModel(url, prompt);
}


async function callHFModel(url, input) {
  const resp = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${HUGGINGFACE_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ inputs: input })
  });
  if (!resp.ok) {
    const txt = await resp.text().catch(()=> '');
    throw new Error(`HuggingFace API returned ${resp.status}: ${txt}`);
  }
  const data = await resp.json();
  // handle common HF response shapes
  if (Array.isArray(data) && data[0]) {
    // many inference endpoints return array with generated_text or summary_text
    return data[0].generated_text || data[0].summary_text || stringifySafe(data[0]);
  } else if (typeof data === 'object') {
    return data.generated_text || data.summary_text || stringifySafe(data);
  } else if (typeof data === 'string') {
    return data;
  }
  return 'No output.';
}

function stringifySafe(obj) {
  try { return JSON.stringify(obj); } catch (e) { return String(obj); }
}
