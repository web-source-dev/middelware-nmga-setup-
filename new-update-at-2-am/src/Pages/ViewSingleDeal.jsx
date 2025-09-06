import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  Button,
  IconButton,
  Grid,
  Paper,
  Divider,
  CircularProgress,
  Alert,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Avatar,
  Chip,
  Stack,
  Card,
  useTheme,
  useMediaQuery,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  RadioGroup,
  Radio,
  FormControlLabel,
  TableContainer,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  AlertTitle,
  LinearProgress,
} from '@mui/material';
import {
  ArrowBack,
  Favorite as FavoriteIcon,
  FavoriteBorder as FavoriteBorderIcon,
  ShoppingCart,
  NavigateBefore,
  NavigateNext,
  Email,
  Phone,
  Store,
  Person,
  Schedule,
  LocalOffer,
  Groups,
  Visibility,
  QueryStats,
  TrendingUp,
  AddShoppingCart,
  CheckCircle as CheckCircleIcon,
  PlayArrow,
  Edit as EditIcon,
} from '@mui/icons-material';
import api from '../services/api';
import { useAuth } from '../middleware/auth';
import Toast from '../Components/Toast/Toast';
import { io } from 'socket.io-client';
import PriceDisclaimer from '../Components/PriceDisclaimer';

// Helper function to determine if the media is a video
const isVideoUrl = (url) => {
  if (!url) return false;
  const videoExtensions = ['.mp4', '.webm', '.ogg', '.mov'];
  return videoExtensions.some(ext => url.toLowerCase().includes(ext));
};

const ViewSingleDeal = () => {
  const { dealId } = useParams();
  const navigate = useNavigate();
  const [deal, setDeal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [getDealOpen, setGetDealOpen] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [toast, setToast] = useState({
    open: false,
    message: '',
    severity: 'success'
  });
  const [isCommitting, setIsCommitting] = useState(false);
  const [isFavoriteLoading, setIsFavoriteLoading] = useState(false);
  const [socket, setSocket] = useState(null);
  const [selectedSizes, setSelectedSizes] = useState({});
  const [activeTier, setActiveTier] = useState(null);
  const [totalQuantity, setTotalQuantity] = useState(0);
  const [totalPrice, setTotalPrice] = useState(0);
  const [totalSavings, setTotalSavings] = useState(0);
  
  const { 
    currentUserId, 
    userRole, 
    isAuthenticated, 
    isImpersonating,
    isCollaborator,
    isAdmin,
    isCollaboratorManager,
    isCommitmentManager
  } = useAuth();

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // Check if commitment period has ended
  const isCommitmentPeriodEnded = () => {
    if (!deal?.commitmentEndsAt) return false;
    const commitmentEndDate = new Date(deal.commitmentEndsAt);
    const now = new Date();
    return now > commitmentEndDate;
  };

  // Check if commitment period is active
  const isCommitmentPeriodActive = () => {
    if (!deal?.commitmentStartAt || !deal?.commitmentEndsAt) return true; // Default to true if dates not set
    const commitmentStartDate = new Date(deal.commitmentStartAt);
    const commitmentEndDate = new Date(deal.commitmentEndsAt);
    const now = new Date();
    return now >= commitmentStartDate && now <= commitmentEndDate;
  };

  // Check if user can perform commitment actions
  const canPerformCommitmentActions = () => {
    // Main account owner (not a collaborator)
    if (!isCollaborator) return true;
    
    // Admin (with or without impersonating)
    if (isAdmin) return true;
    
    // Collaborator manager
    if (isCollaboratorManager) return true;
    
    // Commitment manager
    if (isCommitmentManager) return true;
    
    // All other collaborators cannot perform commitment actions
    return false;
  };

  useEffect(() => {
    // Create socket connection
    const newSocket = io(process.env.REACT_APP_BACKEND_URL);
    setSocket(newSocket);

    // Handle connection events
    newSocket.on('connect', () => {
      console.log('Connected to WebSocket server');
    });

    // Clean up socket connection on component unmount
    return () => {
      newSocket.disconnect();
    };
  }, []);

  // Handle distributor redirect
  useEffect(() => {
    if (isAuthenticated && userRole === 'distributor' && !isImpersonating) {
      const dashboardPath = `/dashboard/distributor`;
      const token = localStorage.getItem('token');
      const authParams = `token=${encodeURIComponent(token)}&user_role=${encodeURIComponent(userRole)}&user_id=${encodeURIComponent(currentUserId)}`;
      window.open(`${dashboardPath}?${authParams}`, '_blank');
    }
  }, [isAuthenticated, userRole, currentUserId, isImpersonating]);

  // Listen for real-time deal updates
  useEffect(() => {
    if (!socket) return;

    // Listen for general deal updates
    socket.on('deal-update', (data) => {
      if (data.deal._id === dealId) {
        // Update the deal if it's the one we're viewing and not deleted
        if (data.type === 'updated') {
          setDeal(data.deal);
        } else if (data.type === 'deleted') {
          // Handle deleted deal - maybe show a message and redirect
          setToast({
            open: true,
            message: "This deal has been deleted by the distributor",
            severity: "warning"
          });
          // You could redirect after a timeout:
          setTimeout(() => window.location.href = '/buy', 3000);
        }
      }
    });

    // Listen for specific updates to this deal
    socket.on('single-deal-update', (data) => {
      if (data.dealId === dealId) {
        console.log('Received specific deal update:', data);
        setDeal(data.dealData);
      }
    });

    return () => {
      socket.off('deal-update');
      socket.off('single-deal-update');
    };
  }, [socket, dealId]);

  // State to track if user has already committed to this deal
  const [userCommitment, setUserCommitment] = useState(null);

  useEffect(() => {
  
    const fetchDeal = async () => {
      try {
        const response = await api.get(`/deals/fetch-single/deal/${dealId}`);
        setDeal(response.data);
        console.log(response.data);
        
        // Initialize selected sizes with 0 quantity for each available size
        if (response.data && response.data.sizes) {
          const initialSizes = {};
          response.data.sizes.forEach(size => {
            initialSizes[size.size] = 0;
          });
          setSelectedSizes(initialSizes);
        }
        
        // Check if deal is in favorites and get user commitments only if user is logged in
        if (currentUserId) {
          try {
            const favResponse = await api.get(`/deals/favorite`);
            // Compare either string to string or object id to string
            setIsFavorite(favResponse.data.some(fav => 
              fav.dealId === dealId || 
              fav.dealId?._id === dealId || 
              String(fav.dealId) === String(dealId)
            ));
          } catch (favError) {
            console.error('Error fetching favorites:', favError);
            // Continue with the app even if favorites check fails
          }
          
          try {
            // Check if user has already committed to this deal
            const commitmentsResponse = await api.get(`/deals/commit`);
            // Add defensive coding to handle possible missing data
            if (commitmentsResponse.data && Array.isArray(commitmentsResponse.data)) {
              const existingCommitment = commitmentsResponse.data.find(
                commitment => 
                  commitment.dealId?._id === dealId || 
                  String(commitment.dealId) === String(dealId)
              );
              setUserCommitment(existingCommitment || null);
              
              // If user has existing commitment, set the selected sizes
              if (existingCommitment && existingCommitment.sizeCommitments) {
                const userSizes = {};
                existingCommitment.sizeCommitments.forEach(sc => {
                  if (sc && sc.size) {
                    userSizes[sc.size] = sc.quantity || 0;
                  }
                });
                setSelectedSizes(userSizes);
              }
            }
          } catch (commitError) {
            console.error('Error fetching user commitments:', commitError);
            // Continue with the app even if commitments check fails
          }
        }
      } catch (err) {
        console.error('Error in fetchDeal:', err);
        setError(err.response?.data?.message || 'Error fetching deal details');
      } finally {
        setLoading(false);
      }
    };
    fetchDeal();
    // No need for interval-based polling anymore
  }, [dealId, navigate, currentUserId]);

  // Calculate total quantity, price, and determine active discount tier
  useEffect(() => {
    if (!deal) return;
    
    // Calculate total quantity across all sizes
    let newTotalQuantity = 0;
    let newTotalPrice = 0;
    let newTotalSavings = 0;
    
    // Calculate totals based on selected sizes
    Object.entries(selectedSizes).forEach(([sizeName, quantity]) => {
      if (quantity > 0) {
        const sizeData = deal.sizes.find(s => s.size === sizeName);
        if (sizeData) {
          newTotalQuantity += quantity;
          
          // Get current total collective quantity for this size
          const collectiveQuantity = (deal.sizeCommitments && deal.sizeCommitments[sizeName]) || 0;
          
          // If this is an update, calculate previous commitment quantity
          let previousQuantity = 0;
          if (userCommitment) {
            const previousSizeCommitment = userCommitment.sizeCommitments.find(sc => sc.size === sizeName);
            if (previousSizeCommitment) {
              previousQuantity = previousSizeCommitment.quantity;
            }
          }
          
          // Calculate projected collective quantity after this change
          const projectedQuantity = collectiveQuantity - previousQuantity + quantity;
          
          // Check for size-specific discount tiers based on projected collective quantity
          let effectivePrice = sizeData.discountPrice;
          let appliedTier = null;
          
          if (sizeData.discountTiers && sizeData.discountTiers.length > 0) {
            // Sort tiers by quantity (highest first) to find the best applicable tier
            const sortedTiers = [...sizeData.discountTiers].sort((a, b) => b.tierQuantity - a.tierQuantity);
            
            // Find the applicable tier based on projected collective quantity
            appliedTier = sortedTiers.find(tier => projectedQuantity >= tier.tierQuantity);
            
            // If a tier applies, use its price
            if (appliedTier) {
              effectivePrice = appliedTier.tierDiscount;
            }
          }
          
          const sizeTotal = quantity * effectivePrice;
          const sizeSavings = quantity * (sizeData.originalCost - effectivePrice);
          
          newTotalPrice += sizeTotal;
          newTotalSavings += sizeSavings;
        }
      }
    });
    
    setTotalQuantity(newTotalQuantity);
    setTotalPrice(newTotalPrice);
    setTotalSavings(newTotalSavings);
  }, [deal, selectedSizes, userCommitment]);

  const handleNextImage = () => {
    setCurrentImageIndex((prev) => 
      prev === deal.images.length - 1 ? 0 : prev + 1
    );
  };

  const handlePrevImage = () => {
    setCurrentImageIndex((prev) => 
      prev === 0 ? deal.images.length - 1 : prev - 1
    );
  };

  const handleGetDeal = () => {
    if (!isAuthenticated) {
      setToast({
        open: true,
        message: 'Please login to get deal',
        severity: 'error'
      });
      setTimeout(() => 
        setRedirectLoading(true), 2000);
      const currentPath = window.location.pathname;
      localStorage.setItem('redirectPath', currentPath);
      setTimeout(() => window.location.href = '/login', 3000);
      return;
    }
    
    // Only members or admins impersonating members can commit to deals
    if (userRole !== 'member' && !(userRole === 'admin' && isImpersonating)) {
      setToast({
        open: true,
        message: 'Only Co-op members can commit to deals',
        severity: 'warning'
      });
      return;
    }

    // Check if user has permission to perform commitment actions
    if (!canPerformCommitmentActions()) {
      setToast({
        open: true,
        message: 'You do not have permission to make commitments. Only account owners, admins, managers, and commitment managers can make commitments.',
        severity: 'warning'
      });
      return;
    }
    
    // If user has already committed to this deal, pre-populate with existing quantities
    if (userCommitment && userCommitment.sizeCommitments) {
      const existingSizes = {};
      userCommitment.sizeCommitments.forEach(sc => {
        existingSizes[sc.size] = sc.quantity;
      });
      setSelectedSizes(existingSizes);
    } else {
      // Reset all sizes to 0
      const resetSizes = {};
      deal?.sizes.forEach(size => {
        resetSizes[size.size] = 0;
      });
      setSelectedSizes(resetSizes);
    }
    
    setGetDealOpen(true);
  };
  
  const handleCloseGetDeal = () => {
    setGetDealOpen(false);
  };

  const handleSizeQuantityChange = (size, quantity) => {
    const newQuantity = Math.max(0, parseInt(quantity) || 0);
    
    // Get the size data
    const sizeData = deal.sizes.find(s => s.size === size);
    if (!sizeData || !sizeData.discountTiers || sizeData.discountTiers.length === 0) {
      // If no discount tiers, just update the quantity
      setSelectedSizes(prev => ({
        ...prev,
        [size]: newQuantity
      }));
      return;
    }
    
    // Get current tier info
    const currentCollectiveQuantity = (deal.sizeCommitments && deal.sizeCommitments[size]) || 0;
    
    // If this is an update, calculate what the previous commitment was
    let previousQuantity = 0;
    if (userCommitment) {
      const previousSizeCommitment = userCommitment.sizeCommitments.find(sc => sc.size === size);
      if (previousSizeCommitment) {
        previousQuantity = previousSizeCommitment.quantity;
      }
    }
    
    // Calculate what the new collective total would be
    const newCollectiveQuantity = currentCollectiveQuantity - previousQuantity + newQuantity;
    
    // Sort tiers by quantity (highest first)
    const sortedTiers = [...sizeData.discountTiers].sort((a, b) => b.tierQuantity - a.tierQuantity);
    
    // Determine current tier and what tier would apply after this change
    const currentTier = sortedTiers.find(tier => currentCollectiveQuantity >= tier.tierQuantity);
    const newTier = sortedTiers.find(tier => newCollectiveQuantity >= tier.tierQuantity);
    
    // If decreasing quantity would cause dropping to a lower tier or losing tier discount
    if (currentTier && (!newTier || newTier.tierQuantity < currentTier.tierQuantity)) {
      // Show an alert about potential price increase for all members
      setToast({
        open: true,
        message: `Reducing quantity may cause all members to lose the ${currentTier.tierQuantity}+ unit discount tier.`,
        severity: 'warning'
      });
    }
    
    // Immediately update the displayed prices with projected tier status
    // This simulates what would happen if the change was confirmed
    // Create a copy of deal with updated sizeCommitments to reflect the projected state
    const projectedDeal = {...deal};
    if (!projectedDeal.sizeCommitments) {
      projectedDeal.sizeCommitments = {};
    }
    projectedDeal.sizeCommitments = {...projectedDeal.sizeCommitments};
    projectedDeal.sizeCommitments[size] = newCollectiveQuantity;
    
    // Update the UI to reflect this projected state
    // This is just for the visual display - the actual update will happen on submit
    const updatedSizes = deal.sizes.map(s => {
      if (s.size === size) {
        const projectedTier = s.discountTiers && s.discountTiers.length > 0 
          ? [...s.discountTiers].sort((a, b) => b.tierQuantity - a.tierQuantity)
            .find(tier => newCollectiveQuantity >= tier.tierQuantity)
          : null;
        
        // Return updated size with projected tier info for UI display
        return {
          ...s,
          projectedTier,
          projectedQuantity: newCollectiveQuantity
        };
      }
      return s;
    });
    
    // Update the deal object with these projected values
    // This doesn't change the actual deal, just the UI representation
    projectedDeal.sizes = updatedSizes;
    
    // Update the quantity
    setSelectedSizes(prev => ({
      ...prev,
      [size]: newQuantity
    }));
  };

  const [redirectLoading, setRedirectLoading] = useState(false);

  const toggleFavorite = async () => {
    if (isFavoriteLoading) return;
    if (!isAuthenticated) {
      setToast({
        open: true,
        message: 'Please login to add to favorites',
        severity: 'error'
      });
      setTimeout(() => 
        setRedirectLoading(true), 2000);
      const currentPath = window.location.pathname;
      localStorage.setItem('redirectPath', currentPath);
      setTimeout(() => window.location.href = '/login', 3000);
      return;
    }
    
    // Only members or admins impersonating members can add to favorites
    if (userRole !== 'member' && !(userRole === 'admin' && isImpersonating)) {
      setToast({
        open: true,
        message: 'Only Co-op members can add deals to favorites',
        severity: 'warning'
      });
      return;
    }
    try {
      setIsFavoriteLoading(true);
      const response = await api.post(
        `/deals/favorite/toggle`,
        { dealId }
      );
      setIsFavorite(!isFavorite);
      setToast({
        open: true,
        message: response.data.message,
        severity: 'success'
      });
    } catch (error) {
      console.error('Error toggling favorite:', error);
      setToast({
        open: true,
        message: error.response?.data?.message || 'Error updating favorites',
        severity: 'error'
      });
    } finally {
      setIsFavoriteLoading(false);
    }
  };

  const handleCommitDeal = async () => {
    if (!deal || isCommitting) return;
    if (!isAuthenticated) {
      setToast({
        open: true,
        message: 'Please login to commit a deal',
        severity: 'error'
      });
      setTimeout(() => 
        setRedirectLoading(true), 2000);
      const currentPath = window.location.pathname;
      localStorage.setItem('redirectPath', currentPath);
      setTimeout(() => window.location.href = '/login', 3000);
      return;
    }
    
    // Only members or admins impersonating members can commit to deals
    if (userRole !== 'member' && !(userRole === 'admin' && isImpersonating)) {
      setToast({
        open: true,
        message: 'Only Co-op members can commit to deals',
        severity: 'warning'
      });
      return;
    }
    
    // Validate that at least one size has a quantity greater than 0
    const hasQuantity = Object.values(selectedSizes).some(qty => qty > 0);
    if (!hasQuantity) {
      setToast({
        open: true,
        message: 'Please select a quantity for at least one size',
        severity: 'error'
      });
      return;
    }
    
    // Prepare size commitments data
    const sizeCommitments = [];
    
    Object.entries(selectedSizes).forEach(([sizeName, quantity]) => {
      if (quantity > 0) {
        const sizeData = deal.sizes.find(s => s.size === sizeName);
        if (sizeData) {
          // Determine if any size-specific tier applies
          let pricePerUnit = sizeData.discountPrice;
          
          // Add to size commitments array
          sizeCommitments.push({
            size: sizeName,
            quantity,
            pricePerUnit
          });
        }
      }
    });

    try {
      setIsCommitting(true);
      const commitmentData = {
        dealId,
        userId: currentUserId,
        sizeCommitments
      };
      
      const response = await api.post(
        `/deals/commit/buy/${dealId}`,
        commitmentData
      );

      setToast({
        open: true,
        message: "Deal commitment submitted successfully!",
        severity: 'success'
      });
      handleCloseGetDeal();
      
      // Refresh deal data after commitment
      const updatedDealResponse = await api.get(`/deals/fetch-single/deal/${dealId}`);
      setDeal(updatedDealResponse.data);
    } catch (error) {
      setToast({
        open: true,
        message: error.response?.data?.message || "Error submitting deal commitment",
        severity: 'error'
      });
    } finally {
      setIsCommitting(false);
      window.location.reload()
    }
  };

  const handleToastClose = () => {
    setToast({ ...toast, open: false });
  };

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }

  if (redirectLoading) {
    return <Box sx={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh'
    }}>
      <CircularProgress size={40} />
    </Box>
  }
  
  return (
    <Container 
      maxWidth={false} 
      sx={{ 
        mt: { xs: 2, md: 4 }, 
        mb: { xs: 4, md: 8 },
        px: { xs: 2, sm: 3, md: 4 },
        bgcolor: 'grey.50',
        minHeight: '100vh'
      }}
    >
      {/* Admin Impersonation Indicator */}
      {isImpersonating && (
        <Box sx={{
          background: 'linear-gradient(45deg, #FF9800 30%, #FFC107 90%)',
          color: 'white',
          py: 1,
          px: 2,
          textAlign: 'center',
          fontWeight: 'bold',
          mb: 2,
          borderRadius: 1
        }}>
          Admin Mode: You are viewing this deal as a member
        </Box>
      )}
      <Box
        sx={{
          position: 'sticky',
          top: 0,
          zIndex: 10,
          bgcolor: 'grey.50',
          py: 2,
          borderBottom: '1px solid',
          borderColor: 'divider',
          mb: { xs: 2, md: 4 }
        }}
      >
        <Button
          startIcon={<ArrowBack sx={{ color: '#000000' }} />}
          onClick={() => navigate('/deals-catlog')}
          sx={{ 
            borderRadius: 2,
            color: theme.palette.primary.contrastText,
            border: `1px solid ${theme.palette.primary.contrastText}`,
            '&:hover': {
              backgroundColor: theme.palette.background.default
            }
          }}
        >
          Back to Deals
        </Button>
      </Box>

      <Grid container spacing={{ xs: 2, md: 4 }} sx={{ mb: 4 }}>
        {/* Image Gallery Section */}
        <Grid item xs={12} md={6} lg={7}>
          <Box sx={{ 
            display: 'flex', 
            flexDirection: 'column', 
            gap: { xs: 1, md: 2 },
            height: '100%',
            position: 'sticky',
            top: 80
          }}>
            {/* Main Image */}
            <Paper
              sx={{
                position: 'relative',
                borderRadius: 3,
                overflow: 'hidden',
                height: { xs: 300, sm: 400, md: 500, lg: 600 },
                bgcolor: 'grey.50',
                transition: 'all 0.3s ease',
                '&:hover': {
                  boxShadow: 6
                }
              }}
            >
              {deal?.images?.length > 0 ? (
                <>
                  {isVideoUrl(deal.images[currentImageIndex]) ? (
                    <Box
                      component="video"
                      src={deal.images[currentImageIndex]}
                      controls
                      autoPlay
                      muted
                      sx={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'contain',
                        p: 2,
                        bgcolor: 'black'
                      }}
                    />
                  ) : (
                    <Box
                      component="img"
                      src={deal.images[currentImageIndex]}
                      alt={deal.name}
                      sx={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'contain',
                        p: 2,
                      }}
                    />
                  )}
                  {deal.images.length > 1 && (
                    <>
                      <IconButton
                        onClick={handlePrevImage}
                        sx={{
                          position: 'absolute',
                          left: { xs: 4, md: 8 },
                          top: '50%',
                          transform: 'translateY(-50%)',
                          bgcolor: theme.palette.background.default,
                          '&:hover': { 
                            bgcolor: theme.palette.background.light,
                            transform: 'translateY(-50%) scale(1.1)',
                          },
                          transition: 'all 0.2s ease',
                          boxShadow: 2,
                        }}
                      >
                        <NavigateBefore sx={{ color: '#000000' }} />
                      </IconButton>
                      <IconButton
                        onClick={handleNextImage}
                        sx={{
                          position: 'absolute',
                          right: { xs: 4, md: 8 },
                          top: '50%',
                          transform: 'translateY(-50%)',
                          bgcolor: theme.palette.background.default,
                          '&:hover': { 
                            bgcolor: theme.palette.background.light,
                            transform: 'translateY(-50%) scale(1.1)',
                          },
                          transition: 'all 0.2s ease',
                          boxShadow: 2,
                        }}
                      >
                        <NavigateNext sx={{ color: '#000000' }} />
                      </IconButton>
                    </>
                  )}
                </>
              ) : (
                <Box
                  sx={{
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Typography color="text.secondary">
                    No images available
                  </Typography>
                </Box>
              )}
            </Paper>

            {/* Thumbnails */}
            {deal?.images?.length > 1 && (
              <Paper
                sx={{
                  p: 1,
                  borderRadius: 3,
                  bgcolor: theme.palette.background.paper,
                  boxShadow: 1
                }}
              >
                <Box
                  sx={{
                    display: 'flex',
                    gap: 1,
                    overflowX: 'auto',
                    px: 0.5,
                    py: 1,
                    '&::-webkit-scrollbar': {
                      height: 6,
                    },
                    '&::-webkit-scrollbar-track': {
                      backgroundColor: theme.palette.grey[100],
                      borderRadius: 3,
                    },
                    '&::-webkit-scrollbar-thumb': {
                      backgroundColor: theme.palette.grey[400],
                      borderRadius: 3,
                      '&:hover': {
                        backgroundColor: theme.palette.grey[500],
                      },
                    },
                  }}
                >
                  {deal.images.map((mediaUrl, index) => (
                    <Box
                      key={index}
                      onClick={() => setCurrentImageIndex(index)}
                      sx={{
                        width: { xs: 60, sm: 80 },
                        height: { xs: 60, sm: 80 },
                        flexShrink: 0,
                        borderRadius: 2,
                        overflow: 'hidden',
                        cursor: 'pointer',
                        border: '2px solid',
                        borderColor: currentImageIndex === index ? theme.palette.primary.main : 'transparent',
                        transition: 'all 0.2s ease',
                        '&:hover': {
                          transform: 'scale(1.05)',
                          boxShadow: 3
                        },
                        position: 'relative'
                      }}
                    >
                      {isVideoUrl(mediaUrl) ? (
                        <>
                          <Box
                            component="video"
                            src={mediaUrl}
                            sx={{
                              width: '100%',
                              height: '100%',
                              objectFit: 'cover',
                            }}
                          />
                          <Box
                            sx={{
                              position: 'absolute',
                              top: 0,
                              left: 0,
                              width: '100%',
                              height: '100%',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              backgroundColor: 'rgba(0, 0, 0, 0.3)',
                            }}
                          >
                            <PlayArrow sx={{ color: '#000000', fontSize: 24 }} />
                          </Box>
                        </>
                      ) : (
                        <Box
                          component="img"
                          src={mediaUrl}
                          alt={`${deal.name} - ${index + 1}`}
                          sx={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                          }}
                        />
                      )}
                    </Box>
                  ))}
                </Box>
              </Paper>
            )}
          </Box>
        </Grid>

        {/* Deal Details */}
        <Grid item xs={12} md={6} lg={5}>
          <Box sx={{ 
            height: '100%', 
            display: 'flex', 
            flexDirection: 'column', 
            gap: { xs: 2, md: 3 },
            position: 'sticky',
            top: 80
          }}>
            {/* Deal Title and Price */}
            <Paper
              sx={{
                p: { xs: 2, sm: 3 },
                borderRadius: 3,
                bgcolor: theme.palette.background.paper,
                boxShadow: 1
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, mb: 2 }}>
                <Typography 
                  variant="h4" 
                  fontWeight="bold" 
                  sx={{ 
                    fontSize: { xs: '1.5rem', sm: '2rem', md: '2.25rem' },
                    lineHeight: 1.2,
                    flex: 1
                  }}
                >
                  {deal?.name}
                </Typography>
                {deal?.sizes && deal.sizes.length > 0 && (
                  <Chip 
                    label={
                      deal.sizes.length === 1 
                        ? `Save ${Math.round(((deal.sizes[0].originalCost - deal.sizes[0].discountPrice) / deal.sizes[0].originalCost) * 100)}%`
                        : `Save up to ${Math.max(...deal.sizes.map(size => 
                            Math.round(((size.originalCost - size.discountPrice) / size.originalCost) * 100)
                          ))}%`
                    }
                    color="error"
                    size="large"
                    sx={{ 
                      borderRadius: 1,
                      '& .MuiChip-label': {
                        px: 2,
                        py: 0.5,
                        fontSize: '1rem',
                        fontWeight: 600
                      }
                    }}
                  />
                )}
              </Box>
              
              {/* Size options and prices */}
              {deal?.sizes && deal.sizes.length > 0 && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                    Available Sizes
                  </Typography>
                  <TableContainer component={Paper} elevation={0} variant="outlined" sx={{ mb: 2 }}>
                    <Table>
                      <TableHead>
                        <TableRow sx={{ bgcolor: 'grey.50' }}>
                          <TableCell>Size</TableCell>
                          <TableCell align="right">Original Price</TableCell>
                          <TableCell align="right">Discount Price</TableCell>
                          <TableCell align="right">Savings</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {deal.sizes.map((size, index) => {
                          const savingsAmount = size.originalCost - size.discountPrice;
                          const savingsPercent = ((savingsAmount / size.originalCost) * 100).toFixed(1);
                          
                          return (
                            <TableRow key={index}>
                              <TableCell>
                                <Typography variant="body1" fontWeight="medium">
                                  {size.size}
                                </Typography>
                              </TableCell>
                              <TableCell align="right">
                                <Typography variant="body2" color="text.secondary" sx={{ textDecoration: 'line-through' }}>
                                  ${size.originalCost.toFixed(2)}
                                </Typography>
                              </TableCell>
                              <TableCell align="right">
                                <Typography variant="body1" color="text.secondary" fontWeight="medium">
                                  ${size.discountPrice.toFixed(2)}
                                </Typography>
                              </TableCell>
                              <TableCell align="right">
                                <Chip 
                                  label={`${savingsPercent}%`} 
                                  size="small"
                                  color={theme.palette.success.main}
                                  sx={{ fontWeight: 'medium' }}
                                />
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </TableContainer>
                  
                  <PriceDisclaimer variant="text" sx={{ mt: 1 }} />
                </Box>
              )}

              {/* Category and Status Chips */}
              <Stack 
                direction="row" 
                spacing={1} 
                sx={{ 
                  flexWrap: 'wrap', 
                  gap: 1,
                  '& > *': {
                    marginTop: '4px !important',
                    marginLeft: '0px !important',
                    marginRight: '8px !important',
                  }
                }}
              >
                <Chip 
                  icon={<LocalOffer sx={{ color: '#000000' }} />} 
                  label={deal?.category} 
                  color={theme.palette.error.main} 
                  variant="outlined"
                  sx={{
                    borderRadius: 1,
                    '& .MuiChip-label': { px: 1 }
                  }}
                />
                {deal?.sizes && deal.sizes.length > 1 && (
                  <Chip 
                    label="Mix & Match" 
                    size="medium"
                    sx={{ 
                      fontWeight: 'bold',
                      background: 'linear-gradient(45deg, #FF8E53 30%, #FE6B8B 90%)',
                      color: 'white',
                      borderRadius: 1,
                      '& .MuiChip-label': { px: 1 }
                    }}
                  />
                )}
                <Chip
                  label={`Min Qty: ${deal?.minQtyForDiscount}`}
                  color="info" 
                  variant="outlined"
                  sx={{
                    borderRadius: 1,
                    '& .MuiChip-label': { px: 1 }
                  }}
                />
                
                <Chip 
                  label={`Remaining Quantity: ${deal?.minQtyForDiscount - (deal?.totalCommittedQuantity || 0)}`}
                  color="success" 
                  variant="outlined"
                  sx={{
                    borderRadius: 1,
                    '& .MuiChip-label': { px: 1 }
                  }}
                />

                {(deal?.totalCommittedQuantity || 0) >= (deal?.minQtyForDiscount || 0) ? (
                  <Chip
                    label="Deal is LIVE"
                    color="success"
                    sx={{
                      borderRadius: 1,
                      fontWeight: 'bold',
                      '& .MuiChip-label': { px: 1 }
                    }}
                  />
                ) : (
                  <Chip
                    label={`${Math.max(0, (deal?.minQtyForDiscount || 0) - (deal?.totalCommittedQuantity || 0))} more to go`}
                    color="warning"
                    sx={{
                      borderRadius: 1,
                      fontWeight: 'bold',
                      '& .MuiChip-label': { px: 1 }
                    }}
                  />
                )}

                {deal?.totalSold > 0 && (
                  <Chip 
                    icon={<ShoppingCart />}
                    label={`${deal.totalSold} units sold`}
                    color="success" 
                    variant="outlined"
                    sx={{
                      borderRadius: 1,
                      '& .MuiChip-label': { px: 1 }
                    }}
                  />
                )}
              </Stack>
              
              {/* Deal Progress Bar */}
              {deal?.minQtyForDiscount > 0 && (
                <Box sx={{ mt: 3 }}>
                  <Typography variant="subtitle1" fontWeight="bold" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    Deal Progress
                    {(deal?.totalCommittedQuantity || 0) >= (deal?.minQtyForDiscount || 0) && (
                      <CheckCircleIcon sx={{ color: '#000000' }} />
                    )}
                  </Typography>
                  
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                    <Box sx={{ flexGrow: 1 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                        <Typography variant="body2" color="text.secondary">
                          {deal?.totalCommittedQuantity || 0} of {deal?.minQtyForDiscount} committed
                        </Typography>
                        <Typography variant="body2" color="text.secondary" fontWeight="bold">
                          {Math.min(100, Math.round(((deal?.totalCommittedQuantity || 0) / (deal?.minQtyForDiscount || 1)) * 100))}%
                        </Typography>
                      </Box>
                      <LinearProgress 
                        variant="determinate" 
                        value={Math.min(100, Math.round(((deal?.totalCommittedQuantity || 0) / (deal?.minQtyForDiscount || 1)) * 100))}
                        sx={{ height: 8, borderRadius: 2 }}
                        color={(deal?.totalCommittedQuantity || 0) >= (deal?.minQtyForDiscount || 0) ? "success" : "primary"}
                      />
                    </Box>
                  </Box>
                  
                  {(deal?.totalCommittedQuantity || 0) >= (deal?.minQtyForDiscount || 0) ? (
                    <Alert severity="success" variant="outlined" sx={{ mb: 2 }}>
                      <AlertTitle>Deal is Committed!</AlertTitle>
                      <Typography variant="body2">
                        The minimum quantity threshold has been reached. This deal is now active and all commitments will be processed at the discounted rate.
                      </Typography>
                    </Alert>
                  ) : (
                    <Alert severity="info" variant="outlined" sx={{ mb: 2 }}>
                      <AlertTitle>Almost there!</AlertTitle>
                      <Typography variant="body2">
                        <strong>{Math.max(0, (deal?.minQtyForDiscount || 0) - (deal?.totalCommittedQuantity || 0))}</strong> more units needed. Share with other members to reach the goal faster!
                      </Typography>
                    </Alert>
                  )}
                </Box>
              )}
              
              {/* Size-specific discount tiers */}
              {deal?.sizes && deal.sizes.some(size => size.discountTiers && size.discountTiers.length > 0) && (
                <>
                  <Typography variant="subtitle1" fontWeight="bold" sx={{ mt: 3, mb: 1 }}>
                    Size-Specific Volume Discount Tiers
                  </Typography>
                  
                  <Alert severity="info" color="primary.contrastText" sx={{ mb: 2 }}>
                    <AlertTitle>Collective Volume Discounts</AlertTitle>
                    <Typography variant="body2">
                      Discount tiers are applied based on the <strong>total quantity across all members</strong>. 
                      When the collective total for a size reaches a tier threshold, <strong>all members</strong> receive that discount pricing automatically!
                    </Typography>
                  </Alert>
                  
                  {deal.sizes.map((size, sizeIndex) => {
                    if (!size.discountTiers || size.discountTiers.length === 0) return null;
                    
                    // Get the current quantity for this size from this user
                    const userQuantity = selectedSizes[size.size] || 0;
                    
                    // Get collective quantity from all members for this size
                    const collectiveQuantity = (deal.sizeCommitments && deal.sizeCommitments[size.size]) || 0;
                    
                    // Get previous user commitment for this size if updating
                    let previousQuantity = 0;
                    if (userCommitment) {
                      const previousSizeCommitment = userCommitment.sizeCommitments.find(sc => sc.size === size.size);
                      if (previousSizeCommitment) {
                        previousQuantity = previousSizeCommitment.quantity;
                      }
                    }
                    
                    // Calculate what the total would be with this user's new commitment
                    const projectedTotalQuantity = collectiveQuantity - previousQuantity + userQuantity;
                    
                    // Sort tiers by quantity for display
                    const sortedTiers = [...size.discountTiers].sort((a, b) => a.tierQuantity - b.tierQuantity);
                    
                    // Find the currently applied tier and next tier
                    let currentTier = null;
                    let nextTier = null;
                    
                    for (let i = 0; i < sortedTiers.length; i++) {
                      if (collectiveQuantity >= sortedTiers[i].tierQuantity) {
                        currentTier = sortedTiers[i];
                        if (i < sortedTiers.length - 1) {
                          nextTier = sortedTiers[i+1];
                        }
                      } else {
                        if (!nextTier) {
                          nextTier = sortedTiers[i];
                        }
                        break;
                      }
                    }

                    // Find projected tier based on user's current selection
                    let projectedTier = null;
                    let projectedNextTier = null;
                    
                    for (let i = 0; i < sortedTiers.length; i++) {
                      if (projectedTotalQuantity >= sortedTiers[i].tierQuantity) {
                        projectedTier = sortedTiers[i];
                        if (i < sortedTiers.length - 1) {
                          projectedNextTier = sortedTiers[i+1];
                        }
                      } else {
                        if (!projectedNextTier) {
                          projectedNextTier = sortedTiers[i];
                        }
                        break;
                      }
                    }
                    
                    const wouldUnlockNewTier = projectedTier && currentTier && projectedTier.tierQuantity > currentTier.tierQuantity;
                    const wouldLoseTier = currentTier && (!projectedTier || projectedTier.tierQuantity < currentTier.tierQuantity);
                    
                    return (
                      <Box key={sizeIndex} sx={{ mb: 3 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                          <Typography variant="body1" fontWeight="medium" sx={{ mr: 1 }}>
                            {size.size}
                          </Typography>
                          <Chip 
                            size="small" 
                            label={`Your Selection: ${userQuantity} units`}
                            color="primary.contrastText"
                            variant="outlined"
                          />
                          <Chip 
                            size="small" 
                            label={`Current Total: ${collectiveQuantity} units`}
                            color="secondary"
                            variant="outlined"
                            sx={{ ml: 1 }}
                          />
                          <Chip 
                            size="small" 
                            label={`Projected: ${projectedTotalQuantity} units`}
                            color={wouldUnlockNewTier ? "success" : wouldLoseTier ? "error" : "info"}
                            variant="outlined"
                            sx={{ ml: 1 }}
                          />
                        </Box>
                        
                        {wouldUnlockNewTier && (
                          <Alert severity="success" sx={{ mb: 2 }}>
                            <AlertTitle>You'll unlock a new tier!</AlertTitle>
                            <Typography variant="body2">
                              Your commitment would help unlock the {projectedTier.tierQuantity}+ tier with price ${projectedTier.tierDiscount.toFixed(2)} per unit!
                            </Typography>
                          </Alert>
                        )}
                        
                        {wouldLoseTier && (
                          <Alert severity="warning" sx={{ mb: 2 }}>
                            <AlertTitle>Tier discount may be lost</AlertTitle>
                            <Typography variant="body2">
                              Reducing quantity may cause all members to lose the {currentTier.tierQuantity}+ unit discount tier.
                            </Typography>
                          </Alert>
                        )}

                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, pl: 2 }}>
                          {sortedTiers.map((tier, tierIndex) => {
                            const isCurrentlyApplied = collectiveQuantity >= tier.tierQuantity;
                            const wouldBeApplied = projectedTotalQuantity >= tier.tierQuantity;
                            const isNext = nextTier && tier.tierQuantity === nextTier.tierQuantity;
                            const unitsNeeded = tier.tierQuantity - projectedTotalQuantity;
                            const statusChanged = isCurrentlyApplied !== wouldBeApplied;
                            
                            return (
                              <Paper
                                key={tierIndex}
                                variant="outlined"
                                sx={{
                                  p: 1.5,
                                  borderRadius: 1,
                                  display: 'flex',
                                  flexDirection: { xs: 'column', sm: 'row' },
                                  alignItems: { xs: 'flex-start', sm: 'center' },
                                  justifyContent: 'space-between',
                                  bgcolor: wouldBeApplied ? theme.palette.success.light : 
                                           isCurrentlyApplied && !wouldBeApplied ? theme.palette.error.light : 
                                           isNext ? theme.palette.info.light : theme.palette.background.paper,
                                  color: (wouldBeApplied || isCurrentlyApplied && !wouldBeApplied || isNext) ? theme.palette.text.primary : theme.palette.inherit.main,
                                  borderColor: wouldBeApplied ? theme.palette.success.main : 
                                               isCurrentlyApplied && !wouldBeApplied ? theme.palette.error.main : 
                                               isNext ? theme.palette.info.main : theme.palette.divider,
                                  gap: 1
                                }}
                              >
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <Typography variant="body1">
                                    ${tier.tierDiscount.toFixed(2)} per unit at {tier.tierQuantity}+ units
                                  </Typography>
                                </Box>
                                <Box>
                                  {wouldBeApplied ? (
                                    <Chip
                                      label={isCurrentlyApplied ? "APPLIED" : "WILL BE APPLIED"} 
                                      color="success"
                                      size="small"
                                      sx={{ 
                                        bgcolor: theme.palette.background.default, 
                                        color: theme.palette.success.dark, 
                                        fontWeight: 'bold' 
                                      }}
                                    />
                                  ) : isCurrentlyApplied ? (
                                    <Chip
                                      label="WILL BE LOST" 
                                      color="error"
                                      size="small"
                                      sx={{ 
                                        bgcolor: theme.palette.background.default, 
                                        color: theme.palette.error.dark, 
                                        fontWeight: 'bold' 
                                      }}
                                    />
                                  ) : (
                                    <Chip
                                      label={`${unitsNeeded} more needed`} 
                                      color="primary"
                                      size="small"
                                      sx={{ 
                                        bgcolor: theme.palette.background.default, 
                                        color: isNext ? theme.palette.info.dark : theme.palette.text.primary, 
                                        fontWeight: 'bold' 
                                      }}
                                    />
                                  )}
                                </Box>
                              </Paper>
                            );
                          })}
                        </Box>
                      </Box>
                    );
                  })}
                </>
              )}
              
              {/* Global discount tiers (legacy) */}
              {deal?.discountTiers && deal.discountTiers.length > 0 && (
                <Box sx={{ mt: 3 }}>
                  <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                    Volume Discount Tiers
                  </Typography>
                  <Box 
                    sx={{ 
                      display: 'flex', 
                      flexDirection: 'column',
                      gap: 1,
                      mt: 1
                    }}
                  >
                    {deal.discountTiers.map((tier, index) => (
                      <Paper
                        key={index}
                        variant="outlined"
                        sx={{
                          p: 1.5,
                          borderRadius: 1,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          bgcolor: activeTier === tier ? theme.palette.success.light : theme.palette.background.paper,
                          color: activeTier === tier ? theme.palette.text.primary : theme.palette.inherit.main,
                          borderColor: activeTier === tier ? theme.palette.success.main : theme.palette.divider
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          {activeTier === tier ? (
                            <CheckCircleIcon sx={{ color: '#000000' }} fontSize="small" />
                          ) : (
                            <TrendingUp sx={{ color: '#000000' }} fontSize="small" />
                          )}
                          <Typography variant="body1">
                            ${tier.tierDiscount.toFixed(2)} fixed price at {tier.tierQuantity}+ units
                          </Typography>
                        </Box>
                        {activeTier === tier && (
                          <Chip 
                            label="Active" 
                            color="success" 
                            size="small"
                            sx={{ bgcolor: theme.palette.background.default, color: theme.palette.success.dark, fontWeight: 'bold' }}
                          />
                        )}
                      </Paper>
                    ))}
                  </Box>
                </Box>
              )}
            </Paper>

            {/* Description */}
            <Paper
              sx={{
                p: { xs: 2, sm: 3 },
                borderRadius: 3,
                bgcolor: theme.palette.background.paper,
                boxShadow: 1
              }}
            >
              <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                Special Content
              </Typography>
              <Typography 
                variant="body1" 
                color="text.secondary"
                sx={{
                  lineHeight: 1.6,
                  fontSize: { xs: '0.875rem', sm: '1rem' },
                  whiteSpace: 'pre-line' // Preserve line breaks in description
                }}
              >
                {deal?.description}
              </Typography>
            </Paper>
            {deal?.singleStoreDeals && (
  <Paper
    sx={{
      p: { xs: 2, sm: 3 },
      borderRadius: 3,
      bgcolor: theme.palette.background.paper,
      boxShadow: 1
    }}
  >
    <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
      Single Store Deals
    </Typography>
    <Typography 
      variant="body1" 
      color="text.secondary"
      sx={{
        lineHeight: 1.6,
        fontSize: { xs: '0.875rem', sm: '1rem' },
        whiteSpace: 'pre-line' // Preserve line breaks in description
      }}
    >
      {deal.singleStoreDeals}
    </Typography>
  </Paper>
)}

            {/* Deal Info Card */}
            <Paper 
              sx={{ 
                p: { xs: 2, sm: 3 }, 
                borderRadius: 3,
                bgcolor: theme.palette.background.paper,
                boxShadow: 1
              }}
            >
              <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                Deal Statistics
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Groups sx={{ color: '#000000' }} fontSize="small" />
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Minimum Quantity
                      </Typography>
                      <Typography variant="body1" fontWeight="500">
                        {deal?.minQtyForDiscount} units
                      </Typography>
                    </Box>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Schedule sx={{ color: '#000000' }} fontSize="small" />
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Commitment Period
                      </Typography>
                      <Typography variant="body1" fontWeight="500">
                        {deal?.commitmentStartAt && deal?.commitmentEndsAt ? (
                          <>
                            {new Date(deal.commitmentStartAt).toLocaleDateString()} - {new Date(deal.commitmentEndsAt).toLocaleDateString()}
                          </>
                        ) : (
                          'Not specified'
                        )}
                      </Typography>
                    </Box>
                  </Box>
                </Grid>
                <Grid item xs={12}>
                  <Divider sx={{ my: 1 }} />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <ShoppingCart sx={{ color: '#000000' }} fontSize="small" />
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Total Commitments
                      </Typography>
                      <Typography variant="body1" fontWeight="500" color="success.main">
                        {deal?.totalCommittedQuantity || 0} commitments
                      </Typography>
                    </Box>
                  </Box>
                </Grid>
              </Grid>

              {/* Commitment Period Status */}
              {deal?.commitmentStartAt && deal?.commitmentEndsAt && (
                <Box sx={{ mt: 2, p: 2, bgcolor: 'rgba(0,0,0,0.02)', borderRadius: 2 }}>
                  <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                    Commitment Period Status
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    {isCommitmentPeriodEnded() ? (
                      <Chip
                        size="small"
                        label="Period Ended"
                        color="error"
                        sx={{ fontWeight: 'bold' }}
                      />
                    ) : !isCommitmentPeriodActive() ? (
                      <Chip
                        size="small"
                        label="Not Started"
                        color="warning"
                        sx={{ fontWeight: 'bold' }}
                      />
                    ) : (
                      <Chip
                        size="small"
                        label="Active"
                        color="success"
                        sx={{ fontWeight: 'bold' }}
                      />
                    )}
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    {isCommitmentPeriodEnded() 
                      ? `Commitment period ended on ${new Date(deal.commitmentEndsAt).toLocaleDateString()}`
                      : !isCommitmentPeriodActive()
                      ? `Commitment period starts on ${new Date(deal.commitmentStartAt).toLocaleDateString()}`
                      : `Commitment period is active until ${new Date(deal.commitmentEndsAt).toLocaleDateString()}`
                    }
                  </Typography>
                </Box>
              )}
            </Paper>

            {/* Distributor Info Card */}
            <Paper 
              sx={{ 
                p: { xs: 2, sm: 3 }, 
                borderRadius: 3,
                bgcolor: theme.palette.background.paper,
                boxShadow: 1
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                {deal?.distributor?.logo ? (
                  <Avatar 
                    src={deal.distributor.logo} 
                    alt={deal.distributor.businessName}
                    sx={{ width: 64, height: 64 }}
                  />
                ) : (
                  <Avatar 
                    sx={{ 
                      width: 64, 
                      height: 64, 
                      bgcolor: theme.palette.primary.main,
                      fontSize: '1.5rem'
                    }}
                  >
                    {deal?.distributor?.businessName?.charAt(0) || 'D'}
                  </Avatar>
                )}
                <Box>
                  <Typography variant="h6" fontWeight="bold">
                    {deal?.distributor?.businessName || 'Unknown Business'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Verified Distributor
                  </Typography>
                </Box>
              </Box>
              
              <Grid container spacing={2}>
                {deal?.distributor?.contactPerson && (
                  <Grid item xs={12} sm={6}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Person sx={{ color: '#000000' }} fontSize="small" />
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          Contact Person
                        </Typography>
                        <Typography variant="body1">
                          {deal.distributor.contactPerson}
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>
                )}
                {deal?.distributor?.email && (
                  <Grid item xs={12} sm={6}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Email sx={{ color: '#000000' }} fontSize="small" />
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          Email
                        </Typography>
                        <Typography variant="body1">
                          {deal.distributor.email}
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>
                )}
                {deal?.distributor?.phone && (
                  <Grid item xs={12} sm={6}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Phone sx={{ color: '#000000' }} fontSize="small" />
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          Phone
                        </Typography>
                        <Typography variant="body1">
                          {deal.distributor.phone}
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>
                )}
              </Grid>

              {/* Supplier Information Section */}
              {deal?.supplierInfo && deal.supplierInfo.length > 0 && (
                <>
                  <Divider sx={{ my: 3 }} />
                  <Typography variant="h6" fontWeight="bold" gutterBottom>
                    {deal.supplierInfo.length > 1 ? 'Your Assigned Suppliers' : 'Your Assigned Supplier'}
                  </Typography>
                  
                  {/* Add count indicator for multiple suppliers */}
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Typography variant="subtitle1" color="text.secondary">
                      {deal.supplierInfo.length > 1 
                        ? `This distributor has assigned ${deal.supplierInfo.length} suppliers for you` 
                        : 'This distributor has assigned a supplier for you'}
                    </Typography>
                    {deal.supplierInfo.length > 1 && (
                      <Chip 
                        label={deal.supplierInfo.length}
                        color="secondary"
                        size="small"
                        sx={{ ml: 1, fontWeight: 'bold' }}
                      />
                    )}
                  </Box>
                  
                  {deal.supplierInfo.map((supplier, index) => (
                    <Box key={supplier._id || index} sx={{ mb: index < deal.supplierInfo.length - 1 ? 2 : 0 }}>
                      {index > 0 && <Divider sx={{ my: 2 }} />}
                      
                      <Grid container spacing={2}>
                        <Grid item xs={12} sm={6}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Store sx={{ color: '#000000' }} fontSize="small" />
                            <Box>
                              <Typography variant="body2" color="text.secondary">
                                Supplier Name
                              </Typography>
                              <Typography variant="body1" fontWeight="medium">
                                {supplier.name}
                              </Typography>
                            </Box>
                          </Box>
                        </Grid>
                        {supplier.email && (
                          <Grid item xs={12} sm={6}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Email sx={{ color: '#000000' }} fontSize="small" />
                              <Box>
                                <Typography variant="body2" color="text.secondary">
                                  Supplier Email
                                </Typography>
                                <Typography variant="body1">
                                  {supplier.email}
                                </Typography>
                              </Box>
                            </Box>
                          </Grid>
                        )}
                      </Grid>
                    </Box>
                  ))}
                </>
              )}
            </Paper>

            {/* Action Buttons */}
            <Box sx={{ 
              mt: 'auto', 
              display: 'flex', 
              gap: 2,
              position: 'sticky',
              bottom: 0,
              bgcolor: theme.palette.background.paper,
              py: 2,
              borderTop: '1px solid',
              borderColor: 'divider',
              zIndex: 1
            }}>
              {isCommitmentPeriodEnded() ? (
                <Alert severity="warning" sx={{ width: '100%', borderRadius: 2 }}>
                  <AlertTitle>Commitment Period Ended</AlertTitle>
                  <Typography variant="body2">
                    The commitment period for this deal ended on {new Date(deal?.commitmentEndsAt).toLocaleDateString()}. 
                    You can no longer make new commitments to this deal.
                  </Typography>
                </Alert>
              ) : !isCommitmentPeriodActive() ? (
                <Alert severity="info" sx={{ width: '100%', borderRadius: 2 }}>
                  <AlertTitle>Commitment Period Not Started</AlertTitle>
                  <Typography variant="body2">
                    The commitment period for this deal starts on {new Date(deal?.commitmentStartAt).toLocaleDateString()}. 
                    You can make commitments during the active period.
                  </Typography>
                </Alert>
              ) : !canPerformCommitmentActions() ? (
                <Button
                  variant="outlined"
                  fullWidth
                  disabled
                  sx={{ 
                    py: 1.5,
                    borderRadius: 2,
                    textTransform: 'none',
                    fontWeight: 600,
                    color: theme.palette.text.disabled,
                    borderColor: theme.palette.text.disabled
                  }}
                >
                  No Permission to Commit
                </Button>
              ) : (
                <Button
                  variant="contained"
                  fullWidth
                  onClick={handleGetDeal}
                  disabled={isCommitting}
                  sx={{ 
                    py: 1.5,
                    borderRadius: 2,
                    textTransform: 'none',
                    fontWeight: 600,
                    boxShadow: 2,
                    background: userCommitment ? theme.palette.success.main : theme.palette.primary.main,
                    '&:hover': {
                      boxShadow: 4,
                    background: userCommitment ? theme.palette.success.main : theme.palette.primary.main,
                    }
                  }}
                  startIcon={userCommitment ? <EditIcon sx={{ color: '#000000' }} /> : <AddShoppingCart sx={{ color: '#000000' }} />}
                >
                  {userCommitment ? 'Update Your Commitment' : 'Make Commitment'}
                </Button>
              )}
            </Box>
          </Box>
        </Grid>
      </Grid>

      {/* Get Deal Dialog */}
      <Dialog 
        open={getDealOpen} 
        onClose={handleCloseGetDeal} 
        fullWidth 
        maxWidth="md"
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Typography variant="h6" fontWeight="bold">
            {userCommitment ? 'Edit Commitment' : 'Make Commitment'}: {deal?.name}
          </Typography>
        </DialogTitle>
        <DialogContent sx={{ pt: '16px !important' }}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={8}>
              <Typography variant="h6" gutterBottom>
                Size & Quantity Selection
              </Typography>
              
              {/* Size selection with quantity inputs */}
              {deal?.sizes && (
                <TableContainer component={Paper} variant="outlined" sx={{ mb: 3 }}>
                  <Table>
                    <TableHead>
                      <TableRow sx={{ bgcolor: 'grey.50' }}>
                        <TableCell>Size</TableCell>
                        <TableCell align="right">Unit Price</TableCell>
                        <TableCell align="right">Quantity</TableCell>
                        <TableCell align="right">Subtotal</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {deal.sizes.map((size, index) => {
                        const quantity = selectedSizes[size.size] || 0;
                        
                        // Get current total collective quantity for this size
                        const collectiveQuantity = (deal.sizeCommitments && deal.sizeCommitments[size.size]) || 0;
                        
                        // Get previous user commitment for this size if updating
                        let previousQuantity = 0;
                        if (userCommitment) {
                          const previousSizeCommitment = userCommitment.sizeCommitments.find(sc => sc.size === size.size);
                          if (previousSizeCommitment) {
                            previousQuantity = previousSizeCommitment.quantity;
                          }
                        }
                        
                        // Calculate projected collective quantity after this change
                        const projectedQuantity = collectiveQuantity - previousQuantity + quantity;
                        
                        // Determine if any tier discount applies based on projected quantity
                        let effectivePrice = size.discountPrice;
                        let appliedTier = null;
                        let projectedTier = null;
                        let priceWillChange = false;
                        
                        if (size.discountTiers && size.discountTiers.length > 0) {
                          // Sort tiers by quantity (highest first) to find the best applicable tier
                          const sortedTiers = [...size.discountTiers].sort((a, b) => b.tierQuantity - a.tierQuantity);
                          
                          // Find the tier based on current collective quantity
                          appliedTier = sortedTiers.find(tier => collectiveQuantity >= tier.tierQuantity);
                          
                          // Find the tier based on projected quantity
                          projectedTier = sortedTiers.find(tier => projectedQuantity >= tier.tierQuantity);
                          
                          // Determine if price will change
                          const currentPrice = appliedTier ? appliedTier.tierDiscount : size.discountPrice;
                          const projectedPrice = projectedTier ? projectedTier.tierDiscount : size.discountPrice;
                          priceWillChange = currentPrice !== projectedPrice;
                          
                          // Use projected tier for display
                          if (projectedTier) {
                            effectivePrice = projectedTier.tierDiscount;
                          }
                        }
                        
                        const subtotal = quantity * effectivePrice;
                        
                        return (
                          <TableRow key={index}>
                            <TableCell>
                              <Typography variant="body1" fontWeight="medium">
                                {size.size}
                              </Typography>
                              {appliedTier && !projectedTier && (
                                <Typography variant="caption" color="error.main" sx={{ display: 'block' }}>
                                  Will lose tier discount if submitted
                                </Typography>
                              )}
                              {!appliedTier && projectedTier && (
                                <Typography variant="caption" color="success.main" sx={{ display: 'block' }}>
                                  Will gain tier discount if submitted
                                </Typography>
                              )}
                              {appliedTier && projectedTier && appliedTier.tierQuantity !== projectedTier.tierQuantity && (
                                <Typography variant="caption" color={appliedTier.tierQuantity < projectedTier.tierQuantity ? "success.main" : "warning.main"} sx={{ display: 'block' }}>
                                  Tier will change: {appliedTier.tierQuantity}+ → {projectedTier.tierQuantity}+
                                </Typography>
                              )}
                            </TableCell>
                            <TableCell align="right">
                              <Typography 
                                variant="body1" 
                                color={priceWillChange ? (effectivePrice < size.discountPrice ? "success.main" : "error.main") : "primary.contrastText"}
                              >
                                ${effectivePrice.toFixed(2)}
                              </Typography>
                              {priceWillChange && (
                                <Typography 
                                  variant="caption" 
                                  color={effectivePrice < size.discountPrice ? "success.main" : "error.main"} 
                                  sx={{ display: 'block', textDecoration: effectivePrice < size.discountPrice ? 'line-through' : 'none' }}
                                >
                                  {effectivePrice < size.discountPrice ? `was $${size.discountPrice.toFixed(2)}` : `was $${(appliedTier ? appliedTier.tierDiscount : size.discountPrice).toFixed(2)}`}
                                </Typography>
                              )}
                              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontSize: '0.65rem', fontStyle: 'italic' }}>
                                per bottle
                              </Typography>
                            </TableCell>
                            <TableCell align="right">
                              <TextField
                                type="number"
                                variant="outlined"
                                size="small"
                                value={quantity}
                                onChange={(e) => handleSizeQuantityChange(size.size, e.target.value)}
                                inputProps={{ min: 0, style: { textAlign: 'center' } }}
                                disabled={!canPerformCommitmentActions()}
                                sx={{ width: 80 }}
                              />
                            </TableCell>
                            <TableCell align="right">
                              <Typography 
                                variant="body1" 
                                fontWeight="medium"
                                color={priceWillChange ? (effectivePrice < size.discountPrice ? "success.main" : "error.main") : "primary.contrastText"}
                              >
                                ${subtotal.toFixed(2)}
                              </Typography>
                              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontSize: '0.65rem', fontStyle: 'italic' }}>
                                case total
                              </Typography>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                      <TableRow sx={{ bgcolor: 'grey.50' }}>
                        <TableCell colSpan={2}>
                          <Typography variant="body1" fontWeight="bold">
                            Total
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="body1" fontWeight="bold">
                            {totalQuantity}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="body1" fontWeight="bold">
                            ${totalPrice.toFixed(2)}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
              
              {/* Size-specific discount tiers */}
              {deal?.sizes && deal.sizes.some(size => size.discountTiers && size.discountTiers.length > 0) && (
                <>
                  <Typography variant="subtitle1" fontWeight="bold" sx={{ mt: 3, mb: 1 }}>
                    Size-Specific Volume Discount Tiers
                  </Typography>
                  
                                        <Alert severity="info" sx={{ mb: 2 }}>
                        <AlertTitle>Collective Volume Discounts</AlertTitle>
                        <Typography variant="body2">
                          Discount tiers are applied based on the <strong>total quantity across all members</strong>.
                          When the collective total for a size reaches a tier threshold, <strong>all members</strong> receive that discount pricing automatically!
                        </Typography>
                      </Alert>
                  
                  {deal.sizes.map((size, sizeIndex) => {
                    if (!size.discountTiers || size.discountTiers.length === 0) return null;
                    
                    // Get the current quantity for this size from this user
                    const userQuantity = selectedSizes[size.size] || 0;
                    
                    // Get collective quantity from all members for this size
                    const collectiveQuantity = (deal.sizeCommitments && deal.sizeCommitments[size.size]) || 0;
                    
                    // Get previous user commitment for this size if updating
                    let previousQuantity = 0;
                    if (userCommitment) {
                      const previousSizeCommitment = userCommitment.sizeCommitments.find(sc => sc.size === size.size);
                      if (previousSizeCommitment) {
                        previousQuantity = previousSizeCommitment.quantity;
                      }
                    }
                    
                    // Calculate what the total would be with this user's new commitment
                    const projectedTotalQuantity = collectiveQuantity - previousQuantity + userQuantity;
                    
                    // Sort tiers by quantity for display
                    const sortedTiers = [...size.discountTiers].sort((a, b) => a.tierQuantity - b.tierQuantity);
                    
                    // Find the currently applied tier and next tier
                    let currentTier = null;
                    let nextTier = null;
                    
                    for (let i = 0; i < sortedTiers.length; i++) {
                      if (collectiveQuantity >= sortedTiers[i].tierQuantity) {
                        currentTier = sortedTiers[i];
                        if (i < sortedTiers.length - 1) {
                          nextTier = sortedTiers[i+1];
                        }
                      } else {
                        if (!nextTier) {
                          nextTier = sortedTiers[i];
                        }
                        break;
                      }
                    }

                    // Find projected tier based on user's current selection
                    let projectedTier = null;
                    let projectedNextTier = null;
                    
                    for (let i = 0; i < sortedTiers.length; i++) {
                      if (projectedTotalQuantity >= sortedTiers[i].tierQuantity) {
                        projectedTier = sortedTiers[i];
                        if (i < sortedTiers.length - 1) {
                          projectedNextTier = sortedTiers[i+1];
                        }
                      } else {
                        if (!projectedNextTier) {
                          projectedNextTier = sortedTiers[i];
                        }
                        break;
                      }
                    }
                    
                    const wouldUnlockNewTier = projectedTier && currentTier && projectedTier.tierQuantity > currentTier.tierQuantity;
                    const wouldLoseTier = currentTier && (!projectedTier || projectedTier.tierQuantity < currentTier.tierQuantity);
                    
                    return (
                      <Box key={sizeIndex} sx={{ mb: 3 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                          <Typography variant="body1" fontWeight="medium" sx={{ mr: 1 }}>
                            {size.size}
                          </Typography>
                          <Chip 
                            size="small" 
                            label={`Your Selection: ${userQuantity} units`}
                            color="primary.contrastText"
                            variant="outlined"
                          />
                          <Chip 
                            size="small" 
                            label={`Current Total: ${collectiveQuantity} units`}
                            color="secondary"
                            variant="outlined"
                            sx={{ ml: 1 }}
                          />
                          <Chip 
                            size="small" 
                            label={`Projected: ${projectedTotalQuantity} units`}
                            color={wouldUnlockNewTier ? "success" : wouldLoseTier ? "error" : "info"}
                            variant="outlined"
                            sx={{ ml: 1 }}
                          />
                        </Box>
                        
                        {wouldUnlockNewTier && (
                          <Alert severity="success" sx={{ mb: 2 }}>
                            <AlertTitle>You'll unlock a new tier!</AlertTitle>
                            <Typography variant="body2">
                              Your commitment would help unlock the {projectedTier.tierQuantity}+ tier with price ${projectedTier.tierDiscount.toFixed(2)} per unit!
                            </Typography>
                          </Alert>
                        )}
                        
                        {wouldLoseTier && (
                          <Alert severity="warning" sx={{ mb: 2 }}>
                            <AlertTitle>Tier discount may be lost</AlertTitle>
                            <Typography variant="body2">
                              Reducing quantity may cause all members to lose the {currentTier.tierQuantity}+ unit discount tier.
                            </Typography>
                          </Alert>
                        )}

                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, pl: 2 }}>
                          {sortedTiers.map((tier, tierIndex) => {
                            const isCurrentlyApplied = collectiveQuantity >= tier.tierQuantity;
                            const wouldBeApplied = projectedTotalQuantity >= tier.tierQuantity;
                            const isNext = nextTier && tier.tierQuantity === nextTier.tierQuantity;
                            const unitsNeeded = tier.tierQuantity - projectedTotalQuantity;
                            const statusChanged = isCurrentlyApplied !== wouldBeApplied;
                            
                            return (
                              <Paper
                                key={tierIndex}
                                variant="outlined"
                                sx={{
                                  p: 1.5,
                                  borderRadius: 1,
                                  display: 'flex',
                                  flexDirection: { xs: 'column', sm: 'row' },
                                  alignItems: { xs: 'flex-start', sm: 'center' },
                                  justifyContent: 'space-between',
                                  bgcolor: wouldBeApplied ? theme.palette.success.light : 
                                           isCurrentlyApplied && !wouldBeApplied ? theme.palette.error.light : 
                                           isNext ? theme.palette.info.light : theme.palette.background.paper,
                                  color: (wouldBeApplied || isCurrentlyApplied && !wouldBeApplied || isNext) ? theme.palette.text.primary : theme.palette.inherit.main,
                                  borderColor: wouldBeApplied ? theme.palette.success.main : 
                                               isCurrentlyApplied && !wouldBeApplied ? theme.palette.error.main : 
                                               isNext ? theme.palette.info.main : theme.palette.divider,
                                  gap: 1
                                }}
                              >
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <Typography variant="body1">
                                    ${tier.tierDiscount.toFixed(2)} per unit at {tier.tierQuantity}+ units
                                  </Typography>
                                </Box>
                                <Box>
                                  {wouldBeApplied ? (
                                    <Chip
                                      label={isCurrentlyApplied ? "APPLIED" : "WILL BE APPLIED"} 
                                      color="success"
                                      size="small"
                                      sx={{ 
                                        bgcolor: theme.palette.background.default, 
                                        color: theme.palette.success.dark, 
                                        fontWeight: 'bold' 
                                      }}
                                    />
                                  ) : isCurrentlyApplied ? (
                                    <Chip
                                      label="WILL BE LOST" 
                                      color="error"
                                      size="small"
                                      sx={{ 
                                        bgcolor: theme.palette.background.default, 
                                        color: theme.palette.error.dark, 
                                        fontWeight: 'bold' 
                                      }}
                                    />
                                  ) : (
                                    <Chip
                                      label={`${unitsNeeded} more needed`} 
                                      color="primary"
                                      size="small"
                                      sx={{ 
                                        bgcolor: theme.palette.background.default, 
                                        color: isNext ? theme.palette.info.dark : theme.palette.text.primary, 
                                        fontWeight: 'bold' 
                                      }}
                                    />
                                  )}
                                </Box>
                              </Paper>
                            );
                          })}
                        </Box>
                      </Box>
                    );
                  })}
                </>
              )}
              
              {/* Global discount tiers (legacy) */}
              {deal?.discountTiers && deal.discountTiers.length > 0 && (
                <Box sx={{ mt: 3 }}>
                  <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                    Volume Discount Tiers
                  </Typography>
                  <Box 
                    sx={{ 
                      display: 'flex', 
                      flexDirection: 'column',
                      gap: 1,
                      mt: 1
                    }}
                  >
                    {deal.discountTiers.map((tier, index) => (
                      <Paper
                        key={index}
                        variant="outlined"
                        sx={{
                          p: 1.5,
                          borderRadius: 1,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          bgcolor: activeTier === tier ? theme.palette.success.light : theme.palette.background.paper,
                          color: activeTier === tier ? theme.palette.text.primary : theme.palette.inherit.main,
                          borderColor: activeTier === tier ? theme.palette.success.main : theme.palette.divider
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          {activeTier === tier ? (
                            <CheckCircleIcon sx={{ color: '#000000' }} fontSize="small" />
                          ) : (
                            <TrendingUp sx={{ color: '#000000' }} fontSize="small" />
                          )}
                          <Typography variant="body1">
                            ${tier.tierDiscount.toFixed(2)} fixed price at {tier.tierQuantity}+ units
                          </Typography>
                        </Box>
                        {activeTier === tier && (
                          <Chip 
                            label="Active" 
                            color="success" 
                            size="small"
                            sx={{ bgcolor: theme.palette.background.default, color: theme.palette.success.dark, fontWeight: 'bold' }}
                          />
                        )}
                      </Paper>
                    ))}
                  </Box>
                </Box>
              )}
            </Grid>
            
            <Grid item xs={12} md={4}>
              <Paper sx={{ p: 2, bgcolor: theme.palette.background.paper, color: theme.palette.text.primary, borderRadius: 2, mb: 2 }}>
                <Typography variant="h6" gutterBottom>
                  Order Summary
                </Typography>
                
                <Divider sx={{ borderColor: theme.palette.divider, my: 1 }} />
                
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body1">Items Subtotal:</Typography>
                  <Typography variant="body1" fontWeight="medium">
                    ${(totalPrice + totalSavings).toFixed(2)}
                  </Typography>
                </Box>
                
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body1">Total Savings:</Typography>
                  <Typography variant="body1" fontWeight="medium" color="success.light">
                    -${totalSavings.toFixed(2)}
                  </Typography>
                </Box>
                
                {activeTier && (
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body1">Volume Discount:</Typography>
                    <Typography variant="body1" fontWeight="medium" color="success.light">
                      Fixed price: ${activeTier.tierDiscount.toFixed(2)}/unit
                    </Typography>
                  </Box>
                )}
                
                <Divider sx={{ borderColor: theme.palette.divider, my: 1 }} />
                
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="h6">Total Price:</Typography>
                  <Typography variant="h6" fontWeight="bold">
                    ${totalPrice.toFixed(2)}
                  </Typography>
                </Box>
              </Paper>
              
              <PriceDisclaimer variant="text" sx={{ mb: 2 }} />
              
              <Alert 
                severity="info" 
                sx={{ mb: 2 }}
              >
                <Typography variant="body2">
                  Your commitment will be sent to the distributor. If approved, you'll be notified to complete the purchase.
                </Typography>
              </Alert>
              
              {totalQuantity > 0 && (
                <Alert 
                  severity="success" 
                  icon={<AddShoppingCart />}
                  sx={{ mb: 2 }}
                >
                  <Typography variant="body2" fontWeight="medium">
                    You're ordering {totalQuantity} units across {Object.values(selectedSizes).filter(qty => qty > 0).length} size options.
                  </Typography>
                </Alert>
              )}
              
              {deal?.minQtyForDiscount && (
                <Alert 
                  severity={totalQuantity >= deal.minQtyForDiscount ? "success" : "warning"}
                  sx={{ mb: 2 }}
                >
                  <Typography variant="body2">
                    {totalQuantity >= deal.minQtyForDiscount
                      ? `You've met the minimum quantity of ${deal.minQtyForDiscount} units required for this deal!`
                      : `This deal requires a minimum of ${deal.minQtyForDiscount} units from all members combined. Current total: ${deal?.totalCommittedQuantity || 0} units.`}
                  </Typography>
                </Alert>
              )}
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          <Button 
            onClick={handleCloseGetDeal} 
            color="secondary"
            disabled={isCommitting}
            sx={{ borderRadius: 2 }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            color={userCommitment ? "warning" : "primary"}
            onClick={handleCommitDeal}
            disabled={isCommitting || totalQuantity === 0 || !canPerformCommitmentActions()}
            sx={{ 
              borderRadius: 2,
              background: userCommitment ? 'linear-gradient(45deg, #FF9800 30%, #FFC107 90%)' : undefined,
              '&:hover': {
                background: userCommitment ? 'linear-gradient(45deg, #F57C00 30%, #FF9800 90%)' : undefined
              }
            }}
          >
            {isCommitting ? (
              <CircularProgress size={24} color="inherit" />
            ) : !canPerformCommitmentActions() ? (
              'No Permission'
            ) : (
              userCommitment ? 'Update Commitment' : 'Confirm Commitment'
            )}
          </Button>
        </DialogActions>
      </Dialog>

      <Toast 
        open={toast.open}
        message={toast.message}
        severity={toast.severity}
        handleClose={handleToastClose}
      />
    </Container>
  );
};

export default ViewSingleDeal;
