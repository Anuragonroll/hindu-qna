const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
  body: {
    type: String,
    required: true,
    maxlength: 500
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  post: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    refPath: 'postModel'
  },
  postModel: {
    type: String,
    required: true,
    enum: ['Question', 'Answer']
  },
  upvotes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  badge: {
    type: String,
    enum: ['insightful', 'helpful', 'scriptural', 'clarification', 'verified'],
    default: null
  },
  badgedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  badgedAt: Date,
  badgeNote: {
    type: String,
    default: ''
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Comment', commentSchema);
