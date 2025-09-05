import React, { useState, useEffect } from 'react';
import api from '../../../services/api';
import { useAuth } from '../../../middleware/auth';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  styled,
  Chip,
} from '@mui/material';
import {
  TrendingUp,
  Visibility,
  ShoppingCart,
  Assessment,
  PendingActions,
} from '@mui/icons-material';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
} from 'recharts';
import TopMembersForDistributor from '../../../TopMembersDistributer/TopMembers.forDistributor';

// Soft color palette
const SOFT_COLORS = [
  '#8CB9BD',  // Soft teal
  '#ABC4AA',  // Soft sage
  '#E3B7A0',  // Soft terracotta
  '#FFCACC',  // Soft pink
  '#BFD8B8'   // Soft mint
];

const CARD_COLORS = {
  deals: '#4361ee',     // Blue
  sales: '#2ec4b6',     // Teal
  pending: '#ff9f1c',   // Orange
  views: '#7209b7'      // Purple
};

const StyledCard = styled(Card)(({ theme }) => ({
  background: theme.palette.background.paper,
  borderRadius: '16px',
  padding:'20px',
  boxShadow: theme.shadows[1],
  transition: 'transform 0.2s ease, box-shadow 0.2s ease',
  '&:hover': {
    transform: 'translateY(-4px)',
    boxShadow: theme.shadows[4],
  }
}));

const StatCard = ({ title, value, icon, color }) => (
  <StyledCard>
    <CardContent>
      <Box display="flex" justifyContent="space-between" alignItems="center">
        <Box>
          <Typography variant="subtitle1" component="div" color="text.secondary">
            {title}
          </Typography>
          <Typography variant="h4" sx={{ color: color, fontWeight: 600 }}>
            {value}
          </Typography>
        </Box>
        <Box 
          sx={{ 
            backgroundColor: `${color}15`,
            borderRadius: '12px',
            padding: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          {React.cloneElement(icon, { sx: { fontSize: 32, color: color } })}
        </Box>
      </Box>
    </CardContent>
  </StyledCard>
);

const DefualtPage = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [salesData, setSalesData] = useState([]);
  const [categoryData, setCategoryData] = useState([]);
  
  // Get user data from middleware
  const { currentUserId, isImpersonating, userRole } = useAuth();
  const distributorId = currentUserId;

  useEffect(() => {
    const fetchDashboardStats = async () => {
      try {
        const response = await api.get(`/deals/default/dashboard-stats`);
        setStats(response.data);
        
        // Use real sales data from backend
        setSalesData(response.data.salesData);
        
        // Use real category data from backend
        setCategoryData(response.data.categoryDistribution);

        setLoading(false);
      } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        setLoading(false);
      }
    };

    if (distributorId) {
      fetchDashboardStats();
    }
  }, [distributorId]);

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Format date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Format status
  const getStatusColor = (status) => {
    const statusColors = {
      active: '#4caf50',
      inactive: '#f44336',
      pending: '#ff9800',
      approved: '#4caf50',
      declined: '#f44336',
      cancelled: '#9e9e9e'
    };
    return statusColors[status.toLowerCase()] || '#666';
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box p={3}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
        <Typography variant="h4" gutterBottom sx={{ color: '#2C3E50', fontWeight: 600 }}>
          Welcome to Your Dashboard
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

      <Grid container spacing={3} mb={6}>
        <Grid item xs={12} sm={6} md={3} sx={{ mb: 5 }}>
          <StatCard
            title="Active Deals"
            value={stats?.activeDeals || 0}
            icon={<Assessment sx={{ fontSize: 40 }} />}
            color={CARD_COLORS.deals}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3} sx={{ mb: 5 }}>
          <StatCard
            title="Total $ Commitments"
            value={formatCurrency(stats?.totalSales || 0)}
            icon={<TrendingUp sx={{ fontSize: 40 }} />}
            color={CARD_COLORS.sales}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3} sx={{ mb: 5 }}>
          <StatCard
            title="Pending Commitments"
            value={stats?.pendingCommitments || 0}
            icon={<PendingActions sx={{ fontSize: 40 }} />}
            color={CARD_COLORS.pending}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3} sx={{ mb: 5 }}>
          <StatCard
            title="Total Views"
            value={stats?.totalViews?.toLocaleString() || 0}
            icon={<Visibility sx={{ fontSize: 40 }} />}
            color={CARD_COLORS.views}
          />
        </Grid>
      </Grid>
        <Grid item xs={12} md={12} sx={{ mb: 4 ,mt: 4}}>
          <TopMembersForDistributor />
      </Grid>

      <Grid container spacing={3} mb={10}>
        <Grid item xs={12} md={8} sx={{ mb: 5 }}>
          <StyledCard>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ color: '#2C3E50' }}>
                Commitments Trend
              </Typography>
              <Box height={300} mb={5}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={salesData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E0E0E0" />
                    <XAxis dataKey="month" stroke="#666" />
                    <YAxis stroke="#666" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                      }}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="sales"
                      stroke={SOFT_COLORS[0]}
                      strokeWidth={2}
                      dot={{ r: 4, fill: SOFT_COLORS[0] }}
                    />
                    <Line
                      type="monotone"
                      dataKey="views"
                      stroke={SOFT_COLORS[1]}
                      strokeWidth={2}
                      dot={{ r: 4, fill: SOFT_COLORS[1] }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </StyledCard>
        </Grid>

        <Grid item xs={12} md={4} sx={{ mb: 5 }}>
          <StyledCard>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ color: '#2C3E50' }}>
                Category Distribution
              </Typography>
              <Box height={300} mb={5}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={SOFT_COLORS[index % SOFT_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.25)'
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </StyledCard>
        </Grid>

        <Grid item xs={12} md={12} sx={{mt: 6}}>
          <StyledCard>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ color: '#2C3E50' }}>
                Monthly Performance Metrics
              </Typography>
              <Box height={300}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={salesData}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#E0E0E0" />
                    <XAxis dataKey="month" stroke="#666" />
                    <YAxis stroke="#666" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                      }}
                    />
                    <Legend />
                    <Bar dataKey="sales" fill={SOFT_COLORS[0]} name="Sales" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="views" fill={SOFT_COLORS[1]} name="Views" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </StyledCard>
        </Grid>
      </Grid>

      <Grid container spacing={3} mb={10}>
        <Grid item xs={12} md={6} sx={{ mb: 5 }}>
          <StyledCard>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ color: '#2C3E50' }}>
                Recent Deals
              </Typography>
              <TableContainer component={Paper} sx={{ boxShadow: 'none', minWidth: { xs: '100%', sm: '300px' } }}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Deal Name</TableCell>
                      <TableCell>Price</TableCell>
                      <TableCell>Total Sold</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Date</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {stats?.recentDeals?.map((deal) => (
                      <TableRow key={deal._id}>
                        <TableCell>{deal.name}</TableCell>
                        <TableCell>{formatCurrency(deal.discountPrice)}</TableCell>
                        <TableCell>{deal.totalSold}</TableCell>
                        <TableCell>
                          <Box
                            sx={{
                              backgroundColor: getStatusColor(deal.status),
                              color: 'white',
                              padding: '3px 10px',
                              borderRadius: '12px',
                              display: 'inline-block',
                              fontSize: '0.75rem'
                            }}
                          >
                            {deal.status}
                          </Box>
                        </TableCell>
                        <TableCell>{formatDate(deal.createdAt)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </StyledCard>
        </Grid>

        <Grid item xs={12} md={6} sx={{ mb: 5 }}>
          <StyledCard>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ color: '#2C3E50' }}>
                Recent Commitments
              </Typography>
              <TableContainer component={Paper} sx={{ boxShadow: 'none',minWidth: { xs: '100%', sm: '300px' } }}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>User</TableCell>
                      <TableCell>Deal</TableCell>
                      <TableCell>Quantity</TableCell>
                      <TableCell>Amount</TableCell>
                      <TableCell>Status</TableCell>
                      {/* <TableCell>Payment</TableCell> */}
                      <TableCell>Date</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {stats?.recentCommitments?.map((commitment) => (
                      <TableRow key={commitment._id}>
                        <TableCell>
                          <Box>
                            <Typography variant="body2">{commitment.userName}</Typography>
                            <Typography variant="caption" color="text.secondary">
                              {commitment.userContact}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>{commitment.dealName}</TableCell>
                        <TableCell>{commitment.quantity}</TableCell>
                        <TableCell>{formatCurrency(commitment.totalPrice)}</TableCell>
                        <TableCell>
                          <Box
                            sx={{
                              backgroundColor: getStatusColor(commitment.status),
                              color: 'white',
                              padding: '3px 10px',
                              borderRadius: '12px',
                              display: 'inline-block',
                              fontSize: '0.75rem',
                              boxShadow: "0 0 0.4 #ffffff"
                            }}
                          >
                            {commitment.status}
                          </Box>
                        </TableCell>
                        {/* <TableCell>
                          <Box
                            sx={{
                              backgroundColor: getStatusColor(commitment.paymentStatus),
                              color: 'white',
                              padding: '3px 10px',
                              borderRadius: '12px',
                              display: 'inline-block',
                              fontSize: '0.75rem'
                            }}
                          >
                            {commitment.paymentStatus}
                          </Box>
                        </TableCell> */}
                        <TableCell>{formatDate(commitment.createdAt)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </StyledCard>
        </Grid>
      </Grid>
    </Box>
  );
};

export default DefualtPage;
