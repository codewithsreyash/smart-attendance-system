import React, { useRef, useState } from "react";
import Webcam from "react-webcam";
import axios from "axios";

const Spinner = () => (
    <div className="spinner-border text-primary" role="status">
        <span className="sr-only">Loading...</span>
    </div>
);

const FaceAuth = () => {
    const webcamRef = useRef(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleFaceAuth = async () => {
        setLoading(true);
        setError(null);

        const imageSrc = webcamRef.current.getScreenshot();
        const blob = await fetch(imageSrc).then((res) => res.blob());
        const formData = new FormData();
        formData.append("image", blob, "face.jpg");

        try {
            const response = await axios.post(
                `${process.env.REACT_APP_API_URL}/verify`,
                formData,
                { headers: { "Content-Type": "multipart/form-data" } }
            );

            if (response.data.message) {
                setIsAuthenticated(true);
                console.log("Authenticated:", response.data.name);
            } else {
                setError("Authentication failed");
            }
        } catch (err) {
            if (err.response) {
                setError(`Error: ${err.response.data.message || "Verification failed"}`);
            } else if (err.request) {
                setError("Error: No response from server. Please try again later.");
            } else {
                setError(`Error: ${err.message}`);
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ textAlign: "center", marginTop: "50px" }}>
            <h1>Face Authentication</h1>
            <Webcam
                ref={webcamRef}
                screenshotFormat="image/jpeg"
                videoConstraints={{
                    width: 640,
                    height: 480,
                    facingMode: "user",
                }}
            />
            {isAuthenticated ? (
                <p>Authentication Successful! Welcome!</p>
            ) : (
                <>
                    <button onClick={handleFaceAuth} disabled={loading}>
                        {loading ? <Spinner /> : "Authenticate with Face"}
                    </button>
                    {error && (
                        <>
                            <p style={{ color: "red" }}>{error}</p>
                            <button onClick={() => setError(null)}>Retry</button>
                        </>
                    )}
                </>
            )}
        </div>
    );
};

export default FaceAuth;
