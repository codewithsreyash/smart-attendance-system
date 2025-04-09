const express = require('express');
const router = express.Router();
const Engagement = require('../models/Engagement');
const auth = require('../middlewares/auth');

// Get user's engagement data
router.get('/my-engagement', auth, async (req, res) => {
  try {
    const engagements = await Engagement.find({ userId: req.user.userId })
      .sort({ sessionStart: -1 })
      .limit(10);
    
    res.json(engagements);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching engagement data' });
  }
});

// End current session
router.post('/end-session', auth, async (req, res) => {
  try {
    const engagement = await Engagement.findOne({
      userId: req.user.userId,
      sessionEnd: null
    });

    if (engagement) {
      engagement.sessionEnd = new Date();
      const sessionDuration = Math.floor((engagement.sessionEnd - engagement.sessionStart) / 1000);
      engagement.activeDuration = sessionDuration;
      await engagement.save();
    }

    res.json({ message: 'Session ended successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error ending session' });
  }
});

// Track specific action
router.post('/track-action', auth, async (req, res) => {
  try {
    const { action } = req.body;
    if (!action) {
      return res.status(400).json({ message: 'Action type is required' });
    }

    const engagement = await Engagement.findOne({
      userId: req.user.userId,
      sessionEnd: null
    });

    if (engagement) {
      engagement.actions.push({
        type: action,
        timestamp: new Date()
      });
      await engagement.save();
    }

    res.json({ message: 'Action tracked successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error tracking action' });
  }
});

module.exports = router; 