import React, { useState, useEffect } from 'react';
import { 
  TextField, 
  Button, 
  Container, 
  Typography, 
  Grid, 
  Box, 
  Paper, 
  CircularProgress, 
  Skeleton, 
  InputAdornment, 
  IconButton,
  Card,
  CardContent,
  Alert,
  LinearProgress,
  useTheme
} from '@mui/material';
import { 
  Visibility, 
  VisibilityOff, 
  Lock,
  CheckCircleOutline,
  ErrorOutline
} from '@mui/icons-material';
import axios from 'axios';
import Toast from '../Components/Toast/Toast';
import { useParams, useNavigate } from 'react-router-dom';
import { isAuthenticated, isAdmin, isDistributor, isMember } from '../services/api';

const ResetPasswordSkeleton = () => (
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
);

const ResetPassword = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const theme = useTheme();
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [toast, setToast] = useState({
    open: false,
    message: '',
    severity: 'success'
  });
  const [loading, setLoading] = useState(false);
  const [showSkeleton, setShowSkeleton] = useState(true);
  const [errors, setErrors] = useState({});
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [resetSuccess, setResetSuccess] = useState(false);
  const [countdown, setCountdown] = useState(5);

  // Check authentication on component mount
  useEffect(() => {
    if (isAuthenticated()) {
      let redirectPath = '/deals-catlog';
      
      if (isAdmin()) {
        redirectPath = '/dashboard/admin';
      } else if (isDistributor()) {
        redirectPath = '/dashboard/distributor';
      } else if (isMember()) {
        redirectPath = '/dashboard/co-op-member';
      }
      
      setToast({
        open: true,
        message: 'You are already logged in. Redirecting to your dashboard...',
        severity: 'info'
      });
      
      setTimeout(() => {
        navigate(redirectPath);
      }, 2000);
    }
  }, [navigate]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSkeleton(false);
    }, 1500); // Show skeleton for 1.5 seconds

    return () => clearTimeout(timer);
  }, []);
  
  useEffect(() => {
    let timer;
    if (resetSuccess && countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    } else if (resetSuccess && countdown === 0) {
      navigate('/login');
    }
    return () => clearTimeout(timer);
  }, [resetSuccess, countdown, navigate]);

  const handlePasswordChange = (e) => {
    const newPassword = e.target.value;
    setPassword(newPassword);
    
    // Clear error when user types
    if (errors.password) {
      setErrors({
        ...errors,
        password: ''
      });
    }
    
    // Check password strength
    let strength = 0;
    if (newPassword.length >= 8) strength += 25;
    if (/[A-Z]/.test(newPassword)) strength += 25;
    if (/[a-z]/.test(newPassword)) strength += 25;
    if (/[0-9]/.test(newPassword)) strength += 25;
    
    setPasswordStrength(strength);
    
    // Check if confirm password matches
    if (confirmPassword && newPassword !== confirmPassword) {
      setErrors({
        ...errors,
        confirmPassword: 'Passwords do not match'
      });
    } else if (confirmPassword) {
      setErrors({
        ...errors,
        confirmPassword: ''
      });
    }
  };
  
  const handleConfirmPasswordChange = (e) => {
    const newConfirmPassword = e.target.value;
    setConfirmPassword(newConfirmPassword);
    
    // Check if passwords match
    if (newConfirmPassword !== password) {
      setErrors({
        ...errors,
        confirmPassword: 'Passwords do not match'
      });
    } else {
      setErrors({
        ...errors,
        confirmPassword: ''
      });
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    // Password validation
    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    } else if (!/(?=.*[a-z])/.test(password)) {
      newErrors.password = 'Password must contain at least one lowercase letter';
    } else if (!/(?=.*[A-Z])/.test(password)) {
      newErrors.password = 'Password must contain at least one uppercase letter';
    } else if (!/(?=.*\d)/.test(password)) {
      newErrors.password = 'Password must contain at least one number';
    }
    
    // Confirm password validation
    if (!confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    
    setLoading(true);
    try {
      const response = await axios.post(`${process.env.REACT_APP_BACKEND_URL}/auth/reset-password/${token}`, { password });
      setToast({ open: true, message: response.data.message, severity: 'success' });
      setResetSuccess(true);
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Server error, please try again.';
      setToast({ open: true, message: errorMessage, severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setToast({ ...toast, open: false });
  };
  
  const getPasswordStrengthColor = () => {
    if (passwordStrength < 50) return theme.palette.error.main;
    if (passwordStrength < 75) return theme.palette.warning.main;
    return theme.palette.success.main;
  };
  
  const getPasswordStrengthLabel = () => {
    if (passwordStrength < 50) return 'Weak';
    if (passwordStrength < 75) return 'Medium';
    return 'Strong';
  };

  if (showSkeleton) {
    return <ResetPasswordSkeleton />;
  }

  return (
    <Container 
      maxWidth="sm" 
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        py: 4
      }}
    >
      <div style={{ width: '100%' }}>
        <Card 
          elevation={4}
          sx={{
            borderRadius: 2,
            overflow: 'hidden',
            transition: 'all 0.3s ease-in-out',
            '&:hover': {
              boxShadow: '0 8px 24px rgba(0,0,0,0.12)'
            }
          }}
        >
          <CardContent sx={{ p: 4 }}>
            {resetSuccess ? (
              <Box sx={{ textAlign: 'center', py: 2 }}>
                <CheckCircleOutline color="success" sx={{ fontSize: 64, mb: 2 }} />
                <Typography variant="h5" gutterBottom sx={{ fontWeight: 600 }}>
                  Password Reset Successful!
                </Typography>
                <Typography variant="body1" sx={{ mb: 3 }}>
                  Your password has been reset successfully. You will be redirected to the login page in {countdown} seconds.
                </Typography>
                <Button 
                  variant="contained" 
                  color="primary" 
                  onClick={() => navigate('/login')}
                  sx={{ 
                    py: 1.5,
                    px: 4,
                    fontWeight: 600
                  }}
                >
                  Login Now
                </Button>
              </Box>
            ) : (
              <>
                <Typography 
                  variant="h4" 
                  component="h1" 
                  gutterBottom
                  sx={{ 
                    fontWeight: 600,
                    textAlign: 'center',
                    mb: 3,
                    color: theme.palette.primary.contrastText
                  }}
                >
                  Reset Password
                </Typography>
                
                <Typography 
                  variant="body1" 
                  align="center" 
                  color="textSecondary" 
                  sx={{ mb: 4 }}
                >
                  Create a new password for your account. Make sure it's strong and secure.
                </Typography>
                
                <form onSubmit={handleSubmit}>
                  <Grid container spacing={3}>
                    <Grid item xs={12}>
                      <TextField
                        label="New Password"
                        name="password"
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={handlePasswordChange}
                        fullWidth
                        required
                        error={!!errors.password}
                        helperText={errors.password}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <Lock  color='primary.contrastText'/>
                            </InputAdornment>
                          ),
                          endAdornment: (
                            <InputAdornment position="end">
                              <IconButton onClick={() => setShowPassword(!showPassword)}>
                                {showPassword ? <VisibilityOff  color='primary.contrastText'/> : <Visibility  color='primary.contrastText'/>}
                              </IconButton>
                            </InputAdornment>
                          ),
                        }}
                      />
                      
                      {password && (
                        <Box sx={{ mt: 1, mb: 2 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
                            <Typography variant="body2">Password Strength:</Typography>
                            <Typography 
                              variant="body2" 
                              sx={{ 
                                color: getPasswordStrengthColor(),
                                fontWeight: 600
                              }}
                            >
                              {getPasswordStrengthLabel()}
                            </Typography>
                          </Box>
                          <LinearProgress
                            variant="determinate" 
                            value={passwordStrength} 
                            sx={{ 
                              height: 6, 
                              borderRadius: 3,
                              bgcolor: theme.palette.grey[200],
                              '& .MuiLinearProgress-bar': {
                                bgcolor: getPasswordStrengthColor()
                              }
                            }}
                          />
                        </Box>
                      )}
                    </Grid>
                    
                    <Grid item xs={12}>
                      <TextField
                        label="Confirm Password"
                        name="confirmPassword"
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={handleConfirmPasswordChange}
                        fullWidth
                        required
                        error={!!errors.confirmPassword}
                        helperText={errors.confirmPassword}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <Lock  color='primary.contrastText'/>
                            </InputAdornment>
                          ),
                          endAdornment: (
                            <InputAdornment position="end">
                              <IconButton onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
                                {showConfirmPassword ? <VisibilityOff  color='primary.contrastText'/> : <Visibility  color='primary.contrastText'/>}
                              </IconButton>
                            </InputAdornment>
                          ),
                        }}
                      />
                    </Grid>
                    
                    <Grid item xs={12}>
                      <Button 
                        type="submit" 
                        variant="contained" 
                        color="primary" 
                        fullWidth 
                        disabled={loading}
                        sx={{ 
                          py: 1.5,
                          fontWeight: 600,
                          fontSize: '1rem',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                          '&:hover': {
                            boxShadow: '0 6px 16px rgba(0,0,0,0.15)'
                          }
                        }}
                      >
                        {loading ? <CircularProgress size={24} /> : "Reset Password"}
                      </Button>
                    </Grid>
                  </Grid>
                </form>
              </>
            )}
          </CardContent>
        </Card>
        
        <Toast 
          open={toast.open} 
          message={toast.message} 
          severity={toast.severity} 
          handleClose={handleClose} 
        />
      </div>
    </Container>
  );
};

export default ResetPassword;
