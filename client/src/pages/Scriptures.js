import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { FiSearch, FiBookOpen, FiCheckCircle, FiClock, FiChevronRight, FiExternalLink, FiX } from 'react-icons/fi';

const BOOKS_META = [
  {
    id: 'bg',
    name: 'Bhagavad Gita',
    tag: 'bhagavad-gita',
    aliases: ['BG', 'GITA', 'BHAGAVADGITA'],
    expectedVerses: 700,
    refFormat: '@BG chapter.verse',
    refExample: '@BG 2.47',
    description: 'The timeless dialogue between Lord Krishna and Arjuna on the battlefield of Kurukshetra, covering dharma, yoga, and the path to liberation.',
  },
  {
    id: 'sb',
    name: 'Śrīmad Bhāgavatam',
    tag: 'srimad-bhagavatam',
    aliases: ['SB', 'BHAGAVATAM', 'BHAGAVATAPURANA'],
    expectedVerses: 18000,
    refFormat: '@SB canto.chapter.verse',
    refExample: '@SB 1.2.6',
    description: 'The crown jewel of Vedic literature, comprising 12 cantos that describe the pastimes of Lord Krishna and the path of devotion.',
  },
  {
    id: 'cc',
    name: 'Caitanya-caritāmṛta',
    tag: 'caitanya-caritamrta',
    aliases: ['CC', 'CAITANYA', 'CARITAMRTA'],
    expectedVerses: 11555,
    refFormat: '@CC part.chapter.verse',
    refExample: '@CC 1.1.1',
    description: 'The biography of Śrī Caitanya Mahāprabhu, written by Śrīla Kṛṣṇadāsa Kavirāja Gosvāmī, detailing the golden avataras teachings and pastimes.',
  },
  {
    id: 'iso',
    name: 'Śrī Īśopaniṣad',
    tag: 'isopanishad',
    aliases: ['ISO', 'ISOPANISHAD'],
    expectedVerses: 18,
    refFormat: '@ISO mantra',
    refExample: '@ISO 1',
    description: 'One of the principal Upaniṣads, presenting the philosophy of the Supreme Personal Godhead in concise mantras.',
  },
  {
    id: 'noi',
    name: 'Nectar of Instruction',
    tag: 'nectar-of-instruction',
    aliases: ['NOI', 'NECTAR'],
    expectedVerses: 11,
    refFormat: '@NOI verse',
    refExample: '@NOI 1',
    description: 'Śrīla Rūpa Gosvāmīs Upadeśāmṛta, eleven essential instructions for advancing in Kṛṣṇa consciousness.',
  },
  {
    id: 'mr',
    name: 'Mundaka Upanishad',
    aliases: ['MU', 'MUNDAKA'],
    expectedVerses: 64,
    refFormat: '@MU chapter.verse',
    refExample: '@MU 1.1',
    description: 'A major Upaniṣad that distinguishes between higher and lower knowledge, describing the Supreme Brahman.',
    future: true,
  },
  {
    id: 'kv',
    name: 'Katha Upanishad',
    aliases: ['KU', 'KATHA'],
    expectedVerses: 119,
    refFormat: '@KU chapter.verse',
    refExample: '@KU 1.1',
    description: 'The story of Nachiketa and Yama, exploring the nature of the soul and the ultimate reality.',
    future: true,
  },
  {
    id: 'rv',
    name: 'Rig Veda',
    aliases: ['RV', 'RIGVEDA'],
    expectedVerses: 10600,
    refFormat: '@RV mandala.sukta.verse',
    refExample: '@RV 1.1.1',
    description: 'The oldest of the four Vedas, a vast collection of hymns and mantras revealed to ancient seers.',
    future: true,
  },
];

/**
 * Detect if the search input looks like a shloka reference (e.g. "BG 3.4", "@SB 1.2.3")
 * and normalize it to @ALIAS num.num format for the parse API.
 */
function normalizeShlokaRef(input) {
  const trimmed = input.trim();
  if (!trimmed) return null;
  // Already has @ prefix – use as-is
  if (/^@[A-Za-z]/.test(trimmed)) return trimmed;
  // Match: alias + single number (ISO 1, NOI 1)
  const single = trimmed.match(/^([A-Za-z]{1,20})[\s.]+(\d+)$/);
  if (single) {
    return '@' + single[1].toUpperCase() + ' ' + single[2];
  }
  // Match: alias + two or three numbers (BG 3.4, SB 1.2.3, bg 2.47, etc.)
  const multi = trimmed.match(/^([A-Za-z]{1,20})[\s.]+(\d+)[\s.]+(\d+)(?:[\s.]+(\d+))?$/);
  if (multi) {
    let ref = '@' + multi[1].toUpperCase() + ' ' + multi[2] + '.' + multi[3];
    if (multi[4]) ref += '.' + multi[4];
    return ref;
  }
  return null;
}

const ShlokaPreview = ({ shloka, onClose }) => {
  if (!shloka) return null;
  return (
    <div className="bg-white rounded-xl border-2 border-orange-300 shadow-lg mb-8 overflow-hidden transition-all duration-200">
      {/* Header bar */}
      <div className="bg-orange-600 text-white px-5 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FiBookOpen className="text-orange-200" />
          <span className="font-semibold">{shloka.label}</span>
        </div>
        <div className="flex items-center gap-3">
          {shloka.url && (
            <a
              href={shloka.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-orange-200 hover:text-white text-sm flex items-center gap-1 transition-colors"
            >
              Vedabase <FiExternalLink size={14} />
            </a>
          )}
          <button onClick={onClose} className="text-orange-200 hover:text-white transition-colors" title="Close">
            <FiX size={18} />
          </button>
        </div>
      </div>

      <div className="p-5 space-y-4">
        {/* Sanskrit */}
        {shloka.sanskrit && (
          <div>
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Sanskrit</h4>
            <p className="text-lg text-gray-800 font-serif leading-relaxed">{shloka.sanskrit}</p>
          </div>
        )}

        {/* IAST (transliteration) */}
        {shloka.iast && (
          <div>
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Transliteration</h4>
            <p className="text-base text-gray-700 italic">{shloka.iast}</p>
          </div>
        )}

        {/* Translation */}
        {shloka.translation && (
          <div>
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Translation</h4>
            <p className="text-base text-gray-700 leading-relaxed">{shloka.translation}</p>
          </div>
        )}

        {/* Purport */}
        {shloka.purport && (
          <div>
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Purport</h4>
            <p className="text-sm text-gray-600 leading-relaxed">{shloka.purport}</p>
          </div>
        )}
      </div>
    </div>
  );
};

const Scriptures = () => {
  const [search, setSearch] = useState('');
  const [stats, setStats] = useState({});
  const [totalVerses, setTotalVerses] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Shloka lookup state
  const [shlokaResult, setShlokaResult] = useState(null);
  const [shlokaLoading, setShlokaLoading] = useState(false);
  const [shlokaError, setShlokaError] = useState('');
  const debounceRef = useRef(null);

  // Fetch stats on mount
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/shlokas/stats');
        if (!res.ok) throw new Error('Failed');
        const data = await res.json();
        setStats(data.stats);
        setTotalVerses(data.totalVerses);
      } catch (err) {
        setError('Could not load verse statistics.');
      }
      setLoading(false);
    })();
  }, []);

  // Debounced shloka lookup when search changes
  useEffect(() => {
    // Clear previous result and debounce
    if (debounceRef.current) clearTimeout(debounceRef.current);
    setShlokaResult(null);
    setShlokaError('');

    const ref = normalizeShlokaRef(search);
    if (!ref) {
      setShlokaLoading(false);
      return;
    }

    setShlokaLoading(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/shlokas/parse?ref=${encodeURIComponent(ref)}`);
        if (!res.ok) throw new Error('API error');
        const data = await res.json();
        if (data.matches && data.matches.length > 0) {
          setShlokaResult(data.matches[0]);
        } else {
          setShlokaError('Verse not found in database');
        }
      } catch (err) {
        setShlokaError('Could not look up verse');
      }
      setShlokaLoading(false);
    }, 400);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [search]);

  const isShlokaSearch = normalizeShlokaRef(search) !== null;

  // Filter books — always filter by the search text, but when a shloka lookup
  // is happening, also highlight which book the verse belongs to
  const filtered = BOOKS_META.filter((book) => {
    if (!search.trim() || isShlokaSearch) return true; // show all during shloka search
    const q = search.toLowerCase();
    return (
      book.name.toLowerCase().includes(q) ||
      book.aliases.some((a) => a.toLowerCase().includes(q)) ||
      book.description.toLowerCase().includes(q)
    );
  });

  const loadedVerses = (id) => stats[id] || 0;
  const isLoaded = (id) => !!(stats[id] && stats[id] > 0) && !BOOKS_META.find((b) => b.id === id)?.future;

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="text-center mb-10">
        <h1 className="text-4xl font-bold text-gray-800 mb-3">📜 Scriptures</h1>
        <p className="text-gray-600 text-lg max-w-2xl mx-auto">
          Browse the Vedic scriptures and look up verses instantly. Type a verse reference like <code className="bg-orange-100 text-orange-700 px-2 py-0.5 rounded text-sm font-mono">BG 3.4</code> or <code className="bg-orange-100 text-orange-700 px-2 py-0.5 rounded text-sm font-mono">@SB 1.2.6</code> in the search to see the shloka and its meaning.
        </p>
      </div>

      {/* Stats bar */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-8 flex flex-wrap gap-6 justify-center">
        <div className="flex items-center gap-2 text-gray-700">
          <FiBookOpen className="text-orange-500" />
          <span className="font-semibold">{BOOKS_META.length}</span>
          <span className="text-gray-500">Scriptures</span>
        </div>
        <div className="flex items-center gap-2 text-gray-700">
          <FiCheckCircle className="text-green-500" />
          <span className="font-semibold">{Object.keys(stats).length}</span>
          <span className="text-gray-500">Loaded</span>
        </div>
        <div className="flex items-center gap-2 text-gray-700">
          <span className="text-lg font-bold text-orange-600">{totalVerses.toLocaleString()}</span>
          <span className="text-gray-500">Verses Available</span>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-lg" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder='Search by name/alias or look up a verse — e.g. "BG 3.4", "@SB 1.2.6", "Bhagavad Gita"...'
          className="w-full pl-12 pr-4 py-4 rounded-xl border border-gray-300 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent text-lg"
        />
        {search && (
          <button
            onClick={() => setSearch('')}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <FiX size={20} />
          </button>
        )}
      </div>

      {/* Shloka lookup result */}
      {isShlokaSearch && (
        <div className="mb-6">
          {shlokaLoading && (
            <div className="bg-orange-50 border border-orange-200 rounded-xl p-5 text-center text-gray-500">
              <div className="animate-pulse flex flex-col items-center gap-2">
                <div className="h-4 w-48 bg-orange-200 rounded"></div>
                <div className="h-3 w-64 bg-orange-100 rounded"></div>
              </div>
              <p className="text-sm mt-2">Looking up verse...</p>
            </div>
          )}
          {shlokaError && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-center text-yellow-700 text-sm">
              {shlokaError}. Try a different reference like <strong>BG 2.47</strong> or <strong>SB 1.2.6</strong>.
            </div>
          )}
          {shlokaResult && <ShlokaPreview shloka={shlokaResult} onClose={() => { setSearch(''); setShlokaResult(null); }} />}
        </div>
      )}

      {error && (
        <div className="text-center py-4 mb-6 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error} Showing all scriptures regardless.
        </div>
      )}

      {loading ? (
        <div className="text-center py-16 text-gray-500 text-lg">Loading scripture data...</div>
      ) : (
        /* Book Cards Grid */
        <div className="grid gap-6 md:grid-cols-2">
          {filtered.map((book) => {
            const loaded = isLoaded(book.id);
            const verses = loadedVerses(book.id);
            const pct = book.expectedVerses > 0 ? Math.round((verses / book.expectedVerses) * 100) : 0;
            const highlight = shlokaResult && shlokaResult.book === book.id;

            return (
              <div
                key={book.id}
                className={`rounded-xl border shadow-sm transition-all duration-200 ${
                  highlight
                    ? 'bg-white border-orange-400 ring-2 ring-orange-200'
                    : loaded
                      ? 'bg-white border-gray-200 hover:shadow-md hover:border-orange-300'
                      : 'bg-gray-50 border-dashed border-gray-300 opacity-75'
                }`}
              >
                <div className="p-6">
                  {/* Header row */}
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h2 className="text-xl font-bold text-gray-800">{book.name}</h2>
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {book.aliases.map((a) => (
                          <span
                            key={a}
                            className={`text-xs font-mono font-semibold px-2 py-0.5 rounded-full ${
                              loaded
                                ? 'bg-orange-100 text-orange-700'
                                : 'bg-gray-200 text-gray-500'
                            }`}
                          >
                            {a}
                          </span>
                        ))}
                      </div>
                    </div>
                    {/* Status badge */}
                    <span
                      className={`flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-full whitespace-nowrap ${
                        loaded
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-200 text-gray-500'
                      }`}
                    >
                      {loaded ? (
                        <><FiCheckCircle className="text-green-600" /> Loaded</>
                      ) : (
                        <><FiClock /> Coming Soon</>
                      )}
                    </span>
                  </div>

                  {/* Description */}
                  <p className="text-gray-600 text-sm mb-4 leading-relaxed">{book.description}</p>

                  {/* Ref format */}
                  <div className="bg-gray-50 rounded-lg p-3 mb-4">
                    <div className="text-xs text-gray-500 mb-1 font-medium">Usage</div>
                    <code className="text-sm text-orange-700 font-mono bg-orange-50 px-2 py-1 rounded">
                      {book.refFormat}
                    </code>
                    <span className="text-gray-400 text-sm mx-2">→</span>
                    <code className="text-sm text-gray-600 font-mono bg-gray-100 px-2 py-1 rounded">
                      {book.refExample}
                    </code>
                  </div>

                  {/* Verse count / progress */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1 text-sm text-gray-500">
                      {loaded ? (
                        <>
                          <FiCheckCircle className="text-green-500 text-xs" />
                          <span>
                            <strong className="text-gray-700">{verses.toLocaleString()}</strong> verses
                            {pct < 100 && ` (${pct}%)`}
                          </span>
                        </>
                      ) : (
                        <span className="text-gray-400">
                          ~{book.expectedVerses.toLocaleString()} verses planned
                        </span>
                      )}
                    </div>
                    {loaded && book.tag && (
                      <Link
                        to={`/questions?tag=${book.tag}`}
                        className="text-sm font-medium flex items-center gap-1 text-orange-600 hover:text-orange-700"
                      >
                        Browse questions <FiChevronRight />
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {filtered.length === 0 && !loading && !isShlokaSearch && (
        <div className="text-center py-16 text-gray-500">
          <p className="text-lg">No scriptures match "{search}"</p>
          <p className="text-sm mt-1">Try searching by name or alias (e.g. BG, GITA, BHAGAVATAM)</p>
        </div>
      )}

      {/* Footer hint */}
      <div className="mt-12 text-center text-gray-400 text-sm border-t border-gray-200 pt-8 pb-4">
        <p>💡 Type <code className="bg-orange-100 text-orange-600 px-1.5 py-0.5 rounded text-xs font-mono">@BG 2.47</code> or <code className="bg-orange-100 text-orange-600 px-1.5 py-0.5 rounded text-xs font-mono">@SB 1.2.3</code> in any question or answer to auto-attach the verse.</p>
      </div>
    </div>
  );
};

export default Scriptures;
