const User = require('../models/User');
const Answer = require('../models/Answer');
const Question = require('../models/Question');
const Comment = require('../models/Comment');

const BADGE_CATALOG = {
  NEW_VOICE: {
    name: 'New Voice',
    type: 'milestone',
    icon: '🌱',
    description: 'Posted your first answer',
    color: 'bg-green-100 text-green-800 border-green-300',
    check: async (user) => (await Answer.countDocuments({ author: user._id })) >= 1
  },
  ACTIVE_CONTRIBUTOR: {
    name: 'Active Contributor',
    type: 'milestone',
    icon: '✍️',
    description: 'Posted 10 answers',
    color: 'bg-blue-100 text-blue-800 border-blue-300',
    check: async (user) => (await Answer.countDocuments({ author: user._id })) >= 10
  },
  PILLAR: {
    name: 'Pillar of the Community',
    type: 'milestone',
    icon: '🏛️',
    description: 'Posted 50 answers',
    color: 'bg-indigo-100 text-indigo-800 border-indigo-300',
    check: async (user) => (await Answer.countDocuments({ author: user._id })) >= 50
  },
  SAGE: {
    name: 'Sage',
    type: 'milestone',
    icon: '🦉',
    description: 'Posted 100 answers',
    color: 'bg-purple-100 text-purple-800 border-purple-300',
    check: async (user) => (await Answer.countDocuments({ author: user._id })) >= 100
  },
  INQUIRER: {
    name: 'Inquirer',
    type: 'milestone',
    icon: '❓',
    description: 'Asked your first question',
    color: 'bg-teal-100 text-teal-800 border-teal-300',
    check: async (user) => (await Question.countDocuments({ author: user._id })) >= 1
  },
  CURIOUS: {
    name: 'Curious Mind',
    type: 'milestone',
    icon: '🔍',
    description: 'Asked 10 questions',
    color: 'bg-cyan-100 text-cyan-800 border-cyan-300',
    check: async (user) => (await Question.countDocuments({ author: user._id })) >= 10
  },
  LIKED: {
    name: 'Well Liked',
    type: 'engagement',
    icon: '❤️',
    description: 'Received 10 likes on your comments',
    color: 'bg-pink-100 text-pink-800 border-pink-300',
    check: async (user) => {
      const commentIds = await Comment.find({ author: user._id }).distinct('_id');
      return (await Comment.aggregate([
        { $match: { _id: { $in: commentIds } } },
        { $project: { n: { $size: { $ifNull: ['$likes', []] } } } },
        { $group: { _id: null, total: { $sum: '$n' } } }
      ]))[0]?.total >= 10;
    }
  },
  ACCEPTED_ANSWER: {
    name: 'Accepted',
    type: 'recognition',
    icon: '✅',
    description: 'Your answer was accepted as the best',
    color: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    check: async (user) => (await Answer.countDocuments({ author: user._id, isAccepted: true })) >= 1
  },
  REPUTABLE: {
    name: 'Reputable',
    type: 'reputation',
    icon: '⭐',
    description: 'Reached 100 reputation',
    color: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    check: async (user) => (user.reputation || 0) >= 100
  },
  Venerated: {
    name: 'Venerated',
    type: 'reputation',
    icon: '🌟',
    description: 'Reached 500 reputation',
    color: 'bg-amber-100 text-amber-800 border-amber-300',
    check: async (user) => (user.reputation || 0) >= 500
  },
  ENLIGHTENED: {
    name: 'Enlightened',
    type: 'reputation',
    icon: '✨',
    description: 'Reached 1000 reputation',
    color: 'bg-orange-100 text-orange-800 border-orange-300',
    check: async (user) => (user.reputation || 0) >= 1000
  },
  VERIFIED_EXPERT: {
    name: 'Verified Expert',
    type: 'special',
    icon: '🪷',
    description: 'Verified by Pariprashna as a Hindu dharmic scholar',
    color: 'bg-rose-100 text-rose-800 border-rose-300',
    check: async (user) => !!user.isApprovedGuru
  },
  ADMIN: {
    name: 'Administrator',
    type: 'special',
    icon: '🛡️',
    description: 'Site administrator',
    color: 'bg-slate-100 text-slate-800 border-slate-300',
    check: async (user) => user.role === 'admin'
  }
};

async function evaluateAndAward(user) {
  if (!user || !user._id) return [];
  const fresh = await User.findById(user._id);
  if (!fresh) return [];
  const existing = new Set((fresh.badges || []).map(b => b.name));
  const newlyAwarded = [];
  for (const [key, meta] of Object.entries(BADGE_CATALOG)) {
    if (existing.has(meta.name)) continue;
    try {
      if (await meta.check(fresh)) {
        fresh.badges = fresh.badges || [];
        fresh.badges.push({ name: meta.name, type: meta.type, awardedAt: new Date(), key });
        newlyAwarded.push({ key, ...meta });
      }
    } catch (e) {
      console.error('Badge check failed for', key, e.message);
    }
  }
  if (newlyAwarded.length > 0) {
    await fresh.save();
  }
  return newlyAwarded;
}

function getBadgeMeta(name) {
  for (const meta of Object.values(BADGE_CATALOG)) {
    if (meta.name === name) return meta;
  }
  return null;
}

function listAllBadges() {
  return Object.entries(BADGE_CATALOG).map(([key, meta]) => ({ key, ...meta }));
}

module.exports = { BADGE_CATALOG, evaluateAndAward, getBadgeMeta, listAllBadges };
