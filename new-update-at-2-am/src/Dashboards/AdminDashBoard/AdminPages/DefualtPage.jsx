import React, { useState, useEffect } from 'react';
import { 
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, 
  Grid, Card, CardContent, Button, Typography, 
  List, ListItem, ListItemText, ListItemIcon, Avatar, Divider, Skeleton,
  Box,
  Alert,
  Stack,
  Chip,
} from '@mui/material';
import { 
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line
} from 'recharts';
import {
  People, ShoppingCart, Notifications, 
  TrendingUp,  Block
} from '@mui/icons-material';
import './DefualtPage.css';
import api from '../../../services/api';
import TopMembers from '../../../Pages/TopMembers';
import TopPerformingDistributor from '../../../Pages/TopPerformingDistributor';
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];



const DefaultPageSkeleton = () => (
  <Box sx={{ width: '100%' }}>
    <Grid container spacing={3}>
      {/* Summary Cards */}
      {[...Array(4)].map((_, index) => (
        <Grid item xs={12} sm={6} md={3} key={index}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Skeleton variant="circular" width={40} height={40} sx={{ mr: 2 }} />
                <Skeleton variant="text" sx={{ fontSize: '1.25rem', width: '60%' }} />
              </Box>
              <Skeleton variant="text" sx={{ fontSize: '2rem' }} />
            </CardContent>
          </Card>
        </Grid>
      ))}

      {/* Charts */}
      <Grid item xs={12} md={8}>
        <Card>
          <CardContent>
            <Skeleton variant="text" sx={{ fontSize: '1.5rem', mb: 2 }} />
            <Skeleton variant="rectangular" height={300} />
          </CardContent>
        </Card>
      </Grid>

      {/* Recent Activity */}
      <Grid item xs={12} md={4}>
        <Card>
          <CardContent>
            <Skeleton variant="text" sx={{ fontSize: '1.5rem', mb: 2 }} />
            {[...Array(5)].map((_, index) => (
              <Box key={index} sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Skeleton variant="circular" width={32} height={32} sx={{ mr: 2 }} />
                <Box sx={{ flex: 1 }}>
                  <Skeleton variant="text" />
                  <Skeleton variant="text" width="60%" />
                </Box>
              </Box>
            ))}
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  </Box>
);

const DefualtPage = () => {
  // State for all dashboard data
  const [dashboardData, setDashboardData] = useState({
    userStats: null,
    dealStats: null,
    weeklyMetrics: [],
    recentDeals: [],
    recentUsers: [],
    notifications: [],
    payments: [],
    analytics: {},
    userMetrics: {},
    dealMetrics: {},
    systemHealth: {},
    categoryStats: [],
    regionStats: [],
    businessTypeStats: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshInterval, setRefreshInterval] = useState(300000); // 5 minutes

  const fetchDashboardData = async () => {
    try {
      const [
        userStatsRes,
        dealStatsRes,
        weeklyMetricsRes,
        recentDealsRes,
        recentUsersRes,
        notificationsRes,
        paymentsRes,
        analyticsRes,
        categoryStatsRes,
        regionStatsRes,
        businessTypeStatsRes
      ] = await Promise.all([
        // User related data
        api.get(`/common/user-stats/overview`),
        // Deal related data
        api.get(`/common/deal-analytics/overview`),
        // Weekly metrics
        api.get(`/common/analytics/weekly-metrics`),
        // Recent activities - updated to include all necessary fields
        api.get(`/common/deals/recent`, {
          params: {
            limit: 5,
            populate: 'distributor,category'
          }
        }),
        api.get(`/common/user-stats/recent`, {
          params: {
            limit: 5,
            fields: 'name,role,createdAt,status,businessName'
          }
        }),
        api.get(`/common/notifications/recent`, {
          params: {
            limit: 5,
            populate: 'sender,recipient'
          }
        }),
        api.get(`/common/payments/recent`, {
          params: {
            limit: 5,
            populate: 'userId,dealId'
          }
        }),
        // Analytics with detailed data
        api.get(`/common/analytics/overview`),
        api.get(`/common/deal-analytics/categories`),
        api.get(`/common/analytics/regions`),
        api.get(`/common/analytics/business-types`)
      ]);

      // Transform and validate data before setting state
      const transformedData = {
        userStats: {
          total: userStatsRes.data.total || 0,
          active: userStatsRes.data.active || 0,
          blocked: userStatsRes.data.blocked || 0,
          newThisMonth: userStatsRes.data.newThisMonth || 0,
          roles: userStatsRes.data.roles || {},
          activityMetrics: userStatsRes.data.activityMetrics || {}
        },
        dealStats: {
          total: dealStatsRes.data.total || 0,
          active: dealStatsRes.data.active || 0,
          totalRevenue: dealStatsRes.data.totalRevenue || 0,
          averageDiscount: dealStatsRes.data.averageDiscount || 0,
          performance: dealStatsRes.data.performance || {}
        },
        weeklyMetrics: weeklyMetricsRes.data && weeklyMetricsRes.data.length > 0 
          ? weeklyMetricsRes.data.map(metric => ({
              week: metric.week,
              revenue: metric.revenue || 0,
              deals: metric.deals || 0,
              users: metric.users || 0
            }))
          : [], // Return empty array instead of defaultWeeklyMetrics
        recentDeals: recentDealsRes.data.map(deal => ({
          _id: deal._id,
          name: deal.name || 'Unnamed Deal',
          distributor: deal.distributor || 'Unassigned',
          amount: parseFloat(deal.amount) || 0,
          status: deal.status || 'pending'
        })),
        recentUsers: recentUsersRes.data.map(user => ({
          _id: user._id,
          name: user.name || 'Anonymous',
          role: user.role || 'N/A',
          createdAt: user.createdAt,
          status: user.status || 'inactive',
          businessName: user.businessName,
          email: user.email,
          lastActive: user.lastActive
        })),
        notifications: notificationsRes.data.map(notification => ({
          _id: notification._id,
          title: notification.title,
          message: notification.message,
          isRead: notification.isRead,
          createdAt: notification.createdAt,
          sender: notification.sender?.name || 'System',
          priority: notification.priority || 'normal'
        })),
        payments: paymentsRes.data.map(payment => ({
          _id: payment._id,
          userId: payment.userId || 'Unknown User',
          dealId: payment.dealId || 'Unknown Deal',
          amount: parseFloat(payment.amount) || 0,
          status: payment.status || 'pending'
        })),
        analytics: analyticsRes.data || {},
        categoryStats: categoryStatsRes.data.map(cat => ({
          name: cat.name || 'Other',
          value: cat.value || 0,
          revenue: cat.revenue || 0
        })),
        regionStats: regionStatsRes.data.map(region => ({
          name: region.name || 'Unknown',
          users: region.users || 0,
          deals: region.deals || 0
        })),
        businessTypeStats: businessTypeStatsRes.data.map(type => ({
          type: type.type || 'Other',
          count: type.count || 0,
          revenue: type.revenue || 0
        }))
      };

      setDashboardData(transformedData);
      setError(null);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();

    // Set up periodic refresh
    const refreshTimer = setInterval(fetchDashboardData, refreshInterval);

    // Set up real-time updates for notifications
    const notificationSocket = new WebSocket(`/notifications`);
    notificationSocket.onmessage = (event) => {
      const newNotification = JSON.parse(event.data);
      setDashboardData(prev => ({
        ...prev,
        notifications: [newNotification, ...prev.notifications].slice(0, 5)
      }));
    };

    return () => {
      clearInterval(refreshTimer);
      notificationSocket.close();
    };
  }, [refreshInterval]);

  if (loading) {
    return <DefaultPageSkeleton />;
  }

  if (error) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <Alert severity="error">
          Error loading dashboard data: {error}
          <Button color="inherit" size="small" onClick={fetchDashboardData}>
            Retry
          </Button>
        </Alert>
      </Box>
    );
  }

  const { userStats, dealStats, weeklyMetrics } = dashboardData;

  return (
    <div className="default-page">
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Quick Stats Section */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: '#4caf5032', color: 'primary.contrastText' }}>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <div>
                  <Typography variant="h6">Total Users</Typography>
                  <Typography variant="h4">{userStats?.total || 0}</Typography>
                </div>
                <People sx={{ fontSize: 40 }} color="primary.contrastText" />
              </Box>
              <Typography variant="body2" sx={{ mt: 1, color: 'primary.contrastText' }}>
                +{userStats?.newThisMonth || 0} this month
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: '#fbde5941', color: 'primary.contrastText' }}>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <div>
                  <Typography variant="h6">Active Deals</Typography>
                  <Typography variant="h4">{dealStats?.active || 0}</Typography>
                </div>
                <ShoppingCart sx={{ fontSize: 40 }} color="primary.contrastText" />
              </Box>
              <Typography variant="body2" sx={{ mt: 1, color: 'primary.contrastText' }}>
                ${(dealStats?.totalRevenue || 0).toLocaleString()} total revenue
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: '#5ac9cd41', color: 'primary.contrastText' }}>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <div>
                  <Typography variant="h6">Distributors</Typography>
                  <Typography variant="h4">{userStats?.roles?.distributor || 0}</Typography>
                </div>
                <TrendingUp sx={{ fontSize: 40 }} color="primary.contrastText" />
              </Box>
              <Typography variant="body2" sx={{ mt: 1, color: 'primary.contrastText' }}>
                Managing {dealStats?.total || 0} deals
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: '#ff980032', color: 'primary.contrastText' }}>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <div>
                  <Typography variant="h6">Blocked Users</Typography>
                  <Typography variant="h4">{userStats?.blocked || 0}</Typography>
                </div>
                <Block sx={{ fontSize: 40 }} color="primary.contrastText" />
              </Box>
              <Typography variant="body2" sx={{ mt: 1, color: 'primary.contrastText' }}>
                {((userStats?.blocked || 0) / (userStats?.total || 1) * 100).toFixed(1)}% of total users
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Charts Section */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Weekly Metrics</Typography>
              {dashboardData.weeklyMetrics && dashboardData.weeklyMetrics.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={dashboardData.weeklyMetrics}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="week" />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip formatter={(value) => value.toLocaleString()} />
                  <Legend />
                    <Line 
                      yAxisId="left" 
                      type="monotone" 
                      dataKey="revenue" 
                      stroke="#8884d8" 
                      name="Revenue ($)" 
                      strokeWidth={2}
                      dot={{ r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                    <Line 
                      yAxisId="right" 
                      type="monotone" 
                      dataKey="deals" 
                      stroke="#82ca9d" 
                      name="Deals" 
                      strokeWidth={2}
                    />
                    <Line 
                      yAxisId="right" 
                      type="monotone" 
                      dataKey="users" 
                      stroke="#ffc658" 
                      name="Users" 
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <Box display="flex" justifyContent="center" alignItems="center" height={300}>
                  <Typography variant="body1" color="text.secondary">
                    No weekly metrics data available
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Category Distribution</Typography>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={dashboardData.categoryStats}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    fill="#8884d8"
                    paddingAngle={5}
                    dataKey="value"
                    nameKey="name"
                    label={({ name, percent }) => 
                      dashboardData.categoryStats.length <= 5 ? 
                      `${name} (${(percent * 100).toFixed(0)}%)` : ''
                    }
                  >
                    {dashboardData.categoryStats.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value, name, props) => [value, props.payload.name]} />
                  {dashboardData.categoryStats.length <= 5 ? <Legend /> : null}
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} md={12}>
          <TopMembers />
        </Grid>
      </Grid>
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} md={12}>
          <TopPerformingDistributor />
        </Grid>
      </Grid>
      {/* Recent Activity Sections */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Recent Deals</Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Deal Name</TableCell>
                      <TableCell>Distributor</TableCell>
                      <TableCell align="center">Status</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {dashboardData.recentDeals.map((deal) => (
                      <TableRow key={deal._id}>
                        <TableCell>{deal.name}</TableCell>
                        <TableCell>{deal.distributor}</TableCell>
                        <TableCell align="center">
                          <Chip
                            label={deal.status}
                            color={
                              deal.status === 'active' ? 'success' :
                              deal.status === 'pending' ? 'warning' :
                              'default'
                            }
                            size="small"
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Recent Users</Typography>
              <List>
                {dashboardData.recentUsers.map((user) => (
                  <React.Fragment key={user._id}>
                    <ListItem>
                      <ListItemIcon>
                        <Avatar>{user.name?.[0]?.toUpperCase()}</Avatar>
                      </ListItemIcon>
                      <ListItemText
                        primary={
                          <Typography>
                            {user.name}
                            {user.businessName && 
                              <Typography component="span" color="textSecondary">
                                {` - ${user.businessName}`}
                              </Typography>
                            }
                          </Typography>
                        }
                        secondary={
                          <>
                            {`${user.role} • ${user.email}`}
                            <br />
                            {`Last active: ${new Date(user.lastActive).toLocaleString()}`}
                          </>
                        }
                      />
                      <Chip
                        label={user.status}
                        color={user.status === 'active' ? 'success' : 'error'}
                        size="small"
                      />
                    </ListItem>
                    <Divider />
                  </React.Fragment>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Notifications and Payments Section */}
      <Grid container spacing={3} sx={{ mt: 2 }}>
        <Grid item xs={12} md={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Recent Notifications</Typography>
              <List>
                {dashboardData.notifications.map((notification) => (
                  <React.Fragment key={notification._id}>
                    <ListItem>
                      <ListItemIcon>
                        <Notifications 
                          color={notification.isRead ? 'disabled' : 'primary'} 
                          sx={{ 
                            color: notification.priority === 'high' ? 'error.main' : undefined 
                          }}
                        />
                      </ListItemIcon>
                      <ListItemText
                        primary={
                          <Typography fontWeight={notification.isRead ? 'normal' : 'bold'}>
                            {notification.title}
                          </Typography>
                        }
                        secondary={
                          <>
                            {notification.message}
                            <br />
                            <Typography variant="caption" color="textSecondary">
                              {`From: ${notification.sender.name} • ${new Date(notification.createdAt).toLocaleString()}`}
                            </Typography>
                          </>
                        }
                      />
                      <Stack direction="row" spacing={1}>
                        <Chip
                          label={notification.priority}
                          color={
                            notification.priority === 'high' ? 'error' :
                            notification.priority === 'medium' ? 'warning' : 
                            'default'
                          }
                          size="small"
                        />
                        <Chip
                          label={notification.isRead ? 'Read' : 'Unread'}
                          color={notification.isRead ? 'default' : 'primary'}
                          size="small"
                        />
                      </Stack>
                    </ListItem>
                    <Divider />
                  </React.Fragment>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </div>
  );
};

export default DefualtPage;