import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { useAuth } from '../../middleware/auth';
import {
  Box,
  Paper,
  Typography,
  Grid,
  CircularProgress,
  Alert,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  useTheme,
  useMediaQuery,
  Chip,
  LinearProgress,
  Tooltip,
  Divider,
} from '@mui/material';
import {
  ArrowBack,
  Refresh,
  TrendingUp,
  TrendingDown,
  Schedule,
  People,
  ShoppingCart,
  Timeline,
  Assessment,
  CheckCircle
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import { format, parseISO } from 'date-fns';

const DealAnalytics = () => {
  const { currentUserId, isImpersonating, userRole, isAdmin } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [analyticsData, setAnalyticsData] = useState(null);
  const { dealId } = useParams();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  useEffect(() => {
    if (currentUserId) {
      fetchAnalytics();
    }
  }, [dealId, currentUserId]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);
      
      if (!currentUserId) {
        throw new Error('User ID not found. Please log in again.');
      }

      let endpoint;
      
      // Determine the correct endpoint based on user role and impersonation status
      if (isAdmin && !isImpersonating) {
        // Admin viewing directly (not impersonating)
        endpoint = `/deals/allDeals/deal-analytics-admin/${dealId}`;
      } else if (isImpersonating && userRole === 'distributor') {
        // Admin impersonating a distributor
        endpoint = `/deals/allDeals/deal-analytics/${dealId}`;
      } else if (userRole === 'distributor') {
        // Regular distributor viewing
        endpoint = `/deals/allDeals/deal-analytics/${dealId}`;
      } else {
        // Default fallback
        endpoint = `/deals/allDeals/deal-analytics/${dealId}`;
      }

      const response = await api.get(endpoint);
      setAnalyticsData(response.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching analytics:', err);
      let errorMessage = 'Failed to fetch analytics data. Please try again later.';
      
      if (err.response?.status === 401 || err.response?.status === 403) {
        errorMessage = 'You are not authorized to view this data.';
      } else if (err.message === 'Network Error') {
        errorMessage = 'Network error. Please check your internet connection.';
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value) => {
    if (value === undefined || value === null || isNaN(value)) {
      return '$0.00';
    }
    return `$${(value || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };
  
  const formatNumber = (value) => {
    if (value === undefined || value === null || isNaN(value)) {
      return '0';
    }
    return (value || 0).toLocaleString();
  };
  
  const formatPercent = (value) => {
    if (value === undefined || value === null || isNaN(value)) {
      return '0.0%';
    }
    return `${(value || 0).toFixed(1)}%`;
  };

  // Safely access nested properties
  const safeAccess = (obj, path, defaultValue = 0) => {
    try {
      return path.split('.').reduce((acc, key) => acc[key], obj) ?? defaultValue;
    } catch (e) {
      return defaultValue;
    }
  };

  // Add function to format size information
  const formatSizes = (sizes) => {
    if (!sizes || sizes.length === 0) return 'N/A';
    
    return sizes.map(size => 
      `${size.size}: $${size.discountPrice}`
    ).join(', ');
  };

  // Add function to format discount tiers
  const formatDiscountTiers = (tiers) => {
    if (!tiers || tiers.length === 0) return 'No discount tiers';
    
    return tiers.map(tier => 
      `${tier.tierDiscount}% off at ${tier.tierQuantity}+ units`
    ).join(', ');
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
      </Box>
    );
  }

  if (!analyticsData || !analyticsData.dealInfo) {
    return (
      <Box m={2}>
        <Alert severity="warning">No analytics data available.</Alert>
      </Box>
    );
  }

  // Ensure we have the required data structures
  const hourlyActivity = analyticsData.hourlyActivity || [];
  const dailyPerformance = analyticsData.dailyPerformance || [];
  const overview = analyticsData.overview || {};
  const dealInfo = analyticsData.dealInfo || {};
  const memberInsights = analyticsData.memberInsights || { 
    topMembers: [], 
    quantitySegments: [] 
  };

  return (
    <Box p={3}>
      {/* Header with Deal Progress */}
      <Box display="flex" alignItems="center" mb={3} justifyContent="space-between">
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <IconButton onClick={() => navigate(-1)}>
            <ArrowBack color="primary.contrastText" />
          </IconButton>
          <IconButton onClick={fetchAnalytics}>
            <Refresh color="primary.contrastText" />
          </IconButton>
          {isImpersonating && (
            <Chip 
              label="Admin Mode" 
              color="warning" 
              variant="outlined"
              sx={{ fontWeight: 'bold' }}
            />
          )}
        </Box>
      </Box>

      {/* Key Metrics Grid */}
      <Grid container spacing={3} mb={4}>
        {/* Deal Info Card */}
        <Grid item xs={12}>
          <Card sx={{
            background: `white`,
            color: 'black',
            mb: 2,
            border: '1px solid #e0e0e0',
            borderRadius: '10px',
            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
          }}>
            <CardContent>
              <Grid container spacing={3}>
                <Grid item xs={12} md={4}>
                  <Box>
                    <Typography variant="subtitle2">Deal Details</Typography>
                    <Box mt={1}>
                      <Typography variant="h5">{dealInfo.name}</Typography>
                      <Typography variant="body2">
                        {dealInfo.category} | {dealInfo.distributor}
                      </Typography>
                    </Box>
                  </Box>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Box>
                    <Typography variant="subtitle2">Pricing</Typography>
                    <Box mt={1} display="flex" flexDirection="column" gap={0.5}>
                      {dealInfo.sizes && dealInfo.sizes.length > 0 ? (
                        // Show all sizes if available
                        dealInfo.sizes.map((size, index) => (
                          <Box key={index} display="flex" justifyContent="space-between">
                            <Typography variant="body2">{size.size}:</Typography>
                            <Typography variant="body1">{formatCurrency(size.discountPrice)}</Typography>
                          </Box>
                        ))
                      ) : (
                        // Original pricing if no sizes
                        <>
                          <Box display="flex" justifyContent="space-between">
                            <Typography variant="body2">Original Cost:</Typography>
                            <Typography variant="body1">{formatCurrency(dealInfo.originalCost)}</Typography>
                          </Box>
                          <Box display="flex" justifyContent="space-between">
                            <Typography variant="body2">Discount Price:</Typography>
                            <Typography variant="body1">{formatCurrency(dealInfo.discountPrice)}</Typography>
                          </Box>
                        </>
                      )}
                      <Box display="flex" justifyContent="space-between">
                        <Typography variant="body2">Min Quantity:</Typography>
                        <Typography variant="body1">{formatNumber(dealInfo.minQtyForDiscount)}</Typography>
                      </Box>
                    </Box>
                  </Box>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Box>
                    <Typography variant="subtitle2">Performance</Typography>
                    <Box mt={1} display="flex" flexDirection="column" gap={0.5}>
                      <Box display="flex" justifyContent="space-between">
                        <Typography variant="body2">Total Commitments:</Typography>
                        <Typography variant="body1">{formatNumber(safeAccess(overview, 'totalQuantity'))}</Typography>
                      </Box>
                      {dealInfo.discountTiers && dealInfo.discountTiers.length > 0 && (
                        <Box mt={1}>
                          <Typography variant="body2">Discount Tiers:</Typography>
                          <Box mt={0.5}>
                            {dealInfo.discountTiers.map((tier, index) => (
                              <Chip
                                key={index}
                                size="small"
                                label={`${tier.tierDiscount}% off at ${tier.tierQuantity}+ units`}
                                color="primary"
                                variant="outlined"
                                sx={{ mr: 1, mb: 1 }}
                              />
                            ))}
                          </Box>
                        </Box>
                      )}
                    </Box>
                  </Box>
                </Grid>
              </Grid>
              <Box mt={2}>
                <Typography variant="body2" mb={0.5}>Deal Progress</Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', mb: 2, mt: 2, gap: 1 }}>
                  <LinearProgress
                    variant="determinate"
                    value={Math.min(100, ((safeAccess(overview, 'totalQuantity', 0) || 0) / (dealInfo.minQtyForDiscount || 1)) * 100)}
                    sx={{ height: 6, borderRadius: 2, width: '100%' }}
                  />
                  {((safeAccess(overview, 'totalQuantity', 0) || 0) / (dealInfo.minQtyForDiscount || 1)) * 100 >= 100 && (
                    <CheckCircle
                      sx={{
                        color: 'success.main'
                      }}
                    />
                  )}
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{
            background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
            color: 'white'
          }}>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2}>
                <ShoppingCart color="primary.contrastText" />
                <Box>
                  <Typography variant="h6">Total Revenue</Typography>
                  <Typography variant="h4">{formatCurrency(safeAccess(overview, 'totalRevenue'))}</Typography>
                  <Typography variant="body2">
                    Avg Order: {formatCurrency(safeAccess(overview, 'averageOrderValue'))}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{
            background: `linear-gradient(135deg, ${theme.palette.success.main}, ${theme.palette.success.dark})`,
            color: 'white'
          }}>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2}>
                <Assessment color="primary.contrastText" />
                <Box>
                  <Typography variant="h6">Total Commitments</Typography>
                  <Typography variant="h4">{formatNumber(safeAccess(overview, 'totalQuantity'))}</Typography>
                  <Typography variant="body2">
                    Completion Rate: {formatPercent(safeAccess(overview, 'orderCompletionRate'))}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{
            background: `linear-gradient(135deg, ${theme.palette.warning.main}, ${theme.palette.warning.dark})`,
            color: 'white'
          }}>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2}>
                <People color="primary.contrastText" />
                <Box>
                  <Typography variant="h6">Unique Members</Typography>
                  <Typography variant="h4">{formatNumber(safeAccess(overview, 'totalUniqueMembers'))}</Typography>
                  <Typography variant="body2">
                    Repeat Rate: {formatPercent(safeAccess(overview, 'repeatOrderRate'))}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{
            background: `linear-gradient(135deg, ${theme.palette.info.main}, ${theme.palette.info.dark})`,
            color: 'white'
          }}>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2}>
                <Timeline color="primary.contrastText" />
                <Box>
                  <Typography variant="h6">Peak Performance</Typography>
                  <Typography variant="h4">{formatNumber(safeAccess(overview, 'peakDayOrders'))}</Typography>
                  <Typography variant="body2">
                    Orders/Day (Avg): {formatNumber(safeAccess(overview, 'averageDailyOrders'))}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Member Performance */}
      <Grid container spacing={3}>
        {memberInsights.topMembers.length > 0 && (
          <Grid item xs={12} md={12}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>Top Members</Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Member</TableCell>
                      <TableCell align="right">Quantity</TableCell>
                      <TableCell align="right">Price</TableCell>
                      <TableCell align="right">Sizes</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {memberInsights.topMembers.map((member, index) => (
                      <TableRow key={index} hover>
                        <TableCell>
                          <Box display="flex" alignItems="center" gap={1}>
                            <TrendingUp color="primary.contrastText" />
                            <Box>
                              <Typography variant="body2">{member.name}</Typography>
                              <Typography variant="caption" color="textSecondary">
                                Last order: {format(parseISO(member.lastOrderDate), 'MMM dd, HH:mm')}
                              </Typography>
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell align="right">{formatNumber(member.totalQuantity)}</TableCell>
                        <TableCell align="right">{formatCurrency(member.totalValue)}</TableCell>
                        <TableCell align="right">
                          {member.sizeBreakdown ? (
                            <Tooltip title={
                              <Box>
                                {Object.entries(member.sizeBreakdown).map(([size, quantity], i) => (
                                  <Typography key={i} variant="body2">
                                    {size}: {quantity}
                                  </Typography>
                                ))}
                              </Box>
                            }>
                              <Typography variant="body2">{Object.keys(member.sizeBreakdown).length} size(s)</Typography>
                            </Tooltip>
                          ) : "N/A"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          </Grid>
        )}
      </Grid>
    </Box>
  );
};

export default DealAnalytics; 