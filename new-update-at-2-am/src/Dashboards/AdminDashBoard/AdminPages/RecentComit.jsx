import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  CircularProgress,
  Grid,
  Skeleton,
  Alert,
  Button,
  Container
} from '@mui/material';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../middleware/auth';
import api from '../../../services/api';
import { TableSkeleton } from '../../../Components/Skeletons/LoadingSkeletons';

const RecentComit = () => {
  const [value, setValue] = useState(0);
  const [recentData, setRecentData] = useState({ recentDeals: [], recentCommitments: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  
  // Get user info from middleware
  const { currentUserId, isImpersonating, userRole, isAdmin } = useAuth();

  useEffect(() => {
    if (currentUserId && isAdmin) {
      fetchRecentData();
    } else if (currentUserId && !isAdmin) {
      // Redirect non-admin users
      navigate('/dashboard');
    }
  }, [currentUserId, isAdmin, navigate]);

  const fetchRecentData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      if (!currentUserId) {
        throw new Error('User ID not found. Please log in again.');
      }

      if (!isAdmin) {
        throw new Error('Access denied. Admin privileges required.');
      }

      const response = await api.get('/deals/get/recent');
      
      if (response.data.success) {
        setRecentData(response.data);
      } else {
        throw new Error(response.data.message || 'Failed to fetch recent data');
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Error fetching recent data:', error);
      let errorMessage = 'Failed to fetch recent data. Please try again.';
      
      if (error.response?.status === 401 || error.response?.status === 403) {
        errorMessage = 'You are not authorized to view this data. Admin privileges required.';
      } else if (error.message === 'Network Error') {
        errorMessage = 'Network error. Please check your internet connection.';
      }
      
      setError(errorMessage);
      setLoading(false);
    }
  };

  const handleTabChange = (event, newValue) => {
    setValue(newValue);
  };

  const getStatusColor = (status) => {
    const colors = {
      active: 'success',
      inactive: 'error',
      pending: 'warning',
      approved: 'success',
      declined: 'error',
      cancelled: 'default'
    };
    return colors[status] || 'default';
  };

  // If user is not admin, show access denied
  if (currentUserId && !isAdmin) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Paper elevation={3} sx={{ p: 3, borderRadius: 2 }}>
          <Typography variant="h5" align="center" gutterBottom>
            Access Denied
          </Typography>
          <Alert severity="error" sx={{ mb: 2 }}>
            You do not have permission to view this page. Admin privileges required.
          </Alert>
          <Box sx={{ textAlign: 'center' }}>
            <Button 
              variant="outlined" 
              onClick={() => navigate('/dashboard')}
              sx={{ borderRadius: 2 }}
              color='primary.contrastText'
            >
              Go to Dashboard
            </Button>
          </Box>
        </Paper>
      </Container>
    );
  }

  if (loading) {
    return (
      <Paper sx={{ p: 2 }}>
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <Skeleton variant="text" sx={{ fontSize: '1.5rem', mb: 2 }} />
            <TableSkeleton columnsNum={5} rowsNum={3} />
          </Grid>
        </Grid>
      </Paper>
    );
  }

  if (error) {
    return (
      <Paper sx={{ p: 2 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Button 
          variant="outlined" 
          onClick={fetchRecentData}
          sx={{ borderRadius: 2 }}
          color='primary.contrastText'
        >
          Retry
        </Button>
      </Paper>
    );
  }

  return (
    <Paper sx={{ width: '100%', p: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h5" gutterBottom>
          Recent Activity
        </Typography>
        {isImpersonating && (
          <Typography variant="caption" sx={{ color: 'warning.main' }}>
            (Admin Mode)
          </Typography>
        )}
      </Box>

      <Grid container spacing={2}>
        {/* Left side - Deals Table */}
        <Grid item xs={12} md={6}>
          <Typography variant="h6" gutterBottom>Recent Deals</Typography>
          <TableContainer component={Paper} sx={{ maxHeight: 400 }}>
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell>Deal Name</TableCell>
                  <TableCell>Distributor</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Date</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {recentData.recentDeals && recentData.recentDeals.length > 0 ? (
                  recentData.recentDeals.map((deal) => (
                    <TableRow key={deal._id}>
                      <TableCell>{deal.name}</TableCell>
                      <TableCell>
                        {deal.distributor?.businessName || deal.distributor?.name}
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={deal.status} 
                          color={getStatusColor(deal.status)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        {format(new Date(deal.createdAt), 'MMM dd, yyyy')}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} align="center">
                      <Typography variant="body2" color="text.secondary">
                        No recent deals found
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Grid>

        {/* Right side - Commitments Table */}
        <Grid item xs={12} md={6}>
          <Typography variant="h6" gutterBottom>Recent Commitments</Typography>
          <TableContainer component={Paper} sx={{ maxHeight: 400 }}>
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell>Deal Name</TableCell>
                  <TableCell>User</TableCell>
                  <TableCell>Quantity</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Date</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {recentData.recentCommitments && recentData.recentCommitments.length > 0 ? (
                  recentData.recentCommitments.map((commitment) => (
                    <TableRow key={commitment._id}>
                      <TableCell>{commitment.dealId?.name}</TableCell>
                      <TableCell>
                        {commitment.userId?.businessName || commitment.userId?.name}
                      </TableCell>
                      <TableCell>
                        {commitment.sizeCommitments && commitment.sizeCommitments.length > 0 ? (
                          <Box>
                            <Typography variant="body2" fontWeight="medium">
                              Total: {commitment.sizeCommitments.reduce((sum, item) => sum + item.quantity, 0)}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {commitment.sizeCommitments.slice(0, 2).map((sc, idx) => (
                                <span key={idx}>
                                  {sc.size}: {sc.quantity}{idx < Math.min(commitment.sizeCommitments.length - 1, 1) ? ', ' : ''}
                                </span>
                              ))}
                              {commitment.sizeCommitments.length > 2 && ` +${commitment.sizeCommitments.length - 2} more`}
                            </Typography>
                          </Box>
                        ) : (
                          commitment.quantity
                        )}
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={commitment.status} 
                          color={getStatusColor(commitment.status)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        {format(new Date(commitment.createdAt), 'MMM dd, yyyy')}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} align="center">
                      <Typography variant="body2" color="text.secondary">
                        No recent commitments found
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Grid>
      </Grid>
    </Paper>
  );
};

export default RecentComit;
