const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Question = require('../models/Question');
const Answer = require('../models/Answer');
const Tag = require('../models/Tag');
const Guru = require('../models/Guru');
const { auth, adminAuth } = require('../middleware/auth');

// Public stats for homepage
router.get('/public-stats', async (req, res) => {
  try {
    const stats = {
      users: await User.countDocuments(),
      questions: await Question.countDocuments(),
      answers: await Answer.countDocuments({ isAIGenerated: false }),
      tags: await Tag.countDocuments()
    };
    res.json(stats);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get admin dashboard stats
router.get('/stats', adminAuth, async (req, res) => {
  try {
    const stats = {
      users: await User.countDocuments(),
      questions: await Question.countDocuments(),
      answers: await Answer.countDocuments(),
      tags: await Tag.countDocuments(),
      pendingGurus: await User.countDocuments({ role: 'user', isApprovedGuru: true }),
      gurus: await User.countDocuments({ role: { $in: ['guru', 'acharya'] } })
    };

    res.json(stats);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all users
router.get('/users', adminAuth, async (req, res) => {
  try {
    const { page = 1, limit = 20, role, search } = req.query;
    
    let query = {};
    if (role) query.role = role;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await User.countDocuments(query);

    res.json({
      users,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page)
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Update user role
router.put('/users/:id/role', adminAuth, async (req, res) => {
  try {
    const { role } = req.body;
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.role = role;
    await user.save();

    res.json({ message: 'User role updated' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Approve guru
router.post('/gurus/approve', adminAuth, async (req, res) => {
  try {
    const { userId } = req.body;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.role = 'guru';
    user.isApprovedGuru = true;
    if (!user.badges.some(b => b.name === 'Approved Guru')) {
      user.badges.push({
        name: 'Approved Guru',
        type: 'special'
      });
    }
    await user.save();

    res.json({ message: 'Guru approved' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Reject guru
router.post('/gurus/reject', adminAuth, async (req, res) => {
  try {
    const { userId } = req.body;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.role = 'user';
    user.isApprovedGuru = false;
    await user.save();

    res.json({ message: 'Guru rejected' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// ─── Guru profile management (admin only) ───────────────────────────────────

// List all guru profiles
router.get('/gurus/profiles', adminAuth, async (req, res) => {
  try {
    const profiles = await Guru.find()
      .populate('user', 'name email avatar reputation role isApprovedGuru')
      .sort({ createdAt: -1 });
    res.json(profiles);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Create a new guru (creates both User and Guru profile)
router.post('/gurus/profiles', adminAuth, async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      role = 'guru',
      displayName,
      honorific = '',
      photo = '',
      bio = '',
      shortBio = '',
      lineage = '',
      sampradaya = '',
      expertise = [],
      scriptures = [],
      languages = [],
      yearsOfStudy = 0,
      currentPosition = '',
      institution = '',
      location = '',
      website = '',
      social = {},
      tier = 'guru',
      isFeatured = false,
      notes = ''
    } = req.body;

    if (!name || !email) {
      return res.status(400).json({ message: 'name and email are required' });
    }
    if (!['guru', 'acharya', 'scholar'].includes(role)) {
      return res.status(400).json({ message: 'role must be guru, acharya, or scholar' });
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(400).json({ message: 'A user with this email already exists' });
    }

    // Create the user account
    const userPassword = password || 'guru123';
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(userPassword, salt);

    const user = new User({
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      provider: 'local',
      role,
      isApprovedGuru: true,
      badges: [{ name: 'Verified Expert', type: 'special' }]
    });
    await user.save();

    // Create the guru profile
    const profile = new Guru({
      user: user._id,
      displayName: displayName || name,
      honorific,
      photo,
      bio,
      shortBio,
      lineage,
      sampradaya,
      expertise: Array.isArray(expertise) ? expertise : (expertise || '').split(',').map(s => s.trim()).filter(Boolean),
      scriptures: Array.isArray(scriptures) ? scriptures : (scriptures || '').split(',').map(s => s.trim()).filter(Boolean),
      languages: Array.isArray(languages) ? languages : (languages || '').split(',').map(s => s.trim()).filter(Boolean),
      yearsOfStudy,
      currentPosition,
      institution,
      location,
      website,
      social: social || {},
      tier: tier || role,
      verificationStatus: 'verified',
      verifiedBy: req.user._id,
      verifiedAt: new Date(),
      notes,
      isFeatured
    });
    await profile.save();

    // Link back to user
    user.guruProfile = profile._id;
    await user.save();

    const populated = await Guru.findById(profile._id).populate('user', 'name email avatar reputation role isApprovedGuru');
    res.status(201).json({
      profile: populated,
      credentials: { email: user.email, temporaryPassword: password ? null : userPassword }
    });
  } catch (error) {
    console.error('Create guru error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update a guru profile
router.put('/gurus/profiles/:id', adminAuth, async (req, res) => {
  try {
    const profile = await Guru.findById(req.params.id);
    if (!profile) {
      return res.status(404).json({ message: 'Guru profile not found' });
    }

    const fields = [
      'displayName', 'honorific', 'photo', 'bio', 'shortBio', 'lineage', 'sampradaya',
      'expertise', 'scriptures', 'languages', 'yearsOfStudy', 'currentPosition',
      'institution', 'location', 'website', 'tier', 'verificationStatus', 'isFeatured', 'notes'
    ];
    for (const f of fields) {
      if (req.body[f] !== undefined) profile[f] = req.body[f];
    }
    if (req.body.social) profile.social = { ...profile.social.toObject(), ...req.body.social };

    await profile.save();

    // Sync linked user role/tier
    if (req.body.tier) {
      const newRole = req.body.tier === 'acharya' ? 'acharya' : (req.body.tier === 'scholar' ? 'scholar' : 'guru');
      await User.findByIdAndUpdate(profile.user, { role: newRole, isApprovedGuru: true });
    }

    res.json(profile);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete a guru profile (and optionally the linked user)
router.delete('/gurus/profiles/:id', adminAuth, async (req, res) => {
  try {
    const { deleteUser = false } = req.body || {};
    const profile = await Guru.findById(req.params.id);
    if (!profile) {
      return res.status(404).json({ message: 'Guru profile not found' });
    }
    const userId = profile.user;
    await profile.deleteOne();
    if (deleteUser) {
      await User.findByIdAndDelete(userId);
    } else {
      await User.findByIdAndUpdate(userId, { role: 'user', isApprovedGuru: false, guruProfile: null });
    }
    res.json({ message: 'Guru profile deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Reset guru password
router.post('/gurus/profiles/:id/reset-password', adminAuth, async (req, res) => {
  try {
    const profile = await Guru.findById(req.params.id);
    if (!profile) return res.status(404).json({ message: 'Guru profile not found' });
    const newPassword = req.body.password || 'guru' + Math.random().toString(36).slice(2, 8);
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    await User.findByIdAndUpdate(profile.user, { password: hashedPassword });
    res.json({ message: 'Password reset', temporaryPassword: newPassword });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete content
router.delete('/content/:type/:id', adminAuth, async (req, res) => {
  try {
    const { type, id } = req.params;

    if (type === 'question') {
      await Question.findByIdAndDelete(id);
      await Answer.deleteMany({ question: id });
    } else if (type === 'answer') {
      await Answer.findByIdAndDelete(id);
    } else if (type === 'user') {
      await User.findByIdAndDelete(id);
    } else if (type === 'tag') {
      await Tag.findByIdAndDelete(id);
    }

    res.json({ message: 'Content deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get pending reports
router.get('/reports', adminAuth, async (req, res) => {
  try {
    // Placeholder for reports
    res.json({ reports: [] });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Update site settings
router.put('/settings', adminAuth, async (req, res) => {
  try {
    // Placeholder for settings
    res.json({ message: 'Settings updated' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get pending AI answers for verification
router.get('/ai-answers/pending', adminAuth, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;

    const answers = await Answer.find({ 
      isAIGenerated: true, 
      isVerifiedByAdmin: false 
    })
    .populate('author', 'name avatar')
    .populate({
      path: 'question',
      populate: { path: 'author', select: 'name avatar' }
    })
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(parseInt(limit));

    const total = await Answer.countDocuments({ 
      isAIGenerated: true, 
      isVerifiedByAdmin: false 
    });

    res.json({
      answers,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page)
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Verify AI answer
router.post('/ai-answers/:answerId/verify', adminAuth, async (req, res) => {
  try {
    const { note } = req.body;
    const answer = await Answer.findById(req.params.answerId);
    
    if (!answer) {
      return res.status(404).json({ message: 'Answer not found' });
    }

    if (!answer.isAIGenerated) {
      return res.status(400).json({ message: 'This is not an AI answer' });
    }

    answer.isVerifiedByAdmin = true;
    answer.adminVerifiedBy = req.user._id;
    answer.adminVerifiedAt = new Date();
    answer.adminNote = note || 'Verified by admin';
    await answer.save();

    res.json({ message: 'AI answer verified and now visible to all users' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Reject AI answer (hide it completely)
router.post('/ai-answers/:answerId/reject', adminAuth, async (req, res) => {
  try {
    const answer = await Answer.findById(req.params.answerId);
    
    if (!answer) {
      return res.status(404).json({ message: 'Answer not found' });
    }

    if (!answer.isAIGenerated) {
      return res.status(400).json({ message: 'This is not an AI answer' });
    }

    // Remove from question
    await Question.findByIdAndUpdate(answer.question, {
      $pull: { answers: answer._id }
    });

    await answer.deleteOne();

    res.json({ message: 'AI answer rejected and removed' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all AI answers (verified and pending)
router.get('/ai-answers/all', adminAuth, async (req, res) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    
    let query = { isAIGenerated: true };
    if (status === 'verified') query.isVerifiedByAdmin = true;
    if (status === 'pending') query.isVerifiedByAdmin = false;

    const answers = await Answer.find(query)
      .populate('author', 'name avatar')
      .populate({
        path: 'question',
        populate: { path: 'author', select: 'name avatar' }
      })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Answer.countDocuments(query);

    res.json({
      answers,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page)
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
