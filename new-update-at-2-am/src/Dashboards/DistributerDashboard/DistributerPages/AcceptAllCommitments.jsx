import React, { useState, useEffect, useCallback } from 'react';
import api from '../../../services/api';
import { useAuth } from '../../../middleware/auth';
import {
  Table,
  Tooltip,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Box,
  Alert,
  CircularProgress,
  Checkbox,
  FormControlLabel,
  TextField,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
  Pagination,
  Stack,
  Grid,
  Menu,
  styled,
  IconButton,
  ListItemIcon,
  Divider,
  Chip
} from '@mui/material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';

import {
  Check as CheckIcon,
  Close as CloseIcon,
  Visibility as VisibilityIcon,
  Search as SearchIcon,
  GetApp,
  Analytics as AnalyticsIcon,
  MoreVert as MoreVertIcon
} from '@mui/icons-material';
import { format } from 'date-fns';
import { saveAs } from 'file-saver';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { useNavigate } from 'react-router-dom';
import { display } from '@mui/system';

const isMobile = window.innerWidth <= 600;

// Add debounce function
const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

const StyledTableCell = styled(TableCell)(({ theme }) => ({
  [theme.breakpoints.down('sm')]: {
    padding: '8px 4px',
    '&:first-of-type': {
      paddingLeft: 8,
    },
    '&:last-of-type': {
      paddingRight: 8,
    },
  },
}));

const AcceptAllCommitments = () => {
  const { currentUserId, isImpersonating } = useAuth();
  const [deals, setDeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedDeal, setSelectedDeal] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [actionInProgress, setActionInProgress] = useState(false);
  const [selectedCommitments, setSelectedCommitments] = useState([]);
  const [selectAll, setSelectAll] = useState(false);
  const [selectedDeals, setSelectedDeals] = useState([]);
  const [selectAllDeals, setSelectAllDeals] = useState(false);
  const [downloadAnchorEl, setDownloadAnchorEl] = useState(null);
  const downloadMenuOpen = Boolean(downloadAnchorEl);
  const [confirmDialog, setConfirmDialog] = useState({
    open: false,
    title: '',
    content: '',
    action: null,
    actionType: '',
    data: null
  });
  const [exportLoading, setExportLoading] = useState(false);
  const [selectedActionType, setSelectedActionType] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedDealId, setSelectedDealId] = useState(null);


  const months = [
    { value: 1, label: 'January' },
    { value: 2, label: 'February' },
    { value: 3, label: 'March' },
    { value: 4, label: 'April' },
    { value: 5, label: 'May' },
    { value: 6, label: 'June' },
    { value: 7, label: 'July' },
    { value: 8, label: 'August' },
    { value: 9, label: 'September' },
    { value: 10, label: 'October' },
    { value: 11, label: 'November' },
    { value: 12, label: 'December' }
  ];
  const currentMonthValue = new Date().getMonth() + 1;

  // Find the corresponding month object
  const currentMonth = months.find(month => month.value === currentMonthValue) || months[0];
  // New state for filters and pagination
  const [searchInput, setSearchInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(currentMonth.value);
  const [selectedStatus, setSelectedStatus] = useState('');
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [limit] = useState(10);

  const distributorId = currentUserId;

  const navigate = useNavigate();

  // Create a debounced search function
  const debouncedSearch = useCallback(
    debounce((searchValue) => {
      setSearchTerm(searchValue);
    }, 500),  // 500ms delay
    []
  );

  useEffect(() => {
    fetchDeals();
  }, [page, searchTerm, selectedMonth, selectedStatus, startDate, endDate]);

  // Update selectedDeals when selectAllDeals changes
  useEffect(() => {
    if (deals.length > 0) {
      if (selectAllDeals) {
        setSelectedDeals(deals.filter(deal => deal.pendingCommitments > 0).map(deal => deal._id));
      } else {
        setSelectedDeals([]);
      }
    }
  }, [selectAllDeals, deals]);

  // Update selectedCommitments when selectAll changes
  useEffect(() => {
    if (selectedDeal?.detailedCommitments) {
      if (selectAll) {
        const pendingCommitmentIds = selectedDeal.detailedCommitments
          .filter(c => c.status === 'pending')
          .map(c => c._id);
        setSelectedCommitments(pendingCommitmentIds);
      } else {
        setSelectedCommitments([]);
      }
    }
  }, [selectAll, selectedDeal]);

  const fetchDeals = async () => {
    try {
      setLoading(true);
      let url = `/deals/allDeals/distributor-deals?page=${page}&limit=${limit}`;

      if (searchTerm) {
        url += `&search=${encodeURIComponent(searchTerm)}`;
      }

      if (selectedMonth) {
        url += `&month=${selectedMonth}`;
      } else {
        // Explicitly add empty month parameter when "All Months" is selected
        url += `&month=`;
      }

      if (selectedStatus) {
        url += `&commitmentStatus=${selectedStatus}`;
      }

      if (startDate && endDate) {
        url += `&startDate=${format(startDate, 'yyyy-MM-dd')}&endDate=${format(endDate, 'yyyy-MM-dd')}`;
      }

      const response = await api.get(url);
      setDeals(response.data.deals);
      setTotalPages(response.data.pagination.totalPages);
      setError(null);
    } catch (err) {
      setError('Failed to fetch deals. Please try again later.');
      console.error('Error fetching deals:', err);
    } finally {
      setLoading(false);
    }
  };

  // Update the search handler
  const handleSearch = (event) => {
    const value = event.target.value;
    setSearchInput(value);  // Update the input field immediately
    debouncedSearch(value);  // Debounce the actual search
  };

  const handleMonthChange = (event) => {
    setSelectedMonth(event.target.value);
    setPage(1);
    setStartDate(null);
    setEndDate(null);
  };

  const handleStatusChange = (event) => {
    setSelectedStatus(event.target.value);
    setPage(1);
  };

  const handleDateChange = (date, isStart) => {
    if (isStart) {
      setStartDate(date);
    } else {
      setEndDate(date);
    }
    setSelectedMonth('');
    setPage(1);
  };

  const handlePageChange = (event, value) => {
    setPage(value);
  };

  const handleViewCommitments = async (deal) => {
    try {
      const response = await api.get(`/deals/allDeals/deal-commitments/${deal._id}`);
      setSelectedDeal({
        ...deal,
        detailedCommitments: response.data.commitments
      });
      setOpenDialog(true);
      setSelectedCommitments([]);
      setSelectAll(false);
    } catch (err) {
      console.error('Error fetching commitments:', err);
    }
  };

  const handleBulkAction = async (dealId, action) => {
    if (actionInProgress) return;

    const deal = deals.find(d => d._id === dealId);
    const actionText = action === 'approve' ? 'approve' : 'decline';

    handleConfirmDialogOpen(
      `Confirm ${actionText.charAt(0).toUpperCase() + actionText.slice(1)}`,
      `Are you sure you want to ${actionText} all pending commitments for "${deal.name}"?`,
      async () => {
        try {
          setActionInProgress(true);
          setSelectedActionType(action);
          const endpoint = action === 'approve' ? 'bulk-approve-commitments' : 'bulk-decline-commitments';

          await api.post(`/deals/allDeals/${endpoint}`, {
            dealId
          });

          await fetchDeals();
        } catch (err) {
          console.error(`Error ${action}ing commitments:`, err);
        } finally {
          setActionInProgress(false);
          setSelectedActionType(null);
          setOpenDialog(false);
        }
      },
      'single-deal-action'
    );
  };

  const handleBulkDealsAction = async (action) => {
    if (selectedDeals.length === 0 || actionInProgress) return;

    const actionText = action === 'approve' ? 'approve' : 'decline';
    handleConfirmDialogOpen(
      `Confirm Bulk ${actionText.charAt(0).toUpperCase() + actionText.slice(1)}`,
      `Are you sure you want to ${actionText} all selected deals? This will affect ${selectedDeals.length} deals.`,
      async () => {
        try {
          setActionInProgress(true);
          setSelectedActionType(action);
          const endpoint = action === 'approve' ? 'bulk-approve-commitments' : 'bulk-decline-commitments';

          await Promise.all(selectedDeals.map(dealId =>
            api.post(`/deals/allDeals/${endpoint}`, {
              dealId
            })
          ));

          await fetchDeals();
          setSelectedDeals([]);
          setSelectAllDeals(false);
        } catch (err) {
          console.error(`Error processing selected deals:`, err);
        } finally {
          setActionInProgress(false);
          setSelectedActionType(null);
        }
      },
      'bulk-action'
    );
  };

  const handleDealSelect = (dealId) => {
    setSelectedDeals(prev => {
      const isSelected = prev.includes(dealId);
      if (isSelected) {
        return prev.filter(id => id !== dealId);
      } else {
        return [...prev, dealId];
      }
    });
  };

  const handleCommitmentSelect = (commitmentId) => {
    setSelectedCommitments(prev => {
      const isSelected = prev.includes(commitmentId);
      if (isSelected) {
        return prev.filter(id => id !== commitmentId);
      } else {
        return [...prev, commitmentId];
      }
    });
  };

  const handleDialogAction = async (action) => {
    if (selectedCommitments.length === 0 || actionInProgress) return;

    const actionText = action === 'approve' ? 'approve' : 'decline';
    handleConfirmDialogOpen(
      `Confirm ${actionText.charAt(0).toUpperCase() + actionText.slice(1)}`,
      `Are you sure you want to ${actionText} ${selectedCommitments.length} selected commitment(s)?`,
      async () => {
        try {
          setActionInProgress(true);
          setSelectedActionType(action);
          const status = action === 'approve' ? 'approved' : 'declined';
          const response = action === 'approve' ? 'Approved by distributor' : 'Declined by distributor';

          await Promise.all(selectedCommitments.map(commitmentId =>
            api.post(`/deals/allDeals/update-commitment-status`, {
              commitmentId,
              status,
              distributorResponse: response
            })
          ));

          await fetchDeals();
          setOpenDialog(false);
          setSelectedCommitments([]);
          setSelectAll(false);
        } catch (err) {
          console.error(`Error processing selected commitments:`, err);
        } finally {
          setActionInProgress(false);
          setSelectedActionType(null);
        }
      },
      'commitment-action'
    );
  };

  const handleDownloadClick = (event) => {
    setDownloadAnchorEl(event.currentTarget);
  };

  const handleDownloadClose = () => {
    setDownloadAnchorEl(null);
  };

  const handleExport = async (format) => {
    if (exportLoading) return;
    setExportLoading(true);
    try {
      const filteredData = deals.map(deal => ({
        'Deal Name': deal.name,
        'Category': deal.category,
        'Total Commitments': deal.totalCommitments,
        'Minimum Quantity': deal.minimumQuantity,
        'Quantity Committed': deal.totalQuantity,
        'Total Amount': `$${deal.totalAmount.toFixed(2)}`,
      }));

      if (format === 'csv') {
        await exportToCSV(filteredData);
      } else if (format === 'pdf') {
        await exportToPDF(filteredData);
      }
    } catch (error) {
      console.error('Error exporting data:', error);
    } finally {
      setExportLoading(false);
      handleDownloadClose();
    }
  };

  const exportToCSV = (data) => {
    // Create CSV headers
    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map(row =>
        headers.map(header => {
          const value = row[header];
          // Handle values that contain commas by wrapping in quotes
          return typeof value === 'string' && value.includes(',')
            ? `"${value}"`
            : value
        }).join(',')
      )
    ].join('\n');

    // Create and download the file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const fileName = `deal-commitments-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    saveAs(blob, fileName);
  };

  const exportToPDF = (data) => {
    const doc = new jsPDF();
    const fileName = `deal-commitments-${format(new Date(), 'yyyy-MM-dd')}.pdf`;

    // Add title
    doc.setFontSize(16);
    doc.text('Deal Commitments Report', 14, 15);
    doc.setFontSize(10);
    doc.text(`Generated on: ${format(new Date(), 'PPpp')}`, 14, 22);

    // Add filters information if any are active
    let yPos = 30;
    if (searchTerm || selectedMonth || selectedStatus || (startDate && endDate)) {
      doc.setFontSize(12);
      doc.text('Applied Filters:', 14, yPos);
      yPos += 7;
      doc.setFontSize(10);

      if (searchTerm) {
        doc.text(`Search: ${searchTerm}`, 14, yPos);
        yPos += 5;
      }
      if (selectedMonth) {
        const monthName = months.find(m => m.value === selectedMonth)?.label;
        doc.text(`Month: ${monthName}`, 14, yPos);
        yPos += 5;
      }
      if (startDate && endDate) {
        doc.text(`Date Range: ${format(startDate, 'PP')} - ${format(endDate, 'PP')}`, 14, yPos);
        yPos += 5;
      }
      yPos += 5;
    }

    // Add the table
    doc.autoTable({
      head: [Object.keys(data[0])],
      body: data.map(row => Object.values(row)),
      startY: yPos,
      theme: 'grid',
      styles: {
        fontSize: 8,
        cellPadding: 1,
        overflow: 'linebreak'
      },
      headStyles: {
        fillColor: [41, 128, 185],
        textColor: 255,
        fontSize: 8,
        fontStyle: 'bold'
      },
      alternateRowStyles: {
        fillColor: [245, 245, 245]
      }
    });

    doc.save(fileName);
  };

  // Add confirmation dialog handlers
  const handleConfirmDialogOpen = (title, content, action, actionType, data = null) => {
    setConfirmDialog({
      open: true,
      title,
      content,
      action,
      actionType,
      data
    });
  };

  const handleConfirmDialogClose = () => {
    setConfirmDialog({
      open: false,
      title: '',
      content: '',
      action: null,
      actionType: '',
      data: null
    });
  };

  const handleConfirmAction = async () => {
    try {
      setActionInProgress(true);
      if (confirmDialog.action) {
        await confirmDialog.action(confirmDialog.data);
      }
      handleConfirmDialogClose();
    } catch (error) {
      console.error('Error executing action:', error);
    } finally {
      setActionInProgress(false);
    }
  };

  // Add handler to clear all filters
  const handleClearFilters = () => {
    setSearchInput('');
    setSearchTerm('');
    setSelectedMonth(currentMonth.value);
    setSelectedStatus('');
    setStartDate(null);
    setEndDate(null);
    setPage(1);
  };

  const handleMenuClick = (event, dealId) => {
    setAnchorEl(event.currentTarget);
    setSelectedDealId(dealId);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleViewDeal = () => {
    handleViewCommitments(selectedDealId);
    handleMenuClose();
  };

  const handleAnalyticsDeal = () => {
    navigate(`/distributor/deal-analytics/${selectedDealId._id}`);
    handleMenuClose();
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

  const pendingCommitmentsInDialog = selectedDeal?.detailedCommitments?.filter(c => c.status === 'pending') || [];
  const dealsWithPendingCommitments = deals.filter(deal => deal.pendingCommitments > 0);

  return (
    <Box p={{ xs: 1, sm: 3 }}>
      {/* Filters Section - Make it stack on mobile */}
      <Paper sx={{ p: { xs: 1, sm: 2 }, mb: 2 }}>
        <Grid
          container
          spacing={{ xs: 1, sm: 2 }}
          direction={{ xs: 'column', sm: 'row' }}
        >
          <Grid item xs={12} sm={10}>
            <Grid
              container
              spacing={{ xs: 1, sm: 2 }}
              direction={{ xs: 'column', sm: 'row' }}
            >
              <Grid item xs={12} sm={2.7}>
                <TextField
                  fullWidth
                  label="Search Deals"
                  value={searchInput}
                  onChange={handleSearch}
                  placeholder="Type to search..."
                  size="small"
                  InputProps={{
                    endAdornment: <SearchIcon sx={{ color: 'primary.contrastText' }} />,
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={2.7}>
                <FormControl fullWidth size="small">
                  <InputLabel>Month</InputLabel>
                  <Select
                    value={selectedMonth}
                    onChange={handleMonthChange}
                    label="Month"
                    disabled={!!(startDate || endDate)}
                  >
                    <MenuItem value="">All Months</MenuItem>
                    {months.map(month => (
                      <MenuItem key={month.value} value={month.value}>
                        {month.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={2}>
                <LocalizationProvider dateAdapter={AdapterDateFns}>
                  <DatePicker
                    label="Start Date"
                    value={startDate}
                    onChange={(date) => handleDateChange(date, true)}
                    renderInput={(params) => <TextField {...params} fullWidth size="small" />}
                    disabled={!!selectedMonth}
                    sx={{
                      '& .MuiInputBase-root': {
                        height: '40px',
                        width: { xs: '350px', sm: 'auto' },
                      },
                    }}
                  />
                </LocalizationProvider>
              </Grid>
              <Grid item xs={12} sm={2}>
                <LocalizationProvider dateAdapter={AdapterDateFns}>
                  <DatePicker
                    label="End Date"
                    value={endDate}
                    onChange={(date) => handleDateChange(date, false)}
                    renderInput={(params) => <TextField {...params} fullWidth size="small" />}
                    disabled={!!selectedMonth}
                    minDate={startDate}
                    sx={{
                      '& .MuiInputBase-root': {
                        height: '40px',
                        width: { xs: '350px', sm: 'auto' },
                      },
                    }}
                  />
                </LocalizationProvider>
              </Grid>
            </Grid>
          </Grid>
          <Grid item xs={12} sm={2}>
            <Button
              variant="outlined"
              color="error"
              onClick={handleClearFilters}
              fullWidth
              size="small"
              startIcon={<CloseIcon sx={{ color: 'primary.contrastText' }} />}
            >
              Clear Filters
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Header Section - Stack elements on mobile */}
      <Box
        display="flex"
        flexDirection={{ xs: 'column', sm: 'row' }}
        justifyContent="space-between"
        alignItems={{ xs: 'stretch', sm: 'center' }}
        gap={2}
        mb={2}
      >
        <Box display="flex" flexDirection={{ xs: 'row', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'stretch', sm: 'center' }} gap={2}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography variant="h5" sx={{ fontSize: { xs: '1.2rem', sm: '1.5rem' } }}>
              Manage Deal Commitments
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
          <IconButton
            color="primary.contrastText"
            onClick={handleDownloadClick}
            disabled={!deals.length || exportLoading}
          >
            {exportLoading ? (
              <CircularProgress size={24} color="inherit" />
            ) : (<>

              <GetApp sx={{ color: 'primary.contrastText' }} />
            </>
            )}
          </IconButton>
        </Box>
        <Box
          display="flex"
          flexDirection={{ xs: 'row', sm: 'row' }}
          gap={1}
          alignItems="center"
        >
          {dealsWithPendingCommitments.length > 0 && (
            <>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={selectAllDeals}
                    onChange={(e) => setSelectAllDeals(e.target.checked)}
                    size="small"
                    color="primary.contrastText"
                  />
                }
                label={<Typography sx={{ fontSize: { xs: '0.8rem', sm: '1rem' } }}>All</Typography>}
              />
              <Box
                display="flex"
                gap={1}
                flexDirection={{ xs: 'row', sm: 'row' }}
                width={{ xs: '100%', sm: 'auto' }}
              >
                <Button
                  variant="contained"
                  color="primary.contrastText"
                  size="small"
                  fullWidth
                  startIcon={actionInProgress && selectedActionType === 'approve' ?
                    <CircularProgress size={20} color="inherit" /> :
                    <CheckIcon sx={{ color: 'primary.contrastText' }} />
                  }
                  onClick={() => handleBulkDealsAction('approve')}
                  disabled={actionInProgress || selectedDeals.length === 0}
                >
                  {actionInProgress && selectedActionType === 'approve' ?
                    'Approving...' :
                    `Approve (${selectedDeals.length})`
                  }
                </Button>
                <Button
                  variant="contained"
                  color="error"
                  size="small"
                  fullWidth
                  startIcon={actionInProgress && selectedActionType === 'decline' ?
                    <CircularProgress size={20} color="inherit" /> :
                    <CloseIcon sx={{ color: 'primary.contrastText' }} />
                  }
                  onClick={() => handleBulkDealsAction('decline')}
                  disabled={actionInProgress || selectedDeals.length === 0}
                >
                  {actionInProgress && selectedActionType === 'decline' ?
                    'Declining...' :
                    `Decline (${selectedDeals.length})`
                  }
                </Button>
              </Box>
            </>
          )}
        </Box>
      </Box>

      {/* Responsive Table */}
      <TableContainer
        component={Paper}
        sx={{
          overflowX: 'auto',
          '.MuiTable-root': {
            minWidth: { xs: '100%', sm: 650 }
          }
        }}
      >
        <Table size="small">
          <TableHead>
            <TableRow>
              <StyledTableCell padding="checkbox" sx={{ display: { xs: 'table-cell', sm: 'table-cell' } }}>
                {dealsWithPendingCommitments.length > 0 && (
                  <Checkbox
                    checked={selectAllDeals}
                    onChange={(e) => setSelectAllDeals(e.target.checked)}
                    size="small"
                    color="primary.contrastText"
                  />
                )}
              </StyledTableCell>
              <StyledTableCell>Deal Name</StyledTableCell>
              <StyledTableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>Category</StyledTableCell>
              <StyledTableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>Min Qty</StyledTableCell>
              <StyledTableCell>Total Commitments</StyledTableCell>
              <StyledTableCell>Total Amount</StyledTableCell>
              <StyledTableCell>Actions</StyledTableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {deals.length > 0 ? (
              deals.map((deal) => (
                <TableRow key={deal._id}>
                  <StyledTableCell padding="checkbox" sx={{ display: { xs: 'table-cell', sm: 'table-cell' } }}>
                    {deal.pendingCommitments > 0 && (
                      <Checkbox
                        checked={selectedDeals.includes(deal._id)}
                        onChange={() => handleDealSelect(deal._id)}
                        size="small"
                        color="primary.contrastText"
                      />
                    )}
                  </StyledTableCell>
                  <StyledTableCell sx={{ maxWidth: { xs: '100px', sm: 'none' } }}>
                    <Typography noWrap>{deal.name}</Typography>
                  </StyledTableCell>
                  <StyledTableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>{deal.category}</StyledTableCell>
                  <StyledTableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>{deal.minimumQuantity}</StyledTableCell>
                  <StyledTableCell>
                    {deal.totalQuantity !== 0 ? deal.totalQuantity : deal.totalPQuantity}
                  </StyledTableCell>
                  <StyledTableCell>
                    ${deal.totalAmount !== 0 ? deal.totalAmount.toFixed(2) : deal.totalPAmount.toFixed(2)}
                  </StyledTableCell>
                  <StyledTableCell>
                    <Box sx={{ display: 'flex', gap: 2 }}>
                      {deal.bulkAction ? (
                        <Chip
                          label={deal.bulkStatus}
                          color={deal.bulkStatus === "approved" ? "success" : "error"}
                          variant="outlined"
                        />
                      ) : (
                        <Box
                          display="flex"
                          gap={1}
                          sx={{
                            flexDirection: { xs: 'column', sm: 'row' },
                            '.MuiButton-root': {
                              minWidth: { xs: '70px', sm: 'auto' },
                              padding: { xs: '4px 8px', sm: '6px 16px' },
                            }
                          }}
                        >
                          {/* Show buttons on larger screens */}
                          <Box sx={{ display: { xs: 'none', sm: 'flex' }, gap: 1 }}>
                            <Button
                              size="small"
                              variant="contained"
                              color="primary"
                              onClick={() => handleBulkAction(deal._id, 'approve')}
                              disabled={actionInProgress || deal.pendingCommitments === 0}
                            >
                              Approve
                            </Button>
                            <Button
                              size="small"
                              variant="contained"
                              color="error"
                              onClick={() => handleBulkAction(deal._id, 'decline')}
                              disabled={actionInProgress || deal.pendingCommitments === 0}
                            >
                              Decline
                            </Button>
                          </Box>
                        </Box>
                      )}
                      {/* Show only menu on mobile */}
                      <IconButton
                        size="small"
                        onClick={(event) => handleMenuClick(event, deal)}
                        sx={{
                          display: { xs: 'flex', sm: 'none' },
                          alignSelf: 'center'
                        }}
                      >
                        <MoreVertIcon sx={{ color: 'primary.contrastText' }} />
                      </IconButton>
                      {/* Show menu on desktop too */}
                      <IconButton
                        size="small"
                        onClick={(event) => handleMenuClick(event, deal)}
                        sx={{ display: { xs: 'none', sm: 'flex' } }}
                      >
                        <MoreVertIcon sx={{ color: 'primary.contrastText' }} />
                      </IconButton>
                    </Box>
                  </StyledTableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <StyledTableCell colSpan={7} align="center">
                  <Box sx={{ py: 5, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <Typography variant="h6" color="text.secondary" gutterBottom>
                      No deals available
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {searchInput || selectedMonth || startDate || endDate ?
                        "No deals match your filter criteria" :
                        "You don't have any deals with commitments"}
                    </Typography>
                    {(searchInput || selectedMonth || startDate || endDate) && (
                      <Button
                        sx={{ mt: 2 }}
                        variant="outlined"
                        color="primary.contrastText"
                        onClick={handleClearFilters}
                      >
                        Clear Filters
                      </Button>
                    )}
                  </Box>
                </StyledTableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Pagination */}
      <Box display="flex" justifyContent="center" mt={3} sx={{ minWidth: { xs: '100%', sm: '300px' } }}>
        <Stack spacing={2}>
          <Pagination
            count={totalPages}
            page={page}
            onChange={handlePageChange}
            color="primary.contrastText"
            showFirstButton
            showLastButton
          />
        </Stack>
      </Box>

      <Dialog
        open={openDialog}
        onClose={() => setOpenDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h6">
              Commitment Details - {selectedDeal?.name}
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedDeal?.detailedCommitments && (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Member</TableCell>
                    <TableCell>Size Details</TableCell>
                    <TableCell>Total Quantity</TableCell>
                    <TableCell>Discount Tier</TableCell>
                    <TableCell>Total Price</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Date</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {selectedDeal.detailedCommitments.map((commitment) => (
                    <TableRow key={commitment._id}>
                      <TableCell>{commitment.userId.businessName || commitment.userId.name}</TableCell>
                      <TableCell>
                        {commitment.sizeCommitments && commitment.sizeCommitments.length > 0 ? (
                          <Box>
                            {commitment.sizeCommitments.map((sizeCommit, idx) => (
                              <Box key={idx} sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                                <Typography variant="body2">
                                  {sizeCommit.size}: {sizeCommit.quantity} × ${sizeCommit.pricePerUnit.toFixed(2)}
                                  {sizeCommit.appliedDiscountTier && (
                                    <Chip
                                      label={`$${sizeCommit.appliedDiscountTier.tierDiscount} at ${sizeCommit.appliedDiscountTier.tierQuantity}+`}
                                      size="small"
                                      color="success"
                                      variant="outlined"
                                      sx={{ ml: 1, height: 20, fontSize: '0.6rem' }}
                                    />
                                  )}
                                </Typography>
                              </Box>
                            ))}
                          </Box>
                        ) : (
                          "N/A"
                        )}
                      </TableCell>
                      <TableCell>{commitment.quantity ||
                        (commitment.sizeCommitments ?
                          commitment.sizeCommitments.reduce((sum, item) => sum + item.quantity, 0) :
                          0)
                      }</TableCell>
                      <TableCell>
                        {commitment.sizeCommitments && commitment.sizeCommitments.some(sc => sc.appliedDiscountTier) ? (
                          <Box>
                            {commitment.sizeCommitments
                              .filter(sc => sc.appliedDiscountTier)
                              .map((sizeCommit, idx) => (
                                <Chip
                                  key={idx}
                                  label={`${sizeCommit.size}: $${sizeCommit.appliedDiscountTier.tierDiscount} at ${sizeCommit.appliedDiscountTier.tierQuantity}+ units`}
                                  color="primary.contrastText"
                                  size="small"
                                  variant="outlined"
                                  sx={{ mb: 0.5, fontSize: '0.7rem' }}
                                />
                              ))}
                          </Box>
                        ) : commitment.appliedDiscountTier && commitment.appliedDiscountTier.tierQuantity ? (
                          <Chip
                            label={`$${commitment.appliedDiscountTier.tierDiscount} at ${commitment.appliedDiscountTier.tierQuantity}+ units`}
                            color="primary.contrastText"
                            size="small"
                            variant="outlined"
                          />
                        ) : "No discount applied"}
                      </TableCell>
                      <TableCell>${commitment.totalPrice.toFixed(2)}</TableCell>
                      <TableCell>
                        <Box
                          component="span"
                          sx={{
                            color: commitment.status === 'approved' ? 'success.main' :
                              commitment.status === 'declined' ? 'error.main' :
                                'warning.main'
                          }}
                        >
                          {commitment.status.charAt(0).toUpperCase() + commitment.status.slice(1)}
                        </Box>
                      </TableCell>
                      <TableCell>
                        {new Date(commitment.createdAt).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </DialogContent>

        <DialogActions sx={{ justifyContent: 'space-between', flexWrap: 'wrap', gap: 1 }}>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="outlined"
              color="primary.contrastText"
              onClick={() => {
                // Export only the commitments from the current dialog
                const csvData = selectedDeal.detailedCommitments.map(commitment => ({
                  'Member Name': commitment.userId.businessName || commitment.userId.name,
                  'Size Details': commitment.sizeCommitments ?
                    commitment.sizeCommitments.map(sc => `${sc.size}: ${sc.quantity}`).join(', ') : 'N/A',
                  'Total Quantity': commitment.sizeCommitments ?
                    commitment.sizeCommitments.reduce((sum, item) => sum + item.quantity, 0) : 0,
                  'Discount Applied': commitment.appliedDiscountTier && commitment.appliedDiscountTier.tierDiscount ?
                    `${commitment.appliedDiscountTier.tierDiscount}%` : 'None',
                  'Total Price': `$${commitment.totalPrice.toFixed(2)}`,
                  'Status': commitment.status.charAt(0).toUpperCase() + commitment.status.slice(1),
                  'Date': format(new Date(commitment.createdAt), 'PP')
                }));

                // Create CSV content
                const headers = Object.keys(csvData[0]);
                const csvContent = [
                  headers.join(','),
                  ...csvData.map(row =>
                    headers.map(header => {
                      const value = row[header];
                      return typeof value === 'string' && value.includes(',')
                        ? `"${value}"`
                        : value
                    }).join(',')
                  )
                ].join('\n');

                // Download the file
                const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                const fileName = `${selectedDeal.name}-commitments-${format(new Date(), 'yyyy-MM-dd')}.csv`;
                saveAs(blob, fileName);
              }}
              startIcon={<GetApp sx={{ color: 'primary.contrastText' }} />}
            >
              Export CSV
            </Button>
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="contained"
              color="error"
              onClick={() => setOpenDialog(false)}
            >
              Close
            </Button>
          </Box>
        </DialogActions>
      </Dialog>

      {/* Add Export Menu */}
      <Menu
        anchorEl={downloadAnchorEl}
        open={downloadMenuOpen}
        onClose={handleDownloadClose}
      >
        <MenuItem onClick={() => handleExport('csv')}>
          Export as CSV
        </MenuItem>
        <MenuItem onClick={() => handleExport('pdf')}>
          Export as PDF
        </MenuItem>
      </Menu>

      {/* Add Confirmation Dialog */}
      <Dialog
        open={confirmDialog.open}
        onClose={handleConfirmDialogClose}
        aria-labelledby="confirm-dialog-title"
        aria-describedby="confirm-dialog-description"
        PaperProps={{
          sx: {
            borderRadius: 2,
            p: 1,
            minWidth: '300px'
          }
        }}
      >
        <DialogTitle id="confirm-dialog-title" sx={{ fontWeight: 'bold' }}>
          {confirmDialog.title}
        </DialogTitle>
        <DialogContent>
          <Typography id="confirm-dialog-description">
            {confirmDialog.content}
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            onClick={handleConfirmDialogClose}
            color="inherit"
            variant="outlined"
            disabled={actionInProgress}
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirmAction}
            color={confirmDialog.actionType.includes('decline') ? 'error' : 'primary'}
            variant="contained"
            autoFocus
            disabled={actionInProgress}
            startIcon={
              actionInProgress && (
                <CircularProgress size={20} color="inherit" />
              )
            }
          >
            {actionInProgress
              ? confirmDialog.actionType === 'approve'
                ? ' Processing...'
                : ' Processing...'
              : 'Confirm'}
          </Button>
        </DialogActions>
      </Dialog>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        PaperProps={{
          sx: {
            width: { xs: '200px', sm: 'auto' }
          }
        }}
      >
        {/* Show Approve/Decline only on mobile */}
        <Box sx={{ display: { xs: 'block', sm: 'none' } }}>
          <MenuItem
            onClick={() => {
              handleBulkAction(selectedDealId._id, 'approve');
              handleMenuClose();
            }}
            disabled={actionInProgress || !selectedDealId?.pendingCommitments}
          >
            <ListItemIcon>
              <CheckIcon fontSize="small" color="primary.contrastText" />
            </ListItemIcon>
            Approve
          </MenuItem>
          <MenuItem
            onClick={() => {
              handleBulkAction(selectedDealId._id, 'decline');
              handleMenuClose();
            }}
            disabled={actionInProgress || !selectedDealId?.pendingCommitments}
          >
            <ListItemIcon>
              <CloseIcon fontSize="small" color="primary.contrastText" />
            </ListItemIcon>
            Decline
          </MenuItem>
          <Divider />
        </Box>
        <MenuItem onClick={handleViewDeal}>
          <ListItemIcon>
            <VisibilityIcon fontSize="small" color="primary.contrastText" />
          </ListItemIcon>
          View
        </MenuItem>
        <MenuItem onClick={handleAnalyticsDeal}>
          <ListItemIcon>
            <AnalyticsIcon fontSize="small" color="primary.contrastText" />
          </ListItemIcon>
          Analytics
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default AcceptAllCommitments;