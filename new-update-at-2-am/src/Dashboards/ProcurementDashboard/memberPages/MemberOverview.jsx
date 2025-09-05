import React, { useEffect, useState } from 'react';
import api from '../../../services/api';
import {
  Card,
  CardContent,
  Typography,
  Grid,
  Box,
  CircularProgress,
  Paper,
  Skeleton,
} from '@mui/material';
import { 
  ShoppingCart as ShoppingCartIcon,
  Favorite as FavoriteIcon,
  Timeline as TimelineIcon,
  AttachMoney as MoneyIcon,
  ThumbDown as ThumbDownIcon,
  Cancel as CancelIcon
} from '@mui/icons-material';

const OverviewSkeleton = () => (
  <Box>
    <Grid container spacing={3}>
      {[...Array(4)].map((_, index) => (
        <Grid item xs={12} sm={6} md={3} key={index}>
          <Paper sx={{ p: 2 }}>
            <Skeleton variant="circular" width={40} height={40} />
            <Skeleton variant="text" sx={{ fontSize: '1.5rem', mt: 1 }} />
            <Skeleton variant="text" width="60%" />
          </Paper>
        </Grid>
      ))}
      <Grid item xs={12}>
        <Paper sx={{ p: 2 }}>
          <Skeleton variant="text" sx={{ fontSize: '1.5rem', mb: 2 }} />
          {[...Array(5)].map((_, index) => (
            <Box key={index} sx={{ display: 'flex', mb: 2 }}>
              <Skeleton variant="circular" width={32} height={32} sx={{ mr: 2 }} />
              <Box sx={{ flex: 1 }}>
                <Skeleton variant="text" />
                <Skeleton variant="text" width="60%" />
              </Box>
            </Box>
          ))}
        </Paper>
      </Grid>
    </Grid>
  </Box>
);

const MemberOverview = () => {
  const [stats, setStats] = useState({
    totalCommitments: 0,
    totalSpent: 0,
    activeCommitments: 0,
    totalApproved: 0,
    totalDeclined: 0,
    totalCancelled: 0,
    recentActivity: [],
    loading: true,
  });

  useEffect(() => {
    const fetchMemberStats = async () => {
      try {
        const response = await api.get('/member/stats');
        setStats({
          ...response.data,
          loading: false,
        });
      } catch (error) {
        console.error('Error fetching member stats:', error);
        setStats(prev => ({ ...prev, loading: false }));
      }
    };

    fetchMemberStats();
  }, []);

  if (stats.loading) {
    return <OverviewSkeleton />;
  }

  const StatCard = ({ title, value, icon, color }) => (
    <Card sx={{ height: '100%', backgroundColor: `${color}10` }}>
      <CardContent>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Typography variant="h6" component="div" color="text.secondary">
            {title}
          </Typography>
          {React.createElement(icon, { sx: { color: color, fontSize: 40 } })}
        </Box>
        <Typography variant="h4" component="div" sx={{ mt: 2, color: color }}>
          {value}
        </Typography>
      </CardContent>
    </Card>
  );

  return (
    <Box sx={{ flexGrow: 1 }}>
      <Typography variant="h4" gutterBottom>
        Member Overview
      </Typography>
      
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Commitments"
            value={stats.totalCommitments}
            icon={ShoppingCartIcon}
            color="#1976d2"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Spent"
            value={`$${stats.totalSpent.toLocaleString()}`}
            icon={MoneyIcon}
            color="#2e7d32"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Active Commitments"
            value={stats.activeCommitments}
            icon={TimelineIcon}
            color="#ed6c02"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Approved"
            value={stats.totalApproved}
            icon={ShoppingCartIcon}
            color="#4caf50"
          />
        </Grid>
      </Grid>

      <Paper sx={{ p: 3 }}>
        <Typography variant="h5" gutterBottom>
          Recent Activity
        </Typography>
        {stats.recentActivity.length > 0 ? (
          stats.recentActivity.map((activity, index) => (
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
    </Box>
  );
};

export default MemberOverview;