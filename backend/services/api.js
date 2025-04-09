// ... existing code ...
const api = axios.create({
    baseURL: baseURL,
    timeout: 30000, // Increased to 30 seconds to match Dashboard
    headers: {
      "Content-Type": "application/json",
    },
  });
  
  const faceApi = axios.create({
    baseURL: process.env.REACT_APP_FACE_API_URL || 'http://localhost:5001',
    timeout: 30000 // Added consistent timeout
  });
  // ... existing code ...
    