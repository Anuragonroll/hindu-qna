const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Comment = require('../models/Comment');
const Question = require('../models/Question');
const Answer = require('../models/Answer');
const User = require('../models/User');
const { auth } = require('../middleware/auth');
const { evaluateAndAward } = require('../utils/badges');

// Create comment on question
router.post('/question/:questionId', auth, [
  body('body').trim().isLength({ min: 1, max: 500 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const question = await Question.findById(req.params.questionId);
    if (!question) {
      return res.status(404).json({ message: 'Question not found' });
    }

    const comment = new Comment({
      body: req.body.body,
      author: req.user._id,
      post: question._id,
      postModel: 'Question'
    });

    await comment.save();

    question.comments.push(comment._id);
    await question.save();

    const populatedComment = await Comment.findById(comment._id)
      .populate('author', 'name avatar');

    try { await evaluateAndAward(req.user); } catch (e) { console.error('Badge eval failed:', e.message); }

    res.status(201).json(populatedComment);
  } catch (error) {
    console.error('Comment create (question) error:', error);
    res.status(500).json({ message: 'Server error', detail: error.message });
  }
});

// Reply to a comment (nested)
router.post('/:commentId/reply', auth, [
  body('body').trim().isLength({ min: 1, max: 500 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    const parent = await Comment.findById(req.params.commentId);
    if (!parent) return res.status(404).json({ message: 'Parent comment not found' });

    const reply = new Comment({
      body: req.body.body,
      author: req.user._id,
      post: parent.post,
      postModel: parent.postModel,
      parent: parent._id
    });
    await reply.save();
    parent.replies = parent.replies || [];
    parent.replies.push(reply._id);
    await parent.save();

    const populated = await Comment.findById(reply._id).populate('author', 'name avatar');
    res.status(201).json(populated);
  } catch (error) {
    console.error('Comment reply error:', error);
    res.status(500).json({ message: 'Server error', detail: error.message });
  }
});

// Create comment on answer
router.post('/answer/:answerId', auth, [
  body('body').trim().isLength({ min: 1, max: 500 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const answer = await Answer.findById(req.params.answerId);
    if (!answer) {
      return res.status(404).json({ message: 'Answer not found' });
    }

    const comment = new Comment({
      body: req.body.body,
      author: req.user._id,
      post: answer._id,
      postModel: 'Answer'
    });

    await comment.save();

    answer.comments.push(comment._id);
    await answer.save();

    const populatedComment = await Comment.findById(comment._id)
      .populate('author', 'name avatar');

    try { await evaluateAndAward(req.user); } catch (e) { console.error('Badge eval failed:', e.message); }

    res.status(201).json(populatedComment);
  } catch (error) {
    console.error('Comment create (answer) error:', error);
    res.status(500).json({ message: 'Server error', detail: error.message });
  }
});

// Like / unlike a comment
router.post('/:id/like', auth, async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);
    if (!comment) return res.status(404).json({ message: 'Comment not found' });
    const uid = req.user._id.toString();
    const idx = (comment.likes || []).map(id => id.toString()).indexOf(uid);
    if (idx === -1) {
      comment.likes = comment.likes || [];
      comment.likes.push(req.user._id);
    } else {
      comment.likes.splice(idx, 1);
    }
    await comment.save();
    // Re-evaluate badges for the comment author
    try {
      const author = await User.findById(comment.author);
      if (author) await evaluateAndAward(author);
    } catch (e) { console.error('Badge eval after like failed:', e.message); }
    res.json({ likes: comment.likes.length, liked: idx === -1 });
  } catch (error) {
    console.error('Comment like error:', error);
    res.status(500).json({ message: 'Server error', detail: error.message });
  }
});

// Delete comment
router.delete('/:id', auth, async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);

    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    if (comment.author.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    // Remove from parent post
    if (comment.postModel === 'Question') {
      await Question.findByIdAndUpdate(comment.post, {
        $pull: { comments: comment._id }
      });
    } else {
      await Answer.findByIdAndUpdate(comment.post, {
        $pull: { comments: comment._id }
      });
    }

    // Remove from parent comment if it was a reply
    if (comment.parent) {
      await Comment.findByIdAndUpdate(comment.parent, {
        $pull: { replies: comment._id }
      });
    }

    await comment.deleteOne();
    res.json({ message: 'Comment deleted' });
  } catch (error) {
    console.error('Comment delete error:', error);
    res.status(500).json({ message: 'Server error', detail: error.message });
  }
});

// Vote on comment
router.post('/:id/vote', auth, async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);

    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    const upvoteIndex = comment.upvotes.indexOf(req.user._id);

    if (upvoteIndex === -1) {
      comment.upvotes.push(req.user._id);
    } else {
      comment.upvotes.splice(upvoteIndex, 1);
    }

    await comment.save();
    res.json({ upvotes: comment.upvotes.length });
  } catch (error) {
    console.error('Comment vote error:', error);
    res.status(500).json({ message: 'Server error', detail: error.message });
  }
});

module.exports = router;

