const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Guru = require('../models/Guru');

const gurus = [
  {
    name: 'Swami Sarvapriyananda',
    email: 'sarvapriyananda@pariprashna.local',
    honorific: 'Swami',
    shortBio: 'Vedanta monk in the Ramakrishna Order, author and speaker on Advaita Vedanta.',
    bio: 'Swami Sarvapriyananda is a senior monk of the Ramakrishna Order and minister-in-charge of the Vedanta Society of New York. He is widely respected for his teaching of Upanishads, Bhagavad Gita, and Brahma Sutras in the tradition of Swami Vivekananda and Sri Ramakrishna.',
    lineage: 'Ramakrishna -> Vivekananda -> Ramakrishna Order',
    sampradaya: 'Advaita Vedanta',
    expertise: ['Advaita Vedanta', 'Upanishads', 'Bhagavad Gita', 'Brahma Sutras'],
    scriptures: ['Bhagavad Gita', 'Upanishads', 'Brahma Sutras', 'Yoga Sutras'],
    languages: ['English', 'Hindi', 'Sanskrit', 'Bengali'],
    yearsOfStudy: 30,
    currentPosition: 'Minister-in-charge, Vedanta Society of New York',
    institution: 'Vedanta Society of New York',
    location: 'New York, USA',
    website: 'https://vedantany.org',
    social: { youtube: 'https://www.youtube.com/@SwamiSarvapriyananda', wikipedia: 'https://en.wikipedia.org/wiki/Sarvapriyananda' },
    tier: 'acharya'
  },
  {
    name: 'Swami Paramarthananda',
    email: 'paramarthananda@pariprashna.local',
    honorific: 'Swami',
    shortBio: 'Renowned teacher of traditional Advaita Vedanta through Sanskrit texts.',
    bio: 'Sri Swami Paramarthananda is a disciple of Swami Dayananda Saraswati and one of the most respected teachers of traditional Advaita Vedanta. He has taught Bhagavad Gita, Upanishads, Brahma Sutras, and many other Sanskrit texts to thousands of students through his Arsha Vidya Gurukulam.',
    lineage: 'Shankaracharya -> Dayananda Saraswati -> Paramarthananda',
    sampradaya: 'Advaita Vedanta (Arsha Vidya)',
    expertise: ['Advaita Vedanta', 'Sanskrit', 'Brahma Sutras', 'Upanishads', 'Mimamsa'],
    scriptures: ['Brahma Sutras', 'Upanishads', 'Bhagavad Gita', 'Prashna Upanishad'],
    languages: ['English', 'Tamil', 'Sanskrit', 'Hindi'],
    yearsOfStudy: 50,
    currentPosition: 'Acharya, Arsha Vidya Gurukulam',
    institution: 'Arsha Vidya Gurukulam',
    location: 'Anaipatti, Tamil Nadu, India',
    website: 'https://arshavidyagurukulam.org',
    tier: 'acharya'
  },
  {
    name: 'David Frawley (Vamadeva Shastri)',
    email: 'vamadeva@pariprashna.local',
    honorific: 'Pandit',
    shortBio: 'Vedic scholar and author, one of the few Westerners recognised as a Vedacharya.',
    bio: 'David Frawley (Pandit Vamadeva Shastri) is an American-born Vedic scholar and author of more than thirty books on Yoga, Ayurveda, Vedic astrology, and Vedanta. He is the director of the American Institute of Vedic Studies and has been honoured as a Vedacharya by the Government of India.',
    lineage: 'Dattatreya tradition / Shakta Advaita',
    sampradaya: 'Shakta Advaita',
    expertise: ['Vedic Studies', 'Ayurveda', 'Jyotish', 'Yoga', 'Upanishads'],
    scriptures: ['Rig Veda', 'Upanishads', 'Bhagavad Gita', 'Devi Bhagavatam', 'Atharva Veda'],
    languages: ['English', 'Sanskrit', 'Hindi'],
    yearsOfStudy: 45,
    currentPosition: 'Director, American Institute of Vedic Studies',
    institution: 'American Institute of Vedic Studies',
    location: 'Santa Fe, New Mexico, USA',
    website: 'https://www.vedanet.com',
    social: { wikipedia: 'https://en.wikipedia.org/wiki/David_Frawley' },
    tier: 'acharya'
  },
  {
    name: 'Swami Sivananda',
    email: 'sivananda@pariprashna.local',
    honorific: 'Swami',
    shortBio: 'Disciple of Swami Sivananda, founder of the Divine Life Society (represented in lineage).',
    bio: 'This profile represents the teachings of the Divine Life Society lineage as preserved by senior disciples. The Divine Life Society, founded by Swami Sivananda, continues to teach an integral yoga combining Karma, Bhakti, Jnana, Raja, and Hatha Yoga.',
    lineage: 'Sivananda -> Divine Life Society',
    sampradaya: 'Integral Yoga',
    expertise: ['Karma Yoga', 'Bhakti Yoga', 'Raja Yoga', 'Hatha Yoga', 'Vedanta'],
    scriptures: ['Bhagavad Gita', 'Upanishads', 'Yoga Sutras', 'Siva Sutras'],
    languages: ['English', 'Hindi', 'Sanskrit'],
    yearsOfStudy: 40,
    currentPosition: 'Senior Acharya, Divine Life Society',
    institution: 'Divine Life Society',
    location: 'Rishikesh, India',
    website: 'https://www.sivananda.org',
    tier: 'acharya'
  },
  {
    name: 'A.C. Bhaktivedanta Swami Prabhupada',
    email: 'prabhupada@pariprashna.local',
    honorific: 'Srila Prabhupada',
    shortBio: 'Founder-Acharya of ISKCON and the most influential Gaudiya Vaishnava teacher in the modern West.',
    bio: 'His Divine Grace A.C. Bhaktivedanta Swami Prabhupada (1896-1977) is the founder-Acharya of the International Society for Krishna Consciousness. A sannyasi in the Brahma-Madhva-Gaudiya sampradaya, he translated over 80 volumes of Vaishnava scriptures into English and brought the teachings of Krishna consciousness to the world.',
    lineage: 'Brahma -> Narada -> Madhva -> Chaitanya -> Bhaktisiddhanta -> Prabhupada',
    sampradaya: 'Gaudiya Vaishnava',
    expertise: ['Bhakti', 'Vedic Commentaries', 'Srimad Bhagavatam', 'Bhagavad Gita As It Is'],
    scriptures: ['Srimad Bhagavatam', 'Bhagavad Gita', 'Caitanya Caritamrita', 'Nectar of Devotion'],
    languages: ['English', 'Sanskrit', 'Bengali', 'Hindi'],
    yearsOfStudy: 60,
    currentPosition: 'Founder-Acharya (posthumous), ISKCON',
    institution: 'ISKCON',
    location: 'Mayapur / Worldwide',
    website: 'https://iskcon.org',
    social: { wikipedia: 'https://en.wikipedia.org/wiki/A._C._Bhaktivedanta_Swami_Prabhupada' },
    tier: 'acharya'
  },
  {
    name: 'Srila Bhakti Raksaka Sridhara Deva Goswami',
    email: 'sridhara@pariprashna.local',
    honorific: 'Srila',
    shortBio: 'Spiritual master in the Gaudiya Math line and founder of Sripad Ashram.',
    bio: 'Srila Bhakti Raksaka Sridhara Deva Goswami (1895-1988) was a sannyasi and spiritual master in the Gaudiya Vaishnava tradition. A direct disciple of Bhaktisiddhanta Sarasvati Thakura, he is celebrated for his profound exposition of the rasa philosophy of Sri Caitanya Mahaprabhu.',
    lineage: 'Caitanya -> Bhaktisiddhanta -> Sridhara',
    sampradaya: 'Gaudiya Vaishnava',
    expertise: ['Bhakti Rasa', 'Caitanya Philosophy', 'Srimad Bhagavatam'],
    scriptures: ['Srimad Bhagavatam', 'Caitanya Caritamrita', 'Bhagavad Gita'],
    languages: ['English', 'Bengali', 'Sanskrit'],
    yearsOfStudy: 70,
    currentPosition: 'Founder (posthumous), Sripad Ashram',
    institution: 'Sripad Ashram',
    location: 'Navadvipa, West Bengal, India',
    website: 'https://www.gaurangabd.org',
    tier: 'acharya'
  },
  {
    name: 'Srila Prabhupada disciples collective (BVV Narasimha Swami)',
    email: 'narasimha@pariprashna.local',
    honorific: 'HH Bhaktividyapurana',
    shortBio: 'ISKCON sannyasi, teacher, and member of the GBC.',
    bio: 'HH Bhaktividyapurana Puri Swami (Narasimha Swami) is a senior Vaishnava scholar in the Gaudiya tradition and a sannyasi disciple within the ISKCON line. He teaches Srimad Bhagavatam, Caitanya Caritamrita, and the Goswami literatures.',
    lineage: 'Brahma-Madhva-Gaudiya -> ISKCON',
    sampradaya: 'Gaudiya Vaishnava',
    expertise: ['Srimad Bhagavatam', 'Caitanya Caritamrita', 'Goswami Literature'],
    scriptures: ['Srimad Bhagavatam', 'Caitanya Caritamrita', 'Brahma Vaivarta Purana'],
    languages: ['English', 'Sanskrit', 'Bengali', 'Hindi'],
    yearsOfStudy: 40,
    currentPosition: 'GBC Member, ISKCON',
    institution: 'ISKCON',
    location: 'India',
    tier: 'guru'
  },
  {
    name: 'Swami Dayananda Saraswati',
    email: 'dayananda@pariprashna.local',
    honorific: 'Swami',
    shortBio: 'Founder of Arsha Vidya Gurukulam and one of the most influential traditional Vedanta teachers of the 20th century.',
    bio: 'Swami Dayananda Saraswati (1930-2015) was a renowned traditional teacher of Advaita Vedanta, Sanskrit, and the Vedic tradition. He founded the Arsha Vidya Gurukulam and taught Bhagavad Gita, Upanishads, and Brahma Sutras to thousands of students worldwide.',
    lineage: 'Shankaracharya -> Dayananda Saraswati',
    sampradaya: 'Advaita Vedanta (Arsha Vidya)',
    expertise: ['Advaita Vedanta', 'Sanskrit', 'Mimamsa', 'Vedic Rituals'],
    scriptures: ['Brahma Sutras', 'Upanishads', 'Bhagavad Gita', 'Mimamsa Sutras'],
    languages: ['English', 'Tamil', 'Sanskrit', 'Hindi'],
    yearsOfStudy: 60,
    currentPosition: 'Founder (posthumous), Arsha Vidya',
    institution: 'Arsha Vidya Gurukulam',
    location: 'Saylorsburg, PA / Anaipatti, India',
    website: 'https://arshavidya.org',
    tier: 'acharya'
  },
  {
    name: 'Swami Ranganathananda',
    email: 'ranganathananda@pariprashna.local',
    honorific: 'Swami',
    shortBio: '17th President of the Ramakrishna Math and Mission.',
    bio: 'Swami Ranganathananda (1908-2005) was the 17th President of the Ramakrishna Math and Mission. A direct disciple of Swami Shankarananda, he taught Vedanta and the universal teachings of Sri Ramakrishna and Swami Vivekananda across the world.',
    lineage: 'Ramakrishna -> Vivekananda -> Ranganathananda',
    sampradaya: 'Advaita Vedanta',
    expertise: ['Universal Vedanta', 'Bhagavad Gita', 'Practical Spirituality'],
    scriptures: ['Bhagavad Gita', 'Upanishads', 'Brahma Sutras', 'Ramakrishna Kathamrita'],
    languages: ['English', 'Hindi', 'Sanskrit', 'Bengali'],
    yearsOfStudy: 60,
    currentPosition: '17th President (posthumous), Ramakrishna Math',
    institution: 'Ramakrishna Math and Mission',
    location: 'Belur Math, India',
    tier: 'acharya'
  },
  {
    name: 'Sri Sri Ravi Shankar',
    email: 'ravishankar@pariprashna.local',
    honorific: 'Sri Sri',
    shortBio: 'Spiritual leader and founder of the Art of Living foundation.',
    bio: 'Sri Sri Ravi Shankar is a globally recognised spiritual leader and founder of the Art of Living foundation. He has taught meditation, breathwork (Sudarshan Kriya), and the timeless wisdom of the Vedic tradition to millions of people across 150+ countries.',
    lineage: 'Vedic Shankaracharya tradition',
    sampradaya: 'Vedanta / Suddha Dharma',
    expertise: ['Meditation', 'Yoga', 'Vedanta', 'Breathwork', 'Conflict Resolution'],
    scriptures: ['Bhagavad Gita', 'Upanishads', 'Yoga Sutras', 'Vedas'],
    languages: ['English', 'Hindi', 'Sanskrit'],
    yearsOfStudy: 45,
    currentPosition: 'Founder, Art of Living',
    institution: 'Art of Living',
    location: 'Bangalore, India',
    website: 'https://www.artofliving.org',
    social: { twitter: '@SriSri', wikipedia: 'https://en.wikipedia.org/wiki/Ravi_Shankar_(spiritual_leader)' },
    tier: 'acharya'
  },
  {
    name: 'Sadhguru Jaggi Vasudev',
    email: 'sadhguru@pariprashna.local',
    honorific: 'Sadhguru',
    shortBio: 'Yogi, mystic, and founder of the Isha Foundation.',
    bio: 'Sadhguru Jaggi Vasudev is an Indian yogi and author. He is the founder of the Isha Foundation, which offers yoga programs around the world. He is the author of several New York Times bestsellers and a frequent speaker on spirituality, ecology, and inner engineering.',
    lineage: 'Mystic / Lineless',
    sampradaya: 'Shaiva / Non-sectarian',
    expertise: ['Yoga', 'Meditation', 'Shaivism', 'Inner Engineering'],
    scriptures: ['Yoga Sutras', 'Bhagavad Gita', 'Upanishads', 'Shiva Sutras'],
    languages: ['English', 'Hindi', 'Tamil', 'Kannada'],
    yearsOfStudy: 40,
    currentPosition: 'Founder, Isha Foundation',
    institution: 'Isha Foundation',
    location: 'Coimbatore, India',
    website: 'https://www.ishafoundation.org',
    social: { twitter: '@SadhguruJV', wikipedia: 'https://en.wikipedia.org/wiki/Jaggi_Vasudev' },
    tier: 'acharya'
  },
  {
    name: 'Swami Mukundananda',
    email: 'mukundananda@pariprashna.local',
    honorific: 'Swami',
    shortBio: 'Vedanta teacher combining Vedic wisdom with modern management and science.',
    bio: 'Swami Mukundananda is a senior disciple of Jagadguru Shri Kripaluji Maharaj and a graduate of IIT Delhi and IIM Bangalore. He teaches the philosophy of the Brahma-Madhva-Gaudiya sampradaya and explains it through the lens of modern science and management.',
    lineage: 'Kripaluji Maharaj -> Mukundananda',
    sampradaya: 'Radha Vallabhi / Gaudiya-influenced',
    expertise: ['Bhakti', 'Vedanta', 'Applied Spirituality', 'Vedic Wisdom'],
    scriptures: ['Bhagavad Gita', 'Srimad Bhagavatam', 'Ramayana', 'Vedas'],
    languages: ['English', 'Hindi', 'Sanskrit'],
    yearsOfStudy: 35,
    currentPosition: 'Spiritual teacher, Jagadguru Kripalu Yog',
    institution: 'JKYog',
    location: 'USA / India',
    website: 'https://www.jkyog.org',
    social: { youtube: 'https://www.youtube.com/@SwamiMukundananda' },
    tier: 'guru'
  },
  {
    name: 'HH Bhanu Swami Maharaj',
    email: 'bhanuswami@pariprashna.local',
    honorific: 'HH',
    shortBio: 'ISKCON sannyasi and scholar of Sanskrit Vaishnava philosophy.',
    bio: 'HH Bhanu Swami is a sannyasi in the International Society for Krishna Consciousness (ISKCON). He is a respected scholar of Sanskrit Vaishnava philosophy and has translated and commented on the works of the Goswamis, the Bhagavad Gita, and the Srimad Bhagavatam.',
    lineage: 'ISKCON / Gaudiya Vaishnava',
    sampradaya: 'Gaudiya Vaishnava',
    expertise: ['Sanskrit', 'Gaudiya Philosophy', 'Brahma Sutras', 'Vedic Logic'],
    scriptures: ['Srimad Bhagavatam', 'Brahma Sutras', 'Caitanya Caritamrita', 'Sandarbhas'],
    languages: ['English', 'Sanskrit', 'Hindi', 'Bengali'],
    yearsOfStudy: 50,
    currentPosition: 'GBC Member, ISKCON',
    institution: 'ISKCON',
    location: 'India',
    tier: 'guru'
  },
  {
    name: 'Pandit Ram Narayan',
    email: 'ramnarayan@pariprashna.local',
    honorific: 'Pandit',
    shortBio: 'Traditional Sanskrit scholar and Mimamsaka.',
    bio: 'Pandit Ram Narayan is a traditional Sanskrit scholar trained in the Mimamsa and Vedanta traditions. He teaches at the Arsha Vidya Gurukulam and is known for his deep knowledge of ritual texts, the Vedas, and the philosophical systems.',
    lineage: 'Arsha Vidya lineage',
    sampradaya: 'Mimamsa / Advaita Vedanta',
    expertise: ['Mimamsa', 'Vedic Ritual', 'Sanskrit Grammar'],
    scriptures: ['Mimamsa Sutras', 'Vedas', 'Brahma Sutras'],
    languages: ['Sanskrit', 'Tamil', 'Hindi', 'English'],
    yearsOfStudy: 30,
    currentPosition: 'Sanskrit teacher, Arsha Vidya',
    institution: 'Arsha Vidya Gurukulam',
    location: 'India',
    tier: 'guru'
  },
  {
    name: 'Shankaracharya Srivishwesha Tirtha',
    email: 'srivishwesha@pariprashna.local',
    honorific: 'Shankaracharya',
    shortBio: 'Shankaracharya of the Sringeri Sharada Peetham.',
    bio: 'Shankaracharya Srivishwesha Tirtha is the head of the Sringeri Sharada Peetham, established by Adi Shankaracharya in the 8th century. The Sringeri math is the principal seat of the Smarta Advaita tradition in South India.',
    lineage: 'Adi Shankaracharya -> Sringeri lineage',
    sampradaya: 'Smarta Advaita',
    expertise: ['Advaita Vedanta', 'Smarta Tradition', 'Vedic Ritual'],
    scriptures: ['Brahma Sutras', 'Upanishads', 'Bhagavad Gita', 'Smriti'],
    languages: ['Sanskrit', 'Kannada', 'Telugu', 'Hindi', 'English'],
    yearsOfStudy: 50,
    currentPosition: 'Shankaracharya, Sringeri Sharada Peetham',
    institution: 'Sringeri Sharada Peetham',
    location: 'Sringeri, Karnataka, India',
    website: 'https://www.sringeri.net',
    tier: 'acharya'
  },
  {
    name: 'Swami Satyananda Saraswati',
    email: 'satyananda@pariprashna.local',
    honorific: 'Swami',
    shortBio: 'Founder of the Bihar School of Yoga and author of the Bihar Yoga tradition.',
    bio: 'Swami Satyananda Saraswati (1923-2009) was the founder of the Bihar School of Yoga and a disciple of Swami Sivananda of Rishikesh. He systematised the yoga practices now known as Satyananda Yoga and authored more than 80 books on asana, pranayama, kriya, and Vedanta.',
    lineage: 'Sivananda -> Satyananda',
    sampradaya: 'Integral Yoga / Satyananda lineage',
    expertise: ['Asana', 'Pranayama', 'Kriya Yoga', 'Vedanta'],
    scriptures: ['Yoga Sutras', 'Hatha Yoga Pradipika', 'Gheranda Samhita', 'Shiva Samhita'],
    languages: ['English', 'Hindi', 'Sanskrit'],
    yearsOfStudy: 50,
    currentPosition: 'Founder (posthumous), Bihar School of Yoga',
    institution: 'Bihar School of Yoga',
    location: 'Munger, Bihar, India',
    website: 'https://www.biharyoga.net',
    social: { wikipedia: 'https://en.wikipedia.org/wiki/Satyananda_Saraswati' },
    tier: 'acharya'
  },
  {
    name: 'Baba Ram Dass (Ram Dass)',
    email: 'ramdass@pariprashna.local',
    honorific: 'Ram Dass',
    shortBio: 'American spiritual teacher who popularised the Ram Dass teachings in the West.',
    bio: 'Baba Ram Dass (Richard Alpert, 1931-2019) was an American spiritual teacher, psychologist, and author. A Harvard psychologist, he travelled to India and met Neem Karoli Baba, whose teachings of love and service he brought to the West through the book Be Here Now.',
    lineage: 'Neem Karoli Baba -> Ram Dass',
    sampradaya: 'Bhakti / Neem Karoli lineage',
    expertise: ['Bhakti', 'Meditation', 'Service', 'Compassion'],
    scriptures: ['Bhagavad Gita', 'Upanishads', 'Ramayana', 'Bhagavata Purana'],
    languages: ['English', 'Hindi'],
    yearsOfStudy: 50,
    currentPosition: 'Founder (posthumous), Love Serve Remember Foundation',
    institution: 'Love Serve Remember Foundation',
    location: 'Maui, Hawaii, USA',
    website: 'https://www.ramdass.org',
    social: { wikipedia: 'https://en.wikipedia.org/wiki/Ram_Dass' },
    tier: 'guru'
  },
  {
    name: 'Dr. B.N. Pandeya',
    email: 'pandeya@pariprashna.local',
    honorific: 'Prof.',
    shortBio: 'Sanskrit and Vedic scholar, professor of Sanskrit at BHU.',
    bio: 'Dr. B.N. Pandeya is a retired professor of Sanskrit from Banaras Hindu University. He is one of the foremost living scholars of the Vedas, Vedanta, and classical Sanskrit literature, with dozens of published works on Vedic exegesis.',
    lineage: 'Banaras Sanskrit tradition',
    sampradaya: 'Vedanta / Sanskrit',
    expertise: ['Vedic Sanskrit', 'Vedanta', 'Classical Sanskrit Literature'],
    scriptures: ['Rig Veda', 'Yajur Veda', 'Upanishads', 'Brahma Sutras'],
    languages: ['Sanskrit', 'Hindi', 'English'],
    yearsOfStudy: 50,
    currentPosition: 'Emeritus Professor of Sanskrit (retd.)',
    institution: 'Banaras Hindu University',
    location: 'Varanasi, India',
    tier: 'guru'
  },
  {
    name: 'Swami Satsangananda',
    email: 'satsangananda@pariprashna.local',
    honorific: 'Swami',
    shortBio: 'Direct disciple of Swami Satyananda and head of the Rikhiapeeth ashram.',
    bio: 'Swami Satsangananda Saraswati is a direct disciple of Swami Satyananda Saraswati. She founded the Rikhiapeeth ashram in Jharkhand, India, and has dedicated her life to teaching yoga, Vedanta, and the Bihar Yoga tradition in the spirit of her guru.',
    lineage: 'Satyananda -> Satsangananda',
    sampradaya: 'Satyananda lineage',
    expertise: ['Yoga', 'Meditation', 'Vedanta', 'Scripture'],
    scriptures: ['Yoga Sutras', 'Bhagavad Gita', 'Upanishads'],
    languages: ['English', 'Hindi', 'Sanskrit'],
    yearsOfStudy: 40,
    currentPosition: 'Founder, Rikhiapeeth',
    institution: 'Rikhiapeeth',
    location: 'Deoghar, Jharkhand, India',
    website: 'https://www.rikhiapeeth.org',
    tier: 'guru'
  }
];

async function seedGurus() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const salt = await bcrypt.genSalt(10);
    const defaultHash = await bcrypt.hash('guru123', salt);

    let created = 0, skipped = 0;

    for (const g of gurus) {
      let user = await User.findOne({ email: g.email });
      if (!user) {
        user = new User({
          name: g.name,
          email: g.email,
          password: defaultHash,
          provider: 'local',
          role: g.tier === 'acharya' ? 'acharya' : 'guru',
          isApprovedGuru: true,
          badges: [{ name: 'Verified Expert', type: 'special' }]
        });
        await user.save();
      } else {
        user.role = g.tier === 'acharya' ? 'acharya' : 'guru';
        user.isApprovedGuru = true;
        if (!user.password) {
          user.password = defaultHash;
        }
        await user.save();
      }

      const existing = await Guru.findOne({ user: user._id });
      if (existing) {
        skipped++;
        continue;
      }

      const profile = new Guru({
        user: user._id,
        displayName: g.name,
        honorific: g.honorific,
        shortBio: g.shortBio,
        bio: g.bio,
        lineage: g.lineage,
        sampradaya: g.sampradaya,
        expertise: g.expertise,
        scriptures: g.scriptures,
        languages: g.languages,
        yearsOfStudy: g.yearsOfStudy,
        currentPosition: g.currentPosition,
        institution: g.institution,
        location: g.location,
        website: g.website,
        social: g.social || {},
        tier: g.tier,
        verificationStatus: 'verified',
        verifiedAt: new Date(),
        notes: 'Seeded verified guru'
      });
      await profile.save();
      user.guruProfile = profile._id;
      await user.save();
      created++;
      console.log(`Seeded: ${g.name} (${g.email})`);
    }

    console.log(`\nDone. Created: ${created}, Skipped: ${skipped}`);
    console.log('Default password for new gurus: guru123');

    const adminEmail = 'admin@pariprashna.local';
    let admin = await User.findOne({ email: adminEmail });
    if (!admin) {
      const adminHash = await bcrypt.hash('admin123', salt);
      admin = new User({
        name: 'Site Admin',
        email: adminEmail,
        password: adminHash,
        provider: 'local',
        role: 'admin',
        isApprovedGuru: true,
        reputation: 1000,
        badges: [{ name: 'Administrator', type: 'special' }]
      });
      await admin.save();
      console.log(`\nSeeded admin user: ${adminEmail} / admin123`);
    } else {
      admin.role = 'admin';
      admin.isApprovedGuru = true;
      await admin.save();
      console.log(`\nAdmin user already exists: ${adminEmail}`);
    }

    await mongoose.disconnect();
  } catch (err) {
    console.error('Seed error:', err);
    process.exit(1);
  }
}

if (require.main === module) {
  seedGurus();
}

module.exports = seedGurus;
