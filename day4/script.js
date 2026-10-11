const MAX_CHARS = 200;
const WARN_AT = 180;
const DRAFT_KEY = 'draft';
const THEME_KEY = 'theme';

const noteText = document.getElementById('note-text');
const charCount = document.getElementById('char-count');
const wordCount = document.getElementById('word-count');
const clearBtn = document.getElementById('clear-btn');
const themeToggle = document.getElementById('theme-toggle');

function updateCounts() {
  const text = noteText.value;
  const length = text.length;
  const trimmed = text.trim();
  const words = trimmed === '' ? 0 : trimmed.split(/\s+/).length;

  charCount.textContent = `${length} / ${MAX_CHARS} characters`;
  wordCount.textContent = `${words} ${words === 1 ? 'word' : 'words'}`;

  charCount.classList.toggle('warning', length > WARN_AT && length <= MAX_CHARS);
  charCount.classList.toggle('over', length > MAX_CHARS);
}

function saveDraft() {
  localStorage.setItem(DRAFT_KEY, noteText.value);
}

function clearAll() {
  noteText.value = '';
  localStorage.removeItem(DRAFT_KEY);
  updateCounts();
}

function applyTheme(isDark) {
  document.body.classList.toggle('dark', isDark);
  themeToggle.textContent = isDark ? 'Light mode' : 'Dark mode';
}

// Typing: update counters and save the draft
noteText.addEventListener('input', () => {
  updateCounts();
  saveDraft();
});

// Escape inside the textarea clears everything
noteText.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') {
    clearAll();
  }
});

clearBtn.addEventListener('click', clearAll);

themeToggle.addEventListener('click', () => {
  const isDark = !document.body.classList.contains('dark');
  applyTheme(isDark);
  localStorage.setItem(THEME_KEY, isDark ? 'dark' : 'light');
});

// On page load: restore draft and theme, then update counters
noteText.value = localStorage.getItem(DRAFT_KEY) || '';
applyTheme(localStorage.getItem(THEME_KEY) === 'dark');
updateCounts();