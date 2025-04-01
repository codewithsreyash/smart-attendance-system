const mongoose = require('mongoose');

const engagementSchema = new mongoose.Schema({
  faceAuthAttempts: Number,
  tableInteractions: Number,
  statCardViews: [Number],
  lastInteraction: Date,
  sessionStart: Date,
  activeDuration: Number,
  timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Engagement', engagementSchema);