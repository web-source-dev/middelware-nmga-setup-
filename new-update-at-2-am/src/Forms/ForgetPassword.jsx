import React, { useState, useEffect } from "react";
import { 
  TextField, 
  Button, 
  Container, 
  Typography, 
  Grid, 
  Box, 
  Paper, 
  Skeleton, 
  CircularProgress,
  Card,
  CardContent,
  Divider,
  InputAdornment,
  useTheme,
  Alert
} from "@mui/material";
import { Email } from "@mui/icons-material";
import axios from "axios";
import Toast from "../Components/Toast/Toast";
import Links from "../Components/Buttons/Links";
import { isAuthenticated, isAdmin, isDistributor, isMember } from '../services/api';
import { useNavigate } from 'react-router-dom';

const ForgetPasswordSkeleton = () => (
  <Container maxWidth="sm">
    <Box sx={{ mt: 4 }}>
      <Skeleton variant="text" sx={{ fontSize: '2rem', mb: 2, textAlign: 'center' }} />
      <Skeleton variant="text" sx={{ mb: 3, textAlign: 'center' }} width="80%" />
      <Paper sx={{ p: 3 }}>
        <Box sx={{ mb: 3 }}>
          <Skeleton variant="text" sx={{ mb: 1 }} />
          <Skeleton variant="rectangular" height={56} />
        </Box>
        <Skeleton variant="rectangular" height={42} />
        <Box sx={{ mt: 2, textAlign: 'center' }}>
          <Skeleton variant="text" width={150} sx={{ mx: 'auto' }} />
        </Box>
      </Paper>
    </Box>
  </Container>
);

const ForgetPassword = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [errors, setErrors] = useState({});
  const [toast, setToast] = useState({
    open: false,
    message: "",
    severity: "success",
  });
  const [successMessage, setSuccessMessage] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showSkeleton, setShowSkeleton] = useState(true);

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

  const validateForm = () => {
    const newErrors = {};
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) {
      newErrors.email = 'Email is required';
    } else if (!emailRegex.test(email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    setEmail(e.target.value);
    
    // Clear error when user types
    if (errors.email) {
      setErrors({});
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    
    setLoading(true);
    try {
      const response = await axios.post(
        `${process.env.REACT_APP_BACKEND_URL}/auth/forget-password`,
        { email }
      );
      setToast({
        open: true,
        message: "Reset link sent successfully.",
        severity: "success",
      });
      setSuccessMessage(true);
    } catch (error) {
      const errorMessage =
        error.response?.data?.message || "Server error, please try again.";
      setToast({ open: true, message: errorMessage, severity: "error" });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setToast({ ...toast, open: false });
  };

  return (
    <Container
      maxWidth="sm"
      sx={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "100vh",
        py: 4
      }}
    >
      <div style={{ width: "100%" }}>
        {showSkeleton ? (
          <ForgetPasswordSkeleton />
        ) : (
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
              <Typography 
                variant="h4" 
                component="h1" 
                gutterBottom
                sx={{ 
                  fontWeight: 600,
                  textAlign: 'center',
                  mb: 1,
                  color: theme.palette.primary.contrastText
                }}
              >
                Forgot Password
              </Typography>
              
              <Typography 
                variant="body1" 
                align="center" 
                color="textSecondary" 
                sx={{ mb: 4 }}
              >
                Enter your email address and we'll send you a link to reset your password.
              </Typography>
              
              {successMessage && (
                <Alert 
                  severity="success" 
                  sx={{ mb: 3 }}
                >
                  Reset link sent to <strong>{email}</strong>. Please check your email and use the link within <strong>one hour</strong> before it expires.
                </Alert>
              )}
              
              <form onSubmit={handleSubmit}>
                <Grid container spacing={3}>
                  <Grid item xs={12}>
                    <TextField
                      label="Email"
                      name="email"
                      type="email"
                      value={email}
                      onChange={handleChange}
                      fullWidth
                      required
                      error={!!errors.email}
                      helperText={errors.email}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <Email  color='primary.contrastText'/>
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
                      {loading ? <CircularProgress size={24} /> : "Send Reset Link"}
                    </Button>
                  </Grid>
                </Grid>
              </form>
              
              <Divider sx={{ my: 3 }} />
              
              <Typography 
                align="center" 
                sx={{ 
                  display: 'flex', 
                  justifyContent: 'center', 
                  alignItems: 'center', 
                  fontSize: '16px', 
                  gap: '8px'
                }}
              >
                Remember your password? 
                <Links 
                  link="/login" 
                  linkText="Back to login" 
                  sx={{ fontWeight: 600 }}
                />
              </Typography>
            </CardContent>
          </Card>
        )}
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

export default ForgetPassword;
