const mongoose = require('mongoose');

const engagementSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  sessionStart: {
    type: Date,
    default: Date.now
  },
  sessionEnd: {
    type: Date
  },
  activeDuration: {
    type: Number,
    default: 0
  },
  pageViews: [{
    page: String,
    timestamp: Date,
    duration: Number
  }],
  actions: [{
    type: String,
    timestamp: Date
  }],
  deviceInfo: {
    userAgent: String,
    platform: String
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Engagement', engagementSchema);