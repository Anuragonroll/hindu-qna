const express = require('express');
const router = express.Router();
const Answer = require('../models/Answer');
const Question = require('../models/Question');
const User = require('../models/User');
const Tag = require('../models/Tag');
const Comment = require('../models/Comment');
const Guru = require('../models/Guru');
const { auth, guruAuth } = require('../middleware/auth');
const { extractShlokaReferences, resolveShlokaReferences } = require('../utils/shlokaRef');

// Get guru dashboard
router.get('/dashboard', guruAuth, async (req, res) => {
  try {
    const pendingVerifications = await Answer.find({ isVerifiedByGuru: false })
      .populate('author', 'name avatar')
      .populate('question', 'title')
      .sort({ createdAt: -1 })
      .limit(20);

    const verifiedByMe = await Answer.find({ verifiedBy: req.user._id })
      .populate('author', 'name avatar')
      .populate('question', 'title')
      .sort({ verifiedAt: -1 })
      .limit(20);

    const stats = {
      pendingCount: await Answer.countDocuments({ isVerifiedByGuru: false }),
      verifiedCount: await Answer.countDocuments({ verifiedBy: req.user._id }),
      totalAnswers: await Answer.countDocuments()
    };

    res.json({
      pendingVerifications,
      verifiedByMe,
      stats
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get pending verifications
router.get('/pending', guruAuth, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;

    const answers = await Answer.find({ isVerifiedByGuru: false })
      .populate('author', 'name avatar reputation')
      .populate({
        path: 'question',
        populate: { path: 'tags', select: 'name' }
      })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Answer.countDocuments({ isVerifiedByGuru: false });

    res.json({
      answers,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page)
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Verify answer
router.post('/verify/:answerId', guruAuth, async (req, res) => {
  try {
    const { note } = req.body;
    const answer = await Answer.findById(req.params.answerId);
    
    if (!answer) {
      return res.status(404).json({ message: 'Answer not found' });
    }

    if (answer.isVerifiedByGuru) {
      return res.status(400).json({ message: 'Answer already verified' });
    }

    answer.isVerifiedByGuru = true;
    answer.verifiedBy = req.user._id;
    answer.verifiedAt = new Date();
    answer.verificationNote = note;
    await answer.save();

    // Add reputation to answer author
    await User.findByIdAndUpdate(answer.author, { $inc: { reputation: 25 } });

    // Add badge if first verification received
    const answerAuthor = await User.findById(answer.author);
    const hasVerifiedBadge = answerAuthor.badges.some(b => b.name === 'Guru Verified');
    if (!hasVerifiedBadge) {
      answerAuthor.badges.push({
        name: 'Guru Verified',
        type: 'gold'
      });
      await answerAuthor.save();
    }

    // Add verification badge to guru
    const guru = await User.findById(req.user._id);
    const hasGuruBadge = guru.badges.some(b => b.name === 'Verification Expert');
    if (!hasGuruBadge) {
      guru.badges.push({
        name: 'Verification Expert',
        type: 'silver'
      });
      await guru.save();
    }

    // Bump guru profile stats
    await Guru.findOneAndUpdate(
      { user: req.user._id },
      { $inc: { 'stats.answersVerified': 1 } }
    );

    res.json({ message: 'Answer verified successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Unverify answer
router.post('/unverify/:answerId', guruAuth, async (req, res) => {
  try {
    const answer = await Answer.findById(req.params.answerId);
    
    if (!answer) {
      return res.status(404).json({ message: 'Answer not found' });
    }

    if (answer.verifiedBy.toString() !== req.user._id.toString() && req.user.role !== 'acharya') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    answer.isVerifiedByGuru = false;
    answer.verifiedBy = undefined;
    answer.verifiedAt = undefined;
    answer.verificationNote = undefined;
    await answer.save();

    // Remove reputation
    await User.findByIdAndUpdate(answer.author, { $inc: { reputation: -25 } });

    res.json({ message: 'Verification removed' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get verified answers by guru
router.get('/verified', guruAuth, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;

    const answers = await Answer.find({ verifiedBy: req.user._id })
      .populate('author', 'name avatar')
      .populate('question', 'title')
      .sort({ verifiedAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Answer.countDocuments({ verifiedBy: req.user._id });

    res.json({
      answers,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page)
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all gurus
router.get('/list', async (req, res) => {
  try {
    const gurus = await User.find({ role: { $in: ['guru', 'acharya'] } })
      .select('name avatar reputation badges role')
      .sort({ reputation: -1 });

    res.json(gurus);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Feature answer (acharya only)
router.post('/feature/:answerId', auth, async (req, res) => {
  try {
    if (req.user.role !== 'acharya' && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Acharya privileges required' });
    }

    const answer = await Answer.findById(req.params.answerId);
    if (!answer) {
      return res.status(404).json({ message: 'Answer not found' });
    }

    // Add featured badge
    const author = await User.findById(answer.author);
    if (!author.badges.some(b => b.name === 'Featured Answer')) {
      author.badges.push({
        name: 'Featured Answer',
        type: 'gold'
      });
      await author.save();
    }

    res.json({ message: 'Answer featured' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// ─── Parse shloka references (preview as the guru types) ────────────────────
router.post('/parse-shlokas', auth, async (req, res) => {
  try {
    if (!['guru', 'acharya', 'admin', 'scholar'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Guru privileges required' });
    }
    const { text } = req.body;
    const refs = await resolveShlokaReferences(text || '');
    res.json({ count: refs.length, shlokas: refs });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// ─── Manage tags on a question ──────────────────────────────────────────────
router.post('/questions/:id/tags/add', guruAuth, async (req, res) => {
  try {
    const { tagName } = req.body;
    if (!tagName || typeof tagName !== 'string') {
      return res.status(400).json({ message: 'tagName is required' });
    }
    const name = tagName.toLowerCase().trim();
    if (!/^[a-z0-9-]{1,30}$/.test(name)) {
      return res.status(400).json({ message: 'Invalid tag name' });
    }

    const question = await Question.findById(req.params.id);
    if (!question) {
      return res.status(404).json({ message: 'Question not found' });
    }

    let tag = await Tag.findOne({ name });
    if (!tag) {
      tag = new Tag({ name, createdBy: req.user._id });
      await tag.save();
    }

    if (question.tags.some(t => t.toString() === tag._id.toString())) {
      return res.status(400).json({ message: 'Tag already on question' });
    }

    question.tags.push(tag._id);
    tag.count += 1;
    await tag.save();
    await question.save();

    res.json({ message: 'Tag added', tag });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/questions/:id/tags/remove', guruAuth, async (req, res) => {
  try {
    const { tagId } = req.body;
    if (!tagId) {
      return res.status(400).json({ message: 'tagId is required' });
    }

    const question = await Question.findById(req.params.id);
    if (!question) {
      return res.status(404).json({ message: 'Question not found' });
    }

    const before = question.tags.length;
    question.tags = question.tags.filter(t => t.toString() !== tagId.toString());
    if (question.tags.length === before) {
      return res.status(404).json({ message: 'Tag not on question' });
    }

    const tag = await Tag.findById(tagId);
    if (tag && tag.count > 0) {
      tag.count -= 1;
      await tag.save();
    }

    await question.save();
    res.json({ message: 'Tag removed' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// ─── Delete question (etiquette violation) ──────────────────────────────────
router.delete('/questions/:id', guruAuth, async (req, res) => {
  try {
    const { reason } = req.body;
    const question = await Question.findById(req.params.id);
    if (!question) {
      return res.status(404).json({ message: 'Question not found' });
    }

    if (question.author.toString() === req.user._id.toString()) {
      return res.status(400).json({ message: 'Gurus cannot delete their own questions through this endpoint' });
    }

    // Decrement tag counts
    for (const tagId of question.tags) {
      const tag = await Tag.findById(tagId);
      if (tag && tag.count > 0) {
        tag.count -= 1;
        await tag.save();
      }
    }

    // Soft-record moderation action (re-using close fields)
    question.isClosed = true;
    question.closeReason = reason ? `Deleted by guru (${req.user.name}): ${reason}` : `Deleted by guru (${req.user.name})`;
    question.moderatedBy = req.user._id;
    question.moderatedAt = new Date();
    await question.save();

    // Remove answers and comments referencing this question
    await Answer.deleteMany({ question: question._id });
    await Comment.deleteMany({ post: question._id, postModel: 'Question' });

    // Finally remove the question
    await question.deleteOne();

    // Bump guru stats
    await Guru.findOneAndUpdate(
      { user: req.user._id },
      { $inc: { 'stats.questionsModerated': 1 } }
    );

    res.json({ message: 'Question deleted by guru' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// ─── Badge a comment ────────────────────────────────────────────────────────
router.post('/comments/:id/badge', guruAuth, async (req, res) => {
  try {
    const { badge, note } = req.body;
    const allowed = ['insightful', 'helpful', 'scriptural', 'clarification', 'verified'];
    if (!allowed.includes(badge)) {
      return res.status(400).json({ message: 'Invalid badge type' });
    }

    const comment = await Comment.findById(req.params.id);
    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    if (comment.author.toString() === req.user._id.toString()) {
      return res.status(400).json({ message: 'Cannot badge your own comment' });
    }

    comment.badge = badge;
    comment.badgedBy = req.user._id;
    comment.badgedAt = new Date();
    comment.badgeNote = note || '';
    await comment.save();

    // Bump guru stats
    await Guru.findOneAndUpdate(
      { user: req.user._id },
      { $inc: { 'stats.commentsBadged': 1 } }
    );

    // Award small reputation to comment author
    await User.findByIdAndUpdate(comment.author, { $inc: { reputation: 2 } });

    res.json({ message: 'Comment badged', comment });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.delete('/comments/:id/badge', guruAuth, async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);
    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }
    if (!comment.badge) {
      return res.status(400).json({ message: 'Comment has no badge' });
    }
    if (comment.badgedBy.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    comment.badge = null;
    comment.badgedBy = undefined;
    comment.badgedAt = undefined;
    comment.badgeNote = '';
    await comment.save();

    // Reverse reputation
    await User.findByIdAndUpdate(comment.author, { $inc: { reputation: -2 } });

    res.json({ message: 'Badge removed' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// ─── Guru profile (self) ────────────────────────────────────────────────────
router.get('/profile', guruAuth, async (req, res) => {
  try {
    let profile = await Guru.findOne({ user: req.user._id });
    if (!profile) {
      // Auto-create a minimal profile
      profile = new Guru({
        user: req.user._id,
        displayName: req.user.name,
        tier: req.user.role === 'acharya' ? 'acharya' : 'guru',
        verificationStatus: 'verified',
        verifiedBy: req.user._id,
        verifiedAt: new Date()
      });
      await profile.save();
      await User.findByIdAndUpdate(req.user._id, { guruProfile: profile._id });
    }
    res.json(profile);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// ─── List guru profiles (public) ────────────────────────────────────────────
router.get('/profiles', async (req, res) => {
  try {
    const { sampradaya, expertise, tier } = req.query;
    const query = { verificationStatus: 'verified' };
    if (sampradaya) query.sampradaya = new RegExp(`^${sampradaya}$`, 'i');
    if (expertise) query.expertise = new RegExp(`^${expertise}$`, 'i');
    if (tier) query.tier = tier;
    const gurus = await Guru.find(query)
      .populate('user', 'name avatar reputation badges')
      .sort({ isFeatured: -1, createdAt: -1 });
    res.json(gurus);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// ─── Get single guru profile by user id ─────────────────────────────────────
router.get('/profiles/:userId', async (req, res) => {
  try {
    const profile = await Guru.findOne({ user: req.params.userId })
      .populate('user', 'name avatar reputation badges');
    if (!profile) {
      return res.status(404).json({ message: 'Guru profile not found' });
    }
    res.json(profile);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
