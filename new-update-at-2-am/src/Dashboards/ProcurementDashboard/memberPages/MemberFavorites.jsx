import React, { useEffect, useState } from 'react';
import api from '../../../services/api';
import { useAuth } from '../../../middleware/auth';
import {
  Grid,
  Card,
  CardContent,
  CardMedia,
  Typography,
  Box,
  CircularProgress,
  IconButton,
  Button,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText,
  Skeleton,
  Alert,
  Snackbar,
  CardActions,
  Tooltip,
  Divider
} from '@mui/material';
import {
  Favorite as FavoriteIcon,
  ShoppingCart as ShoppingCartIcon,
  Store as StoreIcon,
  LocalOffer as LocalOfferIcon,
  CalendarToday as CalendarTodayIcon,
  AttachMoney as AttachMoneyIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { GridCardsSkeleton } from '../../../Components/Skeletons/LoadingSkeletons';

const MemberFavorites = () => {
  const { currentUserId, isImpersonating } = useAuth();
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [removeDialog, setRemoveDialog] = useState({ open: false, favorite: null });
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const navigate = useNavigate();

  useEffect(() => {
    fetchFavorites();
  }, []);

  const fetchFavorites = async () => {
    try {
      const response = await api.get('/member/favorites');
      setFavorites(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching favorites:', error);
      setLoading(false);
      setSnackbar({
        open: true,
        message: 'Error loading favorites',
        severity: 'error'
      });
    }
  };

  const handleRemoveFavorite = async () => {
    try {
      await api.delete(`/member/favorites/${removeDialog.favorite.dealId._id}`);
      setFavorites(favorites.filter(fav => fav.dealId._id !== removeDialog.favorite.dealId._id));
      setSnackbar({
        open: true,
        message: 'Favorite removed successfully',
        severity: 'success'
      });
    } catch (error) {
      console.error('Error removing favorite:', error);
      setSnackbar({
        open: true,
        message: 'Error removing favorite',
        severity: 'error'
      });
    } finally {
      setRemoveDialog({ open: false, favorite: null });
    }
  };

  const handleCommitment = (dealId) => {
    navigate(`/deals-catlog/deals/${dealId}`);
  };

  if (loading) {
    return <GridCardsSkeleton count={8} xs={12} sm={6} md={4} lg={3} />;
  }

  return (
    <Box sx={{ flexGrow: 1 }}>
      <Typography variant="h4" gutterBottom>
        My Favorite Deals
      </Typography>

      <Grid container spacing={3}>
        {favorites.map((favorite) => {
          const deal = favorite.dealId;
          return (
            <Grid item xs={12} sm={6} md={4} key={favorite._id}>
              <Card 
                sx={{ 
                  height: '100%', 
                  display: 'flex', 
                  flexDirection: 'column',
                  transition: 'transform 0.2s',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: 4
                  }
                }}
              >
                <CardMedia
                  component="img"
                  height="140"
                  image={deal.images[0] || '/placeholder-image.jpg'}
                  alt={deal.name}
                />
                <CardContent sx={{ flexGrow: 1, pt: 2 }}>
                  <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1}>
                    <Typography variant="h6" component="div" noWrap>
                      {deal.name}
                    </Typography>
                    <Tooltip title="Remove from favorites">
                      <IconButton
                        color="error"
                        onClick={() => setRemoveDialog({ open: true, favorite })}
                        size="small"
                      >
                        <FavoriteIcon />
                      </IconButton>
                    </Tooltip>
                  </Box>

                  <Box display="flex" alignItems="center" gap={1} mb={1}>
                    <StoreIcon color="action" fontSize="small" />
                    <Typography variant="body2" color="text.secondary" noWrap>
                      {deal.distributor.businessName}
                    </Typography>
                  </Box>

                  <Box display="flex" flexWrap="wrap" gap={1} mb={2}>
                    <Chip
                      icon={<LocalOfferIcon />}
                      label={deal.category}
                      size="small"
                      color="primary"
                      variant="outlined"
                    />
                    <Chip
                      icon={<CalendarTodayIcon />}
                      label={`Expires: ${new Date(deal.expiryDate).toLocaleDateString()}`}
                      size="small"
                      color="warning"
                      variant="outlined"
                    />
                  </Box>

                  <Divider sx={{ my: 1 }} />

                  <Box display="flex" justifyContent="space-between" alignItems="center" mt={2}>
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        Original Price
                      </Typography>
                      <Typography variant="body1" color="text.secondary" sx={{ textDecoration: 'line-through' }}>
                        ${deal.originalCost}
                      </Typography>
                      <Typography variant="caption" color="primary">
                        Discount Price
                      </Typography>
                      <Typography variant="body1" color="primary" fontWeight="bold">
                        ${deal.discountPrice}
                      </Typography>
                    </Box>
                    <Button
                      variant="contained"
                      size="small"
                      startIcon={<ShoppingCartIcon />}
                      onClick={() => handleCommitment(deal._id)}
                      sx={{ minWidth: '120px' }}
                    >
                      Commit
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      {/* Remove Favorite Dialog */}
      <Dialog
        open={removeDialog.open}
        onClose={() => setRemoveDialog({ open: false, favorite: null })}
      >
        <DialogTitle>Remove from Favorites</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to remove this deal from your favorites?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRemoveDialog({ open: false, favorite: null })}>Cancel</Button>
          <Button onClick={handleRemoveFavorite} color="error" variant="contained">
            Remove
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

      {favorites.length === 0 && !loading && (
        <Box
          display="flex"
          justifyContent="center"
          alignItems="center"
          minHeight="200px"
        >
          <Typography variant="h6" color="text.secondary">
            No favorite deals yet
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default MemberFavorites; 