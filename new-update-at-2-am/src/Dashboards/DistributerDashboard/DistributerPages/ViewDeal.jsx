import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../../services/api';
import { 
  Container, Typography, Box, Grid, Button, Card, CardContent, CardMedia, 
  Divider, Chip, Skeleton, CircularProgress, Table, TableBody, TableCell, 
  TableContainer, TableHead, TableRow, Paper
} from '@mui/material';
import { ArrowBack, ShoppingCart, FavoriteBorder, Info, PlayArrow } from '@mui/icons-material';
import Carousel from 'react-material-ui-carousel';
import Toast from '../../../Components/Toast/Toast';

// Helper function to determine if the media is a video
const isVideoUrl = (url) => {
  if (!url) return false;
  const videoExtensions = ['.mp4', '.webm', '.ogg', '.mov'];
  return videoExtensions.some(ext => url.toLowerCase().includes(ext));
};

const ViewDealSkeleton = () => (
  <Container>
    <Grid container spacing={3}>
      <Grid item xs={12} md={6}>
        <Skeleton variant="rectangular" height={400} sx={{ borderRadius: 1 }} />
      </Grid>
      <Grid item xs={12} md={6}>
        <Skeleton variant="text" sx={{ fontSize: '2rem', mb: 2 }} />
        <Skeleton variant="text" sx={{ fontSize: '1.5rem', mb: 1 }} />
        <Skeleton variant="text" sx={{ width: '60%', mb: 3 }} />
        <Box sx={{ mb: 3 }}>
          {[...Array(4)].map((_, index) => (
            <Skeleton key={index} variant="text" sx={{ mb: 1 }} />
          ))}
        </Box>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Skeleton variant="rectangular" width={120} height={40} />
          <Skeleton variant="rectangular" width={120} height={40} />
        </Box>
      </Grid>
    </Grid>
  </Container>
);

const ViewDeal = () => {
  const { dealId } = useParams();
  const navigate = useNavigate();
  const [deal, setDeal] = useState(null);
  const [toast, setToast] = useState({ open: false, message: '', severity: 'success' });
  const [loading, setLoading] = useState(true);
  const [isStatusUpdating, setIsStatusUpdating] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);

  const handleToastClose = () => {
    setToast({ ...toast, open: false });
  };

  useEffect(() => {
    const fetchDeal = async () => {
      try {
        const response = await api.get(`/deals/fetch-single/deal/${dealId}`);
        setDeal(response.data);
      } catch (error) {
        console.error('Error fetching deal:', error);
        setToast({ open: true, message: 'Failed to fetch deal details', severity: 'error' });
      } finally {
        setLoading(false);
      }
    };
    fetchDeal();
  }, [dealId]);

  const handleViewCommitments = async () => {
    if (isNavigating) return;
    try {
      setIsNavigating(true);
      navigate(`/distributor/view/deals/${dealId}/commitments`);
    } catch (error) {
      console.error('Error navigating to commitments:', error);
      setToast({ open: true, message: 'Failed to navigate to commitments', severity: 'error' });
    } finally {
      setIsNavigating(false);
    }
  };

  if (loading) {
    return <ViewDealSkeleton />;
  }

  if (!deal) {
    return <Typography>Deal not found</Typography>;
  }

  return (
    <Container maxWidth="lg" sx={{ marginTop: 4, marginBottom: 4 }}>
      <Button startIcon={<ArrowBack />} onClick={() => navigate(-1)} sx={{ marginBottom: 2 }}>Back</Button>
      <Card sx={{ borderRadius: 3, boxShadow: 6, padding: 3 }}>
        <Grid container spacing={4}>
          <Grid item xs={12} md={6}>
            <Carousel animation="slide" navButtonsAlwaysVisible>
              {deal.images.map((mediaUrl, index) => (
                <Box key={index} sx={{ position: 'relative', height: 450, borderRadius: 2, overflow: 'hidden' }}>
                  {isVideoUrl(mediaUrl) ? (
                    <Box 
                      component="video" 
                      controls
                      autoPlay
                      muted
                      loop
                      sx={{ 
                        width: '100%',
                        height: '100%',
                        objectFit: 'contain',
                        bgcolor: 'black'
                      }}
                      src={mediaUrl}
                    />
                  ) : (
                    <CardMedia
                      component="img"
                      height="450"
                      image={mediaUrl || "https://via.placeholder.com/450"}
                      alt={deal.name}
                      sx={{ borderRadius: 2, objectFit: 'contain' }}
                    />
                  )}
                </Box>
              ))}
            </Carousel>
          </Grid>
          <Grid item xs={12} md={6}>
            <CardContent>
              <Typography variant="h4" fontWeight="bold" gutterBottom>
                {deal.name}
              </Typography>
              <Chip label={deal.category} color="primary" sx={{ marginBottom: 2 }} />
              <Typography variant="body1" color="text.secondary" gutterBottom>
                {deal.description}
              </Typography>
              <Divider sx={{ marginY: 2 }} />
              
              {/* Deal Statistics */}
              <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Average Savings:
                  </Typography>
                  <Typography variant="h6" fontWeight="bold" color="success.main">
                    ${deal.avgSavingsPerUnit.toFixed(2)} ({deal.avgSavingsPercentage}%)
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Total Potential Savings:
                  </Typography>
                  <Typography variant="h6" fontWeight="bold" color="success.main">
                    ${deal.totalPotentialSavings.toFixed(2)}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Total Commitments:
                  </Typography>
                  <Typography variant="h6" fontWeight="bold">
                    {deal.totalCommitments}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Total Committed Quantity:
                  </Typography>
                  <Typography variant="h6" fontWeight="bold">
                    {deal.totalCommittedQuantity}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Minimum Quantity Required:
                  </Typography>
                  <Typography variant="h6" fontWeight="bold">
                    {deal.minQtyForDiscount}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Remaining Quantity Needed:
                  </Typography>
                  <Typography variant="h6" fontWeight="bold" color={deal.remainingQuantity > 0 ? "error.main" : "success.main"}>
                    {deal.remainingQuantity}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Views:
                  </Typography>
                  <Typography variant="h6" fontWeight="bold">
                    {deal.views}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Impressions:
                  </Typography>
                  <Typography variant="h6" fontWeight="bold">
                    {deal.impressions}
                  </Typography>
                </Grid>
              </Grid>

              <Divider sx={{ marginY: 2 }} />

              {/* Size Details */}
              <Typography variant="h6" gutterBottom>
                Available Sizes
              </Typography>
              <TableContainer component={Paper} sx={{ mb: 3 }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Size</TableCell>
                      <TableCell>Original Price</TableCell>
                      <TableCell>Discount Price</TableCell>
                      <TableCell>Committed</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {deal.sizes.map((size, index) => (
                      <TableRow key={index}>
                        <TableCell>{size.size}</TableCell>
                        <TableCell>${Number(size.originalCost).toFixed(2)}</TableCell>
                        <TableCell>${Number(size.discountPrice).toFixed(2)}</TableCell>
                        <TableCell>{deal.sizeCommitments[size.size] || 0}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>

           
              <Box sx={{ display: 'flex', gap: 2, marginTop: 3 }}>
                <Button 
                  variant="contained" 
                  color="primary" 
                  startIcon={isNavigating ? <CircularProgress size={20} color="inherit" /> : null}
                  fullWidth
                  onClick={handleViewCommitments}
                  disabled={isNavigating}
                >
                  {isNavigating ? 'Loading...' : 'View Commitments'}
                </Button>
              </Box>
            </CardContent>
          </Grid>
        </Grid>
      </Card>
      <Toast open={toast.open} message={toast.message} severity={toast.severity} handleClose={handleToastClose} />
    </Container>
  );
};

export default ViewDeal;