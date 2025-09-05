import React, { useState, useEffect } from 'react';
import {
  TextField,
  Button,
  Container,
  Typography,
  Grid,
  Paper,
  Box,
  CircularProgress,
  InputAdornment,
  IconButton,
  Card,
  CardContent,
  Divider,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  useTheme,
  FormHelperText,
  Stack,
  Link
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  Email,
  Lock,
  CheckCircleOutline
} from '@mui/icons-material';
import axios from 'axios';
import Toast from '../Components/Toast/Toast';
import Links from '../Components/Buttons/Links';
import { Skeleton } from '@mui/material';
import { isAuthenticated, isAdmin, isDistributor, isMember } from '../services/api';
import { useNavigate } from 'react-router-dom';

// OTP Input Component
const OtpInput = ({ length = 6, value, onChange, error }) => {
  const [otp, setOtp] = useState(Array(length).fill(''));
  const inputRefs = Array(length).fill(0).map(() => React.createRef());

  useEffect(() => {
    // Update internal OTP array when value changes externally
    if (value) {
      const otpArray = value.split('').slice(0, length);
      setOtp([...otpArray, ...Array(length - otpArray.length).fill('')]);
    }
  }, [value, length]);

  const handleChange = (e, index) => {
    const { value } = e.target;
    if (isNaN(value)) return;

    const newOtp = [...otp];
    // Allow only one digit
    newOtp[index] = value.substring(0, 1);
    setOtp(newOtp);

    // Call the onChange callback with the complete OTP
    const otpValue = newOtp.join('');
    onChange(otpValue);

    // Move to next input if current field is filled
    if (value && index < length - 1) {
      inputRefs[index + 1].current.focus();
    }
  };

  const handleKeyDown = (e, index) => {
    // Move to previous input on backspace if current field is empty
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs[index - 1].current.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData('text/plain').trim();
    if (isNaN(pasteData)) return;

    const otpArray = pasteData.substring(0, length).split('');
    const newOtp = [...Array(length).fill('')];

    otpArray.forEach((digit, index) => {
      newOtp[index] = digit;
      if (index < length - 1) {
        inputRefs[index + 1].current.focus();
      }
    });

    setOtp(newOtp);
    onChange(newOtp.join(''));
  };

  return (
    <Stack
      direction="row"
      spacing={1}
      justifyContent="center"
      sx={{ mb: 2 }}
    >
      {otp.map((digit, index) => (
        <TextField
          key={index}
          inputRef={inputRefs[index]}
          value={digit}
          onChange={(e) => handleChange(e, index)}
          onKeyDown={(e) => handleKeyDown(e, index)}
          onPaste={handlePaste}
          inputProps={{
            maxLength: 1,
            style: {
              textAlign: 'center',
              fontSize: '1.5rem',
              padding: '8px',
              width: '40px',
              height: '40px'
            }
          }}
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: '8px',
              '&.Mui-focused': {
                borderColor: error ? 'error.main' : 'primary.main',
              }
            }
          }}
          error={!!error}
        />
      ))}
    </Stack>
  );
};

const LoginFormSkeleton = () => (
  <Container maxWidth="sm">
    <Box sx={{ mt: 4 }}>
      <Skeleton variant="text" sx={{ fontSize: '2rem', mb: 3, textAlign: 'center' }} />
      <Paper sx={{ p: 3 }}>
        {[...Array(2)].map((_, index) => (
          <Box key={index} sx={{ mb: 3 }}>
            <Skeleton variant="text" sx={{ mb: 1 }} />
            <Skeleton variant="rectangular" height={56} />
          </Box>
        ))}
        <Skeleton variant="rectangular" height={42} sx={{ mb: 2 }} />
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
          <Skeleton variant="text" width={120} />
          <Skeleton variant="text" width={120} />
        </Box>
      </Paper>
    </Box>
  </Container>
);

const LoginForm = () => {
  const theme = useTheme();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [errors, setErrors] = useState({});
  const [toast, setToast] = useState({
    open: false,
    message: '',
    severity: 'success'
  });
  const [loading, setLoading] = useState(false);
  const [showSkeleton, setShowSkeleton] = useState(true);
  const [showPassword, setShowPassword] = useState(false);

  // Email verification states
  const [verificationOpen, setVerificationOpen] = useState(false);
  const [userId, setUserId] = useState(null);
  const [userEmail, setUserEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [otpError, setOtpError] = useState('');
  const [verificationLoading, setVerificationLoading] = useState(false);
  const [resendDisabled, setResendDisabled] = useState(false);
  const [countdown, setCountdown] = useState(0);

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
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    } else {
      setResendDisabled(false);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  const validateForm = () => {
    const newErrors = {};

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!emailRegex.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = 'Password is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });

    // Clear error when user types
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: ''
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    try {
      const response = await axios.post(`${process.env.REACT_APP_BACKEND_URL}/auth/login`, formData);
      const { token, user, message } = response.data;
      localStorage.setItem('token', token);
      setToast({ open: true, message, severity: 'success' });

      const redirectPath = localStorage.getItem('redirectPath');
      const redirectTo = redirectPath || '/deals-catlog';

      if (user.role === 'admin') {
        // For admin, open in new tab with auth params
        const authParams = `token=${encodeURIComponent(token)}`;
        window.open(`/dashboard/admin?${authParams}`, '_blank');
        // Redirect current page to deals-catalog
        setTimeout(() => window.location.href = redirectTo, 500);
      } else if (user.role === 'distributor') {
        // For distributor, open in new tab with auth params
        const authParams = `token=${encodeURIComponent(token)}`;
        window.open(`/dashboard/distributor?${authParams}`, '_blank');
        // Redirect current page to deals-catalog
        setTimeout(() => window.location.href = redirectTo, 500);
      } else {
        localStorage.removeItem('redirectPath');
        // For regular members, just redirect to deals-catalog
        window.location.href = redirectTo;
      }
    } catch (error) {
      const errorData = error.response?.data;

      // Check if email verification is needed
      if (errorData?.needsVerification) {
        setUserId(errorData.userId);
        setUserEmail(errorData.email);
        setVerificationOpen(true);
      } else {
        const errorMessage = errorData?.message || 'Server error, please try again.';
        setToast({ open: true, message: errorMessage, severity: 'error' });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (!otp || otp.length < 6) {
      setOtpError('Please enter the complete verification code');
      return;
    }

    setVerificationLoading(true);
    try {
      const response = await axios.post(`${process.env.REACT_APP_BACKEND_URL}/auth/register/verify-email`, {
        userId,
        otp
      });

      setToast({
        open: true,
        message: response.data.message,
        severity: 'success'
      });

      // Close verification dialog
      setVerificationOpen(false);

      // Clear password field for security
      setFormData({
        ...formData,
        password: ''
      });
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Verification failed. Please try again.';
      setOtpError(errorMessage);
    } finally {
      setVerificationLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setResendDisabled(true);
    setCountdown(60); // 60 seconds cooldown
    setOtp(''); // Clear the OTP field

    try {
      const response = await axios.post(`${process.env.REACT_APP_BACKEND_URL}/auth/register/resend-verification`, {
        email: userEmail
      });

      setToast({
        open: true,
        message: response.data.message,
        severity: 'success'
      });
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to resend verification code.';
      setToast({ open: true, message: errorMessage, severity: 'error' });
    }
  };

  const handleClose = () => {
    setToast({ ...toast, open: false });
  };

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
        {showSkeleton ? (
          <LoginFormSkeleton />
        ) : (
          <>
            <Box sx={{ mb: 4, textAlign: 'center' ,bgcolor:'primary.main',color:'primary.contrastText' ,borderRadius:2,p:2}}>
              <Typography variant="h6" sx={{fontWeight:400}}>
                Not a Co-op Member?{' '}
                <Link
                  href="https://www.nmgrocers.com/membership"
                  target="_blank"
                  rel="noopener noreferrer"
                  sx={{
                    fontWeight: 'bold',
                    color: theme.palette.primary.contrastText,
                    textDecoration: 'none',
                    '&:hover': {
                      textDecoration: 'underline',
                    },
                  }}
                >
                  Join NMGA here
                </Link>
              </Typography>
            </Box>
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
                    mb: 3,
                    color: theme.palette.primary.contrastText
                  }}
                >
                  Welcome Back
                </Typography>

                <form onSubmit={handleSubmit}>
                  <Grid container spacing={3}>
                    <Grid item xs={12}>
                      <TextField
                        label="Email"
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleChange}
                        fullWidth
                        required
                        error={!!errors.email}
                        helperText={errors.email}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <Email color='primary.contrastText' />
                            </InputAdornment>
                          ),
                        }}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        label="Password"
                        name="password"
                        type={showPassword ? 'text' : 'password'}
                        value={formData.password}
                        onChange={handleChange}
                        fullWidth
                        required
                        error={!!errors.password}
                        helperText={errors.password}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <Lock color='primary.contrastText' />
                            </InputAdornment>
                          ),
                          endAdornment: (
                            <InputAdornment position="end">
                              <IconButton onClick={() => setShowPassword(!showPassword)}>
                                {showPassword ? <VisibilityOff color='primary.contrastText' /> : <Visibility color='primary.contrastText' />}
                              </IconButton>
                            </InputAdornment>
                          ),
                        }}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
                        <Links
                          link="/forget-password"
                          linkText="Forgot Password?"
                          sx={{
                            color: theme.palette.text.secondary,
                            '&:hover': {
                              color: theme.palette.primary.main
                            }
                          }}
                        />
                      </Box>
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
                        {loading ? <CircularProgress size={24} /> : "Login"}
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
                    gap: '8px',
                    mb: 2
                  }}
                >
                  Don't have an account?
                  <Links
                    link="/register"
                    linkText="Sign Up"
                    sx={{ fontWeight: 600 }}
                  />
                </Typography>
              </CardContent>
            </Card>
          </>
        )}

        <Toast
          open={toast.open}
          message={toast.message}
          severity={toast.severity}
          handleClose={handleClose}
        />

        {/* Email Verification Dialog */}
        <Dialog
          open={verificationOpen}
          maxWidth="xs"
          fullWidth
          PaperProps={{
            sx: {
              borderRadius: 2,
              p: 1
            }
          }}
        >
          <DialogTitle sx={{ textAlign: 'center', pb: 1 }}>
            <CheckCircleOutline color="primary.contrastText" sx={{ fontSize: 48, mb: 1 }} />
            <Typography variant="h5" component="div" sx={{ fontWeight: 600 }}>
              Verify Your Email
            </Typography>
          </DialogTitle>

          <DialogContent>
            <Alert severity="info" sx={{ mb: 3, color: theme.palette.primary.contrastText }}>
              Your email needs to be verified before you can log in.
            </Alert>

            <Typography variant="body1" sx={{ textAlign: 'center', mb: 3 }}>
              We've sent a verification code to <strong>{userEmail}</strong>.
              Please enter the code below to verify your email address.
            </Typography>

            <OtpInput
              length={6}
              value={otp}
              onChange={setOtp}
              error={otpError}
            />

            {otpError && (
              <Typography
                color="error"
                variant="body2"
                sx={{ textAlign: 'center', mb: 2 }}
              >
                {otpError}
              </Typography>
            )}

            <Button
              fullWidth
              variant="contained"
              color="primary"
              onClick={handleVerifyOTP}
              disabled={verificationLoading}
              sx={{ mb: 2 }}
            >
              {verificationLoading ? <CircularProgress size={24} /> : "Verify"}
            </Button>

            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 1 }}>
              <Button
                color="primary.contrastText"
                disabled={resendDisabled}
                onClick={handleResendOTP}
                sx={{ textTransform: 'none' }}
              >
                {resendDisabled
                  ? `Resend code in ${countdown}s`
                  : "Didn't receive the code? Resend"}
              </Button>
            </Box>
          </DialogContent>
        </Dialog>
      </div>
    </Container>
  );
};

export default LoginForm;
