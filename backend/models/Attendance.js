const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    date: {
        type: Date,
        default: Date.now
    },
    status: {
        type: String,
        enum: ['Present', 'Absent', 'Late'],
        default: 'Present'
    }
});

module.exports = mongoose.model('Attendance', attendanceSchema);
