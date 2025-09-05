import React, { useState, useEffect } from 'react';
import { 
  TextField, Button, Container, Typography, Grid, Box, Paper, Skeleton, 
  CircularProgress, IconButton, Divider, Card, CardContent, List, ListItem, 
  ListItemText, Dialog, DialogTitle, DialogContent, DialogActions, 
  InputAdornment, Select, MenuItem, FormControl, InputLabel, FormHelperText,
  Avatar, Chip, Fade, Tooltip, Zoom, alpha, Alert, AlertTitle
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { useNavigate } from 'react-router-dom';
import api from '../../../services/api';
import { useAuth } from '../../../middleware/auth';
import CloudinaryUpload from '../../../Components/cloudinary/cloudinary';
import Toast from '../../../Components/Toast/Toast';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import SaveIcon from '@mui/icons-material/Save';
import StraightenIcon from '@mui/icons-material/Straighten';
import StorefrontIcon from '@mui/icons-material/Storefront';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import PriceChangeIcon from '@mui/icons-material/PriceChange';
import CategoryIcon from '@mui/icons-material/Category';
import InsertPhotoIcon from '@mui/icons-material/InsertPhoto';
import MediaManager, { MediaSelector, MediaUploader } from '../../../Components/MediaManager';
import { differenceInCalendarMonths, endOfMonth, format, isAfter, isBefore, isSameMonth, parse, startOfMonth } from 'date-fns';

// Styled components for enhanced design
const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: '4px 0px',
  borderRadius: 16,
  boxShadow: 'none',
  background: 'transparent',
  position: 'relative',
  overflow: 'hidden',
  transition: 'all 0.3s ease-in-out',
  '&:hover': {
    boxShadow: 'none',
  }
}));

const SectionHeading = styled(Box)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: theme.spacing(2),
  marginTop: theme.spacing(3),
  position: 'relative',
  '&::before': {
    content: '""',
    position: 'absolute',
    left: 0,
    bottom: -8,
    width: '40px',
    height: '3px',
    backgroundColor: theme.palette.primary.main,
    borderRadius: '10px',
  }
}));

const SectionTitle = styled(Typography)(({ theme }) => ({
  fontWeight: 600,
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1),
  '& svg': {
    color: theme.palette.primary.main,
  }
}));

const StyledCard = styled(Card)(({ theme }) => ({
  borderRadius: 12,
  transition: 'all 0.3s ease',
  height: '100%',
  '&:hover': {
    transform: 'translateY(-5px)',
    boxShadow: theme.shadows[6],
  }
}));

const StyledIconButton = styled(IconButton)(({ theme, color = 'primary' }) => ({
  backgroundColor: alpha(theme.palette.primary.main, 0.1),
  marginLeft: theme.spacing(1),
  transition: 'all 0.2s',
  '&:hover': {
    backgroundColor: alpha(theme.palette.primary.main, 0.2),
  }
}));

const ActionButton = styled(Button)(({ theme }) => ({
  borderRadius: 8,
  padding: theme.spacing(1, 3),
  boxShadow: 'none',
  fontWeight: 600,
  textTransform: 'none',
  transition: 'all 0.3s',
  '&:hover': {
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
    transform: 'translateY(-2px)'
  }
}));

const SubmitButton = styled(Button)(({ theme }) => ({
  borderRadius: 30,
  padding: theme.spacing(1.5, 4),
  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
  fontWeight: 600,
  textTransform: 'none',
  fontSize: '1rem',
  transition: 'all 0.3s',
  '&:hover': {
    boxShadow: '0 8px 16px rgba(0, 0, 0, 0.2)',
    transform: 'translateY(-3px)'
  }
}));

const SavingsChip = styled(Chip)(({ theme, saving }) => ({
  backgroundColor: saving > 25 
    ? alpha(theme.palette.success.main, 0.15)
    : alpha(theme.palette.primary.main, 0.15),
  color: saving > 25 ? theme.palette.success.dark : theme.palette.primary.dark,
  fontWeight: 600,
  border: 'none',
  borderRadius: 16,
}));

const TierItem = styled(ListItem)(({ theme }) => ({
  backgroundColor: alpha(theme.palette.background.paper, 0.7),
  marginBottom: theme.spacing(1.5),
  borderRadius: 12,
  border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
  transition: 'all 0.2s',
  '&:hover': {
    backgroundColor: alpha(theme.palette.primary.light, 0.05),
    borderColor: alpha(theme.palette.primary.main, 0.3),
  }
}));

const CreateDealSkeleton = () => (
  <Container maxWidth="lg" sx={{ py: 4 }}>
    <Skeleton variant="text" width={100} height={40} sx={{ mb: 3 }} />
    
    <Fade in={true} timeout={800}>
      <StyledPaper>
        <Skeleton variant="text" width={240} height={40} sx={{ mb: 4 }} />
        
        <Grid container spacing={4}>
          <Grid item xs={12} md={6}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Skeleton variant="circular" width={24} height={24} sx={{ mr: 1 }} />
              <Skeleton variant="text" width={120} />
            </Box>
            <Skeleton variant="rounded" height={56} sx={{ borderRadius: 2, mb: 3 }} />
            
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Skeleton variant="circular" width={24} height={24} sx={{ mr: 1 }} />
              <Skeleton variant="text" width={150} />
            </Box>
            <Skeleton variant="rounded" height={56} sx={{ borderRadius: 2, mb: 3 }} />
            
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Skeleton variant="circular" width={24} height={24} sx={{ mr: 1 }} />
              <Skeleton variant="text" width={180} />
            </Box>
            <Skeleton variant="rounded" height={100} sx={{ borderRadius: 2, mb: 3 }} />
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Skeleton variant="circular" width={24} height={24} sx={{ mr: 1 }} />
              <Skeleton variant="text" width={140} />
            </Box>
            
            <Grid container spacing={2} sx={{ mb: 3 }}>
              {[...Array(3)].map((_, i) => (
                <Grid item xs={12} sm={6} md={4} key={i}>
                  <Skeleton variant="rounded" height={140} sx={{ borderRadius: 3 }} />
                </Grid>
              ))}
            </Grid>
            
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Skeleton variant="circular" width={24} height={24} sx={{ mr: 1 }} />
              <Skeleton variant="text" width={160} />
            </Box>
            <Skeleton variant="rounded" height={56} sx={{ borderRadius: 2, mb: 3 }} />
          </Grid>
          
          <Grid item xs={12}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Skeleton variant="circular" width={24} height={24} sx={{ mr: 1 }} />
              <Skeleton variant="text" width={130} />
            </Box>
            <Skeleton variant="rounded" height={120} sx={{ borderRadius: 2, mb: 4 }} />
          </Grid>
          
          <Grid item xs={12}>
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
              <Skeleton variant="rounded" width={200} height={56} sx={{ borderRadius: 30 }} />
            </Box>
          </Grid>
        </Grid>
      </StyledPaper>
    </Fade>
  </Container>
);

// Size dialog component
const SizeDialog = ({ open, onClose, onSave, initialSize }) => {
  const [size, setSize] = useState('');
  const [originalCost, setOriginalCost] = useState('');
  const [discountPrice, setDiscountPrice] = useState('');
  const [error, setError] = useState('');
  const [discountTiers, setDiscountTiers] = useState([]);
  const [tierDialogOpen, setTierDialogOpen] = useState(false);
  const [selectedTier, setSelectedTier] = useState(null);
  
  // Common bottle sizes
  const bottleSizes = [
    '100ml','187ml', '200ml', '350ml','375ml', '500ml', '700ml', '750ml', '1L', '1.5L', '1.75L', '3L', '5L'
  ];

  useEffect(() => {
    if (initialSize) {
      setSize(initialSize.size);
      setOriginalCost(initialSize.originalCost);
      setDiscountPrice(initialSize.discountPrice);
      setDiscountTiers(initialSize.discountTiers || []);
    } else {
      setSize('');
      setOriginalCost('');
      setDiscountPrice('');
      setDiscountTiers([]);
    }
    setError('');
  }, [initialSize, open]);

  const handleSave = () => {
    // Validate
    if (!size || !originalCost || !discountPrice) {
      setError('All fields are required');
      return;
    }

    if (Number(discountPrice) >= Number(originalCost)) {
      setError('Discount price must be less than original cost');
      return;
    }

    onSave({
      size,
      originalCost: Number(originalCost),
      discountPrice: Number(discountPrice),
      discountTiers: discountTiers
    });
    onClose();
  };

  // Calculate savings
  const calculateSavings = () => {
    if (!originalCost || !discountPrice) return { percent: 0, amount: 0 };
    
    const original = Number(originalCost);
    const discount = Number(discountPrice);
    
    if (isNaN(original) || isNaN(discount) || original <= 0 || discount <= 0 || discount >= original) {
      return { percent: 0, amount: 0 };
    }
    
    const savingsAmount = original - discount;
    const savingsPercent = ((savingsAmount / original) * 100).toFixed(2);
    
    return { percent: savingsPercent, amount: savingsAmount.toFixed(2) };
  };
  
  // Handle tier dialog open for adding a new tier
  const handleAddTier = () => {
    setSelectedTier(null);
    setTierDialogOpen(true);
  };
  
  // Handle tier dialog open for editing an existing tier
  const handleEditTier = (index) => {
    setSelectedTier({ ...discountTiers[index], index });
    setTierDialogOpen(true);
  };
  
  // Handle saving a tier from the tier dialog
  const handleSaveTier = (tierData) => {
    if (selectedTier && selectedTier.index !== undefined) {
      // Edit existing tier
      const updatedTiers = [...discountTiers];
      updatedTiers[selectedTier.index] = tierData;
      
      // Sort by quantity
      const sortedTiers = updatedTiers.sort((a, b) => a.tierQuantity - b.tierQuantity);
      
      setDiscountTiers(sortedTiers);
    } else {
      // Add new tier
      const newTiers = [...discountTiers, tierData];
      
      // Sort by quantity
      const sortedTiers = newTiers.sort((a, b) => a.tierQuantity - b.tierQuantity);
      
      setDiscountTiers(sortedTiers);
    }
  };
  
  // Handle deleting a tier
  const handleDeleteTier = (index) => {
    setDiscountTiers(prevTiers => prevTiers.filter((_, i) => i !== index));
  };
  
  const savings = calculateSavings();
  const isValidInput = size && originalCost && discountPrice && Number(discountPrice) < Number(originalCost);

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="sm" 
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          overflow: 'hidden'
        }
      }}
      TransitionComponent={Zoom}
    >
      <DialogTitle sx={{ 
        backgroundColor: (theme) => alpha(theme.palette.primary.main, 0.1),
        display: 'flex',
        alignItems: 'center',
        gap: 1.5,
        py: 2
      }}>
        <StraightenIcon color="primary" />
        <Typography variant="h6" component="span" sx={{ fontWeight: 600 }}>
          {initialSize ? 'Edit Size Option' : 'Add New Size Option'}
        </Typography>
      </DialogTitle>
      
      <DialogContent sx={{ pt: 3, pb: 1 }}>
        <Box component="form" sx={{ mt: 2 }}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <FormControl fullWidth required error={!!error && !size}>
                <InputLabel id="size-select-label">Bottle Size</InputLabel>
                <Select
                  labelId="size-select-label"
                  id="size-select"
                  value={size}
                  onChange={(e) => setSize(e.target.value)}
                  label="Bottle Size"
                  sx={{ borderRadius: 2 }}
                  MenuProps={{
                    PaperProps: {
                      sx: {
                        maxHeight: 48 * 4.5,
                        borderRadius: 2,
                      },
                    },
                  }}
                >
                  {bottleSizes.map((option) => (
                    <MenuItem key={option} value={option}>{option}</MenuItem>
                  ))}
                </Select>
                {!!error && !size && <FormHelperText>Size is required</FormHelperText>}
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                label="Original Cost"
                type="number"
                InputProps={{
                  startAdornment: <InputAdornment position="start">$</InputAdornment>,
                  sx: { borderRadius: 2 }
                }}
                value={originalCost}
                onChange={(e) => setOriginalCost(e.target.value)}
                inputProps={{ min: "0" }}
                fullWidth
                required
                error={!!error && !originalCost}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                label="Discount Price"
                type="number"
                InputProps={{
                  startAdornment: <InputAdornment position="start">$</InputAdornment>,
                  sx: { borderRadius: 2 }
                }}
                value={discountPrice}
                onChange={(e) => setDiscountPrice(e.target.value)}
                inputProps={{ min: "0" }}
                fullWidth
                required
                error={!!error && (!discountPrice || Number(discountPrice) >= Number(originalCost))}
              />
            </Grid>
            
            {isValidInput && (
              <Grid item xs={12}>
                <Paper 
                  elevation={0}
                  sx={{
                    p: 2, 
                    mt: 1, 
                    borderRadius: 2,
                    backgroundColor: (theme) => alpha(theme.palette.success.light, 0.1),
                    border: (theme) => `1px dashed ${alpha(theme.palette.success.main, 0.3)}`,
                  }}
                >
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Customer Savings:
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <SavingsChip 
                        label={`${savings.percent}%`} 
                        saving={Number(savings.percent)}
                        size="small"
                        icon={<PriceChangeIcon />}
                      />
                      <SavingsChip 
                        label={`$${savings.amount}`} 
                        saving={Number(savings.percent)}
                        size="small"
                      />
                    </Box>
                  </Box>
                </Paper>
              </Grid>
            )}
            
            {/* Discount Tiers Section */}
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
                  Volume Discount Tiers for this Size
                </Typography>
                <ActionButton 
                  variant="outlined" 
                  color="primary.contrastText" 
                  startIcon={<AddIcon color="primary.contrastText" />}
                  onClick={handleAddTier}
                  disabled={!isValidInput}
                  size="small"
                >
                  Add Tier
                </ActionButton>
              </Box>
              
              {!isValidInput && (
                <Paper 
                  elevation={0} 
                  sx={{ 
                    p: 2, 
                    mb: 2, 
                    borderRadius: 2,
                    backgroundColor: (theme) => alpha(theme.palette.warning.light, 0.1),
                    border: '1px dashed rgba(255, 152, 0, 0.3)'
                  }}
                >
                  <Typography variant="body2" color="warning.dark">
                    Please complete the size information above before adding discount tiers.
                  </Typography>
                </Paper>
              )}
              
              {isValidInput && discountTiers.length === 0 ? (
                <Paper 
                  elevation={0} 
                  sx={{ 
                    textAlign: 'center', 
                    py: 3, 
                    px: 2, 
                    backgroundColor: (theme) => alpha(theme.palette.primary.light, 0.05),
                    border: '1px dashed rgba(0, 0, 0, 0.12)',
                    borderRadius: 2
                  }}
                >
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    No discount tiers added yet for this size. Tiers allow for greater discounts at higher quantities.
                  </Typography>
                  <ActionButton 
                    variant="outlined" 
                    color="primary.contrastText"
                    onClick={handleAddTier}
                    startIcon={<AddIcon color="primary.contrastText" />}
                    size="small"
                    sx={{ mt: 1 }}
                  >
                    Add First Tier
                  </ActionButton>
                </Paper>
              ) : (
                <List sx={{ mt: 1 }}>
                  {discountTiers.map((tier, index) => (
                    <TierItem 
                      key={index}
                      secondaryAction={
                        <Box>
                          <StyledIconButton edge="end" aria-label="edit" onClick={() => handleEditTier(index)}>
                            <EditIcon fontSize="small" color="primary.contrastText" />
                          </StyledIconButton>
                          <StyledIconButton edge="end" aria-label="delete" onClick={() => handleDeleteTier(index)} color="error">
                            <DeleteIcon fontSize="small" color="primary.contrastText" />
                          </StyledIconButton>
                        </Box>
                      }
                      disablePadding
                      sx={{ p: 2 }}
                    >
                      <Box sx={{ width: '100%' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                          <Chip 
                            label={`Tier ${index + 1}`} 
                            size="small" 
                            color="primary" 
                            sx={{ mr: 1.5, fontWeight: 600 }}
                          />
                          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                            ${tier.tierDiscount.toFixed(2)} price at {tier.tierQuantity}+ units
                          </Typography>
                        </Box>
                        <Typography variant="body2" color="text.secondary">
                          When total commitments for this size reach {tier.tierQuantity} units, all purchases of this size will be at ${tier.tierDiscount.toFixed(2)} per unit
                        </Typography>
                      </Box>
                    </TierItem>
                  ))}
                </List>
              )}
            </Grid>
            
            {error && (
              <Grid item xs={12}>
                <Typography color="error" variant="body2" sx={{ mt: 1 }}>{error}</Typography>
              </Grid>
            )}
          </Grid>
        </Box>
      </DialogContent>
      
      <DialogActions sx={{ px: 3, py: 2, bgcolor: 'background.paper' }}>
        <Button 
          onClick={onClose}
          variant="outlined"
          sx={{ 
            borderRadius: 2,
            px: 3
          }}
        >
          Cancel
        </Button>
        <Button 
          onClick={handleSave} 
          variant="contained" 
          color="primary"
          startIcon={<SaveIcon color="primary.contrastText" />}
          sx={{ 
            borderRadius: 2,
            px: 3
          }}
        >
          Save Size
        </Button>
      </DialogActions>
      
      {/* Size-Specific Tier Dialog */}
      <SizeDiscountTierDialog
        open={tierDialogOpen}
        onClose={() => setTierDialogOpen(false)}
        onSave={handleSaveTier}
        initialTier={selectedTier}
        basePrice={Number(discountPrice)}
      />
    </Dialog>
  );
};

// Size-specific discount tier dialog
const SizeDiscountTierDialog = ({ open, onClose, onSave, initialTier, basePrice }) => {
  const [tierQuantity, setTierQuantity] = useState('');
  const [tierDiscount, setTierDiscount] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (initialTier) {
      setTierQuantity(initialTier.tierQuantity);
      setTierDiscount(initialTier.tierDiscount);
    } else {
      setTierQuantity('');
      setTierDiscount('');
    }
    setError('');
  }, [initialTier, open]);

  const handleSave = () => {
    // Validate
    if (!tierQuantity || !tierDiscount) {
      setError('All fields are required');
      return;
    }

    if (Number(tierQuantity) <= 0) {
      setError('Quantity threshold must be greater than 0');
      return;
    }

    if (Number(tierDiscount) <= 0) {
      setError('Discount price must be greater than 0');
      return;
    }

    if (Number(tierDiscount) >= basePrice) {
      setError(`Discount price must be less than base price ($${basePrice})`);
      return;
    }

    onSave({
      tierQuantity: Number(tierQuantity),
      tierDiscount: Number(tierDiscount)
    });
    onClose();
  };

  const isValidInput = tierQuantity && 
                     tierDiscount && 
                     Number(tierQuantity) > 0 &&
                     Number(tierDiscount) > 0 &&
                     Number(tierDiscount) < basePrice;

  // Calculate savings from base price
  const calculateSavings = () => {
    if (!basePrice || !tierDiscount) return { percent: 0, amount: 0 };
    
    const discountAmount = basePrice - Number(tierDiscount);
    const savingsPercent = ((discountAmount / basePrice) * 100).toFixed(2);
    
    return { percent: savingsPercent, amount: discountAmount.toFixed(2) };
  };
  
  const savings = calculateSavings();

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="sm" 
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          overflow: 'hidden'
        }
      }}
      TransitionComponent={Zoom}
    >
      <DialogTitle sx={{ 
        backgroundColor: (theme) => alpha(theme.palette.primary.main, 0.1),
        display: 'flex',
        alignItems: 'center',
        gap: 1.5,
        py: 2
      }}>
        <LocalOfferIcon color="primary" />
        <Typography variant="h6" component="span" sx={{ fontWeight: 600 }}>
          {initialTier ? 'Edit Size Discount Tier' : 'Add Size Volume Discount Tier'}
        </Typography>
      </DialogTitle>
      
      <DialogContent sx={{ pt: 3, pb: 1 }}>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Size-specific volume discount tiers provide additional discounts when commitments for this size reach specified quantities.
        </Typography>
        
        <Alert severity="info" sx={{ mb: 3 }}>
          <AlertTitle>Collective Volume Discount Tiers</AlertTitle>
          <Typography variant="body2">
            The discount tiers you set will be applied <strong>collectively</strong> - when the combined quantity of all member commitments 
            for this size reaches a tier threshold, <strong>all members</strong> will automatically receive the discount price!
          </Typography>
        </Alert>
        
        <Box component="form" sx={{ mt: 2 }}>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Quantity Threshold"
                type="number"
                value={tierQuantity}
                onChange={(e) => setTierQuantity(e.target.value)}
                fullWidth
                required
                InputProps={{
                  sx: { borderRadius: 2 },
                  endAdornment: <InputAdornment position="end">units</InputAdornment>,
                }}
                inputProps={{ min: "1" }}
                error={!!error && (!tierQuantity || Number(tierQuantity) <= 0)}
                helperText="Must be greater than 0 units"
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                label="Discount Price"
                type="number"
                InputProps={{
                  startAdornment: <InputAdornment position="start">$</InputAdornment>,
                  sx: { borderRadius: 2 }
                }}
                value={tierDiscount}
                onChange={(e) => setTierDiscount(e.target.value)}
                inputProps={{ min: "0" }}
                fullWidth
                required
                error={!!error && (!tierDiscount || Number(tierDiscount) <= 0 || Number(tierDiscount) >= basePrice)}
                helperText={`Enter the absolute discount price for this tier (less than $${basePrice})`}
              />
            </Grid>
            
            {isValidInput && (
              <Grid item xs={12}>
                <Paper 
                  elevation={0}
                  sx={{
                    p: 2, 
                    mt: 1, 
                    borderRadius: 2,
                    backgroundColor: (theme) => alpha(theme.palette.info.light, 0.1),
                    border: (theme) => `1px dashed ${alpha(theme.palette.info.main, 0.3)}`,
                  }}
                >
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', flexDirection: 'column', gap: 1 }}>
                  <Typography variant="body2" color="text.secondary">
                      When total commitments for this size reach <b>{tierQuantity} units</b> or more, 
                      all purchases will be priced at <b>${tierDiscount}</b> per unit instead of ${basePrice}.
                  </Typography>
                    
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1 }}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Customer Savings at Tier:
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <SavingsChip 
                          label={`${savings.percent}%`} 
                          saving={Number(savings.percent)}
                          size="small"
                          icon={<PriceChangeIcon />}
                        />
                        <SavingsChip 
                          label={`$${savings.amount} per unit`} 
                          saving={Number(savings.percent)}
                          size="small"
                        />
                      </Box>
                    </Box>
                  </Box>
                </Paper>
              </Grid>
            )}
            
            {error && (
              <Grid item xs={12}>
                <Typography color="error" variant="body2" sx={{ mt: 1 }}>{error}</Typography>
              </Grid>
            )}
          </Grid>
        </Box>
      </DialogContent>
      
      <DialogActions sx={{ px: 3, py: 2, bgcolor: 'background.paper' }}>
        <Button 
          onClick={onClose}
          variant="outlined"
          sx={{ 
            borderRadius: 2,
            px: 3
          }}
        >
          Cancel
        </Button>
        <Button 
          onClick={handleSave} 
          variant="contained" 
          color="primary"
          startIcon={<SaveIcon color="primary.contrastText" />}
          sx={{ 
            borderRadius: 2,
            px: 3
          }}
        >
          Save Tier
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// --- Month/Year Deal Deadlines Table ---
function generateDealMonthsTable() {
  // Get current date in New Mexico timezone (Mountain Time)
  const newMexicoTime = new Date().toLocaleString("en-US", {timeZone: "America/Denver"});
  const currentDate = new Date(newMexicoTime);
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth(); // 0-11
  
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  
  const table = [];
  
  // Helper function to create New Mexico timezone dates
  const createNewMexicoDate = (year, month, day, hour = 0, minute = 0, second = 0, millisecond = 0) => {
    // Create the date in local timezone first
    const date = new Date(year, month, day, hour, minute, second, millisecond);
    return date;
  };
  
  // Helper function to format date as YYYY-MM-DD
  const formatDate = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };
  
  // Generate for current year and next year
  for (let year = currentYear; year <= currentYear + 1; year++) {
    months.forEach((month, monthIndex) => {
      // Skip past months in current year
      if (year === currentYear && monthIndex < currentMonth) {
        return;
      }
      
      // Calculate deadline (3 days before the month starts) - New Mexico time
      const monthStart = createNewMexicoDate(year, monthIndex, 1);
      const deadline = new Date(monthStart);
      deadline.setDate(deadline.getDate() - 3); // 3 days before month starts
      
      // Deal timeframe is the complete month (1st to last day) - New Mexico time
      const timeframeStart = createNewMexicoDate(year, monthIndex, 1, 0, 0, 0, 0); // 1st day at 12:00 AM New Mexico time
      // Get the last day of the current month
      const lastDayOfMonth = new Date(year, monthIndex + 1, 0).getDate();
      const timeframeEnd = createNewMexicoDate(year, monthIndex, lastDayOfMonth, 23, 59, 59, 999); // Last day at 11:59 PM New Mexico time
      
      // Commitment timeframe based on the provided table - New Mexico time
      let commitmentStart, commitmentEnd;
      
      if (month === 'July' && year === 2025) {
        commitmentStart = createNewMexicoDate(2025, 5, 29, 0, 0, 0, 0); // Jun 29, 2025 at 12:00 AM New Mexico time
        commitmentEnd = createNewMexicoDate(2025, 6, 10, 23, 59, 59, 999); // Jul 10, 2025 at 11:59 PM New Mexico time
      } else if (month === 'August' && year === 2025) {
        commitmentStart = createNewMexicoDate(2025, 7, 1, 0, 0, 0, 0); // Aug 1, 2025 at 12:00 AM New Mexico time
        commitmentEnd = createNewMexicoDate(2025, 7, 12, 23, 59, 59, 999); // Aug 12, 2025 at 11:59 PM New Mexico time
      } else if (month === 'September' && year === 2025) {
        commitmentStart = createNewMexicoDate(2025, 8, 1, 0, 0, 0, 0); // Sep 1, 2025 at 12:00 AM New Mexico time
        commitmentEnd = createNewMexicoDate(2025, 8, 10, 23, 59, 59, 999); // Sep 10, 2025 at 11:59 PM New Mexico time
      } else if (month === 'October' && year === 2025) {
        commitmentStart = createNewMexicoDate(2025, 9, 1, 0, 0, 0, 0); // Oct 1, 2025 at 12:00 AM New Mexico time
        commitmentEnd = createNewMexicoDate(2025, 9, 11, 23, 59, 59, 999); // Oct 11, 2025 at 11:59 PM New Mexico time
      } else if (month === 'November' && year === 2025) {
        commitmentStart = createNewMexicoDate(2025, 10, 1, 0, 0, 0, 0); // Nov 1, 2025 at 12:00 AM New Mexico time
        commitmentEnd = createNewMexicoDate(2025, 10, 10, 23, 59, 59, 999); // Nov 10, 2025 at 11:59 PM New Mexico time
      } else if (month === 'December' && year === 2025) {
        commitmentStart = createNewMexicoDate(2025, 11, 1, 0, 0, 0, 0); // Dec 1, 2025 at 12:00 AM New Mexico time
        commitmentEnd = createNewMexicoDate(2025, 11, 10, 23, 59, 59, 999); // Dec 10, 2025 at 11:59 PM New Mexico time
      } else if (month === 'January' && year === 2026) {
        commitmentStart = createNewMexicoDate(2025, 11, 29, 0, 0, 0, 0); // Dec 29, 2025 at 12:00 AM New Mexico time
        commitmentEnd = createNewMexicoDate(2026, 0, 9, 23, 59, 59, 999); // Jan 9, 2026 at 11:59 PM New Mexico time
      } else if (month === 'February' && year === 2026) {
        commitmentStart = createNewMexicoDate(2026, 1, 2, 0, 0, 0, 0); // Feb 2, 2026 at 12:00 AM New Mexico time
        commitmentEnd = createNewMexicoDate(2026, 1, 12, 23, 59, 59, 999); // Feb 12, 2026 at 11:59 PM New Mexico time
      } else if (month === 'March' && year === 2026) {
        commitmentStart = createNewMexicoDate(2026, 2, 2, 0, 0, 0, 0); // Mar 2, 2026 at 12:00 AM New Mexico time
        commitmentEnd = createNewMexicoDate(2026, 2, 12, 23, 59, 59, 999); // Mar 12, 2026 at 11:59 PM New Mexico time
      } else if (month === 'April' && year === 2026) {
        commitmentStart = createNewMexicoDate(2026, 3, 1, 0, 0, 0, 0); // Apr 1, 2026 at 12:00 AM New Mexico time
        commitmentEnd = createNewMexicoDate(2026, 3, 10, 23, 59, 59, 999); // Apr 10, 2026 at 11:59 PM New Mexico time
      } else if (month === 'May' && year === 2026) {
        commitmentStart = createNewMexicoDate(2026, 3, 30, 0, 0, 0, 0); // Apr 30, 2026 at 12:00 AM New Mexico time
        commitmentEnd = createNewMexicoDate(2026, 4, 11, 23, 59, 59, 999); // May 11, 2026 at 11:59 PM New Mexico time
      } else if (month === 'June' && year === 2026) {
        commitmentStart = createNewMexicoDate(2026, 5, 1, 0, 0, 0, 0); // Jun 1, 2026 at 12:00 AM New Mexico time
        commitmentEnd = createNewMexicoDate(2026, 5, 11, 23, 59, 59, 999); // Jun 11, 2026 at 11:59 PM New Mexico time
      } else if (month === 'July' && year === 2026) {
        commitmentStart = createNewMexicoDate(2026, 5, 29, 0, 0, 0, 0); // Jun 29, 2026 at 12:00 AM New Mexico time
        commitmentEnd = createNewMexicoDate(2026, 6, 10, 23, 59, 59, 999); // Jul 10, 2026 at 11:59 PM New Mexico time
      } else if (month === 'August' && year === 2026) {
        commitmentStart = createNewMexicoDate(2026, 7, 1, 0, 0, 0, 0); // Aug 1, 2026 at 12:00 AM New Mexico time
        commitmentEnd = createNewMexicoDate(2026, 7, 12, 23, 59, 59, 999); // Aug 12, 2026 at 11:59 PM New Mexico time
      } else if (month === 'September' && year === 2026) {
        commitmentStart = createNewMexicoDate(2026, 8, 1, 0, 0, 0, 0); // Sep 1, 2026 at 12:00 AM New Mexico time
        commitmentEnd = createNewMexicoDate(2026, 8, 10, 23, 59, 59, 999); // Sep 10, 2026 at 11:59 PM New Mexico time
      } else if (month === 'October' && year === 2026) {
        commitmentStart = createNewMexicoDate(2026, 9, 1, 0, 0, 0, 0); // Oct 1, 2026 at 12:00 AM New Mexico time
        commitmentEnd = createNewMexicoDate(2026, 9, 11, 23, 59, 59, 999); // Oct 11, 2026 at 11:59 PM New Mexico time
      } else if (month === 'November' && year === 2026) {
        commitmentStart = createNewMexicoDate(2026, 10, 1, 0, 0, 0, 0); // Nov 1, 2026 at 12:00 AM New Mexico time
        commitmentEnd = createNewMexicoDate(2026, 10, 10, 23, 59, 59, 999); // Nov 10, 2026 at 11:59 PM New Mexico time
      } else if (month === 'December' && year === 2026) {
        commitmentStart = createNewMexicoDate(2026, 11, 1, 0, 0, 0, 0); // Dec 1, 2026 at 12:00 AM New Mexico time
        commitmentEnd = createNewMexicoDate(2026, 11, 10, 23, 59, 59, 999); // Dec 10, 2026 at 11:59 PM New Mexico time
      } else {
        // Default: commitment period is first 10 days of the month
        commitmentStart = createNewMexicoDate(year, monthIndex, 1, 0, 0, 0, 0); // 1st day at 12:00 AM New Mexico time
        commitmentEnd = createNewMexicoDate(year, monthIndex, 10, 23, 59, 59, 999); // 10th day at 11:59 PM New Mexico time
      }
      
      table.push({
        month,
        year,
        deadline: formatDate(deadline),
        timeframeStart: formatDate(timeframeStart),
        timeframeEnd: formatDate(timeframeEnd),
        commitmentStart: formatDate(commitmentStart),
        commitmentEnd: formatDate(commitmentEnd)
      });
    });
  }
  
  return table;
}

const DEAL_MONTHS_TABLE = generateDealMonthsTable();

function getAvailableDealMonths() {
  // Get current date in New Mexico timezone
  const newMexicoTime = new Date().toLocaleString("en-US", {timeZone: "America/Denver"});
  const now = new Date(newMexicoTime);
  
  return DEAL_MONTHS_TABLE.filter(row => {
    // Only show months that are this month or in the future in New Mexico time
    const monthDate = new Date(row.year, getMonthIndex(row.month), 1);
    const lastDayOfMonth = new Date(row.year, getMonthIndex(row.month) + 1, 0).getDate();
    const monthEnd = new Date(row.year, getMonthIndex(row.month), lastDayOfMonth, 23, 59, 59, 999);
    return isAfter(monthEnd, now) || isSameMonth(monthDate, now);
  });
}

// Helper function to get month index from month name
function getMonthIndex(monthName) {
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  return months.indexOf(monthName);
}

// Helper function to get the next month name for display (delivery month)
function getNextMonthName(monthName, year) {
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const currentIndex = months.indexOf(monthName);
  const nextIndex = (currentIndex + 1) % 12;
  const nextYear = currentIndex === 11 ? year + 1 : year; // If December, next year
  return { month: months[nextIndex], year: nextYear };
}

const CreateDeal = ({ initialData, onClose, onSubmit }) => {
  const { currentUserId, isImpersonating, userRole } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    sizes: [],
    distributor: currentUserId,
    category: '',
    dealEndsAt: '',
    dealStartAt: '',
    commitmentStartAt: '',
    commitmentEndsAt: '',
    minQtyForDiscount: '',
    singleStoreDeals: '',
    images: [],
  });
  const [toast, setToast] = useState({
    open: false,
    message: '',
    severity: 'success'
  });
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Date constraints for timeframe pickers
  const [minEndDate, setMinEndDate] = useState('');
  const today = new Date().toISOString().slice(0, 16);
  
  // Dialogs state
  const [sizeDialogOpen, setSizeDialogOpen] = useState(false);
  const [selectedSize, setSelectedSize] = useState(null);
  const [selectedDealMonth, setSelectedDealMonth] = useState(null);
  const availableDealMonths = getAvailableDealMonths();

  // Find the selected month row
  const selectedMonthRow = selectedDealMonth
    ? DEAL_MONTHS_TABLE.find(row => `${row.month} ${row.year}` === selectedDealMonth)
    : null;

  // Define categories
  const categories = [
    'AMERICAN WHISKEY', 'BEER', 'BOURBON', 'BRANDY COGNAC', 'CANADIAN', 'GIN', 'IRISH', 
    'LIQUEURS', 'MIXERS', 'NON-ALCOHOLIC', 'RTD', 'RUM', 'SCOTCH', 'SPARKLING WINE',
    'SPECIALTIES', 'TEQUILA', 'UNKNOWN', 'VODKA','WINE'
  ];

  // Function to get current month timeframe in New Mexico time
  const getCurrentMonthTimeframe = () => {
    // Get current date in New Mexico timezone
    const newMexicoTime = new Date().toLocaleString("en-US", {timeZone: "America/Denver"});
    const now = new Date(newMexicoTime);
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    
    // Start of current month at 12:00 AM New Mexico time
    const startOfMonth = new Date(currentYear, currentMonth, 1, 0, 0, 0, 0);
    
    // End of current month at 11:59 PM New Mexico time
    const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const endOfMonth = new Date(currentYear, currentMonth, lastDayOfMonth, 23, 59, 59, 999);
    
    return {
      start: startOfMonth.toISOString().slice(0, 16),
      end: endOfMonth.toISOString().slice(0, 16)
    };
  };

  useEffect(() => {
    if (initialData) {
      setFormData({
        ...initialData,
        dealEndsAt: initialData.dealEndsAt ? new Date(initialData.dealEndsAt).toISOString().slice(0, 16) : '',
        dealStartAt: initialData.dealStartAt ? new Date(initialData.dealStartAt).toISOString().slice(0, 16) : '',
        commitmentStartAt: initialData.commitmentStartAt ? new Date(initialData.commitmentStartAt).toISOString().slice(0, 16) : '',
        commitmentEndsAt: initialData.commitmentEndsAt ? new Date(initialData.commitmentEndsAt).toISOString().slice(0, 16) : '',
        sizes: initialData.sizes || [],
      });
      
      // Set min end date if we have a start date from initialData
      if (initialData.dealStartAt) {
        setMinEndDate(new Date(initialData.dealStartAt).toISOString().slice(0, 16));
      }
    } else {
      // For new deals, set default timeframe to current month
      const timeframe = getCurrentMonthTimeframe();
      setFormData(prevState => ({
        ...prevState,
        dealStartAt: timeframe.start,
        dealEndsAt: timeframe.end
      }));
      setMinEndDate(timeframe.start);
    }
  }, [initialData]);

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    
    // Special handling for dealStartAt
    if (name === 'dealStartAt') {
      // Update the minimum allowed end date when start date changes
      setMinEndDate(value);
      
      // If end date is now before start date, clear it or set it to start date
      if (formData.dealEndsAt && new Date(formData.dealEndsAt) < new Date(value)) {
        setFormData({
          ...formData,
          [name]: value,
          dealEndsAt: '' // Clear the end date since it's now invalid
        });
        return;
      }
    }
    
    setFormData({
      ...formData,
      [name]: files ? files[0] : value
    });
  };

  const handleImageUpload = (url) => {
    setFormData((prevFormData) => ({
      ...prevFormData,
      images: [...prevFormData.images, url]
    }));
  };

  const handleImageRemove = (indexToRemove) => {
    setFormData((prevFormData) => ({
      ...prevFormData,
      images: prevFormData.images.filter((_, index) => index !== indexToRemove)
    }));
  };

  // Size management
  const handleAddSize = () => {
    setSelectedSize(null);
    setSizeDialogOpen(true);
  };

  const handleEditSize = (index) => {
    setSelectedSize({ ...formData.sizes[index], index });
    setSizeDialogOpen(true);
  };

  const handleDeleteSize = (index) => {
    setFormData(prevState => ({
      ...prevState,
      sizes: prevState.sizes.filter((_, i) => i !== index)
    }));
  };

  const handleSaveSize = (sizeData) => {
    if (selectedSize && selectedSize.index !== undefined) {
      // Edit existing size
      const updatedSizes = [...formData.sizes];
      updatedSizes[selectedSize.index] = sizeData;
      setFormData(prevState => ({
        ...prevState,
        sizes: updatedSizes
      }));
    } else {
      // Add new size
      setFormData(prevState => ({
        ...prevState,
        sizes: [...prevState.sizes, sizeData]
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    
    // Validate
    if (formData.sizes.length === 0) {
      setToast({
        open: true,
        message: 'Please add at least one size for this deal',
        severity: 'error'
      });
      return;
    }
    
    // Set deal timeframe based on selected month (New Mexico time)
    if (selectedMonthRow) {
      // Create dates in New Mexico timezone
      const dealStartNM = new Date(
        parseInt(selectedMonthRow.timeframeStart.split('-')[0]),
        parseInt(selectedMonthRow.timeframeStart.split('-')[1]) - 1,
        parseInt(selectedMonthRow.timeframeStart.split('-')[2]),
        0, 0, 0, 0 // 12:00 AM New Mexico time
      );
      const dealEndNM = new Date(
        parseInt(selectedMonthRow.timeframeEnd.split('-')[0]),
        parseInt(selectedMonthRow.timeframeEnd.split('-')[1]) - 1,
        parseInt(selectedMonthRow.timeframeEnd.split('-')[2]),
        23, 59, 59, 999 // 11:59 PM New Mexico time
      );
      const commitmentStartNM = new Date(
        parseInt(selectedMonthRow.commitmentStart.split('-')[0]),
        parseInt(selectedMonthRow.commitmentStart.split('-')[1]) - 1,
        parseInt(selectedMonthRow.commitmentStart.split('-')[2]),
        0, 0, 0, 0 // 12:00 AM New Mexico time
      );
      const commitmentEndNM = new Date(
        parseInt(selectedMonthRow.commitmentEnd.split('-')[0]),
        parseInt(selectedMonthRow.commitmentEnd.split('-')[1]) - 1,
        parseInt(selectedMonthRow.commitmentEnd.split('-')[2]),
        23, 59, 59, 999 // 11:59 PM New Mexico time
      );
      
      formData.dealStartAt = dealStartNM.toISOString();
      formData.dealEndsAt = dealEndNM.toISOString();
      formData.commitmentStartAt = commitmentStartNM.toISOString();
      formData.commitmentEndsAt = commitmentEndNM.toISOString();
    }
    
    try {
      setIsSubmitting(true);
      setLoading(true);
      if (initialData) {
        const updateData = {
          ...formData,
          images: formData.images || [],
        };

        const response = await api.put(`/deals/update/${initialData._id}`, updateData);

        setToast({
          open: true,
          message: 'Deal updated successfully!',
          severity: 'success'
        });
        
        if (onSubmit) {
          onSubmit(response.data);
        }

        navigate(-1);
      } else {
        const response = await api.post('/deals/create/create', formData);
        setToast({
          open: true,
          message: 'Deal created successfully!',
          severity: 'success'
        });
        if(response.data) {
          navigate(-1);
        }
      }
    } catch (error) {
      setToast({
        open: true,
        message: error.response?.data?.message || 'Failed to save deal.',
        severity: 'error'
      });
    } finally {
      setIsSubmitting(false);
      setLoading(false);
    }
  };

  const handleCloseToast = () => {
    setToast({ ...toast, open: false });
  };

  if (loading) {
    return <CreateDealSkeleton />;
  }

  // Calculate average savings
  const calculateAverageSavings = () => {
    if (formData.sizes.length === 0) return { percent: 0, amount: 0 };
    
    let totalOriginal = 0;
    let totalDiscount = 0;
    
    formData.sizes.forEach(size => {
      totalOriginal += Number(size.originalCost);
      totalDiscount += Number(size.discountPrice);
    });
    
    const avgOriginal = totalOriginal / formData.sizes.length;
    const avgDiscount = totalDiscount / formData.sizes.length;
    const savingsAmount = avgOriginal - avgDiscount;
    const savingsPercent = ((savingsAmount / avgOriginal) * 100).toFixed(2);
    
    return { percent: savingsPercent, amount: savingsAmount.toFixed(2) };
  };

  const averageSavings = calculateAverageSavings();

  return (
    <Container maxWidth="xl" sx={{ py: 4,px: 0 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between',flexWrap: 'wrap', alignItems: 'center', mb: 2,gap: 2 }}>
        <Button 
          variant="outlined" 
          color="primary.contrastText" 
          onClick={() => navigate(-1)}
          startIcon={<ArrowBackIcon color="primary.contrastText" />}
          sx={{ 
            borderRadius: 2,
            px: 3,
            py: 1,
            fontWeight: 500,
            textTransform: 'none',
            color: 'primary.contrastText',
          }}
        >
          Back to Deals
        </Button>
        
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography variant="h4" component="h1" fontWeight={600} color="primary.contrastText">
            {initialData ? 'Edit Deal' : 'Create New Deal'}
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
      </Box>
      
      <Fade in={true} timeout={800}>
        <StyledPaper>
          <Box component="form" onSubmit={handleSubmit}>
            <Grid container spacing={4}>
              {/* Basic Information Section */}
              <Grid item xs={12}>
                <SectionHeading>
                  <SectionTitle variant="h6">
                    <LocalOfferIcon color="primary.contrastText" />
                    Basic Information
                  </SectionTitle>
                </SectionHeading>
                
                <Grid container spacing={3} sx={{ mt: 1 }}>
                  <Grid item xs={12} md={6}>
                    <TextField
                      label="Deal Name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      fullWidth
                      required
                      variant="outlined"
                      InputProps={{ sx: { borderRadius: 2 } }}
                    />
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    <FormControl fullWidth required>
                      <InputLabel id="category-select-label">Category </InputLabel>
                      <Select
                        labelId="category-select-label"
                        id="category-select"
                        name="category"
                        value={formData.category}
                        onChange={handleChange}
                        label="Category"
                        sx={{ borderRadius: 2 }}
                        startAdornment={
                          <InputAdornment position="start">
                            <CategoryIcon fontSize="small" color="primary" />
                          </InputAdornment>
                        }
                        MenuProps={{
                          PaperProps: {
                            sx: {
                              maxHeight: 48 * 4.5,
                              borderRadius: 2,
                            },
                          },
                        }}
                      >
                        {categories.map((category) => (
                          <MenuItem key={category} value={category}>{category}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>

                  <Grid item xs={12}>
                    <TextField
                      label="Special Comment"
                      name="description"
                      value={formData.description}
                      onChange={handleChange}
                      fullWidth
                      multiline
                      rows={3}
                      InputProps={{ sx: { borderRadius: 2 } }}
                      helperText="Add any special details or conditions for this deal"
                    />
                  </Grid>
                </Grid>
              </Grid>

              {/* Size Options Section */}
              <Grid item xs={12}>
                <SectionHeading>
                  <SectionTitle variant="h6">
                    <StraightenIcon color="primary.contrastText" />
                    Size & Pricing Options
                  </SectionTitle>
                  
                  <ActionButton 
                    variant="contained" 
                    color="primary" 
                    startIcon={<AddIcon color="primary.contrastText" />}
                    onClick={handleAddSize}
                  >
                    Add Size
                  </ActionButton>
                </SectionHeading>
                
                {formData.sizes.length === 0 ? (
                  <Paper 
                    elevation={0} 
                    sx={{ 
                      textAlign: 'center', 
                      py: 4, 
                      px: 2, 
                      backgroundColor: (theme) => alpha(theme.palette.primary.light, 0.05),
                      border: '1px dashed rgba(0, 0, 0, 0.12)',
                      borderRadius: 2
                    }}
                  >
                    <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
                      No sizes added yet. Click "Add Size" to add size options for this deal.
                    </Typography>
                    <ActionButton 
                      variant="outlined" 
                      color="primary.contrastText"
                      onClick={handleAddSize}
                      startIcon={<AddIcon color="primary.contrastText" />}
                    >
                      Add First Size
                    </ActionButton>
                  </Paper>
                ) : (
                  <Grid container spacing={2} sx={{ mt: 1 }}>
                    {formData.sizes.map((sizeObj, index) => {
                      const savingsPercent = (((sizeObj.originalCost - sizeObj.discountPrice) / sizeObj.originalCost) * 100).toFixed(2);
                      const savingsAmount = (sizeObj.originalCost - sizeObj.discountPrice).toFixed(2);
                      const hasTiers = sizeObj.discountTiers && sizeObj.discountTiers.length > 0;
                      
                      return (
                        <Grid item xs={12} sm={6} md={4} key={index}>
                          <StyledCard>
                            <CardContent sx={{ p: 3 }}>
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                                <Typography variant="h6" component="div" sx={{ fontWeight: 600 }}>
                                  {sizeObj.size}
                                </Typography>
                                <Box>
                                  <StyledIconButton size="small" onClick={() => handleEditSize(index)}>
                                    <EditIcon fontSize="small" color="primary.contrastText" />
                                  </StyledIconButton>
                                  <StyledIconButton size="small" onClick={() => handleDeleteSize(index)} color="error">
                                    <DeleteIcon fontSize="small" color="primary.contrastText" />
                                  </StyledIconButton>
                                </Box>
                              </Box>
                              
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                <Typography variant="body2" color="text.secondary">Original Cost:</Typography>
                                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                  ${sizeObj.originalCost}
                                </Typography>
                              </Box>
                              
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                                <Typography variant="body2" color="text.secondary">Deal Price:</Typography>
                                <Typography variant="body2" sx={{ fontWeight: 500, color: 'success.main' }}>
                                  ${sizeObj.discountPrice}
                                </Typography>
                              </Box>
                              
                              <Divider sx={{ my: 1.5 }} />
                              
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1.5 }}>
                                <Typography variant="subtitle2">Customer Savings:</Typography>
                                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 0.5 }}>
                                  <SavingsChip 
                                    label={`${savingsPercent}%`} 
                                    saving={Number(savingsPercent)}
                                    size="small"
                                  />
                                  <Typography variant="caption" sx={{ fontWeight: 600, color: 'success.main' }}>
                                    Save ${savingsAmount}
                                  </Typography>
                                </Box>
                              </Box>
                              
                              {/* Display volume discount tiers if available */}
                              {hasTiers && (
                                <>
                                  <Divider sx={{ my: 1.5 }} />
                                  
                                  <Typography variant="subtitle2" color="primary.main" sx={{ mb: 1 }}>
                                    Volume Discounts:
                                  </Typography>
                                  
                                  {sizeObj.discountTiers.map((tier, tierIndex) => (
                                    <Box key={tierIndex} sx={{ 
                                      display: 'flex', 
                                      justifyContent: 'space-between',
                                      mb: 0.5,
                                      py: 0.5,
                                      px: 1,
                                      bgcolor: 'rgba(0, 0, 0, 0.02)',
                                      borderRadius: 1,
                                      '&:last-child': { mb: 0 }
                                    }}>
                                      <Typography variant="caption" fontWeight="medium">
                                        {tier.tierQuantity}+ units:
                                      </Typography>
                                      <Typography variant="caption" color="success.main" fontWeight="bold">
                                        ${tier.tierDiscount}
                                      </Typography>
                                    </Box>
                                  ))}
                                </>
                              )}
                            </CardContent>
                          </StyledCard>
                        </Grid>
                      );
                    })}
                  </Grid>
                )}

                {formData.sizes.length > 0 && (
                  <Box 
                    sx={{ 
                      mt: 3, 
                      p: 2.5, 
                      borderRadius: 2,
                      backgroundColor: (theme) => alpha(theme.palette.success.light, 0.1),
                      border: '1px dashed rgba(76, 175, 80, 0.3)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}
                  >
                    <Typography variant="h6" sx={{ fontWeight: 500, color: 'success.dark' }}>
                      Average Customer Savings
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <SavingsChip 
                        label={`${averageSavings.percent}%`} 
                        saving={Number(averageSavings.percent)}
                        icon={<PriceChangeIcon />}
                      />
                      <Typography variant="h6" sx={{ fontWeight: 600, color: 'success.dark' }}>
                        ${averageSavings.amount}
                      </Typography>
                    </Box>
                  </Box>
                )}
              </Grid>

              {/* Deal Volume & Tiers Section */}
              <Grid item xs={12}>
                <SectionHeading>
                  <SectionTitle variant="h6">
                    <StorefrontIcon color="primary.contrastText" />
                    Volume Requirements
                  </SectionTitle>
                </SectionHeading>
                
                <Grid container spacing={3} sx={{ mt: 1 }}>
                  <Grid item xs={12} md={6}>
                    <TextField
                      label="Minimum Quantity for Deal"
                      name="minQtyForDiscount"
                      type="number"
                      value={formData.minQtyForDiscount}
                      onChange={handleChange}
                      fullWidth
                      required
                      InputProps={{ 
                        sx: { borderRadius: 2 },
                        endAdornment: <InputAdornment position="end">units</InputAdornment>,
                      }}
                      inputProps={{ min: "1" }}
                      helperText="Minimum total quantity required for deal approval"
                    />
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    <TextField
                      label="Single Store Deals"
                      name="singleStoreDeals"
                      value={formData.singleStoreDeals}
                      onChange={handleChange}
                      fullWidth
                      InputProps={{ sx: { borderRadius: 2 } }}
                      helperText="Special conditions for single store deals (optional)"
                    />
                  </Grid>
                </Grid>
              </Grid>

              {/* Deal Timeframe Section */}
              <Grid item xs={12}>
                <SectionHeading>
                  <SectionTitle variant="h6">
                    <CalendarMonthIcon color="primary.contrastText" />
                    Deal Timeframe
                  </SectionTitle>
                </SectionHeading>

                {/* Improved Month/Year Selection Dropdown inside Deal Timeframe */}
                <Box sx={{ mt: 3, display: 'flex',flexDirection: {xs: 'column', md: 'row'}, alignItems: 'center', gap: 2 }}>
                  <FormControl required sx={{ width: '100%' }}>
                    <InputLabel id="deal-month-select-label">Select Deal Month</InputLabel>
                    <Select
                      labelId="deal-month-select-label"
                      id="deal-month-select"
                      value={selectedDealMonth || ''}
                      onChange={e => setSelectedDealMonth(e.target.value)}
                      sx={{ borderRadius: 2, background: '#fff' }}
                      MenuProps={{
                        PaperProps: {
                          sx: { borderRadius: 2, maxHeight: 48 * 6 },
                        },
                      }}
                      displayEmpty
                    >
                      {availableDealMonths.map(row => {
                        const deliveryMonth = getNextMonthName(row.month, row.year);
                        return (
                          <MenuItem key={`${row.month} ${row.year}`} value={`${row.month} ${row.year}`}>
                            {`${deliveryMonth.month} ${deliveryMonth.year}`}
                          </MenuItem>
                        );
                      })}
                    </Select>
                    <FormHelperText>
                      Choose the month for which this deal will be active. Dates below will update accordingly.
                    </FormHelperText>
                  </FormControl>
                  {selectedMonthRow && (() => {
                    const deliveryMonth = getNextMonthName(selectedMonthRow.month, selectedMonthRow.year);
                    return (
                      <Alert severity="info" sx={{ ml: 2, borderRadius: 2 ,width: '100%'}}>
                        <strong>Deadline to post deals:</strong> {(() => {
                          const [year, month, day] = selectedMonthRow.deadline.split('-');
                          return new Date(year, month - 1, day).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
                        })()}<br />
                        <strong>Commitment Time Frame:</strong> {(() => {
                          const [startYear, startMonth, startDay] = selectedMonthRow.commitmentStart.split('-');
                          const [endYear, endMonth, endDay] = selectedMonthRow.commitmentEnd.split('-');
                          const startDate = new Date(startYear, startMonth - 1, startDay).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
                          const endDate = new Date(endYear, endMonth - 1, endDay).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
                          return `${startDate} - ${endDate}`;
                        })()}<br />
                      </Alert>
                    );
                  })()}
                </Box>
                <SectionHeading>
                  <SectionTitle variant="h6">
                    <CalendarMonthIcon color="primary.contrastText" />
                    Commitment Timeframe
                  </SectionTitle>
                </SectionHeading>
                <Grid container spacing={3} sx={{ mt: 1 }}>
                  <Grid item xs={12} md={6}>
                    <TextField
                      label="Commitment Starts At"
                      name="commitmentStartAt"
                      type="date"
                      value={selectedMonthRow ? selectedMonthRow.commitmentStart : ''}
                      onChange={() => {}}
                      fullWidth
                      required
                      disabled
                      InputLabelProps={{
                        shrink: true,
                      }}
                      InputProps={{
                        sx: {
                          borderRadius: 2,
                          backgroundColor: (theme) => alpha(theme.palette.action.disabled, 0.1),
                          '& .MuiInputBase-input.Mui-disabled': {
                            WebkitTextFillColor: (theme) => theme.palette.text.primary,
                          }
                        },
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      label="Commitment Ends At"
                      name="commitmentEndsAt"
                      type="date"
                      value={selectedMonthRow ? selectedMonthRow.commitmentEnd : ''}
                      onChange={() => {}}
                      fullWidth
                      required
                      disabled
                      InputLabelProps={{
                        shrink: true,
                      }}
                      InputProps={{
                        sx: {
                          borderRadius: 2,
                          backgroundColor: (theme) => alpha(theme.palette.action.disabled, 0.1),
                          '& .MuiInputBase-input.Mui-disabled': {
                            WebkitTextFillColor: (theme) => theme.palette.text.primary,
                          }
                        },
                      }}
                    />
                  </Grid>
                </Grid>
              </Grid>

              {/* Images Section */}
              <Grid item xs={12}>
                <SectionHeading>
                  <SectionTitle variant="h6">
                    <InsertPhotoIcon color="primary.contrastText" />
                    Product Images
                  </SectionTitle>
                </SectionHeading>
                
                <Box sx={{ mt: 2, mb: 3 }}>
                  <MediaSelector
                    onSelect={handleImageUpload} 
                    onRemove={handleImageRemove}
                    selectedMedia={formData.images}
                  />
                </Box>
              </Grid>

              {/* Submit Button */}
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                  <SubmitButton 
                    type="submit" 
                    variant="contained" 
                    color="primary"
                    disabled={isSubmitting || formData.sizes.length === 0}
                    startIcon={isSubmitting ? <CircularProgress size={20} color="inherit" /> : <SaveIcon color="primary.contrastText" />}
                  >
                    {isSubmitting ? 'Saving...' : (initialData ? 'Update Deal' : 'Create Deal')}
                  </SubmitButton>
                </Box>
                {formData.sizes.length === 0 && (
                  <Typography variant="body2" color="error" sx={{ mt: 2, textAlign: 'center' }}>
                    Please add at least one size option before submitting
                  </Typography>
                )}
              </Grid>
            </Grid>
          </Box>
        </StyledPaper>
      </Fade>
      
      {/* Size Dialog */}
      <SizeDialog 
        open={sizeDialogOpen}
        onClose={() => setSizeDialogOpen(false)}
        onSave={handleSaveSize}
        initialSize={selectedSize}
      />
      
      <Toast
        open={toast.open}
        message={toast.message}
        severity={toast.severity}
        handleClose={handleCloseToast}
      />
    </Container>
  );
};

export default CreateDeal;
