import React, { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import Webcam from "react-webcam";
import axios from "axios";

const Spinner = () => (
    <div className="spinner-border text-primary" role="status">
        <span className="sr-only">Loading...</span>
    </div>
);

const FaceAuth = () => {
    const navigate = useNavigate();
    const webcamRef = useRef(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [isRegistering, setIsRegistering] = useState(false);
    const [name, setName] = useState("");
    const [successMessage, setSuccessMessage] = useState("");

    const captureImage = async () => {
        if (!webcamRef.current) {
            throw new Error("Webcam is not available");
        }

        const imageSrc = webcamRef.current.getScreenshot();
        if (!imageSrc) {
            throw new Error("Failed to capture image from webcam");
        }

        // Convert base64 to blob
        const base64Data = imageSrc.split(',')[1];
        const blob = await fetch(`data:image/jpeg;base64,${base64Data}`).then((res) => res.blob());
        const formData = new FormData();
        formData.append("image", blob, "face.jpg");
        return formData;
    };

    const markAttendance = async (userId, userName, confidence) => {
        try {
            const response = await axios.post(
                `${process.env.REACT_APP_API_URL}/attendance/mark`,
                {
                    userId,
                    userName,
                    confidence
                }
            );

            if (response.data.success) {
                setSuccessMessage(prev => `${prev}\nAttendance marked successfully!`);
            } else {
                setSuccessMessage(prev => `${prev}\n${response.data.message}`);
            }
        } catch (error) {
            console.error("Error marking attendance:", error);
            setError("Failed to mark attendance. Please try again.");
        }
    };

    const handleFaceAuth = async () => {
        setLoading(true);
        setError(null);
        setSuccessMessage("");

        try {
            const formData = await captureImage();
            const faceServiceUrl = process.env.REACT_APP_FACE_SERVICE_URL || 'http://localhost:5001';

            // Make request to face recognition service
            const response = await axios.post(
                `${faceServiceUrl}/encode`,
                formData,
                {
                    headers: { 
                        'Content-Type': 'multipart/form-data'
                    },
                    timeout: 30000
                }
            );

            if (response.data?.success) {
                setIsAuthenticated(true);
                setSuccessMessage(response.data.message);
                
                // Mark attendance
                await markAttendance(
                    response.data.name,  // Using name as userId for simplicity
                    response.data.name,
                    response.data.confidence
                );

                // Redirect to dashboard after 2 seconds
                setTimeout(() => {
                    navigate('/dashboard');
                }, 2000);
            } else if (response.data?.message?.includes("register")) {
                setError("Face not recognized. Would you like to register?");
                setIsRegistering(true);
            } else {
                setError(response.data?.message || "Authentication failed");
            }
        } catch (err) {
            console.error("Face Authentication Error:", err);
            if (err.response?.data?.error) {
                setError(`Error: ${err.response.data.error}`);
            } else if (err.code === 'ECONNABORTED') {
                setError("Error: Request timed out. Please try again.");
            } else if (err.code === 'ERR_NETWORK') {
                setError("Error: Cannot connect to the server. Please check if the face recognition service is running.");
            } else {
                setError(`Error: ${err.message || "An unexpected error occurred"}`);
            }
        } finally {
            setLoading(false);
        }
    };

    const handleRegister = async () => {
        if (!name.trim()) {
            setError("Please enter your name");
            return;
        }

        setLoading(true);
        setError(null);
        setSuccessMessage("");

        try {
            const formData = await captureImage();
            formData.append("name", name.trim());
            const faceServiceUrl = process.env.REACT_APP_FACE_SERVICE_URL || 'http://localhost:5001';

            const response = await axios.post(
                `${faceServiceUrl}/register`,
                formData,
                {
                    headers: { 
                        'Content-Type': 'multipart/form-data'
                    },
                    timeout: 30000
                }
            );

            if (response.data?.success) {
                setSuccessMessage(response.data.message);
                setIsRegistering(false);
                setName("");
            } else {
                setError(response.data?.message || "Registration failed");
            }
        } catch (err) {
            console.error("Face Registration Error:", err);
            if (err.response?.data?.error) {
                setError(`Error: ${err.response.data.error}`);
            } else if (err.code === 'ECONNABORTED') {
                setError("Error: Request timed out. Please try again.");
            } else if (err.code === 'ERR_NETWORK') {
                setError("Error: Cannot connect to the server. Please check if the face recognition service is running.");
            } else {
                setError(`Error: ${err.message || "An unexpected error occurred"}`);
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ textAlign: "center", marginTop: "50px" }}>
            <h1>Face Authentication</h1>
            <div style={{ maxWidth: "640px", margin: "0 auto" }}>
                <Webcam
                    ref={webcamRef}
                    screenshotFormat="image/jpeg"
                    videoConstraints={{
                        width: 640,
                        height: 480,
                        facingMode: "user",
                    }}
                    style={{ width: "100%", height: "auto" }}
                />
            </div>
            
            {successMessage && (
                <div className="success-message" style={{ marginTop: "20px", color: "green" }}>
                    {successMessage.split('\n').map((msg, i) => (
                        <p key={i}>✅ {msg}</p>
                    ))}
                </div>
            )}

            {!isAuthenticated && (
                <div className="auth-controls" style={{ marginTop: "20px" }}>
                    {isRegistering ? (
                        <div className="register-form" style={{ marginTop: "20px" }}>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Enter your name"
                                style={{
                                    padding: '8px',
                                    marginRight: '10px',
                                    borderRadius: '5px',
                                    border: '1px solid #ccc'
                                }}
                            />
                            <button 
                                onClick={handleRegister}
                                disabled={loading}
                                style={{
                                    padding: '10px 20px',
                                    backgroundColor: loading ? '#ccc' : '#28a745',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '5px',
                                    cursor: loading ? 'not-allowed' : 'pointer'
                                }}
                            >
                                {loading ? <Spinner /> : "Register"}
                            </button>
                            <button 
                                onClick={() => {
                                    setIsRegistering(false);
                                    setError(null);
                                }}
                                style={{
                                    padding: '10px 20px',
                                    marginLeft: '10px',
                                    backgroundColor: '#6c757d',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '5px',
                                    cursor: 'pointer'
                                }}
                            >
                                Cancel
                            </button>
                        </div>
                    ) : (
                        <button 
                            onClick={handleFaceAuth}
                            disabled={loading}
                            style={{
                                padding: '10px 20px',
                                margin: '10px',
                                backgroundColor: loading ? '#ccc' : '#007bff',
                                color: 'white',
                                border: 'none',
                                borderRadius: '5px',
                                cursor: loading ? 'not-allowed' : 'pointer'
                            }}
                        >
                            {loading ? <Spinner /> : "Authenticate"}
                        </button>
                    )}
                    
                    {error && (
                        <div className="error-message" style={{ marginTop: "10px" }}>
                            <p style={{ color: "red" }}>{error}</p>
                            {!isRegistering && (
                                <button 
                                    onClick={() => setError(null)}
                                    style={{
                                        padding: '8px 16px',
                                        backgroundColor: '#dc3545',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '5px',
                                        cursor: 'pointer'
                                    }}
                                >
                                    Retry
                                </button>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default FaceAuth;
