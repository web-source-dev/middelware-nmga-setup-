import React, { useEffect, useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  CircularProgress,
  Container,
  Button,
  MenuItem,
  InputLabel,
  Alert
} from '@mui/material';
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
} from 'recharts';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../middleware/auth';
import api from '../../../services/api';
import { 
    Refresh as RefreshIcon, 
    Download as DownloadIcon,
    DataUsage as DataUsageIcon,
    Assignment as AssignmentIcon,
    MonetizationOn as MonetizationOnIcon,
    CheckCircle as CheckCircleIcon,
    Pending as PendingIcon,
    TrendingUp as TrendingUpIcon,
    TrendingDown as TrendingDownIcon,
    ArrowBack,
    Group as GroupIcon,
    Business as BusinessIcon,
} from '@mui/icons-material';
import { FilterSelect, FilterFormControl } from '../../DashBoardComponents/FilterStyles';
import { FilterSection, FilterItem } from '../../DashBoardComponents/FilterSection';
import RecentComit from './RecentComit';
import { AnalyticsSkeleton } from '../../../Components/Skeletons/LoadingSkeletons';

const Analytics = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [commitmentData, setCommitmentData] = useState({
    totalCommitments: 0,
    statusCounts: {},
    timelineData: [],
    totalAmount: 0,
  });
  
  // Get user info from middleware
  const { currentUserId, isImpersonating, userRole, isAdmin } = useAuth();
  
  const [timeRange, setTimeRange] = useState('all');
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [filteredData, setFilteredData] = useState({
    timelineData: [],
    totalCommitments: 0,
    totalAmount: 0,
    statusCounts: {},
  });
  const [view, setView] = useState('all'); // 'all', 'pending', 'approved', 'declined'
  const [error, setError] = useState(null);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  // Add color constants
  const COLORS = {
    pending: '#ffc107',
    approved: '#4caf50',
    declined: '#f44336',
    cancelled: '#9e9e9e',
    primary: '#8884d8',
    secondary: '#82ca9d',
    success: '#4caf50',
    info: '#2196F3',
  };

  // Add these helper functions at the top
  const formatCurrency = (value) => {
    if (value === undefined || value === null || isNaN(value)) {
      return '$0.00';
    }
    return `$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };
  const formatNumber = (value) => {
    if (value === undefined || value === null || isNaN(value)) {
      return '0';
    }
    return value.toLocaleString();
  };

  const [statss, setStats] = useState({ members: 0, distributors: 0 });
  
  useEffect(() => {
    if (currentUserId && isAdmin) {
      fetchUserStats();
      fetchCommitmentData();
    } else if (currentUserId && !isAdmin) {
      // Redirect non-admin users
      navigate('/dashboard');
    }
  }, [currentUserId, isAdmin, navigate]);

  const fetchUserStats = async () => {
    try {
      const response = await api.get('/deals/commit/user-stats');
      setStats(response.data);
    } catch (error) {
      console.error("Error fetching user stats:", error);
    }
  };

  const fetchCommitmentData = async () => {
    try {
      setError(null);
      
      if (!currentUserId) {
        throw new Error('User ID not found. Please log in again.');
      }

      if (!isAdmin) {
        throw new Error('Access denied. Admin privileges required.');
      }

      // Fetch all commitments statistics for admin
      const response = await api.get('/deals/commit/admin/statistics');
      const processedData = processCommitmentData(response.data);
      setCommitmentData(processedData);
      setFilteredData(processedData);
      setLoading(false);
      setIsInitialLoad(false);
    } catch (error) {
      console.error('Error fetching commitment data:', error);
      let errorMessage = 'Failed to load commitment data. Please try again.';
      
      if (error.response?.status === 401 || error.response?.status === 403) {
        errorMessage = 'You are not authorized to view this data. Admin privileges required.';
      } else if (error.message === 'Network Error') {
        errorMessage = 'Network error. Please check your internet connection.';
      }
      
      setError(errorMessage);
      setLoading(false);
      setIsInitialLoad(false);
    }
  };

  const processCommitmentData = (data) => {
    // For admin statistics
    if (data.timelineData) {
      return {
        timelineData: data.timelineData,
        statusCounts: {
          pending: data.pendingCount || 0,
          approved: data.approvedCount || 0,
          declined: data.declinedCount || 0,
          cancelled: 0
        },
        totalCommitments: data.totalCommitments || 0,
        totalAmount: data.totalAmount || 0,
        amountByStatus: {
          pending: data.timelineData.reduce((sum, day) => sum + day.pendingAmount, 0),
          approved: data.timelineData.reduce((sum, day) => sum + day.approvedAmount, 0),
          declined: data.timelineData.reduce((sum, day) => sum + day.declinedAmount, 0),
          cancelled: data.timelineData.reduce((sum, day) => sum + day.cancelledAmount, 0)
        },
        growth: data.growth || { commitments: 0, revenue: 0 },
        topDistributors: data.topDistributors || [],
        totalDistributors: data.totalDistributors || 0,
        totalMembers: data.totalMembers || 0,
        avgTransactionValue: data.avgTransactionValue || 0
      };
    }

    return {
      timelineData: [],
      statusCounts: { pending: 0, approved: 0, declined: 0, cancelled: 0 },
      totalCommitments: 0,
      totalAmount: 0,
      amountByStatus: { pending: 0, approved: 0, declined: 0, cancelled: 0 }
    };
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const filterData = (rawData) => {
    try {
      let filtered = [...rawData];

      // Apply date filter
      if (timeRange !== 'all' || (startDate && endDate)) {
        let start, end;
        
        if (timeRange !== 'custom') {
          end = new Date();
          start = new Date();
          
          switch(timeRange) {
            case '1m':
              start.setMonth(start.getMonth() - 1);
              break;
            case '3m':
              start.setMonth(start.getMonth() - 3);
              break;
            case '6m':
              start.setMonth(start.getMonth() - 6);
              break;
            default:
              break;
          }
        } else {
          start = new Date(startDate);
          end = new Date(endDate);
          end.setHours(23, 59, 59);
        }

        filtered = filtered.filter(item => {
          const itemDate = new Date(item.date);
          return itemDate >= start && itemDate <= end;
        });
      }

      // Apply status filter
      if (statusFilter !== 'all') {
        filtered = filtered.filter(item => item.status === statusFilter);
      }

      // Calculate totals for filtered data
      const totals = filtered.reduce((acc, day) => {
        ['pending', 'approved', 'declined', 'cancelled'].forEach(status => {
          acc[status] = (acc[status] || 0) + day[status];
          acc[`${status}Amount`] = (acc[`${status}Amount`] || 0) + day[`${status}Amount`];
        });
        acc.total = (acc.total || 0) + day.total;
        acc.totalAmount = (acc.totalAmount || 0) + day.totalAmount;
        return acc;
      }, {});

      setFilteredData({
        timelineData: filtered,
        statusCounts: {
          pending: totals.pending || 0,
          approved: totals.approved || 0,
          declined: totals.declined || 0,
          cancelled: totals.cancelled || 0
        },
        totalCommitments: totals.total || 0,
        totalAmount: totals.totalAmount || 0,
        amountByStatus: {
          pending: totals.pendingAmount || 0,
          approved: totals.approvedAmount || 0,
          declined: totals.declinedAmount || 0,
          cancelled: totals.cancelledAmount || 0
        }
      });
    } catch (error) {
      console.error('Error filtering data:', error);
      setError('Error filtering data. Please try again.');
    }
  };

  useEffect(() => {
    if (commitmentData.timelineData.length > 0) {
      filterData(commitmentData.timelineData);
    }
  }, [timeRange, startDate, endDate, statusFilter, commitmentData]);

  // Improve status data processing
  const getStatusData = (data) => {
    const statusData = Object.entries(data.statusCounts)
      .filter(([status]) => status !== 'all')
      .map(([name, value]) => ({
        name: name.toUpperCase(),
        value,
        color: COLORS[name]
      }));

    const statusAmounts = data.timelineData.reduce((acc, item) => {
      Object.entries(item).forEach(([key, value]) => {
        if (['pending', 'approved', 'declined', 'cancelled'].includes(key)) {
          if (!acc[key]) acc[key] = 0;
          acc[key] += item[key] * (item.amount / item.count || 0);
        }
      });
      return acc;
    }, {});

    const statusAmountData = Object.entries(statusAmounts)
      .map(([name, value]) => ({
        name: name.toUpperCase(),
        value: Math.round(value * 100) / 100,
        color: COLORS[name]
      }));

    return { statusData, statusAmountData };
  };

  // Add view filter function
  const getFilteredViewData = (data) => {
    if (view === 'all') return data;
    return {
      ...data,
      timelineData: data.timelineData.filter(item => item.status === view)
    };
  };

  // Update FilterControls component
  const FilterControls = () => (
    <Box mb={3}>
      <FilterSection>
        <FilterItem>
          <FilterFormControl fullWidth>
            <InputLabel>Time Range</InputLabel>
            <FilterSelect
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              label="Time Range"
            >
              <MenuItem value="all">All Time</MenuItem>
              <MenuItem value="7">Last 7 Days</MenuItem>
              <MenuItem value="30">Last 30 Days</MenuItem>
              <MenuItem value="90">Last 90 Days</MenuItem>
            </FilterSelect>
          </FilterFormControl>
        </FilterItem>
        
        <FilterItem>
          <FilterFormControl fullWidth>
            <InputLabel>View</InputLabel>
            <FilterSelect
              value={view}
              onChange={(e) => setView(e.target.value)}
              label="View"
            >
              <MenuItem value="all">All</MenuItem>
              <MenuItem value="pending">Pending</MenuItem>
              <MenuItem value="approved">Approved</MenuItem>
              <MenuItem value="declined">Declined</MenuItem>
            </FilterSelect>
          </FilterFormControl>
        </FilterItem>
      </FilterSection>
    </Box>
  );

  // Create a LoadingOverlay component
  const LoadingOverlay = () => (
    <Box
      sx={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.8)',
        zIndex: 1,
      }}
    >
      <CircularProgress />
    </Box>
  );

  // Update SmallChart component
  const SmallChart = ({ title, children, gridSize = { xs: 12, sm: 6, md: 4 } }) => (
    <Grid item {...gridSize}>
      <Card 
        elevation={2} 
        sx={{ 
          borderRadius: 3,
          transition: 'transform 0.2s, box-shadow 0.2s',
          '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: 6,
          },
          position: 'relative',
        }}
      >
        {loading && <LoadingOverlay />}
        <CardContent sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom color="text.secondary" sx={{ mb: 3, fontSize: '1rem' }}>
            {title}
          </Typography>
          {children}
        </CardContent>
      </Card>
    </Grid>
  );

  // Update chart components with better tooltips and formatting
  const StatusPieChart = ({ data }) => (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={80}
          paddingAngle={5}
          dataKey="value"
          label={({ name, value }) => `${name} (${value})`}
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color || COLORS.primary} />
          ))}
        </Pie>
        <RechartsTooltip 
          formatter={(value, name) => [`${value}`, name]}
          contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.95)', borderRadius: '8px' }}
        />
        <Legend formatter={(value) => value.split(' ')[0]} />
      </PieChart>
    </ResponsiveContainer>
  );

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <Card sx={{ p: 2, boxShadow: 3, backgroundColor: 'rgba(255, 255, 255, 0.95)' }}>
          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
            {formatDate(label)}
          </Typography>
          {payload.map((entry, index) => (
            <Box key={index} sx={{ mt: 1 }}>
              <Typography 
                variant="body2" 
                sx={{ 
                  color: entry.color,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1 
                }}
              >
                <Box 
                  component="span" 
                  sx={{ 
                    width: 8, 
                    height: 8, 
                    borderRadius: '50%', 
                    backgroundColor: entry.color 
                  }} 
                />
                {entry.name}: {' '}
                <strong>
                  {entry.name === 'Amount' ? '$' : ''}{entry.value.toLocaleString()}
                </strong>
              </Typography>
            </Box>
          ))}
        </Card>
      );
    }
    return null;
  };

  // Add refresh functionality
  const handleRefresh = () => {
    setLoading(true);
    fetchCommitmentData();
  };

  // Add auto-refresh every 5 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      if (!isInitialLoad) {
        fetchCommitmentData();
      }
    }, 300000); // 5 minutes

    return () => clearInterval(interval);
  }, [isInitialLoad]);

  // Add EmptyState component
  const EmptyState = ({ message }) => (
    <Box
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      py={4}
    >
      <DataUsageIcon sx={{ 
        fontSize: 64, 
        color: 'text.secondary', 
        mb: 2,
        opacity: 0.5 
      }} />
      <Typography variant="h6" color="text.secondary">
        {message}
      </Typography>
    </Box>
  );

  // Add export function
  const handleExport = () => {
    const csvData = filteredData.timelineData.map(item => ({
      Date: item.date,
      Total: item.total,
      Pending: item.pending,
      Approved: item.approved,
      Declined: item.declined,
      Amount: item.totalAmount,
    }));

    const csvString = [
      Object.keys(csvData[0]),
      ...csvData.map(item => Object.values(item))
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'commitment_data.csv';
    link.click();
  };

  // Add new components
  const StatCard = ({ title, value, subtitle, icon, color }) => (
    <Card 
      elevation={2} 
      sx={{ 
        height: '100%',
        borderRadius: 3,
        transition: 'all 0.3s ease',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: 6,
        },
      }}
    >
      <CardContent sx={{ p: 3 }}>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start">
          <Box>
            <Typography variant="h6" gutterBottom color="text.secondary" sx={{ fontSize: '0.875rem' }}>
              {title}
            </Typography>
            <Typography variant="h4" sx={{ color, fontWeight: 'bold', mb: 1 }}>
              {value}
            </Typography>
            {subtitle && (
              <Typography variant="body2" color="text.secondary">
                {subtitle}
              </Typography>
            )}
          </Box>
          <Box 
            sx={{ 
              backgroundColor: `${color}15`,
              p: 1,
              borderRadius: 2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            {icon}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );

  // Add new admin-specific stat cards
  const AdminStatCards = ({ data }) => (
    <Grid container spacing={3} sx={{ mb: 4 }}>
      <Grid item xs={12} sm={6} md={3}>
        <StatCard
          title="Total Members"
          value={statss.members || 0}
          subtitle="Active users"
          icon={<GroupIcon sx={{ color: COLORS.primary }} />}
          color={COLORS.primary}
        />
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <StatCard
          title="Total Distributors"
          value={statss.distributors || 0}
          subtitle="Active distributors"
          icon={<BusinessIcon sx={{ color: COLORS.secondary }} />}
          color={COLORS.secondary}
        />
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <StatCard
          title="Avg Transaction Value"
          value={formatCurrency(data?.avgTransactionValue || 0)}
          subtitle="Per commitment"
          icon={<MonetizationOnIcon sx={{ color: COLORS.success }} />}
          color={COLORS.success}
        />
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <StatCard
          title="Growth Rate"
          value={`${(data?.growth?.revenue || 0).toFixed(1)}%`}
          subtitle="Revenue growth"
          icon={<TrendingUpIcon sx={{ color: COLORS.info }} />}
          color={COLORS.info}
        />
      </Grid>
    </Grid>
  );

  // If user is not admin, show access denied
  if (currentUserId && !isAdmin) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Card elevation={3} sx={{ p: 3, borderRadius: 2 }}>
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
        </Card>
      </Container>
    );
  }

  if (loading) {
    return <AnalyticsSkeleton />;
  }

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: '#f5f5f5', pt: 3, pb: 6 }}>
      <Container maxWidth="xl">
        <Box sx={{ py: 2 }}>
          {/* Header Section */}
          <Card elevation={0} sx={{ mb: 4, p: 2, backgroundColor: 'transparent' }}>
            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Button
                startIcon={<ArrowBack color='primary.contrastText' />}
                onClick={() => navigate(-1)}
                variant="outlined"
                sx={{ 
                  borderRadius: 2,
                  textTransform: 'none',
                  px: 3
                }}
                color='primary.contrastText'
              >
                Back to Commitments
              </Button>
              <Box display="flex" alignItems="center" gap={2}>
                {error && (
                  <Typography color="error" variant="body2">
                    {error}
                  </Typography>
                )}
                <Button
                  onClick={handleRefresh}
                  startIcon={<RefreshIcon color='primary.contrastText' />}
                  variant="outlined"
                  color="primary.contrastText"
                  disabled={loading}
                  sx={{ borderRadius: 2 }}
                >
                  Refresh
                </Button>
                <Button
                  onClick={handleExport}
                  startIcon={<DownloadIcon color='primary.contrastText' />}
                  variant="outlined"
                  color="primary.contrastText"
                  sx={{ borderRadius: 2 }}
                >
                  Export Data
                </Button>
                <Typography 
                  variant="h4" 
                  component="h1"
                  sx={{ 
                    fontWeight: 'bold',
                    color: 'primary.contrastText'
                  }}
                >
                  Commitment Analytics
                </Typography>
                {isImpersonating && (
                  <Typography variant="caption" sx={{ color: 'warning.main' }}>
                    (Admin Mode)
                  </Typography>
                )}
              </Box>
            </Box>
          </Card>

          {/* Updated Filter Controls */}
          <FilterControls />

          {/* Stats Cards */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="Total Commitments"
                value={formatNumber(filteredData.totalCommitments)}
                subtitle="All time commitments"
                icon={<AssignmentIcon sx={{ color: COLORS.primary }} />}
                color={COLORS.primary}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="Total Amount"
                value={formatCurrency(filteredData.totalAmount)}
                subtitle="Total commitment value"
                icon={<MonetizationOnIcon sx={{ color: COLORS.secondary }} />}
                color={COLORS.secondary}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="Approval Rate"
                value={`${((filteredData.statusCounts.approved || 0) / 
                  (filteredData.totalCommitments || 1) * 100).toFixed(1)}%`}
                subtitle="Of total commitments"
                icon={<CheckCircleIcon sx={{ color: COLORS.approved }} />}
                color={COLORS.approved}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="Pending Rate"
                value={`${((filteredData.statusCounts.pending || 0) / 
                  (filteredData.totalCommitments || 1) * 100).toFixed(1)}%`}
                subtitle="Awaiting response"
                icon={<PendingIcon sx={{ color: COLORS.pending }} />}
                color={COLORS.pending}
              />
            </Grid>
          </Grid>

          <AdminStatCards data={commitmentData} />
          
          <Box sx={{ mt: 4, mb: 4 }}>
            <RecentComit />
          </Box>

          {/* Small Charts */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <SmallChart title="Status Distribution">
              {filteredData.timelineData.length > 0 ? (
                <StatusPieChart data={getStatusData(filteredData).statusData} />
              ) : (
                <EmptyState message="No data available for the selected period" />
              )}
            </SmallChart>
            
            <SmallChart title="Amount by Status">
              {filteredData.timelineData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={Object.entries(filteredData.amountByStatus).map(([status, amount]) => ({
                    name: status.toUpperCase(),
                    value: amount,
                    color: COLORS[status]
                  }))}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis tickFormatter={(value) => `$${value >= 1000 ? `${(value/1000).toFixed(1)}k` : value}`} />
                    <RechartsTooltip
                      content={({ active, payload, label }) => {
                        if (active && payload && payload.length) {
                          return (
                            <Card sx={{ p: 1.5, backgroundColor: 'rgba(255, 255, 255, 0.95)' }}>
                              <Typography variant="subtitle2" color="text.secondary">
                                {label}
                              </Typography>
                              <Typography variant="body2" sx={{ color: payload[0].payload.color }}>
                                {formatCurrency(payload[0].value)}
                              </Typography>
                            </Card>
                          );
                        }
                        return null;
                      }}
                    />
                    <Bar dataKey="value">
                      {Object.entries(filteredData.amountByStatus).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[entry[0]]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <EmptyState message="No data available for the selected period" />
              )}
            </SmallChart>
            
            <SmallChart title="Daily Commitments">
              {filteredData.timelineData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={filteredData.timelineData.slice(-7)}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" tickFormatter={formatDate} />
                    <YAxis />
                    <RechartsTooltip 
                      content={({ active, payload, label }) => {
                        if (active && payload && payload.length) {
                          return (
                            <Card sx={{ p: 1.5, backgroundColor: 'rgba(255, 255, 255, 0.95)' }}>
                              <Typography variant="subtitle2" color="text.secondary">
                                {formatDate(label)}
                              </Typography>
                              <Typography variant="body2" sx={{ color: COLORS[view] || COLORS.primary }}>
                                {view === 'all' ? 'Total: ' : `${view.toUpperCase()}: `}
                                {payload[0].value}
                              </Typography>
                            </Card>
                          );
                        }
                        return null;
                      }}
                    />
                    <Bar 
                      dataKey={view === 'all' ? 'total' : view} 
                      fill={COLORS[view] || COLORS.primary}
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <EmptyState message="No data available for the selected period" />
              )}
            </SmallChart>
          </Grid>

          {/* Main Charts */}
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Card 
                elevation={2} 
                sx={{ 
                  borderRadius: 3,
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: 6,
                  },
                }}
              >
                <CardContent sx={{ p: 3 }}>
                  <Typography variant="h6" gutterBottom color="text.secondary" sx={{ mb: 3, fontSize: '1rem' }}>
                    {view === 'all' ? 'All Commitments' : `${view.toUpperCase()} Commitments`} Over Time
                  </Typography>
                  {filteredData.timelineData.length > 0 ? (
                    <Box height={400}>
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={getFilteredViewData(filteredData).timelineData}>
                          <defs>
                            <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor={COLORS[view] || COLORS.primary} stopOpacity={0.8}/>
                              <stop offset="95%" stopColor={COLORS[view] || COLORS.primary} stopOpacity={0.1}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                          <XAxis 
                            dataKey="date" 
                            tickFormatter={formatDate}
                            tick={{ fontSize: 12 }}
                            interval={0}
                          />
                          <YAxis 
                            tickFormatter={(value) => value >= 1000 ? `${(value / 1000).toFixed(1)}k` : value}
                            tick={{ fontSize: 12 }}
                          />
                          <RechartsTooltip content={<CustomTooltip />} />
                          <Legend />
                          <Area
                            type="monotone"
                            dataKey="total"
                            name={view === 'all' ? 'Total Commitments' : `${view.toUpperCase()} Commitments`}
                            stroke={COLORS[view] || COLORS.primary}
                            strokeWidth={2}
                            fillOpacity={1}
                            fill="url(#colorCount)"
                            activeDot={{ r: 6, strokeWidth: 2 }}
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </Box>
                  ) : (
                    <EmptyState message="No data available for the selected period" />
                  )}
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Box>
      </Container>
    </Box>
  );
};

export default Analytics; 