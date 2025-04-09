const Engagement = require('../models/Engagement');

const trackEngagement = async (req, res, next) => {
  try {
    // Skip tracking for non-authenticated routes
    if (!req.user) {
      return next();
    }

    const userId = req.user.userId;
    const currentTime = new Date();

    // Find or create active session
    let engagement = await Engagement.findOne({
      userId,
      sessionEnd: null
    });

    if (!engagement) {
      // Create new session
      engagement = new Engagement({
        userId,
        sessionStart: currentTime,
        deviceInfo: {
          userAgent: req.headers['user-agent'],
          platform: req.headers['sec-ch-ua-platform']
        }
      });
    }

    // Track page view
    engagement.pageViews.push({
      page: req.path,
      timestamp: currentTime
    });

    // Track action if specified in request
    if (req.body.action) {
      engagement.actions.push({
        type: req.body.action,
        timestamp: currentTime
      });
    }

    // Update active duration (in seconds)
    const sessionDuration = Math.floor((currentTime - engagement.sessionStart) / 1000);
    engagement.activeDuration = sessionDuration;

    await engagement.save();
    next();
  } catch (error) {
    console.error('Engagement tracking error:', error);
    next(); // Continue even if tracking fails
  }
};

module.exports = trackEngagement; 