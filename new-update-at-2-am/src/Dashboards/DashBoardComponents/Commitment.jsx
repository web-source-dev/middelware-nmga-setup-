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
  Pagination,
  TablePagination,
  Grid,
  InputLabel,
  MenuItem,
  Menu,
  Card,
  CardContent,
  Stack,
} from '@mui/material';
import axios from 'axios';
import Toast from '../../Components/Toast/Toast';
import { useParams } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import useMediaQuery from '@mui/material/useMediaQuery';
import { FilterSection, FilterItem } from './FilterSection';
import { FilterTextField, FilterSelect, FilterFormControl } from './FilterStyles';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const Commitments = () => {
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
    const currentUserId = localStorage.getItem('user_id');
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const isMobile = useMediaQuery('(max-width:600px)');
    const [filter, setFilter] = useState({ status: '', search: '' });
    const [anchorEl, setAnchorEl] = useState(null);
    const open = Boolean(anchorEl);

    // Ensure user is authenticated
    useEffect(() => {
      if (!currentUserId) {
        navigate('/login');
        return;
      }
    }, [currentUserId, userRole, navigate]);

    // Add useEffect for price calculation
    useEffect(() => {
      if (selectedCommitment && modifiedQuantity) {
        const calculatedPrice = selectedCommitment.dealId.discountPrice * Number(modifiedQuantity);
        setModifiedPrice(calculatedPrice);
      }
    }, [modifiedQuantity, selectedCommitment]);

    const showToast = (message, severity = 'success') => {
      setToast({ open: true, message, severity });
    };

    const [commitmentRole,setCommitmentRole] = useState('');
    const fetchCommitments = async () => {
      try {
        let response;
        
        // If viewing from profile management (userId is provided)
        if (userId) {
          // Check if the user is a distributor
          const userResponse = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/auth/v2/profile/${userId}`);
          const userDetails = userResponse.data;

          setCommitmentRole(userDetails.role);

          if (userDetails.role === 'distributor') {
            response = await axios.get(
              `${process.env.REACT_APP_BACKEND_URL}/deals/commit/distributor-commitments/${userId}`
            );
          } else {
            response = await axios.get(
              `${process.env.REACT_APP_BACKEND_URL}/deals/commit/fetch/${userId}`
            );
          }
        }
        // Normal dashboard view
        else {
          if (userRole !== 'member') {
            response = await axios.get(
              `${process.env.REACT_APP_BACKEND_URL}/deals/commit/distributor-commitments/${currentUserId}`
            );
          } else {
            response = await axios.get(
              `${process.env.REACT_APP_BACKEND_URL}/deals/commit/fetch/${currentUserId}`
            );
          }
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
    }, [userId, userRole]);

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

    const handleChangePage = (event, newPage) => {
      setPage(newPage);
    };

    const handleChangeRowsPerPage = (event) => {
      setRowsPerPage(parseInt(event.target.value, 10));
      setPage(0);
    };

    const paginatedCommitments = commitments.slice(
      page * rowsPerPage,
      page * rowsPerPage + rowsPerPage
    );

    const handleFilterChange = (event) => {
      const { name, value } = event.target;
      setFilter({ ...filter, [name]: value });
    };

    const handleClick = (event) => {
      setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
      setAnchorEl(null);
    };

    const downloadPDF = () => {
      const doc = new jsPDF();
      
      const headers = userRole !== 'member' 
        ? ['Deal Name', 'Member Name', 'Member Email', 'Quantity', 'Total Price', 'Status', 'Created At']
        : ['Deal Name', 'Quantity', 'Total Price', 'Status', 'Created At'];

      const data = commitments.map(commitment => {
        return userRole !== 'member' 
          ? [
              commitment.dealId?.name || 'N/A',
              commitment.userId?.name || 'N/A',
              commitment.userId?.email || 'N/A',
              commitment.modifiedQuantity || commitment.quantity,
              commitment.modifiedTotalPrice || commitment.totalPrice,
              commitment.status,
              new Date(commitment.createdAt).toLocaleDateString()
            ]
          : [
              commitment.dealId?.name || 'N/A',
              commitment.modifiedQuantity || commitment.quantity,
              commitment.modifiedTotalPrice || commitment.totalPrice,
              commitment.status,
              new Date(commitment.createdAt).toLocaleDateString()
            ];
      });

      doc.autoTable({
        head: [headers],
        body: data,
        theme: 'grid',
        styles: { fontSize: 8 },
        headStyles: { fillColor: [71, 71, 71] },
        margin: { top: 20 }
      });

      doc.save('commitments.pdf');
      handleClose();
    };

    const downloadCSV = () => {
      // Define headers based on user role
      const headers = userRole !== 'member' 
        ? ['Deal Name', 'Member Name', 'Member Email', 'Quantity', 'Total Price', 'Status', 'Created At']
        : ['Deal Name', 'Quantity', 'Total Price', 'Status', 'Created At'];

      // Create CSV content
      const csvContent = [
        headers.join(','),
        ...commitments.map(commitment => {
          const row = userRole !== 'member' 
            ? [
                `"${commitment.dealId?.name || 'N/A'}"`,
                `"${commitment.userId?.name || 'N/A'}"`,
                `"${commitment.userId?.email || 'N/A'}"`,
                commitment.modifiedQuantity || commitment.quantity,
                commitment.modifiedTotalPrice || commitment.totalPrice,
                commitment.status,
                new Date(commitment.createdAt).toLocaleDateString()
              ]
            : [
                `"${commitment.dealId?.name || 'N/A'}"`,
                commitment.modifiedQuantity || commitment.quantity,
                commitment.modifiedTotalPrice || commitment.totalPrice,
                commitment.status,
                new Date(commitment.createdAt).toLocaleDateString()
              ];
          return row.join(',');
        })
      ].join('\n');

      // Create and trigger download
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', 'commitments.csv');
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      handleClose();
    };

    const CommitmentCard = ({ commitment, userRole, handleOpenDialog, navigate, getStatusColor, handleCheckoutClick }) => {
      return (
        <Card 
          sx={{ 
            width: '100%', 
            mb: 2, 
            overflow: 'hidden',
            borderRadius: 2,
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            transition: 'transform 0.2s, box-shadow 0.2s',
            '&:hover': {
              transform: 'translateY(-2px)',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            }
          }}
        >
          <CardContent sx={{ p: 2.5 }}>
            <Stack spacing={2}>
              <Box>
                <Typography 
                  variant="h6" 
                  component="div" 
                  sx={{ 
                    mb: 1,
                    color: 'primary.main',
                    fontWeight: 600,
                    fontSize: '1.1rem'
                  }}
                >
                  {commitment.dealId?.name || 'N/A'}
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
              </Box>
              
              {userRole !== 'member' && (
                <Box sx={{ 
                  bgcolor: 'grey.50', 
                  p: 1.5, 
                  borderRadius: 1,
                  border: '1px solid',
                  borderColor: 'grey.200'
                }}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    <strong>Member:</strong> {commitment.userId?.name || 'N/A'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    <strong>Email:</strong> {commitment.userId?.email || 'N/A'}
                  </Typography>
                </Box>
              )}
              
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Box sx={{ bgcolor: 'background.paper', p: 1.5, borderRadius: 1 }}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      <strong>Quantity</strong>
                    </Typography>
                    <Typography variant="body1">
                      {commitment.sizeCommitments && commitment.sizeCommitments.length > 0 ? (
                        <Box>
                          <Typography variant="body2" fontWeight="medium">
                            Total: {commitment.sizeCommitments.reduce((sum, item) => sum + item.quantity, 0)}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {commitment.sizeCommitments.slice(0, 2).map((sc, idx) => (
                              <span key={idx}>
                                {sc.size}: {sc.quantity}{idx < Math.min(commitment.sizeCommitments.length - 1, 1) ? ', ' : ''}
                              </span>
                            ))}
                            {commitment.sizeCommitments.length > 2 && ` +${commitment.sizeCommitments.length - 2} more`}
                          </Typography>
                        </Box>
                      ) : commitment.modifiedQuantity ? (
                        <span>
                          <s style={{ color: 'text.secondary' }}>{commitment.quantity}</s>
                          {' → '}
                          <span style={{ color: 'success.main' }}>{commitment.modifiedQuantity}</span>
                        </span>
                      ) : (
                        commitment.quantity
                      )}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6}>
                  <Box sx={{ bgcolor: 'background.paper', p: 1.5, borderRadius: 1 }}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      <strong>Total Price</strong>
                    </Typography>
                    <Typography variant="body1">
                      {commitment.modifiedTotalPrice ? (
                        <span>
                          <s style={{ color: 'text.secondary' }}>${commitment.totalPrice}</s>
                          {' → '}
                          <span style={{ color: 'success.main' }}>${commitment.modifiedTotalPrice}</span>
                        </span>
                      ) : (
                        `$${commitment.totalPrice}`
                      )}
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
              
              {/* Display size-specific discount tier information if available */}
              {commitment.sizeCommitments && commitment.sizeCommitments.some(sc => sc.appliedDiscountTier) && (
                <Box sx={{ 
                  bgcolor: 'success.light', 
                  color: 'success.dark', 
                  p: 1.5, 
                  borderRadius: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 0.5
                }}>
                  <Typography variant="body2" fontWeight="medium">
                    Applied Discount Tiers:
                  </Typography>
                  {commitment.sizeCommitments
                    .filter(sc => sc.appliedDiscountTier)
                    .map((sc, idx) => (
                      <Typography key={idx} variant="body2">
                        {sc.size}: ${sc.appliedDiscountTier.tierDiscount} at {sc.appliedDiscountTier.tierQuantity}+ units
                      </Typography>
                    ))}
                </Box>
              )}
              
              <Box sx={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                borderTop: '1px solid',
                borderColor: 'grey.200',
                pt: 2
              }}>
                <Typography variant="body2" color="text.secondary">
                  <strong>Created:</strong> {new Date(commitment.createdAt).toLocaleDateString()}
                </Typography>
                
                <Stack direction="row" spacing={1}>
                  {userRole !== 'member' && commitment.status === 'pending' && (
                    <Button 
                      variant="contained" 
                      color="primary" 
                      onClick={() => handleOpenDialog(commitment)}
                      size="small"
                    >
                      Review
                    </Button>
                  )}
                  <Button
                    variant="outlined"
                    color="info"
                    onClick={() => navigate(`/commitment-details/${commitment._id}`)}
                    size="small"
                  >
                    View
                  </Button>
                  {userRole === 'payment' && commitment.status === 'approved' && commitment.paymentStatus === 'pending' && (
                    <Button
                      variant="contained"
                      color="primary"
                      onClick={() => handleCheckoutClick(commitment)}
                      size="small"
                    >
                      Checkout
                    </Button>
                  )}
                </Stack>
              </Box>
            </Stack>
          </CardContent>
        </Card>
      );
    };

    const handleCheckoutClick = (commitment) => {
      navigate(`/payment/${commitment._id}`, { 
          state: { commitmentId: commitment._id }
      });
    };

    const handleViewAnalytics = () => {
        localStorage.setItem('commitmentRole', commitmentRole);
      navigate(`/commitment-charts/${userId || currentUserId}`);
    };

    if (loading) {
      return <CircularProgress />;
    }

    return (
      <Box>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h6">
            {userId ? 'User Commitments' : (userRole !== 'member' ? 'Member Commitments' : 'My Commitments')}
          </Typography>
          <Box display="flex" gap={2}>
            <Button
              variant="contained"
              color="secondary"
              startIcon={<FileDownloadIcon />}
              onClick={handleClick}
            >
              Download
            </Button>
            <Menu
              anchorEl={anchorEl}
              open={open}
              onClose={handleClose}
              anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'right',
              }}
              transformOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
            >
              <MenuItem onClick={downloadCSV}>
                Download as CSV
              </MenuItem>
              <MenuItem onClick={downloadPDF}>
                Download as PDF
              </MenuItem>
            </Menu>
            <Button
              variant="contained"
              color="primary"
              onClick={() => handleViewAnalytics()}
            >
              View Analytics
            </Button>
          </Box>
        </Box>
        
        <Box mb={3}>
          <FilterSection>
            <FilterItem>
              <FilterFormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <FilterSelect
                  value={filter.status}
                  onChange={handleFilterChange}
                  label="Status"
                  name="status"
                >
                  <MenuItem value=""><em>All</em></MenuItem>
                  <MenuItem value="pending">Pending</MenuItem>
                  <MenuItem value="approved">Approved</MenuItem>
                  <MenuItem value="declined">Declined</MenuItem>
                </FilterSelect>
              </FilterFormControl>
            </FilterItem>
            
            <FilterItem>
              <FilterTextField
                label="Search"
                name="search"
                value={filter.search}
                onChange={handleFilterChange}
                fullWidth
              />
            </FilterItem>
          </FilterSection>
        </Box>

        {isMobile ? (
          <Grid container spacing={2}>
            {paginatedCommitments.map((commitment) => (
              <Grid item xs={12} key={commitment._id}>
                <CommitmentCard
                  commitment={commitment}
                  userRole={userRole}
                  handleOpenDialog={handleOpenDialog}
                  navigate={navigate}
                  getStatusColor={getStatusColor}
                  handleCheckoutClick={handleCheckoutClick}
                />
              </Grid>
            ))}
          </Grid>
        ) : (
          <TableContainer 
            component={Paper} 
            sx={{
              borderRadius: 2,
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              '& .MuiTableCell-head': {
                bgcolor: 'grey.50',
                fontWeight: 600
              },
              '& .MuiTableRow-root': {
                '&:hover': {
                  bgcolor: 'grey.50'
                }
              },
              '& .MuiTableCell-root': {
                borderColor: 'grey.200'
              }
            }}
          >
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Deal Name</TableCell>
                  {userRole !== 'member' && (
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
                {paginatedCommitments.map((commitment) => (
                  <TableRow key={commitment._id}>
                    <TableCell>{commitment.dealId?.name || 'N/A'}</TableCell>
                    {userRole !== 'member' && (
                      <>
                        <TableCell>{commitment.userId?.name || 'N/A'}</TableCell>
                        <TableCell>{commitment.userId?.email || 'N/A'}</TableCell>
                      </>
                    )}
                    <TableCell>
                      {commitment.sizeCommitments && commitment.sizeCommitments.length > 0 ? (
                        <Box>
                          <Typography variant="body2" fontWeight="medium">
                            Total: {commitment.sizeCommitments.reduce((sum, item) => sum + item.quantity, 0)}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {commitment.sizeCommitments.slice(0, 2).map((sc, idx) => (
                              <span key={idx}>
                                {sc.size}: {sc.quantity}{idx < Math.min(commitment.sizeCommitments.length - 1, 1) ? ', ' : ''}
                              </span>
                            ))}
                            {commitment.sizeCommitments.length > 2 && ` +${commitment.sizeCommitments.length - 2} more`}
                          </Typography>
                        </Box>
                      ) : commitment.modifiedQuantity ? (
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
                      {userRole !== 'member' && commitment.status === 'pending' && (
                        <>
                          <Button 
                            variant="outlined" 
                            color="primary" 
                            onClick={() => handleOpenDialog(commitment)}
                            sx={{ mr: 1 }}
                          >
                            Review
                          </Button>
                          <Button
                            variant="outlined"
                            color="info"
                            onClick={() => navigate(`/commitment-details/${commitment._id}`)}
                          >
                            View
                          </Button>
                        </>
                      )}
                      {userRole !== 'member' && commitment.status !== 'pending' && (
                        <Button
                          variant="outlined"
                          color="info"
                          onClick={() => navigate(`/commitment-details/${commitment._id}`)}
                        >
                          View
                        </Button>
                      )}
                      {userRole === 'member' && (
                        <>
                          <Button
                            variant="outlined"
                            color="info"
                            onClick={() => navigate(`/commitment-details/${commitment._id}`)}
                            sx={{ mr: 1 }}
                          >
                            View
                          </Button>
                          { userRole === 'payment' && commitment.status === 'approved' && commitment.paymentStatus === 'pending' && (
                            <Button
                              variant="contained"
                              color="primary"
                              onClick={() => handleCheckoutClick(commitment)}
                            >
                              Checkout
                            </Button>
                          )}
                        </>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        <Box sx={{ 
          mt: 3, 
          display: 'flex', 
          justifyContent: 'center',
          alignItems: 'center',
          gap: 2,
          flexWrap: 'wrap',
          bgcolor: 'background.paper',
          p: isMobile ? 1 : 2,
          borderRadius: 2,
          boxShadow: '0 0 10px rgba(0,0,0,0.1)'
        }}>
          {!isMobile && (
            <TablePagination
              component="div"
              count={commitments.length}
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
          )}
          <Pagination
            count={Math.ceil(commitments.length / rowsPerPage)}
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

        <Dialog 
          open={dialogOpen} 
          onClose={handleCloseDialog}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>
            Review Commitment
          </DialogTitle>
          <DialogContent>
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle1" gutterBottom>
                Deal: {selectedCommitment?.dealId?.name}
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Member: {selectedCommitment?.userId?.name}
              </Typography>
              
              <Box sx={{ mt: 3 }}>
                <TextField
                  label="Quantity"
                  type="number"
                  value={modifiedQuantity}
                  onChange={(e) => setModifiedQuantity(e.target.value)}
                  fullWidth
                  margin="normal"
                  helperText={`Original quantity: ${selectedCommitment?.quantity}`}
                />
                
                <TextField
                  label="Total Price"
                  type="number"
                  value={modifiedPrice}
                  InputProps={{
                    readOnly: true,
                  }}
                  fullWidth
                  margin="normal"
                  helperText={`Original price: $${selectedCommitment?.totalPrice}`}
                />

                <TextField
                  label="Response Message"
                  multiline
                  rows={4}
                  value={response}
                  onChange={(e) => setResponse(e.target.value)}
                  fullWidth
                  margin="normal"
                  placeholder="Enter your response message here..."
                />
              </Box>
            </Box>
          </DialogContent>
          <DialogActions sx={{ p: 2, gap: 1 }}>
            <Button onClick={handleCloseDialog} color="inherit">
              Cancel
            </Button>
            <Button
              onClick={() => handleStatusUpdate(selectedCommitment._id, 'declined')}
              color="error"
              variant="contained"
            >
              Decline
            </Button>
            <Button
              onClick={() => handleStatusUpdate(selectedCommitment._id, 'approved')}
              color="primary"
              variant="contained"
            >
              Approve
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

export default Commitments;
