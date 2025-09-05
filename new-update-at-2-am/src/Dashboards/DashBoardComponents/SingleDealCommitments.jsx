import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../services/api';
import {
  Container,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Typography,
  Box,
  Button,
  Pagination,
  Stack,
  Skeleton,
  Tooltip,
  IconButton,
  Collapse
} from '@mui/material';
import { 
  ArrowBack, 
  CheckCircle, 
  Cancel, 
  Pending, 
  AttachMoney, 
  Discount,
  ExpandMore,
  ExpandLess,
  FormatListBulleted
} from '@mui/icons-material';
import { TableSkeleton } from '../../Components/Skeletons/LoadingSkeletons';

const SingleDealCommitments = () => {
  const navigate = useNavigate();
  const { dealId } = useParams();
  const [commitments, setCommitments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [expandedRows, setExpandedRows] = useState({});

  useEffect(() => {
    const fetchCommitments = async () => {
      try {
        const response = await api.get(
          `/deals/singleCommitment/deal/${dealId}?page=${page}&limit=10`
        );
        setCommitments(response.data.commitments);
        setTotalPages(response.data.totalPages);
      } catch (error) {
        console.error('Error fetching commitments:', error);
      } finally {
        setLoading(false);
      }
    };

    if (dealId) {
      fetchCommitments();
    }
  }, [dealId, page]);

  const handlePageChange = (event, value) => {
    setPage(value);
  };

  const toggleExpandRow = (id) => {
    setExpandedRows(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  // Calculate total quantity from size commitments
  const calculateTotalQuantity = (sizeCommitments) => {
    if (!sizeCommitments || !Array.isArray(sizeCommitments)) return 0;
    return sizeCommitments.reduce((total, size) => total + size.quantity, 0);
  };

  const getStatusChip = (status) => {
    const statusConfig = {
      pending: { color: 'warning', icon: <Pending sx={{ mr: 1 }} /> },
      approved: { color: 'success', icon: <CheckCircle sx={{ mr: 1 }} /> },
      declined: { color: 'error', icon: <Cancel sx={{ mr: 1 }} /> },
    };

    const config = statusConfig[status] || statusConfig.pending;

    return (
      <Chip
        icon={config.icon}
        label={status.charAt(0).toUpperCase() + status.slice(1)}
        color={config.color}
        variant="outlined"
      />
    );
  };

  if (loading) {
    return (
      <Container>
        <Box sx={{ mb: 3 }}>
          <Skeleton variant="text" sx={{ fontSize: '2rem', mb: 1 }} />
          <Skeleton variant="text" width="60%" />
        </Box>
        <TableSkeleton columnsNum={6} />
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box display="flex" alignItems="center" mb={4}>
        <Button
          startIcon={<ArrowBack />}
          onClick={() => navigate(-1)}
          sx={{ mr: 2 }}
        >
          Back to Deal
        </Button>
        <Typography variant="h4" component="h1">
          Deal Commitments
        </Typography>
      </Box>

      {commitments.length === 0 ? (
        <Paper sx={{ p: 3 }}>
          <Typography>No commitments found for this deal.</Typography>
        </Paper>
      ) : (
        <>
          <TableContainer component={Paper} sx={{ mb: 4 }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell width="40px"></TableCell>
                  <TableCell>Buyer</TableCell>
                  <TableCell>Contact</TableCell>
                  <TableCell align="right">Total Quantity</TableCell>
                  <TableCell align="right">Total Price</TableCell>
                  <TableCell align="center">Status</TableCell>
                  <TableCell align="center">Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {commitments.map((commitment) => {
                  // Calculate total quantity depending on whether modified or not
                  const totalQuantity = commitment.modifiedByDistributor && commitment.modifiedSizeCommitments ? 
                    calculateTotalQuantity(commitment.modifiedSizeCommitments) : 
                    calculateTotalQuantity(commitment.sizeCommitments);
                  
                  // Get the total price (either modified or original)
                  const totalPrice = commitment.modifiedTotalPrice || commitment.totalPrice;
                  
                  return (
                    <React.Fragment key={commitment._id}>
                      <TableRow>
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
                          <Typography variant="body2">{commitment.userId.name}</Typography>
                          <Typography variant="caption" color="textSecondary">
                            {commitment.userId.businessName}
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
                                      icon={<Discount fontSize="small" />} 
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
                                icon={<Discount fontSize="small" />} 
                                label={`${commitment.appliedDiscountTier.tierDiscount}% off`} 
                                size="small" 
                                color="success" 
                                variant="outlined"
                                sx={{ mt: 0.5 }}
                              />
                            </Tooltip>
                          )}
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">{commitment.userId.email}</Typography>
                          <Typography variant="caption" color="textSecondary">
                            {commitment.userId.phone}
                          </Typography>
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
                              {calculateTotalQuantity(commitment.sizeCommitments)}
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell align="right">
                          <Box display="flex" alignItems="center" justifyContent="flex-end">
                            <AttachMoney sx={{ fontSize: 14 }} />
                            <Typography variant="body2" fontWeight="medium">
                              {Number(totalPrice).toFixed(2)}
                            </Typography>
                          </Box>
                          {commitment.modifiedTotalPrice && (
                            <Typography variant="caption" color="text.secondary" sx={{ 
                              display: 'block',
                              textDecoration: 'line-through',
                              textAlign: 'right'
                            }}>
                              ${Number(commitment.totalPrice).toFixed(2)}
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell align="center">{getStatusChip(commitment.status)}</TableCell>
                        <TableCell align="center">
                          <Button 
                            variant="contained" 
                            color="primary" 
                            onClick={() => navigate(`/distributor/view/deals/${dealId}/commitments/${commitment._id}`)}
                          >
                            View
                          </Button>
                        </TableCell>
                      </TableRow>
                      
                      {/* Expandable row for size details */}
                      <TableRow>
                        <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={7}>
                          <Collapse in={expandedRows[commitment._id]} timeout="auto" unmountOnExit>
                            <Box sx={{ margin: 2 }}>
                              <Typography variant="subtitle2" gutterBottom component="div" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <FormatListBulleted fontSize="small" />
                                Size Commitments
                              </Typography>
                              <Table size="small" aria-label="size commitments">
                                <TableHead>
                                  <TableRow>
                                    <TableCell>Size</TableCell>
                                    <TableCell align="right">Quantity</TableCell>
                                    <TableCell align="right">Price Per Unit ($)</TableCell>
                                    <TableCell align="right">Discount Tier</TableCell>
                                    <TableCell align="right">Total ($)</TableCell>
                                  </TableRow>
                                </TableHead>
                                <TableBody>
                                  {/* Display modified sizes if they exist, otherwise show original */}
                                  {(commitment.modifiedByDistributor && commitment.modifiedSizeCommitments ? 
                                    commitment.modifiedSizeCommitments : 
                                    commitment.sizeCommitments)?.map((size, index) => (
                                    <TableRow key={index}>
                                      <TableCell component="th" scope="row">
                                        {size.size}
                                      </TableCell>
                                      <TableCell align="right">{size.quantity}</TableCell>
                                      <TableCell align="right">${Number(size.pricePerUnit).toFixed(2)}</TableCell>
                                      <TableCell align="right">
                                        {size.appliedDiscountTier ? (
                                          <Chip 
                                            label={`$${size.appliedDiscountTier.tierDiscount} at ${size.appliedDiscountTier.tierQuantity}+`}
                                            size="small"
                                            color="success"
                                            variant="outlined"
                                          />
                                        ) : (
                                          <Typography variant="caption" color="text.secondary">None</Typography>
                                        )}
                                      </TableCell>
                                      <TableCell align="right">${Number(size.totalPrice || (size.quantity * size.pricePerUnit)).toFixed(2)}</TableCell>
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
                                        <TableCell align="right">Discount Tier</TableCell>
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
                                          <TableCell align="right">
                                            {size.appliedDiscountTier ? (
                                              <Chip 
                                                label={`$${size.appliedDiscountTier.tierDiscount} at ${size.appliedDiscountTier.tierQuantity}+`}
                                                size="small"
                                                color="success"
                                                variant="outlined"
                                              />
                                            ) : (
                                              <Typography variant="caption" color="text.secondary">None</Typography>
                                            )}
                                          </TableCell>
                                          <TableCell align="right">${Number(size.totalPrice || (size.quantity * size.pricePerUnit)).toFixed(2)}</TableCell>
                                        </TableRow>
                                      ))}
                                      
                                      {/* Show a footer row with totals */}
                                      <TableRow sx={{ bgcolor: 'rgba(0, 0, 0, 0.04)' }}>
                                        <TableCell><strong>Total</strong></TableCell>
                                        <TableCell align="right"><strong>{calculateTotalQuantity(commitment.sizeCommitments)}</strong></TableCell>
                                        <TableCell></TableCell>
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
                })}
              </TableBody>
            </Table>
          </TableContainer>
          <Stack spacing={2} alignItems="center">
            <Pagination
              count={totalPages}
              page={page}
              onChange={handlePageChange}
              color="primary"
              size="large"
            />
          </Stack>
        </>
      )}
    </Container>
  );
};

export default SingleDealCommitments;
