import React, { useEffect, useState, useRef } from 'react';
import api from '../../../services/api';
import { useAuth } from '../../../middleware/auth';
import {
  Grid,
  Paper,
  Typography,
  Box,
  CircularProgress,
  Card,
  CardContent,
  Tabs,
  Tab,
  Button,
  ButtonGroup,
  Divider,
  List,
  ListItem,
  ListItemText,
  Alert,
  Snackbar,
  Menu,
  MenuItem,
  IconButton,
  TextField,
  InputAdornment,
  Chip,
  Stack,
  Autocomplete,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Skeleton,
} from '@mui/material';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  BarChart,
  Bar,
} from 'recharts';
import {
  TrendingUp,
  Category,
  SaveAlt,
  Timeline,
  MonetizationOn,
  FileDownload,
  FilterList,
  Search,
  DateRange,
} from '@mui/icons-material';
import { DateRangePicker } from '@mui/lab';
import { CSVLink } from 'react-csv';
import { format, subMonths } from 'date-fns';
import { saveAs } from 'file-saver';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { AnalyticsSkeleton } from '../../../Components/Skeletons/LoadingSkeletons';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

// Add styles for PDF
const styles = {
  page: {
    padding: 30,
  },
  section: {
    margin: 10,
    padding: 10,
  },
  title: {
    fontSize: 18,
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 14,
    marginBottom: 8,
  },
  text: {
    fontSize: 12,
    marginBottom: 5,
  }
};

const DetailedAnalytics = () => {
  const { currentUserId, isImpersonating } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('year'); // year, quarter, month
  const [currentTab, setCurrentTab] = useState(0);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [filters, setFilters] = useState({
    dateRange: [null, null],
    categories: [],
    minAmount: '',
    maxAmount: '',
    searchTerm: '',
  });
  const [availableCategories, setAvailableCategories] = useState([]);
  const [filterMenuAnchor, setFilterMenuAnchor] = useState(null);
  const [filterDialogOpen, setFilterDialogOpen] = useState(false);
  const csvLinkRef = useRef();

  useEffect(() => {
    fetchDetailedAnalytics();
  }, [currentUserId, timeRange]);

  const fetchDetailedAnalytics = async () => {
    try {
      setLoading(true);
      const response = await api.get(
        `/member/detailed-analytics?timeRange=${timeRange}`
      );
      setData(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching detailed analytics:', error);
      setLoading(false);
      setData(null);
      setSnackbar({
        open: true,
        message: 'Error loading analytics data',
        severity: 'error'
      });
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(value);
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <Paper sx={{ p: 2 }}>
          <Typography variant="subtitle2">{label}</Typography>
          {payload.map((entry, index) => (
            <Typography key={index} variant="body2" sx={{ color: entry.color }}>
              {entry.name}: {formatCurrency(entry.value)}
            </Typography>
          ))}
        </Paper>
      );
    }
    return null;
  };

  const renderSpendingTrends = () => (
    <Paper sx={{ p: 3 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h6">
          Spending Trends
        </Typography>
        <ButtonGroup size="small">
          <Button 
            variant={timeRange === 'month' ? 'contained' : 'outlined'}
            onClick={() => setTimeRange('month')}
            color={timeRange === 'month' ? 'primary.main' : 'primary.contrastText'}
          >
            Month
          </Button>
          <Button 
            variant={timeRange === 'quarter' ? 'contained' : 'outlined'}
            onClick={() => setTimeRange('quarter')}
            color={timeRange === 'quarter' ? 'primary.main' : 'primary.contrastText'}
          >
            Quarter
          </Button>
          <Button 
            color={timeRange === 'year' ? 'primary.main' : 'primary.contrastText'}
            variant={timeRange === 'year' ? 'contained' : 'outlined'}
            onClick={() => setTimeRange('year')}
          >
            Year
          </Button>
        </ButtonGroup>
      </Box>
      {!data || !data.yearlySpending || data.yearlySpending.length === 0 ? (
        <Box sx={{ py: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Typography variant="h6" color="text.secondary">No spending data available</Typography>
        </Box>
      ) : (
        <ResponsiveContainer width="100%" height={400}>
          <AreaChart data={data.yearlySpending}>
            <defs>
              <linearGradient id="colorSpending" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#8884d8" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="colorSavings" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#82ca9d" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#82ca9d" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="_id.month" />
            <YAxis />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Area
              type="monotone"
              dataKey="totalSpent"
              stroke="#8884d8"
              fillOpacity={1}
              fill="url(#colorSpending)"
              name="Total Spent"
            />
            <Area
              type="monotone"
              dataKey="savings"
              stroke="#82ca9d"
              fillOpacity={1}
              fill="url(#colorSavings)"
              name="Savings"
            />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </Paper>
  );

  const renderCategoryAnalysis = () => (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>
        Category Analysis
      </Typography>
      {!data || !data.categoryPreferences || data.categoryPreferences.length === 0 ? (
        <Box sx={{ py: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Typography variant="h6" color="text.secondary">No category data available</Typography>
        </Box>
      ) : (
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={data.categoryPreferences}
                  dataKey="totalSpent"
                  nameKey="_id"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                >
                  {data.categoryPreferences.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </Grid>
          <Grid item xs={12} md={6}>
            <List>
              {data.categoryPreferences.map((category, index) => (
                <ListItem key={index}>
                  <ListItemText
                    primary={category._id}
                    secondary={`Total Spent: ${formatCurrency(category.totalSpent)}`}
                  />
                </ListItem>
              ))}
            </List>
          </Grid>
        </Grid>
      )}
    </Paper>
  );

  const renderSavingsAnalysis = () => (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>
        Savings Analysis
      </Typography>
      {!data || !data.savingsAnalysis ? (
        <Box sx={{ py: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Typography variant="h6" color="text.secondary">No savings data available</Typography>
        </Box>
      ) : (
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" color="textSecondary">
                  Total Savings
                </Typography>
                <Typography variant="h4" color="primary.contrastText">
                  {formatCurrency(data.savingsAnalysis.totalSavings || 0)}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" color="textSecondary">
                  Average Savings per Deal
                </Typography>
                <Typography variant="h4" color="primary.contrastText">
                  {formatCurrency(data.savingsAnalysis.averageSavings || 0)}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" color="textSecondary">
                  Savings Rate
                </Typography>
                <Typography variant="h4" color="primary.contrastText">
                  {(() => {
                    // Safe calculation of savings rate
                    const totalSavings = data.savingsAnalysis.totalSavings || 0;
                    const totalSpent = data.yearlySpending && Array.isArray(data.yearlySpending) 
                      ? data.yearlySpending.reduce((acc, curr) => acc + (curr.totalSpent || 0), 0) 
                      : 0;
                    
                    // Avoid division by zero
                    if (totalSavings === 0 || (totalSavings + totalSpent) === 0) {
                      return '0.0%';
                    }
                    
                    return ((totalSavings / (totalSavings + totalSpent)) * 100).toFixed(1) + '%';
                  })()}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}
    </Paper>
  );

  const handleFilterChange = (type, value) => {
    setFilters(prev => ({
      ...prev,
      [type]: value
    }));
  };

  const applyFilters = () => {
    fetchDetailedAnalytics();
    setFilterDialogOpen(false);
  };

  const generatePDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    
    // Add title
    doc.setFontSize(18);
    doc.text('Analytics Report', pageWidth/2, 20, { align: 'center' });
    
    // Add date range
    doc.setFontSize(12);
    doc.text(`Report generated on ${format(new Date(), 'PPP')}`, pageWidth/2, 30, { align: 'center' });

    // Add spending trends
    doc.setFontSize(14);
    doc.text('Spending Trends', 14, 50);
    
    const spendingData = data.yearlySpending.map(item => [
      format(new Date(item._id.year, item._id.month - 1), 'MMM yyyy'),
      formatCurrency(item.totalSpent),
      formatCurrency(item.savings),
      `${(item.averageDiscount * 100).toFixed(1)}%`
    ]);

    doc.autoTable({
      startY: 60,
      head: [['Period', 'Total Spent', 'Savings', 'Avg. Discount']],
      body: spendingData,
    });

    // Add category analysis
    const categoryStartY = doc.previousAutoTable.finalY + 20;
    doc.text('Category Analysis', 14, categoryStartY);

    const categoryData = data.categoryPreferences.map(cat => [
      cat._id,
      formatCurrency(cat.totalSpent),
      cat.count,
      `${cat.savingsPercentage.toFixed(1)}%`
    ]);

    doc.autoTable({
      startY: categoryStartY + 10,
      head: [['Category', 'Total Spent', 'Transactions', 'Savings %']],
      body: categoryData,
    });

    // Add savings analysis
    const savingsStartY = doc.previousAutoTable.finalY + 20;
    doc.text('Savings Analysis', 14, savingsStartY);

    const savingsData = [
      ['Total Savings', formatCurrency(data.savingsAnalysis.totalSavings)],
      ['Average Savings', formatCurrency(data.savingsAnalysis.averageSavings)],
      ['Maximum Savings', formatCurrency(data.savingsAnalysis.maxSavings)],
      ['Total Transactions', data.savingsAnalysis.totalTransactions],
      ['Savings Rate', `${data.savingsAnalysis.savingsRate.toFixed(1)}%`]
    ];

    doc.autoTable({
      startY: savingsStartY + 10,
      head: [['Metric', 'Value']],
      body: savingsData,
    });

    // Save the PDF
    doc.save(`analytics_report_${format(new Date(), 'yyyy-MM-dd')}.pdf`);
  };

  const generateCSVData = () => {
    const spendingData = data.yearlySpending.map(item => ({
      period: format(new Date(item._id.year, item._id.month - 1), 'MMM yyyy'),
      totalSpent: item.totalSpent,
      savings: item.savings,
      averageDiscount: `${(item.averageDiscount * 100).toFixed(1)}%`,
      transactionCount: item.count
    }));

    const categoryData = data.categoryPreferences.map(cat => ({
      category: cat._id,
      totalSpent: cat.totalSpent,
      transactionCount: cat.count,
      averageSpent: cat.averageSpent,
      totalSavings: cat.totalSavings,
      savingsPercentage: `${cat.savingsPercentage.toFixed(1)}%`
    }));

    return {
      filename: `analytics_report_${format(new Date(), 'yyyy-MM-dd')}.csv`,
      data: [
        // Spending Trends
        ['Spending Trends'],
        ['Period', 'Total Spent', 'Savings', 'Avg. Discount', 'Transactions'],
        ...spendingData.map(item => [
          item.period,
          item.totalSpent,
          item.savings,
          item.averageDiscount,
          item.transactionCount
        ]),
        [''], // Empty row for separation
        // Category Analysis
        ['Category Analysis'],
        ['Category', 'Total Spent', 'Transactions', 'Avg. Spent', 'Total Savings', 'Savings %'],
        ...categoryData.map(cat => [
          cat.category,
          cat.totalSpent,
          cat.transactionCount,
          cat.averageSpent,
          cat.totalSavings,
          cat.savingsPercentage
        ]),
        [''], // Empty row for separation
        // Savings Analysis
        ['Savings Analysis'],
        ['Metric', 'Value'],
        ['Total Savings', data.savingsAnalysis.totalSavings],
        ['Average Savings', data.savingsAnalysis.averageSavings],
        ['Maximum Savings', data.savingsAnalysis.maxSavings],
        ['Total Transactions', data.savingsAnalysis.totalTransactions],
        ['Savings Rate', `${data.savingsAnalysis.savingsRate.toFixed(1)}%`]
      ]
    };
  };

  const FilterDialog = () => (
    <Dialog 
      open={filterDialogOpen} 
      onClose={() => setFilterDialogOpen(false)}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle>Filter Analytics</DialogTitle>
      <DialogContent>
        <Grid container spacing={3} sx={{ mt: 1 }}>
          <Grid item xs={12}>
            <DateRangePicker
              value={filters.dateRange}
              onChange={(newValue) => handleFilterChange('dateRange', newValue)}
              renderInput={(startProps, endProps) => (
                <>
                  <TextField {...startProps} />
                  <Box sx={{ mx: 2 }}> to </Box>
                  <TextField {...endProps} />
                </>
              )}
            />
          </Grid>
          <Grid item xs={12}>
            <Autocomplete
              multiple
              options={availableCategories}
              value={filters.categories}
              onChange={(_, newValue) => handleFilterChange('categories', newValue)}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Categories"
                  placeholder="Select categories"
                />
              )}
              renderTags={(value, getTagProps) =>
                value.map((option, index) => (
                  <Chip
                    label={option}
                    {...getTagProps({ index })}
                    color="primary"
                    variant="outlined"
                  />
                ))
              }
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Minimum Amount"
              type="number"
              value={filters.minAmount}
              onChange={(e) => handleFilterChange('minAmount', e.target.value)}
              InputProps={{
                startAdornment: <InputAdornment position="start">$</InputAdornment>,
              }}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Maximum Amount"
              type="number"
              value={filters.maxAmount}
              onChange={(e) => handleFilterChange('maxAmount', e.target.value)}
              InputProps={{
                startAdornment: <InputAdornment position="start">$</InputAdornment>,
              }}
            />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setFilterDialogOpen(false)}>Cancel</Button>
        <Button onClick={applyFilters} variant="contained">Apply Filters</Button>
      </DialogActions>
    </Dialog>
  );

  const renderToolbar = () => (
    <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <TextField
        size="small"
        placeholder="Search..."
        value={filters.searchTerm}
        onChange={(e) => handleFilterChange('searchTerm', e.target.value)}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <Search />
            </InputAdornment>
          ),
        }}
      />
      <Stack direction="row" spacing={1}>
        <IconButton onClick={() => setFilterDialogOpen(true)}>
          <FilterList color='primary.contrastText' />
        </IconButton>
        <Button
          variant="outlined"
          startIcon={<FileDownload color='primary.contrastText' />}
          onClick={(e) => setFilterMenuAnchor(e.currentTarget)}
          color='primary.contrastText'
        >
          Export
        </Button>
        <Menu
          anchorEl={filterMenuAnchor}
          open={Boolean(filterMenuAnchor)}
          onClose={() => setFilterMenuAnchor(null)}
        >
          <MenuItem>
            <CSVLink
              {...generateCSVData()}
              style={{ textDecoration: 'none', color: 'inherit' }}
            >
              Export as CSV
            </CSVLink>
          </MenuItem>
          <MenuItem onClick={() => {
            generatePDF();
            setFilterMenuAnchor(null);
          }}>
            Export as PDF
          </MenuItem>
        </Menu>
      </Stack>
    </Box>
  );

  if (loading) {
    return (
      <Box>
        <Skeleton variant="text" sx={{ fontSize: '2rem', mb: 2 }} />
        <AnalyticsSkeleton />
      </Box>
    );
  }

  return (
    <Box sx={{ flexGrow: 1 }}>
      <Typography variant="h4" gutterBottom>
        Detailed Analytics
      </Typography>

      {renderToolbar()}

      <Tabs
        value={currentTab}
        onChange={(e, newValue) => setCurrentTab(newValue)}
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
        variant="scrollable"
        scrollButtons="auto"
      >
        <Tab icon={<Timeline color='primary.contrastText' />} label="Spending Trends" />
        <Tab icon={<Category color='primary.contrastText'/>} label="Category Analysis" />
        <Tab icon={<SaveAlt color='primary.contrastText'/>} label="Savings Analysis" />
      </Tabs>

      <Box sx={{ mt: 2 }}>
        {currentTab === 0 && renderSpendingTrends()}
        {currentTab === 1 && renderCategoryAnalysis()}
        {currentTab === 2 && renderSavingsAnalysis()}
      </Box>

      <FilterDialog />
      
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert 
          onClose={() => setSnackbar({ ...snackbar, open: false })} 
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default DetailedAnalytics; 