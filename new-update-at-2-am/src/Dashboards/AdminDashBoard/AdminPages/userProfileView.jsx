import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, json, useLocation } from 'react-router-dom';
import { Button, Container, Typography, Paper, Grid, Stack,Chip, Tabs, Tab, Box, Avatar, Card, CardContent, CardActions, Divider, TablePagination, Pagination, Skeleton } from '@mui/material';
import { Person, Block, LockOpen, ArrowBack, Login } from '@mui/icons-material';
import EmailIcon from "@mui/icons-material/Email";
import PhoneIcon from "@mui/icons-material/Phone";
import Toast from '../../../Components/Toast/Toast'; // Import Toast component
import AnnouncementToast from '../../../Components/Toast/announcmentToast';
import useMediaQuery from '@mui/material/useMediaQuery';
import UserProfileViewSettings from '../../../Dashboards/DashBoardComponents/userProfileViewSettings';
import api from '../../../services/api';
import { useAuth } from '../../../middleware/auth';

const ProfileSkeleton = () => (
  <Container>
    <Card>
      <CardContent>
        <Grid container spacing={3}>
          <Grid item xs={12} md={4} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <Skeleton variant="circular" width={150} height={150} />
            <Skeleton variant="text" sx={{ fontSize: '1.5rem', mt: 2, width: '80%' }} />
            <Skeleton variant="text" sx={{ width: '60%' }} />
          </Grid>
          <Grid item xs={12} md={8}>
            <Skeleton variant="text" sx={{ fontSize: '2rem', mb: 2 }} />
            {[...Array(6)].map((_, index) => (
              <Skeleton key={index} variant="text" sx={{ mb: 1 }} />
            ))}
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  </Container>
);

const UserProfileView = () => {
  const { userId } = useParams();
  const { currentUserId, isImpersonating, userRole } = useAuth();
  const [user, setUser] = useState(null);
  const [logs, setLogs] = useState([]);
  const [tabIndex, setTabIndex] = useState(0);
  const [toast, setToast] = useState({ open: false, message: '', severity: 'success' });
  const navigate = useNavigate();
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const isMobile = useMediaQuery('(max-width:600px)');
  const location = useLocation();
  const [loading, setLoading] = useState(true);

  const showToast = (message, severity = 'success') => {
    setToast({ open: true, message, severity });
  };

  const handleCloseToast = () => {
    setToast({ open: false, message: '', severity: 'success' });
  };

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true);
        
        // Fetch user profile by userId parameter (admin viewing specific user)
        const response = await api.get(`/api/users/${userId}`);
        
        setUser(response.data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching user:', error);
        setLoading(false);
        showToast('Error loading profile data', 'error');
      }
    };

    const fetchLogs = async () => {
      try {
        // Fetch logs for the specific user being viewed
        const response = await api.get(`/common/logs/${userId}`);
        setLogs(response.data);
      } catch (error) {
        console.error('Error fetching logs:', error);
      }
    };

    if (userId) {
      fetchUserData();
      fetchLogs();
    }

    // Check for the 'tab' query parameter
    const params = new URLSearchParams(location.search);
    const tab = params.get('tab');
    if (tab === 'settings') {
      setTabIndex(2); // Set to the index of the Settings tab
    }
  }, [userId, location.search]);

  const handleBlockUser = async () => {
    try {
      const response = await api.post('/auth/block-user', { userId: user._id });
      setUser({ ...user, isBlocked: true });
      showToast(response.data.message);
    } catch (error) {
      console.error('Error blocking user:', error);
      showToast(error.response?.data?.message || 'Error blocking user', 'error');
    }
  };

  const handleUnblockUser = async () => {
    try {
      const response = await api.post('/auth/unblock-user', { userId: user._id });
      setUser({ ...user, isBlocked: false });
      showToast(response.data.message);
    } catch (error) {
      console.error('Error unblocking user:', error);
      showToast(error.response?.data?.message || 'Error unblocking user', 'error');
    }
  };

  const handleLoginAsUser = async () => {
    try {
      // Save the current admin token before switching
      const currentToken = localStorage.getItem('token');
      if (currentToken) {
        localStorage.setItem('adminToken', currentToken);
      }

      const response = await api.post('/auth/login', { 
        email: user.email, 
        login_key: user.login_key,
        adminId: currentUserId
      });
      
      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
        showToast(response.data.message);
        
        // Redirect based on user role
        switch (response.data.user.role) {
          case 'member':
            window.location.href = '/dashboard/co-op-member';
            break;
          case 'distributor':
            window.location.href = '/dashboard/distributor';
            break;
          case 'admin':
            window.location.href = '/dashboard/admin';
            break;
          default:
            break;
        }
      }
    } catch (error) {
      console.error('Error logging in as user:', error);
      showToast(error.response?.data?.message || 'Error logging in as user', 'error');
    }
  };

  const handleTabChange = (event, newValue) => {
    setTabIndex(newValue);
  };

  const getInitials = (name) => {
    if (!name) return '';
    return name.charAt(0).toUpperCase();
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const paginatedLogs = logs.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  if (!user || loading) {
    return <ProfileSkeleton />;
  }

  return (
    <Container maxWidth="xl" sx={{ minWidth: { xs: '100%', sm: '300px' } }}>
      <AnnouncementToast event="signup" />
      <Button color='primary.contrastText' startIcon={<ArrowBack  color='primary.contrastText'/>} onClick={() => navigate(-1)} sx={{ mb: 2 }}>Back</Button>
      
      {/* Admin Mode Indicator */}
      {isImpersonating && (
        <Box sx={{ mb: 2, p: 2, bgcolor: 'info.light', borderRadius: 1 }}>
          <Typography variant="body2" color="info.contrastText">
            You are viewing this profile as an administrator
          </Typography>
        </Box>
      )}
      
      <Card elevation={3} sx={{ mt: 2, p: 3, position: 'relative' }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item>
              <Avatar sx={{ width: 80, height: 80, bgcolor: 'secondary.main' }}>
                {user.logo ? <img src={user.logo} alt="User Logo" style={{ width: '100%' }} /> : getInitials(user.name)}
              </Avatar>
            </Grid>
            <Grid item>
              <Typography variant="h5" gutterBottom>{user.name || 'No Name'}</Typography>
              <Typography variant="body2" color="textSecondary">{user.email}</Typography>
              <Chip 
                label={user.role} 
                color="primary" 
                size="small" 
                sx={{ mt: 1 }}
              />
            </Grid>
          </Grid>
        </CardContent>
        <Divider />
        <Tabs
          value={tabIndex}
          onChange={(e, newValue) => setTabIndex(newValue)}
          sx={{ 
            mb: 2, 
            width: '100%',
            "& .MuiTabs-indicator": {
              backgroundColor: "yellow",
              height: 3
            },
            "& .MuiTab-root": {
              color: "black",
              "&.Mui-selected": {
                color: "black",
                fontWeight: "bold"
              }
            }
          }}
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab label="Profile" />
          <Tab label="Activity Logs" />
          <Tab label="Settings" />
        </Tabs>

        <Box hidden={tabIndex !== 0} sx={{ p: 2 }}>
              <Grid container spacing={2}>
                {[
                  { label: "Business", value: user.businessName },
                  { label: "Role", value: user.role },
                  { label: "Contact", value: user.contactPerson },
                  { label: "Phone", value: user.phone },
                  { label: "Address", value: user.address },
                ].map((item, index) => (
                  <Grid item xs={12} sm={6} key={index}>
                    <Typography variant="body1">
                      <strong>{item.label}:</strong> {item.value || "N/A"}
                    </Typography>
                  </Grid>
                ))}
    <>
      {user.additionalEmails?.length > 0 && (
        <Grid item xs={12}>
            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
              Additional Emails
            </Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap">
              {user.additionalEmails.map((email, index) => (
                <Chip
                  key={index}
                  icon={<EmailIcon />}
                  label={`${email.label}: ${email.email}`}
                  variant="outlined"
                  color="primary"
                  sx={{ fontSize: 14 }}
                />
              ))}
            </Stack>
        </Grid>
      )}

      {user.additionalPhoneNumbers?.length > 0 && (
        <Grid item xs={12}>
            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
              Additional Phone Numbers
            </Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap">
              {user.additionalPhoneNumbers.map((phone, index) => (
                <Chip
                  key={index}
                  icon={<PhoneIcon />}
                  label={`${phone.label}: ${phone.number}`}
                  variant="outlined"
                  color="secondary"
                  sx={{ fontSize: 14 }}
                />
              ))}
            </Stack>
        </Grid>
      )}
    </>

              </Grid>
        </Box>
        <Box hidden={tabIndex !== 1} sx={{ p: 2 }}>
          {logs.length > 0 ? (
            <>
              {paginatedLogs.map(log => (
                <Paper key={log._id} sx={{ p: 2, mb: 1 }}>
                  <Typography variant="body2"><strong>Message:</strong> {log.message}</Typography>
                  <Typography variant="body2"><strong>Type:</strong> {log.type}</Typography>
                  <Typography variant="body2" color="textSecondary">
                    {new Date(log.createdAt).toLocaleString()}
                  </Typography>
                </Paper>
              ))}
              <Box sx={{
                mt: 3,
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                gap: 2,
                flexWrap: 'wrap'
              }}>
                <TablePagination
                  component="div"
                  count={logs.length}
                  page={page}
                  onPageChange={handleChangePage}
                  rowsPerPage={rowsPerPage}
                  onRowsPerPageChange={handleChangeRowsPerPage}
                  rowsPerPageOptions={[5, 10, 25]}
                  sx={{
                    '.MuiTablePagination-select': {
                      borderRadius: 1,
                      bgcolor: 'background.paper',
                    },
                    '.MuiTablePagination-selectIcon': {
                      color: 'primary.main',
                    },
                  }}
                />
                <Pagination
                  count={Math.ceil(logs.length / rowsPerPage)}
                  page={page + 1}
                  onChange={(e, p) => setPage(p - 1)}
                  color="primary"
                  size={isMobile ? "small" : "medium"}
                  sx={{
                    '& .MuiPaginationItem-root': {
                      borderRadius: 1,
                      '&.Mui-selected': {
                        bgcolor: 'primary.main',
                        color: 'white',
                        '&:hover': {
                          bgcolor: 'primary.dark',
                        },
                      },
                    },
                  }}
                />
              </Box>
            </>
          ) : (
            <Typography variant="body2">No logs found.</Typography>
          )}
        </Box>
        <Box hidden={tabIndex !== 2} sx={{ p: 2 }}> {/* Settings Tab Content */}
          <UserProfileViewSettings userId={userId} />
        </Box>
        <CardActions sx={{ position: 'absolute', top: '1rem', right: '1rem' }}>
          {/* Only show admin actions if current user is admin */}
          {userRole === 'admin' && user && (
            <>
              {user.isBlocked ? (
                <Button startIcon={<LockOpen />} color="secondary" onClick={handleUnblockUser}>Unblock</Button>
              ) : (
                <Button startIcon={<Block />} color="error" onClick={handleBlockUser}>Block</Button>
              )}
              {user.role !== 'admin' && (
                <Button startIcon={<Login />} onClick={handleLoginAsUser}>Login as User</Button>
              )}
            </>
          )}
        </CardActions>
      </Card>
      <Toast open={toast.open} message={toast.message} severity={toast.severity} handleClose={handleCloseToast} />
    </Container>
  );
};

export default UserProfileView;
