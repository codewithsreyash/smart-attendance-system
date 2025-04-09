import { useCallback, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import axios from 'axios';

const useEngagement = () => {
  const location = useLocation();

  const trackPageView = useCallback(async (pageName) => {
    try {
      // TODO: Replace with actual API call
      console.log('Page view tracked:', pageName);
      // Example API call:
      // await axios.post('/api/analytics/page-view', { pageName });
    } catch (error) {
      console.error('Error tracking page view:', error);
    }
  }, []);

  const trackAction = useCallback(async (actionName, metadata = {}) => {
    try {
      // TODO: Replace with actual API call
      console.log('Action tracked:', actionName, metadata);
      // Example API call:
      // await axios.post('/api/analytics/action', { actionName, metadata });
    } catch (error) {
      console.error('Error tracking action:', error);
    }
  }, []);

  const endSession = useCallback(async () => {
    try {
      console.log('Session ended');
      // Example API call:
      // await axios.post('/api/analytics/end-session');
    } catch (error) {
      console.error('Error ending session:', error);
    }
  }, []);

  // Track page views on route changes
  useEffect(() => {
    const page = location.pathname.replace('/', '') || 'home';
    trackPageView(page);
  }, [location, trackPageView]);

  // Handle session end on component unmount
  useEffect(() => {
    return () => {
      endSession();
    };
  }, [endSession]);

  return {
    trackPageView,
    trackAction
  };
};

export default useEngagement; 