const mongoose = require('mongoose');

// Attendance Schema
const attendanceSchema = new mongoose.Schema({
    userId: { type: String, required: true },
    userName: { type: String, required: true },
    date: { type: Date, default: Date.now },
    status: { type: String, enum: ['present', 'absent'], default: 'present' },
    verificationMethod: { type: String, default: 'face' },
    confidence: { type: Number },
    timestamp: { type: Date, default: Date.now }
});

const Attendance = mongoose.model('Attendance', attendanceSchema);

class AttendanceService {
    async markAttendance(userData) {
        try {
            const { userId, userName, confidence } = userData;
            
            // Check if attendance already marked for today
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            
            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);
            
            const existingAttendance = await Attendance.findOne({
                userId,
                date: {
                    $gte: today,
                    $lt: tomorrow
                }
            });
            
            if (existingAttendance) {
                return {
                    success: false,
                    message: 'Attendance already marked for today',
                    data: existingAttendance
                };
            }
            
            // Create new attendance record
            const attendance = new Attendance({
                userId,
                userName,
                status: 'present',
                verificationMethod: 'face',
                confidence: parseFloat(confidence),
                timestamp: new Date()
            });
            
            await attendance.save();
            
            return {
                success: true,
                message: 'Attendance marked successfully',
                data: attendance
            };
        } catch (error) {
            console.error('Error marking attendance:', error);
            throw error;
        }
    }

    async getAttendanceStats() {
        try {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            
            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);
            
            // Get today's attendance
            const todayAttendance = await Attendance.find({
                date: {
                    $gte: today,
                    $lt: tomorrow
                }
            });
            
            // Get total unique users who have ever attended
            const totalUsers = await Attendance.distinct('userId');
            
            // Get attendance for the last 7 days
            const lastWeek = new Date(today);
            lastWeek.setDate(lastWeek.getDate() - 7);
            
            const weeklyAttendance = await Attendance.aggregate([
                {
                    $match: {
                        date: { $gte: lastWeek }
                    }
                },
                {
                    $group: {
                        _id: { $dateToString: { format: "%Y-%m-%d", date: "$date" } },
                        count: { $sum: 1 }
                    }
                },
                {
                    $sort: { _id: 1 }
                }
            ]);
            
            return {
                totalStudents: totalUsers.length,
                presentToday: todayAttendance.length,
                attendanceRate: totalUsers.length ? 
                    Math.round((todayAttendance.length / totalUsers.length) * 100) : 0,
                weeklyAttendance: weeklyAttendance
            };
        } catch (error) {
            console.error('Error getting attendance stats:', error);
            throw error;
        }
    }

    async getUserAttendance(userId) {
        try {
            const attendance = await Attendance.find({ userId })
                .sort({ date: -1 })
                .limit(30);
            
            return attendance;
        } catch (error) {
            console.error('Error getting user attendance:', error);
            throw error;
        }
    }
}

module.exports = new AttendanceService(); 