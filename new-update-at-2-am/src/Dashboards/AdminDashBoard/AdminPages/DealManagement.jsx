import React, { useState, useEffect } from 'react';
import api from '../../../services/api';
import { useParams, useNavigate } from 'react-router-dom';
import { saveAs } from 'file-saver';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import useMediaQuery from '@mui/material/useMediaQuery';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import {
  Container, Typography, Grid, TextField, IconButton, FormControl, InputLabel, Select, MenuItem,
  Button, Box, Tooltip, Menu, Card, CardMedia, CardContent, CardActions, Paper, TableContainer,
  Table, TableHead, TableRow, TableCell, TableBody, Switch, Pagination, TablePagination, Badge, Collapse
} from '@mui/material';
import { Search, Clear, Add, GetApp, ViewModule, ViewList, ViewComfy, Edit, Visibility, Delete, FilterAlt, ExpandLess, ExpandMore, MoreVert, PlayArrow } from '@mui/icons-material';
import Toast from '../../../Components/Toast/Toast';
import { FilterTextField, FilterSelect, FilterFormControl } from '../../DashBoardComponents/FilterStyles';
import { Chip, Divider } from '@mui/material';
import { InputAdornment } from '@mui/material';
import { LinearProgress } from '@mui/material';
import { GridCardsSkeleton, TableSkeleton } from '../../../Components/Skeletons/LoadingSkeletons';

// Helper function to determine if the media is a video
const isVideoUrl = (url) => {
  if (!url) return false;
  const videoExtensions = ['.mp4', '.webm', '.ogg', '.mov'];
  return videoExtensions.some(ext => url.toLowerCase().includes(ext));
};

const DealsManagment = () => {
  const [deals, setDeals] = useState([]);
  const [categories, setCategories] = useState([]);
  const [layout, setLayout] = useState('list');
  const [anchorEl, setAnchorEl] = useState(null);
  const [toast, setToast] = useState({
    open: false,
    message: '',
    severity: 'success'
  });
  const [filter, setFilter] = useState({ category: '', status: '', minPrice: '', maxPrice: '', search: '', sortBy: '' });
  const { userId } = useParams();
  const navigate = useNavigate();
  const isMobile = useMediaQuery('(max-width:600px)');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [showFilters, setShowFilters] = useState(false);
  const [activeFilters, setActiveFilters] = useState(0);
  const [loading, setLoading] = useState(true);
  const [anchorElMap, setAnchorElMap] = useState({});

  useEffect(() => {
    const fetchDeals = async () => {
      try {
        const response = await api.get(`/deals/fetchAll`);
        console.log(response.data)
        setDeals(response.data);
        const uniqueCategories = [...new Set(response.data.map(deal => deal.category))];
        setCategories(uniqueCategories);
        setLoading(false);
      } catch (error) {
        setToast({
          open: true,
          message: 'Error fetching deals',
          severity: 'error'
        });
        console.error('Error fetching deals:', error);
        setLoading(false);
      }
    };

    fetchDeals();
  }, [userId]);

  useEffect(() => {
    const count = Object.values(filter).filter(value => value !== '').length;
    setActiveFilters(count);
  }, [filter]);

  const handleDelete = async (dealId) => {
    try {
      const response = await api.delete(`/deals/delete/admin/${dealId}`);
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
      console.error('Error deleting deal:', error);
    }
  };

  const handleToggleChange = async (dealId, currentStatus) => {
    try {
      const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
      const response = await api.patch(`/deals/update-status/${dealId}/status/admin`, { status: newStatus });
      setDeals(deals.map(deal => deal._id === dealId ? response.data : deal));
      setToast({
        open: true,
        message: `Deal ${newStatus === 'active' ? 'activated' : 'deactivated'} successfully`,
        severity: 'success'
      });
    } catch (error) {
      setToast({
        open: true,
        message: 'Error updating deal status',
        severity: 'error'
      });
      console.error('Error updating deal status:', error);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilter({ ...filter, [name]: value });
  };

  const handleClearFilters = () => {
    setFilter({ category: '', status: '', minPrice: '', maxPrice: '', search: '', sortBy: '' });
  };

  const handleCloseToast = () => {
    setToast({ ...toast, open: false });
  };

  const handleEdit = (deal) => {
    navigate(`/dashboard/distributor/edit-deal/${deal._id}`, { state: { deal } });
  };

  const handleView = (dealId) => {
    navigate(`/distributor/view-deal/${dealId}`);
  };

  const handleDownloadClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleDownloadClose = () => {
    setAnchorEl(null);
  };

  const user_role = localStorage.getItem('user_role');
  const handleDownload = (format) => {
    const filteredData = deals.filter(deal => {
      return (
        (filter.category ? deal.category === filter.category : true) &&
        (filter.status ? deal.status === filter.status : true) &&
        (filter.minPrice ? deal.discountPrice >= filter.minPrice : true) &&
        (filter.maxPrice ? deal.discountPrice <= filter.maxPrice : true) &&
        (filter.search ? deal.name.toLowerCase().includes(filter.search.toLowerCase()) : true)
      );
    }).sort((a, b) => {
      if (filter.sortBy === 'price') {
        if (filter.sortBy === 'asc') {
          return a.discountPrice - b.discountPrice;
        }
        return b.discountPrice - a.discountPrice;
      } else if (filter.sortBy === 'nameAsc') {
        return a.name.localeCompare(b.name);
      } else if (filter.sortBy === 'nameDesc') {
        return b.name.localeCompare(a.name);
      }
      return 0;
    });

    if (format === 'csv') {
      const csvContent = [
        ['Name', 'Description', 'Size', 'Original Cost', 'Discount Price', 'Category', 'Status', 'Min Qty For Discount', 'Total Sold', 'Total Revenue', 'Views', 'Impressions'],
        ...filteredData.map(deal => Object.values(deal)),
      ]
        .map(e => e.join(','))
        .join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      saveAs(blob, 'deals.csv');
    } else if (format === 'pdf') {
      const doc = new jsPDF();
      doc.text('Deals', 20, 10);
      doc.autoTable({
        head: [['Name', 'Description', 'Size', 'Original Cost', 'Discount Price', 'Category', 'Status', 'Min Qty For Discount', 'Total Sold', 'Total Revenue', 'Views', 'Impressions']],
        body: filteredData.map(deal => Object.values(deal)),
      });
      doc.save('deals.pdf');
    }

    handleDownloadClose();
  };

  const filteredDeals = deals.filter(deal => {
    return (
      (filter.category ? deal.category === filter.category : true) &&
      (filter.status ? deal.status === filter.status : true) &&
      (filter.minPrice ? deal.discountPrice >= filter.minPrice : true) &&
      (filter.maxPrice ? deal.discountPrice <= filter.maxPrice : true) &&
      (filter.search ? deal.name.toLowerCase().includes(filter.search.toLowerCase()) : true)
    );
  }).sort((a, b) => {
    if (filter.sortBy === 'price') {
      if (filter.sortBy === 'asc') {
        return a.discountPrice - b.discountPrice;
      }
      return b.discountPrice - a.discountPrice;
    } else if (filter.sortBy === 'nameAsc') {
      return a.name.localeCompare(b.name);
    } else if (filter.sortBy === 'nameDesc') {
      return b.name.localeCompare(a.name);
    }
    return 0;
  });

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const paginatedDeals = filteredDeals.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  const handleMenuOpen = (event, dealId) => {
    setAnchorElMap(prev => ({ ...prev, [dealId]: event.currentTarget }));
  };

  const handleMenuClose = (dealId) => {
    setAnchorElMap(prev => ({ ...prev, [dealId]: null }));
  };

  if (loading) {
    return layout === 'grid' ? (
      <GridCardsSkeleton count={8} xs={12} sm={6} md={4} lg={3} />
    ) : (
      <TableSkeleton columnsNum={8} />
    );
  }

  return (
    <Container maxWidth={'xl'}>
      <Typography variant="h4" gutterBottom>
        Manage Deals
      </Typography>
      <Paper sx={{ mb: 3, p: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Button
            onClick={() => setShowFilters(!showFilters)}
            startIcon={<FilterAlt color="primary.contrastText" />}
            endIcon={showFilters ? <ExpandLess color="primary.contrastText" /> : <ExpandMore color="primary.contrastText" />}
            color="primary"
            sx={{
              color: 'primary.contrastText',
              border: '1px solid',
              borderColor: 'primary.contrastText',
              '&:hover': {
                backgroundColor: 'primary.main',
                color: 'primary.contrastText',
                border: '1px solid',
                borderColor: 'primary.contrastText',
              }
            }}
          >
            <Badge badgeContent={activeFilters} color="primary" sx={{ mr: 1, color: 'primary.contrastText' }}>
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
          <Box sx={{ p: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                    Quick Filters
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    {['Active Deals', 'Inactive Deals', 'High Price', 'Low Price'].map((label) => (
                      <Chip
                        key={label}
                        label={label}
                        onClick={() => {
                          if (label === 'Active Deals') {
                            setFilter(prev => ({ ...prev, status: 'active' }));
                          } else if (label === 'Inactive Deals') {
                            setFilter(prev => ({ ...prev, status: 'inactive' }));
                          } else if (label === 'High Price') {
                            setFilter(prev => ({ ...prev, sortBy: 'price' }));
                          } else if (label === 'Low Price') {
                            setFilter(prev => ({ ...prev, sortBy: 'price', sortOrder: 'asc' }));
                          }
                        }}
                        variant="outlined"
                        color="primary.contrastText"
                        sx={{
                          '&:hover': {
                            backgroundColor: 'primary.main',
                            color: 'primary.contrastText',
                            border: '1px solid',
                            borderColor: 'primary.contrastText',
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
                  placeholder="Search by name or description..."
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Search fontSize="small" color="primary.contrastText" />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>

              <Grid item xs={12} sm={6} md={4}>
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

              <Grid item xs={12} sm={6} md={4}>
                <FilterFormControl fullWidth>
                  <InputLabel>Status</InputLabel>
                  <FilterSelect
                    value={filter.status}
                    onChange={handleFilterChange}
                    label="Status"
                    name="status"
                  >
                    <MenuItem value=""><em>All Status</em></MenuItem>
                    <MenuItem value="active">Active</MenuItem>
                    <MenuItem value="inactive">Inactive</MenuItem>
                  </FilterSelect>
                </FilterFormControl>
              </Grid>

              <Grid item xs={12}>
                <Divider sx={{ my: 2 }} />
                <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 2 }}>
                  Price Range & Sorting
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6} md={4}>
                    <FilterTextField
                      label="Min Price"
                      name="minPrice"
                      type="number"
                      value={filter.minPrice}
                      onChange={handleFilterChange}
                      fullWidth
                    />
                  </Grid>
                  <Grid item xs={12} sm={6} md={4}>
                    <FilterTextField
                      label="Max Price"
                      name="maxPrice"
                      type="number"
                      value={filter.maxPrice}
                      onChange={handleFilterChange}
                      fullWidth
                    />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <FilterFormControl fullWidth>
                      <InputLabel>Sort By</InputLabel>
                      <FilterSelect
                        value={filter.sortBy}
                        onChange={handleFilterChange}
                        label="Sort By"
                        name="sortBy"
                      >
                        <MenuItem value=""><em>None</em></MenuItem>
                        <MenuItem value="price">Price</MenuItem>
                        <MenuItem value="nameAsc">Name: A to Z</MenuItem>
                        <MenuItem value="nameDesc">Name: Z to A</MenuItem>
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
        <Box sx={{ mb: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          {filter.category && (
            <Chip
              label={`Category: ${filter.category}`}
              onDelete={() => setFilter(prev => ({ ...prev, category: '' }))}
              color="primary.contrastText"
              variant="outlined"
            />
          )}
          {filter.status && (
            <Chip
              label={`Status: ${filter.status}`}
              onDelete={() => setFilter(prev => ({ ...prev, status: '' }))}
              color="primary.contrastText"
              variant="outlined"
            />
          )}
          {filter.minPrice && (
            <Chip
              label={`Min Price: $${filter.minPrice}`}
              onDelete={() => setFilter(prev => ({ ...prev, minPrice: '' }))}
              color="primary.contrastText"
              variant="outlined"
            />
          )}
          {filter.maxPrice && (
            <Chip
              label={`Max Price: $${filter.maxPrice}`}
              onDelete={() => setFilter(prev => ({ ...prev, maxPrice: '' }))}
              color="primary.contrastText"
              variant="outlined"
            />
          )}
          {filter.search && (
            <Chip
              label={`Search: ${filter.search}`}
              onDelete={() => setFilter(prev => ({ ...prev, search: '' }))}
              color="primary.contrastText"
              variant="outlined"
            />
          )}
          {filter.sortBy && (
            <Chip
              label={`Sort: ${filter.sortBy === 'price' ? 'Price' :
                filter.sortBy === 'nameAsc' ? 'Name A to Z' : 'Name Z to A'}`}
              onDelete={() => setFilter(prev => ({ ...prev, sortBy: '' }))}
              color="primary.contrastText"
              variant="outlined"
            />
          )}
        </Box>
      )}
      <Grid container spacing={2} style={{ marginBottom: '1rem' }}>
        <Grid item xs={12} style={{ display: 'flex', justifyContent: 'end' }}>
          <Box>
            <Tooltip title="Add New Deal">
              {user_role === 'distributor' && (
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
            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleDownloadClose}
            >
              <MenuItem onClick={() => handleDownload('csv')}>Download CSV</MenuItem>
              <MenuItem onClick={() => handleDownload('pdf')}>Download PDF</MenuItem>
            </Menu>
            <Tooltip title="Grid View">
              <IconButton color={layout === 'grid' ? 'primary' : 'default'} onClick={() => setLayout('grid')}>
                <ViewModule color="primary.contrastText" />
              </IconButton>
            </Tooltip>
            <Tooltip title="List View">
              <IconButton color={layout === 'list' ? 'primary' : 'default'} onClick={() => setLayout('list')}>
                <ViewList color="primary.contrastText" />
              </IconButton>
            </Tooltip>
            {!isMobile && (
              <Tooltip title="Table View">
                <IconButton color={layout === 'table' ? 'primary' : 'default'} onClick={() => setLayout('table')}>
                  <ViewComfy color="primary.contrastText" />
                </IconButton>
              </Tooltip>
            )}
          </Box>
        </Grid>
      </Grid>
      {layout === 'grid' && (
        <Grid container spacing={3}>
          {paginatedDeals.map((deal) => (
            <Grid item xs={12} sm={6} md={4} key={deal._id}>
              <Card sx={{
                borderRadius: 5,
                boxShadow: 6,
                overflow: "hidden",
                position: 'relative',
                transition: 'transform 0.3s, box-shadow 0.3s',
                '&:hover': {
                  transform: 'scale(1.03)',
                  boxShadow: 10
                },
                bgcolor: '#ffffff'
              }}>
                {/* Product Image or Video */}
                {deal.images && deal.images.length > 0 && (
                  <Box sx={{ position: 'relative', height: 180 }}>
                    {isVideoUrl(deal.images[0]) ? (
                      <Box
                        component="video"
                        src={deal.images[0]}
                        autoPlay
                        muted
                        loop
                        sx={{ 
                          width: '100%', 
                          height: '100%', 
                          objectFit: 'cover', 
                          borderRadius: '10px 10px 0 0' 
                        }}
                      />
                    ) : (
                      <CardMedia
                        component="img"
                        image={deal.images[0] || "https://via.placeholder.com/300"}
                        alt={deal.name}
                        sx={{ width: '100%', height: 180, objectFit: "cover", borderRadius: '10px 10px 0 0' }}
                      />
                    )}
                    {isVideoUrl(deal.images[0]) && (
                      <Box
                        sx={{
                          position: 'absolute',
                          bottom: 8,
                          right: 8,
                          bgcolor: 'rgba(0,0,0,0.6)',
                          color: 'white',
                          borderRadius: '50%',
                          p: 0.5,
                        }}
                      >
                        <PlayArrow fontSize="small" />
                      </Box>
                    )}
                  </Box>
                )}

                <CardContent sx={{ p: 3, bgcolor: 'linear-gradient(135deg, #eef2ff 0%, #d9e2ff 100%)' }}>
                  {/* Distributor Section */}
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    {deal.distributor.logo ? (
                      <CardMedia
                        component="img"
                        height="45"
                        image={deal.distributor.logo}
                        alt={deal?.distributor?.name}
                        sx={{ width: 45, borderRadius: '50%', mr: 2, border: '2px solid #ddd' }}
                      />
                    ) : (
                      <Box
                        sx={{
                          width: 45,
                          height: 45,
                          borderRadius: '50%',
                          backgroundColor: 'primary.main',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          mr: 2,
                          color: 'white',
                          fontWeight: 'bold',
                          fontSize: 20,
                        }}
                      >
                        {deal.distributor?.name ? deal.distributor.name.charAt(0) : 'N/A'}
                      </Box>
                    )}
                    <Tooltip title={deal.distributor.email}>
                      <Typography variant="body2" color="text.secondary">
                        {deal?.distributor?.name}
                      </Typography>
                    </Tooltip>
                  </Box>

                  {/* Product Name */}
                  <Typography variant="h6" fontWeight="bold" sx={{ mb: 1, textOverflow: 'ellipsis', whiteSpace: 'nowrap', overflow: 'hidden' }}>
                    {deal.name}
                  </Typography>

                  {/* Category and Mix & Match label */}
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1, flexWrap: 'wrap', gap: 1 }}>
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

                  {/* Description */}
                  <Typography variant="body2" color="text.secondary" sx={{ display: '-webkit-box', WebkitBoxOrient: 'vertical', overflow: 'hidden', WebkitLineClamp: 2, mb: 2 }}>
                    {deal.description}
                  </Typography>

                  {/* Sizes Section */}
                  {deal.sizes && deal.sizes.length > 0 ? (
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" fontWeight="bold" color="text.secondary" sx={{ mb: 1 }}>
                        Available Sizes:
                      </Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                        {deal.sizes.map((sizeItem, idx) => (
                          <Chip 
                            key={idx} 
                            label={sizeItem.size} 
                            size="small" 
                            variant="outlined" 
                            sx={{ borderColor: 'primary.contrastText', color: 'primary.contrastText' }}
                          />
                        ))}
                      </Box>
                    </Box>
                  ) : null}

                  {/* Pricing Section */}
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    {deal.sizes && deal.sizes.length > 0 ? (
                      <Box>
                        <Typography variant="body2" color="text.secondary" fontWeight="bold">
                          Price Range:
                        </Typography>
                        <Typography variant="body2" color="error.main" sx={{ textDecoration: 'line-through', fontSize: 14, mr: 1 }}>
                          ${Math.min(...deal.sizes.map(s => s.originalCost))} - ${Math.max(...deal.sizes.map(s => s.originalCost))}
                        </Typography>
                        <Typography variant="body2" color="green" fontWeight="bold" sx={{ fontSize: 16 }}>
                          ${Math.min(...deal.sizes.map(s => s.discountPrice))} - ${Math.max(...deal.sizes.map(s => s.discountPrice))}
                        </Typography>
                        <Typography variant="body2" sx={{ fontSize: 14, ml: 1, bgcolor: 'green', color: 'white', px: 1, borderRadius: 1, display: 'inline-block', mt: 1 }}>
                          Up to {Math.round(Math.max(...deal.sizes.map(s => ((s.originalCost - s.discountPrice) / s.originalCost) * 100)))}% off
                        </Typography>
                      </Box>
                    ) : (
                      <Box>
                        <Typography variant="body2" color="error.main" sx={{ textDecoration: 'line-through', fontSize: 14, mr: 1 }}>
                          ${deal.avgOriginalCost?.toFixed(2) || deal.originalCost}
                        </Typography>
                        <Typography variant="body2" color="green" fontWeight="bold" sx={{ fontSize: 16 }}>
                          ${deal.avgDiscountPrice?.toFixed(2) || deal.discountPrice}
                        </Typography>
                        <Typography variant="body2" sx={{ fontSize: 14, ml: 1, bgcolor: 'green', color: 'white', px: 1, borderRadius: 1, display: 'inline-block', mt: 1 }}>
                          -{Math.round(((deal.avgOriginalCost - deal.avgDiscountPrice) / deal.avgOriginalCost) * 100 || ((deal.originalCost - deal.discountPrice) / deal.originalCost) * 100)}%
                        </Typography>
                      </Box>
                    )}
                  </Box>

                  {/* Discount Tiers Section */}
                  {deal.sizes && deal.sizes.some(size => size.discountTiers && size.discountTiers.length > 0) ? (
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" fontWeight="bold" color="text.secondary" sx={{ mb: 1 }}>
                        Volume Discounts:
                      </Typography>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                        {deal.sizes.map((size, sizeIdx) => 
                          size.discountTiers && size.discountTiers.length > 0 ? (
                            <Box key={sizeIdx} sx={{ mb: 1 }}>
                              <Typography variant="body2" color="text.secondary" fontWeight="medium">
                                {size.size}:
                              </Typography>
                              {size.discountTiers.map((tier, tierIdx) => (
                                <Typography key={tierIdx} variant="body2" color="text.secondary" sx={{ ml: 2 }}>
                                  {tier.tierQuantity}+ units: ${tier.tierDiscount}
                                </Typography>
                              ))}
                            </Box>
                          ) : null
                        )}
                      </Box>
                    </Box>
                  ) : deal.discountTiers && deal.discountTiers.length > 0 ? (
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" fontWeight="bold" color="text.secondary" sx={{ mb: 1 }}>
                        Volume Discounts:
                      </Typography>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                        {deal.discountTiers.map((tier, idx) => (
                          <Typography key={idx} variant="body2" color="text.secondary">
                            {tier.tierQuantity}+ units: {tier.tierDiscount}% off
                          </Typography>
                        ))}
                      </Box>
                    </Box>
                  ) : null}

                  {/* Extra Deal Info */}
                  <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 1, mb: 2 }}>
                    <Typography variant="body2" color="text.secondary">Min Qty: {deal.minQtyForDiscount}</Typography>
                    <Typography variant="body2" color="text.secondary">Members: {deal.totalCommitments}</Typography>
                    <Typography variant="body2" color="text.secondary">Views: {deal.views}</Typography>
                    <Typography variant="body2" color="text.secondary">Impressions: {deal.impressions}</Typography>
                  </Box>

                  {/* Progress Bar for Sold Units */}
                  <Box sx={{ width: '100%', display: 'flex', alignItems: 'center', mb: 1 }}>
                    <Typography variant="body2" color="text.secondary" sx={{ flexGrow: 1 }}>
                      Deal Progress
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', mb: 2, gap: 1 }}>
                    <LinearProgress
                      variant="determinate"
                      value={Math.min(100, ((deal.totalCommittedQuantity || 0) / deal.minQtyForDiscount) * 100)}
                      sx={{ height: 6, borderRadius: 2, width: '90%' }}
                    />

                    {((deal.totalCommittedQuantity || 0) / deal.minQtyForDiscount) * 100 >= 100 && (
                      <CheckCircleIcon
                        sx={{
                          color: 'success.main'
                        }}
                      />
                    )}
                  </Box>
                </CardContent>

                {/* Action Buttons */}
                <CardActions sx={{ display: "flex", justifyContent: "center", p: 2, gap: 2 }}>
                  {user_role === 'distributor' && (
                    <Tooltip title="Edit">
                      <Button variant="contained" color="primary" size="small" onClick={() => handleEdit(deal)}>
                        <Edit fontSize="small" sx={{ mr: 1 }} color="primary.contrastText" /> Edit
                      </Button>
                    </Tooltip>
                  )}
                  <Tooltip title="View">
                    <Button variant="outlined" color="info" size="small" onClick={() => handleView(deal._id)}>
                      <Visibility fontSize="small" sx={{ mr: 1 }} color="primary.contrastText" /> View
                    </Button>
                  </Tooltip>
                  <Tooltip title={deal.status === 'active' ? 'Deactivate' : 'Activate'}>
                  {!deal.bulkAction && (
                          <>
                            <Switch checked={deal.status === 'active'} size="small" sx={{ mr: 1 }} />
                            {deal.status === 'active' ? '' : ''}
                          </>
                        )}
                  </Tooltip>
                  <Tooltip title='Delete'>
                  {!deal.bulkAction && (
                           <Button variant="contained" color="error" size="small" onClick={() => handleDelete(deal._id)}>
                              <Delete fontSize="small" sx={{ mr: 1 }} color="primary.contrastText" /> Delete
                            </Button>
                        )}
                  </Tooltip>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {layout === 'list' && (
        <Box>
          {paginatedDeals.map((deal) => (
            <Paper key={deal._id} sx={{ mb: 1, p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid #e0e0e0', borderRadius: 2, bgcolor: '#f9f9f9a2', transition: 'background-color 0.2s', '&:hover': { backgroundColor: '#f5f5f5' } }}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <CardMedia
                  component="img"
                  height={80}
                  image={deal.images[0] || "https://via.placeholder.com/300"}
                  alt={deal.name}
                  sx={{ objectFit: "cover", width: 80, mr: 2 }}
                />
                <Box>
                  <Typography variant="h6" fontWeight="bold"> 
                    {deal.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {deal.category}
                  </Typography>
                  {deal.sizes && deal.sizes.length > 1 && (
                    <Chip
                      label="Mix & Match"
                      size="small"
                      color="primary.contrastText"
                      sx={{
                        ml: 1,
                        fontWeight: 'bold',
                        background: 'linear-gradient(45deg, #FF8E53 30%, #FE6B8B 90%)',
                        color: 'primary.contrastText',
                        '& .MuiChip-label': { px: 1 }
                      }}
                    />
                  )}
                  {deal.sizes && deal.sizes.length > 0 ? (
                    <Box sx={{ display: 'flex', gap: 1, mt: 1, mb: 1, flexWrap: 'wrap' }}>
                      <Typography variant="body2" color="text.secondary">
                        Sizes: 
                      </Typography>
                      {deal.sizes.map((sizeItem, idx) => (
                        <Chip 
                          key={idx} 
                          label={sizeItem.size} 
                          size="small" 
                          variant="outlined" 
                          sx={{ borderColor: 'primary.contrastText', color: 'primary.contrastText' }}
                        />
                      ))}
                    </Box>
                  ) : null}
                  {deal.sizes && deal.sizes.length > 0 ? (
                    <Typography variant="body2" color="text.secondary">
                      Price Range: 
                      <span style={{ textDecoration: 'line-through', color: '#f44336', marginLeft: '4px' }}>
                        ${Math.min(...deal.sizes.map(s => s.originalCost))} - ${Math.max(...deal.sizes.map(s => s.originalCost))}
                      </span> | 
                      <span style={{ color: 'green', fontWeight: 'bold', marginLeft: '4px' }}>
                        ${Math.min(...deal.sizes.map(s => s.discountPrice))} - ${Math.max(...deal.sizes.map(s => s.discountPrice))}
                      </span>
                    </Typography>
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      Original Price: ${deal.avgOriginalCost?.toFixed(2) || deal.originalCost} | Discounted Price: ${deal.avgDiscountPrice?.toFixed(2) || deal.discountPrice}
                    </Typography>
                  )}
                  <Typography variant="body2" color="text.secondary">
                    Min Qty: {deal.minQtyForDiscount} | Members: {deal.totalCommitments}
                  </Typography>

                  {deal.sizes && deal.sizes.some(size => size.discountTiers && size.discountTiers.length > 0) && (
                    <Box sx={{ display: 'flex', flexDirection: 'column', mt: 1 }}>
                      <Typography variant="body2" color="text.secondary" fontWeight="medium">
                        Size-specific volume discounts:
                      </Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
                        {deal.sizes.filter(size => size.discountTiers && size.discountTiers.length > 0)
                          .slice(0, 2) // Limit to first 2 sizes to avoid crowding
                          .map((size, idx) => (
                            <Chip
                              key={idx}
                              label={`${size.size}: ${size.discountTiers.length} tier${size.discountTiers.length !== 1 ? 's' : ''}`}
                              size="small"
                              variant="outlined"
                              color="primary.contrastText"
                            />
                          ))}
                        {deal.sizes.filter(size => size.discountTiers && size.discountTiers.length > 0).length > 2 && (
                          <Chip
                            label={`+${deal.sizes.filter(size => size.discountTiers && size.discountTiers.length > 0).length - 2} more`}
                            size="small"
                            variant="outlined"
                          />
                        )}
                      </Box>
                    </Box>
                  )}
                </Box>
              </Box>
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', width: '250px', gap: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  Deal Progress
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', gap: 1 }}>
                  <LinearProgress
                    variant="determinate"
                    value={Math.min(100, ((deal.totalCommittedQuantity || 0) / deal.minQtyForDiscount) * 100)}
                    sx={{ height: 6, borderRadius: 2, width: '90%' }}
                  />
                  <Typography variant="body2" color="text.secondary">
                    {((deal.totalCommittedQuantity || 0) / deal.minQtyForDiscount) * 100 >= 100 && (
                      <CheckCircleIcon
                        sx={{
                          color: 'success.main'
                        }}
                      />
                    )}
                  </Typography>
                </Box>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <IconButton onClick={(e) => handleMenuOpen(e, deal._id)}>
                  <MoreVert color="primary.contrastText" />
                </IconButton>
                <Menu
                  anchorEl={anchorElMap[deal._id]}
                  open={Boolean(anchorElMap[deal._id])}
                  onClose={() => handleMenuClose(deal._id)}
                >
                  {user_role === 'distributor' && (
                    <MenuItem onClick={() => { handleEdit(deal); handleMenuClose(deal._id); }}>
                      <Edit sx={{ mr: 1 }} fontSize="small" color="primary.contrastText" /> Edit
                    </MenuItem>
                  )}
                  <MenuItem onClick={() => { handleView(deal._id); handleMenuClose(deal._id); }}>
                    <Visibility sx={{ mr: 1 }} fontSize="small" color="primary.contrastText" /> View
                  </MenuItem>
                  <MenuItem onClick={() => { handleToggleChange(deal._id, deal.status); handleMenuClose(deal._id); }}>
                  {!deal.bulkAction && (
                          <>
                            <Switch checked={deal.status === 'active'} size="small" sx={{ mr: 1 }} />
                            {deal.status === 'active' ? 'Deactivate' : 'Activate'}
                          </>
                        )}
                  </MenuItem>
                  {!deal.bulkAction && (
                           <MenuItem onClick={() => { handleDelete(deal._id); handleMenuClose(deal._id); }}>
                              <Delete sx={{ mr: 1 }} fontSize="small" color="primary.contrastText" /> Delete
                            </MenuItem>
                        )}
                </Menu>
              </Box>
            </Paper>
          ))}
        </Box>
      )}
      {layout === 'table' && (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow sx={{ color: 'primary.contrastText', bgcolor: 'primary.main' }}>
                <TableCell sx={{ color: 'primary.contrastText' }}><strong>Image</strong></TableCell>
                <TableCell sx={{ color: 'primary.contrastText' }}><strong>Name</strong></TableCell>
                <TableCell sx={{ color: 'primary.contrastText' }}><strong>Sizes</strong></TableCell>
                <TableCell sx={{ color: 'primary.contrastText' }}><strong>Price</strong></TableCell>
                <TableCell sx={{ color: 'primary.contrastText' }}><strong>Deal Progress</strong></TableCell>
                <TableCell sx={{ color: 'primary.contrastText' }}><strong>Actions</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedDeals.map((deal, index) => (
                <TableRow key={deal._id} sx={{height: '60px' }}>
                  <TableCell sx={{ padding: '16px', borderBottom: '1px solid #e0e0e0' }}>
                    <CardMedia
                      component="img"
                      height="80"
                      image={deal.images[0] || "https://via.placeholder.com/300"}
                      alt={deal.name}
                      sx={{ objectFit: "cover", width: 80 }}
                    />
                  </TableCell>
                  <TableCell sx={{ padding: '16px', borderBottom: '1px solid #e0e0e0' }}>{deal.name}</TableCell>
                  <TableCell sx={{ padding: '16px', borderBottom: '1px solid #e0e0e0' }}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {deal.sizes && deal.sizes.length > 0 ? (
                          deal.sizes.map((sizeItem, idx) => (
                            <Chip 
                              key={idx} 
                              label={sizeItem.size} 
                              size="small" 
                              sx={{ fontSize: '0.7rem' }}
                            />
                          ))
                        ) : (
                          <Chip label="Standard" size="small" color="primary.contrastText" />
                        )}
                      </Box>
                      <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
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
                              color: 'primary.contrastText',
                              '& .MuiChip-label': { px: 1 }
                            }}
                          />
                        )}
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell sx={{ padding: '16px', borderBottom: '1px solid #e0e0e0' }}> 
                    {deal.sizes && deal.sizes.length > 0 ? (
                      <Box>
                        <Typography variant="body2" color="error.main" sx={{ textDecoration: 'line-through' }}>
                          ${Math.min(...deal.sizes.map(s => s.originalCost))} - ${Math.max(...deal.sizes.map(s => s.originalCost))}
                        </Typography>
                        <Typography variant="body2" color="success.main" sx={{ fontWeight: 'bold' }}>
                          ${Math.min(...deal.sizes.map(s => s.discountPrice))} - ${Math.max(...deal.sizes.map(s => s.discountPrice))}
                        </Typography>
                      </Box>
                    ) : (
                      <>
                        <span style={{ textDecoration: 'line-through' }}>${deal.avgOriginalCost?.toFixed(2) || deal.originalCost}</span> / 
                        ${deal.avgDiscountPrice?.toFixed(2) || deal.discountPrice}
                      </>
                    )}
                  </TableCell>
                  <TableCell sx={{ padding: '16px', borderBottom: '1px solid #e0e0e0' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', gap: 1 }}>
                      <LinearProgress
                        variant="determinate"
                        value={Math.min(100, Math.round((deal.totalCommittedQuantity || 0) / deal.minQtyForDiscount * 100))}
                        sx={{ height: 6, borderRadius: 2, width: '90%' }}
                        color={(deal.totalCommittedQuantity || 0) >= deal.minQtyForDiscount ? 'success' : 'primary'}
                      />
                      <Typography variant="body2" color="text.secondary">
                        {Math.min(100, Math.round((deal.totalCommittedQuantity || 0) / deal.minQtyForDiscount * 100))}%
                      </Typography>
                    </Box>
                    {(deal.totalCommittedQuantity || 0) >= deal.minQtyForDiscount ? (
                      <Chip 
                        label="COMPLETED" 
                        color="success" 
                        size="small"
                        sx={{ fontSize: '0.75rem', mt: 0.5 }}
                      />
                    ) : (
                      <Typography variant="caption" color="warning.main">
                        {Math.max(0, deal.minQtyForDiscount - (deal.totalCommittedQuantity || 0))} more to go
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell sx={{ padding: '16px', borderBottom: '1px solid #e0e0e0' }}>
                    <IconButton onClick={(e) => handleMenuOpen(e, deal._id)}>
                      <MoreVert color="primary.contrastText" />
                    </IconButton>
                    <Menu
                      anchorEl={anchorElMap[deal._id]}
                      open={Boolean(anchorElMap[deal._id])}
                      onClose={() => handleMenuClose(deal._id)}
                    >
                      {user_role === 'distributor' && (
                        <MenuItem onClick={() => { handleEdit(deal); handleMenuClose(deal._id); }}>
                          <Edit sx={{ mr: 1 }} fontSize="small" color="primary.contrastText" /> Edit
                        </MenuItem>
                      )}
                      <MenuItem onClick={() => { handleView(deal._id); handleMenuClose(deal._id); }}>
                        <Visibility sx={{ mr: 1 }} fontSize="small" color="primary.contrastText" /> View
                      </MenuItem>
                      <MenuItem onClick={() => { handleToggleChange(deal._id, deal.status); handleMenuClose(deal._id); }}>
                        {!deal.bulkAction && (
                          <>
                            <Switch checked={deal.status === 'active'} size="small" sx={{ mr: 1 }} />
                            {deal.status === 'active' ? 'Deactivate' : 'Activate'}
                          </>
                        )}
                      </MenuItem>
                      {!deal.bulkAction && (
                      <MenuItem onClick={() => { handleDelete(deal._id); handleMenuClose(deal._id); }}>
                    <Delete sx={{ mr: 1 }} fontSize="small" color="primary.contrastText" /> Delete
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
      <Box sx={{
        mt: 4,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 2,
        flexWrap: 'wrap',
        p: 2,
        borderRadius: 2,
      }}>
        <TablePagination
          component="div"
          count={filteredDeals.length}
          page={page}
          onPageChange={handleChangePage}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          rowsPerPageOptions={[5, 10, 20, 30, 40, 50]}
          labelRowsPerPage="Items per page:"
          sx={{
            '.MuiTablePagination-select': {
              borderRadius: 1,
              bgcolor: 'background.paper',
            },
            '.MuiTablePagination-selectIcon': {
              color: 'primary.contrastText',
            },
          }}
        />
        <Pagination
          count={Math.ceil(filteredDeals.length / rowsPerPage)}
          page={page + 1}
          onChange={(e, p) => setPage(p - 1)}
          color="primary.contrastText"
          size={isMobile ? "small" : "medium"}
          sx={{
            '& .MuiPaginationItem-root': {
              borderRadius: 1,
              '&.Mui-selected': {
                bgcolor: 'primary.main',
                color: 'primary.contrastText',
                '&:hover': {
                  bgcolor: 'primary.dark',
                },
              },
            },
          }}
        />
      </Box>
      <Toast
        open={toast.open}
        message={toast.message}
        severity={toast.severity}
        handleClose={handleCloseToast}
      />
    </Container>
  );
};

export default DealsManagment;