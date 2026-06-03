const express = require('express');
const router = express.Router();
const Answer = require('../models/Answer');
const Question = require('../models/Question');
const User = require('../models/User');

// GET /api/home/recent-activity — recent answers, recent questions, top users
router.get('/recent-activity', async (req, res) => {
  try {
    const [recentAnswers, recentQuestions, topUsers] = await Promise.all([
      // 5 most recent answers with author name + question title
      Answer.find()
        .populate('author', 'name avatar reputation')
        .populate('question', 'title')
        .sort({ createdAt: -1 })
        .limit(5)
        .lean(),

      // 5 most recent questions
      Question.find()
        .populate('author', 'name avatar reputation')
        .populate('tags', 'name')
        .sort({ createdAt: -1 })
        .limit(5)
        .lean(),

      // Top 5 users by reputation
      User.find()
        .select('name avatar reputation role')
        .sort({ reputation: -1 })
        .limit(5)
        .lean(),
    ]);

    res.json({
      recentAnswers,
      recentQuestions,
      topUsers,
    });
  } catch (err) {
    console.error('Home activity error:', err.message);
    res.status(500).json({ message: 'Failed to load activity' });
  }
});

module.exports = router;
