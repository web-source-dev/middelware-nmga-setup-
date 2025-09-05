import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Button,
  CircularProgress,
  IconButton,
  Grid,
  Card,
  CardContent,
  CardMedia,
  CardActions,
  Divider,
  useTheme,
  Dialog,
  DialogContent,
  Alert,
  Snackbar,
  Switch
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import { useNavigate } from 'react-router-dom';
import './CreateSplashContent.css';
import DisplaySplashContent from './DisplaySplashContent';
import PreviewIcon from '@mui/icons-material/Preview';
import api from '../../services/api';

const LoadSplash = () => {
  const [splashContents, setSplashContents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const theme = useTheme();
  const [previewContent, setPreviewContent] = useState(null);
  const [openPreview, setOpenPreview] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  useEffect(() => {
    const fetchSplashContents = async () => {
      try {
        const response = await api.get(`/api/splash/all`);
        setSplashContents(response.data);
      } catch (error) {
        console.error('Error fetching splash contents:', error);
        setError('Failed to load splash contents');
      } finally {
        setLoading(false);
      }
    };

    fetchSplashContents();
  }, []);

  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this splash content?')) {
      try {
        await api.delete(`/api/splash/${id}`);
        setSplashContents(splashContents.filter(content => content._id !== id));
        showSnackbar('Splash content deleted successfully');
      } catch (error) {
        console.error('Error deleting splash content:', error);
        showSnackbar('Failed to delete splash content', 'error');
      }
    }
  };

  const handleActivateDeactivate = async (id, isActive) => {
    try {
      // Fetch the current splash content to get the full object
      const currentContent = splashContents.find(content => content._id === id);

      // Prepare the payload with the required fields
      const payload = {
        isActive: !isActive,
        displaySettings: currentContent.displaySettings, // Include other necessary fields
        scheduling: currentContent.scheduling, // Include scheduling if required
        targeting: currentContent.targeting, // Include targeting if required
        cards: currentContent.cards // Include cards if required
      };

      await api.patch(`/api/splash/${id}`, payload);
      setSplashContents(splashContents.map(content =>
        content._id === id ? { ...content, isActive: !isActive } : content
      ));
      showSnackbar(`Splash content ${!isActive ? 'activated' : 'deactivated'} successfully`);
    } catch (error) {
      console.error('Error updating splash content:', error);
      showSnackbar('Failed to update splash content', 'error');
    }
  };

  const handleEdit = (id) => {
    navigate(`/dashboard/admin/splash-content/edit/${id}`);
  };

  const handlePreview = (content) => {
    setPreviewContent(content);
    setOpenPreview(true);
  };

  if (loading) return (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
      <CircularProgress />
    </Box>
  );

  if (error) return (
    <Box sx={{ p: 3 }}>
      <Typography color="error">{error}</Typography>
    </Box>
  );

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        mb: 4,
        background: theme.palette.background.paper,
        p: 2,
        borderRadius: 2,
        boxShadow: 1
      }}>
        <Typography variant="h4">Splash Content Management</Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddCircleIcon color="primary.contrastText" />}
          onClick={() => navigate('/dashboard/admin/splash-content/create')}
          sx={{
            borderRadius: 2,
            px: 3
          }}
        >
          Create New
        </Button>
      </Box>

      <Grid container spacing={3}>
        {splashContents.map(content => (
          <Grid item xs={12} md={6} lg={4} key={content._id}>
            <Card
              elevation={3}
              sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: 6
                }
              }}
            >
              {content.cards[0]?.media[0]?.type === "image" ? (
                <CardMedia
                  component="img"
                  height="300"
                  image={content.cards[0]?.media[0]?.url || "default-image-url.jpg"}
                  alt={content.cards[0]?.title}
                  sx={{ objectFit: "cover" }}
                />
              ) : content.cards[0]?.media[0]?.type === "video" ? (
                <video
                  height="300"
                  src={content.cards[0]?.media[0]?.url}
                  controls
                  autoPlay
                  loop
                  style={{ width: "100%", objectFit: "cover", borderRadius: "4px" }}
                />
              ) : null}


              <CardContent sx={{ flexGrow: 1 }}>
                <Box sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  mb: 2
                }}>
                  <Typography variant="h6" noWrap color="primary.contrastText" fontWeight="bold">{content.cards[0]?.title}</Typography>
                  <Switch
                    checked={content.isActive}
                    onChange={() => handleActivateDeactivate(content._id, content.isActive)}
                    color="success"
                  />
                </Box>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{
                    mb: 2,
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden'
                  }}
                >
                  {content.cards[0]?.content}
                </Typography>
              </CardContent>
              <Divider />
              <CardActions sx={{ justifyContent: 'space-between', p: 2 }}>
                <Button
                  startIcon={<PreviewIcon color="primary.contrastText" />}
                  variant="contained"
                  color="primary.contrastText"
                  size="small"
                  onClick={() => handlePreview(content)}
                >
                  Preview
                </Button>
                <Box>
                  <IconButton
                    size="small"
                    onClick={() => handleEdit(content._id)}
                    sx={{ mr: 1 }}
                  >
                    <EditIcon color="primary.contrastText" />
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={() => handleDelete(content._id)}
                  >
                    <DeleteIcon color="error" />
                  </IconButton>
                </Box>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Preview Dialog */}
      <Dialog
        open={openPreview}
        onClose={() => setOpenPreview(false)}
        maxWidth="xl"
        fullWidth
      >
        <DialogContent sx={{ p: 0 }}>
          {previewContent && (
            <DisplaySplashContent
              content={[previewContent]}
              preview={true}
              onClose={() => setOpenPreview(false)}
            />
          )}
        </DialogContent>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          elevation={6}
          variant="filled"
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default LoadSplash;
