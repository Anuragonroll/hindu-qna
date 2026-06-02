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

const ShlokaAutocomplete = ({ value, onChange, placeholder, rows = 8, onPreviewChange }) => {
  const textareaRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState(0);
  const [trigger, setTrigger] = useState(null);
  const [popupStyle, setPopupStyle] = useState({});
  const debounceRef = useRef(null);
  const abortRef = useRef(null);

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
      setMatches(data.matches || []);
      setSelected(0);
    } catch (err) {
      if (err.name !== 'AbortError') {
        setMatches([]);
      }
    } finally {
      if (!controller.signal.aborted) setLoading(false);
    }
  }, []);

  const handleChange = (e) => {
    const newValue = e.target.value;
    const caret = e.target.selectionStart || 0;
    onChange(newValue);
    const t = detectTrigger(newValue, caret);
    if (!t) {
      closePopup();
      return;
    }
    setTrigger(t);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetchMatches(t.alias, t.after);
    }, 250);
    positionPopup();
  };

  const positionPopup = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    setPopupStyle({
      position: 'fixed',
      top: rect.bottom + 4,
      left: rect.left,
      width: Math.min(rect.width, 600),
      zIndex: 50
    });
  }, []);

  useEffect(() => {
    if (!open) return;
    const handler = () => positionPopup();
    window.addEventListener('scroll', handler, true);
    window.addEventListener('resize', handler);
    return () => {
      window.removeEventListener('scroll', handler, true);
      window.removeEventListener('resize', handler);
    };
  }, [open, positionPopup]);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      if (abortRef.current) abortRef.current.abort();
    };
  }, []);

  useEffect(() => {
    if (open && matches.length > 0) {
      setOpen(true);
    } else if (open && !loading && matches.length === 0) {
      // keep open briefly to show "no results"
    }
  }, [matches, loading, open]);

  useEffect(() => {
    if (trigger) {
      setOpen(true);
    }
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
    if (open && e.relatedTarget && e.relatedTarget.dataset && e.relatedTarget.dataset.shlokaMatch) {
      return;
    }
    setTimeout(() => closePopup(), 150);
    if (onPreviewChange) onPreviewChange();
  };

  const aliasBook = trigger ? ALIAS_TO_BOOK[trigger.alias] : null;
  const isFullRef = trigger && aliasBook && (() => {
    const parts = (trigger.after || '').split('.').filter(Boolean);
    return parts.length >= aliasBook.parts;
  })();

  return (
    <div className="relative">
      <textarea
        ref={textareaRef}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
        onClick={positionPopup}
        className="w-full border rounded-lg p-4 text-sm font-mono"
        rows={rows}
        placeholder={placeholder}
      />
      {open && trigger && (
        <div
          style={popupStyle}
          data-shloka-popup
          className="bg-white border-2 border-orange-300 rounded-lg shadow-2xl max-h-80 overflow-y-auto"
        >
          <div className="px-3 py-2 bg-orange-50 border-b border-orange-200 text-xs font-semibold text-orange-800 flex items-center justify-between">
            <span>
              <FiBook className="inline mr-1" />
              {buildRefString(trigger.alias, trigger.after)}
              {isFullRef ? ' — single verse' : ' — type chapter.verse'}
            </span>
            {loading && <FiLoader className="animate-spin" />}
          </div>
          {loading && matches.length === 0 ? (
            <div className="p-4 text-sm text-gray-500 text-center">
              <FiLoader className="inline animate-spin mr-2" />
              Looking up…
            </div>
          ) : matches.length === 0 ? (
            <div className="p-4 text-sm text-gray-500 text-center">
              No matching verse found.
            </div>
          ) : (
            <ul>
              {matches.map((m, i) => (
                <li
                  key={`${m.book}-${m.canto || ''}-${m.chapter}-${m.verse || m.mantra}-${i}`}
                >
                  <button
                    type="button"
                    data-shloka-match
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => insertMatch(m)}
                    onMouseEnter={() => setSelected(i)}
                    className={`w-full text-left px-3 py-2 border-b border-gray-100 ${
                      i === selected ? 'bg-orange-100' : 'hover:bg-gray-50'
                    }`}
                  >
                    <div className="text-xs font-semibold text-orange-700 mb-0.5">
                      {m.label}
                    </div>
                    {m.sanskrit && (
                      <div className="text-xs text-gray-700 line-clamp-1 mb-0.5" style={{ fontFamily: 'serif' }}>
                        {m.sanskrit.replace(/\n/g, ' ').slice(0, 100)}
                      </div>
                    )}
                    {m.translation && (
                      <div className="text-xs text-gray-600 line-clamp-2">
                        {m.translation.slice(0, 200)}
                      </div>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )}
          <div className="px-3 py-1.5 bg-gray-50 border-t border-gray-200 text-[10px] text-gray-500 flex items-center justify-between">
            <span>↑↓ navigate · Enter to insert · Esc to close</span>
            <span>{matches.length} match{matches.length !== 1 ? 'es' : ''}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default ShlokaAutocomplete;
