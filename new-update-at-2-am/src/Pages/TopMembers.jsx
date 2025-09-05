import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Container, 
  Paper, 
  Button,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Avatar,
  Divider,
  Tooltip,
  Alert
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../middleware/auth';
import api from '../services/api';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import VisibilityIcon from '@mui/icons-material/Visibility';

const TopMembers = () => {
  const [topMembers, setTopMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  
  // Get user info from middleware
  const { currentUserId, isImpersonating, userRole, isAdmin } = useAuth();

  useEffect(() => {
    if (currentUserId && isAdmin) {
      fetchTopMembers();
    } else if (currentUserId && !isAdmin) {
      // Redirect non-admin users
      navigate('/dashboard');
    }
  }, [currentUserId, isAdmin, navigate]);

  const fetchTopMembers = async () => {
    try {
      setLoading(true);
      setError(null);
      
      if (!currentUserId) {
        throw new Error('User ID not found. Please log in again.');
      }

      if (!isAdmin) {
        throw new Error('Access denied. Admin privileges required.');
      }

      const response = await api.get(`/api/members/top-members/admin`);

      if (response.data.success) {
        setTopMembers(response.data.topMembers || []);
      } else {
        throw new Error(response.data.message || 'Failed to fetch top members');
      }
    } catch (error) {
      console.error('Error fetching top members:', error);
      let errorMessage = 'Failed to fetch top members. Please try again later.';
      
      if (error.response?.status === 401 || error.response?.status === 403) {
        errorMessage = 'You are not authorized to view this data. Admin privileges required.';
      } else if (error.message === 'Network Error') {
        errorMessage = 'Network error. Please check your internet connection.';
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleViewMember = (memberId) => {
    navigate(`/dashboard/admin/user-profile-view/${memberId}`);
  };

  const handleViewAllMembers = () => {
    navigate('/dashboard/admin/all-members');
  };

  // Function to get medal color based on rank
  const getMedalColor = (index) => {
    switch (index) {
      case 0: return '#000000a2'; // Gold
      case 1: return '#000000a2'; // Silver
      case 2: return '#000000a2'; // Bronze
      case 3: return '#000000a2'; // Bronze
      case 4: return '#000000a2'; // Bronze
      default: return '#9e9e9e'; // Grey for others
    }
  };

  // If user is not admin, show access denied
  if (currentUserId && !isAdmin) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Paper elevation={3} sx={{ p: 3, borderRadius: 2 }}>
          <Typography variant="h5" align="center" gutterBottom>
            Access Denied
          </Typography>
          <Divider sx={{ mb: 3 }} />
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
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '300px' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Paper elevation={3} sx={{ p: 3, borderRadius: 2 }}>
          <Typography variant="h5" align="center" gutterBottom>
            Top Members
          </Typography>
          <Divider sx={{ mb: 3 }} />
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
          <Box sx={{ textAlign: 'center' }}>
            <Button 
              variant="outlined" 
              onClick={fetchTopMembers}
              sx={{ borderRadius: 2 }}
              color='primary.contrastText'
            >
              Retry
            </Button>
          </Box>
        </Paper>
      </Container>
    );
  }

  if (topMembers.length === 0) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Paper elevation={3} sx={{ p: 3, borderRadius: 2 }}>
          <Typography variant="h5" align="center" gutterBottom>
            Top Members
          </Typography>
          <Divider sx={{ mb: 3 }} />
          <Box sx={{ py: 3, textAlign: 'center' }}>
            <Typography variant="body1" color="text.secondary">
              No member data available yet.
            </Typography>
          </Box>
        </Paper>
      </Container>
    );
  }

  return (
    <Paper elevation={3} sx={{ p: 3, borderRadius: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Typography variant="h5" component="h2">
            Top 5 Co-op Members
          </Typography>
          {isImpersonating && (
            <Typography variant="caption" sx={{ ml: 2, color: 'warning.main' }}>
              (Admin Mode)
            </Typography>
          )}
        </Box>
        <Button 
          variant="outlined" 
          onClick={handleViewAllMembers}
          sx={{ borderRadius: 2 }}
          color='primary.contrastText'
        >
          View All
        </Button>
      </Box>
      
      <Divider sx={{ mb: 3 }} />
      
      <TableContainer component={Paper} elevation={0} maxWidth="xl" sx={{ minWidth: { xs: '100%', sm: '300px' } }}>
        <Table aria-label="top members table" sx={{ minWidth: { xs: '100%', sm: '300px' } }}>
          <TableHead>
            <TableRow>
              <TableCell>No.</TableCell>
              <TableCell>Member</TableCell>
              <TableCell>Business Name</TableCell>
              <TableCell align="center">
                <Tooltip title="Deals Committed">
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Typography variant="body2">Deals Committed</Typography>
                  </Box>
                </Tooltip>
              </TableCell>
              <TableCell align="center">
                <Tooltip title="Total Spent">
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <AttachMoneyIcon sx={{ mr: 0.5 }} />
                    <Typography variant="body2">Total Spent</Typography>
                  </Box>
                </Tooltip>
              </TableCell>
              <TableCell align="center">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {topMembers.map((member, index) => (
              <TableRow 
                key={member._id}
                sx={{ 
                  '&:last-child td, &:last-child th': { border: 0 },
                  backgroundColor: index % 2 === 0 ? 'rgba(0, 0, 0, 0.02)' : 'inherit',
                  '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.04)' }
                }}
              >
                <TableCell>
                  <Box 
                    sx={{ 
                      bgcolor: getMedalColor(index), 
                      color: 'white',
                      width: 30,
                      height: 30,
                      borderRadius: '50%',
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      fontWeight: 'bold'
                    }}
                  >
                    {index + 1}
                  </Box>
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Avatar 
                      sx={{ 
                        width: 40, 
                        height: 40, 
                        mr: 2,
                        bgcolor: 'primary.main',
                        border: `2px solid ${getMedalColor(index)}`,
                        color:'primary.contrastText'
                      }}
                    >
                      {member.logo ? (
                        <img 
                          src={member.logo} 
                          alt={member.name} 
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      ) : (
                        member.name.charAt(0)
                      )}
                    </Avatar>
                    <Typography variant="body1">{member.name}</Typography>
                  </Box>
                </TableCell>
                <TableCell>{member.businessName || 'Individual Member'}</TableCell>
                <TableCell align="center">{member.stats?.totalCommitments || 0}</TableCell>
                <TableCell align="center">${(member.stats?.totalSpent || 0).toFixed(2)}</TableCell>
                <TableCell align="center">
                  <Button
                    variant="contained"
                    size="small"
                    startIcon={<VisibilityIcon color='primary.contrastText'/>}
                    onClick={() => handleViewMember(member._id)}
                    sx={{ borderRadius: 2 }}
                  >
                    View
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
};

export default TopMembers;
