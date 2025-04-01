import axios from "axios";

// Set up base URL from environment variable or default to localhost
const baseURL = process.env.REACT_APP_API_URL || "http://localhost:5000/api";

if (!process.env.REACT_APP_API_URL) {
  console.warn("REACT_APP_API_URL environment variable is not set. Using default baseURL:", baseURL);
}

// Create an Axios instance
const api = axios.create({
  baseURL: baseURL,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
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
export const faceAuth = async (formData) => {
  try {
    const response = await api.post("/encode", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  } catch (error) {
    console.error("Face Authentication Error:", error);
    throw error; // Rethrow to handle in the component
  }
};

export default api;

