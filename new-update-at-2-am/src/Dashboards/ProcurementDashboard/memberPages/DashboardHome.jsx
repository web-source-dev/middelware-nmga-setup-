import React, { useEffect, useState } from 'react';
import axios from 'axios';
import {
  Grid,
  Paper,
  Typography,
  Box,
  CircularProgress,
  Card,
  CardContent,
  Skeleton,
  Alert,
  Snackbar,
} from '@mui/material';
import { 
  TrendingUp as TrendingUpIcon,
  Favorite as FavoriteIcon,
  ShoppingCart as ShoppingCartIcon,
  History as HistoryIcon
} from '@mui/icons-material';

const DashboardHomeSkeleton = () => (
  <Box>
    <Grid container spacing={3}>
      {/* Stats Cards */}
      {[...Array(4)].map((_, index) => (
        <Grid item xs={12} sm={6} md={3} key={index}>
          <Paper sx={{ p: 2 }}>
            <Skeleton variant="circular" width={40} height={40} />
            <Skeleton variant="text" sx={{ fontSize: '1.5rem', mt: 1 }} />
            <Skeleton variant="text" width="60%" />
          </Paper>
        </Grid>
      ))}

      {/* Charts */}
      <Grid item xs={12} md={8}>
        <Paper sx={{ p: 2 }}>
          <Skeleton variant="text" sx={{ fontSize: '1.5rem', mb: 2 }} />
          <Skeleton variant="rectangular" height={300} />
        </Paper>
      </Grid>

      {/* Recent Activity */}
      <Grid item xs={12} md={4}>
        <Paper sx={{ p: 2 }}>
          <Skeleton variant="text" sx={{ fontSize: '1.5rem', mb: 2 }} />
          {[...Array(5)].map((_, index) => (
            <Box key={index} sx={{ mb: 2 }}>
              <Skeleton variant="text" />
              <Skeleton variant="text" width="60%" />
            </Box>
          ))}
        </Paper>
      </Grid>
    </Grid>
  </Box>
);

const DashboardHome = ({ userId }) => {
  const [data, setData] = useState({
    totalCommitments: 0,
    totalSpent: 0,
    favoriteDeals: 0,
    activeCommitments: 0,
    recentActivity: [],
    loading: true,
  });
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  useEffect(() => {
    fetchDashboardData();
  }, [userId]);

  const fetchDashboardData = async () => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/member/stats/${userId}`);
      setData({
        ...response.data,
        loading: false,
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setData(prev => ({ ...prev, loading: false }));
      setSnackbar({
        open: true,
        message: 'Error loading dashboard data',
        severity: 'error'
      });
    }
  };

  if (data.loading) {
    return <DashboardHomeSkeleton />;
  }

  return (
    <Box sx={{ flexGrow: 1 }}>
      <Typography variant="h4" gutterBottom>
        Welcome to Your Dashboard
      </Typography>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ display: 'flex', alignItems: 'center', p: 2, backgroundColor: '#e3f2fd' }}>
            <TrendingUpIcon sx={{ fontSize: 40, color: '#1976d2', mr: 2 }} />
            <Box>
              <Typography variant="h6">Total Spent</Typography>
              <Typography variant="h5">${data.totalSpent.toLocaleString()}</Typography>
            </Box>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ display: 'flex', alignItems: 'center', p: 2, backgroundColor: '#fce4ec' }}>
            <FavoriteIcon sx={{ fontSize: 40, color: '#d32f2f', mr: 2 }} />
            <Box>
              <Typography variant="h6">Favorite Deals</Typography>
              <Typography variant="h5">{data.favoriteDeals}</Typography>
            </Box>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ display: 'flex', alignItems: 'center', p: 2, backgroundColor: '#e8f5e9' }}>
            <ShoppingCartIcon sx={{ fontSize: 40, color: '#388e3c', mr: 2 }} />
            <Box>
              <Typography variant="h6">Total Commitments</Typography>
              <Typography variant="h5">{data.totalCommitments}</Typography>
            </Box>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ display: 'flex', alignItems: 'center', p: 2, backgroundColor: '#fff3e0' }}>
            <HistoryIcon sx={{ fontSize: 40, color: '#f57c00', mr: 2 }} />
            <Box>
              <Typography variant="h6">Active Commitments</Typography>
              <Typography variant="h5">{data.activeCommitments}</Typography>
            </Box>
          </Card>
        </Grid>
      </Grid>

      <Paper sx={{ p: 3 }}>
        <Typography variant="h5" gutterBottom>
          Recent Activity
        </Typography>
        {data.recentActivity.length > 0 ? (
          data.recentActivity.map((activity, index) => (
            <Box
              key={index}
              sx={{
                p: 2,
                mb: 1,
                borderRadius: 1,
                backgroundColor: '#f5f5f5',
                '&:last-child': { mb: 0 }
              }}
            >
              <Typography variant="body1">
                {activity.description}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {new Date(activity.timestamp).toLocaleString()}
              </Typography>
            </Box>
          ))
        ) : (
          <Typography variant="body1" color="text.secondary">
            No recent activity to display
          </Typography>
        )}
      </Paper>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert 
          onClose={() => setSnackbar({ ...snackbar, open: false })} 
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default DashboardHome; 