import React, { useState, useEffect } from 'react';
import { getEngagementData } from '../services/engagement';
import {
  Card,
  CardContent,
  Typography,
  Grid,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  Divider,
  Box
} from '@mui/material';

const EngagementAnalytics = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [analytics, setAnalytics] = useState({
    totalSessions: 0,
    avgDuration: 0,
    recentSessions: []
  });

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      const data = await getEngagementData();
      
      // Calculate analytics
      const totalSessions = data.length;
      const totalDuration = data.reduce((sum, session) => sum + (session.activeDuration || 0), 0);
      const avgDuration = totalSessions > 0 ? Math.round(totalDuration / totalSessions) : 0;
      
      setAnalytics({
        totalSessions,
        avgDuration,
        recentSessions: data.slice(0, 5) // Get last 5 sessions
      });
    } catch (err) {
      setError('Failed to load engagement data');
      console.error('Error loading analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;
    
    return `${hours}h ${minutes}m ${remainingSeconds}s`;
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress sx={{ color: '#ff6b6b' }} />
      </Box>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent>
          <Typography color="error">{error}</Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Engagement Analytics
        </Typography>
        
        <Grid container spacing={3}>
          <Grid item xs={6}>
            <Typography variant="subtitle1">Total Sessions</Typography>
            <Typography variant="h4">{analytics.totalSessions}</Typography>
          </Grid>
          
          <Grid item xs={6}>
            <Typography variant="subtitle1">Average Duration</Typography>
            <Typography variant="h4">{formatDuration(analytics.avgDuration)}</Typography>
          </Grid>
        </Grid>

        <Typography variant="h6" sx={{ mt: 3, mb: 2 }}>
          Recent Sessions
        </Typography>
        
        <List>
          {analytics.recentSessions.map((session, index) => (
            <React.Fragment key={session._id}>
              <ListItem>
                <ListItemText
                  primary={`Session ${index + 1}`}
                  secondary={
                    <>
                      <Typography component="span" variant="body2" display="block">
                        Duration: {formatDuration(session.activeDuration)}
                      </Typography>
                      <Typography component="span" variant="body2" display="block">
                        Pages: {session.pageViews.length}
                      </Typography>
                      <Typography component="span" variant="body2" display="block">
                        Actions: {session.actions.length}
                      </Typography>
                    </>
                  }
                />
              </ListItem>
              {index < analytics.recentSessions.length - 1 && <Divider />}
            </React.Fragment>
          ))}
        </List>
      </CardContent>
    </Card>
  );
};

export default EngagementAnalytics; 