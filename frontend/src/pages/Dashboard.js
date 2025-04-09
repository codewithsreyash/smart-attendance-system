import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Grid,
  Paper,
  Typography,
  Box,
  Button,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow
} from '@mui/material';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import useEngagement from '../hooks/useEngagement';
import EngagementAnalytics from '../components/EngagementAnalytics';
import axios from 'axios';
import './Dashboard.css';

const Dashboard = () => {
  const navigate = useNavigate();
  const { trackPageView, trackAction } = useEngagement();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalStudents: 0,
    presentToday: 0,
    attendanceRate: 0,
    weeklyAttendance: []
  });
  const [recentAttendance, setRecentAttendance] = useState([]);

    useEffect(() => {
    trackPageView('dashboard');
    loadDashboardData();
  }, [trackPageView]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/attendance/stats`);
      
      if (response.data.success) {
        setStats(response.data.data);
        
        // Format weekly attendance data for the chart
        const chartData = response.data.data.weeklyAttendance.map(day => ({
          date: day._id,
          attendance: day.count
        }));
        setRecentAttendance(chartData);
            }
        } catch (error) {
      console.error('Error loading dashboard data:', error);
        } finally {
      setLoading(false);
        }
    };

  const handleFaceAuth = () => {
    trackAction('face_auth_initiated');
    navigate('/face-auth');
    };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <CircularProgress sx={{ color: '#ff6b6b' }} />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" className="dashboard-container">
      <Box className="dashboard-header">
        <Typography variant="h4" component="h1">
          Dashboard
        </Typography>
        <Button
          variant="contained"
          color="primary"
          onClick={handleFaceAuth}
          className="face-auth-button"
        >
          Start Face Authentication
        </Button>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Paper className="stat-card">
            <Typography variant="h6">Total Students</Typography>
            <Typography variant="h3">{stats.totalStudents}</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper className="stat-card">
            <Typography variant="h6">Present Today</Typography>
            <Typography variant="h3">{stats.presentToday}</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper className="stat-card">
            <Typography variant="h6">Attendance Rate</Typography>
            <Typography variant="h3">{stats.attendanceRate}%</Typography>
          </Paper>
        </Grid>

        <Grid item xs={12}>
          <Paper className="analytics-container">
            <Typography variant="h6" gutterBottom>
              Weekly Attendance Trend
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={recentAttendance}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line 
                  type="monotone" 
                  dataKey="attendance" 
                  stroke="#ff6b6b" 
                  strokeWidth={2}
                  dot={{ fill: '#ff6b6b' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        <Grid item xs={12}>
          <Paper className="analytics-container">
            <EngagementAnalytics />
          </Paper>
        </Grid>
      </Grid>
    </Container>
    );
};

export default Dashboard;
