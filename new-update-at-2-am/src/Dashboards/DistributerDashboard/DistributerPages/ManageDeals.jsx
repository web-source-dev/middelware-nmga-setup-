import React, { useEffect, useState } from 'react';
import { Container, Typography, Grid, Paper, Box, Button, IconButton, InputLabel, Skeleton, MenuItem, Card, CardContent, CardMedia, CardActions, Tooltip, Switch, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Menu, MenuItem as DropdownMenuItem, Badge, Collapse, Chip, Divider, InputAdornment, TablePagination, Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions } from '@mui/material';
import { Edit, Delete, Search, Clear, Visibility, ViewModule, ViewList, ViewComfy, Add, GetApp, FilterAlt, ExpandLess, ExpandMore, ContentCopy, MoreVert, DeleteOutline } from '@mui/icons-material';
import api from '../../../services/api';
import { useAuth } from '../../../middleware/auth';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import Toast from '../../../Components/Toast/Toast';
import { saveAs } from 'file-saver';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import useMediaQuery from '@mui/material/useMediaQuery';
import { FilterTextField, FilterSelect, FilterFormControl } from '../../DashBoardComponents/FilterStyles';
import { GridCardsSkeleton, TableSkeleton } from '../../../Components/Skeletons/LoadingSkeletons';
import LinearProgress from '@mui/material/LinearProgress';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

const ManageDeals = () => {
  const { currentUserId, isImpersonating } = useAuth();
  const [deals, setDeals] = useState([]);
  const [categories, setCategories] = useState([]);
  const [layout, setLayout] = useState('table');
  const [toast, setToast] = useState({
    open: false,
    message: '',
    severity: 'success'
  });
  const [confirmDialog, setConfirmDialog] = useState({
    open: false,
    title: '',
    content: '',
    action: null,
    dealId: null,
    dealName: '',
    actionType: ''
  });
  const [debugDialog, setDebugDialog] = useState({
    open: false,
    data: null
  });

  const location = useLocation();
  
  // Load filters from localStorage on component mount
  const getInitialFilters = () => {
    try {
      const savedFilters = localStorage.getItem('manageDealsFilters');
      if (savedFilters) {
        const parsedFilters = JSON.parse(savedFilters);
        // Ensure all filter properties exist with defaults
        return {
          category: parsedFilters.category || '',
          status: parsedFilters.status || '',
          minPrice: parsedFilters.minPrice || '',
          maxPrice: parsedFilters.maxPrice || '',
          search: parsedFilters.search || '',
          sortBy: parsedFilters.sortBy || '',
          month: parsedFilters.month || new Date().getMonth() + 1,
        };
      }
    } catch (error) {
      console.error('Error loading filters from localStorage:', error);
    }
    
    // Default filters if no saved data
    return {
      category: '',
      status: '',
      minPrice: '',
      maxPrice: '',
      search: '',
      sortBy: '',
      month: new Date().getMonth() + 1,
    };
  };

  const [filter, setFilter] = useState(getInitialFilters);
  const navigate = useNavigate();
  const isMobile = useMediaQuery('(max-width:600px)');

  // Pagination state
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5); // Set default rows per page

  // Add Menu state and handlers for download dropdown
  const [downloadAnchorEl, setDownloadAnchorEl] = useState(null);
  const downloadMenuOpen = Boolean(downloadAnchorEl);

  const [loading, setLoading] = useState(false);
  const [anchorElMap, setAnchorElMap] = useState({});

  useEffect(() => {
    if (location.pathname.includes("/admin/profile-management")) {
      localStorage.removeItem('user');

      console.log("Local storage cleared");
    }
  }, [location.pathname]);

  useEffect(() => {
    const fetchDeals = async () => {
      try {
        setLoading(true);
        
        // Prepare params object
        const params = { ...filter };
        
        // Only include month parameter if it has a value
        if (!params.month || params.month === "") {
          delete params.month;
        }
        
        const response = await api.get('/deals/fetch', {
          params
        });
        console.log('API Response:', response.data);
        
        // Store raw response for debugging
        setDebugDialog(prev => ({ ...prev, data: response.data }));
        
        // Get categories from response if available
        if (response.data && response.data.categories) {
          setCategories(response.data.categories);
        }
        
        // Check the structure of the response
        if (response.data && response.data.deals) {
          // If response has a 'deals' property, use it
          console.log(`Found ${response.data.deals.length} deals out of ${response.data.totalDeals} total`);
          
          // Debug commitments data
          if (response.data.deals.length > 0) {
            response.data.deals.forEach(deal => {
              console.log(`Deal "${deal.name}" has ${deal.commitments ? deal.commitments.length : 0} commitments`);
              
              // Log first commitment details if available
              if (deal.commitments && deal.commitments.length > 0) {
                console.log('Sample commitment data:', deal.commitments[0]);
              }
            });
          }
          
          setDeals(response.data.deals);
        } else if (Array.isArray(response.data)) {
          // If response is an array, use it directly
          console.log(`Found ${response.data.length} deals in array format`);
          setDeals(response.data);
        } else {
          // Fallback for unexpected response format
          console.warn('Unexpected response format:', response.data);
          setDeals([]);
        }
        setLoading(false);
      } catch (error) {
        console.error('Error fetching deals:', error);
        setToast({
          open: true,
          message: 'Error refreshing deals list',
          severity: 'error'
        });
        setLoading(false);
      }
    };

    if (currentUserId) {  // Only fetch if currentUserId is available
      fetchDeals();
    }
  }, [currentUserId, location.key, filter]);

  // Confirmation dialog handlers
  const handleConfirmDialogOpen = (title, content, action, dealId, dealName, actionType) => {
    setConfirmDialog({
      open: true,
      title,
      content,
      action,
      dealId,
      dealName,
      actionType
    });
  };

  const handleConfirmDialogClose = () => {
    setConfirmDialog({
      open: false,
      title: '',
      content: '',
      action: null,
      dealId: null,
      dealName: '',
      actionType: ''
    });
  };

  const handleConfirmAction = async () => {
    try {
      if (confirmDialog.action) {
        await confirmDialog.action();
      }
      handleConfirmDialogClose();
    } catch (error) {
      console.error('Error executing action:', error);
      setToast({
        open: true,
        message: `Error ${confirmDialog.actionType} deal`,
        severity: 'error'
      });
    }
  };

  const handleDelete = async (dealId) => {
    const deal = deals.find(d => d._id === dealId);
    handleConfirmDialogOpen(
      'Confirm Delete',
      `Are you sure you want to delete the deal "${deal.name}"? This action cannot be undone.`,
      async () => {
        try {
          const response = await api.delete(`/deals/delete/${dealId}`);
          if (response.data.success) {
            setDeals(deals.filter(deal => deal._id !== dealId));
            setToast({
              open: true,
              message: response.data.message,
              severity: 'success'
            });
          } else {
            setToast({
              open: true,
              message: response.data.message,
              severity: 'error'
            });
          }
        } catch (error) {
          setToast({
            open: true,
            message: error.response?.data?.message || 'Error deleting deal',
            severity: 'error'
          });
        }
      },
      dealId,
      deal.name,
      'deleting'
    );
  };

  const handleToggleChange = async (dealId, currentStatus) => {
    const deal = deals.find(d => d._id === dealId);
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    handleConfirmDialogOpen(
      `Confirm ${newStatus === 'active' ? 'Activation' : 'Deactivation'}`,
      `Are you sure you want to ${newStatus === 'active' ? 'activate' : 'deactivate'} the deal "${deal.name}"?`,
      async () => {
        try {
          const response = await api.patch(`/deals/update-status/${dealId}/status`, { status: newStatus });
          setDeals(deals.map(deal => deal._id === dealId ? response.data : deal));
          setToast({
            open: true,
            message: `Deal ${newStatus === 'active' ? 'activated' : 'deactivated'} successfully`,
            severity: 'success'
          });
        } catch (error) {
          throw error;
        }
      },
      dealId,
      deal.name,
      'updating status of'
    );
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    const newFilter = { ...filter, [name]: value };
    setFilter(newFilter);
    
    // Save to localStorage
    try {
      localStorage.setItem('manageDealsFilters', JSON.stringify(newFilter));
    } catch (error) {
      console.error('Error saving filters to localStorage:', error);
    }
  };

  const handleClearFilters = () => {
    const defaultFilters = { 
      category: '', 
      status: '', 
      minPrice: '', 
      maxPrice: '', 
      search: '', 
      sortBy: '', 
      month: new Date().getMonth() + 1 
    };
    setFilter(defaultFilters);
    
    // Clear from localStorage
    try {
      localStorage.removeItem('manageDealsFilters');
    } catch (error) {
      console.error('Error clearing filters from localStorage:', error);
    }
  };

  const handleCloseToast = () => {
    setToast({ ...toast, open: false });
  };

  const handleEdit = async (deal) => {
    try {
      navigate(`/dashboard/distributor/edit-deal/${deal._id}`, {
        state: { deal }
      });
    } catch (error) {
      console.error('Error navigating to edit:', error);
      setToast({
        open: true,
        message: 'Error accessing edit page',
        severity: 'error'
      });
    }
  };

  const handleView = (dealId) => {
    navigate(`/distributor/view-deal/${dealId}`);
  };

  const handleDownloadClick = (event) => {
    setDownloadAnchorEl(event.currentTarget);
  };

  const handleDownloadClose = () => {
    setDownloadAnchorEl(null);
  };

  const handleDownload = (format) => {
    const filteredData = deals.map(deal => {
      // Get price info considering new sizes structure
      const priceInfo = deal.sizes && deal.sizes.length > 0 
        ? {
            'Original Cost': deal.sizes.length === 1 || Math.min(...deal.sizes.map(s => s.originalCost)) === Math.max(...deal.sizes.map(s => s.originalCost))
              ? `${Math.min(...deal.sizes.map(s => s.originalCost))}` 
              : `${Math.min(...deal.sizes.map(s => s.originalCost))} - ${Math.max(...deal.sizes.map(s => s.originalCost))}`,
            'Discount Price': deal.sizes.length === 1 || Math.min(...deal.sizes.map(s => s.discountPrice)) === Math.max(...deal.sizes.map(s => s.discountPrice))
              ? `${Math.min(...deal.sizes.map(s => s.discountPrice))}`
              : `${Math.min(...deal.sizes.map(s => s.discountPrice))} - ${Math.max(...deal.sizes.map(s => s.discountPrice))}`
          }
        : {
            'Original Cost': deal.avgOriginalCost?.toFixed(2) || deal.originalCost,
            'Discount Price': deal.avgDiscountPrice?.toFixed(2) || deal.discountPrice
          };
      
      // Get sizes as comma-separated list
      const sizes = deal.sizes && deal.sizes.length > 0
        ? deal.sizes.map(s => s.size).join(', ')
        : 'Standard';
        
      // Get discount tiers as comma-separated list
      const discountTiers = deal.discountTiers && deal.discountTiers.length > 0
        ? deal.discountTiers.map(t => `${t.tierQuantity}+ = ${t.tierDiscount}%`).join(', ')
        : 'None';
        
      return {
        'Name': deal.name,
        'Description': deal.description,
        'Sizes': sizes,
        'Original Cost': priceInfo['Original Cost'],
        'Discount Price': priceInfo['Discount Price'],
        'Discount Tiers': discountTiers,
        'Min Qty for Discount': deal.minQtyForDiscount,
        'Category': deal.category,
        'Status': deal.status,
        'Total Sold': deal.totalSold,
        'Total Revenue': deal.totalRevenue,
        'Views': deal.views,
        'Impressions': deal.impressions
      };
    });

    if (format === 'csv') {
      const headers = Object.keys(filteredData[0]);
      const csvContent = [
        headers.join(','),
        ...filteredData.map(deal => headers.map(header =>
          typeof deal[header] === 'string' && deal[header].includes(',')
            ? `"${deal[header]}"`
            : deal[header]
        ).join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      saveAs(blob, 'deals.csv');
    } else if (format === 'pdf') {
      const doc = new jsPDF();
      doc.text('Deals Report', 14, 15);

      doc.autoTable({
        head: [Object.keys(filteredData[0])],
        body: filteredData.map(deal => Object.values(deal)),
        startY: 20,
        margin: { top: 15 },
        styles: { overflow: 'linebreak' },
        columnStyles: {
          Description: { cellWidth: 40 }
        }
      });

      doc.save('deals.pdf');
    }

    handleDownloadClose();
  };

  // Handle pagination change
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  // Handle rows per page change
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0); // Reset to the first page
  };

  const handleDuplicate = async (deal) => {
    // Get current date for new start date
    const currentDate = new Date();
    
    // Set end date to 30 days from now
    const newEndDate = new Date();
    newEndDate.setDate(newEndDate.getDate() + 30);
    
    // Format dates for message
    const startDateString = currentDate.toLocaleDateString();
    const endDateString = newEndDate.toLocaleDateString();
    
    handleConfirmDialogOpen(
      'Confirm Duplicate',
      `Are you sure you want to create a duplicate of "${deal.name}"? 
      
The new deal will be created with the following settings:
- Name: ${deal.name} (Copy)
- Status: Inactive (you can activate it after review)
- Start Date: ${startDateString}
- End Date: ${endDateString}
- All other settings will be copied from the original deal
- All statistics (views, sales, etc.) will be reset to zero`,
      async () => {
        try {
          // Create a clean duplicate deal with only the required fields
          const duplicatedDeal = {
            name: `${deal.name} (Copy)`,
            description: deal.description,
            sizes: JSON.parse(JSON.stringify(deal.sizes)), // Deep clone to avoid reference issues
            distributor: deal.distributor,
            category: deal.category,
            status: 'inactive',
            dealStartAt: currentDate.toISOString(),
            dealEndsAt: newEndDate.toISOString(),
            singleStoreDeals: deal.singleStoreDeals,
            minQtyForDiscount: deal.minQtyForDiscount,
            images: [...(deal.images || [])], // Clone array to avoid reference issues
            // Clear all statistics and tracking data
            views: 0,
            impressions: 0,
            totalSold: 0,
            totalRevenue: 0,
            bulkAction: false,
            commitments: [] // Empty array instead of a reference to the original deal's commitments
            // Don't include notificationHistory as the backend will initialize it
          };

          console.log('Sending duplicate deal:', duplicatedDeal);
          const response = await api.post('/deals/create/create', duplicatedDeal)
            .catch(err => {
              console.error('Duplicate deal API error:', err.response?.data || err.message);
              setToast({
                open: true,
                message: err.response?.data?.message || 'Error duplicating deal. Please check the console for details.',
                severity: 'error'
              });
              throw err; // Re-throw to stop execution
            });
          
          // Add the new deal to the state
          setDeals([...deals, response.data]);
          setToast({
            open: true,
            message: 'Deal duplicated successfully',
            severity: 'success'
          });
        } catch (error) {
          console.error('Error duplicating deal:', error);
          throw error;
        }
      },
      deal._id,
      deal.name,
      'duplicating'
    );
  };

  const filteredDeals = deals.filter(deal => {
    // Handle price filtering properly
    let priceMatch = true;
    if (filter.minPrice || filter.maxPrice) {
      if (deal.sizes && deal.sizes.length > 0) {
        // If deal has sizes array, find min price among all sizes
        const minSizePrice = Math.min(...deal.sizes.map(s => s.discountPrice));
        
        if (filter.minPrice && minSizePrice < Number(filter.minPrice)) {
          priceMatch = false;
        }
        
        if (filter.maxPrice && minSizePrice > Number(filter.maxPrice)) {
          priceMatch = false;
        }
      } else {
        // For deals with traditional pricing structure
        const price = deal.discountPrice || 0;
        
        if (filter.minPrice && price < Number(filter.minPrice)) {
          priceMatch = false;
        }
        
        if (filter.maxPrice && price > Number(filter.maxPrice)) {
          priceMatch = false;
        }
      }
    }
    
    return (
      (filter.category ? deal.category === filter.category : true) &&
      (filter.status ? deal.status === filter.status : true) &&
      priceMatch &&
      (filter.search ? deal.name.toLowerCase().includes(filter.search.toLowerCase()) : true)
    );
  }).sort((a, b) => {
    // Get comparable prices for sorting
    const getComparisonPrice = (deal) => {
      if (deal.sizes && deal.sizes.length > 0) {
        return Math.min(...deal.sizes.map(s => s.discountPrice));
      }
      return deal.discountPrice || 0;
    };

    if (filter.sortBy === 'priceAsc') {
      return getComparisonPrice(a) - getComparisonPrice(b);
    } else if (filter.sortBy === 'priceDesc') {
      return getComparisonPrice(b) - getComparisonPrice(a);
    } else if (filter.sortBy === 'nameAsc') {
      return a.name.localeCompare(b.name);
    } else if (filter.sortBy === 'nameDesc') {
      return b.name.localeCompare(a.name);
    }
    return 0;
  });

  // Calculate the current page deals
  const currentDeals = filteredDeals.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  const handleMenuOpen = (event, dealId) => {
    setAnchorElMap(prev => ({ ...prev, [dealId]: event.currentTarget }));
  };

  const handleMenuClose = (dealId) => {
    setAnchorElMap(prev => ({ ...prev, [dealId]: null }));
  };

  const FiltersContent = () => {
    const [showFilters, setShowFilters] = useState(false);
    const activeFilters = Object.entries(filter).filter(([key, value]) => {
      if (key === 'month') {
        return value && value !== '';
      }
      return value !== '';
    }).length;

    return (
      <Box sx={{ width: '100%', mb: 3 }}>
        <Paper sx={{ p: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Button
              onClick={() => setShowFilters(!showFilters)}
              startIcon={<FilterAlt color="primary.contrastText" />}
              endIcon={showFilters ? <ExpandLess color="primary.contrastText" /> : <ExpandMore color="primary.contrastText" />}
              color="primary.contrastText"
              sx={{
                color: 'primary.contrastText',
              }}
            >
              <Badge badgeContent={activeFilters} color="primary" sx={{ mr: 1 }}>
                Filters
              </Badge>
            </Button>
            {activeFilters > 0 && (
              <Button
                variant="text"
                startIcon={<Clear color="primary.contrastText" />}
                onClick={handleClearFilters}
                size="small"
                color="primary.contrastText"
              >
                Clear All
              </Button>
            )}
          </Box>

          <Collapse in={showFilters}>
            <Box sx={{ p: 2 }}>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                      Quick Filters
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                      {categories.map((cat) => (
                        <Chip
                          key={cat}
                          label={cat}
                          onClick={() => {
                            const newFilter = { ...filter, category: cat };
                            setFilter(newFilter);
                            // Save to localStorage
                            try {
                              localStorage.setItem('manageDealsFilters', JSON.stringify(newFilter));
                            } catch (error) {
                              console.error('Error saving filters to localStorage:', error);
                            }
                          }}
                          variant="outlined"
                          color="primary.contrastText"
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
                    label="Search Deals"
                    name="search"
                    value={filter.search}
                    onChange={handleFilterChange}
                    fullWidth
                    placeholder="Search by name..."
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Search color="primary.contrastText" />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>

                <Grid item xs={12} md={4}>
                  <FilterFormControl fullWidth>
                    <InputLabel>Category</InputLabel>
                    <FilterSelect
                      value={filter.category}
                      onChange={handleFilterChange}
                      label="Category"
                      name="category"
                    >
                      <MenuItem value=""><em>All Categories</em></MenuItem>
                      {categories.map(cat => (
                        <MenuItem key={cat} value={cat}>{cat}</MenuItem>
                      ))}
                    </FilterSelect>
                  </FilterFormControl>
                </Grid>
                <Grid item xs={12} md={4}>
                  <FilterFormControl fullWidth>
                    <InputLabel>Month</InputLabel>
                                          <FilterSelect
                        value={filter.month}
                        onChange={(e) => {
                          const newFilter = { ...filter, month: e.target.value };
                          setFilter(newFilter);
                          // Save to localStorage
                          try {
                            localStorage.setItem('manageDealsFilters', JSON.stringify(newFilter));
                          } catch (error) {
                            console.error('Error saving filters to localStorage:', error);
                          }
                        }}
                        label="Month"
                      >
                      <MenuItem value=""><em>All Months</em></MenuItem>
                      <MenuItem value={1}>January</MenuItem>
                      <MenuItem value={2}>February</MenuItem>
                      <MenuItem value={3}>March</MenuItem>
                      <MenuItem value={4}>April</MenuItem>
                      <MenuItem value={5}>May</MenuItem>
                      <MenuItem value={6}>June</MenuItem>
                      <MenuItem value={7}>July</MenuItem>
                      <MenuItem value={8}>August</MenuItem>
                      <MenuItem value={9}>September</MenuItem>
                      <MenuItem value={10}>October</MenuItem>
                      <MenuItem value={11}>November</MenuItem>
                      <MenuItem value={12}>December</MenuItem>
                    </FilterSelect>
                  </FilterFormControl>
                </Grid>

                <Grid item xs={12}>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 2 }}>
                    Price Range
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <FilterTextField
                        label="Min Price"
                        name="minPrice"
                        type="number"
                        value={filter.minPrice}
                        onChange={handleFilterChange}
                        fullWidth
                        inputProps={{ min: "0" }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <FilterTextField
                        label="Max Price"
                        name="maxPrice"
                        type="number"
                        value={filter.maxPrice}
                        onChange={handleFilterChange}
                        fullWidth
                        inputProps={{ min: "0" }}
                      />
                    </Grid>

                  </Grid>
                </Grid>

                <Grid item xs={12}>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 2 }}>
                    Sort & Status
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <FilterFormControl fullWidth>
                        <InputLabel>Sort By</InputLabel>
                        <FilterSelect
                          value={filter.sortBy}
                          onChange={handleFilterChange}
                          label="Sort By"
                          name="sortBy"
                        >
                          <MenuItem value=""><em>None</em></MenuItem>
                          <MenuItem value="priceAsc">Price: Low to High</MenuItem>
                          <MenuItem value="priceDesc">Price: High to Low</MenuItem>
                          <MenuItem value="nameAsc">Name: A to Z</MenuItem>
                          <MenuItem value="nameDesc">Name: Z to A</MenuItem>
                        </FilterSelect>
                      </FilterFormControl>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <FilterFormControl fullWidth>
                        <InputLabel>Status</InputLabel>
                        <FilterSelect
                          value={filter.status}
                          onChange={handleFilterChange}
                          label="Status"
                          name="status"
                        >
                          <MenuItem value=""><em>All</em></MenuItem>
                          <MenuItem value="active">Active</MenuItem>
                          <MenuItem value="inactive">Inactive</MenuItem>
                        </FilterSelect>
                      </FilterFormControl>
                    </Grid>
                  </Grid>
                </Grid>
              </Grid>
            </Box>
          </Collapse>
        </Paper>

        {activeFilters > 0 && (
          <Box sx={{ mt: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            {filter.search && (
              <Chip
                label={`Search: ${filter.search}`}
                onDelete={() => {
                  const newFilter = { ...filter, search: '' };
                  setFilter(newFilter);
                  try {
                    localStorage.setItem('manageDealsFilters', JSON.stringify(newFilter));
                  } catch (error) {
                    console.error('Error saving filters to localStorage:', error);
                  }
                }}
                color="primary.contrastText"
                variant="outlined"
              />
            )}
            {filter.month && filter.month !== "" && (
              <Chip
                label={`Month: ${filter.month}`}
                onDelete={() => {
                  const newFilter = { ...filter, month: '' };
                  setFilter(newFilter);
                  try {
                    localStorage.setItem('manageDealsFilters', JSON.stringify(newFilter));
                  } catch (error) {
                    console.error('Error saving filters to localStorage:', error);
                  }
                }}
                color="primary.contrastText"
                variant="outlined"
              />
            )}
            {filter.category && (
              <Chip
                label={`Category: ${filter.category}`}
                onDelete={() => {
                  const newFilter = { ...filter, category: '' };
                  setFilter(newFilter);
                  try {
                    localStorage.setItem('manageDealsFilters', JSON.stringify(newFilter));
                  } catch (error) {
                    console.error('Error saving filters to localStorage:', error);
                  }
                }}
                color="primary.contrastText"
                variant="outlined"
              />
            )}
            {filter.status && (
              <Chip
                label={`Status: ${filter.status}`}
                onDelete={() => {
                  const newFilter = { ...filter, status: '' };
                  setFilter(newFilter);
                  try {
                    localStorage.setItem('manageDealsFilters', JSON.stringify(newFilter));
                  } catch (error) {
                    console.error('Error saving filters to localStorage:', error);
                  }
                }}
                color="primary.contrastText"
                variant="outlined"
              />
            )}
            {filter.minPrice && (
              <Chip
                label={`Min Price: $${filter.minPrice}`}
                onDelete={() => {
                  const newFilter = { ...filter, minPrice: '' };
                  setFilter(newFilter);
                  try {
                    localStorage.setItem('manageDealsFilters', JSON.stringify(newFilter));
                  } catch (error) {
                    console.error('Error saving filters to localStorage:', error);
                  }
                }}
                color="primary.contrastText"
                variant="outlined"
              />
            )}
            {filter.maxPrice && (
              <Chip
                label={`Max Price: $${filter.maxPrice}`}
                onDelete={() => {
                  const newFilter = { ...filter, maxPrice: '' };
                  setFilter(newFilter);
                  try {
                    localStorage.setItem('manageDealsFilters', JSON.stringify(newFilter));
                  } catch (error) {
                    console.error('Error saving filters to localStorage:', error);
                  }
                }}
                color="primary.contrastText"
                variant="outlined"
              />
            )}
            {filter.sortBy && (
              <Chip
                label={`Sorted by: ${filter.sortBy.replace(/([A-Z])/g, ' $1').toLowerCase()}`}
                onDelete={() => {
                  const newFilter = { ...filter, sortBy: '' };
                  setFilter(newFilter);
                  try {
                    localStorage.setItem('manageDealsFilters', JSON.stringify(newFilter));
                  } catch (error) {
                    console.error('Error saving filters to localStorage:', error);
                  }
                }}
                color="primary.contrastText"
                variant="outlined"
              />
            )}
          </Box>
        )}
      </Box>
    );
  };

  // Add function to open debug dialog
  const handleOpenDebugDialog = () => {
    setDebugDialog(prev => ({ ...prev, open: true }));
  };

  // Add function to close debug dialog
  const handleCloseDebugDialog = () => {
    setDebugDialog(prev => ({ ...prev, open: false }));
  };

  if (loading) {
    return layout === 'grid' ? (
      <Container>
        <Box sx={{ mb: 3 }}>
          <Skeleton variant="text" sx={{ fontSize: '2rem', width: '40%' }} />
        </Box>
        <GridCardsSkeleton count={8} xs={12} sm={6} md={4} lg={3} />
      </Container>
    ) : (
      <TableSkeleton columnsNum={7} />
    );
  }

  return (
    <Container maxWidth="xl">
      <Box sx={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        mb: 4
      }}>
        <Typography variant="h4" fontWeight="bold">
          Manage Deals
        </Typography>
        <Box>
          <Tooltip title="Add New Deal">
            {(location.pathname.includes("distributor")) && (
              <IconButton color="primary.contrastText" onClick={() => navigate('/dashboard/distributor/deal/create')}>
                <Add color="primary.contrastText" />
              </IconButton>
            )}
          </Tooltip>
          <Tooltip title="Download">
            <IconButton color="primary.contrastText" onClick={handleDownloadClick}>
              <GetApp color="primary.contrastText" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Grid View">
            <IconButton color={layout === 'grid' ? 'primary.contrastText' : 'default'} onClick={() => setLayout('grid')}>
              <ViewModule color="primary.contrastText" />
            </IconButton>
          </Tooltip>
          <Tooltip title="List View">
            <IconButton color={layout === 'list' ? 'primary.contrastText' : 'default'} onClick={() => setLayout('list')}>
              <ViewList color="primary.contrastText" />
            </IconButton>
          </Tooltip>
          {!isMobile && (
            <Tooltip title="Table View">
              <IconButton color={layout === 'table' ? 'primary.contrastText' : 'default'} onClick={() => setLayout('table')}>
                <ViewComfy color="primary.contrastText" />
              </IconButton>
            </Tooltip>
          )}
        </Box>
      </Box>

      <FiltersContent />

      {loading ? (
        <Box sx={{ width: '100%', mt: 4, mb: 4, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
            Loading deals...
          </Typography>
          <LinearProgress sx={{ width: '50%' }} />
        </Box>
      ) : deals.length === 0 ? (
        <Paper sx={{ p: 4, mt: 4, mb: 4, textAlign: 'center' }}>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No deals found
          </Typography>
          <Typography variant="body1" color="text.secondary">
            {filter.status || filter.category || filter.search || filter.minPrice || filter.maxPrice 
              ? "Try adjusting your filters to see more results"
              : "Start by creating your first deal"}
          </Typography>
          {(location.pathname.includes("distributor")) && (
            <Button 
              variant="contained" 
              color="primary" 
              startIcon={<Add />} 
              sx={{ mt: 2 }}
              onClick={() => navigate('/dashboard/distributor/deal/create')}
            >
              Create New Deal
            </Button>
          )}
        </Paper>
      ) : (
        <>
          {layout === 'grid' && (
            <Grid container spacing={2.5}>
              {currentDeals.map((deal) => (
                <Grid item xs={12} sm={6} md={4} key={deal._id}>
                  <Card sx={{
                    borderRadius: '12px',
                    overflow: "hidden",
                    position: 'relative',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    transition: 'all 0.25s ease',
                    boxShadow: '0 4px 15px rgba(0, 0, 0, 0.07)',
                    '&:hover': {
                      transform: 'translateY(-6px)',
                      boxShadow: '0 8px 20px rgba(0, 0, 0, 0.1)',
                    }
                  }}>
                    {/* Image Section with Overlay */}
                    <Box sx={{ position: 'relative' }}>
                      <CardMedia
                        component="img"
                        height="160"
                        image={deal.images[0] || "https://via.placeholder.com/300"}
                        alt={deal.name}
                        sx={{ 
                          objectFit: "cover",
                          filter: deal.status === 'inactive' ? 'grayscale(0.5)' : 'none'
                        }}
                      />
                      <Box sx={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        background: 'linear-gradient(180deg, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0) 40%, rgba(0,0,0,0) 60%, rgba(0,0,0,0.7) 100%)',
                      }} />
                      
                      {/* Status & Categories Positioned on Image */}
                      <Box sx={{
                        position: 'absolute',
                        top: 10,
                        left: 10,
                        display: 'flex',
                        gap: 0.75,
                        flexWrap: 'wrap'
                      }}>
                        {deal.name.toLowerCase().includes('(copy)') && (
                          <Chip
                            label="Duplicate"
                            color="primary.contrastText"
                            size="small"
                            sx={{
                              height: '20px',
                              fontSize: '0.65rem',
                              backgroundColor: 'primary.contrastText',
                              color: 'white',
                              fontWeight: 'bold',
                              backdropFilter: 'blur(4px)'
                            }}
                          />
                        )}
                        <Chip
                          label={deal.status}
                          color={deal.status === 'active' ? 'success' : 'default'}
                          size="small"
                          sx={{
                            height: '20px',
                            fontSize: '0.65rem',
                            backgroundColor: deal.status === 'active' ? 'rgba(46, 125, 50, 0.85)' : 'rgba(97, 97, 97, 0.85)',
                            color: 'white',
                            fontWeight: 'bold',
                            backdropFilter: 'blur(4px)'
                          }}
                        />
                        <Chip 
                          label={deal.category}
                          size="small"
                          sx={{ 
                            height: '20px',
                            fontSize: '0.65rem',
                            backgroundColor: 'rgba(25, 118, 210, 0.85)',
                            color: 'white',
                            fontWeight: 'bold',
                            backdropFilter: 'blur(4px)'
                          }}
                        />
                        {deal.sizes && deal.sizes.length > 1 && (
                          <Chip 
                            label="Mix & Match" 
                            size="small"
                            sx={{ 
                              height: '20px',
                              fontSize: '0.65rem',
                              fontWeight: 'bold',
                              background: 'linear-gradient(45deg, rgba(255,142,83,0.85) 30%, rgba(254,107,139,0.85) 90%)',
                              color: 'white',
                              backdropFilter: 'blur(4px)'
                            }}
                          />
                        )}
                      </Box>
                      
                      {/* Deal Name on Image */}
                      <Typography 
                        variant="h6" 
                        sx={{
                          position: 'absolute',
                          bottom: 10,
                          left: 10,
                          color: 'white',
                          fontWeight: 'bold',
                          fontSize: '1rem',
                          textShadow: '0 1px 3px rgba(0,0,0,0.7)',
                          width: '90%',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        {deal.name}
                      </Typography>
                    </Box>
                    
                    <CardContent sx={{ flexGrow: 1, p: 1.5, pb: 0 }}>
                      {/* Two Column Layout for Pricing and Stats */}
                      <Grid container spacing={1.5} sx={{ mb: 1 }}>
                        {/* Left Column - Pricing */}
                        <Grid item xs={7}>
                          <Box sx={{ 
                            p: 1.25, 
                            height: '100%',
                            borderRadius: '6px',
                            backgroundColor: 'rgba(0, 0, 0, 0.02)', 
                            border: '1px solid rgba(0, 0, 0, 0.05)',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'center'
                          }}>
                            {deal.sizes && deal.sizes.length > 0 ? (
                              <Box>
                                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5, fontWeight: 500 }}>
                                  Price Range:
                                </Typography>
                                <Box sx={{ display: 'flex', alignItems: 'baseline' }}>
                                  <Typography variant="body2" sx={{ textDecoration: 'line-through', color: 'error.light', fontSize: '0.75rem', mr: 0.5 }}>
                                    {deal.sizes.length === 1 || Math.min(...deal.sizes.map(s => s.originalCost)) === Math.max(...deal.sizes.map(s => s.originalCost))
                                      ? `$${Math.min(...deal.sizes.map(s => s.originalCost))}`
                                      : `$${Math.min(...deal.sizes.map(s => s.originalCost))} - $${Math.max(...deal.sizes.map(s => s.originalCost))}`}
                                  </Typography>
                                  <Typography variant="body1" sx={{ color: 'success.main', fontWeight: 'bold', fontSize: '0.95rem' }}>
                                    {deal.sizes.length === 1 || Math.min(...deal.sizes.map(s => s.discountPrice)) === Math.max(...deal.sizes.map(s => s.discountPrice))
                                      ? `$${Math.min(...deal.sizes.map(s => s.discountPrice))}`
                                      : `$${Math.min(...deal.sizes.map(s => s.discountPrice))} - $${Math.max(...deal.sizes.map(s => s.discountPrice))}`}
                                  </Typography>
                                </Box>
                              </Box>
                            ) : (
                              <Box>
                                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5, fontWeight: 500 }}>
                                  Price:
                                </Typography>
                                <Box sx={{ display: 'flex', alignItems: 'baseline' }}>
                                  <Typography variant="body2" sx={{ textDecoration: 'line-through', color: 'error.light', fontSize: '0.75rem', mr: 0.5 }}>
                                    ${deal.avgOriginalCost?.toFixed(2) || deal.originalCost}
                                  </Typography>
                                  <Typography variant="body1" sx={{ color: 'success.main', fontWeight: 'bold', fontSize: '0.95rem' }}>
                                    ${deal.avgDiscountPrice?.toFixed(2) || deal.discountPrice}
                                  </Typography>
                                </Box>
                              </Box>
                            )}
                          </Box>
                        </Grid>
                        
                        {/* Right Column - Stats */}
                        <Grid item xs={5}>
                          <Box sx={{ 
                            p: 1.25, 
                            height: '100%',
                            borderRadius: '6px',
                            backgroundColor: 'rgba(25, 118, 210, 0.04)',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'space-between'
                          }}>
                            <Box>
                              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>
                                Min Qty
                              </Typography>
                              <Typography variant="body1" fontWeight="medium" sx={{ fontSize: '0.95rem' }}>
                                {deal.minQtyForDiscount}
                              </Typography>
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500, mr: 0.5 }}>
                                Members:
                              </Typography>
                              <Typography variant="body2" fontWeight="medium">
                                {deal.totalCommitmentCount || 0}
                              </Typography>
                            </Box>
                          </Box>
                        </Grid>
                      </Grid>

                      {/* Sizes as Pills */}
                      {deal.sizes && deal.sizes.length > 0 && (
                        <Box sx={{ 
                          display: 'flex', 
                          gap: 0.5, 
                          overflowX: 'auto',
                          mb: 1.5,
                          pb: 0.5,
                          '&::-webkit-scrollbar': {
                            height: '3px',
                          },
                          '&::-webkit-scrollbar-thumb': {
                            backgroundColor: 'rgba(0,0,0,0.2)',
                            borderRadius: '3px',
                          }
                        }}>
                          <Typography variant="caption" color="text.secondary" sx={{ 
                            fontWeight: 'bold', 
                            display: 'flex', 
                            alignItems: 'center',
                            whiteSpace: 'nowrap', 
                            mr: 0.5 
                          }}>
                            Sizes:
                          </Typography>
                          {deal.sizes.map((sizeItem, idx) => (
                            <Chip 
                              key={idx} 
                              label={sizeItem.size} 
                              size="small" 
                              variant="outlined" 
                              sx={{ 
                                height: '20px',
                                fontSize: '0.65rem',
                                borderColor: 'primary.contrastText',
                                minWidth: 'fit-content'
                              }}
                            />
                          ))}
                        </Box>
                      )}

                      {/* Progress Bar */}
                      <Box sx={{ mb: 1.5 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                          <Typography variant="caption" sx={{ 
                            color: 'text.secondary', 
                            fontWeight: 'bold',
                            display: 'flex',
                            alignItems: 'center'
                          }}>
                            Progress:
                          </Typography>
                          <Typography variant="caption" fontWeight="medium" sx={{ 
                            bgcolor: 'rgba(0,0,0,0.04)', 
                            px: 0.75, 
                            py: 0.25, 
                            borderRadius: '4px',
                            fontSize: '0.7rem'
                          }}>
                            {deal.totalCommittedQuantity || 0} / {deal.minQtyForDiscount}
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', gap: 0.75 }}>
                          <Box sx={{ flex: 1 }}>
                            <LinearProgress
                              variant="determinate"
                              value={Math.min(100, (((deal.totalCommittedQuantity || 0) / deal.minQtyForDiscount) * 100) || 0)}
                              sx={{ 
                                height: 6, 
                                borderRadius: 3,
                                backgroundColor: 'rgba(0,0,0,0.04)',
                                '& .MuiLinearProgress-bar': {
                                  background: 'linear-gradient(90deg, #1976d2, #4dabf5)'
                                }
                              }}
                            />
                          </Box>
                          {(((deal.totalCommittedQuantity || 0) / deal.minQtyForDiscount) * 100) >= 100 && (
                            <CheckCircleIcon
                              sx={{
                                color: 'success.main',
                                fontSize: 16
                              }}
                            />
                          )}
                        </Box>
                      </Box>

                    </CardContent>

                    {/* Action Buttons */}
                    <CardActions sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      backgroundColor: 'rgba(0, 0, 0, 0.02)',
                      borderTop: '1px solid rgba(0, 0, 0, 0.05)',
                      padding: '8px 12px',
                      mt: 'auto'
                    }}>
                      <Box>
                        {(location.pathname.includes("distributor")) && (
                          <>
                            <Tooltip title="Edit Deal">
                              <IconButton 
                                color="primary.contrastText"  
                                onClick={() => handleEdit(deal)}
                                size="small"
                                sx={{ 
                                  width: 28,
                                  height: 28,
                                  bgcolor: 'rgba(25, 118, 210, 0.08)',
                                  mr: 0.75,
                                  '&:hover': { bgcolor: 'rgba(25, 118, 210, 0.15)' } 
                                }}
                              >
                                <Edit fontSize="small" sx={{ fontSize: '0.9rem', color: 'primary.contrastText' }} />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Duplicate Deal">
                              <IconButton 
                                color="primary.contrastText" 
                                onClick={() => handleDuplicate(deal)}
                                size="small"
                                sx={{ 
                                  width: 28,
                                  height: 28,
                                  bgcolor: 'rgba(3, 169, 244, 0.08)',
                                  mr: 0.75,
                                  '&:hover': { bgcolor: 'rgba(3, 169, 244, 0.15)' } 
                                }}
                              >
                                <ContentCopy fontSize="small" sx={{ fontSize: '0.9rem', color: 'primary.contrastText' }} />
                              </IconButton>
                            </Tooltip>
                          </>
                        )}
                        <Tooltip title="View Details">
                          <IconButton 
                            color="primary.contrastText" 
                            onClick={() => handleView(deal._id)}
                            size="small"
                            sx={{ 
                              width: 28,
                              height: 28,
                              bgcolor: 'rgba(0, 150, 136, 0.08)',
                              '&:hover': { bgcolor: 'rgba(0, 150, 136, 0.15)' } 
                            }}
                          >
                            <Visibility fontSize="small" sx={{ fontSize: '0.9rem', color: 'primary.contrastText' }} />
                          </IconButton>
                        </Tooltip>
                      </Box>
                      <Box>
                        {deal.bulkAction ? (
                          <Chip 
                            label={deal.bulkStatus} 
                            color={deal.bulkStatus === "approved" ? "success" : "error"} 
                            variant="outlined" 
                            size="small"
                            sx={{ height: '24px', fontSize: '0.7rem' }}
                          />
                        ) : (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                            {!deal.bulkAction && (
                              <Tooltip title='Delete'>
                                <IconButton
                                  color="primary.contrastText"
                                  onClick={() => handleDelete(deal._id)}
                                  size="small"
                                  sx={{ 
                                    width: 28,
                                    height: 28,
                                    bgcolor: 'rgba(211, 47, 47, 0.08)',
                                    '&:hover': { bgcolor: 'rgba(211, 47, 47, 0.15)' } 
                                  }}
                                >
                                  <DeleteOutline fontSize="small" sx={{ fontSize: '0.9rem', color: 'primary.contrastText'  }} />
                                </IconButton>
                              </Tooltip>
                            )}
                            <Tooltip title={deal.status === 'active' ? 'Deactivate' : 'Activate'}>
                              <Switch
                                checked={deal.status === 'active'}
                                onChange={() => handleToggleChange(deal._id, deal.status)}
                                color="primary.contrastText "
                                size="small"
                                sx={{ transform: 'scale(0.8)', ml: '-4px' }}
                              />
                            </Tooltip>
                          </Box>
                        )}
                      </Box>
                    </CardActions>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
          {layout === 'list' && (
            <Box>
              {currentDeals.map((deal) => (
                <Paper
                  key={deal._id}
                  sx={{
                    mb: 2,
                    p: 2,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    borderRadius: 2,
                    '&:hover': {
                      boxShadow: 3,
                      transform: 'translateY(-2px)',
                      transition: 'all 0.3s ease-in-out'
                    }
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                    <Box sx={{ position: 'relative', minWidth: 80 }}>
                      <CardMedia
                        component="img"
                        height="80"
                        image={deal.images[0] || "https://via.placeholder.com/300"}
                        alt={deal.name}
                        sx={{
                          objectFit: "cover",
                          width: 80,
                          mr: 2,
                          borderRadius: 1
                        }}
                      />
                      <Box sx={{
                        position: 'absolute',
                        top: -8,
                        right: -8,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 0.5
                      }}>
                        {deal.name.toLowerCase().includes('(copy)') && (
                          <Chip
                            label="Duplicate"
                            color="primary.contrastText"
                            size="small"
                            sx={{
                              backgroundColor: 'rgba(33, 150, 243, 0.9)',
                              color: 'white',
                              fontWeight: 'bold',
                              transform: 'scale(0.8)'
                            }}
                          />
                        )}
                        <Chip
                          label={deal.status}
                          color={deal.status === 'active' ? 'success' : 'default'}
                          size="small"
                          sx={{
                            backgroundColor: deal.status === 'active' ? 'rgba(46, 125, 50, 0.9)' : 'rgba(97, 97, 97, 0.9)',
                            color: 'white',
                            fontWeight: 'bold',
                            transform: 'scale(0.8)'
                          }}
                        />
                      </Box>
                    </Box>
                    <Box sx={{ ml: 3, flex: 1 }}>
                      <Grid container spacing={2}>
                        <Grid item xs={12} sm={6}>
                          <Typography variant="h6" fontWeight="bold">
                            {deal.name}
                          </Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1, mt: 1 }}>
                            <Chip 
                              label={deal.category}
                              size="small"
                              variant="outlined"
                              color="primary.contrastText"
                            />
                            {deal.sizes && deal.sizes.length > 1 && (
                              <Chip 
                                label="Mix & Match" 
                                size="small"
                                sx={{ 
                                  fontWeight: 'bold',
                                  background: 'linear-gradient(45deg, #FF8E53 30%, #FE6B8B 90%)',
                                  color: 'white',
                                  '& .MuiChip-label': { px: 1 }
                                }}
                              />
                            )}
                          </Box>
                          
                          {/* Sizes Section */}
                          {deal.sizes && deal.sizes.length > 0 && (
                            <Box sx={{ display: 'flex', gap: 1, mt: 1, mb: 1, flexWrap: 'wrap', alignItems: 'center' }}>
                              <Typography variant="body2" color="text.secondary">
                                Sizes: 
                              </Typography>
                              {deal.sizes.map((sizeItem, idx) => (
                                <Chip 
                                  key={idx} 
                                  label={sizeItem.size} 
                                  size="small" 
                                  variant="outlined" 
                                  sx={{ borderColor: 'primary.contrastText' }}
                                />
                              ))}
                            </Box>
                          )}
                          
                          {/* Display Price */}
                          {deal.sizes && deal.sizes.length > 0 ? (
                            <Typography variant="body2" color="text.secondary">
                              Price Range: 
                              <span style={{ textDecoration: 'line-through', color: '#f44336', marginLeft: '4px' }}>
                                {deal.sizes.length === 1 || Math.min(...deal.sizes.map(s => s.originalCost)) === Math.max(...deal.sizes.map(s => s.originalCost))
                                  ? `$${Math.min(...deal.sizes.map(s => s.originalCost))}`
                                  : `$${Math.min(...deal.sizes.map(s => s.originalCost))} - $${Math.max(...deal.sizes.map(s => s.originalCost))}`}
                              </span> | 
                              <span style={{ color: 'green', fontWeight: 'bold', marginLeft: '4px' }}>
                                {deal.sizes.length === 1 || Math.min(...deal.sizes.map(s => s.discountPrice)) === Math.max(...deal.sizes.map(s => s.discountPrice))
                                  ? `$${Math.min(...deal.sizes.map(s => s.discountPrice))}`
                                  : `$${Math.min(...deal.sizes.map(s => s.discountPrice))} - $${Math.max(...deal.sizes.map(s => s.discountPrice))}`}
                              </span>
                            </Typography>
                          ) : (
                            <Typography variant="body2" color="text.secondary">
                              Price: <span style={{ textDecoration: 'line-through' }}>${deal.avgOriginalCost?.toFixed(2) || deal.originalCost}</span> / ${deal.avgDiscountPrice?.toFixed(2) || deal.discountPrice}
                            </Typography>
                          )}

                          <Typography variant="body2" color="text.secondary">
                            Min Qty for Deal: {deal.minQtyForDiscount}
                          </Typography>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          {/* Size-specific Discount Tiers Section */}
                          {deal.sizes && deal.sizes.some(size => size.discountTiers && size.discountTiers.length > 0) && (
                            <Box sx={{ mb: 2 }}>
                              <Typography variant="body2" fontWeight="bold" color="text.secondary" sx={{ mb: 1 }}>
                                Size-Specific Volume Discounts:
                              </Typography>
                              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                                {deal.sizes.filter(size => size.discountTiers && size.discountTiers.length > 0).map((size, sizeIdx) => (
                                  <Box key={sizeIdx} sx={{ mb: 1 }}>
                                    <Typography variant="caption" fontWeight="bold" color="primary.contrastText">
                                      {size.size}:
                                    </Typography>
                                    {size.discountTiers.map((tier, tierIdx) => (
                                      <Typography key={tierIdx} variant="body2" color="text.secondary" sx={{ ml: 2 }}>
                                        {tier.tierQuantity}+ units: ${tier.tierDiscount} each
                                  </Typography>
                                    ))}
                                  </Box>
                                ))}
                              </Box>
                            </Box>
                          )}
                          
                          <Typography variant="body2" color="text.secondary">
                            Deal Progress : {deal.totalCommittedQuantity || 0} / {deal.minQtyForDiscount}
                          </Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', width: '70%', mb: 2, mt: 2, gap: 1 }}>
                            <LinearProgress
                              variant="determinate"
                              value={Math.min(100, (((deal.totalCommittedQuantity || 0) / deal.minQtyForDiscount) * 100) || 0)}
                              sx={{ height: 6, borderRadius: 2, width: '90%' }}
                            />
                            {(((deal.totalCommittedQuantity || 0) / deal.minQtyForDiscount) * 100) >= 100 && (
                              <CheckCircleIcon
                                sx={{
                                  color: 'success.main'
                                }}
                              />
                            )}
                          </Box>
                        </Grid>
                      </Grid>
                    </Box>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <IconButton onClick={(e) => handleMenuOpen(e, deal._id)}>
                      <MoreVert sx={{ color: 'primary.contrastText' }} />
                    </IconButton>
                    <Menu
                      anchorEl={anchorElMap[deal._id]}
                      open={Boolean(anchorElMap[deal._id])}
                      onClose={() => handleMenuClose(deal._id)}
                    >
                      {location.pathname.includes("distributor") && [
                        <MenuItem key="edit" onClick={() => { handleEdit(deal); handleMenuClose(deal._id); }}>
                          <Edit sx={{ mr: 1, color: 'primary.contrastText' }} fontSize="small" /> Edit
                        </MenuItem>,
                        <MenuItem key="duplicate" onClick={() => { handleDuplicate(deal); handleMenuClose(deal._id); }}>
                          <ContentCopy sx={{ mr: 1, color: 'primary.contrastText' }} fontSize="small" /> Duplicate
                        </MenuItem>
                      ]}
                      <MenuItem onClick={() => { handleView(deal._id); handleMenuClose(deal._id); }}>
                        <Visibility sx={{ mr: 1, color: 'primary.contrastText' }} fontSize="small" /> View
                      </MenuItem>
                      {deal.bulkAction ? (
                        <MenuItem disabled>
                          <Chip 
                            label={deal.bulkStatus} 
                            color={deal.bulkStatus === "approved" ? "success" : "error"} 
                            variant="outlined" 
                          />
                        </MenuItem>
                      ) : (
                        <MenuItem onClick={() => { 
                          handleToggleChange(deal._id, deal.status); 
                          handleMenuClose(deal._id); 
                        }}>
                          <Switch
                            checked={deal.status === 'active'}
                            size="small"
                            sx={{ mr: 1 }}
                          />
                          {deal.status === 'active' ? 'Deactivate' : 'Activate'}
                        </MenuItem>
                      )}

                      {!deal.bulkAction && (
                        <MenuItem onClick={() => {handleDelete(deal._id); handleMenuClose(deal._id);}}>
                          <DeleteOutline sx={{ mr: 1, color: 'primary.contrastText' }} fontSize="small" /> Delete
                        </MenuItem>
                      )}
                    </Menu>
                  </Box>
                </Paper>
              ))}
            </Box>
          )}
          {layout === 'table' && (
            <TableContainer component={Paper} sx={{ borderRadius: 2, boxShadow: 3 }}>
              <Table>
                <TableHead>
                  <TableRow sx={{ backgroundColor: 'rgba(0, 0, 0, 0.02)' }}>
                    <TableCell>Image</TableCell>
                    <TableCell>Name</TableCell>
                    <TableCell>Category</TableCell>
                    <TableCell>Sizes</TableCell>
                    <TableCell>Price</TableCell>
                    <TableCell>Min Qty for Deal</TableCell>
                    <TableCell>Deal Progress</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {currentDeals.map((deal) => (
                    <TableRow
                      key={deal._id}
                      sx={{
                        '&:hover': {
                          backgroundColor: 'rgba(0, 0, 0, 0.02)',
                          transition: 'background-color 0.3s ease-in-out'
                        }
                      }}
                    >
                      <TableCell>
                        <Box sx={{ position: 'relative' }}>
                          <CardMedia
                            component="img"
                            height="60"
                            image={deal.images[0] || "https://via.placeholder.com/300"}
                            alt={deal.name}
                            sx={{
                              objectFit: "cover",
                              width: 60,
                              borderRadius: 1
                            }}
                          />
                          {deal.name.toLowerCase().includes('(copy)') && (
                            <Chip
                              label="Duplicate"
                              color="info"
                              size="small"
                              sx={{
                                position: 'absolute',
                                top: -8,
                                right: -8,
                                backgroundColor: 'rgba(33, 150, 243, 0.9)',
                                color: 'white',
                                fontWeight: 'bold',
                                transform: 'scale(0.8)'
                              }}
                            />
                          )}
                        </Box>
                      </TableCell>
                      <TableCell>{deal.name}</TableCell>
                      <TableCell>{deal.category}</TableCell>
                      <TableCell>
                        {deal.sizes && deal.sizes.length > 0 ? (
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                            {deal.sizes.map((sizeItem, idx) => (
                              <Chip 
                                key={idx} 
                                label={sizeItem.size} 
                                size="small" 
                                sx={{ fontSize: '0.7rem' }}
                              />
                            ))}
                          </Box>
                        ) : (
                          "Standard"
                        )}
                      </TableCell>
                      <TableCell>
                        {deal.sizes && deal.sizes.length > 0 ? (
                          <Box>
                            <Typography variant="body2" color="error.main" sx={{ textDecoration: 'line-through' }}>
                              {deal.sizes.length === 1 || Math.min(...deal.sizes.map(s => s.originalCost)) === Math.max(...deal.sizes.map(s => s.originalCost))
                                ? `$${Math.min(...deal.sizes.map(s => s.originalCost))}`
                                : `$${Math.min(...deal.sizes.map(s => s.originalCost))} - $${Math.max(...deal.sizes.map(s => s.originalCost))}`}
                            </Typography>
                            <Typography variant="body2" color="success.main" sx={{ fontWeight: 'bold' }}>
                              {deal.sizes.length === 1 || Math.min(...deal.sizes.map(s => s.discountPrice)) === Math.max(...deal.sizes.map(s => s.discountPrice))
                                ? `$${Math.min(...deal.sizes.map(s => s.discountPrice))}`
                                : `$${Math.min(...deal.sizes.map(s => s.discountPrice))} - $${Math.max(...deal.sizes.map(s => s.discountPrice))}`}
                            </Typography>
                          </Box>
                        ) : (
                          <>
                            <span style={{ textDecoration: 'line-through' }}>${deal.avgOriginalCost?.toFixed(2) || deal.originalCost}</span> / 
                            ${deal.avgDiscountPrice?.toFixed(2) || deal.discountPrice}
                          </>
                        )}
                      </TableCell>
                      <TableCell>{deal.minQtyForDiscount}</TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', width: '70%', mb: 2, mt: 2, gap: 1 }}>
                          <LinearProgress
                            variant="determinate"
                            value={Math.min(100, (((deal.totalCommittedQuantity || 0) / deal.minQtyForDiscount) * 100) || 0)}
                            sx={{ height: 6, borderRadius: 2, width: '90%' }}
                          />
                          {(((deal.totalCommittedQuantity || 0) / deal.minQtyForDiscount) * 100) >= 100 && (
                            <CheckCircleIcon
                              sx={{
                                color: 'success.main'
                              }}
                            />
                          )}
                        </Box>
                      </TableCell>

                      <TableCell sx={{ padding: '16px', borderBottom: '1px solid #e0e0e0' }}>
                        <IconButton onClick={(e) => handleMenuOpen(e, deal._id)}>
                          <MoreVert sx={{ color: 'primary.contrastText' }} />
                        </IconButton>
                        <Menu
                          anchorEl={anchorElMap[deal._id]}
                          open={Boolean(anchorElMap[deal._id])}
                          onClose={() => handleMenuClose(deal._id)}
                        >
                          {location.pathname.includes("distributor") && [
                            <MenuItem key="edit" onClick={() => { handleEdit(deal); handleMenuClose(deal._id); }}>
                              <Edit sx={{ mr: 1, color: 'primary.contrastText' }} fontSize="small" /> Edit
                            </MenuItem>,
                            <MenuItem key="duplicate" onClick={() => { handleDuplicate(deal); handleMenuClose(deal._id); }}>
                              <ContentCopy sx={{ mr: 1, color: 'primary.contrastText' }} fontSize="small" /> Duplicate
                            </MenuItem>
                          ]}
                          <MenuItem onClick={() => { handleView(deal._id); handleMenuClose(deal._id); }}>
                            <Visibility sx={{ mr: 1, color: 'primary.contrastText' }} fontSize="small" /> View
                          </MenuItem>
                          {deal.bulkAction ? (
                            <MenuItem disabled>
                              <Chip 
                                label={deal.bulkStatus} 
                                color={deal.bulkStatus === "approved" ? "success" : "error"} 
                                variant="outlined" 
                              />
                            </MenuItem>
                          ) : (
                            <MenuItem onClick={() => { 
                              handleToggleChange(deal._id, deal.status); 
                              handleMenuClose(deal._id); 
                            }}>
                              <Switch
                                checked={deal.status === 'active'}
                                size="small"
                                sx={{ mr: 1 }}
                              />
                              {deal.status === 'active' ? 'Deactivate' : 'Activate'}
                            </MenuItem>
                          )}

                          {!deal.bulkAction && (
                            <MenuItem onClick={() => {handleDelete(deal._id); handleMenuClose(deal._id);}}>
                              <DeleteOutline sx={{ mr: 1, color: 'primary.contrastText' }} fontSize="small" /> Delete
                            </MenuItem>
                          )}
                        </Menu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </>
      )}
      
      {/* Only show pagination if we have deals */}
      {!loading && deals.length > 0 && (
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={filteredDeals.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      )}
      {/* Add Confirmation Dialog */}
      <Dialog
        open={confirmDialog.open}
        onClose={handleConfirmDialogClose}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
        PaperProps={{
          sx: {
            borderRadius: 2,
            p: 1
          }
        }}
      >
        <DialogTitle id="alert-dialog-title" sx={{ fontWeight: 'bold' }}>
          {confirmDialog.title}
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            {confirmDialog.content}
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            onClick={handleConfirmDialogClose}
            color="inherit"
            variant="outlined"
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirmAction}
            color={confirmDialog.actionType === 'deleting' ? 'error' : 'primary'}
            variant="contained"
            autoFocus
          >
            Confirm
          </Button>
        </DialogActions>
      </Dialog>

      <Toast
        open={toast.open}
        message={toast.message}
        severity={toast.severity}
        handleClose={handleCloseToast}
      />

      {/* Add the Menu component for download options */}
      <Menu
        anchorEl={downloadAnchorEl}
        open={downloadMenuOpen}
        onClose={handleDownloadClose}
      >
        <MenuItem onClick={() => handleDownload('csv')}>Download as CSV</MenuItem>
        <MenuItem onClick={() => handleDownload('pdf')}>Download as PDF</MenuItem>
      </Menu>
    </Container>
  );
};

export default ManageDeals;
