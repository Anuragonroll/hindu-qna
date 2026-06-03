import { useState, useRef, useEffect, useCallback } from 'react';
import { FiBook, FiLoader } from 'react-icons/fi';

const ALIAS_PATTERN = /@(BG|SB|CC|ISO|NOI|BHAGAVADGITA|GITA|BHAGAVATAM|BHAGAVATAPURANA|CAITANYA|CARITAMRTA|ISOPANISHAD|NECTAR)(?:[\s.][^\s@]*)?$/i;

const ALIAS_TO_BOOK = {
  BG: { book: 'bg', parts: 2 },
  BHAGAVADGITA: { book: 'bg', parts: 2 },
  GITA: { book: 'bg', parts: 2 },
  SB: { book: 'sb', parts: 3 },
  BHAGAVATAM: { book: 'sb', parts: 3 },
  BHAGAVATAPURANA: { book: 'sb', parts: 3 },
  CC: { book: 'cc', parts: 2 },
  CAITANYA: { book: 'cc', parts: 2 },
  CARITAMRTA: { book: 'cc', parts: 2 },
  ISO: { book: 'iso', parts: 1 },
  ISOPANISHAD: { book: 'iso', parts: 1 },
  NOI: { book: 'noi', parts: 1 },
  NECTAR: { book: 'noi', parts: 1 }
};

function detectTrigger(text, caret) {
  const before = text.slice(0, caret);
  const m = before.match(/(^|[\s\n])@(BG|SB|CC|ISO|NOI|BHAGAVADGITA|GITA|BHAGAVATAM|BHAGAVATAPURANA|CAITANYA|CARITAMRTA|ISOPANISHAD|NECTAR)([\s.][^\s@]*)?$/i);
  if (!m) return null;
  const alias = m[2].toUpperCase();
  const after = (m[3] || '').trim();
  const startIndex = before.length - (m[0].length - (m[1] ? m[1].length : 0));
  return { alias, after, startIndex, query: m[0].replace(/^[\s\n]/, '') };
}

function buildRefString(alias, after) {
  const sep = ' ';
  return `@${alias}${sep}${after}`.trim();
}

function getCaretCoordinates(textarea, position) {
  // Mirror-div technique: copy textarea styles + content-up-to-caret, measure where it lands
  const div = document.createElement('div');
  const style = getComputedStyle(textarea);
  const props = [
    'boxSizing', 'width', 'height', 'overflowX', 'overflowY',
    'borderTopWidth', 'borderRightWidth', 'borderBottomWidth', 'borderLeftWidth', 'borderStyle',
    'paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft',
    'fontStyle', 'fontVariant', 'fontWeight', 'fontStretch', 'fontSize', 'fontSizeAdjust',
    'lineHeight', 'fontFamily',
    'textAlign', 'textTransform', 'textIndent', 'textDecoration',
    'letterSpacing', 'wordSpacing', 'tabSize'
  ];
  div.style.position = 'absolute';
  div.style.visibility = 'hidden';
  div.style.whiteSpace = 'pre-wrap';
  div.style.wordWrap = 'break-word';
  div.style.top = '0';
  div.style.left = '-9999px';
  for (const p of props) div.style[p] = style[p];
  div.textContent = textarea.value.substring(0, position);
  const span = document.createElement('span');
  span.textContent = textarea.value.substring(position) || '.';
  div.appendChild(span);
  document.body.appendChild(div);
  const coords = { top: span.offsetTop, left: span.offsetLeft, height: parseInt(style.lineHeight) || 20 };
  document.body.removeChild(div);
  return coords;
}

const ShlokaAutocomplete = ({ value, onChange, placeholder, rows = 8, onPreviewChange }) => {
  // ── Inline preview state ──────────────────────────────────────────
  const [inlinePreviews, setInlinePreviews] = useState([]);
  const [previewsLoading, setPreviewsLoading] = useState(false);
  const previewCacheRef = useRef({}); // keyed by ref-string
  const previewDebounceRef = useRef(null);
  const textareaRef = useRef(null);
  const wrapperRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState(0);
  const [trigger, setTrigger] = useState(null);
  const [popupStyle, setPopupStyle] = useState({});
  const debounceRef = useRef(null);
  const abortRef = useRef(null);

  // ── Refresh inline preview cards ──────────────────────────────────
  const refreshInlinePreviews = useCallback(async (text) => {
    if (!text || !text.includes('@')) {
      setInlinePreviews([]);
      return;
    }
    // Find all complete @-references in the text
    const refRegex = /@(BG|SB|CC|ISO|NOI)[\s.]+(\d+)[\s.]+(\d+)(?:[\s.]+(\d+))?/gi;
    const found = [];
    let m;
    while ((m = refRegex.exec(text)) !== null) {
      found.push(m[0].trim());
    }
    if (found.length === 0) {
      setInlinePreviews([]);
      return;
    }
    const unique = [...new Set(found)];
    // Filter out already-cached and already-displayed
    const toFetch = unique.filter(r => !previewCacheRef.current[r]);
    if (toFetch.length === 0) return;
    setPreviewsLoading(true);
    const results = await Promise.allSettled(
      toFetch.map(async (ref) => {
        const res = await fetch(`/api/shlokas/parse?ref=${encodeURIComponent(ref)}`);
        const data = await res.json();
        if (!data.partial && data.matches?.[0]) {
          return { ref, data: data.matches[0] };
        }
        // Cache empty result so we don't re-fetch
        return { ref, data: null };
      })
    );
    const newCache = { ...previewCacheRef.current };
    const newPreviews = [];
    for (const result of results) {
      if (result.status === 'fulfilled' && result.value) {
        newCache[result.value.ref] = result.value.data;
        if (result.value.data) newPreviews.push(result.value);
      }
    }
    previewCacheRef.current = newCache;
    // Rebuild full preview list from cache for all unique refs
    const fullPreviews = [];
    for (const ref of unique) {
      const cached = previewCacheRef.current[ref];
      if (cached) fullPreviews.push({ ref, data: cached });
    }
    // Remove stale previews (refs that were deleted from text)
    setInlinePreviews(fullPreviews);
    setPreviewsLoading(false);
  }, []);

  const closePopup = useCallback(() => {
    setOpen(false);
    setMatches([]);
    setSelected(0);
    setTrigger(null);
  }, []);

  const fetchMatches = useCallback(async (alias, after) => {
    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setLoading(true);
    try {
      const ref = buildRefString(alias, after);
      const res = await fetch(`/api/shlokas/parse?ref=${encodeURIComponent(ref)}`, { signal: controller.signal });
      const data = await res.json();
      setMatches((data.matches || []).slice(0, 8));
      setSelected(0);
    } catch (err) {
      if (err.name !== 'AbortError') setMatches([]);
    } finally {
      if (!controller.signal.aborted) setLoading(false);
    }
  }, []);

  const positionPopupAtCaret = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    const caret = el.selectionStart || 0;
    const coords = getCaretCoordinates(el, caret);
    const rect = el.getBoundingClientRect();
    // Place popup just below the caret line
    const top = rect.top + coords.top + coords.height - el.scrollTop + 4;
    const left = Math.min(rect.left, window.innerWidth - 380);
    setPopupStyle({
      position: 'fixed',
      top,
      left,
      width: 360,
      zIndex: 50
    });
  }, []);

  const handleChange = (e) => {
    const newValue = e.target.value;
    const caret = e.target.selectionStart || 0;
    onChange(newValue);
    // Autocomplete trigger detection
    const t = detectTrigger(newValue, caret);
    if (!t) { closePopup(); } else {
      setTrigger(t);
      setOpen(true);
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        fetchMatches(t.alias, t.after);
      }, 250);
      requestAnimationFrame(positionPopupAtCaret);
    }
    // Debounced inline preview refresh
    if (previewDebounceRef.current) clearTimeout(previewDebounceRef.current);
    previewDebounceRef.current = setTimeout(() => {
      refreshInlinePreviews(newValue);
    }, 500);
  };

  const handleClick = () => {
    if (open) requestAnimationFrame(positionPopupAtCaret);
  };

  const handleKeyUp = () => {
    if (open) positionPopupAtCaret();
  };

  useEffect(() => {
    if (!open) return;
    const onScrollOrResize = () => positionPopupAtCaret();
    window.addEventListener('scroll', onScrollOrResize, true);
    window.addEventListener('resize', onScrollOrResize);
    return () => {
      window.removeEventListener('scroll', onScrollOrResize, true);
      window.removeEventListener('resize', onScrollOrResize);
    };
  }, [open, positionPopupAtCaret]);

  useEffect(() => () => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (previewDebounceRef.current) clearTimeout(previewDebounceRef.current);
    if (abortRef.current) abortRef.current.abort();
  }, []);

  useEffect(() => {
    if (trigger) setOpen(true);
  }, [trigger]);

  const insertMatch = (match) => {
    if (!trigger) return;
    const el = textareaRef.current;
    if (!el) return;
    const caret = el.selectionStart || 0;
    const before = value.slice(0, trigger.startIndex);
    const after = value.slice(caret);
    const alias = trigger.alias;
    let refText;
    if (match.book === 'sb') refText = `@${alias} ${match.canto}.${match.chapter}.${match.verse}`;
    else if (match.book === 'cc') refText = `@${alias} ${match.part || 'adi'} ${match.chapter}.${match.verse}`;
    else if (match.book === 'iso') refText = `@${alias} ${match.mantra || match.verse}`;
    else if (match.book === 'noi') refText = `@${alias} ${match.verse}`;
    else refText = `@${alias} ${match.chapter}.${match.verse}`;
    const inserted = `${refText} `;
    const newValue = before + inserted + after;
    onChange(newValue);
    closePopup();
    // Refresh inline previews with the new value
    if (previewDebounceRef.current) clearTimeout(previewDebounceRef.current);
    previewDebounceRef.current = setTimeout(() => {
      refreshInlinePreviews(newValue);
    }, 200);
    requestAnimationFrame(() => {
      const pos = before.length + inserted.length;
      el.focus();
      el.setSelectionRange(pos, pos);
    });
  };

  const handleKeyDown = (e) => {
    if (!open) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelected(s => Math.min(s + 1, Math.max(matches.length - 1, 0)));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelected(s => Math.max(s - 1, 0));
    } else if (e.key === 'Enter' && matches[selected]) {
      e.preventDefault();
      insertMatch(matches[selected]);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      closePopup();
    }
  };

  const handleBlur = (e) => {
    if (open && e.relatedTarget && e.relatedTarget.dataset && e.relatedTarget.dataset.shlokaMatch) return;
    setTimeout(() => closePopup(), 150);
    if (onPreviewChange) onPreviewChange();
  };

  const aliasBook = trigger ? ALIAS_TO_BOOK[trigger.alias] : null;
  const isFullRef = trigger && aliasBook && (() => {
    const parts = (trigger.after || '').split('.').filter(Boolean);
    return parts.length >= aliasBook.parts;
  })();

  return (
    <div className="relative" ref={wrapperRef}>
      <textarea
        ref={textareaRef}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onKeyUp={handleKeyUp}
        onBlur={handleBlur}
        onClick={handleClick}
        className="w-full border rounded-lg p-4 text-sm font-mono"
        rows={rows}
        placeholder={placeholder}
      />
      {open && trigger && (
        <div
          data-shloka-popup
          style={popupStyle}
          className="bg-white border border-orange-300 rounded-md shadow-xl max-h-72 overflow-y-auto text-sm"
        >
          <div className="px-3 py-1.5 bg-orange-50 border-b border-orange-200 text-[11px] font-semibold text-orange-800 flex items-center justify-between">
            <span>
              <FiBook className="inline mr-1" />
              {buildRefString(trigger.alias, trigger.after)}
              {isFullRef ? ' · single match' : ' · select a verse'}
            </span>
            {loading && <FiLoader className="animate-spin" size={11} />}
          </div>
          {loading && matches.length === 0 ? (
            <div className="p-3 text-xs text-gray-500 text-center">
              <FiLoader className="inline animate-spin mr-1" /> Looking up…
            </div>
          ) : matches.length === 0 ? (
            <div className="p-3 text-xs text-gray-500 text-center">No matching verse.</div>
          ) : (
            <ul>
              {matches.map((m, i) => (
                <li key={`${m.book}-${m.canto || ''}-${m.chapter}-${m.verse || m.mantra}-${i}`}>
                  <button
                    type="button"
                    data-shloka-match
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => insertMatch(m)}
                    onMouseEnter={() => setSelected(i)}
                    className={`w-full text-left px-3 py-1.5 border-b border-gray-100 last:border-b-0 ${
                      i === selected ? 'bg-orange-100' : 'hover:bg-gray-50'
                    }`}
                  >
                    <div className="text-[11px] font-semibold text-orange-700">
                      {m.label}
                    </div>
                    {m.translation && (
                      <div className="text-xs text-gray-600 line-clamp-2 mt-0.5">
                        {m.translation.replace(/^Translation\s*/i, '').slice(0, 160)}
                      </div>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )}
          <div className="px-3 py-1 bg-gray-50 border-t border-gray-200 text-[10px] text-gray-500 flex items-center justify-between">
            <span>↑↓ Enter Esc</span>
            <span>{matches.length} match{matches.length !== 1 ? 'es' : ''}</span>
          </div>
        </div>
      )}

      {/* Inline shloka preview cards — shown below the textarea */}
      {inlinePreviews.length > 0 && (
        <div className="mt-3 space-y-2">
          {previewsLoading && (
            <div className="text-xs text-gray-500 flex items-center gap-1">
              <FiLoader className="animate-spin" size={11} />
              Loading shloka preview…
            </div>
          )}
          {inlinePreviews.map(({ ref, data }) => (
            <div
              key={ref}
              className="border-l-4 border-orange-400 bg-gradient-to-br from-orange-50 to-yellow-50 rounded-r-lg p-3 shadow-sm"
            >
              <div className="flex items-start justify-between mb-1">
                <div className="text-[11px] font-semibold text-orange-700 uppercase tracking-wider flex items-center gap-1">
                  <FiBook size={12} />
                  {data.label || ref}
                </div>
              </div>
              {data.sanskrit && (
                <div
                  className="text-base text-gray-900 leading-relaxed mb-1"
                  style={{ fontFamily: 'serif' }}
                >
                  {data.sanskrit}
                </div>
              )}
              {data.translation && (
                <div className="text-sm text-gray-700 leading-relaxed">
                  {data.translation.replace(/^Translation\s*/i, '').slice(0, 200)}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ShlokaAutocomplete;
