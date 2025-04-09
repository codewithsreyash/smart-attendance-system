const express = require('express');
const router = express.Router();
const attendanceService = require('../services/attendanceService');

// Mark attendance
router.post('/mark', async (req, res) => {
    try {
        const result = await attendanceService.markAttendance(req.body);
        res.json(result);
    } catch (error) {
        console.error('Error marking attendance:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error marking attendance',
            error: error.message 
        });
    }
});

// Get attendance stats
router.get('/stats', async (req, res) => {
    try {
        const stats = await attendanceService.getAttendanceStats();
        res.json({
            success: true,
            data: stats
        });
    } catch (error) {
        console.error('Error getting attendance stats:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error getting attendance stats',
            error: error.message 
        });
    }
});

// Get user attendance
router.get('/user/:userId', async (req, res) => {
    try {
        const attendance = await attendanceService.getUserAttendance(req.params.userId);
        res.json({
            success: true,
            data: attendance
        });
    } catch (error) {
        console.error('Error getting user attendance:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error getting user attendance',
            error: error.message 
        });
    }
});

module.exports = router; 