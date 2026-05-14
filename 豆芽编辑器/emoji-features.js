// emoji-features.js
// This file contains emoji-related functionality for the WeChat editor.
// It gets injected into the HTML as a separate <script> block,
// OUTSIDE the template literal, to avoid escape sequence issues.

const emojiJS = `
// === EMOJI DATA ===
const EMOJI_DATA = {
  "\u5e38\u7528": ["\ud83d\ude00","\ud83d\ude02","\ud83e\udd14","\ud83d\udc4d","\ud83d\udc4e","\ud83d\udd25","\ud83d\udca1","\u2705","\u26a0\ufe0f","\ud83d\udccc","\ud83d\udccb","\ud83d\ude80","\ud83d\udcc8","\ud83c\udfaf","\ud83d\udcaa","\u2764\ufe0f"],
  "\u6807\u9898": ["\ud83d\udccc","\ud83d\udca1","\ud83d\ude80","\ud83d\udcc8","\ud83d\udd25","\u26a0\ufe0f","\u2705","\ud83d\udcd6","\ud83c\udfaf","\ud83d\udcbc","\ud83d\udd27","\ud83d\udcda","\ud83c\udf93","\ud83c\udf1f","\ud83d\udcbb","\ud83c\udfc6"],
  "\u5217\u8868": ["\u2713","\u2714\ufe0f","\u2705","\u25a0","\u25cf","\u25c6","\u25ba","\u25b8","\u25aa","\u2023","\u00b7","\u2192"],
  "\u60c5\u7eea": ["\ud83d\ude0a","\ud83d\ude05","\ud83e\udd14","\ud83d\ude2e","\ud83d\udcaa","\ud83d\udd25","\ud83d\udc4d","\ud83d\udc4e","\ud83c\udf89","\ud83d\udcaf","\ud83d\ude22","\ud83d\ude24","\ud83d\ude4f","\ud83d\udc94","\ud83e\udd73","\ud83d\ude0e"],
  "\u7b26\u53f7": ["\u2605","\u2606","\u2660","\u2663","\u2665","\u2666","\u26a1","\u2600\ufe0f","\u2601\ufe0f","\u2602\ufe0f","\u267b\ufe0f","\u2699\ufe0f","\u2b50","\ud83d\ud539","\ud83d\ud538","\u2744\ufe0f"]
};

const EMOJI_HEADING_MAP = {
  "\u5165\u95e8|\u8d77\u6b65|\u5f00\u59cb|\u5feb\u901f|\u7b2c\u4e00|\u7b2c\u4e00\u6b65": "\ud83d\ude80",
  "\u6280\u5de7|\u65b9\u6cd5|\u5982\u4f55|\u600e\u4e48|\u6559\u7a0b|\u6307\u5357|\u5b9e\u64cd": "\ud83d\udca1",
  "\u6ce8\u610f|\u8b66\u544a|\u5751|\u4e0d\u8981|\u907f\u514d|\u614e|\u5207\u8bb0": "\u26a0\ufe0f",
  "\u5b8c\u6210|\u6210\u529f|\u641e\u5b9a|\u5b9e\u73b0|\u8fbe\u6210|\u91cc\u7a0b\u7891": "\u2705",
  "\u6570\u636e|\u589e\u957f|\u8d8b\u52bf|\u5206\u6790|\u7edf\u8ba1|\u62a5\u544a": "\ud83d\udcc8",
  "\u603b\u7ed3|\u7ed3\u8bba|\u6700\u540e|\u7ed3\u675f|\u56de\u987e|\u7ed3\u8bed": "\ud83d\udccc",
  "\u5de5\u5177|\u63a8\u8350|\u597d\u7528|\u795e\u5668|\u5fc5\u5907|\u8d44\u6e90": "\ud83d\udd27",
  "\u5bf9\u6bd4|\u533a\u522b|\u4e0d\u540c|vs|PK|\u5927\u6218": "\u26a1",
  "\u6848\u4f8b|\u5b9e\u6218|\u7ecf\u9a8c|\u5206\u4eab|\u4eb2\u6d4b": "\ud83c\udfaf",
  "\u539f\u7406|\u6df1\u5165|\u63ed\u79d8|\u5e95\u5c42|\u67b6\u6784": "\ud83d\udd2c"
};

let emojiPickerOpen = false;

function toggleEmojiPicker() {
  const panel = document.getElementById('emoji-picker');
  if (!panel) return;
  if (panel.classList.contains('visible')) {
    panel.classList.remove('visible');
    emojiPickerOpen = false;
    return;
  }
  const btn = document.getElementById('btn-emoji');
  const rect = btn.getBoundingClientRect();
  const panelWidth = 420;
  const left = Math.min(window.innerWidth - panelWidth - 8, Math.max(8, rect.right - panelWidth));
  panel.style.top = (rect.bottom + 8) + 'px';
  panel.style.left = left + 'px';
  const arrow = panel.querySelector('.emoji-panel-arrow');
  if (arrow) {
    const arrowLeft = Math.max(20, Math.min(panelWidth - 28, rect.left + rect.width / 2 - left - 8));
    arrow.style.left = arrowLeft + 'px';
  }
  panel.classList.add('visible');
  emojiPickerOpen = true;
  renderEmojiTabs();
  renderEmojiGrid('\u5e38\u7528');
  setTimeout(() => {
    document.addEventListener('click', closeEmojiOnOutside, { once: true });
  }, 10);
}

function closeEmojiOnOutside(e) {
  const panel = document.getElementById('emoji-picker');
  if (!panel) return;
  if (panel.contains(e.target) || e.target.id === 'btn-emoji') {
    if (emojiPickerOpen) {
      setTimeout(() => {
        document.addEventListener('click', closeEmojiOnOutside, { once: true });
      }, 10);
    }
  } else {
    panel.classList.remove('visible');
    emojiPickerOpen = false;
  }
}

function renderEmojiTabs() {
  const container = document.getElementById('emoji-tabs');
  if (!container) return;
  container.innerHTML = '';
  Object.keys(EMOJI_DATA).forEach(cat => {
    const btn = document.createElement('button');
    btn.className = 'emoji-tab' + (cat === '\u5e38\u7528' ? ' active' : '');
    btn.textContent = cat;
    btn.onclick = () => {
      container.querySelectorAll('.emoji-tab').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      renderEmojiGrid(cat);
    };
    container.appendChild(btn);
  });
}

function renderEmojiGrid(category) {
  const container = document.getElementById('emoji-grid');
  if (!container) return;
  const emojis = EMOJI_DATA[category] || EMOJI_DATA['\u5e38\u7528'];
  container.innerHTML = '';
  if (emojis.length === 0) {
    container.innerHTML = '<div class="emoji-empty">\u6682\u65e0\u6570\u636e</div>';
    return;
  }
  emojis.forEach(em => {
    const item = document.createElement('button');
    item.className = 'emoji-item';
    item.textContent = em;
    item.title = em;
    item.onclick = () => insertEmoji(em);
    container.appendChild(item);
  });
}

function insertEmoji(emoji) {
  const mode = currentMode;
  if (mode === 'source') {
    const editor = document.getElementById('source-editor');
    if (!editor) return;
    const start = editor.selectionStart;
    const end = editor.selectionEnd;
    const val = editor.value;
    editor.value = val.slice(0, start) + emoji + val.slice(end);
    editor.selectionStart = editor.selectionEnd = start + emoji.length;
    editor.focus();
  } else if (mode === 'edit') {
    const sel = window.getSelection();
    if (sel.rangeCount > 0) {
      const range = sel.getRangeAt(0);
      const textNode = document.createTextNode(emoji);
      range.insertNode(textNode);
      range.setStartAfter(textNode);
      range.setEndAfter(textNode);
      sel.removeAllRanges();
      sel.addRange(range);
    }
  } else {
    showToast('\u5207\u6362\u5230\u7f16\u8f91\u6216\u6e90\u7801\u6a21\u5f0f\u540e\u53ef\u4ee5\u63d2\u5165 Emoji \ud83d\ude00');
    return;
  }
  showToast('\u5df2\u63d2\u5165 ' + emoji);
}

function suggestEmojiForHeading(line) {
  const clean = line.replace(/^#{1,6}[ \\t]*/, '').trim();
  for (const [pattern, emoji] of Object.entries(EMOJI_HEADING_MAP)) {
    const regex = new RegExp(pattern);
    if (regex.test(clean)) return emoji;
  }
  return null;
}

// Heading emoji suggestion for EDIT mode
function initHeadingEmojiHints() {
  const preview = document.getElementById('article-preview');
  if (!preview) return;

  let hintBubble = document.getElementById('heading-emoji-hint');
  if (!hintBubble) {
    hintBubble = document.createElement('div');
    hintBubble.className = 'emoji-suggest';
    hintBubble.id = 'heading-emoji-hint';
    document.body.appendChild(hintBubble);
  }
  if (preview.dataset.headingEmojiBound === '1') return;
  preview.dataset.headingEmojiBound = '1';

  preview.addEventListener('click', function(e) {
    const heading = e.target.closest('h1,h2,h3,h4,h5,h6');
    hintBubble.classList.remove('show');
    if (!heading || currentMode !== 'edit') return;

    const text = heading.textContent.trim();
    let suggested = null;
    for (const [pattern, emoji] of Object.entries(EMOJI_HEADING_MAP)) {
      const regex = new RegExp(pattern);
      if (regex.test(text)) { suggested = emoji; break; }
    }
    if (!suggested) return;

    const alternatives = Object.values(EMOJI_HEADING_MAP).filter(e => e !== suggested).slice(0, 4);
    let html = '<span class="emoji-suggest-item" data-emoji="' + suggested + '" title="\u70b9\u51fb\u63d2\u5165">' + suggested + '</span>';
    alternatives.forEach(function(em) {
      html += '<span class="emoji-suggest-item" data-emoji="' + em + '" title="\u70b9\u51fb\u63d2\u5165">' + em + '</span>';
    });
    hintBubble.innerHTML = html;

    const rect = heading.getBoundingClientRect();
    hintBubble.style.top = (rect.top - 44) + 'px';
    hintBubble.style.left = rect.left + 'px';
    hintBubble.classList.add('show');

    hintBubble.querySelectorAll('.emoji-suggest-item').forEach(function(item) {
      item.onclick = function(ev) {
        ev.stopPropagation();
        const emoji = this.getAttribute('data-emoji');
        const currentText = heading.textContent.trim();
        const cleanText = currentText.replace(/^[\\p{Emoji_Presentation}\\p{Extended_Pictographic}\\u200d\\uFE0F]+\\s*/u, '');
        heading.textContent = emoji + ' ' + cleanText;
        hintBubble.classList.remove('show');
        showToast('\u5df2\u6dfb\u52a0 ' + emoji);
      };
    });
  });

  preview.addEventListener('scroll', function() {
    hintBubble.classList.remove('show');
  }, { passive: true });
}

// Heading emoji hint for SOURCE mode
function initSourceHeadingHints() {
  const editor = document.getElementById('source-editor');
  if (!editor) return;
  if (editor.dataset.headingEmojiBound === '1') return;
  editor.dataset.headingEmojiBound = '1';

  let hintEl = document.getElementById('src-emoji-hint');
  if (!hintEl) {
    hintEl = document.createElement('div');
    hintEl.className = 'heading-emoji-hint';
    hintEl.id = 'src-emoji-hint';
    const sourceArea = editor.parentElement;
    if (sourceArea) {
      sourceArea.style.position = 'relative';
      sourceArea.appendChild(hintEl);
    }
  }

  const LF = String.fromCharCode(10);

  function showHeadingHint() {
    const pos = editor.selectionStart;
    const val = editor.value;
    const lineStart = val.lastIndexOf(LF, pos - 1) + 1;
    const lineEnd = val.indexOf(LF, pos);
    const line = val.slice(lineStart, lineEnd === -1 ? val.length : lineEnd);
    hintEl.classList.remove('show');

    const headingRe = /^#{1,6}[ \\t]/;
    if (headingRe.test(line)) {
      const suggested = suggestEmojiForHeading(line);
      if (suggested) {
        const hasEmojiRe = new RegExp('^#{1,6}[ \\\\t]+[^\\\\s#\\\\n]*$');
        const hasEmoji2Re = /#{1,6}[ \\t]+[\\p{Emoji_Presentation}]/u;
        let html = '<span class="hint-label">\u5efa\u8bae\uff1a\u70b9\u51fb\u63d2\u5165</span>';
        const Q = String.fromCharCode(39);
        html += '<span class="emoji-suggest-item" onclick="insertEmojiAtSourceLine(' + Q + suggested + Q + ')" title="' + suggested + '">' + suggested + '</span>';
        const alts = Object.values(EMOJI_HEADING_MAP).filter(function(e) { return e !== suggested; }).slice(0, 5);
        alts.forEach(function(em) {
          html += '<span class="emoji-suggest-item" onclick="insertEmojiAtSourceLine(' + Q + em + Q + ')" title="' + em + '">' + em + '</span>';
        });
        hintEl.innerHTML = html;
        hintEl.classList.add('show');
      }
    }
  }

  editor.addEventListener('input', showHeadingHint);
  editor.addEventListener('click', showHeadingHint);
  editor.addEventListener('keyup', showHeadingHint);
}

function insertEmojiAtSourceLine(emoji) {
  const editor = document.getElementById('source-editor');
  if (!editor) return;
  const pos = editor.selectionStart;
  const val = editor.value;
  const LF = String.fromCharCode(10);
  const lineStart = val.lastIndexOf(LF, pos - 1) + 1;
  const lineEnd = val.indexOf(LF, pos);
  const line = val.slice(lineStart, lineEnd === -1 ? val.length : lineEnd);
  const cleanRe = new RegExp('^(#{1,6}[ \\\\t]+)[\\\\p{Emoji_Presentation}\\\\p{Extended_Pictographic}\\\\u200d\\\\uFE0F]*[ \\\\t]*', 'u');
  const cleanLine = line.replace(cleanRe, '$1');
  const headRe = /^(#{1,6}[ \\t]*)/;
  const newLine = cleanLine.replace(headRe, '$1' + emoji + ' ');
  editor.value = val.slice(0, lineStart) + newLine + val.slice(lineEnd === -1 ? val.length : lineEnd);
  editor.focus();
  const hint = document.getElementById('src-emoji-hint');
  if (hint) hint.classList.remove('show');
  showToast('\u5df2\u6dfb\u52a0 ' + emoji);
}

// Initialize emoji hints after DOM is ready
if (typeof initHeadingEmojiHints === 'function') initHeadingEmojiHints();
if (typeof initSourceHeadingHints === 'function') initSourceHeadingHints();
`;

module.exports = emojiJS;
