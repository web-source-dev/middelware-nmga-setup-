import React, { useEffect, useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  CircularProgress,
  Container,
  Chip,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  TextField,
  Tooltip,
  Skeleton,
  Paper,
  TableContainer,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
} from '@mui/material';
import {
  LineChart,
  Line,
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
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
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
    LocalOffer as LocalOfferIcon,
} from '@mui/icons-material';
import { subMonths, isWithinInterval, startOfDay, endOfDay } from 'date-fns';
import { AnalyticsSkeleton } from '../../Components/Skeletons/LoadingSkeletons';

const CommitmentCharts = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [commitmentData, setCommitmentData] = useState({
    totalCommitments: 0,
    statusCounts: {},
    timelineData: [],
    totalAmount: 0,
  });
  const userRole = localStorage.getItem('user_role');
  const [timeRange, setTimeRange] = useState('all');
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const currentUserId = localStorage.getItem('user_id');
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
    secondary: '#82ca9d'
  };

  // Add these helper functions at the top
  const sumByKey = (arr, key) => arr.reduce((sum, item) => sum + (Number(item[key]) || 0), 0);
  const formatCurrency = (value) => `$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const formatNumber = (value) => value.toLocaleString();

  useEffect(() => {
    fetchCommitmentData();
  }, [userId]);
  const commitmentRole = localStorage.getItem('commitmentRole');
  const fetchCommitmentData = async () => {
    try {
      setError(null);
      let response;
       // If viewing from profile management (userId is provided)
       if (userId) {
        if (commitmentRole === 'distributor') {
          response = await axios.get(
            `${process.env.REACT_APP_BACKEND_URL}/deals/commit/distributor-commitments/${userId}`
          );
      } else {
        response = await axios.get(
          `${process.env.REACT_APP_BACKEND_URL}/deals/commit/fetch/${userId}`
        );
      }
    }
    // Normal dashboard view
    else {
      if (userRole !== 'member') {
        response = await axios.get(
          `${process.env.REACT_APP_BACKEND_URL}/deals/commit/distributor-commitments/${currentUserId}`
        );
      } else {
        response = await axios.get(
          `${process.env.REACT_APP_BACKEND_URL}/deals/commit/fetch/${currentUserId}`
        );
      }
    }

      const commitments = response.data;
      const processedData = processCommitmentData(commitments);
      setCommitmentData(processedData);
      setFilteredData(processedData);
      setLoading(false);
      setIsInitialLoad(false);
    } catch (error) {
      console.error('Error fetching commitment data:', error);
      setError('Failed to load commitment data. Please try again.');
      setLoading(false);
      setIsInitialLoad(false);
    }
  };

  const processCommitmentData = (commitments) => {
    // Process data for charts
    const totalAmount = sumByKey(commitments, 'totalPrice');
    const totalQuantity = sumByKey(commitments, 'quantity');
    const totalSavings = commitments.reduce((sum, commitment) => {
        const originalTotal = commitment.quantity * commitment.dealId.originalCost;
        const discountTotal = commitment.quantity * commitment.dealId.discountPrice;
        return sum + (originalTotal - discountTotal);
    }, 0);

    // Track volume discounts from size-specific tiers
    const volumeDiscountSavings = commitments.reduce((sum, commitment) => {
      if (!commitment.sizeCommitments || commitment.sizeCommitments.length === 0) return sum;
      
      return sum + commitment.sizeCommitments.reduce((sizeSum, sc) => {
        if (sc.appliedDiscountTier) {
          // Calculate the difference between regular price and tier discount price
          const regularPrice = sc.originalPricePerUnit || sc.pricePerUnit;
          const tierPrice = sc.appliedDiscountTier.tierDiscount;
          return sizeSum + ((regularPrice - tierPrice) * sc.quantity);
        }
        return sizeSum;
      }, 0);
    }, 0);
    
    // Calculate average price per unit
    const avgPricePerUnit = totalQuantity > 0 ? totalAmount / totalQuantity : 0;

    // Get sizes with discount tiers
    const sizesWithTiers = commitments.reduce((acc, commitment) => {
      if (!commitment.sizeCommitments) return acc;
      
      commitment.sizeCommitments.forEach(sc => {
        if (sc.appliedDiscountTier) {
          if (!acc[sc.size]) {
            acc[sc.size] = {
              size: sc.size,
              totalQuantity: 0,
              totalSavings: 0,
              commitmentCount: 0
            };
          }
          
          acc[sc.size].totalQuantity += sc.quantity;
          acc[sc.size].totalSavings += (sc.originalPricePerUnit - sc.appliedDiscountTier.tierDiscount) * sc.quantity;
          acc[sc.size].commitmentCount += 1;
        }
      });
      
      return acc;
    }, {});

    // Convert to array and sort by total savings
    const sizeDiscountStats = Object.values(sizesWithTiers).sort((a, b) => b.totalSavings - a.totalSavings);

    // Group commitments by date
    const groupedData = commitments.reduce((acc, commitment) => {
      const date = new Date(commitment.createdAt).toISOString().split('T')[0];
      if (!acc[date]) {
        acc[date] = {
          date,
          pending: 0,
          approved: 0,
          declined: 0,
          cancelled: 0,
          pendingAmount: 0,
          approvedAmount: 0,
          declinedAmount: 0,
          cancelledAmount: 0,
          total: 0,
          totalAmount: 0,
        };
      }
      
      const amount = Number(commitment.modifiedTotalPrice || commitment.totalPrice);
      acc[date][commitment.status] += 1;
      acc[date][`${commitment.status}Amount`] += amount;
      acc[date].total += 1;
      acc[date].totalAmount += amount;
      
      return acc;
    }, {});

    // Create timeline data with last 30 days
    const timelineData = Array.from({ length: 30 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (29 - i));
      const dateStr = date.toISOString().split('T')[0];
      
      return {
        date: dateStr,
        ...(groupedData[dateStr] || {
          pending: 0,
          approved: 0,
          declined: 0,
          cancelled: 0,
          pendingAmount: 0,
          approvedAmount: 0,
          declinedAmount: 0,
          cancelledAmount: 0,
          total: 0,
          totalAmount: 0,
        })
      };
    });

    // Calculate overall totals and status counts
    const totals = timelineData.reduce((acc, day) => {
      ['pending', 'approved', 'declined', 'cancelled'].forEach(status => {
        acc[status] = (acc[status] || 0) + day[status];
        acc[`${status}Amount`] = (acc[`${status}Amount`] || 0) + day[`${status}Amount`];
      });
      acc.total = (acc.total || 0) + day.total;
      acc.totalAmount = (acc.totalAmount || 0) + day.totalAmount;
      return acc;
    }, {});

    return {
      timelineData,
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
      },
      volumeDiscountSavings,
      sizeDiscountStats
    };
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'warning',
      approved: 'success',
      declined: 'error',
      cancelled: 'error'
    };
    return colors[status] || 'default';
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

      // Apply status filter if needed
      if (view !== 'all') {
        filtered = filtered.map(item => ({
          ...item,
          total: item[view],
          totalAmount: item[`${view}Amount`]
        }));
      }

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
    <Card elevation={2} sx={{ mb: 4, p: 2, borderRadius: 3 }}>
      <Box 
        display="flex" 
        flexWrap="wrap" 
        gap={2} 
        justifyContent="space-between"
        alignItems="center"
      >
        <Box display="flex" gap={2} flexWrap="wrap" alignItems="center">
          <FormControl sx={{ minWidth: 150 }}>
            <InputLabel>Time Range</InputLabel>
            <Select
              value={timeRange}
              label="Time Range"
              onChange={(e) => setTimeRange(e.target.value)}
              size="small"
            >
              <MenuItem value="all">All Time</MenuItem>
              <MenuItem value="1m">Last Month</MenuItem>
              <MenuItem value="3m">Last 3 Months</MenuItem>
              <MenuItem value="6m">Last 6 Months</MenuItem>
              <MenuItem value="custom">Custom Range</MenuItem>
            </Select>
          </FormControl>

          {timeRange === 'custom' && (
            <Box display="flex" gap={2}>
              <TextField
                type="date"
                label="Start Date"
                value={startDate || ''}
                onChange={(e) => setStartDate(e.target.value)}
                size="small"
                InputLabelProps={{ shrink: true }}
              />
              <TextField
                type="date"
                label="End Date"
                value={endDate || ''}
                onChange={(e) => setEndDate(e.target.value)}
                size="small"
                InputLabelProps={{ shrink: true }}
              />
            </Box>
          )}
        </Box>

        <Box display="flex" gap={1}>
          {['all', 'pending', 'approved', 'declined'].map((status) => (
            <Tooltip 
              key={status}
              title={`View ${status === 'all' ? 'all commitments' : status + ' commitments'}`}
            >
              <Chip
                label={status.toUpperCase()}
                color={status === view ? getStatusColor(status === 'all' ? 'primary' : status) : 'default'}
                onClick={() => setView(status)}
                sx={{ 
                  fontWeight: 'medium',
                  cursor: 'pointer',
                  minWidth: 100
                }}
              />
            </Tooltip>
          ))}
        </Box>
      </Box>
    </Card>
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

  // Add BarChart component
  const StatusBarChart = ({ data }) => (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
        <XAxis 
          dataKey="name" 
          tick={{ fontSize: 12 }}
          interval={0}
        />
        <YAxis 
          tick={{ fontSize: 12 }}
          tickFormatter={(value) => value >= 1000 ? `${(value / 1000).toFixed(1)}k` : value}
        />
        <RechartsTooltip
          content={({ active, payload, label }) => {
            if (active && payload && payload.length) {
              return (
                <Card sx={{ p: 1.5, boxShadow: 3, backgroundColor: 'rgba(255, 255, 255, 0.95)' }}>
                  <Typography variant="subtitle2" color="text.secondary">
                    {label}
                  </Typography>
                  <Typography variant="body2" sx={{ color: payload[0].color, fontWeight: 'bold' }}>
                    {formatCurrency(payload[0].value)}
                  </Typography>
                </Card>
              );
            }
            return null;
          }}
        />
        <Bar 
          dataKey="value" 
          radius={[4, 4, 0, 0]}
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );

  const chartConfig = {
    count: {
      gradient: {
        id: 'colorCount',
        color: '#8884d8',
      },
      areaProps: {
        stroke: '#8884d8',
        fill: 'url(#colorCount)',
      },
    },
    amount: {
      gradient: {
        id: 'colorAmount',
        color: '#82ca9d',
      },
      areaProps: {
        stroke: '#82ca9d',
        fill: 'url(#colorAmount)',
      },
    },
  };

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

  const InsightCard = ({ title, value, trend, color }) => (
    <Card elevation={2} sx={{ p: 2, height: '100%' }}>
      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
        {title}
      </Typography>
      <Typography variant="h4" sx={{ color, fontWeight: 'bold' }}>
        {value}
      </Typography>
      {trend && (
        <Typography variant="caption" sx={{ color: trend > 0 ? 'success.main' : 'error.main' }}>
          {trend > 0 ? '↑' : '↓'} {Math.abs(trend)}% vs last period
        </Typography>
      )}
    </Card>
  );

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

  // Add trend calculation helper
  const calculateTrend = (currentData, previousData) => {
    if (!previousData || previousData === 0) return 0;
    return ((currentData - previousData) / previousData * 100).toFixed(1);
  };

  // Add this new component to display size-specific discount information
  const SizeDiscountCard = ({ data }) => {
    if (!data || data.length === 0) {
      return (
        <Paper 
          elevation={0} 
          sx={{ 
            p: 3, 
            height: '100%', 
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            bgcolor: 'background.paper',
            borderRadius: 2,
            border: '1px solid',
            borderColor: 'divider'
          }}
        >
          <Typography variant="subtitle1" color="text.secondary" align="center">
            No size-specific discount tiers applied yet
          </Typography>
        </Paper>
      );
    }

    return (
      <Paper 
        elevation={0} 
        sx={{ 
          p: 3, 
          height: '100%', 
          bgcolor: 'background.paper',
          borderRadius: 2,
          border: '1px solid',
          borderColor: 'divider'
        }}
      >
        <Typography variant="h6" gutterBottom fontWeight="500">
          Size-Specific Volume Discounts
        </Typography>
        
        <TableContainer sx={{ maxHeight: 240 }}>
          <Table size="small" stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell>Size</TableCell>
                <TableCell align="right">Total Qty</TableCell>
                <TableCell align="right">Commitments</TableCell>
                <TableCell align="right">Savings</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {data.map((size, index) => (
                <TableRow key={index} hover>
                  <TableCell component="th" scope="row">{size.size}</TableCell>
                  <TableCell align="right">{formatNumber(size.totalQuantity)}</TableCell>
                  <TableCell align="right">{size.commitmentCount}</TableCell>
                  <TableCell align="right">{formatCurrency(size.totalSavings)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    );
  };

  if (loading) {
    return (
      <Box sx={{ width: '100%' }}>
        <Container maxWidth="xl">
          <Box sx={{ mb: 4 }}>
            <Skeleton variant="text" sx={{ fontSize: '2rem', mb: 2 }} />
            <Grid container spacing={3}>
              {[...Array(4)].map((_, index) => (
                <Grid item xs={12} sm={6} md={3} key={index}>
                  <Card>
                    <CardContent>
                      <Skeleton variant="text" sx={{ fontSize: '1.25rem', mb: 1 }} />
                      <Skeleton variant="text" sx={{ fontSize: '2rem' }} />
                      <Skeleton variant="text" width="60%" />
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Box>
          <AnalyticsSkeleton />
        </Container>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: '#f5f5f5', pt: 3, pb: 6 }}>
      <Container maxWidth="xl">
        <Box sx={{ py: 2 }}>
          {/* Header Section */}
          <Card elevation={0} sx={{ mb: 4, p: 2, backgroundColor: 'transparent' }}>
            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Button
                startIcon={<ArrowBack />}
                onClick={() => navigate(-1)}
                variant="outlined"
                sx={{ 
                  borderRadius: 2,
                  textTransform: 'none',
                  px: 3
                }}
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
                  startIcon={<RefreshIcon />}
                  variant="outlined"
                  color="primary"
                  disabled={loading}
                  sx={{ borderRadius: 2 }}
                >
                  Refresh
                </Button>
                <Button
                  onClick={handleExport}
                  startIcon={<DownloadIcon />}
                  variant="outlined"
                  color="primary"
                  sx={{ borderRadius: 2 }}
                >
                  Export Data
                </Button>
                <Typography 
                  variant="h4" 
                  component="h1"
                  sx={{ 
                    fontWeight: 'bold',
                    color: 'primary.main'
                  }}
                >
                  Commitment Analytics
                </Typography>
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
                            interval="preserveStartEnd"
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

          {/* Volume Discount Analysis */}
          {filteredData.volumeDiscountSavings > 0 && (
            <>
              <Grid item xs={12}>
                <Box sx={{ mt: 4, mb: 2 }}>
                  <Typography variant="h5" fontWeight="medium">
                    Volume Discount Analysis
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Details of savings from size-specific volume discount tiers
                  </Typography>
                </Box>
              </Grid>
              
              <Grid item xs={12} md={4}>
                <StatCard 
                  title="Volume Discount Savings" 
                  value={formatCurrency(filteredData.volumeDiscountSavings)} 
                  subtitle="Total savings from volume discount tiers"
                  icon={<LocalOfferIcon />} 
                  color="success.main"
                />
              </Grid>
              
              <Grid item xs={12} md={8}>
                <SizeDiscountCard data={filteredData.sizeDiscountStats || []} />
              </Grid>
            </>
          )}
        </Box>
      </Container>
    </Box>
  );
};

export default CommitmentCharts; 