import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../utils/api';
import MarkdownRenderer from '../components/MarkdownRenderer';
import { FiUser, FiCalendar, FiTrendingUp, FiAward } from 'react-icons/fi';
import { formatDistanceToNow } from 'date-fns';

const UserProfile = () => {
  const { id } = useParams();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const { data } = await api.get(`/users/${id}`);
        setProfile(data);
      } catch (err) {
        console.error('Profile load failed:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  if (loading) return <div className="max-w-5xl mx-auto p-6">Loading…</div>;
  if (!profile) return <div className="max-w-5xl mx-auto p-6">User not found.</div>;

  const acceptedAnswers = (profile.answers || []).filter(a => a.isAccepted).length;
  const totalLikesReceived = 0; // could be computed but optional

  return (
    <div className="max-w-5xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="bg-gradient-to-r from-orange-500 to-rose-500 p-6 text-white">
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center text-3xl font-bold border-2 border-white/30">
              {profile.avatar ? (
                <img src={profile.avatar} alt={profile.name} className="w-full h-full rounded-full object-cover" />
              ) : (
                profile.name?.[0]?.toUpperCase() || '?'
              )}
            </div>
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                {profile.name}
                {profile.role === 'admin' && <span className="text-xs bg-white/20 px-2 py-0.5 rounded">Admin</span>}
                {['guru', 'acharya'].includes(profile.role) && (
                  <span className="text-xs bg-white/20 px-2 py-0.5 rounded">Guru</span>
                )}
              </h1>
              <div className="text-sm text-white/80 mt-1 flex flex-wrap gap-3">
                <span className="flex items-center gap-1">
                  <FiUser size={12} /> {profile.email}
                </span>
                <span className="flex items-center gap-1">
                  <FiCalendar size={12} /> joined {formatDistanceToNow(new Date(profile.createdAt || Date.now()), { addSuffix: true })}
                </span>
                <span className="flex items-center gap-1">
                  <FiTrendingUp size={12} /> {profile.reputation || 0} reputation
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="border-b">
          <div className="flex">
            {['overview', 'questions', 'answers', 'badges'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-3 text-sm font-medium capitalize ${
                  activeTab === tab
                    ? 'border-b-2 border-orange-500 text-orange-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab} {tab === 'questions' && `(${profile.questions?.length || 0})`} {tab === 'answers' && `(${profile.answers?.length || 0})`} {tab === 'badges' && `(${profile.badges?.length || 0})`}
              </button>
            ))}
          </div>
        </div>

        <div className="p-6">
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <StatCard label="Questions" value={profile.questions?.length || 0} />
              <StatCard label="Answers" value={profile.answers?.length || 0} />
              <StatCard label="Accepted Answers" value={acceptedAnswers} />
              <StatCard label="Reputation" value={profile.reputation || 0} />
              <StatCard label="Favorites" value={profile.favorites?.length || 0} />
              <StatCard label="Badges" value={profile.badges?.length || 0} />
              {profile.bio && (
                <div className="md:col-span-3 mt-4 p-4 bg-gray-50 rounded">
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">About</h3>
                  <p className="text-sm text-gray-600 whitespace-pre-line">{profile.bio}</p>
                </div>
              )}
              {profile.badges && profile.badges.length > 0 && (
                <div className="md:col-span-3 mt-2">
                  <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1">
                    <FiAward size={14} /> Recent Badges
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {profile.badges.slice(0, 8).map((b, i) => (
                      <BadgeChip key={i} badge={b} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'questions' && (
            <div className="space-y-3">
              {profile.questions?.length === 0 && <EmptyState text="No questions yet." />}
              {profile.questions?.map(q => (
                <Link
                  key={q._id}
                  to={`/questions/${q._id}`}
                  className="block p-3 border rounded hover:bg-gray-50"
                >
                  <div className="font-medium text-gray-800">{q.title}</div>
                  <div className="text-xs text-gray-500 mt-1 flex gap-3">
                    <span>{q.views || 0} views</span>
                    <span>{(q.answers || []).length} answers</span>
                    <span>{formatDistanceToNow(new Date(q.createdAt), { addSuffix: true })}</span>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {activeTab === 'answers' && (
            <div className="space-y-3">
              {profile.answers?.length === 0 && <EmptyState text="No answers yet." />}
              {profile.answers?.map(a => (
                <Link
                  key={a._id}
                  to={`/questions/${a.question?._id || a.question}`}
                  className="block p-3 border rounded hover:bg-gray-50"
                >
                  <div className="text-sm text-gray-600 line-clamp-2 mb-1">
                    <MarkdownRenderer content={a.body} />
                  </div>
                  <div className="text-xs text-gray-500">
                    on <span className="text-orange-600">{a.question?.title || 'a question'}</span>
                    {' · '}
                    {formatDistanceToNow(new Date(a.createdAt), { addSuffix: true })}
                    {a.isAccepted && <span className="ml-2 text-green-600 font-semibold">✓ Accepted</span>}
                  </div>
                </Link>
              ))}
            </div>
          )}

          {activeTab === 'badges' && (
            <div>
              {profile.badges?.length === 0 && <EmptyState text="No badges earned yet. Start asking and answering questions to earn badges!" />}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {profile.badges?.map((b, i) => (
                  <div key={i} className={`p-4 rounded border ${b.color || 'bg-gray-50 border-gray-200'}`}>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-2xl">{b.icon || '🏅'}</span>
                      <div>
                        <div className="font-semibold">{b.name}</div>
                        <div className="text-xs opacity-75">{b.type}</div>
                      </div>
                    </div>
                    {b.description && <p className="text-xs mt-1 opacity-80">{b.description}</p>}
                    {b.awardedAt && (
                      <p className="text-xs mt-2 opacity-60">
                        earned {formatDistanceToNow(new Date(b.awardedAt), { addSuffix: true })}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ label, value }) => (
  <div className="p-4 border rounded text-center">
    <div className="text-2xl font-bold text-orange-600">{value}</div>
    <div className="text-xs text-gray-500 uppercase tracking-wide mt-1">{label}</div>
  </div>
);

const BadgeChip = ({ badge }) => (
  <span
    className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded border ${badge.color || 'bg-gray-100 text-gray-800 border-gray-300'}`}
    title={badge.description}
  >
    <span>{badge.icon || '🏅'}</span>
    <span className="font-medium">{badge.name}</span>
  </span>
);

const EmptyState = ({ text }) => (
  <div className="text-center text-gray-400 py-8 text-sm">{text}</div>
);

export default UserProfile;
