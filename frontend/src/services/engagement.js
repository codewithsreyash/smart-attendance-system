import axios from 'axios';

const baseURL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Create an Axios instance with auth token
const api = axios.create({
  baseURL: `${baseURL}/engagement`,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add request interceptor for auth token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Track user action
export const trackAction = async (action) => {
  try {
    const response = await api.post('/track-action', { action });
    return response.data;
  } catch (error) {
    console.error('Error tracking action:', error);
    // Don't throw error to prevent disrupting user experience
    return null;
  }
};

// End user session
export const endSession = async () => {
  try {
    const response = await api.post('/end-session');
    return response.data;
  } catch (error) {
    console.error('Error ending session:', error);
    return null;
  }
};

// Get user engagement data
export const getEngagementData = async () => {
  try {
    const response = await api.get('/my-engagement');
    return response.data;
  } catch (error) {
    console.error('Error fetching engagement data:', error);
    return [];
  }
};

// Track page view (called on route changes)
export const trackPageView = async (page) => {
  try {
    await trackAction(`VIEW_${page.toUpperCase()}`);
  } catch (error) {
    console.error('Error tracking page view:', error);
  }
}; 