const express = require('express');
const router = express.Router();
const { MongoClient } = require('mongodb');
const { BOOK_ALIASES } = require('../utils/shlokaRef');

let client;
let db;

async function getDB() {
  if (!db) {
    client = new MongoClient(process.env.MONGODB_URI);
    await client.connect();
    db = client.db('vedabase');
  }
  return db;
}

function normalizeBookKey(raw) {
  return (raw || '').toUpperCase().replace(/[^A-Z]/g, '');
}

function parsePartialRef(text) {
  if (!text) return null;
  const m = text.match(/^([A-Za-z]+)[\s]+([^\s]+)$/);
  if (!m) return null;
  const bookKey = normalizeBookKey(m[1]);
  const meta = BOOK_ALIASES[bookKey];
  if (!meta) return null;
  const rest = m[2].trim();
  const parts = rest.split('.').map(p => p.trim()).filter(Boolean);
  const out = { book: meta.book, raw: text, alias: m[1].toUpperCase() };
  if (meta.book === 'sb') {
    if (parts.length >= 1) out.canto = parseInt(parts[0], 10);
    if (parts.length >= 2) out.chapter = parseInt(parts[1], 10);
    if (parts.length >= 3) out.verse = parts[2];
  } else if (meta.book === 'cc') {
    if (parts.length >= 1) out.part = parts[0];
    if (parts.length >= 2) out.chapter = parseInt(parts[1], 10);
    if (parts.length >= 3) out.verse = parts[2];
  } else if (meta.book === 'iso') {
    if (parts.length >= 1) out.mantra = parseInt(parts[0], 10);
  } else if (meta.book === 'noi') {
    if (parts.length >= 1) out.verse = parseInt(parts[0], 10);
  } else {
    if (parts.length >= 1) out.chapter = parseInt(parts[0], 10);
    if (parts.length >= 2) out.verse = parts[1];
  }
  return out;
}

function shapeVerse(v, alias) {
  if (!v) return null;
  let label;
  if (v.book === 'bg') label = `Bhagavad Gita ${v.chapter}.${v.verse}`;
  else if (v.book === 'sb') label = `Srimad Bhagavatam ${v.canto}.${v.chapter}.${v.verse}`;
  else if (v.book === 'cc') label = `Caitanya-caritamrta ${v.part || ''} ${v.chapter}.${v.verse}`.trim();
  else if (v.book === 'iso') label = `Sri Isopanishad Mantra ${v.mantra || v.verse}`;
  else if (v.book === 'noi') label = `Nectar of Instruction ${v.verse}`;
  else label = v.pageTitle || v.url || 'Verse';
  return {
    book: v.book,
    canto: v.canto,
    chapter: v.chapter,
    verse: v.verse,
    part: v.part,
    mantra: v.mantra,
    sanskrit: v.sanskrit || '',
    translation: v.translation || '',
    url: v.url || '',
    label,
    alias: alias || ''
  };
}

// GET /api/shlokas/lookup?book=bg&chapter=2&verse=47
router.get('/lookup', async (req, res) => {
  try {
    const { book, canto, chapter, verse, part, mantra } = req.query;
    if (!book) return res.status(400).json({ message: 'book is required' });
    const vedabase = await getDB();
    const collection = vedabase.collection('verses');
    const query = { book };
    if (book === 'sb') {
      if (canto) query.canto = parseInt(canto, 10);
      if (chapter) query.chapter = parseInt(chapter, 10);
      if (verse != null && verse !== '') {
        const num = Number(verse);
        query.$or = isNaN(num) ? [{ verse: String(verse) }] : [{ verse: String(verse) }, { verse: num }];
      }
    } else if (book === 'cc') {
      if (part) query.part = part;
      if (chapter) query.chapter = parseInt(chapter, 10);
      if (verse != null && verse !== '') {
        const num = Number(verse);
        query.$or = isNaN(num) ? [{ verse: String(verse) }] : [{ verse: String(verse) }, { verse: num }];
      }
    } else if (book === 'iso') {
      if (mantra) {
        const n = parseInt(mantra, 10);
        query.$or = [{ verse: String(mantra) }, { mantra: n }];
      }
    } else {
      if (chapter) query.chapter = parseInt(chapter, 10);
      if (verse != null && verse !== '') {
        const num = Number(verse);
        query.$or = isNaN(num) ? [{ verse: String(verse) }] : [{ verse: String(verse) }, { verse: num }];
      }
    }
    const v = await collection.findOne(query);
    if (!v) return res.status(404).json({ message: 'Verse not found' });
    res.json(shapeVerse(v));
  } catch (err) {
    console.error('Shloka lookup error:', err.message);
    res.status(500).json({ message: 'Lookup failed' });
  }
});

// GET /api/shlokas/chapter?book=bg&chapter=2  -> list of verses in that chapter
router.get('/chapter', async (req, res) => {
  try {
    const { book, canto, chapter, part } = req.query;
    if (!book || !chapter) return res.status(400).json({ message: 'book and chapter are required' });
    const vedabase = await getDB();
    const collection = vedabase.collection('verses');
    const query = { book, chapter: parseInt(chapter, 10) };
    if (book === 'sb' && canto) query.canto = parseInt(canto, 10);
    if (book === 'cc' && part) query.part = part;
    const verses = await collection
      .find(query, { projection: { book: 1, canto: 1, chapter: 1, verse: 1, part: 1, mantra: 1, translation: 1, sanskrit: 1, url: 1 } })
      .sort({ verse: 1 })
      .limit(50)
      .toArray();
    res.json(verses.map(v => shapeVerse(v)));
  } catch (err) {
    console.error('Shloka chapter list error:', err.message);
    res.status(500).json({ message: 'List failed' });
  }
});

// GET /api/shlokas/parse?ref=@BG%203.4  -> tries to resolve a partial @-reference
router.get('/parse', async (req, res) => {
  try {
    const raw = (req.query.ref || '').toString();
    const ref = parsePartialRef(raw.replace(/^@/, '').trim());
    if (!ref) return res.json({ matches: [], partial: true });
    const vedabase = await getDB();
    const collection = vedabase.collection('verses');
    const query = { book: ref.book };
    if (ref.book === 'sb') {
      if (ref.canto != null) query.canto = ref.canto;
      if (ref.chapter != null) query.chapter = ref.chapter;
    } else if (ref.book === 'cc') {
      if (ref.part) query.part = ref.part;
      if (ref.chapter != null) query.chapter = ref.chapter;
    } else if (ref.book === 'iso') {
      if (ref.mantra != null) query.$or = [{ verse: String(ref.mantra) }, { mantra: ref.mantra }];
    } else {
      if (ref.chapter != null) query.chapter = ref.chapter;
    }
    if (ref.book !== 'iso' && ref.verse != null) {
      const num = Number(ref.verse);
      query.$or = isNaN(num) ? [{ verse: String(ref.verse) }] : [{ verse: String(ref.verse) }, { verse: num }];
    }
    const isPartial = ref.verse == null && ref.mantra == null;
    if (isPartial) {
      const list = await collection
        .find(query, { projection: { book: 1, canto: 1, chapter: 1, verse: 1, part: 1, mantra: 1, translation: 1, sanskrit: 1, url: 1 } })
        .sort({ verse: 1 })
        .limit(50)
        .toArray();
      return res.json({ matches: list.map(v => shapeVerse(v, ref.alias)), partial: true });
    }
    const v = await collection.findOne(query);
    if (!v) return res.json({ matches: [], partial: false });
    res.json({ matches: [shapeVerse(v, ref.alias)], partial: false });
  } catch (err) {
    console.error('Shloka parse error:', err.message);
    res.status(500).json({ message: 'Parse failed' });
  }
});

// GET /api/shlokas/books -> list of supported book aliases
router.get('/books', (req, res) => {
  res.json(Object.entries(BOOK_ALIASES).map(([alias, meta]) => ({
    alias, book: meta.book, name: meta.name
  })));
});

// GET /api/shlokas/stats -> verse counts per book + total
router.get('/stats', async (req, res) => {
  try {
    const vedabase = await getDB();
    const collection = vedabase.collection('verses');
    const counts = await collection.aggregate([
      { $group: { _id: '$book', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]).toArray();
    const stats = {};
    let totalVerses = 0;
    for (const c of counts) {
      stats[c._id] = c.count;
      totalVerses += c.count;
    }
    res.json({ stats, totalVerses });
  } catch (err) {
    console.error('Shloka stats error:', err.message);
    res.status(500).json({ message: 'Stats failed' });
  }
});

module.exports = router;
