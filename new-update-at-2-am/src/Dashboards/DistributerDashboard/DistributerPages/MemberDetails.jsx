import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../../services/api';
import { useAuth } from '../../../middleware/auth';
import {
  Box,
  Typography,
  Paper,
  Card,
  CardContent,
  Avatar,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Chip,
  Button,
  Grid,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  CircularProgress,
  Alert,
  Tabs,
  Tab,
  Divider,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Person as PersonIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  LocationOn as LocationIcon,
  ShoppingCart as ShoppingCartIcon,
  AttachMoney as MoneyIcon,
  CalendarToday as CalendarIcon,
  Assignment as AssignmentIcon,
  Store as StoreIcon,
  ExpandMore as ExpandMoreIcon,
  Visibility as VisibilityIcon
} from '@mui/icons-material';
import { format } from 'date-fns';

const MemberDetails = () => {
  const { currentUserId, isImpersonating } = useAuth();
  const { memberId } = useParams();
  const navigate = useNavigate();
  const [member, setMember] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState(0);
  
  const distributorId = currentUserId;

  useEffect(() => {
    const fetchMemberDetails = async () => {
      try {
        setLoading(true);
        console.log('Fetching member details for:', memberId, 'distributor:', distributorId);
        
        const response = await api.get(`/deals/member-details/${memberId}`);
        
        console.log('Member details response:', response.data);
        setMember(response.data);
        setError(null);
      } catch (err) {
        console.error('Error fetching member details:', err);
        setError(err.response?.data?.error || 'Failed to fetch member details. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    if (memberId && distributorId) {
      fetchMemberDetails();
    }
  }, [memberId, distributorId]);

  const getStatusColor = (status) => {
    const statusColors = {
      active: 'success',
      inactive: 'error',
      pending: 'warning',
      approved: 'success',
      declined: 'error',
      cancelled: 'default'
    };
    return statusColors[status?.toLowerCase()] || 'default';
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box m={2}>
        <Alert severity="error">{error}</Alert>
        <Button 
          variant="contained" 
          onClick={() => navigate('/dashboard/distributor/Stores/Contacts')}
          sx={{ mt: 2,color: 'primary.contrastText',backgroundColor: 'primary.main' }}
        >
          Back to Members
        </Button>
      </Box>
    );
  }

  if (!member) {
    return (
      <Box m={2}>
        <Alert severity="warning">Member not found</Alert>
        <Button 
          variant="contained" 
            onClick={() => navigate('/dashboard/distributor/Stores/Contacts')}
          sx={{ mt: 2,color: 'primary.contrastText',backgroundColor: 'primary.main' }}
        >
          Back to Members
        </Button>
      </Box>
    );
  }

  return (
    <Box p={3}>
      {/* Header */}
          <Button
            variant="outlined"
            startIcon={<ArrowBackIcon sx={{ color: 'primary.contrastText' }} />}
            onClick={() => navigate('/dashboard/distributor/Stores/Contacts')}
            sx={{ color: 'primary.contrastText',borderColor: 'primary.contrastText',mb: 3 }}
          >
            Back to Members
          </Button>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box display="flex" alignItems="center" gap={2}>
          <Avatar sx={{ bgcolor: 'primary.main', width: 56, height: 56,color: 'primary.contrastText' }}>
            {member.businessName ? member.businessName.charAt(0) : member.name?.charAt(0) || 'M'}
          </Avatar>
          <Box>
            <Typography variant="h4" fontWeight={600} color="primary.contrastText">
              {member.businessName || member.name || 'Unknown Member'}
            </Typography>
            <Typography variant="body1" color="text.secondary">
              {member.contactPerson || 'No contact person'}
            </Typography>
          </Box>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          {isImpersonating && (
            <Chip 
              label="Admin Mode" 
              color="warning" 
              variant="outlined"
              sx={{ fontWeight: 'bold' }}
            />
          )}
          <Chip
            label={member.status || 'active'}
            color={getStatusColor(member.status)}
            size="large"
          />
        </Box>
      </Box>

      {/* Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)}
          sx={{ color: 'primary.contrastText' ,
            '& .MuiTabs-indicator': {
              backgroundColor: 'primary.main'
            },
            '& .MuiTab-root.Mui-selected': {
              color: 'primary.contrastText',
            }
          }}

          >
          <Tab label="Profile" sx={{ color: 'primary.contrastText' }} />
          <Tab label="Commitments" sx={{ color: 'primary.contrastText' }} />
          <Tab label="Supplier Info" sx={{ color: 'primary.contrastText' }} />
          <Tab label="Analytics" sx={{ color: 'primary.contrastText' }} />
        </Tabs>
      </Paper>

      {/* Tab Content */}
      {activeTab === 0 && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>Basic Information</Typography>
                <List>
                  <ListItem>
                    <ListItemAvatar>
                      <Avatar sx={{ bgcolor: 'primary.main',color: 'primary.contrastText' }}>
                        {member.businessName ? member.businessName.charAt(0) : member.name?.charAt(0) || 'M'}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={member.businessName || member.name || 'Unknown Member'}
                      secondary="Business Name"
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemAvatar>
                      <PersonIcon color="primary" sx={{ color: 'primary.contrastText' }} />
                    </ListItemAvatar>
                    <ListItemText
                      primary={member.contactPerson || 'Not specified'}
                      secondary="Contact Person"
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemAvatar>
                      <EmailIcon color="primary" sx={{ color: 'primary.contrastText' }} />
                    </ListItemAvatar>
                    <ListItemText
                      primary={member.email || 'No email'}
                      secondary="Email Address"
                    />
                  </ListItem>
                  {member.phone && (
                    <ListItem>
                      <ListItemAvatar>
                        <PhoneIcon color="primary" sx={{ color: 'primary.contrastText' }} />
                      </ListItemAvatar>
                      <ListItemText
                        primary={member.phone}
                        secondary="Phone Number"
                      />
                    </ListItem>
                  )}
                  {member.address && (
                    <ListItem>
                      <ListItemAvatar>
                        <LocationIcon color="primary" sx={{ color: 'primary.contrastText' }} />
                      </ListItemAvatar>
                      <ListItemText
                        primary={member.address}
                        secondary="Address"
                      />
                    </ListItem>
                  )}
                  <ListItem>
                    <ListItemAvatar>
                      <AssignmentIcon color="primary" sx={{ color: 'primary.contrastText' }} />
                    </ListItemAvatar>
                    <ListItemText
                      primary={member.role || 'member'}
                      secondary="Role"
                    />
                  </ListItem>
                </List>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>Commitment Summary</Typography>
                <List>
                  <ListItem>
                    <ListItemAvatar>
                      <ShoppingCartIcon color="primary" sx={{ color: 'primary.contrastText' }} />
                    </ListItemAvatar>
                    <ListItemText
                      primary={member.totalCommitments || 0}
                      secondary="Total Commitments"
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemAvatar>
                      <MoneyIcon color="success" sx={{ color: 'primary.contrastText' }} />
                    </ListItemAvatar>
                    <ListItemText
                      primary={`$${(member.totalAmount || 0).toFixed(2)}`}
                      secondary="Total Amount"
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemAvatar>
                      <CalendarIcon color="primary" sx={{ color: 'primary.contrastText' }} />
                    </ListItemAvatar>
                    <ListItemText
                      primary={member.lastCommitmentDate ? format(new Date(member.lastCommitmentDate), 'PP') : 'No commitments'}
                      secondary="Last Commitment"
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemAvatar>
                      <AssignmentIcon color="primary" sx={{ color: 'primary.contrastText' }} />
                    </ListItemAvatar>
                    <ListItemText
                      primary={member.status || 'active'}
                      secondary="Current Status"
                    />
                  </ListItem>
                </List>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {activeTab === 1 && (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>Recent Commitments</Typography>
            {member.commitments && member.commitments.length > 0 ? (
              member.commitments.map((commitment, index) => (
                <Accordion key={index}>
                  <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: 'primary.contrastText' }} />}>
                    <Box display="flex" justifyContent="space-between" alignItems="center" width="100%">
                      <Typography variant="subtitle1" fontWeight={600}>
                        {commitment.dealName || 'Unknown Deal'}
                      </Typography>
                      <Box display="flex" gap={2}>
                        <Chip
                          label={commitment.status || 'pending'}
                          color={getStatusColor(commitment.status)}
                          size="small"
                        />
                        <Typography variant="body2" color="text.secondary">
                          ${(commitment.totalPrice || 0).toFixed(2)}
                        </Typography>
                      </Box>
                    </Box>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Grid container spacing={2}>
                      <Grid item xs={12} md={6}>
                        <Typography variant="subtitle2" gutterBottom>Size Details:</Typography>
                        {commitment.sizeCommitments && commitment.sizeCommitments.length > 0 ? (
                          commitment.sizeCommitments.map((sizeCommit, idx) => (
                            <Box key={idx} display="flex" justifyContent="space-between" mb={1}>
                              <Typography variant="body2">
                                {sizeCommit.size}: {sizeCommit.quantity} × ${(sizeCommit.pricePerUnit || 0).toFixed(2)}
                              </Typography>
                              <Typography variant="body2" fontWeight={600}>
                                ${(sizeCommit.totalPrice || 0).toFixed(2)}
                              </Typography>
                            </Box>
                          ))
                        ) : (
                          <Typography variant="body2" color="text.secondary">
                            No size details available
                          </Typography>
                        )}
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <Typography variant="subtitle2" gutterBottom>Commitment Details:</Typography>
                        <Box display="flex" justifyContent="space-between" mb={1}>
                          <Typography variant="body2">Total Quantity:</Typography>
                          <Typography variant="body2" fontWeight={600}>
                            {commitment.sizeCommitments ? 
                              commitment.sizeCommitments.reduce((sum, item) => sum + (item.quantity || 0), 0) : 
                              commitment.quantity || 0
                            }
                          </Typography>
                        </Box>
                        <Box display="flex" justifyContent="space-between" mb={1}>
                          <Typography variant="body2">Total Price:</Typography>
                          <Typography variant="body2" fontWeight={600} color="success.main">
                            ${(commitment.totalPrice || 0).toFixed(2)}
                          </Typography>
                        </Box>
                        <Box display="flex" justifyContent="space-between" mb={1}>
                          <Typography variant="body2">Date:</Typography>
                          <Typography variant="body2">
                            {commitment.createdAt ? format(new Date(commitment.createdAt), 'PP') : 'Unknown date'}
                          </Typography>
                        </Box>
                        {commitment.distributorResponse && (
                          <Box display="flex" justifyContent="space-between" mb={1}>
                            <Typography variant="body2">Response:</Typography>
                            <Typography variant="body2" color="primary">
                              {commitment.distributorResponse}
                            </Typography>
                          </Box>
                        )}
                      </Grid>
                    </Grid>
                  </AccordionDetails>
                </Accordion>
              ))
            ) : (
              <Typography variant="body2" color="text.secondary" textAlign="center">
                No commitments found for this member
              </Typography>
            )}
          </CardContent>
        </Card>
      )}

      {activeTab === 2 && (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>Supplier Information</Typography>
            {member.assignedSupplier ? (
              <List>
                <ListItem>
                  <ListItemAvatar>
                    <StoreIcon color="primary" sx={{ color: 'primary.contrastText' }} />
                  </ListItemAvatar>
                  <ListItemText
                    primary={member.assignedSupplier.name}
                    secondary="Supplier Name"
                  />
                </ListItem>
                <ListItem>
                  <ListItemAvatar>
                    <EmailIcon color="primary" sx={{ color: 'primary.contrastText' }} />
                  </ListItemAvatar>
                  <ListItemText
                    primary={member.assignedSupplier.email}
                    secondary="Supplier Email"
                  />
                </ListItem>
                <ListItem>
                  <ListItemAvatar>
                    <CalendarIcon color="primary" sx={{ color: 'primary.contrastText' }} />
                  </ListItemAvatar>
                  <ListItemText
                    primary={member.assignedSupplier.assignedAt ? format(new Date(member.assignedSupplier.assignedAt), 'PP') : 'N/A'}
                    secondary="Assigned Date"
                  />
                </ListItem>
              </List>
            ) : (
              <Box textAlign="center" py={4}>
                <StoreIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  No Supplier Assigned
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  This member has not been assigned to any supplier yet.
                </Typography>
                <Button
                  variant="contained"
                  sx={{ mt: 2,color: 'primary.contrastText',backgroundColor: 'primary.main' }}
                  onClick={() => navigate(`/dashboard/distributor/assign-supplier/${member._id}`)}
                >
                  Assign Supplier
                </Button>
              </Box>
            )}
          </CardContent>
        </Card>
      )}

      {activeTab === 3 && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="subtitle1" gutterBottom>Commitment Trends</Typography>
                {member.commitmentsByStatus ? (
                  <Box>
                    {Object.entries(member.commitmentsByStatus).map(([status, commitments]) => (
                      <Box key={status} display="flex" justifyContent="space-between" mb={1}>
                        <Typography variant="body2" textTransform="capitalize">
                          {status}:
                        </Typography>
                        <Typography variant="body2" fontWeight={600}>
                          {commitments.length} commitments
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    No analytics data available
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="subtitle1" gutterBottom>Performance Metrics</Typography>
                <Box>
                  <Box display="flex" justifyContent="space-between" mb={1}>
                    <Typography variant="body2">Average Commitment Value:</Typography>
                    <Typography variant="body2" fontWeight={600}>
                      ${member.totalCommitments > 0 ? (member.totalAmount / member.totalCommitments).toFixed(2) : '0.00'}
                    </Typography>
                  </Box>
                  <Box display="flex" justifyContent="space-between" mb={1}>
                    <Typography variant="body2">Total Revenue:</Typography>
                    <Typography variant="body2" fontWeight={600} color="success.main">
                      ${(member.totalAmount || 0).toFixed(2)}
                    </Typography>
                  </Box>
                  <Box display="flex" justifyContent="space-between" mb={1}>
                    <Typography variant="body2">Member Since:</Typography>
                    <Typography variant="body2">
                      {member.createdAt ? format(new Date(member.createdAt), 'PP') : 'Unknown'}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}
    </Box>
  );
};

export default MemberDetails; 