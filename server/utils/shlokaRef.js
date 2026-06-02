const { MongoClient } = require('mongodb');

let vedabaseClient;
let vedabaseDb;

async function getVedabaseDB() {
  if (!vedabaseDb) {
    vedabaseClient = new MongoClient(process.env.MONGODB_URI);
    await vedabaseClient.connect();
    vedabaseDb = vedabaseClient.db('vedabase');
  }
  return vedabaseDb;
}

const BOOK_ALIASES = {
  BG: { book: 'bg', parts: 2, name: 'Bhagavad Gita' },
  BHAGAVADGITA: { book: 'bg', parts: 2, name: 'Bhagavad Gita' },
  GITA: { book: 'bg', parts: 2, name: 'Bhagavad Gita' },
  SB: { book: 'sb', parts: 3, name: 'Srimad Bhagavatam' },
  BHAGAVATAM: { book: 'sb', parts: 3, name: 'Srimad Bhagavatam' },
  BHAGAVATAPURANA: { book: 'sb', parts: 3, name: 'Srimad Bhagavatam' },
  CC: { book: 'cc', parts: 2, name: 'Caitanya-caritamrta' },
  CAITANYA: { book: 'cc', parts: 2, name: 'Caitanya-caritamrta' },
  CARITAMRTA: { book: 'cc', parts: 2, name: 'Caitanya-caritamrta' },
  ISO: { book: 'iso', parts: 1, name: 'Sri Isopanishad' },
  ISOPANISHAD: { book: 'iso', parts: 1, name: 'Sri Isopanishad' },
  NOI: { book: 'noi', parts: 1, name: 'Nectar of Instruction' },
  NECTAR: { book: 'noi', parts: 1, name: 'Nectar of Instruction' }
};

function parseShlokaReference(raw) {
  if (!raw || typeof raw !== 'string') return null;
  const cleaned = raw.trim().replace(/^@/, '').trim();
  if (!cleaned) return null;

  const match = cleaned.match(/^([A-Za-z]+)[\s\.]+(\d+)[\.\s]+(\d+)$/);
  if (!match) {
    const loose = cleaned.match(/^([A-Za-z]+)[\s\.]+(\d+)[\.\s]+(\d+)[\.\s]+(\d+)$/);
    if (loose) {
      const [, alias, a, b, c] = loose;
      const key = alias.toUpperCase();
      const meta = BOOK_ALIASES[key];
      if (!meta) return null;
      if (meta.book === 'sb' || meta.book === 'cc') {
        return { raw, alias, book: meta.book, canto: parseInt(a, 10), chapter: parseInt(b, 10), verse: parseInt(c, 10) };
      }
      return { raw, alias, book: meta.book, chapter: parseInt(a, 10), verse: parseInt(b, 10) };
    }
    return null;
  }

  const [, alias, a, b] = match;
  const key = alias.toUpperCase();
  const meta = BOOK_ALIASES[key];
  if (!meta) return null;

  if (meta.book === 'sb') {
    return { raw, alias, book: meta.book, canto: parseInt(a, 10), chapter: parseInt(b, 10) };
  }
  return { raw, alias, book: meta.book, chapter: parseInt(a, 10), verse: parseInt(b, 10) };
}

function extractShlokaReferences(text) {
  if (!text || typeof text !== 'string') return [];
  const refs = [];
  const re = /@([A-Za-z]{1,20})[\s.]+(\d+)[\s.]+(\d+)(?:[\s.]+(\d+))?/g;
  let m;
  while ((m = re.exec(text)) !== null) {
    const raw = m[0];
    const ref = parseShlokaReference(raw);
    if (ref) refs.push(ref);
  }
  return refs;
}

function verseLabel(v) {
  if (v.book === 'bg') return `Bhagavad Gita ${v.chapter}.${v.verse}`;
  if (v.book === 'sb') return `Srimad Bhagavatam ${v.canto}.${v.chapter}.${v.verse}`;
  if (v.book === 'cc') return `Caitanya-caritamrta ${v.part} ${v.chapter}.${v.verse}`;
  if (v.book === 'iso') return `Sri Isopanishad Mantra ${v.mantra || v.verse}`;
  if (v.book === 'noi') return `Nectar of Instruction ${v.verse}`;
  return v.pageTitle || v.url || 'Verse';
}

async function lookupShloka(ref) {
  if (!ref || !ref.book) return null;
  try {
    const db = await getVedabaseDB();
    const collection = db.collection('verses');
    let query = { book: ref.book };
    const verseStr = ref.verse != null ? String(ref.verse) : null;
    const verseNum = ref.verse != null ? Number(ref.verse) : null;
    if (ref.book === 'sb') {
      query.canto = ref.canto;
      query.chapter = ref.chapter;
      if (verseStr != null && !Number.isNaN(verseNum)) {
        query.$or = [{ verse: verseStr }, { verse: verseNum }];
      }
    } else if (ref.book === 'cc') {
      query.chapter = ref.chapter;
      if (verseStr != null && !Number.isNaN(verseNum)) {
        query.$or = [{ verse: verseStr }, { verse: verseNum }];
      }
    } else if (ref.book === 'iso') {
      query.$or = [
        { verse: ref.chapter },
        { mantra: ref.chapter },
        { mantra: Number(ref.chapter) }
      ];
    } else {
      query.chapter = ref.chapter;
      if (verseStr != null && !Number.isNaN(verseNum)) {
        query.$or = [{ verse: verseStr }, { verse: verseNum }];
      }
    }
    const verse = await collection.findOne(query);
    if (!verse) return null;
    return {
      raw: ref.raw,
      book: verse.book,
      chapter: verse.chapter,
      verse: verse.verse,
      canto: verse.canto,
      part: verse.part,
      mantra: verse.mantra,
      sanskrit: verse.sanskrit || '',
      iast: verse.iast || '',
      translation: verse.translation || '',
      purport: verse.purport || '',
      url: verse.url || '',
      label: verseLabel(verse)
    };
  } catch (err) {
    console.error('Shloka lookup error:', err.message);
    return null;
  }
}

async function resolveShlokaReferences(text) {
  const refs = extractShlokaReferences(text);
  if (refs.length === 0) return [];
  const seen = new Set();
  const unique = [];
  for (const r of refs) {
    const k = `${r.book}-${r.canto || ''}-${r.chapter || ''}-${r.verse || ''}-${r.mantra || ''}`;
    if (seen.has(k)) continue;
    seen.add(k);
    unique.push(r);
  }
  const results = [];
  for (const r of unique) {
    const v = await lookupShloka(r);
    if (v) results.push(v);
  }
  return results;
}

function buildShlokaRegex() {
  const aliases = Object.keys(BOOK_ALIASES).join('|');
  return new RegExp(`@(${aliases})[\\s.]+(\\d+)[\\s.]+(\\d+)(?:[\\s.]+(\\d+))?`, 'gi');
}

module.exports = {
  BOOK_ALIASES,
  parseShlokaReference,
  extractShlokaReferences,
  lookupShloka,
  resolveShlokaReferences,
  verseLabel,
  buildShlokaRegex
};
