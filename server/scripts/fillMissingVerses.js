/**
 * Incremental SB Verse Filler
 *
 * Fills in missing Śrīmad-Bhāgavatam verses from vedabase.io
 * without re-scraping already-stored verses.
 *
 * Usage: node fillMissingVerses.js
 *        node fillMissingVerses.js --book=sb   (same as default)
 */

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const cheerio = require('cheerio');
const { MongoClient } = require('mongodb');
const pLimit = require('p-limit');

const BASE_URL = 'https://vedabase.io/en/library';

const CANTOS = {
  1: 19, 2: 10, 3: 33, 4: 31, 5: 26,
  6: 19, 7: 15, 8: 24, 9: 24, 10: 90,
  11: 31, 12: 13,
};

const CONCURRENCY = 3;
const DELAY_MS = 800;
const RETRY_ATTEMPTS = 3;
const RETRY_DELAY_MS = 2000;

let totalFetched = 0;
let totalSkipped = 0;
let totalFailed = 0;

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function fetchPage(url, attempt = 1) {
  await sleep(DELAY_MS);
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'VedicChatbot-Scraper/1.0 (Authorized by BBT/vedabase.io)',
        Accept: 'text/html,application/xhtml+xml',
        'Accept-Language': 'en-US,en;q=0.9',
      },
    });
    if (!res.ok) {
      if (res.status === 404) return null;
      throw new Error(`HTTP ${res.status} for ${url}`);
    }
    return await res.text();
  } catch (err) {
    if (attempt < RETRY_ATTEMPTS) {
      console.warn(`  ↻ Retry ${attempt}/${RETRY_ATTEMPTS} for ${url}`);
      await sleep(RETRY_DELAY_MS * attempt);
      return fetchPage(url, attempt + 1);
    }
    console.error(`  ✗ Failed after ${RETRY_ATTEMPTS} attempts: ${url}`);
    return null;
  }
}

/**
 * Get ALL verse numbers for a chapter from the chapter index page.
 */
async function getVerseList(canto, chapter) {
  const chapterUrl = `${BASE_URL}/sb/${canto}/${chapter}/`;
  const html = await fetchPage(chapterUrl);
  if (!html) return [];

  const $ = cheerio.load(html);
  const verses = [];

  $('a[href]').each((_, el) => {
    const href = $(el).attr('href');
    // Match verse-level URLs ending with /number/ or /number-number/
    const match = href.match(/\/(\d[\d-]*)\/$/);
    if (match && href.includes(`/sb/${canto}/${chapter}/`)) {
      const verseNum = match[1];
      if (verses.indexOf(verseNum) === -1) verses.push(verseNum);
    }
  });

  return verses;
}

/**
 * Parse a verse page from vedabase.io
 */
function parseVersePage(html, url) {
  const $ = cheerio.load(html);
  const doc = { url, scrapedAt: new Date() };

  doc.sanskrit = $('.r-verse-text, .verse-text, [class*="devanagari"], .r-devanagari')
    .first().text().trim() || null;

  doc.iast = $('.r-transliteration, .transliteration, [class*="iast"]')
    .first().text().trim() || null;

  const synonyms = [];
  $('.r-synonyms .r-synonym, .synonyms .synonym, [class*="synonym-item"]').each((_, el) => {
    const word = $(el).find('.r-word, .word, [class*="word"]').text().trim();
    const meaning = $(el).find('.r-meaning, .meaning, [class*="meaning"]').text().trim();
    if (word || meaning) synonyms.push({ word, meaning });
  });
  if (synonyms.length === 0) {
    const rawSynonyms = $('.r-synonyms, .synonyms, [class*="synonyms"]').first().text().trim();
    if (rawSynonyms) doc.synonymsRaw = rawSynonyms;
  } else {
    doc.synonyms = synonyms;
  }

  doc.translation = $('.r-translation, .translation, [class*="translation"]')
    .first().text().trim() || null;

  const purportParagraphs = [];
  $('.r-purport p, .purport p, [class*="purport"] p').each((_, el) => {
    const text = $(el).text().trim();
    if (text) purportParagraphs.push(text);
  });
  if (purportParagraphs.length > 0) {
    doc.purport = purportParagraphs.join('\n\n');
  } else {
    const rawPurport = $('.r-purport, .purport, [class*="purport"]').first().text().trim();
    if (rawPurport) doc.purport = rawPurport;
  }

  const audioEl = $('audio source, [class*="audio"] source, a[href*=".mp3"]');
  if (audioEl.length) {
    doc.audioUrl = audioEl.attr('src') || audioEl.attr('href') || null;
  }

  doc.pageTitle = $('title').text().trim() || $('h1').first().text().trim() || null;

  return doc;
}

async function main() {
  console.log('🕉  Incremental SB Verse Filler');
  console.log('━'.repeat(50));

  // Connect to MongoDB
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('ERROR: MONGODB_URI not found in .env');
    process.exit(1);
  }
  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db('vedabase');
  const collection = db.collection('verses');

  console.log('✓ MongoDB connected\n');

  let totalExisting = await collection.countDocuments({ book: 'sb' });
  console.log(`  Current SB verses in DB: ${totalExisting}\n`);

  const limit = pLimit(CONCURRENCY);

  for (const [canto, numChapters] of Object.entries(CANTOS)) {
    for (let chapter = 1; chapter <= numChapters; chapter++) {
      // Step 1: Get all actual verse numbers from vedabase.io for this chapter
      console.log(`📖 SB ${canto}.${chapter} — fetching verse list from vedabase...`);
      const allVerses = await getVerseList(canto, chapter);

      if (allVerses.length === 0) {
        console.log(`  ⚠ No verses found on chapter page, skipping`);
        continue;
      }

      // Step 2: Find which verses we already have
      const existingDocs = await collection.find(
        { book: 'sb', canto: Number(canto), chapter },
        { projection: { verse: 1 } }
      ).toArray();
      const existingVerseSet = new Set(existingDocs.map(d => String(d.verse)));

      const missingVerses = allVerses.filter(v => !existingVerseSet.has(v));

      if (missingVerses.length === 0) {
        console.log(`  ✓ All ${allVerses.length} verses present`);
        continue;
      }

      console.log(`  → ${missingVerses.length}/${allVerses.length} verses missing — scraping...`);

      // Step 3: Scrape only missing verses in parallel (with concurrency limit)
      const tasks = missingVerses.map((verse) =>
        limit(async () => {
          const url = `${BASE_URL}/sb/${canto}/${chapter}/${verse}/`;
          const html = await fetchPage(url);
          if (!html) {
            totalSkipped++;
            return null;
          }

          const parsed = parseVersePage(html, url);
          if (!parsed.translation && !parsed.sanskrit && !parsed.purport) {
            totalSkipped++;
            return null;
          }

          const doc = {
            book: 'sb',
            canto: Number(canto),
            chapter,
            verse,
            url,
            ...parsed,
          };

          try {
            await collection.updateOne({ url }, { $set: doc }, { upsert: true });
            totalFetched++;
            return verse;
          } catch (err) {
            console.error(`  ✗ DB error for SB ${canto}.${chapter}.${verse}: ${err.message}`);
            totalFailed++;
            return null;
          }
        })
      );

      const results = await Promise.all(tasks);
      const fetchedCount = results.filter(Boolean).length;
      console.log(`  ✓ SB ${canto}.${chapter}: ${fetchedCount} verses added`);
    }
  }

  const finalCount = await collection.countDocuments({ book: 'sb' });
  console.log('\n' + '━'.repeat(50));
  console.log('🕉  Fill Complete!');
  console.log(`  ✓ Newly fetched: ${totalFetched}`);
  console.log(`  ⊘ Skipped/empty: ${totalSkipped}`);
  console.log(`  ✗ Failed:        ${totalFailed}`);
  console.log(`  📦 SB verses now: ${finalCount}`);

  await client.close();
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
