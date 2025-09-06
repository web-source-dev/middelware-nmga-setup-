import React, { useEffect, useState } from 'react';
import api from '../../../services/api';
import { useAuth } from '../../../middleware/auth';
import {
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Box,
  Chip,
  CircularProgress,
  TablePagination,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText,
  Skeleton,
  Alert,
  Snackbar,
  TextField,
  Grid,
  InputAdornment,
  Menu, 
  MenuItem,
  IconButton,
  Collapse,
  Divider,
  Tooltip,
  FormControl,
  InputLabel,
  Select
} from '@mui/material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { 
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Pending as PendingIcon,
  Payment as PaymentIcon,
  Visibility as VisibilityIcon,
  Edit as EditIcon,
  Search as SearchIcon,
  ExpandMore,
  ExpandLess,
  FormatListBulleted,
  Discount as DiscountIcon,
  RestartAlt as RestartAltIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { saveAs } from 'file-saver';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const MemberCommitments = () => {
  const { 
    currentUserId, 
    isImpersonating, 
    isCollaborator, 
    isAdmin,
    isCollaboratorManager,
    isCommitmentManager 
  } = useAuth();

  // Check if user can perform actions (modify, cancel commitments)
  const canPerformActions = () => {
    // Main account owner (not a collaborator)
    if (!isCollaborator) return true;
    
    // Admin (with or without impersonating)
    if (isAdmin) return true;
    
    // Collaborator manager
    if (isCollaboratorManager) return true;
    
    // Commitment manager
    if (isCommitmentManager) return true;
    
    // All other collaborators cannot perform actions
    return false;
  };
  const [commitments, setCommitments] = useState([]);
  const [filteredCommitments, setFilteredCommitments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [modifyDialogOpen, setModifyDialogOpen] = useState(false);
  const [selectedCommitment, setSelectedCommitment] = useState(null);
  const [modifiedSizeCommitments, setModifiedSizeCommitments] = useState([]);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [expandedRows, setExpandedRows] = useState({});
  const [filters, setFilters] = useState({
    dealName: '',
    quantity: '',
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1), // First day of current month with time set to 00:00:00
    endDate: new Date(),
    status: 'all'
  });
  const navigate = useNavigate();

  useEffect(() => {
    fetchCommitments();
  }, []);

  useEffect(() => {
    filterCommitments();
  }, [commitments, filters]);

  const toggleExpandRow = (id) => {
    setExpandedRows(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  // Calculate total quantity from size commitments
  const calculateTotalQuantity = (sizeCommitments) => {
    if (!sizeCommitments || !Array.isArray(sizeCommitments)) return 0;
    return sizeCommitments.reduce((total, item) => total + item.quantity, 0);
  };

  const filterCommitments = () => {
    let filtered = [...commitments];

    if (filters.dealName) {
      filtered = filtered.filter(c => 
        c.dealId.name.toLowerCase().includes(filters.dealName.toLowerCase())
      );
    }

    if (filters.quantity) {
      filtered = filtered.filter(c => {
        const totalQuantity = c.modifiedByDistributor && c.modifiedSizeCommitments ? 
          calculateTotalQuantity(c.modifiedSizeCommitments) : 
          calculateTotalQuantity(c.sizeCommitments);
        return totalQuantity.toString().includes(filters.quantity);
      });
    }

    if (filters.status && filters.status !== 'all') {
      filtered = filtered.filter(c => c.status === filters.status);
    }

    if (filters.startDate && filters.endDate) {
      // Adjust the start date to have time 00:00:00 and end date to have time 23:59:59
      const adjustedStartDate = new Date(filters.startDate);
      adjustedStartDate.setHours(0, 0, 0, 0);
      
      const adjustedEndDate = new Date(filters.endDate);
      adjustedEndDate.setHours(23, 59, 59, 999);
      
      filtered = filtered.filter(c => {
        const commitmentDate = new Date(c.createdAt);
        return commitmentDate >= adjustedStartDate && 
               commitmentDate <= adjustedEndDate;
      });
    }

    setFilteredCommitments(filtered);
  };

  // Reset filters to show all commitments
  const showAllCommitments = () => {
    setFilters({
      dealName: '',
      quantity: '',
      startDate: null,
      endDate: null,
      status: 'all'
    });
    setFilteredCommitments([...commitments]);
  };

  const handleSizeQuantityChange = (index, newQuantity) => {
    const updatedSizes = [...modifiedSizeCommitments];
    updatedSizes[index] = {
      ...updatedSizes[index],
      quantity: parseInt(newQuantity) || 0,
      totalPrice: (parseInt(newQuantity) || 0) * updatedSizes[index].pricePerUnit
    };
    setModifiedSizeCommitments(updatedSizes);
  };

  const handleModifyCommitment = async () => {
    try {
      // Validate all sizes have quantities
      const invalidSizes = modifiedSizeCommitments.filter(size => !size.quantity);
      if (invalidSizes.length > 0) {
        setSnackbar({
          open: true,
          message: 'All sizes must have a quantity greater than 0',
          severity: 'error'
        });
        return;
      }
      
      const response = await api.put(
        `/member/commitments/${selectedCommitment._id}/modify-sizes`,
        { sizeCommitments: modifiedSizeCommitments }
      );

      // Update the commitment in the state
      setCommitments(commitments.map(c => 
        c._id === selectedCommitment._id ? response.data.commitment : c
      ));

      setSnackbar({
        open: true,
        message: 'Commitment modified successfully',
        severity: 'success'
      });
    } catch (error) {
      setSnackbar({
        open: true,
        message: error.response?.data?.message || 'Error modifying commitment',
        severity: 'error'
      });
    } finally {
      setModifyDialogOpen(false);
      setSelectedCommitment(null);
      setModifiedSizeCommitments([]);
    }
  };

  const fetchCommitments = async () => {
    try {
      const response = await api.get('/member/commitments');
      setCommitments(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching commitments:', error);
      setLoading(false);
      setSnackbar({
        open: true,
        message: 'Error loading commitments',
        severity: 'error'
      });
    }
  };

  const handleCancelCommitment = async () => {
    try {
      await api.post(`/member/commitments/${selectedCommitment._id}/cancel`);
      setCommitments(commitments.map(c => 
        c._id === selectedCommitment._id 
          ? { ...c, status: 'cancelled' }
          : c
      ));
      setSnackbar({
        open: true,
        message: 'Commitment cancelled successfully',
        severity: 'success'
      });
    } catch (error) {
      console.error('Error cancelling commitment:', error);
      setSnackbar({
        open: true,
        message: 'Error cancelling commitment',
        severity: 'error'
      });
    } finally {
      setCancelDialogOpen(false);
      setSelectedCommitment(null);
    }
  };

  const handleViewCommitment = (commitment) => {
    navigate(`/commitment-details/${commitment._id}`);
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'approved':
        return <CheckCircleIcon sx={{ color: 'success.main' }} />;
      case 'declined':
      case 'cancelled':
        return <CancelIcon sx={{ color: 'error.main' }} />;
      case 'pending':
        return <PendingIcon sx={{ color: 'warning.main' }} />;
      default:
        return null;
    }
  };

  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };
  const handleDownload = (format) => {
    const filteredData = filteredCommitments.map(commitment => {
      // Calculate totals properly
      const totalQuantity = commitment.modifiedByDistributor && commitment.modifiedSizeCommitments ? 
        calculateTotalQuantity(commitment.modifiedSizeCommitments) : 
        calculateTotalQuantity(commitment.sizeCommitments);
      
      const totalPrice = commitment.modifiedTotalPrice || commitment.totalPrice;
      
      const sizeDetails = (commitment.modifiedByDistributor && commitment.modifiedSizeCommitments ? 
        commitment.modifiedSizeCommitments : 
        commitment.sizeCommitments).map(size => 
          `${size.size}: ${size.quantity} units at $${Number(size.pricePerUnit).toFixed(2)}`
        ).join(', ');
      
      const discountInfo = commitment.appliedDiscountTier ? 
        `${commitment.appliedDiscountTier.tierDiscount}% discount at ${commitment.appliedDiscountTier.tierQuantity}+ units` : 
        'No discount';

      return {
        'Deal Name': commitment.dealId.name,
        'Sizes': sizeDetails,
        'Total Quantity': totalQuantity,
        'Total Price': `$${Number(totalPrice).toFixed(2)}`,
        'Status': commitment.status.charAt(0).toUpperCase() + commitment.status.slice(1),
        'Discount': discountInfo,
        'Distributor Response': commitment.distributorResponse || '-',
        'Date': new Date(commitment.createdAt).toLocaleDateString(),
      };
    });

    if (format === 'csv') {
      const headers = Object.keys(filteredData[0]);
      const csvContent = [
        headers.join(','),
        ...filteredData.map(row => headers.map(header =>
          typeof row[header] === 'string' && row[header].includes(',')
            ? `"${row[header]}"`
            : row[header]
        ).join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      saveAs(blob, 'commitments.csv');
    } else if (format === 'pdf') {
      const doc = new jsPDF();
      doc.text('Commitments Report', 14, 15);

      doc.autoTable({
        head: [['Deal Name', 'Total Quantity', 'Total Price', 'Status', 'Date']],
        body: filteredData.map(row => [
          row['Deal Name'], 
          row['Total Quantity'], 
          row['Total Price'], 
          row['Status'], 
          row['Date']
        ]),
        startY: 20,
        margin: { top: 15 },
        styles: { overflow: 'linebreak' },
        columnStyles: {
          0: { cellWidth: 50 }, // Deal Name
        },
      });

      // Add a detailed section for each commitment
      let y = doc.lastAutoTable.finalY + 10;
      doc.text('Detailed Sizes Information', 14, y);
      y += 10;

      filteredData.forEach((row, index) => {
        y += 5;
        doc.setFontSize(10);
        doc.text(`${index + 1}. ${row['Deal Name']} - ${row['Status']}`, 14, y);
        y += 5;
        doc.setFontSize(8);
        doc.text(`Sizes: ${row['Sizes']}`, 18, y);
        y += 4;
        doc.text(`Discount: ${row['Discount']}`, 18, y);
        y += 4;
        if (row['Distributor Response'] !== '-') {
          doc.text(`Distributor Response: ${row['Distributor Response']}`, 18, y);
          y += 4;
        }
        
        if (y > 270) { // Add a new page if we're near the bottom
          doc.addPage();
          y = 20;
        }
      });

      doc.save('commitments.pdf');
    }
  };

  if (loading) {
    return (
      <Box sx={{ width: '100%' }}>
        <Skeleton variant="text" sx={{ fontSize: '2rem', mb: 2 }} />
        <Paper sx={{ width: '100%', mb: 2 }}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  {['', 'Deal Name', 'Quantity', 'Total Price', 'Status', 'Payment Status', 'Date', 'Actions']
                    .map((header, index) => (
                      <TableCell key={index}>
                        <Skeleton variant="text" />
                      </TableCell>
                    ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {[...Array(5)].map((_, index) => (
                  <TableRow key={index}>
                    {[...Array(8)].map((_, cellIndex) => (
                      <TableCell key={cellIndex}>
                        <Skeleton variant="text" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      </Box>
    );
  }

  return (
    <Box sx={{ width: '100%' }}>
      <Typography variant="h4" gutterBottom>
        My Commitments
      </Typography>

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={2.4}>
            <TextField
              fullWidth
              label="Deal Name"
              value={filters.dealName}
              onChange={(e) => setFilters({ ...filters, dealName: e.target.value })}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid item xs={12} sm={2.4}>
            <TextField
              fullWidth
              label="Quantity"
              type="number"
              value={filters.quantity}
              onChange={(e) => setFilters({ ...filters, quantity: e.target.value })}
            />
          </Grid>
          <Grid item xs={12} sm={2.4}>
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                value={filters.status}
                label="Status"
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              >
                <MenuItem value="all">All Statuses</MenuItem>
                <MenuItem value="pending">Pending</MenuItem>
                <MenuItem value="approved">Approved</MenuItem>
                <MenuItem value="declined">Declined</MenuItem>
                <MenuItem value="cancelled">Cancelled</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={2.4}>
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <DatePicker
                label="Start Date"
                value={filters.startDate}
                onChange={(date) => setFilters({ ...filters, startDate: date })}
                renderInput={(params) => <TextField {...params} fullWidth />}
              />
            </LocalizationProvider>
          </Grid>
          <Grid item xs={12} sm={2.4}>
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <DatePicker
                label="End Date"
                value={filters.endDate}
                onChange={(date) => setFilters({ ...filters, endDate: date })}
                renderInput={(params) => <TextField {...params} fullWidth />}
              />
            </LocalizationProvider>
          </Grid>
        </Grid>
      </Paper>

      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2, mr: 2 }}>
      <Button 
        variant="outlined" 
        color="primary.contrastText" 
        onClick={handleClick}
        disabled={!canPerformActions()}
      >
        Download
      </Button>
      <Menu anchorEl={anchorEl} open={open} onClose={handleClose}>
        <MenuItem onClick={() => { handleDownload('csv'); handleClose(); }}>
          Download CSV
        </MenuItem>
        <MenuItem onClick={() => { handleDownload('pdf'); handleClose(); }}>
          Download PDF
        </MenuItem>
      </Menu>
    </Box>

      <Paper sx={{ width: '100%', mb: 2 }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell width="40px"></TableCell>
                <TableCell>Deal Name</TableCell>
                <TableCell align="right">Total Quantity</TableCell>
                <TableCell align="right">Total Price</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Distributor Response</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredCommitments.length > 0 ? (
                filteredCommitments
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((commitment) => {
                  // Calculate totals
                  const totalQuantity = commitment.modifiedByDistributor && commitment.modifiedSizeCommitments ? 
                    calculateTotalQuantity(commitment.modifiedSizeCommitments) : 
                    calculateTotalQuantity(commitment.sizeCommitments);
                  
                  const originalQuantity = calculateTotalQuantity(commitment.sizeCommitments);
                  const totalPrice = commitment.modifiedTotalPrice || commitment.totalPrice;

                  return (
                    <React.Fragment key={commitment._id}>
                      <TableRow hover>
                        <TableCell>
                          <IconButton 
                            size="small" 
                            onClick={() => toggleExpandRow(commitment._id)}
                            aria-label="expand row"
                          >
                            {expandedRows[commitment._id] ? <ExpandLess /> : <ExpandMore />}
                          </IconButton>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" fontWeight="medium">
                            {commitment.dealId.name}
                          </Typography>
                          {commitment.sizeCommitments && commitment.sizeCommitments.some(sc => sc.appliedDiscountTier) ? (
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
                              {commitment.sizeCommitments
                                .filter(sc => sc.appliedDiscountTier)
                                .map((sc, idx) => (
                                  <Tooltip 
                                    key={idx} 
                                    title={`${sc.size}: $${sc.appliedDiscountTier.tierDiscount} at ${sc.appliedDiscountTier.tierQuantity}+ units`}
                                  >
                                    <Chip 
                                      icon={<DiscountIcon fontSize="small" />} 
                                      label={`${sc.size}: $${sc.appliedDiscountTier.tierDiscount}`} 
                                      size="small" 
                                      color="success" 
                                      variant="outlined"
                                      sx={{ '& .MuiChip-label': { fontSize: '0.7rem' } }}
                                    />
                                  </Tooltip>
                                ))}
                            </Box>
                          ) : commitment.appliedDiscountTier && (
                            <Tooltip title={`${commitment.appliedDiscountTier.tierDiscount}% discount activated at ${commitment.appliedDiscountTier.tierQuantity}+ units`}>
                              <Chip 
                                icon={<DiscountIcon fontSize="small" />} 
                                label={`${commitment.appliedDiscountTier.tierDiscount}% off`} 
                                size="small" 
                                color="success" 
                                variant="outlined"
                                sx={{ mt: 0.5 }}
                              />
                            </Tooltip>
                          )}
                          {/* Add Mix & Match label if commitment has multiple sizes */}
                          {commitment.sizeCommitments && commitment.sizeCommitments.length > 1 && (
                            <Chip 
                              label="Mix & Match" 
                              size="small"
                              sx={{ 
                                mt: 0.5, 
                                ml: 0.5,
                                fontWeight: 'bold',
                                background: 'linear-gradient(45deg, #FF8E53 30%, #FE6B8B 90%)',
                                color: 'white'
                              }}
                            />
                          )}
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="body2" fontWeight="medium">
                            {totalQuantity}
                          </Typography>
                          {commitment.modifiedByDistributor && (
                            <Typography variant="caption" color="text.secondary" sx={{ 
                              display: 'block',
                              textDecoration: 'line-through'
                            }}>
                              {originalQuantity}
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="body2" fontWeight="medium">
                            ${Number(totalPrice).toFixed(2)}
                          </Typography>
                          {commitment.modifiedTotalPrice && (
                            <Typography variant="caption" color="text.secondary" sx={{ 
                              display: 'block',
                              textDecoration: 'line-through'
                            }}>
                              ${Number(commitment.totalPrice).toFixed(2)}
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell>
                          <Box display="flex" alignItems="center" gap={1}>
                            {getStatusIcon(commitment.status)}
                            {commitment.status.charAt(0).toUpperCase() + commitment.status.slice(1)}
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Typography 
                            variant="body2" 
                            sx={{ 
                              maxWidth: 200, 
                              overflow: 'hidden', 
                              textOverflow: 'ellipsis', 
                              whiteSpace: 'nowrap'
                            }}
                          >
                            {commitment.distributorResponse || '-'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          {new Date(commitment.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <Box display="flex" gap={1}>
                          {commitment.status === 'pending' && (
                            <>
                              <Button
                                variant="outlined"
                                color="primary.contrastText"
                                size="small"
                                onClick={() => {
                                  setSelectedCommitment(commitment);
                                  // Create a deep copy of size commitments for editing
                                  setModifiedSizeCommitments([...commitment.sizeCommitments]);
                                  setModifyDialogOpen(true);
                                }}
                                disabled={!canPerformActions()}
                                startIcon={<EditIcon color="primary.contrastText" />}
                              >
                                Modify
                              </Button>
                              <Button
                                variant="outlined"
                                color="error"
                                size="small"
                                onClick={() => {
                                  setSelectedCommitment(commitment);
                                  setCancelDialogOpen(true);
                                }}
                                disabled={!canPerformActions()}
                                startIcon={<CancelIcon color="error" />}
                              >
                                Cancel
                              </Button>
                            </>
                          )}
                            <Button
                              variant="outlined"
                              color="primary.contrastText"
                              size="small"
                              onClick={() => handleViewCommitment(commitment)}
                              startIcon={<VisibilityIcon color="primary.contrastText" />}
                            >
                              View
                            </Button>
                          </Box>
                        </TableCell>
                      </TableRow>

                      {/* Expandable row for size details */}
                      <TableRow>
                        <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={8}>
                          <Collapse in={expandedRows[commitment._id]} timeout="auto" unmountOnExit>
                            <Box sx={{ margin: 2 }}>
                              <Typography variant="subtitle2" gutterBottom component="div" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <FormatListBulleted fontSize="small" />
                                Size Commitments
                              </Typography>
                              <Table size="small">
                                <TableHead>
                                  <TableRow>
                                    <TableCell>Size</TableCell>
                                    <TableCell align="right">Quantity</TableCell>
                                    <TableCell align="right">Price/Unit</TableCell>
                                    <TableCell align="right">Discount Tier</TableCell>
                                    <TableCell align="right">Subtotal</TableCell>
                                  </TableRow>
                                </TableHead>
                                <TableBody>
                                  {(commitment.modifiedByDistributor && commitment.modifiedSizeCommitments 
                                    ? commitment.modifiedSizeCommitments 
                                    : commitment.sizeCommitments
                                  ).map((sizeCommit, idx) => (
                                    <TableRow key={idx}>
                                      <TableCell>{sizeCommit.size}</TableCell>
                                      <TableCell align="right">{sizeCommit.quantity}</TableCell>
                                      <TableCell align="right">${Number(sizeCommit.pricePerUnit).toFixed(2)}</TableCell>
                                      <TableCell align="right">
                                        {sizeCommit.appliedDiscountTier ? (
                                          <Chip 
                                            label={`$${sizeCommit.appliedDiscountTier.tierDiscount} at ${sizeCommit.appliedDiscountTier.tierQuantity}+`}
                                            size="small" 
                                            color="success"
                                            variant="outlined"
                                          />
                                        ) : (
                                          <Typography variant="caption" color="text.secondary">None</Typography>
                                        )}
                                      </TableCell>
                                      <TableCell align="right">${(sizeCommit.quantity * sizeCommit.pricePerUnit).toFixed(2)}</TableCell>
                                    </TableRow>
                                  ))}
                                  
                                  {/* Show a footer row with totals */}
                                  <TableRow sx={{ bgcolor: 'rgba(0, 0, 0, 0.04)' }}>
                                    <TableCell><strong>Total</strong></TableCell>
                                    <TableCell align="right"><strong>{totalQuantity}</strong></TableCell>
                                    <TableCell></TableCell>
                                    <TableCell></TableCell>
                                    <TableCell align="right"><strong>${Number(totalPrice).toFixed(2)}</strong></TableCell>
                                  </TableRow>
                                </TableBody>
                              </Table>
                              
                              {/* Show original size commitments if modified */}
                              {commitment.modifiedByDistributor && commitment.modifiedSizeCommitments && (
                                <Box sx={{ mt: 2 }}>
                                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                    Original Commitments
                                  </Typography>
                                  <Table size="small" aria-label="original size commitments">
                                    <TableHead>
                                      <TableRow>
                                        <TableCell>Size</TableCell>
                                        <TableCell align="right">Quantity</TableCell>
                                        <TableCell align="right">Price Per Unit ($)</TableCell>
                                        <TableCell align="right">Total ($)</TableCell>
                                      </TableRow>
                                    </TableHead>
                                    <TableBody>
                                      {commitment.sizeCommitments?.map((size, index) => (
                                        <TableRow key={index}>
                                          <TableCell component="th" scope="row">
                                            {size.size}
                                          </TableCell>
                                          <TableCell align="right">{size.quantity}</TableCell>
                                          <TableCell align="right">${Number(size.pricePerUnit).toFixed(2)}</TableCell>
                                          <TableCell align="right">${Number(size.totalPrice || (size.quantity * size.pricePerUnit)).toFixed(2)}</TableCell>
                                        </TableRow>
                                      ))}
                                      
                                      {/* Show a footer row with totals */}
                                      <TableRow sx={{ bgcolor: 'rgba(0, 0, 0, 0.04)' }}>
                                        <TableCell><strong>Total</strong></TableCell>
                                        <TableCell align="right"><strong>{originalQuantity}</strong></TableCell>
                                        <TableCell></TableCell>
                                        <TableCell align="right"><strong>${Number(commitment.totalPrice).toFixed(2)}</strong></TableCell>
                                      </TableRow>
                                    </TableBody>
                                  </Table>
                                </Box>
                              )}
                            </Box>
                          </Collapse>
                        </TableCell>
                      </TableRow>
                    </React.Fragment>
                  );
                  })
              ) : (
                <TableRow>
                  <TableCell colSpan={8} align="center">
                    <Box sx={{ py: 3, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                      <Typography variant="body1">No commitments found with the current filters.</Typography>
                      <Button 
                        variant="contained" 
                        color="primary" 
                        startIcon={<RestartAltIcon />}
                        onClick={showAllCommitments}
                        disabled={!canPerformActions()}
                      >
                        Show All Commitments
                      </Button>
                    </Box>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={filteredCommitments.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Paper>

      {/* Cancel Confirmation Dialog */}
      <Dialog
        open={cancelDialogOpen}
        onClose={() => setCancelDialogOpen(false)}
      >
        <DialogTitle>Cancel Commitment</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to cancel this commitment? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCancelDialogOpen(false)}>No, Keep It</Button>
          <Button 
            onClick={handleCancelCommitment} 
            color="error" 
            variant="contained"
            disabled={!canPerformActions()}
          >
            Yes, Cancel It
          </Button>
        </DialogActions>
      </Dialog>

      {/* Modify Sizes Dialog */}
      <Dialog
        open={modifyDialogOpen}
        onClose={() => setModifyDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Modify Size Quantities</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 3 }}>
            Please adjust the quantity for each size in your commitment.
          </DialogContentText>
          
          <TableContainer component={Paper} variant="outlined" sx={{ mb: 3 }}>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: 'action.hover' }}>
                  <TableCell>Size</TableCell>
                  <TableCell align="right">Price Per Unit ($)</TableCell>
                  <TableCell align="right">Original Quantity</TableCell>
                  <TableCell align="right">New Quantity</TableCell>
                  <TableCell align="right">Total Price ($)</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {modifiedSizeCommitments.map((size, index) => (
                  <TableRow key={index}>
                    <TableCell>{size.size}</TableCell>
                    <TableCell align="right">{Number(size.pricePerUnit).toFixed(2)}</TableCell>
                    <TableCell align="right">{size.quantity}</TableCell>
                    <TableCell align="right">
                      <TextField
                        type="number"
                        size="small"
                        value={size.quantity}
                        onChange={(e) => handleSizeQuantityChange(index, e.target.value)}
                        inputProps={{ min: 0 }}
                        sx={{ width: 80 }}
                      />
                    </TableCell>
                    <TableCell align="right">
                      {Number((size.quantity || 0) * size.pricePerUnit).toFixed(2)}
                    </TableCell>
                  </TableRow>
                ))}
                <TableRow sx={{ bgcolor: 'action.hover' }}>
                  <TableCell colSpan={3}><strong>Total</strong></TableCell>
                  <TableCell align="right"><strong>{calculateTotalQuantity(modifiedSizeCommitments)}</strong></TableCell>
                  <TableCell align="right">
                    <strong>
                      ${modifiedSizeCommitments.reduce((sum, size) => 
                          sum + ((size.quantity || 0) * size.pricePerUnit), 0).toFixed(2)}
                    </strong>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
          
          {selectedCommitment?.appliedDiscountTier && (
            <Alert severity="info" sx={{ mb: 2 }}>
              <Typography variant="body2">
                This commitment has a discount of {selectedCommitment.appliedDiscountTier.tierDiscount}% for orders of {selectedCommitment.appliedDiscountTier.tierQuantity}+ units.
                {calculateTotalQuantity(modifiedSizeCommitments) < selectedCommitment.appliedDiscountTier.tierQuantity && (
                  <strong> Your modified quantity may lose this discount.</strong>
                )}
              </Typography>
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setModifyDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={handleModifyCommitment} 
            color="primary" 
            variant="contained" 
            disabled={calculateTotalQuantity(modifiedSizeCommitments) === 0 || !canPerformActions()}
          >
            Update Commitment
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
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

export default MemberCommitments;