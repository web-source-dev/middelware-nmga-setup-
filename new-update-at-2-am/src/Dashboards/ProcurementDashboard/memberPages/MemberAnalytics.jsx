import React, { useEffect, useState } from 'react';
import api from '../../../services/api';
import { useAuth } from '../../../middleware/auth';
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
  Button,
} from '@mui/material';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
} from 'recharts';
import {
  TrendingUp,
  Category,
  SaveAlt,
  Timeline,
  MonetizationOn,
  FileDownload,
  FilterList,
  Search,
  DateRange,
  Inbox as InboxIcon,
} from '@mui/icons-material';
import { AnalyticsSkeleton } from '../../../Components/Skeletons/LoadingSkeletons';

const MemberAnalytics = () => {
  const { currentUserId, isImpersonating } = useAuth();
  const [analytics, setAnalytics] = useState({
    spendingTrends: [],
    categoryDistribution: [],
    commitmentStatus: [],
    monthlyActivity: [],
    loading: true,
  });
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const response = await api.get('/member/analytics');
      setAnalytics({
        ...response.data,
        loading: false,
      });
    } catch (error) {
      console.error('Error fetching analytics:', error);
      setAnalytics(prev => ({ ...prev, loading: false }));
      setSnackbar({
        open: true,
        message: 'Error loading analytics data',
        severity: 'error'
      });
    }
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <Paper sx={{ p: 2 }}>
          <Typography variant="body2">{label}</Typography>
          {payload.map((entry, index) => (
            <Typography key={index} variant="body2" color={entry.color}>
              {entry.name}: ${entry.value.toLocaleString()}
            </Typography>
          ))}
        </Paper>
      );
    }
    return null;
  };

  const LoadingSkeleton = () => (
    <Box sx={{ width: '100%' }}>
      <Skeleton variant="text" sx={{ fontSize: '2rem', mb: 2 }} />
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Skeleton variant="rectangular" height={300} />
          </Paper>
        </Grid>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Skeleton variant="rectangular" height={300} />
          </Paper>
        </Grid>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Skeleton variant="rectangular" height={300} />
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );

  // Check if there's any data to display
  const hasData = analytics.spendingTrends.length > 0 || 
                  analytics.categoryDistribution.length > 0 || 
                  analytics.commitmentStatus.length > 0 || 
                  analytics.monthlyActivity.length > 0;

  // Check if there are any approved commitments
  const hasApprovedCommitments = analytics.commitmentStatus.some(status => 
    status.status === 'approved' && status.value > 0
  );

  if (analytics.loading) {
    return <AnalyticsSkeleton />;
  }

  // Show empty state if no data at all
  if (!hasData) {
    return (
      <Box sx={{ flexGrow: 1 }}>
        <Typography variant="h4" gutterBottom>
          Analytics & Insights
        </Typography>
        
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <InboxIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No Analytics Data Available
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            You haven't made any commitments yet. Start exploring deals and making commitments to see your analytics and insights.
          </Typography>
          <Button 
            variant="contained" 
            color="primary"
            onClick={() => window.location.href = '/deals-catlog'}
          >
            Explore Deals
          </Button>
        </Paper>
      </Box>
    );
  }

  return (
    <Box sx={{ flexGrow: 1 }}>
      <Typography variant="h4" gutterBottom>
        Analytics & Insights
      </Typography>

      <Grid container spacing={3}>
        {/* Spending Trends */}
        <Grid item xs={12} mb={2}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Spending Trends
            </Typography>
            {analytics.spendingTrends.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={analytics.spendingTrends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="amount"
                    stroke="#8884d8"
                    name="Spending Amount"
                    strokeWidth={2}
                    dot={{ r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="savings"
                    stroke="#82ca9d"
                    name="Savings"
                    strokeWidth={2}
                    dot={{ r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <InboxIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  No Spending Data
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  No approved commitments found. Your spending trends will appear here once you have approved commitments.
                </Typography>
              </Box>
            )}
          </Paper>
        </Grid>

        {/* Category Distribution */}
        <Grid item xs={12} md={6} mb={8}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" gutterBottom>
              Category Distribution
            </Typography>
            {analytics.categoryDistribution.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={analytics.categoryDistribution}
                    dataKey="value"
                    nameKey="category"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {analytics.categoryDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Category sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  No Category Data
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Category distribution will appear here once you have approved commitments across different categories.
                </Typography>
              </Box>
            )}
          </Paper>
        </Grid>

        {/* Monthly Activity */}
        <Grid item xs={12} md={6} mb={8}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" gutterBottom>
              Monthly Activity
            </Typography>
            {analytics.monthlyActivity.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={analytics.monthlyActivity}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="commitments" fill="#8884d8" name="Commitments" />
                  <Bar dataKey="favorites" fill="#82ca9d" name="Favorites" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Timeline sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  No Activity Data
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Monthly activity will appear here once you start making commitments and adding favorites.
                </Typography>
              </Box>
            )}
          </Paper>
        </Grid>

        {/* Commitment Status */}
        <Grid item xs={12} mb={2}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Commitment Status Distribution
            </Typography>
            {analytics.commitmentStatus.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={analytics.commitmentStatus}
                    dataKey="value"
                    nameKey="status"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    {analytics.commitmentStatus.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <InboxIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  No Commitments Yet
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Commitment status distribution will appear here once you start making commitments.
                </Typography>
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>

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

export default MemberAnalytics; 