import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import Webcam from 'react-webcam';
import './Dashboard.css';
import api from '../services/api';

const Dashboard = () => {
    const webcamRef = useRef(null); 
    const [attendanceData, setAttendanceData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({ present: 0, absent: 0, late: 0, total: 0 });
    const [authStatus, setAuthStatus] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchAttendance = async () => {
            setLoading(true);
            try {
                const response = await api.get('/attendance');
                setAttendanceData(response.data || []); // Ensure it's an array
                const present = response.data.filter(item => item.status === 'Present').length;
                const absent = response.data.filter(item => item.status === 'Absent').length;
                const late = response.data.filter(item => item.status === 'Late').length;
                setStats({ present, absent, late, total: response.data.length });
            } catch (error) {
                console.error("Error fetching attendance:", error);
                setError("Failed to fetch attendance data.");
            } finally {
                setLoading(false);
            }
        };

        fetchAttendance();
    }, []);

    const handleFaceAuth = async () => {
        setLoading(true);
        setError(null);

        if (!webcamRef.current) {
            setError("Webcam is not available.");
            setLoading(false);
            return;
        }

        const imageSrc = webcamRef.current.getScreenshot();
        if (!imageSrc) {
            setError("Failed to capture image from webcam.");
            setLoading(false);
            return;
        }

        const blob = await fetch(imageSrc).then(res => res.blob());
        const formData = new FormData();
        formData.append("image", blob, "face.jpg");

        try {
            const response = await api.post("/encode", formData, {
                headers: { "Content-Type": "multipart/form-data" }
            });

            if (response.data?.encoding) { // Use optional chaining
                setAuthStatus("✅ Face Authentication Successful!");
            } else {
                setAuthStatus("❌ Face Not Recognized.");
            }
        } catch (err) {
            if (err.response) {
                setError(`Face authentication error: ${err.response.data.message || "Verification failed"}`);
            } else if (err.request) {
                setError("Error: No response from server. Please try again later.");
            } else {
                setError(`Error processing face authentication: ${err.message}`);
            }
        } finally {
            setLoading(false);
        }
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
                    <div className="stat-card"><h3>Present</h3><p>{stats.present}</p></div>
                    <div className="stat-card"><h3>Absent</h3><p>{stats.absent}</p></div>
                    <div className="stat-card"><h3>Late</h3><p>{stats.late}</p></div>
                    <div className="stat-card"><h3>Total</h3><p>{stats.total}</p></div>
                </div>

                <div className="face-auth-container">
                    <h2>Face Authentication</h2>
                    <Webcam ref={webcamRef} screenshotFormat="image/jpeg" />
                    <button onClick={handleFaceAuth} disabled={loading}>
                        {loading ? 'Authenticating...' : 'Authenticate'}
                    </button>
                    {authStatus && <p>{authStatus}</p>}
                    {error && <p style={{ color: "red" }}>{error}</p>}
                </div>

                <div className="attendance-table-container">
                    <h2>Today's Attendance</h2>
                    {loading ? (
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
                                    <tr key={record.id} className={`status-${record.status.toLowerCase()}`}>
                                        <td>{record.id}</td>
                                        <td>{record.name}</td>
                                        <td>{record.date}</td>
                                        <td>{record.time}</td>
                                        <td>{record.status}</td>
                                        <td>
                                            {/* Add Edit and Delete functionality here */}
                                            <button className="action-btn edit">Edit</button>
                                            <button className="action-btn delete">Delete</button>
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
        </div>
    );
};

export default Dashboard;

