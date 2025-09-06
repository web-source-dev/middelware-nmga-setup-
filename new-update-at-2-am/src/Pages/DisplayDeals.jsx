import React, { useState, useEffect, useRef } from "react";
import {
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  CardMedia,
  Button,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Box,
  useTheme,
  useMediaQuery,
  Avatar,
  TablePagination,
  Pagination,
  Paper,
  Chip,
  InputAdornment,
  Stack,
  ButtonGroup,
  Divider,
  TableContainer,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Skeleton,
  AlertTitle,
} from "@mui/material";
import { FilterList, ExpandLess, ExpandMore, Clear, Search, TrendingUp, PlayArrow, Edit as EditIcon, AddShoppingCart } from "@mui/icons-material";
import DashboardIcon from '@mui/icons-material/Dashboard';
import LoginIcon from '@mui/icons-material/Login';
import api from '../services/api';
import { useAuth } from '../middleware/auth';
import Toast from '../Components/Toast/Toast';
import { useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import {
  FormControl,
  Select,
  MenuItem,
} from "@mui/material";
import DisplaySplashContent from "../Components/SplashPage/DisplaySplashContent";
import PriceDisclaimer from "../Components/PriceDisclaimer";

// Helper function to determine if the media is a video
const isVideoUrl = (url) => {
  if (!url) return false;
  const videoExtensions = ['.mp4', '.webm', '.ogg', '.mov'];
  return videoExtensions.some(ext => url.toLowerCase().includes(ext));
};

const DisplayDeals = () => {
  const [deals, setDeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedDeal, setSelectedDeal] = useState(null);
  const [getDealOpen, setGetDealOpen] = useState(false);
  const [selectedSizes, setSelectedSizes] = useState({});
  const [totalQuantity, setTotalQuantity] = useState(0);
  const [totalPrice, setTotalPrice] = useState(0);
  const [totalSavings, setTotalSavings] = useState(0);
  const [userFavorites, setUserFavorites] = useState([]);
  const [filteredDeals, setFilteredDeals] = useState([]);
  const [categories, setCategories] = useState([]);
  const [distributors, setDistributors] = useState([]);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [userCommitments, setUserCommitments] = useState([]);
  const [toast, setToast] = useState({
    open: false,
    message: '',
    severity: 'success'
  });
  const [splashContent, setSplashContent] = useState([]);
  const [activeTier, setActiveTier] = useState(null);

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

  // Check if commitment period has ended
  const isCommitmentPeriodEnded = (deal) => {
    if (!deal?.commitmentEndsAt) return false;
    const commitmentEndDate = new Date(deal.commitmentEndsAt);
    const now = new Date();
    return now > commitmentEndDate;
  };

  // Check if commitment period is active
  const isCommitmentPeriodActive = (deal) => {
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

  // Handle distributor redirect
  useEffect(() => {
    if (isAuthenticated && userRole === 'distributor' && !isImpersonating) {
      const dashboardPath = `/dashboard/distributor`;
      const token = localStorage.getItem('token');
      const authParams = `token=${encodeURIComponent(token)}&user_role=${encodeURIComponent(userRole)}&user_id=${encodeURIComponent(currentUserId)}`;
      window.open(`${dashboardPath}?${authParams}`, '_blank');
    }
  }, [isAuthenticated, userRole, currentUserId, isImpersonating]);
  const handleClick = () => {
    if (isAuthenticated) {
      const dashboardPath = `/dashboard/${userRole === 'member' ? 'co-op-member' : userRole}`;

      // Add authentication parameters to the URL
      const token = localStorage.getItem('token');
      let authParams = `token=${encodeURIComponent(token)}&user_role=${encodeURIComponent(userRole)}`;

      if (userRole === 'admin' && isImpersonating) {
        const adminId = localStorage.getItem('admin_id');
        if (adminId) {
          authParams += `&admin_id=${encodeURIComponent(adminId)}`;
        }
      } else {
        authParams += `&user_id=${encodeURIComponent(currentUserId)}`;
      }

      window.open(`${dashboardPath}?${authParams}`, '_blank');
    } else {
      window.location.href = '/login';
    }
  };


    
  useEffect(() => {
    // Send message to Wix iframe
    window.parent.postMessage({ type: "requestData" }, "*");
  
    const handleMessage = (event) => {
      if (event.data?.type === "responseData") {
        const { logout, url } = event.data;
        console.log("Received from Wix:", event.data, logout, url);
  
        if (logout) {
          performLogout();
        }
      }
    };
  
    window.addEventListener("message", handleMessage);
  
    return () => window.removeEventListener("message", handleMessage);
  }, []);
  
  function performLogout() {
    console.log("Logging out from UI...");
    localStorage.clear();
    sessionStorage.clear();
    window.location.reload();
  }


  useEffect(() => {
    const fetchSplashContent = async () => {
      try {
        const response = await api.get('/api/splash', {
          headers: { 'user-role': userRole }
        });
        console.log('Splash content response:', response.data);
        console.log('Splash content length:', response.data.length);
        setSplashContent(response.data);
      } catch (error) {
        console.error('Error fetching splash content:', error);
      }
    };

    if (userRole) {
      fetchSplashContent();
    }
  }, [userRole]);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const navigate = useNavigate();
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(24);

  const fetchDeals = async () => {
    try {
      const response = await api.get('/deals/fetchAll/buy');
      console.log('deals received', response.data);
      setDeals(response.data);
      setFilteredDeals(response.data);

      const uniqueCategories = [...new Set(response.data.map(deal => deal.category))];
      const uniqueDistributors = [...new Set(response.data
        .map(deal => deal.distributor?.businessName)
        .filter(name => name))];
      setCategories(uniqueCategories);
      setDistributors(uniqueDistributors);
    } catch (error) {
      setError("Error fetching deals. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const [filter, setFilter] = useState({
    searchQuery: '',
    category: '',
    distributor: '',
    priceRange: [0, 1000000],
    minQuantity: [0, 5000000],
    favoritesOnly: false,
    committedOnly: false
  });

  const [isFilterLoading, setIsFilterLoading] = useState(false);
  const filterDebounceTimeout = useRef(null);

  const [isCommitting, setIsCommitting] = useState(false);
  const [isFavoriteLoading, setIsFavoriteLoading] = useState(false);
  const [isViewLoading, setIsViewLoading] = useState(false);

  const [socket, setSocket] = useState(null);

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

  // Listen for real-time deal updates
  useEffect(() => {
    if (!socket) return;

    // Handle updates for all deals
    socket.on('deal-update', (data) => {
      console.log('Received deal update:', data);

      if (data.type === 'created') {
        fetchDeals();
      }
      else if (data.type === 'updated') {
        fetchDeals();
      }
      else if (data.type === 'deleted') {
        fetchDeals();
      }

    });

    return () => {
      socket.off('deal-update');
    };
  }, [socket, categories]);

  useEffect(() => {

    fetchDeals();

    // Also refresh user data when component mounts
    refreshUserData();
  }, []);

  useEffect(() => {
    setIsFilterLoading(true);
    if (filterDebounceTimeout.current) {
      clearTimeout(filterDebounceTimeout.current);
    }

    filterDebounceTimeout.current = setTimeout(() => {
      let filtered = [...deals];

      // Apply search query filter
      if (filter.searchQuery) {
        const query = filter.searchQuery.toLowerCase();
        filtered = filtered.filter(deal =>
          deal.name.toLowerCase().includes(query) ||
          deal.description.toLowerCase().includes(query)
        );
      }

      // Apply category filter
      if (filter.category) {
        filtered = filtered.filter(deal => deal.category === filter.category);
      }

      // Apply distributor filter
      if (filter.distributor) {
        filtered = filtered.filter(deal =>
          deal.distributor?.businessName === filter.distributor
        );
      }

      // Apply price range filter
      filtered = filtered.filter(deal => {
        // Check if deal has sizes array
        if (deal.sizes && deal.sizes.length > 0) {
          // Use the lowest price from available sizes
          const lowestPrice = Math.min(...deal.sizes.map(size => size.discountPrice));
          return lowestPrice >= filter.priceRange[0] && lowestPrice <= filter.priceRange[1];
        } else {
          // Fallback to legacy fields
          const price = deal.discountPrice || deal.avgDiscountPrice || 0;
          return price >= filter.priceRange[0] && price <= filter.priceRange[1];
        }
      });

      // Apply min quantity filter
      filtered = filtered.filter(deal =>
        deal.minQtyForDiscount >= filter.minQuantity[0] &&
        deal.minQtyForDiscount <= filter.minQuantity[1]
      );

      // Apply favorites filter
      if (filter.favoritesOnly) {
        filtered = filtered.filter(deal => userFavorites.includes(deal._id));
      }

      // Apply committed deals filter
      if (filter.committedOnly) {
        filtered = filtered.filter(deal => userCommitments.includes(deal._id));
      }

      setFilteredDeals(filtered);
      setIsFilterLoading(false);
    }, 500);

    return () => {
      if (filterDebounceTimeout.current) {
        clearTimeout(filterDebounceTimeout.current);
      }
    };
  }, [deals, filter, userFavorites, userCommitments]);

  const handleOpenView = async (deal) => {
    if (isViewLoading) return;
    try {
      setIsViewLoading(true);
      navigate(`/deals-catlog/deals/${deal._id}`);
    } catch (error) {
      console.error('Error navigating to view:', error);
    } finally {
      setIsViewLoading(false);
    }
  };

  const handleOpenGetDeal = async (deal) => {
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

    // Check if user has permission to perform commitment actions
    if (!canPerformCommitmentActions()) {
      setToast({
        open: true,
        message: 'You do not have permission to make commitments.',
        severity: 'warning'
      });
      return;
    }

    // Check if commitment period has ended
    if (isCommitmentPeriodEnded(deal)) {
      setToast({
        open: true,
        message: `The commitment period for this deal ended on ${new Date(deal.commitmentEndsAt).toLocaleDateString()}. You can no longer make commitments to this deal.`,
        severity: 'warning'
      });
      return;
    }

    // Check if commitment period has not started yet
    if (!isCommitmentPeriodActive(deal)) {
      setToast({
        open: true,
        message: `The commitment period for this deal starts on ${new Date(deal.commitmentStartAt).toLocaleDateString()}. You can make commitments during the active period.`,
        severity: 'info'
      });
      return;
    }

    setSelectedDeal(deal);

    // Initialize selected sizes with 0 quantity for each available size
    if (deal && deal.sizes) {
      const initialSizes = {};
      deal.sizes.forEach(size => {
        initialSizes[size.size] = 0;
      });
      setSelectedSizes(initialSizes);
    }

    // Check if user already has a commitment for this deal
    if (userCommitments.includes(deal._id)) {
      try {
        // Fetch the user's existing commitments to get the quantities
        const commitmentsResponse = await api.get(`/deals/commit`);

        // Find the commitment for this specific deal
        const existingCommitment = commitmentsResponse.data.find(
          commitment => commitment.dealId._id === deal._id
        );

        // Pre-populate the quantities based on existing size commitments
        if (existingCommitment && existingCommitment.sizeCommitments) {
          const userSizes = {};
          existingCommitment.sizeCommitments.forEach(sc => {
            userSizes[sc.size] = sc.quantity;
          });
          setSelectedSizes(userSizes);
        }
      } catch (error) {
        console.error("Error fetching existing commitment:", error);
      }
    }

    setGetDealOpen(true);
  };

  const handleCloseGetDeal = () => {
    setGetDealOpen(false);
    setSelectedDeal(null);
    setSelectedSizes({});
    setTotalQuantity(0);
    setTotalPrice(0);
    setTotalSavings(0);
    setActiveTier(null);
  };

  const handleSizeQuantityChange = (size, quantity) => {
    const newQuantity = Math.max(0, parseInt(quantity) || 0);

    // Only perform tier calculations if we have a selected deal
    if (selectedDeal) {
      // Get the size data
      const sizeData = selectedDeal.sizes.find(s => s.size === size);
      if (sizeData && sizeData.discountTiers && sizeData.discountTiers.length > 0) {
        // Get current collective quantity for this size
        // In a real implementation, you'd want the size-specific data, but here we'll estimate
        const currentCollectiveQuantity = selectedDeal.totalCommittedQuantity || 0;

        // If this is an update, calculate what the previous commitment was
        let previousQuantity = 0;
        if (userCommitments.includes(selectedDeal._id)) {
          // Find the user's existing commitment
          // This is simplified - in real implementation, you'd want to fetch the specific size quantity
          previousQuantity = selectedSizes[size] || 0;
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
          // Show a warning
          setToast({
            open: true,
            message: `Reducing quantity may cause all members to lose the ${currentTier.tierQuantity}+ unit discount tier.`,
            severity: 'warning'
          });
        }
      }
    }

    // Update the quantity
    setSelectedSizes(prev => ({
      ...prev,
      [size]: newQuantity
    }));
  };

  const handleCommitDeal = async () => {
    if (!selectedDeal || isCommitting) return;

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
        const sizeData = selectedDeal.sizes.find(s => s.size === sizeName);
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
        dealId: selectedDeal._id,
        userId: currentUserId,
        sizeCommitments
      };

      const response = await api.post(
        `/deals/commit/buy/${selectedDeal._id}`,
        commitmentData
      );

      setToast({
        open: true,
        message: "Deal commitment submitted successfully!",
        severity: 'success'
      });

      await refreshUserData();
      await fetchDeals();
      handleCloseGetDeal();
    } catch (error) {
      setToast({
        open: true,
        message: error.response?.data?.message || "Error submitting deal commitment",
        severity: 'error'
      });
    } finally {
      setIsCommitting(false);
    }
  };

  const handleFilterChange = (name, value) => {
    setFilter(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const clearFilters = () => {
    setFilter({
      searchQuery: '',
      category: '',
      priceRange: [0, 1000000],
      minQuantity: [0, 5000000],
      favoritesOnly: false,
      committedOnly: false,
      Distributor: ''
    });
  };

  const handleToastClose = () => {
    setToast({ ...toast, open: false });
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const paginatedDeals = filteredDeals.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  // Calculate total quantity, price, and determine active discount tier
  useEffect(() => {
    if (!selectedDeal) return;

    // Calculate total quantity across all sizes
    let newTotalQuantity = 0;
    let newTotalPrice = 0;
    let newTotalSavings = 0;

    // Calculate totals based on selected sizes
    Object.entries(selectedSizes).forEach(([sizeName, quantity]) => {
      if (quantity > 0) {
        const sizeData = selectedDeal.sizes.find(s => s.size === sizeName);
        if (sizeData) {
          newTotalQuantity += quantity;

          // Get current total collective quantity for this size
          // For simplicity, we're using the total committed quantity 
          const collectiveQuantity = selectedDeal.totalCommittedQuantity || 0;

          // If this is an update, calculate what the previous commitment was
          let previousQuantity = 0;
          if (userCommitments.includes(selectedDeal._id)) {
            // This is a simplification - in a real implementation you'd want to fetch the specific
            // previous commitment quantity for this size
            previousQuantity = quantity; // Using current quantity as a proxy
          }

          // Calculate what the new collective total would be
          const projectedQuantity = collectiveQuantity - previousQuantity + quantity;

          // Check for size-specific discount tiers based on projected collective quantity
          let effectivePrice = sizeData.discountPrice;
          let appliedTier = null;
          let projectedTier = null;
          let priceWillChange = false;

          if (sizeData.discountTiers && sizeData.discountTiers.length > 0) {
            // Sort tiers by quantity (highest first) to find the best applicable tier
            const sortedTiers = [...sizeData.discountTiers].sort((a, b) => b.tierQuantity - a.tierQuantity);

            // Find the tier based on current collective quantity
            appliedTier = sortedTiers.find(tier => collectiveQuantity >= tier.tierQuantity);

            // Find the tier based on projected quantity
            projectedTier = sortedTiers.find(tier => projectedQuantity >= tier.tierQuantity);

            // Determine if price will change
            const currentPrice = appliedTier ? appliedTier.tierDiscount : sizeData.discountPrice;
            const projectedPrice = projectedTier ? projectedTier.tierDiscount : sizeData.discountPrice;
            priceWillChange = currentPrice !== projectedPrice;

            // Use projected tier for display
            if (projectedTier) {
              effectivePrice = projectedTier.tierDiscount;
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
  }, [selectedDeal, selectedSizes, userCommitments]);

  const refreshUserData = async () => {
    if (!currentUserId) return;

    try {
      // Fetch favorites
      const favoritesResponse = await api.get(`/deals/favorite`);
      setUserFavorites(favoritesResponse.data.map((fav) => fav.dealId));

      // Fetch commitments
      const commitmentsResponse = await api.get(`/deals/commit`);
      setUserCommitments(commitmentsResponse.data.map(commitment => commitment.dealId._id));
    } catch (error) {
      console.error("Error refreshing user data", error);
    }
  };

  const [redirectLoading, setRedirectLoading] = useState(false);


  const renderDeals = () => {
    if (loading) {
      return Array.from({ length: 8 }).map((_, index) => (
        <Grid item xs={12} sm={6} md={4} lg={3} key={index}>
          <Card sx={{ height: '100%', borderRadius: 2 }}>
            <Skeleton variant="rectangular" height={200} />
            <CardContent>
              <Skeleton variant="text" width="80%" />
              <Skeleton variant="text" width="60%" />
              <Skeleton variant="text" width="40%" />
            </CardContent>
          </Card>
        </Grid>
      ));
    }

    if (!filteredDeals.length) {
      return (
        <Grid item xs={12}>
          <Paper sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="h6" color="text.secondary">
              No deals found matching your criteria.
            </Typography>
            <Button
              variant="text"
              color="primary"
              onClick={clearFilters}
              sx={{ mt: 1 }}
            >
              Clear Filters
            </Button>
          </Paper>
        </Grid>
      );
    }

    return filteredDeals.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((deal) => {
      // Check if user has committed to this deal
      const isCommitted = userCommitments.includes(deal._id);

      // Check if the deal has the sizes array, if not use legacy fields
      const hasSizes = deal.sizes && deal.sizes.length > 0;

      // Calculate the best savings percentage across all sizes or use legacy fields
      let bestSavingsPercent = '0';
      let lowestPrice = 0;
      let highestPrice = 0;
      let singlePriceDisplay = false;

      if (hasSizes) {
        const savingsPercentages = deal.sizes.map(size =>
          ((size.originalCost - size.discountPrice) / size.originalCost) * 100
        );
        bestSavingsPercent = Math.max(...savingsPercentages).toFixed(0);

        // Get price information from available sizes
        lowestPrice = Math.min(...deal.sizes.map(size => size.discountPrice));
        highestPrice = Math.max(...deal.sizes.map(size => size.discountPrice));

        // Determine if we should show single price (when there's only one size or all sizes have same price)
        singlePriceDisplay = deal.sizes.length === 1 || lowestPrice === highestPrice;
      } else {
        // Fallback to legacy fields
        bestSavingsPercent = deal.avgSavingsPercentage || '0';
        lowestPrice = deal.discountPrice || deal.avgDiscountPrice || 0;
        singlePriceDisplay = true;
      }

      return (
        <Grid item xs={12} sm={6} md={4} lg={4} key={deal._id}>
          <Card
            sx={{
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              transition: 'transform 0.3s, box-shadow 0.3s',
              '&:hover': {
                transform: 'translateY(-5px)',
                boxShadow: 6
              },
              position: 'relative',
              borderRadius: 2,
              overflow: 'hidden'
            }}
          >
            {bestSavingsPercent > 0 && (
              <Box
                sx={{
                  position: 'absolute',
                  top: 10,
                  right: 10,
                  bgcolor: theme.palette.secondary.main,
                  color: theme.palette.background.default,
                  fontWeight: 'bold',
                  py: 0.5,
                  px: 1.5,
                  borderRadius: 1,
                  zIndex: 1,
                  boxShadow: 2,
                  transform: 'rotate(0deg)',
                }}
              >
                SAVE {bestSavingsPercent}%
              </Box>
            )}

            {deal.images && deal.images.length > 0 && (
              <Box sx={{ position: 'relative', height: 200, bgcolor: theme.palette.background.default }}>
                {isVideoUrl(deal.images[0]) ? (
                  <Box
                    component="video"
                    src={deal.images[0]}
                    autoPlay
                    muted
                    loop
                    sx={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'contain',
                      p: 2
                    }}
                  />
                ) : (
                  <CardMedia
                    component="img"
                    height="200"
                    image={deal.images[0]}
                    alt={deal.name}
                    sx={{ objectFit: 'contain', bgcolor: theme.palette.background.default, p: 2 }}
                  />
                )}
                {isVideoUrl(deal.images[0]) && (
                  <Box
                    sx={{
                      position: 'absolute',
                      bottom: 5,
                      right: 5,
                      bgcolor: 'rgba(0,0,0,0.6)',
                      color: theme.palette.background.default,
                      borderRadius: '50%',
                      p: 0.5,
                    }}
                  >
                    <PlayArrow fontSize="small" />
                  </Box>
                )}
              </Box>
            )}

            <CardContent sx={{ flexGrow: 1, p: 2, pt: 4 }}>
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 'bold',
                  fontSize: '1.5rem',
                  color: 'black',
                }}
              >
                {deal.name}
              </Typography>

              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', mb: 1 }}>
                <Box>
                  <Typography
                    variant="body1"
                    color={theme.palette.primary.contrastText}
                    component="span"
                    sx={{ fontWeight: 'bold', fontSize: '1.25rem' }}
                  >
                    ${lowestPrice.toFixed(2)}
                  </Typography>
                  {hasSizes && !singlePriceDisplay && (
                    <Typography
                      variant="body2"
                      component="span"
                      sx={{ ml: 0.5, color: theme.palette.primary.contrastText }}
                    >
                      - ${highestPrice.toFixed(2)}
                    </Typography>
                  )}
                </Box>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 1, mb: 1 }}>
                  <Chip
                    label={deal.category || 'Vodka'}
                    size="small"
                    variant="outlined"
                    sx={{ borderRadius: '4px', color: theme.palette.error.dark, borderColor: theme.palette.error.light }}
                  />
                  {deal.sizes && deal.sizes.length > 1 && (
                    <Chip
                      label="Mix & Match"
                      size="small"
                      sx={{
                        fontWeight: 'bold',
                        borderRadius: '4px',
                        background: 'linear-gradient(45deg, #FF8E53 30%, #FE6B8B 90%)',
                        color: 'white',
                        '& .MuiChip-label': { px: 1 }
                      }}
                    />
                  )}
                </Box>
              </Box>

              {/* Size options */}
              <Typography
                variant="body2"
                color={theme.palette.text.secondary}
                sx={{
                  mb: 1,
                  height: '1.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.5
                }}
              >
                <Box component="span" sx={{ fontWeight: 'medium' }}>Sizes:</Box>
                {hasSizes ? (
                  <Box component="span" sx={{
                    display: 'inline-flex',
                    flexWrap: 'nowrap',
                    overflow: 'hidden'
                  }}>
                    {deal.sizes.map((size, idx) => (
                      <Box
                        key={idx}
                        component="span"
                        sx={{
                          px: 0.5,
                          mr: 0.5,
                          fontSize: '0.7rem',
                          bgcolor: theme.palette.grey[100],
                          borderRadius: 0.5,
                          whiteSpace: 'nowrap'
                        }}
                      >
                        {size.size}
                      </Box>
                    )).slice(0, 3)}
                    {deal.sizes.length > 3 && <Box component="span">...</Box>}
                  </Box>
                ) : (
                  <Box component="span">Standard size</Box>
                )}
              </Typography>

              {/* Distributor info */}
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Avatar
                  src={deal.distributor?.logo}
                  alt={deal.distributor?.businessName}
                  sx={{ width: 24, height: 24, mr: 1 }}
                />
                <Typography
                  variant="body2"
                  color={theme.palette.text.secondary}
                  sx={{
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {deal.distributor?.businessName || deal.distributor?.name}
                </Typography>
              </Box>

              {/* Progress and stats */}
              {deal.minQtyForDiscount > 0 && (
                <Box sx={{ mb: 1 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                    <Typography variant="caption" color={theme.palette.text.secondary}>
                      {deal.totalCommittedQuantity || 0} of {deal.minQtyForDiscount} committed
                    </Typography>
                    <Typography variant="caption" color={theme.palette.text.secondary} fontWeight="bold">
                      {Math.min(100, Math.round((deal.totalCommittedQuantity || 0) / deal.minQtyForDiscount * 100))}%
                    </Typography>
                  </Box>
                  <Box sx={{ width: '100%', height: 4, bgcolor: theme.palette.grey[100], borderRadius: 5, overflow: 'hidden' }}>
                    <Box
                      sx={{
                        height: '100%',
                        width: `${Math.min(100, Math.round((deal.totalCommittedQuantity || 0) / deal.minQtyForDiscount * 100))}%`,
                        bgcolor: (deal.totalCommittedQuantity || 0) >= deal.minQtyForDiscount ? theme.palette.success.main : theme.palette.primary.main,
                        transition: 'width 0.5s ease-in-out'
                      }}
                    />
                  </Box>
                  {(deal.totalCommittedQuantity || 0) >= deal.minQtyForDiscount ? (
                    <Typography variant="caption" color={theme.palette.success.main} fontWeight="bold" sx={{ display: 'block', mt: 0.5 }}>
                      Minimum quantity reached
                    </Typography>
                  ) : (
                    <Typography variant="caption" color={theme.palette.secondary.main} fontWeight="bold" sx={{ display: 'block', mt: 0.5 }}>
                      {Math.max(0, deal.minQtyForDiscount - (deal.totalCommittedQuantity || 0))} more units needed to go
                    </Typography>
                  )}
                </Box>
              )}

              {/* Deal status info */}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                  <Chip
                    size="small"
                    label={`Min: ${deal.minQtyForDiscount || 0}`}
                    color="primary.contrastText"
                    variant="outlined"
                    sx={{ borderRadius: 1, height: 20, '& .MuiChip-label': { px: 1, py: 0 } }}
                  />
                  <Chip
                    size="small"
                    label={`Left: ${Math.max(0, deal.minQtyForDiscount - (deal.totalCommittedQuantity || 0))}`}
                    color={(deal.totalCommittedQuantity || 0) >= deal.minQtyForDiscount ? "success" : "primary.contrastText"}
                    variant="outlined"
                    sx={{ borderRadius: 1, height: 20, '& .MuiChip-label': { px: 1, py: 0 } }}
                  />
                  {(deal.totalCommittedQuantity || 0) >= deal.minQtyForDiscount && (
                    <Chip
                      size="small"
                      label="Committed"
                      color="primary"
                      sx={{ borderRadius: 1, height: 20, '& .MuiChip-label': { px: 1, py: 0 } }}
                    />
                  )}
                  {isCommitmentPeriodEnded(deal) && (
                    <Chip
                      size="small"
                      label="Commitment Ended"
                      color="error"
                      sx={{ borderRadius: 1, height: 20, '& .MuiChip-label': { px: 1, py: 0 } }}
                    />
                  )}
                  {!isCommitmentPeriodActive(deal) && !isCommitmentPeriodEnded(deal) && (
                    <Chip
                      size="small"
                      label="Not Started"
                      color="warning"
                      sx={{ borderRadius: 1, height: 20, '& .MuiChip-label': { px: 1, py: 0 } }}
                    />
                  )}
                  {isCommitmentPeriodActive(deal) && (
                    <Chip
                      size="small"
                      label="Active"
                      color="success"
                      sx={{ borderRadius: 1, height: 20, '& .MuiChip-label': { px: 1, py: 0 } }}
                    />
                  )}
                </Box>

                {isCommitted && (
                  <Chip
                    size="small"
                    label="Committed"
                    color="primary"
                    sx={{ borderRadius: 1 }}
                  />
                )}
              </Box>

              {/* Commitment Period Info */}
              {deal.commitmentStartAt && deal.commitmentEndsAt && (
                <Box sx={{ mt: 1, p: 1, bgcolor: 'rgba(0,0,0,0.02)', borderRadius: 1 }}>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                    Commitment Period:
                  </Typography>
                  <Typography variant="caption" fontWeight="medium">
                    {new Date(deal.commitmentStartAt).toLocaleDateString()} - {new Date(deal.commitmentEndsAt).toLocaleDateString()}
                  </Typography>
                </Box>
              )}
            </CardContent>

            <Box sx={{ p: 2, pt: 0, display: 'flex', gap: 1 }}>
              <Button
                fullWidth
                variant="outlined"
                size="small"
                color={theme.palette.primary.dark || 'primary'}
                onClick={() => handleOpenView(deal)}
                sx={{ borderRadius: 1 }}
              >
                View Deal
              </Button>
              {isCommitmentPeriodEnded(deal) ? (
                <Button
                  fullWidth
                  variant="outlined"
                  size="small"
                  disabled
                  sx={{ 
                    borderRadius: 1,
                    color: theme.palette.text.disabled,
                    borderColor: theme.palette.text.disabled
                  }}
                >
                  Commitment Ended
                </Button>
              ) : !isCommitmentPeriodActive(deal) ? (
                <Button
                  fullWidth
                  variant="outlined"
                  size="small"
                  disabled
                  sx={{ 
                    borderRadius: 1,
                    color: theme.palette.text.disabled,
                    borderColor: theme.palette.text.disabled
                  }}
                >
                  Not Started
                </Button>
              ) : !canPerformCommitmentActions() ? (
                <Button
                  fullWidth
                  variant="outlined"
                  size="small"
                  disabled
                  sx={{ 
                    borderRadius: 1,
                    color: theme.palette.text.disabled,
                    borderColor: theme.palette.text.disabled
                  }}
                >
                  No Permission
                </Button>
              ) : (
                <Button
                  fullWidth
                  variant="contained"
                  size="small"
                  onClick={() => handleOpenGetDeal(deal)}
                  sx={{ borderRadius: 1 }}
                  startIcon={isCommitted ? <EditIcon color={theme.palette.primary.dark || 'primary'} /> : <AddShoppingCart color={theme.palette.primary.dark || 'primary'} />}
                >
                  {isCommitted ? 'Update' : 'Commit'}
                </Button>
              )}
            </Box>
          </Card>
        </Grid>
      );
    });
  };

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

    <>
      {splashContent.length > 0 && <DisplaySplashContent content={splashContent} />}

      <Box sx={{
        minHeight: '100vh',
        background: theme.palette.background.default,
        pb: 4
      }}>
        {/* Admin Impersonation Indicator */}
        {isImpersonating && (
          <Box sx={{
            background: 'linear-gradient(45deg, #FF9800 30%, #FFC107 90%)',
            color: 'white',
            py: 1,
            px: 2,
            textAlign: 'center',
            fontWeight: 'bold'
          }}>
            Admin Mode: You are viewing deals as a member
          </Box>
        )}
        <Box sx={{
          background: theme.palette.primary.main,
          color: 'white',
          py: { xs: 4, md: 4 },
          px: { xs: 2, sm: 4 },
          mb: 4
        }}>
          <Container maxWidth="xl">
            <Box sx={{
              display: 'flex',
              flexDirection: { xs: 'column', md: 'row' },
              alignItems: { xs: 'flex-start', md: 'center' },
              justifyContent: 'space-between',
              gap: 3
            }}>
              <Box>
                <Typography
                  variant="h3"
                  fontWeight="800"
                  sx={{
                    fontSize: { xs: '1.3rem', sm: '1.6rem', md: '2rem' },
                    mb: 1,
                    background: theme.palette.primary.contrastText,
                    backgroundClip: 'text',
                    textFillColor: 'transparent',
                  }}
                >
                  Exclusive Deals
                </Typography>
                <Typography
                  variant="h6"
                  sx={{
                    opacity: 1,
                    fontWeight: 500,
                    fontSize: { xs: '1rem', sm: '1rem' }
                  }}
                >
                  Discover amazing products at unbeatable prices
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', gap: 2 }}>
                {isAuthenticated && userRole === 'member' && (
                  <Button
                    onClick={() => {
                      const token = localStorage.getItem('token');
                      const authParams = `id=${currentUserId}&session=${currentUserId}&role=distributor&offer=true&token=${encodeURIComponent(token)}&user_role=${encodeURIComponent(userRole)}&user_id=${encodeURIComponent(currentUserId)}`;
                      window.open(`/dashboard/co-op-member/offers/view/splash-content?${authParams}`, '_blank');
                    }}
                    sx={{
                      border: '2px solid',
                      borderColor: 'primary.contrastText',
                      color: 'primary.contrastText',
                      backgroundColor: 'white',
                      padding: { xs: '4px 4px', md: '10px 10px' },
                      cursor: 'pointer',
                      borderRadius: 25,
                      fontSize: { xs: '12px', md: '16px' },
                      fontWeight: 'bold',
                      textTransform: 'uppercase',
                      transition: 'background-color 0.3s ease',
                      marginRight: '4px',
                      '&:hover': {
                        backgroundColor: theme.palette.primary.contrastText,
                        color: theme.palette.secondary.contrastText,
                      },
                    }}
                  >
                    Advertisements
                  </Button>
                )}
                <Button
                  variant="contained"
                  size="large"
                  onClick={handleClick}
                  startIcon={
                    isAuthenticated ? (
                      <DashboardIcon sx={{ color: 'primary.contrastText' }} />
                    ) : (
                      <LoginIcon sx={{ color: 'primary.contrastText' }} />
                    )
                  }
                  sx={{
                    border: `2px solid ${theme.palette.primary.contrastText}`,
                    color: theme.palette.primary.contrastText,
                    backgroundColor: 'white',
                    padding: { xs: '8px 16px', md: '10px 10px' },
                    cursor: 'pointer',
                    borderRadius: 25,
                    fontSize: { xs: '12px', md: '16px' },
                    fontWeight: 'bold',
                    textTransform: 'uppercase',
                    transition: 'background-color 0.3s ease',
                    marginRight: '4px',
                  }}
                                  >
                    {isAuthenticated ? 'Go to Dashboard' : 'Login to Continue'}
                  </Button>
              </Box>

              {isMobile && (
                <Box sx={{
                  display: 'flex',
                  gap: 1,
                  flexWrap: 'wrap'
                }}>
                  {!isMobile && (
                    <ButtonGroup
                      variant="contained"
                      sx={{
                        bgcolor: 'rgba(255,255,255,0.1)',
                        backdropFilter: 'blur(10px)',
                        borderRadius: 3,
                        overflow: 'hidden',
                        '& .MuiButton-root': {
                          borderColor: 'rgba(255,255,255,0.2)',
                          color: 'white',
                          px: 3,
                          '&:hover': {
                            bgcolor: 'rgba(255,255,255,0.2)',
                          },
                          '&.Mui-selected': {
                            bgcolor: 'rgba(255,255,255,0.3)',
                          }
                        }
                      }}
                    >

                    </ButtonGroup>
                  )}
                  {isMobile && (
                    <Button
                      variant="contained"
                      onClick={() => setMobileFiltersOpen(!mobileFiltersOpen)}
                      startIcon={<FilterList color={theme.palette.primary.contrastText} />}
                      endIcon={mobileFiltersOpen ? <ExpandLess color={theme.palette.primary.contrastText} /> : <ExpandMore color={theme.palette.primary.contrastText} />}
                      sx={{
                        bgcolor: 'rgba(255,255,255,0.2)',
                        color: theme.palette.primary.contrastText,
                        borderRadius: 3,
                        px: 3,
                        '&:hover': {
                          bgcolor: theme.palette.primary.contrastText,
                          color: theme.palette.secondary.main,
                        }
                      }}
                    >
                      Filters {filteredDeals.length > 0 && `(${filteredDeals.length})`}

                    </Button>
                  )}
                </Box>
              )}

            </Box>

          </Container>
        </Box>

        <Container maxWidth="100%">
          <Box sx={{
            display: 'flex',
            gap: 1,
            flexDirection: { xs: 'column', lg: 'row' }
          }}>
            {/* Filters Panel */}
            <Paper
              elevation={0}
              sx={{
                width: { xs: '100%', lg: '290px' },
                flexShrink: 0,
                borderRadius: 4,
                overflow: 'hidden',
                bgcolor: 'white',
                border: '1px solid',
                borderColor: 'divider',
                position: { xs: 'static', lg: 'sticky' },
                top: 24,
                display: { xs: mobileFiltersOpen ? 'block' : 'none', lg: 'block' }
              }}
            >
              <Box sx={{ p: 3 }}>
                <Typography variant="h6" fontWeight="600" gutterBottom>
                  Filter Products
                </Typography>

                <Stack spacing={2}>
                  <TextField
                    placeholder="Search products..."
                    value={filter.searchQuery}
                    size="small"
                    onChange={(e) => handleFilterChange('searchQuery', e.target.value)}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Search sx={{ color: 'text.secondary' }} />
                        </InputAdornment>
                      ),
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 3,
                        bgcolor: 'grey.50',
                        '&:hover': {
                          bgcolor: 'grey.100',
                        },
                        '& fieldset': {
                          borderColor: 'transparent'
                        },
                        '&:hover fieldset': {
                          borderColor: 'primary.main'
                        },
                        '&.Mui-focused fieldset': {
                          borderColor: 'primary.main'
                        }
                      }
                    }}
                  />

                  <Box>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      Categories
                    </Typography>
                    <Box sx={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: 1
                    }}>
                      {categories.map((cat, index) => (
                        <Chip
                          key={cat || (index + 1)}
                          label={cat || 'Vodka'}
                          onClick={() => handleFilterChange('category', cat === filter.category ? '' : cat)}
                          variant={filter.category === cat ? "filled" : "outlined"}
                          color={theme.palette.primary.dark || 'primary'}
                          sx={{
                            borderRadius: 2,
                            '&:hover': {
                              transform: 'translateY(-2px)',
                              boxShadow: 1
                            },
                            transition: 'all 0.2s ease'
                          }}
                        />
                      ))}
                    </Box>
                  </Box>

                  <Box mb={20}>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      Distributor
                    </Typography>
                    <FormControl fullWidth size="small">
                      <Select
                        value={filter.distributor}
                        onChange={(e) => handleFilterChange('distributor', e.target.value)}
                        displayEmpty
                        sx={{ borderRadius: 3 }}
                      >
                        <MenuItem value="">All Distributors</MenuItem>
                        {distributors.map((dist) => (
                          <MenuItem key={dist} value={dist}>{dist}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Box>
                  <Divider sx={{ marginTop: '50px' }} />

                  {Object.values(filter).some(value =>
                    value !== '' &&
                    value !== false &&
                    (Array.isArray(value) ?
                      (value[0] !== 0 && value[1] !== 1000) || (value[0] !== 1 && value[1] !== 100)
                      : true)
                  ) && (
                      <Button
                        variant="outlined"
                        startIcon={<Clear />}
                        onClick={clearFilters}
                        color="error"
                        sx={{
                          borderRadius: 3,
                          textTransform: 'none'
                        }}
                      >
                        Clear All Filters
                      </Button>
                    )}
                </Stack>
              </Box>
            </Paper>

            {/* Main Content */}
            <Box sx={{ flexGrow: 1 }}>
              {loading || isFilterLoading ? (
                <Box sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  minHeight: '400px',
                  gap: 2
                }}>
                  <CircularProgress size={40} />
                  <Typography color="text.secondary">
                    {loading ? 'Loading deals...' : 'Applying filters...'}
                  </Typography>
                </Box>
              ) : error ? (
                <Alert
                  severity="error"
                  sx={{ borderRadius: 3 }}
                >
                  {error}
                </Alert>
              ) : filteredDeals.length > 0 ? (
                <Grid
                  container
                  spacing={3}
                  columns={{ xs: 12, sm: 12, md: 12, lg: 12, xl: 12 }}
                  sx={{
                    width: '100%',
                    margin: 0,
                    '& .MuiGrid-item': {
                      width: { xs: '100%', sm: '50%', md: '300px' },
                      padding: 1.5,
                    }
                  }}
                >
                  {renderDeals()}
                </Grid>
              ) : deals.length > 0 ? (
                <Box
                  sx={{
                    textAlign: 'center',
                    py: 8,
                    bgcolor: 'white',
                    borderRadius: 4,
                    border: '1px dashed',
                    borderColor: 'divider'
                  }}
                >
                  <Typography variant="h6" color="text.secondary" gutterBottom>
                    No deals match your current filters
                  </Typography>
                  <Typography variant="body1" color="text.secondary">
                    Try adjusting your search criteria
                  </Typography>
                </Box>
              ) : (
                <Box
                  sx={{
                    textAlign: 'center',
                    py: 8,
                    bgcolor: 'white',
                    borderRadius: 4,
                    border: '1px dashed',
                    borderColor: 'divider'
                  }}
                >
                  <Typography variant="h6" color="text.secondary">
                    No active deals available
                  </Typography>
                </Box>
              )}

              {/* Pagination */}
              {filteredDeals.length > 0 && (
                <Box sx={{
                  mt: 4,
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  gap: 2,
                  flexWrap: 'wrap'
                }}>
                  <TablePagination
                    component="div"
                    count={filteredDeals.length}
                    page={page}
                    onPageChange={handleChangePage}
                    rowsPerPage={rowsPerPage}
                    onRowsPerPageChange={handleChangeRowsPerPage}
                    rowsPerPageOptions={[12, 24, 36, 48]}
                    labelRowsPerPage="Items per page:"
                    sx={{
                      '.MuiTablePagination-select': {
                        borderRadius: 2,
                        bgcolor: 'white',
                        border: '1px solid',
                        borderColor: 'divider',
                        '&:hover': {
                          borderColor: 'primary.main'
                        }
                      }
                    }}
                  />
                  <Pagination
                    count={Math.ceil(filteredDeals.length / rowsPerPage)}
                    page={page + 1}
                    onChange={(e, p) => setPage(p - 1)}
                    color="primary"
                    size={isMobile ? "small" : "medium"}
                    sx={{
                      '& .MuiPaginationItem-root': {
                        borderRadius: 2,
                        '&.Mui-selected': {
                          background: 'linear-gradient(45deg, #1976d2 30%, #42a5f5 90%)',
                          color: 'white',
                          '&:hover': {
                            bgcolor: 'primary.dark'
                          }
                        }
                      }
                    }}
                  />
                </Box>
              )}
            </Box>
          </Box>
        </Container>

        {/* Deal Commitment Dialog */}
        <Dialog
          open={getDealOpen}
          onClose={handleCloseGetDeal}
          fullWidth
          maxWidth="md"
        >
          <DialogTitle sx={{ pb: 1 }}>
            {selectedDeal && (
              <Box>
                <Typography variant="h6" fontWeight="bold">
                  {userCommitments.includes(selectedDeal._id) ? 'Update Your Commitment' : 'Make New Commitment'}: {selectedDeal.name}
                </Typography>
                {selectedDeal.commitmentStartAt && selectedDeal.commitmentEndsAt && (
                  <Box sx={{ mt: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="body2" color="text.secondary">
                      Commitment Period:
                    </Typography>
                    <Chip
                      size="small"
                      label={`${new Date(selectedDeal.commitmentStartAt).toLocaleDateString()} - ${new Date(selectedDeal.commitmentEndsAt).toLocaleDateString()}`}
                      color={isCommitmentPeriodEnded(selectedDeal) ? "error" : !isCommitmentPeriodActive(selectedDeal) ? "warning" : "success"}
                      variant="outlined"
                    />
                  </Box>
                )}
              </Box>
            )}
          </DialogTitle>
          <DialogContent sx={{ pt: '16px !important' }}>
            {selectedDeal && (
              <Grid container spacing={3}>
                <Grid item xs={12} md={8}>
                  {/* Commitment Period Status Alert */}
                  {selectedDeal.commitmentStartAt && selectedDeal.commitmentEndsAt && (
                    <Box sx={{ mb: 3 }}>
                      {isCommitmentPeriodEnded(selectedDeal) ? (
                        <Alert severity="error" sx={{ mb: 2 }}>
                          <AlertTitle>Commitment Period Ended</AlertTitle>
                          <Typography variant="body2">
                            The commitment period for this deal ended on {new Date(selectedDeal.commitmentEndsAt).toLocaleDateString()}. 
                            You can no longer make new commitments to this deal.
                          </Typography>
                        </Alert>
                      ) : !isCommitmentPeriodActive(selectedDeal) ? (
                        <Alert severity="warning" sx={{ mb: 2 }}>
                          <AlertTitle>Commitment Period Not Started</AlertTitle>
                          <Typography variant="body2">
                            The commitment period for this deal starts on {new Date(selectedDeal.commitmentStartAt).toLocaleDateString()}. 
                            You can make commitments during the active period.
                          </Typography>
                        </Alert>
                      ) : (
                        <Alert severity="success" sx={{ mb: 2 }}>
                          <AlertTitle>Commitment Period Active</AlertTitle>
                          <Typography variant="body2">
                            The commitment period is currently active. You can make commitments until {new Date(selectedDeal.commitmentEndsAt).toLocaleDateString()}.
                          </Typography>
                        </Alert>
                      )}
                    </Box>
                  )}

                  <Typography variant="h6" gutterBottom>
                    Size & Quantity Selection
                  </Typography>

                  {userCommitments.includes(selectedDeal._id) && (
                    <Alert severity="info" sx={{ mb: 2 }}>
                      <AlertTitle>Updating Your Commitment</AlertTitle>
                      <Typography variant="body2">
                        You're updating your existing commitment. The changes will be submitted to the distributor for approval.
                      </Typography>
                    </Alert>
                  )}

                  {/* Size selection with quantity inputs */}
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
                        {selectedDeal.sizes.map((size, index) => {
                          const quantity = selectedSizes[size.size] || 0;

                          // Get collective quantity from all members for this size
                          // For simplicity, we're using the total committed quantity 
                          const collectiveQuantity = selectedDeal.totalCommittedQuantity || 0;

                          // If this is an update, calculate previous commitment quantity
                          let previousQuantity = 0;
                          if (userCommitments.includes(selectedDeal._id)) {
                            // Simplification - in a real implementation, you'd fetch the specific previous quantity
                            previousQuantity = quantity; // Using current selection as proxy
                          }

                          // Calculate projected collective quantity after this change
                          const projectedQuantity = collectiveQuantity - previousQuantity + quantity;

                          // Sort tiers by quantity for display
                          let sortedTiers = size.discountTiers ? [...size.discountTiers].sort((a, b) => a.tierQuantity - b.tierQuantity) : [];

                          // Determine if any tier discount applies based on projected quantity
                          let effectivePrice = size.discountPrice;
                          let appliedTier = null;
                          let projectedTier = null;
                          let priceWillChange = false;

                          if (size.discountTiers && size.discountTiers.length > 0) {
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
                                  color={priceWillChange ? (effectivePrice < size.discountPrice ? theme.palette.success.main : theme.palette.error.main) : theme.palette.primary.contrastText}
                                >
                                  ${effectivePrice.toFixed(2)}
                                </Typography>
                                {priceWillChange && (
                                  <Typography
                                    variant="caption"
                                    color={effectivePrice < size.discountPrice ? theme.palette.success.main : theme.palette.error.main}
                                    sx={{ display: 'block', textDecoration: effectivePrice < size.discountPrice ? 'line-through' : 'none' }}
                                  >
                                    {effectivePrice < size.discountPrice ? `was $${size.discountPrice.toFixed(2)}` : `was $${(appliedTier ? appliedTier.tierDiscount : size.discountPrice).toFixed(2)}`}
                                  </Typography>
                                )}
                                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontSize: '0.8rem' }}>
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
                                  color={priceWillChange ? (effectivePrice < size.discountPrice ? theme.palette.success.main : theme.palette.error.contrastText) : theme.palette.primary.contrastText}
                                >
                                  ${subtotal.toFixed(2)}
                                </Typography>
                                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontSize: '0.8rem' }}>
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

                  {/* Size-specific discount tiers */}
                  {selectedDeal.sizes.some(size => size.discountTiers && size.discountTiers.length > 0) && (
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

                      {selectedDeal.sizes.map((size, sizeIndex) => {
                        if (!size.discountTiers || size.discountTiers.length === 0) return null;

                        // Get the current quantity for this size from this user
                        const userQuantity = selectedSizes[size.size] || 0;

                        // Get collective quantity from all members for this size
                        // For simplicity, we're using the total committed quantity 
                        const collectiveQuantity = selectedDeal.totalCommittedQuantity || 0;

                        // If this is an update, calculate previous commitment quantity
                        let previousQuantity = 0;
                        if (userCommitments.includes(selectedDeal._id)) {
                          // Simplification - in a real implementation, you'd fetch the specific previous quantity
                          previousQuantity = userQuantity; // Using current selection as proxy
                        }

                        // Calculate projected collective quantity after this change
                        const projectedQuantity = collectiveQuantity - previousQuantity + userQuantity;

                        // Sort tiers by quantity for display - previously declared in other sections
                        let sortedTiers = size.discountTiers ? [...size.discountTiers].sort((a, b) => a.tierQuantity - b.tierQuantity) : [];

                        // Find the currently applied tier and next tier
                        let currentTier = null;
                        let nextTier = null;

                        for (let i = 0; i < sortedTiers.length; i++) {
                          if (collectiveQuantity >= sortedTiers[i].tierQuantity) {
                            currentTier = sortedTiers[i];
                            if (i < sortedTiers.length - 1) {
                              nextTier = sortedTiers[i + 1];
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
                          if (projectedQuantity >= sortedTiers[i].tierQuantity) {
                            projectedTier = sortedTiers[i];
                            if (i < sortedTiers.length - 1) {
                              projectedNextTier = sortedTiers[i + 1];
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
                                label={`Your Selection: ${userQuantity} units` || '0 units'}
                                color="primary.contrastText"
                                variant="outlined"
                              />
                              <Chip
                                size="small"
                                label={`Current Total: ${collectiveQuantity} units` || '0 units'}
                                color="secondary"
                                variant="outlined"
                                sx={{ ml: 1 }}
                              />
                              <Chip
                                size="small"
                                label={`Projected: ${projectedQuantity} units` || '0 units'}
                                color={wouldUnlockNewTier ? theme.palette.success.main : wouldLoseTier ? theme.palette.error.main : theme.palette.info.main || 'info'}
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
                                const wouldBeApplied = projectedQuantity >= tier.tierQuantity;
                                const isNext = nextTier && tier.tierQuantity === nextTier.tierQuantity;
                                const unitsNeeded = tier.tierQuantity - projectedQuantity;
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
                                          isNext ? theme.palette.info.main : 'divider',
                                      gap: 1
                                    }}
                                  >
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                      <Typography variant="body1">
                                        ${tier.tierDiscount.toFixed(2)} per bottle at {tier.tierQuantity}+ units
                                      </Typography>
                                    </Box>
                                    <Box>
                                      {wouldBeApplied ? (
                                        <Chip
                                          label={isCurrentlyApplied ? "APPLIED" : "WILL BE APPLIED"}
                                          color="success"
                                          size="small"
                                          sx={{
                                            bgcolor: 'white',
                                            color: 'success.dark',
                                            fontWeight: 'bold'
                                          }}
                                        />
                                      ) : isCurrentlyApplied ? (
                                        <Chip
                                          label="WILL BE LOST"
                                          color="error"
                                          size="small"
                                          sx={{
                                            bgcolor: 'white',
                                            color: 'error.dark',
                                            fontWeight: 'bold'
                                          }}
                                        />
                                      ) : (
                                        <Chip
                                          label={`${unitsNeeded} more needed`}
                                          color="primary"
                                          size="small"
                                          sx={{
                                            bgcolor: 'white',
                                            color: isNext ? theme.palette.info.dark : theme.palette.text.primary || 'primary',
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

                  {/* Global discount tiers (old implementation) */}
                  {selectedDeal.discountTiers && selectedDeal.discountTiers.length > 0 && (
                    <Box sx={{
                      mb: 1,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 0.5,
                      bgcolor: theme.palette.info.light,
                      borderRadius: 1,
                      px: 1,
                      py: 0.3
                    }}>
                      <Typography variant="caption" color={theme.palette.info.dark} sx={{ fontWeight: 'medium' }}>
                        Volume Discount: As low as ${Math.min(...selectedDeal.discountTiers.map(tier => tier.tierDiscount)).toFixed(2)} per unit
                      </Typography>
                    </Box>
                  )}

                </Grid>

                <Grid item xs={12} md={4}>
                  <Paper sx={{ p: 2, bgcolor: theme.palette.primary.light, color: theme.palette.primary.contrastText, borderRadius: 2, mb: 2 }}>
                    <Typography variant="h6" gutterBottom>
                      Order Summary
                    </Typography>

                    <Divider sx={{ borderColor: 'rgba(255,255,255,0.2)', my: 1 }} />

                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body1">Items Subtotal:</Typography>
                      <Typography variant="body1" fontWeight="medium">
                        ${(totalPrice + totalSavings).toFixed(2)}
                      </Typography>
                    </Box>

                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body1">Total Savings:</Typography>
                      <Typography variant="body1" fontWeight="medium" color={theme.palette.success.light}>
                        -${totalSavings.toFixed(2)}
                      </Typography>
                    </Box>

                    {activeTier && (
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="body1">Volume Discount:</Typography>
                        <Typography variant="body1" fontWeight="medium" color={theme.palette.success.light}>
                          Fixed price: ${activeTier.tierDiscount.toFixed(2)}/unit
                        </Typography>
                      </Box>
                    )}

                    <Divider sx={{ borderColor: 'rgba(255,255,255,0.2)', my: 1 }} />

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

                  {selectedDeal?.minQtyForDiscount && (
                    <Alert
                      severity="warning"
                      sx={{ mb: 2 }}
                    >
                      <Typography variant="body2">
                        This deal requires a minimum of {selectedDeal.minQtyForDiscount} units from all members combined.
                      </Typography>
                    </Alert>
                  )}
                </Grid>
              </Grid>
            )}
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
              color={selectedDeal && userCommitments.includes(selectedDeal._id) ? "warning" : "primary"}
              onClick={handleCommitDeal}
              disabled={isCommitting || totalQuantity === 0 || !canPerformCommitmentActions()}
              sx={{
                borderRadius: 2,
                background: selectedDeal && userCommitments.includes(selectedDeal._id) ? 'linear-gradient(45deg, #FF9800 30%, #FFC107 90%)' : undefined,
                '&:hover': {
                  background: selectedDeal && userCommitments.includes(selectedDeal._id) ? 'linear-gradient(45deg, #F57C00 30%, #FF9800 90%)' : undefined
                }
              }}
              startIcon={selectedDeal && userCommitments.includes(selectedDeal._id) ? <EditIcon /> : <AddShoppingCart />}
            >
              {isCommitting ? (
                <CircularProgress size={24} color="inherit" />
              ) : !canPerformCommitmentActions() ? (
                'No Permission'
              ) : (
                selectedDeal && userCommitments.includes(selectedDeal._id) ? 'Update Commitment' : 'Confirm Commitment'
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
      </Box>
    </>
  );
};

export default DisplayDeals;
