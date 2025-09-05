import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../../services/api';
import { useAuth } from '../../../middleware/auth';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  IconButton,
  CircularProgress,
  Alert,
  Grid,
  Card,
  CardContent,
  Avatar,
  Divider,
  Tooltip,
  Pagination,
  Stack,
  InputAdornment,
  Badge,
  styled,
  Menu,
} from '@mui/material';
import {
  Search as SearchIcon,
  FilterList as FilterListIcon,
  Download as DownloadIcon,
  Visibility as VisibilityIcon,
  Business as BusinessIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  LocationOn as LocationIcon,
  Person as PersonIcon,
  ShoppingCart as ShoppingCartIcon,
  AttachMoney as MoneyIcon,
  CalendarToday as CalendarIcon,
  GetApp as GetAppIcon,
  Store as StoreIcon,
  Clear as ClearIcon,
} from '@mui/icons-material';
import { format } from 'date-fns';
import { saveAs } from 'file-saver';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

// Styled components
const StyledCard = styled(Card)(({ theme }) => ({
  borderRadius: 12,
  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
  transition: 'all 0.3s ease',
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
  }
}));

const StatCard = ({ title, value, icon, color, subtitle }) => (
  <StyledCard>
    <CardContent>
      <Box display="flex" justifyContent="space-between" alignItems="center">
        <Box>
          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
            {title}
          </Typography>
          <Typography variant="h4" sx={{ color, fontWeight: 600 }}>
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
            borderRadius: '12px',
            padding: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          {React.cloneElement(icon, { sx: { fontSize: 32, color } })}
        </Box>
      </Box>
    </CardContent>
  </StyledCard>
);

const MemberCommitments = () => {
  const { currentUserId, isImpersonating } = useAuth();
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    totalMembers: 0,
    totalCommitments: 0,
    totalRevenue: 0,
    activeSuppliers: 0
  });
  
  // Filters and search
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [supplierFilter, setSupplierFilter] = useState('');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [limit] = useState(10);
  
  // Export and download
  const [exportLoading, setExportLoading] = useState(false);
  const [downloadAnchorEl, setDownloadAnchorEl] = useState(null);
  const downloadMenuOpen = Boolean(downloadAnchorEl);
  
  const distributorId = currentUserId;
  const navigate = useNavigate();

  console.log('Distributor ID:', distributorId);

  // Fetch members with commitments
  const fetchMembers = useCallback(async () => {
    try {
      setLoading(true);
      let url = `/deals/members-with-commitments?page=${page}&limit=${limit}`;

      if (searchTerm) {
        url += `&search=${encodeURIComponent(searchTerm)}`;
      }
      if (statusFilter) {
        url += `&status=${statusFilter}`;
      }
      if (supplierFilter) {
        url += `&supplier=${supplierFilter}`;
      }
              if (dateRange.start && dateRange.end) {
          // Validate dates before formatting
          const startDate = new Date(dateRange.start);
          const endDate = new Date(dateRange.end);
          
          if (!isNaN(startDate.getTime()) && !isNaN(endDate.getTime())) {
            url += `&startDate=${format(startDate, 'yyyy-MM-dd')}&endDate=${format(endDate, 'yyyy-MM-dd')}`;
          }
        }

      console.log('Fetching members with params:', { page, limit, search: searchTerm, status: statusFilter, supplier: supplierFilter, startDate: dateRange.start, endDate: dateRange.end });
      const response = await api.get(url, { 
        params: { 
          page, 
          limit, 
          search: searchTerm, 
          status: statusFilter, 
          supplier: supplierFilter, 
          startDate: dateRange.start, 
          endDate: dateRange.end 
        } 
      });
      console.log('Response received:', response.data);
      
      setMembers(response.data.members);
      setStats(response.data.stats);
      setTotalPages(response.data.pagination.totalPages);
      setError(null);
    } catch (err) {
      setError('Failed to fetch members. Please try again later.');
      console.error('Error fetching members:', err);
    } finally {
      setLoading(false);
    }
  }, [distributorId, page, searchTerm, statusFilter, supplierFilter, dateRange, limit]);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  // Handle search
  const handleSearch = (event) => {
    setSearchTerm(event.target.value);
    setPage(1);
  };

  // Handle filters
  const handleFilterChange = (filterType) => (event) => {
    const value = event.target.value;
    switch (filterType) {
      case 'status':
        setStatusFilter(value);
        break;
      case 'supplier':
        setSupplierFilter(value);
        break;
      default:
        break;
    }
    setPage(1);
  };

  // Handle date range
  const handleDateChange = (dateType) => (event) => {
    const value = event.target.value;
    // Validate date before setting
    if (value) {
      const dateObj = new Date(value);
      if (isNaN(dateObj.getTime())) {
        console.warn('Invalid date:', value);
        return;
      }
    }
    
    setDateRange(prev => ({
      ...prev,
      [dateType]: value
    }));
    setPage(1);
  };

  // Clear all filters
  const handleClearFilters = () => {
    setSearchTerm('');
    setStatusFilter('');
    setSupplierFilter('');
    setDateRange({ start: '', end: '' });
    setPage(1);
  };

  // Handle pagination
  const handlePageChange = (event, value) => {
    setPage(value);
  };

  // View member details
  const handleViewMember = (member) => {
    navigate(`/dashboard/distributor/Stores/Contacts/${member._id}`);
  };

  // Export functionality
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
      const exportData = members.map(member => ({
        'Member Name': member.businessName || member.name,
        'Email': member.email,
        'Phone': member.phone || 'N/A',
        'Address': member.address || 'N/A',
        'Total Commitments': member.totalCommitments,
        'Total Amount': `$${member.totalAmount.toFixed(2)}`,
        'Assigned Supplier': member.assignedSupplier?.name || 'Not Assigned',
        'Last Commitment': member.lastCommitmentDate ? format(new Date(member.lastCommitmentDate), 'PP') : 'N/A',
        'Status': member.status
      }));

      if (format === 'csv') {
        await exportToCSV(exportData);
      } else if (format === 'pdf') {
        await exportToPDF(exportData);
      }
    } catch (error) {
      console.error('Error exporting data:', error);
    } finally {
      setExportLoading(false);
      handleDownloadClose();
    }
  };

  const exportToCSV = (data) => {
    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map(row =>
        headers.map(header => {
          const value = row[header];
          return typeof value === 'string' && value.includes(',')
            ? `"${value}"`
            : value
        }).join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const fileName = `member-commitments-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    saveAs(blob, fileName);
  };

  const exportToPDF = (data) => {
    const doc = new jsPDF();
    const fileName = `member-commitments-${format(new Date(), 'yyyy-MM-dd')}.pdf`;

    doc.setFontSize(16);
    doc.text('Member Commitments Report', 14, 15);
    doc.setFontSize(10);
    doc.text(`Generated on: ${format(new Date(), 'PPpp')}`, 14, 22);

    let yPos = 30;
    if (searchTerm || statusFilter || supplierFilter || (dateRange.start && dateRange.end)) {
      doc.setFontSize(12);
      doc.text('Applied Filters:', 14, yPos);
      yPos += 7;
      doc.setFontSize(10);

      if (searchTerm) {
        doc.text(`Search: ${searchTerm}`, 14, yPos);
        yPos += 5;
      }
      if (statusFilter) {
        doc.text(`Status: ${statusFilter}`, 14, yPos);
        yPos += 5;
      }
      if (supplierFilter) {
        doc.text(`Supplier: ${supplierFilter}`, 14, yPos);
        yPos += 5;
      }
      if (dateRange.start && dateRange.end) {
        doc.text(`Date Range: ${format(new Date(dateRange.start), 'PP')} - ${format(new Date(dateRange.end), 'PP')}`, 14, yPos);
        yPos += 5;
      }
      yPos += 5;
    }

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

  // Get status color
  const getStatusColor = (status) => {
    const statusColors = {
      active: 'success',
      inactive: 'error',
      pending: 'warning',
      approved: 'success',
      declined: 'error',
      cancelled: 'default'
    };
    return statusColors[status.toLowerCase()] || 'default';
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

  return (
    <Box p={3}>
      {/* Header Section */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography variant="h4" fontWeight={600} color="primary.contrastText">
            Member Commitments
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
        <Box display="flex" gap={1}>
          <Button
            variant="outlined"
            startIcon={<ClearIcon sx={{ color: 'primary.contrastText' }} />}
            onClick={handleClearFilters}
            size="small"
            sx={{ color: 'primary.contrastText',borderColor: 'primary.contrastText' }}
          >
            Clear Filters
          </Button>
          <Button
            variant="outlined"
            startIcon={exportLoading ? <CircularProgress size={20} /> : <GetAppIcon sx={{ color: 'primary.contrastText' }} />}
            onClick={handleDownloadClick}
            disabled={exportLoading || members.length === 0}
            size="small"
            sx={{ color: 'primary.contrastText',backgroundColor: 'primary.main' }}
          >
            Export
          </Button>
        </Box>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Members"
            value={stats.totalMembers}
            icon={<PersonIcon />}
            color="#4361ee"
            subtitle="With commitments"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Commitments"
            value={stats.totalCommitments}
            icon={<ShoppingCartIcon />}
            color="#2ec4b6"
            subtitle="Across all deals"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Revenue"
            value={`$${stats.totalRevenue.toLocaleString()}`}
            icon={<MoneyIcon />}
            color="#ff9f1c"
            subtitle="From commitments"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Active Suppliers"
            value={stats.activeSuppliers}
            icon={<StoreIcon />}
            color="#7209b7"
            subtitle="Assigned to members"
          />
        </Grid>
      </Grid>

      {/* Filters Section */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              label="Search Members"
              value={searchTerm}
              onChange={handleSearch}
              placeholder="Search by name, email, business..."
              size="small"
              InputProps={{
                startAdornment: <SearchIcon sx={{ color: 'text.secondary', mr: 1 }} />,
              }}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Status</InputLabel>
              <Select
                value={statusFilter}
                onChange={handleFilterChange('status')}
                label="Status"
              >
                <MenuItem value="">All Status</MenuItem>
                <MenuItem value="active">Active</MenuItem>
                <MenuItem value="inactive">Inactive</MenuItem>
                <MenuItem value="pending">Pending</MenuItem>
                <MenuItem value="approved">Approved</MenuItem>
                <MenuItem value="declined">Declined</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Supplier</InputLabel>
              <Select
                value={supplierFilter}
                onChange={handleFilterChange('supplier')}
                label="Supplier"
              >
                <MenuItem value="">All Suppliers</MenuItem>
                <MenuItem value="assigned">Assigned</MenuItem>
                <MenuItem value="unassigned">Unassigned</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <TextField
              fullWidth
              label="Start Date"
              type="date"
              value={dateRange.start}
              onChange={handleDateChange('start')}
              size="small"
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <TextField
              fullWidth
              label="End Date"
              type="date"
              value={dateRange.end}
              onChange={handleDateChange('end')}
              size="small"
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
        </Grid>
      </Paper>

      {/* Members Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Member</TableCell>
              <TableCell>Contact Info</TableCell>
              <TableCell>Total Commitments</TableCell>
              <TableCell>Total Amount</TableCell>
              <TableCell>Assigned Supplier</TableCell>
              <TableCell>Last Commitment</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {members.length > 0 ? (
              members.map((member) => (
                <TableRow key={member._id} hover>
                  <TableCell>
                    <Box display="flex" alignItems="center" gap={2}>
                      <Avatar sx={{ bgcolor: 'primary.main',color: 'primary.contrastText' }}>
                        {member.businessName ? member.businessName.charAt(0) : member.name.charAt(0)}
                      </Avatar>
                      <Box>
                        <Typography variant="subtitle2" fontWeight={600}>
                          {member.businessName || member.name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {member.contactPerson || 'No contact person'}
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box>
                      <Typography variant="body2" display="flex" alignItems="center" gap={1}>
                        <EmailIcon fontSize="small" sx={{ color: 'primary.contrastText' }} />
                        {member.email}
                      </Typography>
                      {member.phone && (
                        <Typography variant="body2" display="flex" alignItems="center" gap={1}>
                          <PhoneIcon fontSize="small" sx={{ color: 'primary.contrastText' }} />
                          {member.phone}
                        </Typography>
                      )}
                      {member.address && (
                        <Typography variant="body2" display="flex" alignItems="center" gap={1}>
                          <LocationIcon fontSize="small" sx={{ color: 'primary.contrastText' }} />
                          {member.address}
                        </Typography>
                      )}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box display="flex" alignItems="center" gap={1}>
                      <ShoppingCartIcon fontSize="small" color="primary" sx={{ color: 'primary.contrastText' }} />
                      <Typography variant="body2" fontWeight={600}>
                        {member.totalCommitments}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box display="flex" alignItems="center" gap={1}>
                      <MoneyIcon fontSize="small" color="success" sx={{ color: 'primary.contrastText' }} />
                      <Typography variant="body2" fontWeight={600} color="success.main">
                        ${member.totalAmount.toFixed(2)}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    {member.assignedSupplier ? (
                      <Chip
                        label={member.assignedSupplier.name}
                        color="secondary"
                        variant="outlined"
                        size="small"
                        icon={<StoreIcon sx={{ color: 'primary.contrastText' }} />}
                      />
                    ) : (
                      <Chip
                        label="Not Assigned"
                        color="default"
                        variant="outlined"
                        size="small"
                      />
                    )}
                  </TableCell>
                  <TableCell>
                    {member.lastCommitmentDate ? (
                      <Box display="flex" alignItems="center" gap={1}>
                        <CalendarIcon fontSize="small" color="text.secondary" sx={{ color: 'primary.contrastText' }} />
                        <Typography variant="body2">
                          {format(new Date(member.lastCommitmentDate), 'PP')}
                        </Typography>
                      </Box>
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        No commitments
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={member.status}
                      color={getStatusColor(member.status)}
                      size="small"
                      sx={{ color: 'primary.contrastText' }}
                    />
                  </TableCell>
                  <TableCell>
                    <Tooltip title="View Details">
                      <IconButton
                        size="small"
                        onClick={() => handleViewMember(member)}
                        color="primary"
                      >
                        <VisibilityIcon sx={{ color: 'primary.contrastText' }} />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                  <Typography variant="h6" color="text.secondary" gutterBottom>
                    No members found
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {searchTerm || statusFilter || supplierFilter || (dateRange.start && dateRange.end) ?
                      "No members match your filter criteria" :
                      "No members have made commitments on your deals yet"
                    }
                  </Typography>
                  {(searchTerm || statusFilter || supplierFilter || (dateRange.start && dateRange.end)) && (
                    <Button
                      variant="outlined"
                      onClick={handleClearFilters}
                      sx={{ color: 'primary.contrastText',borderColor: 'primary.contrastText',backgroundColor: 'primary.main' }}
                    >
                      Clear Filters
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Pagination */}
      {totalPages > 1 && (
        <Box display="flex" justifyContent="center" mt={3}>
          <Pagination
            count={totalPages}
            page={page}
            onChange={handlePageChange}
            color="primary"
            showFirstButton
            showLastButton
          />
        </Box>
      )}



      {/* Export Menu */}
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
    </Box>
  );
};

export default MemberCommitments; 