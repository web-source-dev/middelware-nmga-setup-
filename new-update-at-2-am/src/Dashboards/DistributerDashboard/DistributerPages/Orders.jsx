import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import {
    Box,
    Card,
    CardContent,
    Typography,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Grid,
    useTheme,
    IconButton,
    Tooltip as MuiTooltip,
    CircularProgress,
    TablePagination,
    Button,
    Menu,
    MenuItem,
    Chip,
    Stack,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Select,
    FormControl,
    InputLabel,
    LinearProgress,
    Paper,
    Collapse,
    Badge,
    InputAdornment,
    Divider,
    Container,
    Skeleton,
} from '@mui/material';
import {
    AttachMoney,
    ShoppingCart,
    Inventory,
    Assessment,
    TrendingUp,
    Download,
    MoreVert,
    FilterList,
    ArrowUpward,
    ArrowDownward,
    TrendingDown,
    Label,
    Diamond,
    ArrowForward,
    PictureAsPdf,
    TableChart,
    FilterAlt,
    ExpandMore,
    ExpandLess,
    Search,
    Clear,
} from '@mui/icons-material';
import {
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    BarChart,
    Bar,
    Line,
    LineChart,
    PieChart,
    Pie,
    Cell,
    ReferenceLine,
} from 'recharts';
import { styled } from '@mui/material/styles';
import { FilterTextField, FilterSelect, FilterFormControl } from '../../DashBoardComponents/FilterStyles';
import { FilterContainer } from '../../DashBoardComponents/StyledComponents';
import { TableSkeleton } from '../../../Components/Skeletons/LoadingSkeletons';

const StyledTableCell = styled(TableCell)(({ theme }) => ({
    '&.MuiTableCell-head': {
        backgroundColor: theme.palette.primary.main,
        color: theme.palette.common.white,
        fontWeight: 600,
        fontSize: '0.875rem',
    },
    '&.MuiTableCell-body': {
        fontSize: '0.875rem',
    },
}));

const StyledTableRow = styled(TableRow)(({ theme }) => ({
    '&:nth-of-type(odd)': {
        backgroundColor: theme.palette.action.hover,
    },
    '&:hover': {
        backgroundColor: `${theme.palette.primary.main}08`,
    },
    // hide last border
    '&:last-child td, &:last-child th': {
        border: 0,
    },
}));

const DashboardContainer = styled(Box)(({ theme }) => ({
    padding: theme.spacing(2),
    [theme.breakpoints.up('sm')]: {
        padding: theme.spacing(3),
    },
    backgroundColor: '#F8FAFC',
    minHeight: '100vh',
    '& .MuiCard-root': {
        transition: 'all 0.3s ease-in-out',
        '&:hover': {
            transform: 'translateY(-5px)',
        }
    },
    '& .dashboard-section': {
        marginBottom: theme.spacing(3),
        [theme.breakpoints.up('sm')]: {
            marginBottom: theme.spacing(4),
        },
        [theme.breakpoints.up('md')]: {
            marginBottom: theme.spacing(5),
        }
    }
}));

const GlassCard = styled(Card)(({ theme }) => ({
    background: theme.palette.mode === 'dark' 
        ? 'rgba(45, 45, 45, 0.8)' 
        : 'rgba(255, 255, 255, 0.9)',
    backdropFilter: 'blur(8px)',
    borderRadius: theme.spacing(1),
    [theme.breakpoints.up('sm')]: {
        borderRadius: theme.spacing(1.5),
    },
    border: `1px solid ${theme.palette.divider}`,
    boxShadow: 'none',
    transition: 'transform 0.2s ease-in-out',
    '&:hover': {
        transform: 'translateY(-2px)',
    }
}));

const LoadingAnimation = styled(Box)(({ theme }) => ({
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '60vh',
    '& .MuiCircularProgress-root': {
        animation: 'pulse 1.5s ease-in-out infinite',
    },
    '@keyframes pulse': {
        '0%': {
            transform: 'scale(0.8)',
            opacity: 0.5,
        },
        '50%': {
            transform: 'scale(1)',
            opacity: 1,
        },
        '100%': {
            transform: 'scale(0.8)',
            opacity: 0.5,
        },
    },
}));

const StyledCard = styled(Card)(({ theme }) => ({
    background: theme.palette.background.paper,
    borderRadius: '16px',
    boxShadow: theme.shadows[1],
    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
    '&:hover': {
        transform: 'translateY(-4px)',
        boxShadow: theme.shadows[4],
    }
}));

const THEME_COLORS = {
    primary: {
        lighter: '#E3F2FD',
        light: '#90CAF9',
        main: '#2196F3',
        dark: '#1E88E5',
    },
    success: {
        lighter: '#E8F5E9',
        light: '#81C784',
        main: '#4CAF50',
    },
    warning: {
        lighter: '#FFF3E0',
        light: '#FFB74D',
        main: '#FF9800',
    },
    error: {
        lighter: '#FFEBEE',
        light: '#E57373',
        main: '#F44336',
    },
};

const OrdersTable = ({ 
    orders, 
    page, 
    rowsPerPage, 
    handlePageChange, 
    handleRowsPerPageChange,
    onOrderSelect,
    onMenuOpen 
}) => (
    <Grid container spacing={{ xs: 2, sm: 3 }}>
        <Grid item xs={12} md={4}>
            <GlassCard sx={{ height: '100%' }}>
                <Box p={{ xs: 2, sm: 3 }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
                        <Typography variant="h6" fontWeight="600" sx={{
                            fontSize: { xs: '1rem', sm: '1.25rem' }
                        }}>
                            Recent Orders
                        </Typography>
                        <Stack direction="row" spacing={1}>
                            <MuiTooltip title="Filter">
                                <IconButton size="small">
                                    <FilterList sx={{ fontSize: { xs: '1.25rem', sm: '1.5rem' } }} />
                                </IconButton>
                            </MuiTooltip>
                            <MuiTooltip title="Export">
                                <IconButton size="small">
                                    <Download sx={{ fontSize: { xs: '1.25rem', sm: '1.5rem' } }} />
                                </IconButton>
                            </MuiTooltip>
                        </Stack>
                    </Stack>

                    <TableContainer sx={{ 
                        maxHeight: { xs: 300, sm: 350 }, 
                        overflowY: 'auto',
                        '& .MuiTableCell-root': {
                            px: { xs: 1, sm: 2 },
                            py: { xs: 1, sm: 1.5 },
                            '&:last-child': {
                                pr: { xs: 1, sm: 2 }
                            }
                        }
                    }}>
                        <Table stickyHeader size="small">
                            <TableHead>
                                <TableRow>
                                    <StyledTableCell>Order Info</StyledTableCell>
                                    <StyledTableCell align="right">Actions</StyledTableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {orders.map((order) => (
                                    <StyledTableRow key={order._id}>
                                        <StyledTableCell>
                                            <Stack spacing={0.5}>
                                                <Typography variant="body2" fontWeight="medium" sx={{
                                                    fontSize: { xs: '0.75rem', sm: '0.875rem' }
                                                }}>
                                                    {order.dealId.name}
                                                </Typography>
                                                <Typography variant="caption" color="text.secondary" sx={{
                                                    fontSize: { xs: '0.7rem', sm: '0.75rem' }
                                                }}>
                                                    {new Date(order.createdAt).toLocaleDateString()}
                                                </Typography>
                                                <Stack direction="row" alignItems="center" spacing={1}>
                                                    <OrderStatusChip status={order.status} />
                                                    <Typography variant="caption" color="primary.main" fontWeight="600" sx={{
                                                        fontSize: { xs: '0.7rem', sm: '0.75rem' }
                                                    }}>
                                                        ${order.totalPrice.toFixed(2)}
                                                    </Typography>
                                                </Stack>
                                            </Stack>
                                        </StyledTableCell>
                                        <StyledTableCell align="right">
                                            <IconButton
                                                size="small"
                                                onClick={(e) => {
                                                    onOrderSelect(order);
                                                    onMenuOpen(e.currentTarget);
                                                }}
                                            >
                                                <MoreVert sx={{ fontSize: { xs: '1.25rem', sm: '1.5rem' } }} />
                                            </IconButton>
                                        </StyledTableCell>
                                    </StyledTableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>

                    <TablePagination
                        component="div"
                        count={orders.length}
                        page={page}
                        rowsPerPage={rowsPerPage}
                        onPageChange={handlePageChange}
                        onRowsPerPageChange={handleRowsPerPageChange}
                        rowsPerPageOptions={[5, 10, 25]}
                        sx={{
                            '& .MuiTablePagination-select': {
                                fontSize: { xs: '0.75rem', sm: '0.875rem' }
                            },
                            '& .MuiTablePagination-displayedRows': {
                                fontSize: { xs: '0.75rem', sm: '0.875rem' }
                            }
                        }}
                    />
                </Box>
            </GlassCard>
        </Grid>

        <Grid item xs={12} md={8}>
            <GlassCard sx={{ height: '100%' }}>
                <Box p={3}>
                    <Typography variant="h6" gutterBottom>
                        Order Details
                    </Typography>
                    <Grid container spacing={3}>
                        <Grid item xs={12} sm={6}>
                            <Box sx={{ mb: 3 }}>
                                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                    Today's Performance
                                </Typography>
                                <Stack spacing={2}>
                                    <Box>
                                        <Typography variant="body2" color="text.secondary">
                                            Orders
                                        </Typography>
                                        <Typography variant="h6">
                                            {orders.filter(order => 
                                                new Date(order.createdAt).toDateString() === new Date().toDateString()
                                            ).length}
                                        </Typography>
                                    </Box>
                                    <Box>
                                        <Typography variant="body2" color="text.secondary">
                                            Revenue
                                        </Typography>
                                        <Typography variant="h6">
                                            ${orders.filter(order => 
                                                new Date(order.createdAt).toDateString() === new Date().toDateString()
                                            ).reduce((sum, order) => sum + order.totalPrice, 0).toFixed(2)}
                                        </Typography>
                                    </Box>
                                </Stack>
                            </Box>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <Box sx={{ mb: 3 }}>
                                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                    Status Distribution
                                </Typography>
                                <Stack spacing={1}>
                                    {['pending', 'approved', 'cancelled'].map(status => {
                                        const count = orders.filter(order => order.status === status).length;
                                        const percentage = (count / orders.length) * 100;
                                        return (
                                            <Box key={status}>
                                                <Stack direction="row" justifyContent="space-between" alignItems="center">
                                                    <Typography variant="body2" sx={{ textTransform: 'capitalize' }}>
                                                        {status}
                                                    </Typography>
                                                    <Typography variant="caption" color="text.secondary">
                                                        {count} ({percentage.toFixed(1)}%)
                                                    </Typography>
                                                </Stack>
                                                <LinearProgress
                                                    variant="determinate"
                                                    value={percentage}
                                                    color={status === 'approved' ? 'success' : status === 'pending' ? 'warning' : 'error'}
                                                    sx={{ mt: 0.5, height: 6, borderRadius: 1 }}
                                                />
                                            </Box>
                                        );
                                    })}
                                </Stack>
                            </Box>
                        </Grid>
                    </Grid>
                </Box>
            </GlassCard>
        </Grid>
    </Grid>
);

const SpendOverview = ({ analytics }) => {
    // Calculate daily orders for the last 7 days
    const last7Days = Array.from({ length: 7 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - i);
        return date;
    }).reverse();

    const dailyOrders = last7Days.map(date => {
        const dayData = analytics.revenueData.find(data => 
            new Date(data.date).toDateString() === date.toDateString()
        ) || { orders: 0 };

        return {
            day: date.toLocaleDateString('en-US', { weekday: 'short' }),
            count: dayData.orders || 0
        };
    });

    const spendOverTime = analytics.revenueData.map(data => ({
        day: new Date(data.date).toLocaleDateString('en-US', { weekday: 'short' }),
        EUR: data.revenue,
        USD: data.revenue * 1.1,
        GBP: data.revenue * 0.85,
    }));

    return (
        <Card sx={{ mt: 3,mb: 3,  p: 3 }}>
            <Stack direction="row" alignItems="center" justifyContent="space-between" mb={2}>
                <Typography variant="h6">Spend overview</Typography>
                <Select
                    size="small"
                    defaultValue="this-week"
                    sx={{ minWidth: 120 }}
                >
                    <MenuItem value="this-week">This week</MenuItem>
                    <MenuItem value="last-week">Last week</MenuItem>
                    <MenuItem value="this-month">This month</MenuItem>
                </Select>
            </Stack>
            
            <Box sx={{ bgcolor: '#F8F9FA', p: 2, borderRadius: 1, mb: 3 }}>
                <Typography variant="caption" color="text.secondary">
                    Multiple currencies
                </Typography>
                <Grid container spacing={3} mt={1}>
                    <Grid item xs={12} sm={3}>
                        <Stack>
                            <Typography variant="caption" color="text.secondary">
                                Net spend
                            </Typography>
                            <Typography variant="h6">
                                EUR {analytics.totalRevenue?.toFixed(2)}
                            </Typography>
                        </Stack>
                    </Grid>
                    <Grid item xs={12} sm={3}>
                        <Stack>
                            <Typography variant="caption" color="text.secondary">
                                VAT
                            </Typography>
                            <Typography variant="h6">
                                EUR {(analytics.totalRevenue * 0.2)?.toFixed(2)}
                            </Typography>
                        </Stack>
                    </Grid>
                    <Grid item xs={12} sm={2}>
                        <Stack>
                            <Typography variant="caption" color="text.secondary">
                                New suppliers
                            </Typography>
                            <Typography variant="h6">
                                {analytics.dailyOrders}
                            </Typography>
                        </Stack>
                    </Grid>
                    <Grid item xs={12} sm={2}>
                        <Stack>
                            <Typography variant="caption" color="text.secondary">
                                Total Orders
                            </Typography>
                            <Typography variant="h6">
                                {analytics.totalOrders}
                            </Typography>
                        </Stack>
                    </Grid>
                    <Grid item xs={12} sm={2}>
                        <Stack>
                            <Typography variant="caption" color="text.secondary">
                                Products
                            </Typography>
                            <Typography variant="h6">
                                {analytics.productDistribution?.length || 0}
                            </Typography>
                        </Stack>
                    </Grid>
                </Grid>
            </Box>

            <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                    <Typography variant="subtitle2" mb={2}>
                        TOTAL NEW ORDERS
                    </Typography>
                    <Box height={300}>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={dailyOrders}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis 
                                    dataKey="day" 
                                    axisLine={false}
                                    tickLine={false}
                                />
                                <YAxis 
                                    axisLine={false}
                                    tickLine={false}
                                />
                                <Tooltip />
                                <Bar 
                                    dataKey="count" 
                                    fill="#4F46E5" 
                                    radius={[4, 4, 0, 0]}
                                    maxBarSize={50}
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    </Box>
                </Grid>
                <Grid item xs={12} md={6}>
                    <Typography variant="subtitle2" mb={2}>
                        SPEND OVER TIME
                    </Typography>
                    <Box height={300}>
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={spendOverTime}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis 
                                    dataKey="day" 
                                    axisLine={false}
                                    tickLine={false}
                                />
                                <YAxis 
                                    axisLine={false}
                                    tickLine={false}
                                    tickFormatter={(value) => `€${value}`}
                                />
                                <Tooltip />
                                <Legend />
                                <Line 
                                    type="monotone" 
                                    dataKey="EUR" 
                                    stroke="#4F46E5" 
                                    strokeWidth={2}
                                    dot={false}
                                />
                                <Line 
                                    type="monotone" 
                                    dataKey="USD" 
                                    stroke="#10B981" 
                                    strokeWidth={2}
                                    dot={false}
                                />
                                <Line 
                                    type="monotone" 
                                    dataKey="GBP" 
                                    stroke="#F59E0B" 
                                    strokeWidth={2}
                                    dot={false}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </Box>
                </Grid>
            </Grid>
        </Card>
    );
};

const LineGraph = ({ analytics }) => (
    <StyledCard sx={{ mt: 3,mb: 3 }}>
        <Box p={3}>
            <Typography variant="h6" fontWeight="600">
                Sales Overview
            </Typography>
            <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                    <Box height={200}>
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={analytics.productDistribution}
                                    dataKey="value"
                                    nameKey="name"
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                >
                                    {analytics.productDistribution?.map((entry, index) => (
                                        <Cell 
                                            key={`cell-${index}`} 
                                            fill={THEME_COLORS[Object.keys(THEME_COLORS)[index % 4]].main} 
                                        />
                                    ))}
                                </Pie>
                                <Tooltip />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </Box>
                </Grid>
                <Grid item xs={12} md={6}>
                    <Stack spacing={2}>
                        {analytics.productDistribution?.slice(0, 3).map((product, index) => (
                            <Box key={index} sx={{ p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
                                <Stack direction="row" justifyContent="space-between" alignItems="center">
                                    <Typography variant="body2">{product.name}</Typography>
                                    <Typography variant="body2" color="primary" fontWeight="600">
                                        ${product.revenue?.toFixed(2)}
                                    </Typography>
                                </Stack>
                                <LinearProgress 
                                    variant="determinate" 
                                    value={(product.value / (analytics.totalQuantitySold || 1)) * 100}
                                    sx={{ mt: 1, height: 6, borderRadius: 3 }}
                                />
                            </Box>
                        ))}
                    </Stack>
                </Grid>
            </Grid>
        </Box>
    </StyledCard>
);

// Add new components for detailed analytics
const ComparisonCard = ({ title, current, previous, type = 'currency' }) => {
    const percentage = ((current - previous) / previous) * 100;
    const isPositive = percentage > 0;
    
    const formatValue = (value) => {
        if (type === 'currency') return `$${value.toFixed(2)}`;
        if (type === 'percentage') return `${value.toFixed(1)}%`;
        return value.toLocaleString();
    };

    return (
        <Card sx={{ p: 2 }}>
            <Typography variant="subtitle2" color="text.secondary">
                {title}
            </Typography>
            <Typography variant="h6" sx={{ mt: 1 }}>
                {formatValue(current)}
            </Typography>
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 1 }}>
                <Typography
                    variant="body2"
                    color={isPositive ? 'success.main' : 'error.main'}
                    sx={{ display: 'flex', alignItems: 'center' }}
                >
                    {isPositive ? <TrendingUp fontSize="small" /> : <TrendingDown fontSize="small" />}
                    {percentage.toFixed(1)}%
                </Typography>
                <Typography variant="caption" color="text.secondary">
                    vs previous period
                </Typography>
            </Stack>
        </Card>
    );
};

const TimeComparisonSection = ({ analytics }) => {
    const { periodMetrics, comparisons } = analytics;
    
    return (
        <Card sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
                Performance Comparison
            </Typography>
            <Grid container spacing={3}>
                <Grid item xs={12} md={4}>
                    <Typography variant="subtitle1" gutterBottom>
                        Month over Month
                    </Typography>
                    <Stack spacing={2}>
                        <ComparisonCard
                            title="Revenue"
                            current={periodMetrics.currentMonth.revenue}
                            previous={periodMetrics.previousMonth.revenue}
                        />
                        <ComparisonCard
                            title="Orders"
                            current={periodMetrics.currentMonth.orderCount}
                            previous={periodMetrics.previousMonth.orderCount}
                            type="number"
                        />
                    </Stack>
                </Grid>
                <Grid item xs={12} md={4}>
                    <Typography variant="subtitle1" gutterBottom>
                        Year over Year
                    </Typography>
                    <Stack spacing={2}>
                        <ComparisonCard
                            title="Revenue"
                            current={periodMetrics.currentMonth.revenue}
                            previous={periodMetrics.lastYear.revenue}
                        />
                        <ComparisonCard
                            title="Orders"
                            current={periodMetrics.currentMonth.orderCount}
                            previous={periodMetrics.lastYear.orderCount}
                            type="number"
                        />
                    </Stack>
                </Grid>
                <Grid item xs={12} md={4}>
                    <Typography variant="subtitle1" gutterBottom>
                        Year to Date
                    </Typography>
                    <Stack spacing={2}>
                        <ComparisonCard
                            title="Revenue"
                            current={periodMetrics.yearToDate.revenue}
                            previous={periodMetrics.lastYearToDate.revenue}
                        />
                        <ComparisonCard
                            title="Orders"
                            current={periodMetrics.yearToDate.orderCount}
                            previous={periodMetrics.lastYearToDate.orderCount}
                            type="number"
                        />
                    </Stack>
                </Grid>
            </Grid>
        </Card>
    );
};

const SeasonalTrendsChart = ({ analytics }) => {
    const { seasonalAnalysis } = analytics;
    const seasons = Object.keys(seasonalAnalysis);
    const data = seasons.map(season => ({
        name: season.charAt(0).toUpperCase() + season.slice(1),
        orders: seasonalAnalysis[season].orderCount,
        revenue: seasonalAnalysis[season].revenue
    }));

    return (
        <Card sx={{ 
            height: '100%',
            p: { xs: 2, sm: 3 },
            borderRadius: { xs: 1, sm: 2 }
        }}>
            <Typography variant="h6" gutterBottom sx={{
                fontSize: { xs: '1rem', sm: '1.25rem' }
            }}>
                Seasonal Performance
            </Typography>
            <Box height={{ xs: 250, sm: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                            dataKey="name"
                            tick={{ fontSize: { xs: 10, sm: 12 } }}
                            interval={0}
                        />
                        <YAxis 
                            yAxisId="left" 
                            orientation="left" 
                            stroke="#8884d8"
                            tick={{ fontSize: { xs: 10, sm: 12 } }}
                        />
                        <YAxis 
                            yAxisId="right" 
                            orientation="right" 
                            stroke="#82ca9d"
                            tick={{ fontSize: { xs: 10, sm: 12 } }}
                        />
                        <Tooltip />
                        <Legend wrapperStyle={{ fontSize: { xs: 10, sm: 12 } }} />
                        <Bar yAxisId="left" dataKey="orders" fill="#8884d8" name="Orders" />
                        <Bar yAxisId="right" dataKey="revenue" fill="#82ca9d" name="Revenue ($)" />
                    </BarChart>
                </ResponsiveContainer>
            </Box>
        </Card>
    );
};

const WeeklyTrendsChart = ({ analytics }) => {
    const { trends } = analytics;
    const [hoveredWeek, setHoveredWeek] = useState(null);

    // Process weekly data
    const processWeeklyData = () => {
        const currentDate = new Date();
        const currentWeek = `W${Math.ceil((currentDate.getDate() + currentDate.getDay()) / 7)} ${currentDate.toLocaleString('default', { month: 'short' })}`;
        
        const weeklyData = trends?.weekly?.slice(-12).map(week => {
            if (!week || !week.week) return null;
            const date = new Date(week.week);
            const weekFormatted = `W${Math.ceil((date.getDate() + date.getDay()) / 7)} ${date.toLocaleString('default', { month: 'short' })}`;
            
            // If this is the current week, add daily data
            const isCurrentWeek = weekFormatted === currentWeek;
            const dailyData = isCurrentWeek ? trends?.daily?.slice(-7).map(day => ({
                date: new Date(day.date),
                revenue: day.revenue,
                orders: day.orders
            })) : null;

            return {
                ...week,
                dayName: date.toLocaleDateString('en-US', { weekday: 'long' }),
                weekFormatted,
                isCurrentWeek,
                dailyData
            };
        }).filter(Boolean);

        return weeklyData;
    };

    const data = processWeeklyData();

    // Enhanced currency formatting with compact notation
    const formatCurrency = (value) => {
        if (!value) return '$0';
        if (value >= 1000000) {
            return `$${(value / 1000000).toFixed(1)}M`;
        } else if (value >= 1000) {
            return `$${(value / 1000).toFixed(1)}K`;
        }
        return `$${value.toFixed(0)}`;
    };

    // Calculate growth rates
    const calculateGrowth = () => {
        if (data.length < 2) return { revenue: 0, orders: 0 };
        const latest = data[data.length - 1];
        const previous = data[data.length - 2];
        if (!latest || !previous) return { revenue: 0, orders: 0 };
        
        const revGrowth = previous.revenue ? ((latest.revenue - previous.revenue) / previous.revenue) * 100 : 0;
        const ordGrowth = previous.orders ? ((latest.orders - previous.orders) / previous.orders) * 100 : 0;
        
        return {
            revenue: revGrowth,
            orders: ordGrowth
        };
    };

    const growth = calculateGrowth();

    // Calculate min and max values for better visualization
    const minRevenue = Math.min(...data.map(d => d?.revenue || 0));
    const maxRevenue = Math.max(...data.map(d => d?.revenue || 0));
    const minOrders = Math.min(...data.map(d => d?.orders || 0));
    const maxOrders = Math.max(...data.map(d => d?.orders || 0));

    // Safe date range display
    const dateRange = {
        start: data[0]?.dayName || 'N/A',
        end: data[data.length - 1]?.dayName || 'N/A'
    };

    // Custom tooltip content
    const CustomTooltip = ({ active, payload, label }) => {
        if (!active || !payload || !payload.length) return null;

        const weekData = data.find(d => d.weekFormatted === label);
        const isCurrentWeek = weekData?.isCurrentWeek;

        return (
            <Box
                sx={{
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    p: 2,
                    borderRadius: 2,
                    boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                    border: '1px solid rgba(0,0,0,0.1)',
                    maxWidth: 300
                }}
            >
                <Typography variant="subtitle2" gutterBottom>
                    {weekData?.dayName}, {label}
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
                                    width: 12,
                                    height: 12,
                                    borderRadius: '50%',
                                    backgroundColor: entry.color
                                }}
                            />
                            {entry.name}: {entry.name === 'Revenue' ? formatCurrency(entry.value) : entry.value}
                        </Typography>
                    </Box>
                ))}
                {isCurrentWeek && weekData.dailyData && (
                    <Box sx={{ mt: 2, pt: 2, borderTop: '1px dashed rgba(0,0,0,0.1)' }}>
                        <Typography variant="caption" color="text.secondary">
                            Daily Breakdown:
                        </Typography>
                        {weekData.dailyData.map((day, index) => (
                            <Box key={index} sx={{ mt: 1 }}>
                                <Typography variant="caption" display="block">
                                    {day.date.toLocaleDateString('en-US', { weekday: 'short' })}:{' '}
                                    {formatCurrency(day.revenue)} ({day.orders} orders)
                                </Typography>
                            </Box>
                        ))}
                    </Box>
                )}
            </Box>
        );
    };

    return (
        <Card sx={{ 
            height: '100%',
            p: { xs: 2, sm: 3 },
            borderRadius: { xs: 1, sm: 2 }
        }}>
            <Stack spacing={2}>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Box>
                        <Typography variant="h6" sx={{
                            fontSize: { xs: '1rem', sm: '1.25rem' }
                        }}>
                            Weekly Trends
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                            {dateRange.start} - {dateRange.end}
                        </Typography>
                    </Box>
                    <Stack direction="row" spacing={2}>
                        <Box>
                            <Typography variant="caption" color="text.secondary">
                                Revenue Growth
                            </Typography>
                            <Typography variant="subtitle2" color={growth.revenue >= 0 ? 'success.main' : 'error.main'}>
                                {growth.revenue >= 0 ? '+' : ''}{growth.revenue.toFixed(1)}%
                            </Typography>
                        </Box>
                        <Box>
                            <Typography variant="caption" color="text.secondary">
                                Orders Growth
                            </Typography>
                            <Typography variant="subtitle2" color={growth.orders >= 0 ? 'success.main' : 'error.main'}>
                                {growth.orders >= 0 ? '+' : ''}{growth.orders.toFixed(1)}%
                            </Typography>
                        </Box>
                    </Stack>
                </Stack>

                <Box height={{ xs: 250, sm: 300 }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart 
                            data={data}
                            margin={{ top: 5, right: 30, bottom: 25, left: 20 }}
                            onMouseMove={(e) => {
                                if (e && e.activePayload) {
                                    setHoveredWeek(e.activeLabel);
                                }
                            }}
                            onMouseLeave={() => setHoveredWeek(null)}
                        >
                            <defs>
                                <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor={THEME_COLORS.primary.main} stopOpacity={0.1}/>
                                    <stop offset="95%" stopColor={THEME_COLORS.primary.main} stopOpacity={0}/>
                                </linearGradient>
                                <linearGradient id="ordersGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor={THEME_COLORS.success.main} stopOpacity={0.1}/>
                                    <stop offset="95%" stopColor={THEME_COLORS.success.main} stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                            <CartesianGrid 
                                strokeDasharray="3 3" 
                                vertical={true}
                                horizontal={true}
                                stroke="rgba(0,0,0,0.1)"
                            />
                            <XAxis 
                                dataKey="weekFormatted" 
                                tick={{ 
                                    fontSize: { xs: 10, sm: 12 },
                                    fill: 'text.secondary'
                                }}
                                axisLine={{ stroke: 'rgba(0,0,0,0.2)' }}
                                tickLine={{ stroke: 'rgba(0,0,0,0.2)' }}
                                dy={10}
                                angle={-45}
                                textAnchor="end"
                                height={60}
                            />
                            <YAxis 
                                yAxisId="left"
                                orientation="left"
                                tickFormatter={formatCurrency}
                                tick={{ 
                                    fontSize: { xs: 10, sm: 12 },
                                    fill: 'text.secondary'
                                }}
                                axisLine={{ stroke: 'rgba(0,0,0,0.2)' }}
                                tickLine={{ stroke: 'rgba(0,0,0,0.2)' }}
                                dx={-10}
                                domain={[minRevenue * 0.9, maxRevenue * 1.1]}
                            />
                            <YAxis 
                                yAxisId="right"
                                orientation="right"
                                tickFormatter={(value) => `${value}`}
                                tick={{ 
                                    fontSize: { xs: 10, sm: 12 },
                                    fill: 'text.secondary'
                                }}
                                axisLine={{ stroke: 'rgba(0,0,0,0.2)' }}
                                tickLine={{ stroke: 'rgba(0,0,0,0.2)' }}
                                dx={10}
                                domain={[minOrders * 0.9, maxOrders * 1.1]}
                            />
                            <Tooltip content={<CustomTooltip />} />
                            <Legend 
                                verticalAlign="top"
                                height={36}
                                wrapperStyle={{ 
                                    fontSize: { xs: 10, sm: 12 },
                                    paddingTop: '20px'
                                }}
                            />
                            <Line 
                                yAxisId="left"
                                type="monotone" 
                                dataKey="revenue" 
                                stroke={THEME_COLORS.primary.main}
                                strokeWidth={2}
                                dot={{
                                    r: 3,
                                    fill: THEME_COLORS.primary.main,
                                    strokeWidth: 2
                                }}
                                activeDot={{
                                    r: 6,
                                    strokeWidth: 2,
                                    stroke: THEME_COLORS.primary.dark
                                }}
                                name="Revenue"
                                connectNulls
                                fill="url(#revenueGradient)"
                            />
                            <Line 
                                yAxisId="right"
                                type="monotone" 
                                dataKey="orders" 
                                stroke={THEME_COLORS.success.main}
                                strokeWidth={2}
                                dot={{
                                    r: 3,
                                    fill: THEME_COLORS.success.main,
                                    strokeWidth: 2
                                }}
                                activeDot={{
                                    r: 6,
                                    strokeWidth: 2,
                                    stroke: THEME_COLORS.success.dark
                                }}
                                name="Orders"
                                connectNulls
                                fill="url(#ordersGradient)"
                            />
                            {/* Add reference lines for current week if applicable */}
                            {data.map((week, index) => {
                                if (week.isCurrentWeek && week.dailyData) {
                                    return week.dailyData.map((day, dayIndex) => (
                                        <ReferenceLine
                                            key={`day-${dayIndex}`}
                                            x={week.weekFormatted}
                                            stroke={hoveredWeek === week.weekFormatted ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.1)'}
                                            strokeDasharray="3 3"
                                        />
                                    ));
                                }
                                return null;
                            })}
                        </LineChart>
                    </ResponsiveContainer>
                </Box>
            </Stack>
        </Card>
    );
};

const DailyDistributionChart = ({ analytics }) => {
    const { dowTrends } = analytics;
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const data = dowTrends.map((trend, index) => ({
        name: days[index],
        shortName: days[index].slice(0, 3),
        orders: trend.orders,
        revenue: trend.revenue,
        avgOrderValue: trend.revenue / (trend.orders || 1)
    }));

    // Find the best and worst performing days
    const bestDay = [...data].sort((a, b) => b.revenue - a.revenue)[0];
    const worstDay = [...data].sort((a, b) => a.revenue - b.revenue)[0];

    // Calculate total weekly metrics
    const weeklyTotals = data.reduce((acc, day) => ({
        orders: acc.orders + day.orders,
        revenue: acc.revenue + day.revenue
    }), { orders: 0, revenue: 0 });

    // Format currency with K/M suffix
    const formatCurrency = (value) => {
        if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
        if (value >= 1000) return `$${(value / 1000).toFixed(1)}K`;
        return `$${value.toFixed(0)}`;
    };

    return (
        <Card sx={{ 
            p: { xs: 2, sm: 3 },
            borderRadius: { xs: 1, sm: 2 }
        }}>
            <Stack spacing={3}>
                <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                    <Box>
                        <Typography variant="h6" gutterBottom sx={{
                            fontSize: { xs: '1rem', sm: '1.25rem' }
                        }}>
                            Daily Distribution
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Weekly Total: {formatCurrency(weeklyTotals.revenue)} • {weeklyTotals.orders} Orders
                        </Typography>
                    </Box>
                    <Stack spacing={1} direction="row" justifyContent="space-between" alignItems="flex-start">
                        <Box textAlign="right">
                            <Typography variant="caption" color="success.main" sx={{ fontWeight: 600 }}>
                                Best: {bestDay.shortName}
                            </Typography>
                            <Typography variant="body2">
                                {formatCurrency(bestDay.revenue)}
                            </Typography>
                        </Box>
                        <Box textAlign="right">
                            <Typography variant="caption" color="error.main" sx={{ fontWeight: 600 }}>
                                Worst: {worstDay.shortName}
                            </Typography>
                            <Typography variant="body2">
                                {formatCurrency(worstDay.revenue)}
                            </Typography>
                        </Box>
                    </Stack>
                </Stack>

                <Box height={{ xs: 250, sm: 300 }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart 
                            data={data}
                            margin={{ top: 5, right: 30, bottom: 20, left: 20 }}
                        >
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.1)" />
                            <XAxis 
                                dataKey="shortName"
                                tick={{ 
                                    fontSize: { xs: 10, sm: 12 },
                                    fill: 'text.secondary'
                                }}
                                axisLine={false}
                                tickLine={false}
                            />
                            <YAxis 
                                yAxisId="left"
                                orientation="left"
                                tickFormatter={formatCurrency}
                                tick={{ 
                                    fontSize: { xs: 10, sm: 12 },
                                    fill: 'text.secondary'
                                }}
                                axisLine={false}
                                tickLine={false}
                            />
                            <YAxis 
                                yAxisId="right"
                                orientation="right"
                                tickFormatter={(value) => `${value}`}
                                tick={{ 
                                    fontSize: { xs: 10, sm: 12 },
                                    fill: 'text.secondary'
                                }}
                                axisLine={false}
                                tickLine={false}
                            />
                            <Tooltip 
                                contentStyle={{
                                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                                    borderRadius: 8,
                                    border: '1px solid #eee',
                                    boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
                                    padding: '8px 12px'
                                }}
                                formatter={(value, name, props) => {
                                    if (name === 'revenue') return [formatCurrency(value), 'Revenue'];
                                    if (name === 'orders') return [`${value}`, 'Orders'];
                                    if (name === 'avgOrderValue') return [formatCurrency(value), 'Avg Order'];
                                    return [value, name];
                                }}
                                cursor={{ fill: 'rgba(0,0,0,0.1)' }}
                            />
                            <Legend 
                                verticalAlign="top"
                                height={36}
                                wrapperStyle={{ fontSize: { xs: 10, sm: 12 } }}
                            />
                            <Bar 
                                yAxisId="left"
                                dataKey="revenue" 
                                fill={THEME_COLORS.primary.main}
                                radius={[4, 4, 0, 0]}
                                name="Revenue"
                            />
                            <Bar 
                                yAxisId="right"
                                dataKey="orders" 
                                fill={THEME_COLORS.success.main}
                                radius={[4, 4, 0, 0]}
                                name="Orders"
                            />
                        </BarChart>
                    </ResponsiveContainer>
                </Box>
            </Stack>
        </Card>
    );
};

const Orders = () => {
    const navigate = useNavigate();
    const theme = useTheme();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(5);
    const [anchorEl, setAnchorEl] = useState(null);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [downloadMenuAnchorEl, setDownloadMenuAnchorEl] = useState(null);
    const [filters, setFilters] = useState({
        startDate: '',
        endDate: '',
        minAmount: '',
        maxAmount: '',
        status: '',
        paymentStatus: '',
        deliveryStatus: '',
        sortBy: '',
        sortOrder: ''
    });
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedProduct, setSelectedProduct] = useState('');
    const [products, setProducts] = useState([]);
    const [statusUpdateDialog, setStatusUpdateDialog] = useState({
        open: false,
        orderId: null,
        currentStatus: ''
    });
    const [showFilters, setShowFilters] = useState(false);
    const [activeFilters, setActiveFilters] = useState(0);
    const [analytics, setAnalytics] = useState({
        totalOrders: 0,
        totalRevenue: 0,
        dailyOrders: 0,
        weeklyOrders: 0,
        monthlyOrders: 0,
        revenueData: [],
        productDistribution: []
    });

    const handleDownload = async (format) => {
        try {
            setLoading(true);
            const userId = localStorage.getItem('user_id');
            
            // Show loading message
            console.log('Preparing download...');
            
            const queryParams = new URLSearchParams({
                ...filters,
                search: searchTerm,
                productId: selectedProduct,
                format,
                includeAnalytics: true,
                timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
                reportType: 'detailed',
                page: page + 1,
                pageSize: rowsPerPage,
                sortBy: filters.sortBy || 'createdAt',
                sortOrder: filters.sortOrder || 'desc'
            }).toString();
            
            const response = await axios.get(
                `${process.env.REACT_APP_BACKEND_URL}/deals/order/distributor-orders/${userId}/download?${queryParams}`,
                { 
                    responseType: 'blob',
                    timeout: 30000,
                    headers: {
                        'Accept': format === 'csv' ? 'application/zip' : 'application/pdf',
                    },
                    onDownloadProgress: (progressEvent) => {
                        const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                        console.log(`Download Progress: ${percentCompleted}%`);
                    }
                }
            );
            
            // Validate the response
            if (!response.data || response.data.size === 0) {
                throw new Error('Empty response received');
            }

            // Get filename from response headers or generate one
            let filename = '';
            const disposition = response.headers['content-disposition'];
            if (disposition && disposition.includes('filename=')) {
                filename = disposition.split('filename=')[1].replace(/["']/g, '');
            } else {
                const dateStr = new Date().toISOString().split('T')[0];
                const timeStr = new Date().toLocaleTimeString().replace(/:/g, '-');
                const filterStr = Object.entries(filters)
                    .filter(([_, value]) => value !== '')
                    .map(([key, _]) => key.substring(0, 3))
                    .join('-');
                
                filename = `orders-report_${dateStr}_${timeStr}${filterStr ? '_filtered-' + filterStr : ''}.${format === 'csv' ? 'zip' : format}`;
            }

            // Create blob with proper type
            const blob = new Blob([response.data], { 
                type: format === 'csv' 
                    ? 'application/zip' 
                    : 'application/pdf'
            });
            
            // Create and trigger download
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', filename);
            document.body.appendChild(link);
            
            // Trigger download
            console.log('Starting download...');
            link.click();
            
            // Cleanup
            setTimeout(() => {
                document.body.removeChild(link);
                window.URL.revokeObjectURL(url);
                console.log('Download cleanup completed');
            }, 100);

            setDownloadMenuAnchorEl(null);
            console.log('Download completed successfully');
            
        } catch (error) {
            console.error('Error downloading orders:', error);
            let errorMessage = 'Failed to download report. ';
            
            if (error.response) {
                switch (error.response.status) {
                    case 404:
                        errorMessage += 'No data found with current filters.';
                        break;
                    case 413:
                        errorMessage += 'Report too large. Try applying more filters.';
                        break;
                    case 429:
                        errorMessage += 'Too many download requests. Please wait.';
                        break;
                    default:
                        errorMessage += 'Server error occurred.';
                }
            } else if (error.code === 'ECONNABORTED') {
                errorMessage += 'Request timed out. Try with fewer data.';
            } else if (error.message === 'Empty response received') {
                errorMessage += 'No data available to download.';
            } else {
                errorMessage += 'An unexpected error occurred.';
            }
            
            // Here you should implement your preferred way to show errors to the user
            console.error(errorMessage);
            
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOrders();
    }, [filters, searchTerm, selectedProduct]); // Add dependencies to trigger refetch when filters change

    useEffect(() => {
        const count = Object.values(filters).filter(value => value !== '').length + (searchTerm ? 1 : 0);
        setActiveFilters(count);
    }, [filters, searchTerm]);

    const fetchOrders = async () => {
        setLoading(true);
        const userId = localStorage.getItem('user_id');
        try {
            // Build query parameters from filters
            const queryParams = new URLSearchParams({
                ...filters,
                search: searchTerm,
                productId: selectedProduct,
            }).toString();
            
            const response = await axios.get(
                `${process.env.REACT_APP_BACKEND_URL}/deals/order/distributor-orders/${userId}?${queryParams}`
            );
            setOrders(response.data.commitments);
            setAnalytics(response.data.analytics);
            setProducts(response.data.products);
        } catch (error) {
            console.error('Error fetching orders:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleFilterChange = (field) => (event) => {
        setFilters(prev => ({
            ...prev,
            [field]: event.target.value
        }));
    };

    const handleClearFilters = () => {
        setFilters({
            startDate: '',
            endDate: '',
            minAmount: '',
            maxAmount: '',
            status: '',
            sortBy: '',
            sortOrder: ''
        });
        setSearchTerm('');
        setSelectedProduct('');
    };

    if (loading) {
        return (
            <Container>
                <Box sx={{ mb: 3 }}>
                    <Skeleton variant="text" sx={{ fontSize: '2rem', width: '30%' }} />
                </Box>
                <TableSkeleton columnsNum={8} />
            </Container>
        );
    }

    return (
        <DashboardContainer>
            {/* Header Section */}
            <Box className="dashboard-section">
                <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ 
                    flexWrap: 'wrap', 
                    gap: { xs: 1, sm: 2 },
                    mb: { xs: 2, sm: 3 }
                }}>
                    <Stack spacing={0.5}>
                        <Typography variant="h5" sx={{
                            fontSize: { xs: '1.25rem', sm: '1.5rem', md: '1.75rem' }
                        }}>
                            Orders Dashboard
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{
                            fontSize: { xs: '0.75rem', sm: '0.875rem' }
                        }}>
                            {analytics.totalOrders} total orders • ${analytics.totalRevenue?.toFixed(2)} revenue
                        </Typography>
                    </Stack>
                    <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap' }}>
                        <Button
                            variant="outlined"
                            startIcon={<Download />}
                            onClick={(e) => setDownloadMenuAnchorEl(e.currentTarget)}
                            size="small"
                            sx={{ 
                                fontSize: { xs: '0.75rem', sm: '0.875rem' },
                                whiteSpace: 'nowrap'
                            }}
                        >
                            Download
                        </Button>
                    </Stack>
                </Stack>

                {/* Filter Section */}
                <Paper sx={{ 
                    mt: { xs: 2, sm: 3 },
                    p: { xs: 1.5, sm: 2 },
                    borderRadius: { xs: 1, sm: 2 }
                }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                        <Button
                            onClick={() => setShowFilters(!showFilters)}
                            startIcon={<FilterAlt />}
                            endIcon={showFilters ? <ExpandLess /> : <ExpandMore />}
                            color="primary"
                        >
                            <Badge badgeContent={activeFilters} color="primary" sx={{ mr: 1 }}>
                                Filters
                            </Badge>
                        </Button>
                        {activeFilters > 0 && (
                            <Button
                                variant="text"
                                startIcon={<Clear />}
                                onClick={handleClearFilters}
                                size="small"
                            >
                                Clear All
                            </Button>
                        )}
                    </Box>

                    <Collapse in={showFilters}>
                        <FilterContainer>
                            <Grid container spacing={2}>
                                <Grid item xs={12}>
                                    <Box sx={{ mb: 2 }}>
                                        <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                                            Quick Filters
                                        </Typography>
                                        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                                            {['Today', 'Last 7 Days', 'Last 30 Days', 'Pending Orders', 'Approved Orders'].map((label) => (
                                                <Chip
                                                    key={label}
                                                    label={label}
                                                    onClick={() => {
                                                        if (label === 'Today') {
                                                            setFilters(prev => ({ ...prev, startDate: new Date().toISOString().split('T')[0] }));
                                                        } else if (label === 'Last 7 Days') {
                                                            const date = new Date();
                                                            date.setDate(date.getDate() - 7);
                                                            setFilters(prev => ({ ...prev, startDate: date.toISOString().split('T')[0] }));
                                                        } else if (label === 'Last 30 Days') {
                                                            const date = new Date();
                                                            date.setDate(date.getDate() - 30);
                                                            setFilters(prev => ({ ...prev, startDate: date.toISOString().split('T')[0] }));
                                                        } else if (label === 'Pending Orders') {
                                                            setFilters(prev => ({ ...prev, status: 'pending' }));
                                                        } else if (label === 'Approved Orders') {
                                                            setFilters(prev => ({ ...prev, status: 'approved' }));
                                                        }
                                                    }}
                                                    variant="outlined"
                                                    color="primary"
                                                    sx={{
                                                        '&:hover': {
                                                            backgroundColor: 'primary.light',
                                                            color: 'primary.contrastText'
                                                        }
                                                    }}
                                                />
                                            ))}
                                        </Box>
                                    </Box>
                                </Grid>

                                <Grid item xs={12} md={4}>
                                    <FilterTextField
                                        label="Search Orders"
                                        name="search"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        fullWidth
                                        placeholder="Search by customer or product..."
                                        InputProps={{
                                            startAdornment: (
                                                <InputAdornment position="start">
                                                    <Search fontSize="small" />
                                                </InputAdornment>
                                            ),
                                        }}
                                    />
                                </Grid>

                                <Grid item xs={12} sm={6} md={4}>
                                    <FilterFormControl fullWidth>
                                        <InputLabel>Order Status</InputLabel>
                                        <FilterSelect
                                            value={filters.status}
                                            onChange={handleFilterChange('status')}
                                            label="Order Status"
                                            name="status"
                                        >
                                            <MenuItem value=""><em>All Statuses</em></MenuItem>
                                            <MenuItem value="pending">Pending</MenuItem>
                                            <MenuItem value="approved">Approved</MenuItem>
                                            <MenuItem value="cancelled">Cancelled</MenuItem>
                                        </FilterSelect>
                                    </FilterFormControl>
                                </Grid>

                                <Grid item xs={12} sm={6} md={4}>
                                    <FilterFormControl fullWidth>
                                        <InputLabel>Sort By</InputLabel>
                                        <FilterSelect
                                            value={filters.sortBy}
                                            onChange={handleFilterChange('sortBy')}
                                            label="Sort By"
                                            name="sortBy"
                                        >
                                            <MenuItem value="createdAt">Date</MenuItem>
                                            <MenuItem value="totalPrice">Amount</MenuItem>
                                            <MenuItem value="quantity">Quantity</MenuItem>
                                        </FilterSelect>
                                    </FilterFormControl>
                                </Grid>

                                <Grid item xs={12}>
                                    <Divider sx={{ my: 2 }} />
                                    <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 2 }}>
                                        Date Range
                                    </Typography>
                                    <Grid container spacing={2}>
                                        <Grid item xs={12} sm={6} md={4}>
                                            <FilterTextField
                                                type="date"
                                                label="From Date"
                                                name="startDate"
                                                value={filters.startDate}
                                                onChange={handleFilterChange('startDate')}
                                                InputLabelProps={{ shrink: true }}
                                                fullWidth
                                            />
                                        </Grid>
                                        <Grid item xs={12} sm={6} md={4}>
                                            <FilterTextField
                                                type="date"
                                                label="To Date"
                                                name="endDate"
                                                value={filters.endDate}
                                                onChange={handleFilterChange('endDate')}
                                                InputLabelProps={{ shrink: true }}
                                                fullWidth
                                            />
                                        </Grid>
                                    </Grid>
                                </Grid>
                            </Grid>
                        </FilterContainer>
                    </Collapse>
                </Paper>
            </Box>

            {/* Metric Cards Section */}
            <Box className="dashboard-section">
                <Grid container spacing={{ xs: 2, sm: 2.5, md: 3 }}>
                    <Grid item xs={12} sm={6} md={3} sx={{mb : 5}}>
                        <MetricCard>
                            <Box className="icon-wrapper" 
                                sx={{ bgcolor: 'primary.lighter', color: 'primary.main' }}
                            >
                                <ShoppingCart />
                            </Box>
                            <Typography className="metric-label">
                                Total Orders
                            </Typography>
                            <Typography className="metric-value" color="primary.main">
                                {analytics.totalOrders?.toLocaleString() || 0}
                            </Typography>
                            <Box className="trend" sx={{ color: 'success.main' }}>
                                <TrendingUp fontSize="small" />
                                <Typography variant="caption">
                                    {analytics.dailyOrders > 0 ? 
                                        `+${((analytics.dailyOrders / (analytics.totalOrders || 1)) * 100).toFixed(1)}% today` : 
                                        'No orders today'}
                                </Typography>
                            </Box>
                        </MetricCard>
                    </Grid>

                    <Grid item xs={12} sm={6} md={3} sx={{mb : 5}}>
                        <MetricCard>
                            <Box className="icon-wrapper" 
                                sx={{ bgcolor: 'success.lighter', color: 'success.main' }}
                            >
                                <AttachMoney />
                            </Box>
                            <Typography className="metric-label">
                                Total Revenue
                            </Typography>
                            <Typography className="metric-value" color="success.main">
                                ${(analytics.totalRevenue || 0).toLocaleString(undefined, {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2
                                })}
                            </Typography>
                            <Box className="trend" sx={{ color: 'success.main' }}>
                                <TrendingUp fontSize="small" />
                                <Typography variant="caption">
                                    Avg ${analytics.averageOrderValue?.toFixed(2) || '0.00'}/order
                                </Typography>
                            </Box>
                        </MetricCard>
                    </Grid>

                    <Grid item xs={12} sm={6} md={3} sx={{mb:5}}>
                        <MetricCard>
                            <Box className="icon-wrapper" 
                                sx={{ bgcolor: 'warning.lighter', color: 'warning.main' }}
                            >
                                <Diamond />
                            </Box>
                            <Typography className="metric-label">
                                Top Performing Deal
                            </Typography>
                            <Typography className="metric-value" color="warning.main">
                                ${(Math.max(...(analytics.productDistribution || [])
                                    .map(product => product.revenue || 0), 0)).toLocaleString(undefined, {
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2
                                    })}
                            </Typography>
                            <Box className="trend" sx={{ color: 'text.secondary' }}>
                                <Inventory fontSize="small" />
                                <Typography variant="caption" noWrap>
                                    {analytics.productDistribution?.[0]?.name || 'No active deals'}
                                </Typography>
                            </Box>
                        </MetricCard>
                    </Grid>

                    <Grid item xs={12} sm={6} md={3} sx={{mb:5}}>
                        <MetricCard>
                            <Box className="icon-wrapper" 
                                sx={{ bgcolor: 'info.lighter', color: 'info.main' }}
                            >
                                <TrendingUp />
                            </Box>
                            <Typography className="metric-label">
                                Today's Orders
                            </Typography>
                            <Typography className="metric-value" color="info.main">
                                {analytics.dailyOrders?.toLocaleString() || 0}
                            </Typography>
                            <Box className="trend" sx={{ 
                                color: analytics.dailyOrders > (analytics.weeklyOrders/7) ? 'success.main' : 'error.main' 
                            }}>
                                {analytics.dailyOrders > (analytics.weeklyOrders/7) ? 
                                    <TrendingUp fontSize="small" /> : 
                                    <TrendingDown fontSize="small" />
                                }
                                <Typography variant="caption">
                                    {analytics.weeklyOrders ? 
                                        `${(((analytics.dailyOrders / (analytics.weeklyOrders/7)) - 1) * 100).toFixed(1)}% vs avg` :
                                        'No weekly data'
                                    }
                                </Typography>
                            </Box>
                        </MetricCard>
                    </Grid>
                </Grid>
            </Box>

            <Box className="dashboard-section" sx={{ mb: 0 }}>
                <OrdersTable 
                    orders={orders.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)}
                    page={page}
                    rowsPerPage={rowsPerPage}
                    handlePageChange={(e, newPage) => setPage(newPage)}
                    handleRowsPerPageChange={(e) => {
                        setRowsPerPage(parseInt(e.target.value, 10));
                        setPage(0);
                    }}
                    onOrderSelect={setSelectedOrder}
                    onMenuOpen={setAnchorEl}
                />
            </Box>
            {/* Comparison Section */}
            <Box className="dashboard-section">
                <TimeComparisonSection analytics={analytics} />
            </Box>

            {/* Charts Section */}
            <Box className="dashboard-section">
                <Grid container spacing={{ xs: 2, sm: 2.5, md: 3 }}>
                    <Grid item xs={12} lg={6}>
                        <SeasonalTrendsChart analytics={analytics} />
                    </Grid>
                    <Grid item xs={12} lg={6}>
                        <WeeklyTrendsChart analytics={analytics} />
                    </Grid>
                </Grid>
            </Box>

            {/* Daily Distribution Section */}
            <Box className="dashboard-section" sx={{mt:10}}>
                <DailyDistributionChart analytics={analytics} />
            </Box>

            {/* Spend Overview Section */}
            <Box className="dashboard-section">
                <SpendOverview analytics={analytics} />
            </Box>

            {/* Line Graph Section */}
            <Box className="dashboard-section">
                <LineGraph analytics={analytics} />
            </Box>

            {/* Orders Table Section */}


            {/* Reuse existing dialogs and menus */}
            <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={() => setAnchorEl(null)}
                PaperProps={{
                    sx: {
                        mt: 1.5,
                        boxShadow: 4,
                        borderRadius: '12px',
                        minWidth: '200px',
                        '& .MuiMenuItem-root': {
                            px: 2,
                            py: 1,
                            borderRadius: '8px',
                            mx: 1,
                            my: 0.5,
                            '&:hover': {
                                backgroundColor: theme => `${theme.palette.primary.main}15`,
                            },
                        },
                    },
                }}
            >
                <MenuItem 
                    onClick={() => {
                        if (selectedOrder) {
                            navigate(`/dashboard/distributer/orders/${selectedOrder.dealId._id}`);
                        }
                        setAnchorEl(null);
                    }}
                    sx={{ gap: 1.5 }}
                >
                    <Assessment sx={{ fontSize: 20 }} /> View Details
                </MenuItem>
            </Menu>

            <Menu
                anchorEl={downloadMenuAnchorEl}
                open={Boolean(downloadMenuAnchorEl)}
                onClose={() => setDownloadMenuAnchorEl(null)}
                PaperProps={{
                    sx: {
                        mt: 1.5,
                        boxShadow: 4,
                        borderRadius: '12px',
                        minWidth: 200,
                    }
                }}
            >
                <MenuItem onClick={() => handleDownload('csv')} sx={{ gap: 2 }}>
                    <TableChart fontSize="small" />
                    Download CSV
                </MenuItem>
                <MenuItem onClick={() => handleDownload('pdf')} sx={{ gap: 2 }}>
                    <PictureAsPdf fontSize="small" />
                    Download PDF
                </MenuItem>
            </Menu>
        </DashboardContainer>
    );
};

// New components for better organization
const OrderStatusChip = ({ status }) => {
    const getStatusColor = (status) => {
        switch (status) {
            case 'approved': return 'success';
            case 'pending': return 'warning';
            default: return 'error';
        }
    };

    return (
        <Chip 
            label={status}
            size="small"
            color={getStatusColor(status)}
            sx={{
                fontWeight: 600,
                textTransform: 'capitalize',
                minWidth: { xs: 60, sm: 80 },
                height: { xs: 20, sm: 24 },
                '& .MuiChip-label': {
                    fontSize: { xs: '0.65rem', sm: '0.75rem' },
                    px: { xs: 1, sm: 2 }
                }
            }}
        />
    );
};

const MetricCard = styled(Card)(({ theme }) => ({
    height: '100%',
    padding: theme.spacing(2),
    [theme.breakpoints.up('sm')]: {
        padding: theme.spacing(2.5),
    },
    display: 'flex',
    flexDirection: 'column',
    background: theme.palette.background.paper,
    borderRadius: theme.spacing(1),
    [theme.breakpoints.up('sm')]: {
        borderRadius: theme.spacing(1.5),
    },
    position: 'relative',
    overflow: 'hidden',
    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
    '&:hover': {
        transform: 'translateY(-4px)',
        boxShadow: theme.shadows[4],
    },
    '& .metric-value': {
        fontSize: '1.25rem',
        [theme.breakpoints.up('sm')]: {
            fontSize: '1.5rem',
        },
        [theme.breakpoints.up('md')]: {
            fontSize: '1.75rem',
        },
        fontWeight: 600,
        marginTop: theme.spacing(1),
        marginBottom: theme.spacing(0.5),
    },
    '& .metric-label': {
        color: theme.palette.text.secondary,
        fontSize: '0.75rem',
        [theme.breakpoints.up('sm')]: {
            fontSize: '0.875rem',
        },
        fontWeight: 500,
    },
    '& .trend': {
        display: 'flex',
        alignItems: 'center',
        gap: theme.spacing(0.5),
        marginTop: 'auto',
        paddingTop: theme.spacing(1),
        '& .MuiTypography-caption': {
            fontSize: '0.7rem',
            [theme.breakpoints.up('sm')]: {
                fontSize: '0.75rem',
            },
        },
    },
    '& .icon-wrapper': {
        position: 'absolute',
        top: theme.spacing(2),
        right: theme.spacing(2),
        width: 32,
        height: 32,
        [theme.breakpoints.up('sm')]: {
            width: 42,
            height: 42,
            top: theme.spacing(2.5),
            right: theme.spacing(2.5),
        },
        borderRadius: '8px',
        [theme.breakpoints.up('sm')]: {
            borderRadius: '12px',
        },
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        '& .MuiSvgIcon-root': {
            fontSize: '1.25rem',
            [theme.breakpoints.up('sm')]: {
                fontSize: '1.5rem',
            },
        },
    }
}));


export default Orders;
