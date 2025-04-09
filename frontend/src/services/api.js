import axios from "axios";

// Set up base URL from environment variable or default to localhost
const baseURL = process.env.REACT_APP_API_URL || "http://localhost:5001/api";

if (!process.env.REACT_APP_API_URL) {
  console.warn("REACT_APP_API_URL environment variable is not set. Using default baseURL:", baseURL);
}

// Create an Axios instance
const api = axios.create({
  baseURL: baseURL,
  timeout: 30000,
  headers: {
    "Content-Type": "application/json"
  }
});

// Create Face API instance - using the same baseURL as the main API
const faceApi = axios.create({
  baseURL: baseURL, // Use the same baseURL as the main API
  timeout: 15000,
  headers: {
    "Content-Type": "multipart/form-data"
  }
});

// Add request interceptor for auth token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Add response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error("API Error:", error.response || error.request || error.message);
    // Optionally handle specific error responses here
    return Promise.reject(error);
  }
);

// 🟢 Register User
export const registerUser = async (userData) => {
  try {
    const response = await api.post("/register", userData);
    return response.data;
  } catch (error) {
    console.error("Register Error:", error);
    throw error; // Rethrow to handle in the component
  }
};

// 🟢 Login User
export const loginUser = async (credentials) => {
  try {
    const response = await api.post("/login", credentials);
    return response.data;
  } catch (error) {
    console.error("Login Error:", error);
    throw error; // Rethrow to handle in the component
  }
};

// 🟢 Fetch User Profile
export const getUserProfile = async () => {
  try {
    const response = await api.get("/user");
    return response.data;
  } catch (error) {
    console.error("Profile Error:", error);
    throw error; // Rethrow to handle in the component
  }
};

// 🟢 Fetch Attendance Data
export const fetchAttendanceData = async () => {
  try {
    const response = await api.get("/attendance");
    return response.data;
  } catch (error) {
    console.error("Fetch Attendance Error:", error);
    throw error; // Rethrow to handle in the component
  }
};

// 🟢 Face Authentication
export const faceAuth = async (imageData) => {
  try {
    // Create a FormData object
    const formData = new FormData();
    
    // Convert base64 to blob
    const base64Data = imageData.split(',')[1];
    const blob = await fetch(`data:image/jpeg;base64,${base64Data}`).then(res => res.blob());
    
    // Append the blob to FormData
    formData.append("image", blob, "face.jpg");
    
    // Make the API call
    const response = await faceApi.post("/encode", formData);
    return response.data;
  } catch (error) {
    console.error("Face Authentication Error:", error);
    throw error;
  }
};

// 🟢 Mark Attendance
export const markAttendance = async (userId) => {
  try {
    const response = await api.post("/markAttendance", { userId });
    return response.data;
  } catch (error) {
    console.error("Mark Attendance Error:", error);
    throw error;
  }
};

// 🟢 Track Engagement
export const trackEngagement = async (engagementData) => {
  try {
    const response = await api.post("/engagement", engagementData);
    return response.data;
  } catch (error) {
    console.error("Track Engagement Error:", error);
    // Don't throw error for engagement tracking to avoid disrupting user experience
    return { success: false };
  }
};

export default api;