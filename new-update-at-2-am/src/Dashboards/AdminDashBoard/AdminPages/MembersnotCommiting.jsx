import React, { useState, useEffect } from 'react';
import { 
  Paper, 
  Typography, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow, 
  Button, 
  Box, 
  Alert, 
  Snackbar, 
  CircularProgress, 
  Chip, 
  Tooltip, 
  Dialog, 
  DialogActions, 
  DialogContent, 
  DialogContentText, 
  DialogTitle,
  Card,
  CardContent,
  Grid,
  TablePagination,
  TextField,
  InputAdornment,
  IconButton,
  Tabs,
  Tab,
  Divider,
  Badge,
  Container
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import BlockIcon from '@mui/icons-material/Block';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import PersonOffIcon from '@mui/icons-material/PersonOff';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import NewReleasesIcon from '@mui/icons-material/NewReleases';
import RefreshIcon from '@mui/icons-material/Refresh';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PersonIcon from '@mui/icons-material/Person';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../middleware/auth';
import api from '../../../services/api';

const MembersnotCommiting = () => {
  const [members, setMembers] = useState([]);
  const [inactiveMembers, setInactiveMembers] = useState([]);
  const [error, setError] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [confirmDialog, setConfirmDialog] = useState({ open: false, userId: null, userName: '', action: '' });
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredMembers, setFilteredMembers] = useState([]);
  const [activeTab, setActiveTab] = useState('all');
  const [statistics, setStatistics] = useState({
    total: 0,
    neverCommitted: 0,
    recentInactive: 0,
    mediumTermInactive: 0,
    longTermInactive: 0,
    inactiveMembers: 0
  });
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Get user info from middleware
  const { currentUserId, isImpersonating, userRole, isAdmin } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (currentUserId && isAdmin) {
      fetchInactiveMembers();
      fetchBlockedMembers();
    } else if (currentUserId && !isAdmin) {
      // Redirect non-admin users
      navigate('/dashboard');
    }
  }, [currentUserId, isAdmin, navigate]);

  // Fetch inactive members (not committing)
  const fetchInactiveMembers = async () => {
    try {
      setError(null);
      
      if (!currentUserId) {
        throw new Error('User ID not found. Please log in again.');
      }

      if (!isAdmin) {
        throw new Error('Access denied. Admin privileges required.');
      }

      const response = await api.get('/api/inactive/not-committing/admin');
      
      if (response.data.success) {
        setMembers(response.data.inactiveMembers);
        setFilteredMembers(response.data.inactiveMembers);
        setStatistics(prev => ({
          ...prev,
          total: response.data.inactiveMembers.length,
          neverCommitted: response.data.inactiveMembers.filter(m => !m.lastCommitmentDate).length,
          recentInactive: response.data.inactiveMembers.filter(m => m.lastCommitmentDate && m.inactiveDays <= 60).length,
          mediumTermInactive: response.data.inactiveMembers.filter(m => m.lastCommitmentDate && m.inactiveDays > 60 && m.inactiveDays <= 90).length,
          longTermInactive: response.data.inactiveMembers.filter(m => m.lastCommitmentDate && m.inactiveDays > 90).length
        }));
      } else {
        throw new Error(response.data.message || 'Failed to fetch inactive members');
      }
    } catch (err) {
      console.error('Error fetching inactive members:', err);
      let errorMessage = 'An error occurred while fetching inactive members';
      
      if (err.response?.status === 401 || err.response?.status === 403) {
        errorMessage = 'You are not authorized to view this data. Admin privileges required.';
      } else if (err.message === 'Network Error') {
        errorMessage = 'Network error. Please check your internet connection.';
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
    }
  };

  // Fetch blocked/inactive members
  const fetchBlockedMembers = async () => {
    try {
      const response = await api.get('/api/inactive/blocked-members/admin');
      
      if (response.data.success) {
        setInactiveMembers(response.data.blockedMembers);
        setStatistics(prev => ({
          ...prev,
          inactiveMembers: response.data.blockedMembers.length
        }));
      }
    } catch (err) {
      console.error('Error fetching blocked members:', err);
    }
  };

  // Refresh data
  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchInactiveMembers();
    fetchBlockedMembers();
  };

  // Filter members based on search query and active tab
  useEffect(() => {
    let filtered = [];
    
    if (activeTab === 'blocked') {
      filtered = [...inactiveMembers];
    } else {
      filtered = [...members];
      
      // First filter by tab
      if (activeTab === 'never_committed') {
        filtered = filtered.filter(member => !member.lastCommitmentDate);
      } else if (activeTab === 'recent') {
        filtered = filtered.filter(member => 
          member.lastCommitmentDate && member.inactiveDays <= 60);
      } else if (activeTab === 'medium') {
        filtered = filtered.filter(member => 
          member.lastCommitmentDate && member.inactiveDays > 60 && member.inactiveDays <= 90);
      } else if (activeTab === 'long_term') {
        filtered = filtered.filter(member => 
          member.lastCommitmentDate && member.inactiveDays > 90);
      }
    }
    
    // Then filter by search query
    if (searchQuery.trim() !== '') {
      const lowercaseQuery = searchQuery.toLowerCase();
      filtered = filtered.filter(member => 
        member.name?.toLowerCase().includes(lowercaseQuery) ||
        member.email?.toLowerCase().includes(lowercaseQuery) ||
        member.businessName?.toLowerCase().includes(lowercaseQuery) ||
        member.phone?.includes(searchQuery)
      );
    }
    
    setFilteredMembers(filtered);
  }, [searchQuery, members, inactiveMembers, activeTab]);

  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
    setPage(0);
  };

  // Inactivate a member
  const handleInactivateMember = async (userId) => {
    try {
      if (!currentUserId) {
        throw new Error('User ID not found. Please log in again.');
      }

      if (!isAdmin) {
        throw new Error('Access denied. Admin privileges required.');
      }

      const response = await api.put(`/api/inactive/inactivate/${userId}/admin`);
      
      if (response.data.success) {
        // Update local state to remove inactivated member
        setMembers(prevMembers => prevMembers.filter(member => member._id !== userId));
        setFilteredMembers(prevFiltered => prevFiltered.filter(member => member._id !== userId));
        
        // Update statistics
        setStatistics(prev => ({
          ...prev,
          total: prev.total - 1,
          neverCommitted: members.find(m => m._id === userId && !m.lastCommitmentDate) 
            ? prev.neverCommitted - 1 
            : prev.neverCommitted,
          recentInactive: members.find(m => m._id === userId && m.lastCommitmentDate && m.inactiveDays <= 60) 
            ? prev.recentInactive - 1 
            : prev.recentInactive,
          mediumTermInactive: members.find(m => m._id === userId && m.lastCommitmentDate && m.inactiveDays > 60 && m.inactiveDays <= 90) 
            ? prev.mediumTermInactive - 1 
            : prev.mediumTermInactive,
          longTermInactive: members.find(m => m._id === userId && m.lastCommitmentDate && m.inactiveDays > 90) 
            ? prev.longTermInactive - 1 
            : prev.longTermInactive
        }));
        
        // Refresh blocked members list
        fetchBlockedMembers();
        
        setSnackbar({
          open: true,
          message: 'Member inactivated successfully',
          severity: 'success'
        });
      } else {
        throw new Error(response.data.message || 'Failed to inactivate member');
      }
    } catch (err) {
      console.error('Error inactivating member:', err);
      let errorMessage = 'An error occurred while inactivating the member';
      
      if (err.response?.status === 401 || err.response?.status === 403) {
        errorMessage = 'You are not authorized to perform this action. Admin privileges required.';
      } else if (err.message === 'Network Error') {
        errorMessage = 'Network error. Please check your internet connection.';
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setSnackbar({
        open: true,
        message: errorMessage,
        severity: 'error'
      });
    }
    setConfirmDialog({ ...confirmDialog, open: false });
  };

  // Reactivate a member
  const handleReactivateMember = async (userId) => {
    try {
      if (!currentUserId) {
        throw new Error('User ID not found. Please log in again.');
      }

      if (!isAdmin) {
        throw new Error('Access denied. Admin privileges required.');
      }

      const response = await api.put(`/api/inactive/reactivate/${userId}/admin`);
      
      if (response.data.success) {
        // Update local state to remove reactivated member from blocked list
        setInactiveMembers(prevMembers => prevMembers.filter(member => member._id !== userId));
        setFilteredMembers(prevFiltered => prevFiltered.filter(member => member._id !== userId));
        
        // Update statistics
        setStatistics(prev => ({
          ...prev,
          inactiveMembers: prev.inactiveMembers - 1
        }));
        
        setSnackbar({
          open: true,
          message: 'Member reactivated successfully',
          severity: 'success'
        });
      } else {
        throw new Error(response.data.message || 'Failed to reactivate member');
      }
    } catch (err) {
      console.error('Error reactivating member:', err);
      let errorMessage = 'An error occurred while reactivating the member';
      
      if (err.response?.status === 401 || err.response?.status === 403) {
        errorMessage = 'You are not authorized to perform this action. Admin privileges required.';
      } else if (err.message === 'Network Error') {
        errorMessage = 'Network error. Please check your internet connection.';
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setSnackbar({
        open: true,
        message: errorMessage,
        severity: 'error'
      });
    }
    setConfirmDialog({ ...confirmDialog, open: false });
  };

  // Open confirm dialog before inactivating/reactivating
  const openConfirmDialog = (userId, userName, action) => {
    setConfirmDialog({
      open: true,
      userId,
      userName,
      action
    });
  };

  // Handle pagination
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Close snackbar
  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  // Function to get severity based on inactiveDays
  const getInactivitySeverity = (days, hasCommitted) => {
    if (!hasCommitted) return { color: 'secondary', icon: <NewReleasesIcon />, label: 'Never Committed' };
    if (days > 90) return { color: 'error', icon: <ErrorOutlineIcon />, label: 'Critical' };
    if (days > 60) return { color: 'warning', icon: <WarningAmberIcon />, label: 'Warning' };
    return { color: 'info', icon: <HourglassEmptyIcon />, label: 'Recent' };
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

  if (error) {
    return (
      <Alert severity="error" sx={{ mt: 2 }}>
        {error}
      </Alert>
    );
  }

  return (
    <Box sx={{ p: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold' }}>
            <PersonOffIcon sx={{ mr: 1, verticalAlign: 'bottom', color: 'primary.contrastText' }} />
            Members Management
          </Typography>
          {isImpersonating && (
            <Chip 
              label="Admin Mode" 
              color="warning" 
              variant="outlined"
              sx={{ fontWeight: 'bold' }}
            />
          )}
        </Box>
        <Button 
          variant="outlined" 
          startIcon={<RefreshIcon color="primary.contrastText" />} 
          onClick={handleRefresh}
          disabled={isRefreshing}
          sx={{ borderColor: 'primary.contrastText', color: 'primary.contrastText' }}
        >
          {isRefreshing ? 'Refreshing...' : 'Refresh'}
        </Button>
      </Box>
      
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={2}>
          <Card sx={{ bgcolor: '#e3f2fd', height: '100%' }}>
            <CardContent>
              <Typography variant="h5" component="div">
                {statistics.total}
              </Typography>
              <Typography color="text.secondary">
                Not Committing
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={2}>
          <Card sx={{ bgcolor: '#f3e5f5', height: '100%' }}>
            <CardContent>
              <Typography variant="h5" component="div">
                {statistics.neverCommitted}
              </Typography>
              <Typography color="text.secondary">
                Never Committed
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={2}>
          <Card sx={{ bgcolor: '#e0f7fa', height: '100%' }}>
            <CardContent>
              <Typography variant="h5" component="div">
                {statistics.recentInactive}
              </Typography>
              <Typography color="text.secondary">
                Recent (30-60 days)
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={2}>
          <Card sx={{ bgcolor: '#fffde7', height: '100%' }}>
            <CardContent>
              <Typography variant="h5" component="div">
                {statistics.mediumTermInactive}
              </Typography>
              <Typography color="text.secondary">
                Warning (60-90 days)
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={2}>
          <Card sx={{ bgcolor: '#ffebee', height: '100%' }}>
            <CardContent>
              <Typography variant="h5" component="div">
                {statistics.longTermInactive}
              </Typography>
              <Typography color="text.secondary">
                Critical (90+ days)
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={2}>
          <Card sx={{ bgcolor: '#fce4ec', height: '100%' }}>
            <CardContent>
              <Typography variant="h5" component="div">
                {statistics.inactiveMembers}
              </Typography>
              <Typography color="text.secondary">
                Blocked Members
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
        <Tabs value={activeTab} onChange={handleTabChange} aria-label="members tabs" sx={{ color: 'primary.contrastText' }}>
          <Tab 
            label={
              <Badge badgeContent={statistics.total} color="primary.contrastText">
                Not Committing
              </Badge>
            } 
            value="all" 
          />
          <Tab 
            label={
              <Badge badgeContent={statistics.neverCommitted} color="primary.contrastText">
                Never Committed
              </Badge>
            } 
            value="never_committed" 
          />
          <Tab 
            label={
              <Badge badgeContent={statistics.recentInactive} color="primary.contrastText">
                Recent (30-60 days)
              </Badge>
            } 
            value="recent" 
          />
          <Tab 
            label={
              <Badge badgeContent={statistics.mediumTermInactive} color="primary.contrastText">
                Warning (60-90 days)
              </Badge>
            } 
            value="medium" 
          />
          <Tab 
            label={
                <Badge badgeContent={statistics.longTermInactive} color="primary.contrastText">
                Critical (90+ days)
              </Badge>
            } 
            value="long_term" 
          />
          <Tab 
            label={
              <Badge badgeContent={statistics.inactiveMembers} color="error">
                Blocked Members
              </Badge>
            } 
            value="blocked" 
          />
        </Tabs>
      </Box>
      
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
        <TextField
          label="Search Members"
          variant="outlined"
          size="small"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          sx={{ width: 300 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon color="primary.contrastText" />
              </InputAdornment>
            ),
          }}
        />
      </Box>
      
      <Paper elevation={3} sx={{ overflow: 'hidden' }}>
        {isRefreshing && (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 1, bgcolor: '#e3f2fd' }}>
            <CircularProgress size={20} sx={{ mr: 1 }} />
            <Typography variant="body2">Refreshing data...</Typography>
          </Box>
        )}
        <TableContainer sx={{ maxHeight: 600 }}>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold', bgcolor: '#f5f5f5' }}>Member Name</TableCell>
                <TableCell sx={{ fontWeight: 'bold', bgcolor: '#f5f5f5' }}>Business Name</TableCell>
                <TableCell sx={{ fontWeight: 'bold', bgcolor: '#f5f5f5' }}>Email</TableCell>
                <TableCell sx={{ fontWeight: 'bold', bgcolor: '#f5f5f5' }}>Phone</TableCell>
                {activeTab !== 'blocked' && (
                  <>
                    <TableCell sx={{ fontWeight: 'bold', bgcolor: '#f5f5f5' }}>Last Commitment</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', bgcolor: '#f5f5f5' }}>Inactive Period</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', bgcolor: '#f5f5f5' }}>Status</TableCell>
                  </>
                )}
                {activeTab === 'blocked' && (
                  <TableCell sx={{ fontWeight: 'bold', bgcolor: '#f5f5f5' }}>Blocked Date</TableCell>
                )}
                <TableCell sx={{ fontWeight: 'bold', bgcolor: '#f5f5f5' }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredMembers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={activeTab === 'blocked' ? 6 : 8} align="center">
                    <Typography variant="subtitle1" sx={{ py: 5 }}>
                      No members found matching your criteria.
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                filteredMembers
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((member) => {
                    if (activeTab === 'blocked') {
                      return (
                        <TableRow key={member._id} hover>
                          <TableCell>{member.name}</TableCell>
                          <TableCell>{member.businessName || 'N/A'}</TableCell>
                          <TableCell>{member.email}</TableCell>
                          <TableCell>{member.phone || 'N/A'}</TableCell>
                          <TableCell>
                            {member.blockedAt ? 
                              format(new Date(member.blockedAt), 'MMM dd, yyyy') : 
                              'Unknown'
                            }
                          </TableCell>
                          <TableCell>
                            <Tooltip title="Reactivate Member">
                              <Button
                                variant="outlined"
                                color="success"
                                size="small"
                                startIcon={<CheckCircleIcon color="primary.contrastText" />}
                                onClick={() => openConfirmDialog(member._id, member.name, 'reactivate')}
                                sx={{ borderRadius: 2 }}
                              >
                                Reactivate
                              </Button>
                            </Tooltip>
                          </TableCell>
                        </TableRow>
                      );
                    } else {
                      const severity = getInactivitySeverity(member.inactiveDays, member.lastCommitmentDate);
                      
                      return (
                        <TableRow key={member._id} hover>
                          <TableCell>{member.name}</TableCell>
                          <TableCell>{member.businessName || 'N/A'}</TableCell>
                          <TableCell>{member.email}</TableCell>
                          <TableCell>{member.phone || 'N/A'}</TableCell>
                          <TableCell>
                            {member.lastCommitmentDate ? 
                              format(new Date(member.lastCommitmentDate), 'MMM dd, yyyy') : 
                              <Chip 
                                size="small" 
                                label="Never committed" 
                                color="secondary"
                                variant="outlined"
                              />
                            }
                          </TableCell>
                          <TableCell align="center">
                            <Chip 
                              label={`${member.inactiveDays} days`}
                              color={severity.color}
                              size="small"
                              icon={severity.icon}
                            />
                          </TableCell>
                          <TableCell>
                            <Chip 
                              label={severity.label} 
                              color={severity.color}
                              variant="outlined"
                              size="small"
                            />
                          </TableCell>
                          <TableCell>
                            <Tooltip title="Inactivate Member">
                              <Button
                                variant="outlined"
                                color="error"
                                size="small"
                                startIcon={<BlockIcon color="primary.contrastText" />}
                                onClick={() => openConfirmDialog(member._id, member.name, 'inactivate')}
                                sx={{ borderRadius: 2 }}
                              >
                                Inactivate
                              </Button>
                            </Tooltip>
                          </TableCell>
                        </TableRow>
                      );
                    }
                  })
              )}
            </TableBody>
          </Table>
        </TableContainer>
        
        <TablePagination
          rowsPerPageOptions={[5, 10, 25, 50]}
          component="div"
          count={filteredMembers.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Paper>
      
      {/* Confirmation Dialog */}
      <Dialog
        open={confirmDialog.open}
        onClose={() => setConfirmDialog({ ...confirmDialog, open: false })}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">
          {confirmDialog.action === 'reactivate' ? (
            <CheckCircleIcon color="success" sx={{ verticalAlign: 'middle', mr: 1 }} />
          ) : (
            <BlockIcon color="error" sx={{ verticalAlign: 'middle', mr: 1 }} />
          )}
          {confirmDialog.action === 'reactivate' ? "Confirm Member Reactivation" : "Confirm Member Inactivation"}
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            {confirmDialog.action === 'reactivate' ? (
              `Are you sure you want to reactivate ${confirmDialog.userName}? 
              This will allow them to access the platform again.`
            ) : (
              `Are you sure you want to inactivate ${confirmDialog.userName}? 
              This will prevent them from accessing the platform until they are reactivated.`
            )}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDialog({ ...confirmDialog, open: false })}>
            Cancel
          </Button>
          <Button 
            onClick={() => {
              if (confirmDialog.action === 'reactivate') {
                handleReactivateMember(confirmDialog.userId);
              } else {
                handleInactivateMember(confirmDialog.userId);
              }
            }}
            color={confirmDialog.action === 'reactivate' ? 'success' : 'error'} 
            variant="contained"
            autoFocus
          >
            {confirmDialog.action === 'reactivate' ? 'Reactivate' : 'Inactivate'}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Snackbar for notifications */}
      <Snackbar 
        open={snackbar.open} 
        autoHideDuration={6000} 
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert 
          onClose={handleCloseSnackbar} 
          severity={snackbar.severity} 
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default MembersnotCommiting;
