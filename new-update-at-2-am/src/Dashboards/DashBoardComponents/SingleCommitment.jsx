import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, Typography, Button, Box, Chip, Grid, Skeleton } from '@mui/material';
import { Info, Visibility, Edit } from '@mui/icons-material';

const SingleCommitmentSkeleton = () => (
  <Card>
    <CardContent>
      <Grid container spacing={2}>
        <Grid item xs={12} sm={8}>
          <Skeleton variant="text" sx={{ fontSize: '1.5rem', mb: 1 }} />
          <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
            <Skeleton variant="rectangular" width={80} height={24} />
            <Skeleton variant="rectangular" width={80} height={24} />
          </Box>
          {[...Array(3)].map((_, index) => (
            <Skeleton key={index} variant="text" sx={{ mb: 0.5 }} />
          ))}
        </Grid>
        <Grid item xs={12} sm={4}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            <Skeleton variant="rectangular" height={36} />
            <Skeleton variant="rectangular" height={36} />
          </Box>
        </Grid>
      </Grid>
    </CardContent>
  </Card>
);

const SingleCommitment = ({ commitment, onStatusUpdate, loading }) => {
    const navigate = useNavigate();
    
    if (loading) {
        return <SingleCommitmentSkeleton />;
    }

    const getStatusColor = (status) => {
        const colors = {
            pending: 'warning',
            approved: 'success',
            declined: 'error',
            cancelled: 'error'
        };
        return colors[status] || 'default';
    };
    
    return (
        <Card>
            <CardContent>
                <Grid container spacing={2}>
                    <Grid item xs={12} sm={8}>
                        <Typography variant="h6" gutterBottom>
                            {commitment.dealId?.name}
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
                        <Chip
                            label={commitment.status.toUpperCase()}
                            color={getStatusColor(commitment.status)}
                            size="small"
                            />
                            {commitment.sizeCommitments && commitment.sizeCommitments.some(sc => sc.appliedDiscountTier) ? (
                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                    {commitment.sizeCommitments
                                        .filter(sc => sc.appliedDiscountTier)
                                        .map((sc, idx) => (
                                            <Chip 
                                                key={idx}
                                                label={`${sc.size}: $${sc.appliedDiscountTier.tierDiscount}`} 
                                                color="success" 
                                                size="small"
                                                variant="outlined"
                                            />
                                        ))}
                                </Box>
                            ) : commitment.appliedDiscountTier && (
                                <Chip 
                                    label={`${commitment.appliedDiscountTier.tierDiscount}% off`} 
                                    color="success" 
                                    size="small"
                                    variant="outlined"
                                />
                            )}
                        </Box>
                        
                        <Typography variant="body2" gutterBottom>
                            <strong>Distributor:</strong> {commitment.dealId?.distributor?.name || 'N/A'}
                        </Typography>
                        
                        <Typography variant="body2" gutterBottom>
                            <strong>Quantity:</strong> {
                                commitment.sizeCommitments && commitment.sizeCommitments.length > 0 ? (
                                    <span>
                                        {commitment.sizeCommitments.reduce((sum, sc) => sum + sc.quantity, 0)}
                                        <Typography component="span" variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                                            ({commitment.sizeCommitments.map(sc => `${sc.size}: ${sc.quantity}`).join(', ')})
                                        </Typography>
                                    </span>
                                ) : commitment.modifiedQuantity ? (
                                    <span>
                                        <s>{commitment.quantity}</s> → {commitment.modifiedQuantity}
                                    </span>
                                ) : (
                                    commitment.quantity
                                )
                            }
                        </Typography>
                        
                        <Typography variant="body2">
                            <strong>Total Price:</strong> {
                                commitment.modifiedTotalPrice ? (
                                    <span>
                                        <s>${commitment.totalPrice}</s> → ${commitment.modifiedTotalPrice}
                                    </span>
                                ) : (
                                    `$${commitment.totalPrice}`
                                )
                            }
                        </Typography>
                    </Grid>
                    <Grid item xs={12} sm={4}>
                        <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 1 }}>
                    {commitment.status === 'pending' && (
                        <Button
                            variant="contained"
                            color="primary"
                            startIcon={<Edit />}
                            onClick={() => onStatusUpdate(commitment)}
                                    fullWidth
                        >
                            Review
                        </Button>
                    )}
                    <Button
                        variant="outlined"
                        startIcon={<Visibility />}
                        onClick={() => navigate(`/commitment-details/${commitment._id}`)}
                        color="info"
                                fullWidth
                    >
                        View Details
                    </Button>
                </Box>
                    </Grid>
                </Grid>
            </CardContent>
        </Card>
    );
};

export default SingleCommitment;
