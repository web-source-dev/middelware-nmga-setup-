import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../../services/api';
import { useAuth } from '../../../middleware/auth';
import { 
  Box, 
  Container, 
  Typography, 
  Paper, 
  Grid, 
  Card, 
  CardContent,
  Divider,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  CircularProgress,
  Avatar,
  Stack,
  Link,
  IconButton,
  Tab,
  Tabs,
  Alert,
  useTheme,
  Modal,
  Fade,
  Backdrop,
  List,
  ListItem,
  ListItemText
} from '@mui/material';
import {
  Person as PersonIcon,
  Email as EmailIcon,
  Business as BusinessIcon,
  Phone as PhoneIcon,
  LocationOn as LocationIcon,
  ArrowBack as ArrowBackIcon,
  Check as CheckIcon,
  Close as CloseIcon,
  AttachMoney as AttachMoneyIcon,
  AccessTime as AccessTimeIcon,
  ShoppingBag as ShoppingBagIcon,
  Visibility as VisibilityIcon
} from '@mui/icons-material';
import { format } from 'date-fns';
import { useSnackbar } from 'notistack';

// Helper function to format currency
const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
};

// Modal style
const modalStyle = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: 600,
  maxWidth: '90%',
  bgcolor: 'background.paper',
  boxShadow: 24,
  p: 4,
  borderRadius: 1,
  maxHeight: '90vh',
  overflow: 'auto'
};

// Status indicator component
const StatusChip = ({ status }) => {
  let color = 'default';
  
  switch(status) {
    case 'pending':
      color = 'warning';
      break;
    case 'approved':
      color = 'success';
      break;
    case 'declined':
      color = 'error';
      break;
    case 'cancelled':
      color = 'error';
      break;
    case 'paid':
      color = 'success';
      break;
    default:
      color = 'default';
  }
  
  return <Chip label={status.toUpperCase()} color={color} size="small" />;
};

const MemberCommitmentDetails = () => {
  const theme = useTheme();
  const { memberId } = useParams();
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const { currentUserId, userRole, isImpersonating } = useAuth();
  const [store, setStore] = useState(null);
  const [commitments, setCommitments] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tabValue, setTabValue] = useState(0);
  
  // State for commitment detail modal
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedCommitment, setSelectedCommitment] = useState(null);
  
  useEffect(() => {
    fetchStoreDetails();
  }, [memberId]);
  
  const fetchStoreDetails = async () => {
    try {
      setLoading(true);
      
      if (!currentUserId) {
        setError('Authentication error. Please log in again.');
        return;
      }
      
      // Use the new middleware-protected endpoint
      const response = await api.get(`/newmembers/member-details/${memberId}`);
      
      if (response.data.success) {
        setStore(response.data.member);
        setCommitments(response.data.commitments);
        setStats(response.data.stats);
      } else {
        setError('Failed to load store details.');
      }
    } catch (error) {
      console.error('Error fetching store details:', error);
      setError(error.response?.data?.message || 'An error occurred while fetching store details');
      enqueueSnackbar(error.response?.data?.message || 'Failed to load store details', {
        variant: 'error',
      });
    } finally {
      setLoading(false);
    }
  };
  
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };
  
  const handleOpenDetailModal = (commitment) => {
    setSelectedCommitment(commitment);
    setDetailModalOpen(true);
  };
  
  const handleCloseDetailModal = () => {
    setDetailModalOpen(false);
  };
  
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
      </Box>
    );
  }
  
  if (error) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Button 
          startIcon={<ArrowBackIcon />} 
          variant="outlined" 
          onClick={() => navigate(-1)}
        >
          Back to Stores
        </Button>
      </Container>
    );
  }
  
  if (!store) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="warning">Store not found or you don't have permission to view this store.</Alert>
        <Button 
          startIcon={<ArrowBackIcon />} 
          variant="outlined" 
          onClick={() => navigate(-1)}
          sx={{ mt: 2 }}
        >
          Back to Stores
        </Button>
      </Container>
    );
  }
  
  // Format the store's registration date
  const registrationDate = store.createdAt 
    ? format(new Date(store.createdAt), 'MMMM dd, yyyy') 
    : 'N/A';
  
  return (
    <Container maxWidth="xl" sx={{ pb: 8, mb:6 }}>
      <Button 
        startIcon={<ArrowBackIcon color='primary.contrastText' />} 
        variant="outlined" 
        onClick={() => navigate(-1)}
        sx={{ mb: 3 }}
        color='primary.contrastText'
      >
        Back to Stores
      </Button>
      
      {/* Admin Mode Indicator */}
      {isImpersonating && (
        <Alert severity="info" sx={{ mb: 2 }}>
          You are viewing this store as an administrator
        </Alert>
      )}
      
      <Grid container spacing={3}>
        {/* Store Profile Section */}
        <Grid item xs={12} md={4}>
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 3 }}>
                <Avatar
                  sx={{ 
                    width: 100, 
                    height: 100, 
                    bgcolor: theme.palette.primary.main,
                    fontSize: '2.5rem',
                    mb: 2,
                    color:'primary.contrastText'
                  }}
                >
                  {store.name?.charAt(0).toUpperCase() || 'M'}
                </Avatar>
                <Typography variant="h5" gutterBottom>{store.name}</Typography>
                <Chip 
                  icon={store.isVerified ? <CheckIcon /> : <CloseIcon />}
                  label={store.isVerified ? "Verified Account" : "Unverified Account"} 
                  color={store.isVerified ? "success" : "default"}
                  sx={{ mb: 1 }}
                />
                <Typography variant="body2" color="text.secondary">
                  Store since {registrationDate}
                </Typography>
              </Box>
              
              <Divider sx={{ my: 2 }} />
              
              <Stack spacing={2}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <BusinessIcon color="action" sx={{ mr: 1 }} />
                  <Typography variant="body1">
                    <strong>Store Name:</strong> {store.businessName || 'Not specified'}
                  </Typography>
                </Box>
                
                <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
                  <EmailIcon color="action" sx={{ mr: 1, mt: 0.5 }} />
                  <Typography variant="body1">
                    <strong>Email:</strong> {store.email}
                  </Typography>
                </Box>
                
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <PhoneIcon color="action" sx={{ mr: 1 }} />
                  <Typography variant="body1">
                    <strong>Phone Number:</strong> {store.phone || 'Not specified'}
                  </Typography>
                </Box>
                
                <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
                  <LocationIcon color="action" sx={{ mr: 1, mt: 0.5 }} />
                  <Typography variant="body1">
                    <strong>Address:</strong> {store.address || 'Not specified'}
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
          
          {/* Stats Cards */}
          {stats && (
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Card sx={{ bgcolor: theme.palette.primary.main }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <ShoppingBagIcon color="primary.contrastText" />
                      <Typography variant="h4" align="right">{stats.totalCommitments}</Typography>
                    </Box>
                    <Typography variant="body2">Total Commitments</Typography>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={6}>
                <Card sx={{ bgcolor: theme.palette.warning.light }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <AccessTimeIcon color="primary.contrastText"/>
                      <Typography variant="h4" align="right">{stats.pendingCommitments}</Typography>
                    </Box>
                    <Typography variant="body2">Pending</Typography>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={6}>
                <Card sx={{ bgcolor: theme.palette.success.main }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <CheckIcon color="primary.contrastText"/>
                      <Typography variant="h4" align="right">{stats.approvedCommitments}</Typography>
                    </Box>
                    <Typography variant="body2">Approved</Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          )}
        </Grid>
        
        {/* Commitments Section */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 2, mb: 3 }}>
            <Typography variant="h5" gutterBottom>Commitment History</Typography>
            
            {commitments.length === 0 ? (
              <Alert severity="info" sx={{ mt: 2 }}>
                This store hasn't made any commitments yet.
              </Alert>
            ) : (
              <>
                <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
                  <Tabs 
                    value={tabValue} 
                    onChange={handleTabChange}
                    aria-label="commitment tabs"
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
                  >
                    <Tab label="All Commitments" />
                    <Tab label="Pending" />
                    <Tab label="Approved" />
                    <Tab label="Declined/Cancelled" />
                  </Tabs>
                </Box>
                
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Deal</TableCell>
                        <TableCell>Date</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Quantity & Size</TableCell>
                        <TableCell align="right">Amount</TableCell>
                        <TableCell align="center" width={60}>Details</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {commitments
                        .filter(commitment => {
                          if (tabValue === 0) return true;
                          if (tabValue === 1) return commitment.status === 'pending';
                          if (tabValue === 2) return commitment.status === 'approved';
                          if (tabValue === 3) return ['declined', 'cancelled'].includes(commitment.status);
                          return true;
                        })
                        .map((commitment) => (
                          <TableRow key={commitment._id} hover>
                            <TableCell>
                              <Link 
                                component="button"
                                variant="body2"
                                onClick={() => navigate(`/deals-catlog/deals/${commitment.dealId._id}`)}
                                sx={{ textDecoration: 'none',color:'primary.contrastText' }}
                              >
                                {commitment.dealId.name}
                              </Link>
                              <Typography variant="caption" display="block" color="text.secondary">
                                Distributor: {commitment.dealId.distributor?.businessName || 'Unknown'}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              {format(new Date(commitment.createdAt), 'MMM dd, yyyy')}
                            </TableCell>
                            <TableCell>
                              <StatusChip status={commitment.status} />
                            </TableCell>
                            <TableCell>
                              {commitment.sizeCommitments && commitment.sizeCommitments.length > 0 ? (
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                                  {commitment.sizeCommitments.map((sizeCommit, index) => (
                                    <Box key={index} sx={{ display: 'flex', alignItems: 'center' }}>
                                      <Typography variant="body2">
                                        {sizeCommit.quantity} × {sizeCommit.size} 
                                        <Typography 
                                          component="span" 
                                          variant="caption" 
                                          color="text.secondary"
                                          sx={{ ml: 1 }}
                                        >
                                          ({formatCurrency(sizeCommit.pricePerUnit)} each)
                                        </Typography>
                                        {sizeCommit.appliedDiscountTier && (
                                          <Chip 
                                            label={`$${sizeCommit.appliedDiscountTier.tierDiscount} at ${sizeCommit.appliedDiscountTier.tierQuantity}+`}
                                            size="small"
                                            color="success"
                                            variant="outlined"
                                            sx={{ ml: 1, height: 20, fontSize: '0.6rem' }}
                                          />
                                        )}
                                      </Typography>
                                    </Box>
                                  ))}
                                </Box>
                              ) : (
                                <Typography variant="body2" color="text.secondary">No size details</Typography>
                              )}
                            </TableCell>
                            <TableCell align="right">
                              {formatCurrency(commitment.totalPrice)}
                            </TableCell>
                            <TableCell align="center">
                              <IconButton
                                size="small"
                                color="primary.contrastText"
                                onClick={() => handleOpenDetailModal(commitment)}
                                aria-label="View commitment details"
                              >
                                <VisibilityIcon color="primary.contrastText" fontSize="small" />
                              </IconButton>
                            </TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                </TableContainer>
                
                {commitments.filter(commitment => {
                  if (tabValue === 0) return true;
                  if (tabValue === 1) return commitment.status === 'pending';
                  if (tabValue === 2) return commitment.status === 'approved';
                  if (tabValue === 3) return ['declined', 'cancelled'].includes(commitment.status);
                  return true;
                }).length === 0 && (
                  <Alert severity="info" sx={{ mt: 2 }}>
                    No commitments found for the selected filter.
                  </Alert>
                )}
              </>
            )}
          </Paper>
        </Grid>
      </Grid>
      
      {/* Commitment Detail Modal */}
      <Modal
        open={detailModalOpen}
        onClose={handleCloseDetailModal}
        closeAfterTransition
        BackdropComponent={Backdrop}
        BackdropProps={{
          timeout: 500,
        }}
      >
        <Fade in={detailModalOpen}>
          <Box sx={modalStyle}>
            {selectedCommitment && (
              <>
                <Typography variant="h6" component="h2" gutterBottom>
                  Commitment Details
                </Typography>
                <Divider sx={{ mb: 2 }} />
                
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" color="text.secondary">Deal</Typography>
                    <Typography variant="body1" gutterBottom>
                      {selectedCommitment.dealId.name}
                    </Typography>
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" color="text.secondary">Date</Typography>
                    <Typography variant="body1" gutterBottom>
                      {format(new Date(selectedCommitment.createdAt), 'MMMM dd, yyyy')}
                    </Typography>
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" color="text.secondary">Status</Typography>
                    <Typography variant="body1" gutterBottom>
                      <StatusChip status={selectedCommitment.status} />
                    </Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      Size & Quantity Details
                    </Typography>
                    {selectedCommitment.sizeCommitments && selectedCommitment.sizeCommitments.length > 0 ? (
                      <TableContainer component={Paper} variant="outlined">
                        <Table size="small">
                          <TableHead>
                            <TableRow>
                              <TableCell>Size</TableCell>
                              <TableCell align="right">Quantity</TableCell>
                              <TableCell align="right">Price Each</TableCell>
                              <TableCell align="right">Subtotal</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {selectedCommitment.sizeCommitments.map((sizeCommit, index) => (
                              <TableRow key={index}>
                                <TableCell>{sizeCommit.size}</TableCell>
                                <TableCell align="right">{sizeCommit.quantity}</TableCell>
                                <TableCell align="right">{formatCurrency(sizeCommit.pricePerUnit)}</TableCell>
                                <TableCell align="right">{formatCurrency(sizeCommit.totalPrice)}</TableCell>
                              </TableRow>
                            ))}
                            <TableRow>
                              <TableCell colSpan={3} align="right" sx={{ fontWeight: 'bold' }}>
                                Total
                              </TableCell>
                              <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                                {formatCurrency(selectedCommitment.totalPrice)}
                              </TableCell>
                            </TableRow>
                          </TableBody>
                        </Table>
                      </TableContainer>
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        No size details available
                      </Typography>
                    )}
                  </Grid>
                  
                  {/* Display size-specific discount tiers if available */}
                  {selectedCommitment.sizeCommitments && selectedCommitment.sizeCommitments.some(sc => sc.appliedDiscountTier) && (
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                        Applied Discount Tiers
                      </Typography>
                      <List dense component={Paper} variant="outlined" sx={{ bgcolor: 'success.light' }}>
                        {selectedCommitment.sizeCommitments
                          .filter(sc => sc.appliedDiscountTier)
                          .map((sizeCommit, idx) => (
                            <ListItem key={idx}>
                              <ListItemText
                                primary={
                                  <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                                    {sizeCommit.size}: ${sizeCommit.appliedDiscountTier.tierDiscount} price at {sizeCommit.appliedDiscountTier.tierQuantity}+ units
                                  </Typography>
                                }
                                secondary={`Saved ${formatCurrency((sizeCommit.originalPricePerUnit - sizeCommit.pricePerUnit) * sizeCommit.quantity)} with this discount`}
                              />
                            </ListItem>
                          ))
                        }
                      </List>
                    </Box>
                  )}
                  
                  {selectedCommitment.distributorResponse && (
                    <Grid item xs={12}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Distributor Response
                      </Typography>
                      <Paper variant="outlined" sx={{ p: 1.5, mt: 0.5 }}>
                        <Typography variant="body2">
                          {selectedCommitment.distributorResponse}
                        </Typography>
                      </Paper>
                    </Grid>
                  )}
                  
                  {selectedCommitment.modifiedByDistributor && selectedCommitment.modifiedSizeCommitments && (
                    <Grid item xs={12}>
                      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                        Modified by Distributor
                      </Typography>
                      <TableContainer component={Paper} variant="outlined">
                        <Table size="small">
                          <TableHead>
                            <TableRow>
                              <TableCell>Size</TableCell>
                              <TableCell align="right">Quantity</TableCell>
                              <TableCell align="right">Price Each</TableCell>
                              <TableCell align="right">Subtotal</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {selectedCommitment.modifiedSizeCommitments.map((sizeCommit, index) => (
                              <TableRow key={index}>
                                <TableCell>{sizeCommit.size}</TableCell>
                                <TableCell align="right">{sizeCommit.quantity}</TableCell>
                                <TableCell align="right">{formatCurrency(sizeCommit.pricePerUnit)}</TableCell>
                                <TableCell align="right">{formatCurrency(sizeCommit.totalPrice)}</TableCell>
                              </TableRow>
                            ))}
                            <TableRow>
                              <TableCell colSpan={3} align="right" sx={{ fontWeight: 'bold' }}>
                                Modified Total
                              </TableCell>
                              <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                                {formatCurrency(selectedCommitment.modifiedTotalPrice)}
                              </TableCell>
                            </TableRow>
                          </TableBody>
                        </Table>
                      </TableContainer>
                    </Grid>
                  )}
                </Grid>
                
                <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
                  <Button 
                    variant="contained" 
                    onClick={handleCloseDetailModal}
                  >
                    Close
                  </Button>
                </Box>
              </>
            )}
          </Box>
        </Fade>
      </Modal>
    </Container>
  );
};

export default MemberCommitmentDetails; 