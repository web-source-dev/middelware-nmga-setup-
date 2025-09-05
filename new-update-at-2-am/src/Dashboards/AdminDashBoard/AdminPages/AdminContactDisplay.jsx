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
  TablePagination,
  Chip,
  IconButton,
  Tooltip,
  CircularProgress,
  Alert,
  Snackbar,
  useTheme,
  useMediaQuery,
  Card,
  CardContent,
  Grid,
  Skeleton,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PendingIcon from '@mui/icons-material/Pending';
import DoneIcon from '@mui/icons-material/Done';
import { format } from 'date-fns';
import api from '../../../services/api';

const AdminContactDisplay = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const getStatusColor = (status) => {
    return status === 'resolved' ? theme.palette.success.main : theme.palette.warning.main;
  };

  const getRoleColor = (role) => {
    switch(role) {
      case 'admin':
        return 'primary.main';
      case 'distributor':
        return 'primary.main';
      default:
        return 'primary.main';
    }
  };

  const handleStatusUpdate = async (contactId, newStatus) => {
    try {
      const response = await api.patch(`/api/contact/status/${contactId}`, {
        status: newStatus
      });

      const data = response.data;

      if (data.success) {
        // Update the contacts list with the new status
        setContacts(contacts.map(contact =>
          contact._id === contactId ? { ...contact, status: newStatus } : contact
        ));
        setSnackbar({
          open: true,
          message: 'Status updated successfully',
          severity: 'success'
        });
      } else {
        setSnackbar({
          open: true,
          message: data.message || 'Failed to update status',
          severity: 'error'
        });
      }
    } catch (error) {
      console.error('Error updating status:', error);
      setSnackbar({
        open: true,
        message: 'Error updating status. Please try again.',
        severity: 'error'
      });
    }
  };

  useEffect(() => {
    fetchContacts();
  }, []);

  const fetchContacts = async () => {
    try {
      const response = await api.get(`/api/contact/all`);
      const data = await response.data;
      
      if (data.success) {
        setContacts(data.data);
      } else {
        setError(data.message || 'Failed to fetch contacts');
      }
    } catch (error) {
      setError('Error fetching contacts. Please try again later.');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  if (loading) {
    return (
      <Box p={3}>
        <Typography variant={isMobile ? "h5" : "h4"} gutterBottom sx={{ color: '#1a237e', mb: 4 }}>
          <Skeleton width={300} />
        </Typography>

        {isMobile ? (
          // Mobile loading skeleton
          <Grid container spacing={2}>
            {[1, 2, 3].map((item) => (
              <Grid item xs={12} key={item}>
                <Card sx={{ mb: 2 }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                      <Skeleton width={120} />
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Skeleton width={60} height={24} />
                        <Skeleton width={80} height={24} />
                      </Box>
                    </Box>
                    <Skeleton width="60%" height={28} sx={{ mb: 1 }} />
                    <Skeleton width="40%" sx={{ mb: 1 }} />
                    <Skeleton width="70%" sx={{ mb: 1 }} />
                    <Skeleton width="100%" height={60} />
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        ) : (
          // Desktop loading skeleton
          <Paper sx={{ width: '100%', overflow: 'hidden', boxShadow: 3 }}>
            <TableContainer sx={{ maxHeight: 600 }}>
              <Table>
                <TableHead>
                  <TableRow>
                    {[1, 2, 3, 4, 5, 6, 7].map((item) => (
                      <TableCell key={item}>
                        <Skeleton width={100} />
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {[1, 2, 3, 4, 5].map((row) => (
                    <TableRow key={row}>
                      {[1, 2, 3, 4, 5, 6, 7].map((cell) => (
                        <TableCell key={cell}>
                          <Skeleton width={cell === 4 ? 200 : 100} />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        )}
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={3}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  return (
    <Box py={3}>
      <Typography
        variant={isMobile ? "h5" : "h4"}
        gutterBottom
        sx={{
          color: 'primary.contrastText',
          mb: 4,
          textAlign: isMobile ? 'center' : 'left'
        }}
      >
        Contact Form Submissions
      </Typography>

      {isMobile ? (
        // Mobile View - Card Layout
        <Grid container spacing={2}>
          {contacts
            .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
            .map((contact) => (
              <Grid item xs={12} key={contact._id}>
                <Card sx={{
                  mb: 2,
                  boxShadow: 2,
                  '&:hover': {
                    boxShadow: 4,
                    transform: 'translateY(-2px)',
                    transition: 'all 0.3s ease-in-out'
                  }
                }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                      <Typography variant="subtitle2" color="text.secondary">
                        {format(new Date(contact.createdAt), 'MMM dd, yyyy HH:mm')}
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Chip
                          label={contact.user_role}
                          size="small"
                          sx={{
                            backgroundColor: getRoleColor(contact.user_role),
                            color: 'primary.contrastText'
                          }}
                        />
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Chip
                            icon={contact.status === 'resolved' ? <CheckCircleIcon color="primary.contrastText" /> : <PendingIcon color="primary.contrastText" />}
                            label={contact.status}
                            size="small"
                            color={contact.status === 'resolved' ? 'success' : 'warning'}
                          />
                          {contact.status === 'pending' && (
                            <IconButton
                              size="small"
                              color="success"
                              onClick={() => handleStatusUpdate(contact._id, 'resolved')}
                            >
                              <DoneIcon color="primary.contrastText" />
                            </IconButton>
                          )}
                        </Box>
                      </Box>
                    </Box>

                    <Typography variant="h6" gutterBottom>{contact.name}</Typography>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      {contact.email}
                    </Typography>
                    <Typography variant="subtitle1" gutterBottom>
                      {contact.subject}
                    </Typography>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{
                        mt: 1,
                        backgroundColor: theme.palette.grey[50],
                        p: 1.5,
                        borderRadius: 1,
                        maxHeight: '100px',
                        overflow: 'auto'
                      }}
                    >
                      {contact.message}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
        </Grid>
      ) : (
        // Desktop View - Table Layout
        <Paper sx={{ width: '100%', overflow: 'hidden', boxShadow: 3 }}>
          <TableContainer sx={{ maxHeight: 600 }}>
            <Table stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 'bold', backgroundColor: theme.palette.grey[100] }}>Date</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', backgroundColor: theme.palette.grey[100] }}>Name</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', backgroundColor: theme.palette.grey[100] }}>Email</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', backgroundColor: theme.palette.grey[100] }}>Subject</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', backgroundColor: theme.palette.grey[100] }}>Message</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', backgroundColor: theme.palette.grey[100] }}>User</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', backgroundColor: theme.palette.grey[100] }}>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {contacts
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((contact) => (
                    <TableRow
                      hover
                      key={contact._id}
                      sx={{
                        '&:hover': {
                          backgroundColor: theme.palette.action.hover
                        }
                      }}
                    >
                      <TableCell>
                        {format(new Date(contact.createdAt), 'MMM dd, yyyy HH:mm')}
                      </TableCell>
                      <TableCell>{contact.name}</TableCell>
                      <TableCell>{contact.email}</TableCell>
                      <TableCell>{contact.subject}</TableCell>
                      <TableCell>
                        <Tooltip title={contact.message}>
                          <Typography
                            sx={{
                              maxWidth: 400,
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis'
                            }}
                          >
                            {contact.message}
                          </Typography>
                        </Tooltip>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={contact.user_role}
                          size="small"
                          sx={{
                            backgroundColor: getRoleColor(contact.user_role),
                            color: 'primary.contrastText'
                          }}
                        />
                      </TableCell>  
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Chip
                            icon={contact.status === 'resolved' ? <CheckCircleIcon color="primary.contrastText" /> : <PendingIcon color="primary.contrastText" />}
                            label={contact.status}
                            size="small"
                            color={contact.status === 'resolved' ? 'success' : 'warning'}
                          />
                          {contact.status === 'pending' && (
                            <Tooltip title="Mark as Resolved">
                              <IconButton
                                size="small"
                                color="success"
                                onClick={() => handleStatusUpdate(contact._id, 'resolved')}
                              >
                                <DoneIcon color="primary.contrastText" />
                              </IconButton>
                            </Tooltip>
                          )}
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination
            rowsPerPageOptions={[5, 10, 25]}
            component="div"
            count={contacts.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
          />
        </Paper>
      )}

      {/* Pagination for mobile view */}
      {isMobile && (
        <Paper
          sx={{
            position: 'sticky',
            bottom: 0,
            left: 0,
            right: 0,
            zIndex: 1,
            mt: 2,
            boxShadow: 3,
            borderRadius: '8px 8px 0 0'
          }}
        >
          <TablePagination
            rowsPerPageOptions={[5, 10, 25]}
            component="div"
            count={contacts.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
          />
        </Paper>
      )}

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{
            width: '100%',
            boxShadow: 3,
            borderRadius: 2,
            '& .MuiAlert-icon': {
              fontSize: '1.5rem'
            }
          }}
          variant="filled"
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default AdminContactDisplay;