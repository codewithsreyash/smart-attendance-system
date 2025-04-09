import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import Webcam from 'react-webcam';
import './Dashboard.css';
import api, { faceAuth, markAttendance } from '../services/api';

const Dashboard = () => {
    const webcamRef = useRef(null);
    const [attendanceData, setAttendanceData] = useState([]);
    const [loading, setLoading] = useState({
        attendance: false,
        faceAuth: false
    });
    const [stats, setStats] = useState({ present: 0, absent: 0, late: 0, total: 0 });
    const [authStatus, setAuthStatus] = useState({
        isAuthenticated: false,
        error: null
    });
    const [notification, setNotification] = useState({
        open: false,
        message: '',
        severity: 'info'
    });
    
    // Engagement tracking state
    const [engagementData, setEngagementData] = useState({
        faceAuthAttempts: 0,
        tableInteractions: 0,
        statCardViews: Array(4).fill(0),
        lastInteraction: null,
        sessionStart: new Date(),
        activeDuration: 0
    });

    // Track active time
    useEffect(() => {
        const timer = setInterval(() => {
            setEngagementData(prev => ({
                ...prev,
                activeDuration: prev.activeDuration + 1
            }));
        }, 1000);

        return () => clearInterval(timer);
    }, []);

    const trackInteraction = (interactionType, additionalData = {}) => {
        setEngagementData(prev => {
            let updated = { ...prev, lastInteraction: new Date() };
            
            switch(interactionType) {
                case 'FACE_AUTH':
                    updated.faceAuthAttempts += 1;
                    break;
                case 'STAT_CARD_VIEW':
                    updated.statCardViews = updated.statCardViews.map((count, index) => 
                        index === additionalData.index ? count + 1 : count
                    );
                    break;
                case 'TABLE_INTERACTION':
                    updated.tableInteractions += 1;
                    break;
                default:
                    break;
            }
            
            return updated;
        });
    };

    // Send engagement data periodically
    useEffect(() => {
        const sendEngagementData = async () => {
            try {
                await api.post('/engagement', engagementData);
            } catch (err) {
                console.error('Error sending engagement data:', err);
            }
        };

        const interval = setInterval(sendEngagementData, 60000); // Every 60 seconds
        return () => clearInterval(interval);
    }, [engagementData]);

    useEffect(() => {
        loadAttendanceData();
        
        return () => {
            if (webcamRef.current) {
                const stream = webcamRef.current.stream;
                if (stream) {
                    stream.getTracks().forEach(track => track.stop());
                }
            }
        };
    }, []);

    const loadAttendanceData = async () => {
        try {
            setLoading(prev => ({ ...prev, attendance: true }));
            const response = await api.get('/attendance');
            setAttendanceData(response.data || []);
            const present = response.data.filter(item => item.status === 'Present').length;
            const absent = response.data.filter(item => item.status === 'Absent').length;
            const late = response.data.filter(item => item.status === 'Late').length;
            setStats({ present, absent, late, total: response.data.length });
            
            // Track initial stats view
            trackInteraction('STAT_CARD_VIEW', { index: 0 });
            trackInteraction('STAT_CARD_VIEW', { index: 1 });
            trackInteraction('STAT_CARD_VIEW', { index: 2 });
            trackInteraction('STAT_CARD_VIEW', { index: 3 });
        } catch (error) {
            console.error("Error fetching attendance:", error);
            setNotification({
                open: true,
                message: 'Failed to load attendance data',
                severity: 'error'
            });
        } finally {
            setLoading(prev => ({ ...prev, attendance: false }));
        }
    };

    const handleFaceAuth = async () => {
        if (!webcamRef.current) return;

        try {
            setLoading(prev => ({ ...prev, faceAuth: true }));
            setAuthStatus({ isAuthenticated: false, error: null });
            trackInteraction('FACE_AUTH');

            const imageSrc = webcamRef.current.getScreenshot();
            if (!imageSrc) {
                throw new Error('Failed to capture image from webcam');
            }

            const response = await faceAuth(imageSrc);
            
            if (response.success) {
                setAuthStatus({ isAuthenticated: true, error: null });
                await markAttendance(response.userId);
                await loadAttendanceData();
                setNotification({
                    open: true,
                    message: 'Attendance marked successfully!',
                    severity: 'success'
                });
            } else {
                throw new Error(response.message || 'Face authentication failed');
            }
        } catch (error) {
            console.error("Face Authentication Error:", error);
            setAuthStatus({ 
                isAuthenticated: false, 
                error: error.response?.data?.message || error.message || 'Face authentication failed'
            });
            setNotification({
                open: true,
                message: error.response?.data?.message || error.message || 'Face authentication failed',
                severity: 'error'
            });
        } finally {
            setLoading(prev => ({ ...prev, faceAuth: false }));
        }
    };

    const handleTableInteraction = () => {
        trackInteraction('TABLE_INTERACTION');
    };

    const handleCloseNotification = () => {
        setNotification(prev => ({ ...prev, open: false }));
    };

    return (
        <div className="dashboard-container">
            <header className="dashboard-header">
                <h1>Smart Attendance System</h1>
                <div className="user-actions">
                    <span>Admin User</span>
                    <Link to="/login" className="logout-btn">Logout</Link>
                </div>
            </header>

            <div className="dashboard-content">
                <div className="stats-container">
                    {['present', 'absent', 'late', 'total'].map((stat, index) => (
                        <div 
                            key={stat}
                            className="stat-card"
                            onMouseEnter={() => trackInteraction('STAT_CARD_VIEW', { index })}
                        >
                            <h3>{stat.charAt(0).toUpperCase() + stat.slice(1)}</h3>
                            <p>{stats[stat]}</p>
                        </div>
                    ))}
                </div>

                <div className="face-auth-container">
                    <h2>Face Authentication</h2>
                    <Webcam ref={webcamRef} screenshotFormat="image/jpeg" />
                    <button onClick={handleFaceAuth} disabled={loading.faceAuth}>
                        {loading.faceAuth ? 'Authenticating...' : 'Authenticate'}
                    </button>
                    {authStatus.isAuthenticated && <p>Face Authentication Successful!</p>}
                    {authStatus.error && <p style={{ color: "red" }}>{authStatus.error}</p>}
                </div>

                <div className="attendance-table-container" onClick={handleTableInteraction}>
                    <h2>Today's Attendance</h2>
                    {loading.attendance ? (
                        <p>Loading attendance data...</p>
                    ) : attendanceData.length > 0 ? (
                        <table className="attendance-table">
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Name</th>
                                    <th>Date</th>
                                    <th>Time</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {attendanceData.map((record) => (
                                    <tr key={`${record.name}-${record.date}`} className={`status-${record.status.toLowerCase()}`}>
                                        <td>{record._id}</td>
                                        <td>{record.name}</td>
                                        <td>{new Date(record.date).toLocaleDateString()}</td>
                                        <td>{new Date(record.date).toLocaleTimeString()}</td>
                                        <td>{record.status}</td>
                                        <td>
                                            <button 
                                                className="action-btn edit"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    trackInteraction('TABLE_INTERACTION');
                                                }}
                                            >
                                                Edit
                                            </button>
                                            <button 
                                                className="action-btn delete"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    trackInteraction('TABLE_INTERACTION');
                                                }}
                                            >
                                                Delete
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <p>No attendance data available.</p>
                    )}
                </div>
            </div>

            {notification.open && (
                <div className={`notification ${notification.severity}`}>
                    {notification.message}
                    <button onClick={handleCloseNotification}>×</button>
                </div>
            )}
        </div>
    );
};

export default Dashboard;
