const mongoose = require('mongoose');

const guruSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
    index: true
  },
  displayName: {
    type: String,
    required: true,
    trim: true
  },
  honorific: {
    type: String,
    default: '',
    trim: true
  },
  photo: {
    type: String,
    default: ''
  },
  bio: {
    type: String,
    default: ''
  },
  shortBio: {
    type: String,
    maxlength: 280,
    default: ''
  },
  lineage: {
    type: String,
    default: ''
  },
  sampradaya: {
    type: String,
    default: '',
    trim: true
  },
  expertise: [{
    type: String,
    trim: true
  }],
  scriptures: [{
    type: String,
    trim: true
  }],
  languages: [{
    type: String,
    trim: true
  }],
  yearsOfStudy: {
    type: Number,
    default: 0
  },
  currentPosition: {
    type: String,
    default: ''
  },
  institution: {
    type: String,
    default: ''
  },
  location: {
    type: String,
    default: ''
  },
  website: {
    type: String,
    default: ''
  },
  social: {
    twitter: { type: String, default: '' },
    youtube: { type: String, default: '' },
    wikipedia: { type: String, default: '' }
  },
  tier: {
    type: String,
    enum: ['scholar', 'guru', 'acharya'],
    default: 'guru'
  },
  verificationStatus: {
    type: String,
    enum: ['pending', 'verified', 'suspended'],
    default: 'verified'
  },
  verifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  verifiedAt: {
    type: Date,
    default: Date.now
  },
  notes: {
    type: String,
    default: ''
  },
  stats: {
    answersPosted: { type: Number, default: 0 },
    answersVerified: { type: Number, default: 0 },
    questionsModerated: { type: Number, default: 0 },
    commentsBadged: { type: Number, default: 0 }
  },
  isFeatured: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

guruSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

guruSchema.index({ tier: 1, verificationStatus: 1 });
guruSchema.index({ expertise: 1 });
guruSchema.index({ sampradaya: 1 });

module.exports = mongoose.model('Guru', guruSchema);
