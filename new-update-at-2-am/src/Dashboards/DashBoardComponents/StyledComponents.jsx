import { styled } from '@mui/material/styles';
import { Box, Paper, Button, Card, Typography } from '@mui/material';

// Dashboard Header
export const DashboardHeader = styled(Box)(({ theme }) => ({
  background: theme.palette.background.paper,
  borderRadius: theme.shape.borderRadius * 2,
  padding: theme.spacing(3),
  marginBottom: theme.spacing(3),
  boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  [theme.breakpoints.down('sm')]: {
    flexDirection: 'column',
    gap: theme.spacing(2),
  }
}));

// View Toggle Button
export const ViewToggleButton = styled(Button)(({ theme }) => ({
  borderRadius: theme.shape.borderRadius,
  padding: '8px 16px',
  textTransform: 'none',
  fontWeight: 500,
  minWidth: '120px',
  '&.Mui-selected': {
    backgroundColor: theme.palette.primary.main,
    color: theme.palette.primary.contrastText,
  },
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: theme.shadows[4],
  },
  transition: 'all 0.3s ease'
}));

// Stats Card
export const StatsCard = styled(Card)(({ theme }) => ({
  padding: theme.spacing(3),
  borderRadius: theme.shape.borderRadius * 2,
  background: theme.palette.background.paper,
  boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
  transition: 'all 0.3s ease',
  '&:hover': {
    transform: 'translateY(-4px)',
    boxShadow: theme.shadows[8],
  },
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(1)
}));

// Content Container
export const ContentContainer = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  borderRadius: theme.shape.borderRadius * 2,
  minHeight: '60vh',
  position: 'relative',
  background: theme.palette.background.paper,
  boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
}));

// Grid Item Card
export const GridItemCard = styled(Card)(({ theme }) => ({
  borderRadius: theme.shape.borderRadius * 2,
  height: '100%',
  border: `1px solid ${theme.palette.divider}`,
  transition: 'all 0.3s ease',
  background: theme.palette.background.paper,
  '&:hover': {
    transform: 'translateY(-4px)',
    boxShadow: theme.shadows[8],
  },
  overflow: 'hidden'
}));

// List Item Container
export const ListItemContainer = styled(Box)(({ theme }) => ({
  padding: theme.spacing(2),
  borderRadius: theme.shape.borderRadius,
  border: `1px solid ${theme.palette.divider}`,
  marginBottom: theme.spacing(2),
  transition: 'all 0.3s ease',
  '&:hover': {
    transform: 'translateX(4px)',
    boxShadow: theme.shadows[2],
  },
  background: theme.palette.background.paper,
}));

// Action Button Container
export const ActionButtonContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  gap: theme.spacing(1),
  [theme.breakpoints.down('sm')]: {
    flexDirection: 'column',
  }
}));

// Filter Container with title and actions
export const FilterContainer = styled(Box)(({ theme }) => ({
  background: theme.palette.background.paper,
  borderRadius: theme.shape.borderRadius * 2,
  padding: theme.spacing(3),
  marginBottom: theme.spacing(3),
  boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
}));

// Filter Header
export const FilterHeader = styled(Box)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: theme.spacing(3),
  padding: theme.spacing(0, 1),
}));

// Filter Group
export const FilterGroup = styled(Box)(({ theme }) => ({
  background: theme.palette.grey[50],
  borderRadius: theme.shape.borderRadius,
  padding: theme.spacing(2),
  marginBottom: theme.spacing(2),
}));

// Filter Group Title
export const FilterGroupTitle = styled(Typography)(({ theme }) => ({
  fontSize: '0.875rem',
  fontWeight: 600,
  color: theme.palette.text.secondary,
  marginBottom: theme.spacing(2),
}));

// Filter Field
export const FilterField = styled(Box)(({ theme }) => ({
  height: '56px', // Consistent height for all filter fields
  '& .MuiInputBase-root': {
    height: '100%',
  },
  '& .MuiOutlinedInput-root': {
    height: '100%',
  },
})); 