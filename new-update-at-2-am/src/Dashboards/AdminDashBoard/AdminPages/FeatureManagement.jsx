import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Switch,
  FormControlLabel,
  Button,
  Grid,
  Alert,
  Snackbar,
  Chip,
  Divider,
  Paper,
  IconButton,
  Tooltip,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions
} from '@mui/material';
import {
  Settings as SettingsIcon,
  PowerSettingsNew as PowerIcon,
  PowerOff as PowerOffIcon,
  Info as InfoIcon,
  Refresh as RefreshIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon
} from '@mui/icons-material';
import { Helmet } from 'react-helmet';
import api from '../../../services/api';
import { useAuth } from '../../../middleware/auth';

const FeatureManagement = () => {
  const { isAdmin } = useAuth();
  const [features, setFeatures] = useState({});
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState({});
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [confirmDialog, setConfirmDialog] = useState({ open: false, action: null, title: '', message: '' });
  const [expandedDescriptions, setExpandedDescriptions] = useState({});

  useEffect(() => {
    if (!isAdmin) {
      window.location.href = '/dashboard';
      return;
    }
    fetchFeatures();
  }, [isAdmin]); 

  const fetchFeatures = async () => {
    try {
      setLoading(true);
      const response = await api.get('/common/features');
      setFeatures(response.data.features);
    } catch (error) {
      console.error('Error fetching features:', error);
      showSnackbar('Error fetching features', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const updateFeature = async (featureName, enabled) => {
    try {
      setUpdating(prev => ({ ...prev, [featureName]: true }));
      
      const endpoint = enabled ? 'enable' : 'disable';
      const response = await api.post(`/common/features/${endpoint}/${featureName}`);
      
      if (response.data.success) {
        setFeatures(prev => ({
          ...prev,
          [featureName]: {
            ...prev[featureName],
            enabled
          }
        }));
        showSnackbar(response.data.message, 'success');
      } else {
        showSnackbar(response.data.message, 'error');
      }
    } catch (error) {
      console.error('Error updating feature:', error);
      showSnackbar('Error updating feature', 'error');
    } finally {
      setUpdating(prev => ({ ...prev, [featureName]: false }));
    }
  };

  const handleFeatureToggle = (featureName, currentStatus) => {
    const newStatus = !currentStatus;
    const action = newStatus ? 'enable' : 'disable';
    
    setConfirmDialog({
      open: true,
      action: () => updateFeature(featureName, newStatus),
      title: `${action.charAt(0).toUpperCase() + action.slice(1)} Feature`,
      message: `Are you sure you want to ${action} the "${featureName}" feature?`
    });
  };

  const handleConfirmAction = () => {
    if (confirmDialog.action) {
      confirmDialog.action();
    }
    setConfirmDialog({ open: false, action: null, title: '', message: '' });
  };

  const handleCancelAction = () => {
    setConfirmDialog({ open: false, action: null, title: '', message: '' });
  };

  const getFeatureIcon = (featureName) => {
    const iconMap = {
      SMS: '📱',
      EMAIL: '📧',
      NOTIFICATIONS: '🔔',
      LOGGING: '📝',
      DEAL_EXPIRATION: '⏰',
      DAILY_SUMMARIES: '📊',
      REALTIME_UPDATES: '🔄'
    };
    return iconMap[featureName] || '⚙️';
  };

  const getFeatureColor = (enabled) => {
    return enabled ? 'success' : 'default';
  };

  const toggleDescription = (featureName) => {
    setExpandedDescriptions(prev => ({
      ...prev,
      [featureName]: !prev[featureName]
    }));
  };

  const getShortDescription = (description) => {
    // Find the first sentence or first 150 characters
    const firstSentence = description.split('. ')[0];
    if (firstSentence.length <= 150) {
      return firstSentence + '.';
    }
    return description.substring(0, 150) + '...';
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress size={60} />
      </Box>
    );
  }

  return (
    <>
      <Helmet>
        <title>NMGA - Feature Management</title>
        <meta name="description" content="Manage system features and settings" />
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      <Box sx={{ p: 3 }}>
        {/* Header */}
        <Box sx={{ mb: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <SettingsIcon sx={{ fontSize: 32, mr: 2, color: 'primary.main' }} />
            <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold' }}>
              Feature Management
            </Typography>
          </Box>
          <Typography variant="body1" color="text.secondary">
            Enable or disable system features to control functionality across the platform.
          </Typography>
        </Box>
        {/* Features Grid */}
        <Grid container spacing={3}>
          {Object.entries(features).map(([featureName, config]) => (
            <Grid item xs={12} sm={6} md={4} key={featureName}>
              <Card 
                sx={{ 
                  height: '100%',
                  border: config.enabled ? '2px solid' : '1px solid',
                  borderColor: config.enabled ? 'success.main' : 'divider',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    boxShadow: 4,
                    transform: 'translateY(-2px)'
                  }
                }}
              >
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6" sx={{ fontSize: '1.5rem', mr: 1 }}>
                      {getFeatureIcon(featureName)}
                    </Typography>
                    <Typography variant="h6" component="h3" sx={{ flexGrow: 1 }}>
                      {featureName}
                    </Typography>
                    <Chip
                      label={config.enabled ? 'Enabled' : 'Disabled'}
                      color={getFeatureColor(config.enabled)}
                      size="small"
                    />
                  </Box>

                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                      {expandedDescriptions[featureName] 
                        ? config.description 
                        : getShortDescription(config.description)
                      }
                    </Typography>
                    {config.description.length > 150 && (
                      <Button
                        size="small"
                        onClick={() => toggleDescription(featureName)}
                        endIcon={expandedDescriptions[featureName] ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                        sx={{ mt: 1, p: 0, minWidth: 'auto', fontSize: '0.75rem' }}
                      >
                        {expandedDescriptions[featureName] ? 'Show Less' : 'Show More'}
                      </Button>
                    )}
                  </Box>
                  
                  {config.category && (
                    <Chip
                      label={config.category}
                      size="small"
                      variant="outlined"
                      sx={{ mb: 2, fontSize: '0.7rem' }}
                    />
                  )}

                  <Divider sx={{ mb: 2 }} />

                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={config.enabled}
                          onChange={() => handleFeatureToggle(featureName, config.enabled)}
                          disabled={updating[featureName]}
                          color="primary"
                        />
                      }
                      label={config.enabled ? 'Enabled' : 'Disabled'}
                    />
                    {updating[featureName] && (
                      <CircularProgress size={20} />
                    )}
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        {/* Info Alert */}
        <Alert 
          severity="info" 
          sx={{ mt: 4 }}
          icon={<InfoIcon />}
        >
          <Typography variant="body2">
            <strong>Feature Descriptions:</strong> Each feature description explains what the feature does and what happens when enabled or disabled. 
            Click "Show More" to see the complete description including detailed behavior.
            <br />
            <strong>Immediate Effect:</strong> Changes to features take effect immediately. 
            Disabled features will not perform their intended operations but all other system functions continue normally.
            <br />
            <strong>Visibility:</strong> Only features marked as visible are shown on this page. 
            Hidden features are still functional but not displayed in the management interface.
          </Typography>
        </Alert>
      </Box>

      {/* Confirmation Dialog */}
      <Dialog open={confirmDialog.open} onClose={handleCancelAction}>
        <DialogTitle>{confirmDialog.title}</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {confirmDialog.message}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelAction} color="primary">
            Cancel
          </Button>
          <Button onClick={handleConfirmAction} color="primary" variant="contained">
            Confirm
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
};

export default FeatureManagement;
