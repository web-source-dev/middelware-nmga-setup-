import React, { useEffect, useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  Typography,
  Box,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Chip,
  Grid,
  useMediaQuery,
  Menu,
  MenuItem,
  Tooltip,
  Pagination,
  TablePagination,
  InputLabel,
  Collapse,
  Badge,
  InputAdornment
} from '@mui/material';
import { ViewList, ViewModule, TableChart, Download, ClearAll, Search, FilterAlt, ExpandMore, ExpandLess,Clear } from '@mui/icons-material';
import axios from 'axios';
import Toast from '../../../Components/Toast/Toast';
import { useParams } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { saveAs } from 'file-saver';
import { FilterTextField, FilterSelect, FilterFormControl } from '../../DashBoardComponents/FilterStyles';
import {
  FilterContainer,
} from '../../DashBoardComponents/StyledComponents';
import { TableSkeleton } from '../../../Components/Skeletons/LoadingSkeletons';

const AllCommitments = () => {
    const { userId } = useParams();
    const navigate = useNavigate();
  const [commitments, setCommitments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState({ open: false, message: '', severity: 'success' });
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedCommitment, setSelectedCommitment] = useState(null);
  const [response, setResponse] = useState('');
  const [modifiedQuantity, setModifiedQuantity] = useState('');
  const [modifiedPrice, setModifiedPrice] = useState('');
  const userRole = localStorage.getItem('user_role');
  const [filter, setFilter] = useState({
    status: '',
    distributor: '',
    memberName: '',
  });
  const [layout, setLayout] = useState('table');
  const isMobile = useMediaQuery('(max-width:600px)');
  const [anchorEl, setAnchorEl] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [showFilters, setShowFilters] = useState(false);
  const [activeFilters, setActiveFilters] = useState(0);

  useEffect(() => {
    if (isMobile) {
      setLayout('grid');
    }
  }, [isMobile]);

  useEffect(() => {
    const count = Object.values(filter).filter(value => value !== '').length;
    setActiveFilters(count);
  }, [filter]);

  const showToast = (message, severity = 'success') => {
    setToast({ open: true, message, severity });
  };
  const fetchCommitments = async () => {
    try {
      let response;
      if (userRole === 'admin') {
        // Fetch all commitments for admin
        response = await axios.get(
          `${process.env.REACT_APP_BACKEND_URL}/deals/commit/admin/all-commitments`
        );
      } else if (userRole !== 'member') {
        // Fetch commitments for distributor's deals
        response = await axios.get(
          `${process.env.REACT_APP_BACKEND_URL}/deals/commit/distributor-commitments/${userId}`
        );
      } else {
        // Fetch user's commitments
        response = await axios.get(
          `${process.env.REACT_APP_BACKEND_URL}/deals/commit/fetch/${userId}`
        );
      }
      setCommitments(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching commitments:', error);
      showToast('Error fetching commitments', 'error');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCommitments();
  }, [userId]);

  const handleStatusUpdate = async (commitmentId, newStatus) => {
    try {
      const payload = {
        commitmentId,
        status: newStatus,
        distributorResponse: response,
        modifiedQuantity: modifiedQuantity || null,
        modifiedTotalPrice: modifiedPrice || null
      };

      await axios.put(`${process.env.REACT_APP_BACKEND_URL}/deals/commit/update-status`, payload);
      showToast(`Commitment ${newStatus} successfully`);
      fetchCommitments();
      handleCloseDialog();
    } catch (error) {
      console.error('Error updating commitment status:', error);
      showToast(error.response?.data?.message || 'Error updating commitment', 'error');
    }
  };

  const handleOpenDialog = (commitment) => {
    setSelectedCommitment(commitment);
    setDialogOpen(true);
    setModifiedQuantity(commitment.quantity);
    setModifiedPrice(commitment.totalPrice);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setSelectedCommitment(null);
    setResponse('');
    setModifiedQuantity('');
    setModifiedPrice('');
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

  const handleFilterChange = (e) => {
    setFilter({
      ...filter,
      [e.target.name]: e.target.value,
    });
  };

  const clearFilters = () => {
    setFilter({
      status: '',
      distributor: '',
      memberName: '',
    });
  };

  const filteredCommitments = commitments.filter((commitment) => {
    return (
      (filter.status ? commitment.status === filter.status : true) &&
      (filter.distributor ? commitment.dealId?.distributor?.name.includes(filter.distributor) : true) &&
      (filter.memberName ? commitment.userId?.name.includes(filter.memberName) : true)
    );
  });

  const paginatedCommitments = filteredCommitments.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  const handleLayoutChange = (newLayout) => {
    setLayout(newLayout);
  };

  const handleDownloadClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleDownloadClose = () => {
    setAnchorEl(null);
  };

  const downloadPDF = () => {
    const doc = new jsPDF();
    doc.text('Commitments', 20, 10);
    doc.autoTable({
      head: [['Deal Name', 'Distributor', 'Member Name', 'Quantity', 'Total Price', 'Status']],
      body: filteredCommitments.map(commitment => [
        commitment.dealId?.name || 'N/A',
        commitment.dealId?.distributor?.name || 'N/A',
        commitment.userId?.name || 'N/A',
        commitment.quantity,
        `$${commitment.totalPrice}`,
        commitment.status
      ])
    });
    doc.save('commitments.pdf');
    handleDownloadClose();
  };

  const downloadCSV = () => {
    const csvContent = [
      ['Deal Name', 'Distributor', 'Member Name', 'Quantity', 'Total Price', 'Status'],
      ...filteredCommitments.map(commitment => [
        commitment.dealId?.name || 'N/A',
        commitment.dealId?.distributor?.name || 'N/A',
        commitment.userId?.name || 'N/A',
        commitment.quantity,
        `$${commitment.totalPrice}`,
        commitment.status
      ])
    ].map(e => e.join(",")).join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    saveAs(blob, 'commitments.csv');
    handleDownloadClose();
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  if (loading) {
    return <TableSkeleton columnsNum={7} />;
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h6">
          {userRole === 'admin' 
            ? 'All Commitments' 
            : userRole !== 'member' 
              ? 'Member Commitments' 
              : 'My Commitments'}
        </Typography>
        <Box>
          <Tooltip title="List View">
            <Button
              variant={layout === 'list' ? 'contained' : 'outlined'}
              onClick={() => handleLayoutChange('list')}
              startIcon={<ViewList />}
              sx={{ mr: 1 }}
            >
              List
            </Button>
          </Tooltip>
          <Tooltip title="Grid View">
            <Button
              variant={layout === 'grid' ? 'contained' : 'outlined'}
              onClick={() => handleLayoutChange('grid')}
              startIcon={<ViewModule />}
              sx={{ mr: 1 }}
            >
              Grid
            </Button>
          </Tooltip>
          <Tooltip title="Table View" disableHoverListener={isMobile}>
            <Button
              variant={layout === 'table' ? 'contained' : 'outlined'}
              onClick={() => handleLayoutChange('table')}
              startIcon={<TableChart />}
              sx={{ mr: 1 }}
              disabled={isMobile}
            >
              Table
            </Button>
          </Tooltip>
          <Tooltip title="Download Options">
            <Button
              variant="outlined"
              startIcon={<Download />}
              onClick={handleDownloadClick}
              sx={{ mr: 1 }}
            >
              Download
            </Button>
          </Tooltip>
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleDownloadClose}
          >
            <MenuItem onClick={downloadPDF}>Download PDF</MenuItem>
            <MenuItem onClick={downloadCSV}>Download CSV</MenuItem>
          </Menu>
          <Tooltip title="Clear Filters">
            <Button
              variant="outlined"
              startIcon={<ClearAll />}
              onClick={clearFilters}
            >
              Clear Filters
            </Button>
          </Tooltip>
        </Box>
      </Box>
      
      <Paper sx={{ mb: 3, p: 2 }}>
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
              onClick={clearFilters}
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
                    {['Pending', 'Approved', 'Declined', 'Today', 'Last 7 Days'].map((label) => (
                      <Chip
                        key={label}
                        label={label}
                        onClick={() => {
                          if (label === 'Pending') {
                            setFilter(prev => ({ ...prev, status: 'pending' }));
                          } else if (label === 'Approved') {
                            setFilter(prev => ({ ...prev, status: 'approved' }));
                          } else if (label === 'Declined') {
                            setFilter(prev => ({ ...prev, status: 'declined' }));
                          }
                          // Add date filtering logic if needed
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
                  label="Search Commitments"
                  name="search"
                  value={filter.search}
                  onChange={handleFilterChange}
                  fullWidth
                  placeholder="Search by member or deal..."
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
                  <InputLabel>Status</InputLabel>
                  <FilterSelect
                    value={filter.status}
                    onChange={handleFilterChange}
                    label="Status"
                    name="status"
                  >
                    <MenuItem value=""><em>All Status</em></MenuItem>
                    <MenuItem value="pending">Pending</MenuItem>
                    <MenuItem value="approved">Approved</MenuItem>
                    <MenuItem value="declined">Declined</MenuItem>
                  </FilterSelect>
                </FilterFormControl>
              </Grid>

              <Grid item xs={12} sm={6} md={4}>
                <FilterFormControl fullWidth>
                  <InputLabel>Sort By</InputLabel>
                  <FilterSelect
                    value={filter.sort}
                    onChange={handleFilterChange}
                    label="Sort By"
                    name="sort"
                  >
                    <MenuItem value=""><em>None</em></MenuItem>
                    <MenuItem value="newest">Newest First</MenuItem>
                    <MenuItem value="oldest">Oldest First</MenuItem>
                    <MenuItem value="price_high">Price: High to Low</MenuItem>
                    <MenuItem value="price_low">Price: Low to High</MenuItem>
                  </FilterSelect>
                </FilterFormControl>
              </Grid>
            </Grid>
          </FilterContainer>
        </Collapse>
      </Paper>

      {activeFilters > 0 && (
        <Box sx={{ mb: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          {filter.status && (
            <Chip
              label={`Status: ${filter.status}`}
              onDelete={() => setFilter(prev => ({ ...prev, status: '' }))}
              color="primary"
              variant="outlined"
            />
          )}
          {filter.search && (
            <Chip
              label={`Search: ${filter.search}`}
              onDelete={() => setFilter(prev => ({ ...prev, search: '' }))}
              color="primary"
              variant="outlined"
            />
          )}
          {filter.sort && (
            <Chip
              label={`Sort: ${filter.sort}`}
              onDelete={() => setFilter(prev => ({ ...prev, sort: '' }))}
              color="primary"
              variant="outlined"
            />
          )}
        </Box>
      )}

      {layout === 'table' && !isMobile && (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Deal Name</TableCell>
                {userRole === 'admin' && <TableCell>Distributor</TableCell>}
                {(userRole !== 'member' || userRole === 'admin') && (
                  <>
                    <TableCell>Member Name</TableCell>
                    <TableCell>Member Email</TableCell>
                  </>
                )}
                <TableCell>Quantity</TableCell>
                <TableCell>Total Price</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Created At</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedCommitments.length > 0 ? (
                paginatedCommitments.map((commitment) => (
                  <TableRow key={commitment._id}>
                    <TableCell>{commitment.dealId?.name || 'N/A'}</TableCell>
                    {userRole === 'admin' && (
                      <TableCell>
                        {commitment.dealId?.distributor?.name || 'N/A'}
                      </TableCell>
                    )}
                    {(userRole !== 'member' || userRole === 'admin') && (
                      <>
                        <TableCell>{commitment.userId?.name || 'N/A'}</TableCell>
                        <TableCell>{commitment.userId?.email || 'N/A'}</TableCell>
                      </>
                    )}
                    <TableCell>
                      {commitment.modifiedQuantity ? (
                        <span>
                          <s>{commitment.quantity}</s> → {commitment.modifiedQuantity}
                        </span>
                      ) : (
                        commitment.quantity
                      )}
                    </TableCell>
                    <TableCell>
                      {commitment.modifiedTotalPrice ? (
                        <span>
                          <s>${commitment.totalPrice}</s> → ${commitment.modifiedTotalPrice}
                        </span>
                      ) : (
                        `$${commitment.totalPrice}`
                      )}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={commitment.status.toUpperCase()}
                        color={getStatusColor(commitment.status)}
                        size="small"
                        sx={{
                          fontWeight: 'medium',
                          minWidth: '90px',
                          '& .MuiChip-label': {
                            px: 1
                          }
                        }}
                      />
                    </TableCell>
                    <TableCell>{new Date(commitment.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell>
                      {(userRole === 'admin' || (userRole !== 'member' && commitment.status === 'pending')) && (
                        <Button 
                          variant="outlined" 
                          color="primary" 
                          onClick={() => handleOpenDialog(commitment)}
                          sx={{ mr: 1 }}
                        >
                          Review
                        </Button>
                      )}
                      <Button
                        variant="outlined"
                        color="info"
                        onClick={() => navigate(`/commitment-details/${commitment._id}`)}
                      >
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={userRole === 'admin' ? 9 : (userRole !== 'member' ? 8 : 6)} align="center">
                    <Box sx={{ py: 5, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <Typography variant="h6" color="text.secondary" gutterBottom>
                        No commitments available
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {filteredCommitments.length === 0 && commitments.length > 0 ? 
                          "No commitments match your filter criteria" : 
                          "No commitment data found"}
                      </Typography>
                      {filteredCommitments.length === 0 && commitments.length > 0 && (
                        <Button
                          sx={{ mt: 2 }}
                          variant="outlined"
                          color="primary"
                          onClick={clearFilters}
                        >
                          Clear Filters
                        </Button>
                      )}
                    </Box>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {layout === 'grid' && (
        paginatedCommitments.length > 0 ? (
          <Grid container spacing={3}>
            {paginatedCommitments.map((commitment) => (
              <Grid item xs={12} sm={6} md={4} key={commitment._id}>
                <Paper sx={{ p: 2 }}>
                  <Typography variant="h6">{commitment.dealId?.name || 'N/A'}</Typography>
                  {userRole === 'admin' && (
                    <Typography variant="body2">
                      Distributor: {commitment.dealId?.distributor?.name || 'N/A'}
                    </Typography>
                  )}
                  {(userRole !== 'member' || userRole === 'admin') && (
                    <>
                      <Typography variant="body2">Member: {commitment.userId?.name || 'N/A'}</Typography>
                      <Typography variant="body2">Email: {commitment.userId?.email || 'N/A'}</Typography>
                    </>
                  )}
                  <Typography variant="body2">
                    Quantity: {commitment.modifiedQuantity ? (
                      <span>
                        <s>{commitment.quantity}</s> → {commitment.modifiedQuantity}
                      </span>
                    ) : (
                      commitment.quantity
                    )}
                  </Typography>
                  <Typography variant="body2">
                    Total Price: {commitment.modifiedTotalPrice ? (
                      <span>
                        <s>${commitment.totalPrice}</s> → ${commitment.modifiedTotalPrice}
                      </span>
                    ) : (
                      `$${commitment.totalPrice}`
                    )}
                  </Typography>
                  <Chip
                    label={commitment.status.toUpperCase()}
                    color={getStatusColor(commitment.status)}
                    size="small"
                    sx={{
                      fontWeight: 'medium',
                      minWidth: '90px',
                      '& .MuiChip-label': {
                        px: 1
                      }
                    }}
                  />
                  <Typography variant="body2">Created At: {new Date(commitment.createdAt).toLocaleDateString()}</Typography>
                  <Box mt={2}>
                    {(userRole === 'admin' || (userRole !== 'member' && commitment.status === 'pending')) && (
                      <Button 
                        variant="outlined" 
                        color="primary" 
                        onClick={() => handleOpenDialog(commitment)}
                        sx={{ mr: 1 }}
                      >
                        Review
                      </Button>
                    )}
                    <Button
                      variant="outlined"
                      color="info"
                      onClick={() => navigate(`/commitment-details/${commitment._id}`)}
                    >
                      View
                    </Button>
                  </Box>
                </Paper>
              </Grid>
            ))}
          </Grid>
        ) : (
          <Paper sx={{ p: 5, textAlign: 'center' }}>
            <Box sx={{ py: 5, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No commitments available
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {filteredCommitments.length === 0 && commitments.length > 0 ? 
                  "No commitments match your filter criteria" : 
                  "No commitment data found"}
              </Typography>
              {filteredCommitments.length === 0 && commitments.length > 0 && (
                <Button
                  sx={{ mt: 2 }}
                  variant="outlined"
                  color="primary"
                  onClick={clearFilters}
                >
                  Clear Filters
                </Button>
              )}
            </Box>
          </Paper>
        )
      )}

      {layout === 'list' && (
        paginatedCommitments.length > 0 ? (
          <Box>
            {paginatedCommitments.map((commitment) => (
              <Paper key={commitment._id} sx={{ p: 2, mb: 2 }}>
                <Typography variant="h6">{commitment.dealId?.name || 'N/A'}</Typography>
                {userRole === 'admin' && (
                  <Typography variant="body2">
                    Distributor: {commitment.dealId?.distributor?.name || 'N/A'}
                  </Typography>
                )}
                {(userRole !== 'member' || userRole === 'admin') && (
                  <>
                    <Typography variant="body2">Member: {commitment.userId?.name || 'N/A'}</Typography>
                    <Typography variant="body2">Email: {commitment.userId?.email || 'N/A'}</Typography>
                  </>
                )}
                <Typography variant="body2">
                  Quantity: {commitment.modifiedQuantity ? (
                    <span>
                      <s>{commitment.quantity}</s> → {commitment.modifiedQuantity}
                    </span>
                  ) : (
                    commitment.quantity
                  )}
                </Typography>
                <Typography variant="body2">
                  Total Price: {commitment.modifiedTotalPrice ? (
                    <span>
                      <s>${commitment.totalPrice}</s> → ${commitment.modifiedTotalPrice}
                    </span>
                  ) : (
                    `$${commitment.totalPrice}`
                  )}
                </Typography>
                <Chip
                  label={commitment.status.toUpperCase()}
                  color={getStatusColor(commitment.status)}
                  size="small"
                  sx={{
                    fontWeight: 'medium',
                    minWidth: '90px',
                    '& .MuiChip-label': {
                      px: 1
                    }
                  }}
                />
                <Typography variant="body2">Created At: {new Date(commitment.createdAt).toLocaleDateString()}</Typography>
                <Box mt={2}>
                  {(userRole === 'admin' || (userRole !== 'member' && commitment.status === 'pending')) && (
                    <Button 
                      variant="outlined" 
                      color="primary" 
                      onClick={() => handleOpenDialog(commitment)}
                      sx={{ mr: 1 }}
                    >
                      Review
                    </Button>
                  )}
                  <Button
                    variant="outlined"
                    color="info"
                    onClick={() => navigate(`/commitment-details/${commitment._id}`)}
                  >
                    View
                  </Button>
                </Box>
              </Paper>
            ))}
          </Box>
        ) : (
          <Paper sx={{ p: 5, textAlign: 'center' }}>
            <Box sx={{ py: 5, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No commitments available
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {filteredCommitments.length === 0 && commitments.length > 0 ? 
                  "No commitments match your filter criteria" : 
                  "No commitment data found"}
              </Typography>
              {filteredCommitments.length === 0 && commitments.length > 0 && (
                <Button
                  sx={{ mt: 2 }}
                  variant="outlined"
                  color="primary"
                  onClick={clearFilters}
                >
                  Clear Filters
                </Button>
              )}
            </Box>
          </Paper>
        )
      )}

      <Box sx={{ 
        mt: 3, 
        display: 'flex', 
        justifyContent: 'center',
        alignItems: 'center',
        gap: 2,
        flexWrap: 'wrap'
      }}>
        <TablePagination
          component="div"
          count={filteredCommitments.length}
          page={page}
          onPageChange={handleChangePage}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          rowsPerPageOptions={[5, 10, 25, 50]}
          sx={{
            '.MuiTablePagination-select': {
              borderRadius: 1,
              bgcolor: 'background.paper',
            },
            '.MuiTablePagination-selectIcon': {
              color: 'primary.main',
            },
          }}
        />
        <Pagination
          count={Math.ceil(filteredCommitments.length / rowsPerPage)}
          page={page + 1}
          onChange={(e, p) => setPage(p - 1)}
          color="primary"
          size={isMobile ? "small" : "medium"}
          sx={{
            '& .MuiPaginationItem-root': {
              borderRadius: 1,
              '&.Mui-selected': {
                bgcolor: 'primary.main',
                color: 'white',
                '&:hover': {
                  bgcolor: 'primary.dark',
                },
              },
            },
          }}
        />
      </Box>

      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Review Commitment</DialogTitle>
        <DialogContent>
          {selectedCommitment && (
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle1" gutterBottom>
                {selectedCommitment.dealId?.name} - {selectedCommitment.userId?.name}
              </Typography>
              
              {/* Size Commitments Details */}
              {selectedCommitment.sizeCommitments && selectedCommitment.sizeCommitments.length > 0 && (
                <Box sx={{ mt: 2, mb: 3 }}>
                  <Typography variant="subtitle2" fontWeight="medium" gutterBottom>
                    Size Breakdown:
                  </Typography>
                  <TableContainer component={Paper} variant="outlined" sx={{ mb: 2 }}>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Size</TableCell>
                          <TableCell align="right">Quantity</TableCell>
                          <TableCell align="right">Price Per Unit</TableCell>
                          <TableCell align="right">Total</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {selectedCommitment.sizeCommitments.map((sizeCommit, idx) => (
                          <TableRow key={idx}>
                            <TableCell>{sizeCommit.size}</TableCell>
                            <TableCell align="right">{sizeCommit.quantity}</TableCell>
                            <TableCell align="right">${sizeCommit.pricePerUnit?.toFixed(2)}</TableCell>
                            <TableCell align="right">${(sizeCommit.quantity * sizeCommit.pricePerUnit).toFixed(2)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                  
                  {/* Display applied discount tiers information */}
                  {selectedCommitment.appliedDiscountTier && (
                    <Paper sx={{ p: 1.5, bgcolor: 'success.light', color: 'success.dark', mb: 2, borderRadius: 1 }}>
                      <Typography variant="body2" fontWeight="medium">
                        Applied Discount Tier: ${selectedCommitment.appliedDiscountTier.tierDiscount} at {selectedCommitment.appliedDiscountTier.tierQuantity}+ units
                      </Typography>
                    </Paper>
                  )}
                </Box>
              )}
            </Box>
          )}

          <TextField
            fullWidth
            label="Response Message"
            multiline
            rows={4}
            value={response}
            onChange={(e) => setResponse(e.target.value)}
            margin="normal"
          />
          <TextField
            fullWidth
            label="Modified Quantity"
            type="number"
            value={modifiedQuantity}
            onChange={(e) => setModifiedQuantity(e.target.value)}
            margin="normal"
          />
          <TextField
            fullWidth
            label="Modified Total Price"
            type="number"
            value={modifiedPrice}
            onChange={(e) => setModifiedPrice(e.target.value)}
            margin="normal"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} color="primary">
            Cancel
          </Button>
          <Button 
            onClick={() => handleStatusUpdate(selectedCommitment._id, 'approved')} 
            color="success" 
            variant="contained"
          >
            Approve
          </Button>
          <Button 
            onClick={() => handleStatusUpdate(selectedCommitment._id, 'declined')} 
            color="error" 
            variant="contained"
          >
            Decline
          </Button>
        </DialogActions>
      </Dialog>

      <Toast
        open={toast.open}
        message={toast.message}
        severity={toast.severity}
        handleClose={() => setToast({ ...toast, open: false })}
      />
    </Box>
  );
};

export default AllCommitments;
