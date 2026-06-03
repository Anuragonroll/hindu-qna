import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import {
  FiMessageSquare, FiUsers, FiTag, FiTrendingUp,
  FiBookOpen, FiChevronRight, FiClock, FiAward,
  FiStar, FiSearch, FiArrowRight, FiCheckCircle,
  FiShield, FiZap, FiFeather
} from 'react-icons/fi';

const TIME_AGO = (date) => {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(date).toLocaleDateString();
};

const Home = () => {
  const [stats, setStats] = useState({ questions: 0, users: 0, answers: 0, tags: 0 });
  const [hotQuestions, setHotQuestions] = useState([]);
  const [recentQuestions, setRecentQuestions] = useState([]);
  const [topUsers, setTopUsers] = useState([]);
  const [recentAnswers, setRecentAnswers] = useState([]);
  const [verseStats, setVerseStats] = useState({ totalVerses: 0 });
  const [activeTab, setActiveTab] = useState('hot');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [hotQRes, recentQRes, statsRes, activityRes, shlokaRes] = await Promise.all([
          api.get('/questions?sort=votes&limit=5'),
          api.get('/questions?sort=newest&limit=5'),
          api.get('/admin/public-stats'),
          api.get('/home/recent-activity'),
          fetch('/api/shlokas/stats').then(r => r.json()).catch(() => ({ totalVerses: 0 })),
        ]);
        setHotQuestions(hotQRes.data.questions);
        setRecentQuestions(recentQRes.data.questions);
        setStats(statsRes.data);
        setTopUsers(activityRes.data.topUsers);
        setRecentAnswers(activityRes.data.recentAnswers);
        setVerseStats(shlokaRes);
      } catch (error) {
        console.error('Error fetching home data:', error);
      }
    };
    fetchData();
  }, []);

  const questions = activeTab === 'hot' ? hotQuestions : recentQuestions;

  return (
    <div className="max-w-6xl mx-auto">
      {/* ===== HERO SECTION ===== */}
      <div className="relative overflow-hidden rounded-2xl mb-10 bg-gradient-to-br from-orange-600 via-orange-500 to-red-600 text-white">
        {/* Decorative background elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/4" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-1/3 -translate-x-1/4" />
        <div className="absolute top-1/2 left-1/3 w-32 h-32 bg-white/[0.03] rounded-full" />

        <div className="relative px-8 md:px-12 py-10 md:py-14">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="max-w-2xl">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-3xl">🕉️</span>
                <span className="text-4xl font-bold">Pariprashna</span>
              </div>
              <p className="text-xl md:text-2xl font-light text-orange-100 leading-relaxed mb-4">
                A community for authentic answers on Hinduism, Sanātana Dharma, and Vedic wisdom — rooted in scriptures and verified by scholars.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link
                  to="/questions/ask"
                  className="inline-flex items-center gap-2 bg-white text-orange-700 px-6 py-3 rounded-xl font-semibold hover:bg-orange-50 transition-all shadow-lg shadow-orange-900/20"
                >
                  <FiFeather /> Ask a Question
                </Link>
                <Link
                  to="/scriptures"
                  className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm border border-white/30 px-6 py-3 rounded-xl font-medium hover:bg-white/25 transition-all"
                >
                  <FiBookOpen /> Browse Scriptures
                </Link>
                <Link
                  to="/chat"
                  className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm border border-white/30 px-6 py-3 rounded-xl font-medium hover:bg-white/25 transition-all"
                >
                  <FiZap /> AI Chat
                </Link>
              </div>
            </div>

            {/* Feature highlights */}
            <div className="hidden lg:flex flex-col gap-3 text-sm text-orange-100">
              <div className="flex items-center gap-2"><FiCheckCircle className="text-orange-300" /> Guru-verified answers</div>
              <div className="flex items-center gap-2"><FiCheckCircle className="text-orange-300" /> 13,000+ scripture verses</div>
              <div className="flex items-center gap-2"><FiCheckCircle className="text-orange-300" /> AI-assisted research</div>
            </div>
          </div>
        </div>
      </div>

      {/* ===== STATS ROW ===== */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-10">
        {[
          { icon: FiMessageSquare, label: 'Questions', value: stats.questions, color: 'text-blue-600', bg: 'bg-blue-50' },
          { icon: FiUsers, label: 'Users', value: stats.users, color: 'text-green-600', bg: 'bg-green-50' },
          { icon: FiTrendingUp, label: 'Answers', value: stats.answers, color: 'text-purple-600', bg: 'bg-purple-50' },
          { icon: FiTag, label: 'Tags', value: stats.tags, color: 'text-orange-600', bg: 'bg-orange-50' },
          { icon: FiBookOpen, label: 'Verses', value: verseStats.totalVerses, color: 'text-red-600', bg: 'bg-red-50' },
        ].map(({ icon: Icon, label, value, color, bg }) => (
          <div key={label} className={`${bg} rounded-xl p-4 text-center border border-gray-100 hover:shadow-md transition-shadow`}>
            <Icon className={`text-2xl ${color} mx-auto mb-1`} />
            <div className="text-2xl font-bold text-gray-800">{typeof value === 'number' ? value.toLocaleString() : value}</div>
            <div className="text-xs text-gray-500 font-medium uppercase tracking-wide">{label}</div>
          </div>
        ))}
      </div>

      {/* ===== MAIN CONTENT: Two-column layout ===== */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10">
        {/* LEFT — Questions */}
        <div className="lg:col-span-2">
          {/* Tabs */}
          <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1 mb-6 w-fit">
            <button
              onClick={() => setActiveTab('hot')}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                activeTab === 'hot' ? 'bg-white text-orange-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <FiStar className={activeTab === 'hot' ? 'text-orange-500' : ''} /> Most Asked
            </button>
            <button
              onClick={() => setActiveTab('recent')}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                activeTab === 'recent' ? 'bg-white text-orange-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <FiClock className={activeTab === 'recent' ? 'text-orange-500' : ''} /> Recent
            </button>
          </div>

          {/* Question list */}
          <div className="space-y-3">
            {questions.length === 0 && (
              <div className="bg-white rounded-xl p-8 text-center text-gray-400 border border-dashed border-gray-200">
                <FiMessageSquare className="text-3xl mx-auto mb-2" />
                <p>No questions yet. Be the first to ask!</p>
              </div>
            )}
            {questions.map((q) => (
              <Link
                key={q._id}
                to={`/questions/${q._id}`}
                className="block bg-white rounded-xl p-5 border border-gray-100 hover:border-orange-200 hover:shadow-md transition-all group"
              >
                <div className="flex items-start gap-4">
                  {/* Vote + answer count */}
                  <div className="flex flex-col items-center gap-1 min-w-[56px]">
                    <div className="text-lg font-bold text-gray-700">
                      {(q.upvotes?.length || 0) - (q.downvotes?.length || 0)}
                    </div>
                    <div className="text-[10px] text-gray-400 uppercase font-semibold">votes</div>
                    <div className={`text-sm font-bold ${(q.answers?.length || 0) > 0 ? 'text-green-600' : 'text-gray-400'}`}>
                      {q.answers?.length || 0}
                    </div>
                    <div className="text-[10px] text-gray-400 uppercase font-semibold">ans</div>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base font-semibold text-gray-800 group-hover:text-orange-600 transition-colors leading-snug">
                      {q.title}
                    </h3>
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {q.tags?.map((tag) => (
                        <span
                          key={tag._id || tag.name}
                          className="bg-orange-50 text-orange-700 text-[11px] font-medium px-2 py-0.5 rounded"
                        >
                          {tag.name}
                        </span>
                      ))}
                    </div>
                    <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                      <span>asked {TIME_AGO(q.createdAt)}</span>
                      <span>•</span>
                      <span>{q.views || 0} views</span>
                      {q.author?.name && (
                        <>
                          <span>•</span>
                          <span className="text-gray-500">{q.author.name}</span>
                        </>
                      )}
                    </div>
                  </div>

                  <FiChevronRight className="text-gray-300 group-hover:text-orange-400 mt-1 transition-colors flex-shrink-0" />
                </div>
              </Link>
            ))}
          </div>

          <Link
            to="/questions"
            className="flex items-center justify-center gap-2 mt-4 text-sm font-semibold text-orange-600 hover:text-orange-700 bg-orange-50 hover:bg-orange-100 rounded-xl py-3 transition-colors"
          >
            View all questions <FiArrowRight />
          </Link>
        </div>

        {/* RIGHT — Sidebar */}
        <div className="space-y-6">
          {/* Top Contributors */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
              <FiAward className="text-orange-500" />
              <h3 className="font-bold text-gray-800">Top Contributors</h3>
            </div>
            <div className="divide-y divide-gray-50">
              {topUsers.map((u, i) => (
                <Link
                  key={u._id}
                  to={`/users/${u._id}`}
                  className="flex items-center gap-3 px-5 py-3 hover:bg-orange-50/50 transition-colors"
                >
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                    i === 0 ? 'bg-yellow-100 text-yellow-700' :
                    i === 1 ? 'bg-gray-100 text-gray-500' :
                    i === 2 ? 'bg-orange-100 text-orange-600' :
                    'bg-gray-50 text-gray-400'
                  }`}>
                    {i + 1}
                  </span>
                  <div className="w-8 h-8 bg-orange-100 text-orange-700 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                    {u.name?.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-800 truncate">
                      {u.name}
                      {u.role === 'guru' && <span className="ml-1 text-yellow-600" title="Guru">🏅</span>}
                      {u.role === 'admin' && <span className="ml-1 text-blue-600" title="Admin">⚙️</span>}
                    </div>
                    <div className="text-xs text-gray-400">{u.reputation} reputation</div>
                  </div>
                  <FiChevronRight className="text-gray-300 text-xs flex-shrink-0" />
                </Link>
              ))}
              {topUsers.length === 0 && (
                <div className="px-5 py-6 text-center text-gray-400 text-sm">No contributors yet</div>
              )}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
              <FiClock className="text-orange-500" />
              <h3 className="font-bold text-gray-800">Recent Activity</h3>
            </div>
            <div className="divide-y divide-gray-50">
              {recentAnswers.map((a) => (
                <Link
                  key={a._id}
                  to={`/questions/${a.question?._id || a.question}`}
                  className="block px-5 py-3 hover:bg-orange-50/50 transition-colors"
                >
                  <div className="flex items-start gap-2">
                    <div className="mt-0.5 flex-shrink-0">
                      <div className="w-6 h-6 bg-green-100 text-green-700 rounded-full flex items-center justify-center text-[10px] font-bold">
                        {a.author?.name?.charAt(0).toUpperCase() || '?'}
                      </div>
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs text-gray-600 leading-snug">
                        <span className="font-medium text-gray-800">{a.author?.name || 'Someone'}</span>
                        {' '}answered{' '}
                        <span className="text-orange-600 font-medium">
                          {a.question?.title ? (
                            a.question.title.length > 50
                              ? a.question.title.slice(0, 50) + '…'
                              : a.question.title
                          ) : 'a question'}
                        </span>
                      </p>
                      <p className="text-[11px] text-gray-400 mt-0.5">{TIME_AGO(a.createdAt)}</p>
                    </div>
                  </div>
                </Link>
              ))}
              {recentAnswers.length === 0 && (
                <div className="px-5 py-6 text-center text-gray-400 text-sm">No recent activity</div>
              )}
            </div>
          </div>

          {/* Quick Links */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
              <FiSearch className="text-orange-500" />
              Explore
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {[
                { to: '/scriptures', label: '📜 Scriptures', desc: '13K+ verses' },
                { to: '/gurus', label: '🏅 Gurus', desc: 'Verified scholars' },
                { to: '/chat', label: '🤖 AI Chat', desc: 'Ask anything' },
                { to: '/tags', label: '🏷️ Tags', desc: 'Browse topics' },
                { to: '/bounties', label: '🎯 Bounties', desc: 'Earn rewards' },
                { to: '/users', label: '👥 Users', desc: 'Community' },
              ].map(({ to, label, desc }) => (
                <Link
                  key={to}
                  to={to}
                  className="p-3 rounded-lg bg-gray-50 hover:bg-orange-50 border border-gray-100 hover:border-orange-200 transition-all group"
                >
                  <div className="text-sm font-medium text-gray-700 group-hover:text-orange-700">{label}</div>
                  <div className="text-[11px] text-gray-400 mt-0.5">{desc}</div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ===== FEATURES SECTION ===== */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 mb-10">
        <h2 className="text-2xl font-bold text-center text-gray-800 mb-8">Why Pariprashna?</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            {
              icon: FiShield,
              title: 'Guru-Verified Answers',
              desc: 'Every answer is reviewed by certified gurus and scholars to ensure authenticity and scriptural accuracy.',
              color: 'text-yellow-600',
              bg: 'bg-yellow-50',
            },
            {
              icon: FiBookOpen,
              title: 'Scripture-Grounded',
              desc: 'All answers link directly to original verses from the Bhagavad Gita, Srimad Bhagavatam, Upanishads, and more.',
              color: 'text-orange-600',
              bg: 'bg-orange-50',
            },
            {
              icon: FiZap,
              title: 'AI-Powered Research',
              desc: 'Our AI assistant searches through 13,000+ verses to provide scripture-backed answers, reviewed by human experts.',
              color: 'text-purple-600',
              bg: 'bg-purple-50',
            },
          ].map(({ icon: Icon, title, desc, color, bg }) => (
            <div key={title} className="text-center">
              <div className={`w-14 h-14 ${bg} rounded-2xl flex items-center justify-center mx-auto mb-4`}>
                <Icon className={`text-2xl ${color}`} />
              </div>
              <h3 className="font-bold text-gray-800 mb-2">{title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ===== CTA BANNER ===== */}
      <div className="bg-gradient-to-r from-orange-600 to-orange-500 rounded-2xl p-8 md:p-10 text-white text-center mb-6">
        <h2 className="text-2xl md:text-3xl font-bold mb-3">Ready to explore Sanātana Dharma?</h2>
        <p className="text-orange-100 mb-6 max-w-lg mx-auto">
          Join our community of seekers, scholars, and gurus. Ask questions, share knowledge, and deepen your understanding.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <Link
            to="/register"
            className="bg-white text-orange-700 px-8 py-3 rounded-xl font-semibold hover:bg-orange-50 transition-all shadow-lg"
          >
            Create Account
          </Link>
          <Link
            to="/scriptures"
            className="bg-white/15 backdrop-blur-sm border border-white/30 px-8 py-3 rounded-xl font-medium hover:bg-white/25 transition-all"
          >
            Explore Scriptures
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Home;
