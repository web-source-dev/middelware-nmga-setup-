import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { TextField, Button, Container, Typography, Box, CircularProgress, Skeleton, Paper, Grid, InputAdornment, IconButton } from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material'; // Import icons
import axios from 'axios';
import Toast from '../Components/Toast/Toast';

const CreatePassword = () => {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false); // State for password visibility
  const [toast, setToast] = useState({ open: false, message: '', severity: 'success' });
  const [loading, setLoading] = useState(false); // State for loading
  const [showSkeleton, setShowSkeleton] = useState(true); // State for skeleton
  const [error, setError] = useState(''); // State for error message
  const history = useNavigate();
  const location = useLocation();
  const token = new URLSearchParams(location.search).get('token');

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSkeleton(false);
    }, 3000); // Show skeleton for 3 seconds

    return () => clearTimeout(timer);
  }, []);

  const showToast = (message, severity = 'success') => {
    setToast({ open: true, message, severity });
  };

  const handleCloseToast = () => {
    setToast({ ...toast, open: false });
  };

  const validatePassword = (password) => {
    // Example validation: at least 8 characters, 1 uppercase, 1 number
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasNumber = /\d/.test(password);
    return password.length >= minLength && hasUpperCase && hasNumber;
  };

  const handleSubmit = async () => {
    setLoading(true); // Set loading to true when button is clicked
    setError(''); // Reset error message
    if (!validatePassword(password)) {
      setError('Password must be at least 8 characters long, contain at least one uppercase letter and one number.');
      setLoading(false); // Reset loading state
      return;
    }
    try {
      const response = await axios.post(`${process.env.REACT_APP_BACKEND_URL}/auth/add/create-password`, { token, password });
      showToast(response.data.message, 'success');
      setTimeout(() => {
        history('/login');
      }, 3000); // 3 seconds delay
    } catch (error) {
      console.error('Error creating password:', error);
      showToast(error.response.data.message, 'error');
    } finally {
      setLoading(false); // Reset loading state
    }
  };

  if (showSkeleton) {
    return (
      <Container maxWidth="sm" style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}>
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <Skeleton variant="text" sx={{ fontSize: '2rem', mb: 3, textAlign: 'center' }} />
        <Paper sx={{ p: 3, width: '100%' }}>
          <Box sx={{ mb: 3 }}>
            <Skeleton variant="text" sx={{ mb: 1 }} />
            <Skeleton variant="rectangular" height={56} />
          </Box>
          <Skeleton variant="rectangular" height={42} />
        </Paper>
      </Box>
    </Container>
    ); // Show skeleton while loading
  }

  return (
    <Container maxWidth="sm" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
      <Paper elevation={3} style={{ padding: '2rem', width: '100%' }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Create Password
        </Typography>
        <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                label="New Password"
                type={showPassword ? 'text' : 'password'} // Toggle password visibility
                fullWidth
                margin="normal"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                error={!!error} // Show error state
                helperText={error} // Display error message
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={() => setShowPassword(!showPassword)}>
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12}>
              <Button variant="contained" color="primary" type="submit" fullWidth disabled={loading}>
                {loading ? <CircularProgress size={24} /> : "Submit"}
              </Button>
            </Grid>
          </Grid>
        </form>
        <Toast open={toast.open} message={toast.message} severity={toast.severity} handleClose={handleCloseToast} />
      </Paper>
    </Container>
  );
};

export default CreatePassword;
