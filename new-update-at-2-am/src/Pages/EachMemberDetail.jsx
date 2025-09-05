import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Container, 
  Paper, 
  Grid, 
  Card, 
  CardContent, 
  CardMedia, 
  Divider, 
  Chip, 
  CircularProgress, 
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Avatar
} from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import EmailIcon from '@mui/icons-material/Email';
import PhoneIcon from '@mui/icons-material/Phone';
import BusinessIcon from '@mui/icons-material/Business';
import PersonIcon from '@mui/icons-material/Person';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import { format } from 'date-fns';

const EachMemberDetail = () => {
  const { memberId } = useParams();
  const navigate = useNavigate();
  const [memberData, setMemberData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);

  useEffect(() => {
    const fetchMemberDetails = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          navigate('/login');
          return;
        }

        const response = await api.get(`/api/members/member-details/${memberId}/admin`);

        setMemberData(response.data);
      } catch (error) {
        console.error('Error fetching member details:', error);
      } finally {
        setLoading(false);
      }
    };

    if (memberId) {
      fetchMemberDetails();
    }
  }, [memberId, navigate]);

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleGoBack = () => {
    navigate(-1);
  };

  const formatDate = (dateString) => {
    try {
      return format(new Date(dateString), 'MMM dd, yyyy');
    } catch (error) {
      return 'Invalid date';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved':
        return '#4CAF50';
      case 'pending':
        return '#FF9800';
      case 'declined':
        return '#F44336';
      case 'cancelled':
        return '#9E9E9E';
      default:
        return '#9E9E9E';
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!memberData) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Paper elevation={3} sx={{ p: 3, borderRadius: 2 }}>
          <Typography variant="h5" color="error" align="center">
            Member not found or you don't have permission to view this member.
          </Typography>
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
            <Button 
              variant="contained" 
              startIcon={<ArrowBackIcon color="primary.contrastText" />} 
              onClick={handleGoBack}
            >
              Go Back
            </Button>
          </Box>
        </Paper>
      </Container>
    );
  }

  const { member, commitments, stats } = memberData;

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Button 
        variant="outlined" 
        startIcon={<ArrowBackIcon color="primary.contrastText" />} 
        onClick={handleGoBack}
        sx={{ mb: 2, borderColor: 'primary.contrastText', color: 'primary.contrastText' }}
      >
        Back to Members
      </Button>

      {/* Member Profile Card */}
      <Paper elevation={3} sx={{ p: 3, borderRadius: 2, mb: 4 }}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <Avatar 
                sx={{ 
                  width: 120, 
                  height: 120, 
                  bgcolor: 'primary.main',
                  fontSize: '3rem',
                  mb: 2
                }}
              >
                <img 
                  src={member.logo || 'https://upload.wikimedia.org/wikipedia/commons/8/89/Portrait_Placeholder.png'} 
                  alt={member.name} 
                  style={{ 
                    width: '100%', 
                    height: '100%', 
                    objectFit: 'cover' 
                  }}
                />
              </Avatar>
              <Typography variant="h5" gutterBottom>
                {member.name}
              </Typography>
              <Chip 
                label="Member" 
                color="primary" 
                sx={{ mb: 2 }}
              />
            </Box>
          </Grid>
          
          <Grid item xs={12} md={8}>
            <Typography variant="h4" gutterBottom>
              Member Information
            </Typography>
            <Divider sx={{ mb: 2 }} />
            
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
                  <EmailIcon sx={{ mr: 1, color: 'primary.contrastText' }} />
                  <Typography variant="body1">
                    <strong>Email:</strong> {member.email}
                  </Typography>
                </Box>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
                  <PhoneIcon sx={{ mr: 1, color: 'primary.contrastText' }} />
                  <Typography variant="body1">
                    <strong>Phone:</strong> {member.phone || 'Not provided'}
                  </Typography>
                </Box>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
                  <BusinessIcon sx={{ mr: 1, color: 'primary.contrastText' }} />
                  <Typography variant="body1">
                    <strong>Business Name:</strong> {member.businessName || 'Not provided'}
                  </Typography>
                </Box>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
                  <PersonIcon sx={{ mr: 1, color: 'primary.contrastText' }} />
                  <Typography variant="body1">
                    <strong>Contact Person:</strong> {member.contactPerson || 'Not provided'}
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </Grid>
        </Grid>
      </Paper>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6}>
          <Card elevation={3} sx={{ borderRadius: 2, height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Avatar sx={{ bgcolor: '#4CAF50', mr: 2 }}>
                  <ShoppingCartIcon />
                </Avatar>
                <Typography variant="h6">Total Commitments</Typography>
              </Box>
              <Typography variant="h3" align="center" sx={{ my: 2 }}>
                {stats.totalCommitments}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6}>
          <Card elevation={3} sx={{ borderRadius: 2, height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Avatar sx={{ bgcolor: '#2196F3', mr: 2 }}>
                  <AttachMoneyIcon />
                </Avatar>
                <Typography variant="h6">Total Spent</Typography>
              </Box>
              <Typography variant="h3" align="center" sx={{ my: 2 }}>
                ${stats.totalSpent.toFixed(2)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Commitments Table */}
      <Paper elevation={3} sx={{ p: 3, borderRadius: 2 }}>
        <Typography variant="h5" gutterBottom>
          Commitment History
        </Typography>
        <Divider sx={{ mb: 2 }} />
        
        {commitments.length > 0 ? (
          <>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                    <TableCell><Typography variant="subtitle2" fontWeight="bold">Deal</Typography></TableCell>
                    <TableCell><Typography variant="subtitle2" fontWeight="bold">Quantity</Typography></TableCell>
                    <TableCell><Typography variant="subtitle2" fontWeight="bold">Total Price</Typography></TableCell>
                    <TableCell><Typography variant="subtitle2" fontWeight="bold">Status</Typography></TableCell>
                    <TableCell><Typography variant="subtitle2" fontWeight="bold">Date</Typography></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {commitments
                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                    .map((commitment) => (
                      <TableRow key={commitment._id} hover>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            {commitment.dealId?.images && commitment.dealId.images.length > 0 ? (
                              <Avatar 
                                src={commitment.dealId.images[0]} 
                                alt={commitment.dealId.name}
                                variant="rounded"
                                sx={{ width: 40, height: 40, mr: 1 }}
                              />
                            ) : (
                              <Avatar 
                                variant="rounded"
                                sx={{ width: 40, height: 40, mr: 1, bgcolor: 'primary.light' }}
                              >
                                {commitment.dealId?.name?.charAt(0) || 'D'}
                              </Avatar>
                            )}
                            <Typography variant="body2">
                              {commitment.dealId?.name || 'Unknown Deal'}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>{commitment.quantity}</TableCell>
                        <TableCell>${commitment.totalPrice.toFixed(2)}</TableCell>
                        <TableCell>
                          <Chip 
                            label={commitment.status.charAt(0).toUpperCase() + commitment.status.slice(1)} 
                            size="small"
                            sx={{ 
                              backgroundColor: getStatusColor(commitment.status),
                              color: 'white'
                            }}
                          />
                        </TableCell>
                      
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <CalendarTodayIcon sx={{ fontSize: 16, mr: 0.5, color: 'text.secondary' }} />
                            {formatDate(commitment.createdAt)}
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
              count={commitments.length}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
            />
          </>
        ) : (
          <Box sx={{ py: 3, textAlign: 'center' }}>
            <Typography variant="body1" color="text.secondary">
              This member has not made any commitments yet.
            </Typography>
          </Box>
        )}
      </Paper>
    </Container>
  );
};

export default EachMemberDetail;
