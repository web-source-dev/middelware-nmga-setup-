import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { 
  Box, 
  Typography, 
  Button, 
  CircularProgress, 
  Grid,
  Card,
  CardContent,
  CardMedia,
  CardActions,
  Divider,
  useTheme,
  Dialog,
  DialogContent,
  Snackbar,
  Alert
} from '@mui/material';
import PreviewIcon from '@mui/icons-material/Preview';
import { useNavigate, useLocation } from 'react-router-dom';
import DisplaySplashContent from '../../Components/SplashPage/DisplaySplashContent';

const SplashAgain = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const userRole = localStorage.getItem('user_role');
  const [splashContents, setSplashContents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const theme = useTheme();
  const [previewContent, setPreviewContent] = useState(null);
  const [openPreview, setOpenPreview] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  // Extract and save authentication data from URL parameters
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const token = params.get('token');
    const userRole = params.get('user_role');
    const userId = params.get('user_id');
    const adminId = params.get('admin_id');
    
    // If we have authentication data in the URL, save it to localStorage
    if (token) localStorage.setItem('token', token);
    if (userRole) localStorage.setItem('user_role', userRole);
    if (userId) localStorage.setItem('user_id', userId);
    if (adminId) localStorage.setItem('admin_id', adminId);
    
    // Clean the URL to remove sensitive data
    if (token || userRole || userId || adminId) {
      // Keep the id, session, role and offer params for backward compatibility
      const id = params.get('id');
      const session = params.get('session');
      const role = params.get('role');
      const offer = params.get('offer');
      
      let newParams = new URLSearchParams();
      if (id) newParams.append('id', id);
      if (session) newParams.append('session', session);
      if (role) newParams.append('role', role);
      if (offer) newParams.append('offer', offer);
      
      const cleanUrl = `${window.location.pathname}${newParams.toString() ? `?${newParams.toString()}` : ''}`;
      window.history.replaceState({}, document.title, cleanUrl);
    }
  }, [location]);

  useEffect(() => {
    const fetchSplashContents = async () => {
      try {
        const response = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/splash`, {
          headers: { 'user-role': userRole }
        });
        setSplashContents(response.data);
      } catch (error) {
        console.error('Error fetching splash contents:', error);
        setError('Failed to load splash contents');
      } finally {
        setLoading(false);
      }
    };
    fetchSplashContents();
  }, [userRole]);

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
      <Typography variant="h4" sx={{ mb: 4 }}>Advertisements</Typography>
      <Grid container spacing={3}>
        {splashContents.length === 0 && (
          <Grid item xs={12}>
            <Typography>No Ads available.</Typography>
          </Grid>
        )}
        {splashContents.map(content => (
          <Grid item xs={12} md={6} lg={4} key={content._id}>
            <Card elevation={3} sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
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
                <Typography variant="h6" noWrap>{content.cards[0]?.title}</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>{content.cards[0]?.content}</Typography>
              </CardContent>
              <Divider />
              <CardActions sx={{ justifyContent: 'center', p: 2 }}>
                <Button
                  startIcon={<PreviewIcon sx={{ color: 'primary.contrastText' }} />}
                  variant="outlined"
                  size="small"
                  onClick={() => handlePreview(content)}
                  sx={{
                    color: 'primary.contrastText',
                    borderColor: 'primary.contrastText',
                  }}
                >
                  Preview
                </Button>
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

export default SplashAgain;
