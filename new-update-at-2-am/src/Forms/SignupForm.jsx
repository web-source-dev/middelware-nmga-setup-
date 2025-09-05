import React, { useState, useEffect } from 'react';
import { 
  TextField, 
  Button, 
  Container, 
  Typography, 
  Grid, 
  MenuItem, 
  Paper, 
  Box, 
  CircularProgress, 
  Skeleton, 
  InputAdornment, 
  IconButton,
  Stepper,
  Step,
  StepLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
  FormHelperText,
  Card,
  CardContent,
  useTheme,
  useMediaQuery,
  Stack
} from '@mui/material';
import { 
  Visibility, 
  VisibilityOff, 
  Email, 
  Person, 
  Business, 
  Phone, 
  Lock,
  CheckCircleOutline
} from '@mui/icons-material';
import axios from 'axios';
import Toast from '../Components/Toast/Toast';
import Links from '../Components/Buttons/Links';
import { isAuthenticated, isAdmin, isDistributor, isMember } from '../services/api';
import { useNavigate } from 'react-router-dom';

const SignupFormSkeleton = () => (
  <Container maxWidth="sm">
    <Box sx={{ mt: 4 }}>
      <Skeleton variant="text" sx={{ fontSize: '2rem', mb: 3, textAlign: 'center' }} />
      <Paper sx={{ p: 3 }}>
        <Grid container spacing={2}>
          {[...Array(6)].map((_, index) => (
            <Grid item xs={12} sm={index < 2 ? 6 : 12} key={index}>
              <Skeleton variant="text" sx={{ mb: 1 }} />
              <Skeleton variant="rectangular" height={56} />
            </Grid>
          ))}
          <Grid item xs={12}>
            <Box sx={{ mt: 1 }}>
              <Skeleton variant="rectangular" width={24} height={24} sx={{ display: 'inline-block', mr: 1 }} />
              <Skeleton variant="text" width={200} sx={{ display: 'inline-block' }} />
            </Box>
          </Grid>
          <Grid item xs={12}>
            <Skeleton variant="rectangular" height={42} />
          </Grid>
        </Grid>
        <Box sx={{ mt: 2, textAlign: 'center' }}>
          <Skeleton variant="text" width={200} sx={{ mx: 'auto' }} />
        </Box>
      </Paper>
    </Box>
  </Container>
);

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

const SignupForm = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const navigate = useNavigate();
  
  const [activeStep, setActiveStep] = useState(0);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'member',
    businessName: '',
    contactPerson: '',
    phone: '',
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
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [userId, setUserId] = useState(null);
  const [verificationOpen, setVerificationOpen] = useState(false);
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
    
    // Name validation
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    } else if (formData.name.trim().length < 3) {
      newErrors.name = 'Name must be at least 3 characters';
    }
    
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
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    } else if (!/(?=.*[a-z])/.test(formData.password)) {
      newErrors.password = 'Password must contain at least one lowercase letter';
    } else if (!/(?=.*[A-Z])/.test(formData.password)) {
      newErrors.password = 'Password must contain at least one uppercase letter';
    } else if (!/(?=.*\d)/.test(formData.password)) {
      newErrors.password = 'Password must contain at least one number';
    }
    
    // Confirm password validation
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    
    // Business name validation
    if (!formData.businessName.trim()) {
      newErrors.businessName = 'Business name is required';
    }
    
    // Contact person validation
    if (!formData.contactPerson.trim()) {
      newErrors.contactPerson = 'Contact person is required';
    }
    
    // Phone validation
    const phoneRegex = /^\d{10,15}$/;
    if (!formData.phone) {
      newErrors.phone = 'Phone number is required';
    } else if (!phoneRegex.test(formData.phone.replace(/[-()\s]/g, ''))) {
      newErrors.phone = 'Please enter a valid phone number';
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

  const handleNext = () => {
    if (activeStep === 0) {
      // Validate only first step fields
      const firstStepErrors = {};
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      
      if (!formData.name.trim()) {
        firstStepErrors.name = 'Name is required';
      } else if (formData.name.trim().length < 3) {
        firstStepErrors.name = 'Name must be at least 3 characters';
      }
      
      if (!formData.email) {
        firstStepErrors.email = 'Email is required';
      } else if (!emailRegex.test(formData.email)) {
        firstStepErrors.email = 'Please enter a valid email address';
      }
      
      if (!formData.password) {
        firstStepErrors.password = 'Password is required';
      } else if (formData.password.length < 8) {
        firstStepErrors.password = 'Password must be at least 8 characters';
      } else if (!/(?=.*[a-z])/.test(formData.password)) {
        firstStepErrors.password = 'Password must contain at least one lowercase letter';
      } else if (!/(?=.*[A-Z])/.test(formData.password)) {
        firstStepErrors.password = 'Password must contain at least one uppercase letter';
      } else if (!/(?=.*\d)/.test(formData.password)) {
        firstStepErrors.password = 'Password must contain at least one number';
      }
      
      if (formData.password !== formData.confirmPassword) {
        firstStepErrors.confirmPassword = 'Passwords do not match';
      }
      
      setErrors(firstStepErrors);
      
      if (Object.keys(firstStepErrors).length === 0) {
        setActiveStep(1);
      }
    }
  };

  const handleBack = () => {
    setActiveStep(activeStep - 1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    
    setLoading(true);
    try {
      const response = await axios.post(`${process.env.REACT_APP_BACKEND_URL}/auth/register`, {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        role: formData.role,
        businessName: formData.businessName,
        contactPerson: formData.contactPerson,
        phone: formData.phone
      });
      
      setToast({ 
        open: true, 
        message: response.data.message, 
        severity: 'success' 
      });
      
      // Store userId for verification
      setUserId(response.data.userId);
      
      // Open verification dialog
      setVerificationOpen(true);
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Server error, please try again.';
      setToast({ open: true, message: errorMessage, severity: 'error' });
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
      
      // Close verification dialog and redirect to login
      setVerificationOpen(false);
      setTimeout(() => {
        window.location.href = '/login';
      }, 2000);
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
        email: formData.email
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

  const getStepContent = (step) => {
    switch (step) {
      case 0:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                label="Full Name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                fullWidth
                required
                error={!!errors.name}
                helperText={errors.name}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Person  color='primary.contrastText'/>
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
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
                      <Email  color='primary.contrastText'/>
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
              <FormHelperText>
                Password must be at least 8 characters with uppercase, lowercase, and numbers
              </FormHelperText>
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Confirm Password"
                name="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                value={formData.confirmPassword}
                onChange={handleChange}
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
          </Grid>
        );
      case 1:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                label="Business Name"
                name="businessName"
                value={formData.businessName}
                onChange={handleChange}
                fullWidth
                required
                error={!!errors.businessName}
                helperText={errors.businessName}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Business  color='primary.contrastText'/>
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Contact Person"
                name="contactPerson"
                value={formData.contactPerson}
                onChange={handleChange}
                fullWidth
                required
                error={!!errors.contactPerson}
                helperText={errors.contactPerson}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Person  color='primary.contrastText'/>
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                fullWidth
                required
                error={!!errors.phone}
                helperText={errors.phone}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Phone  color='primary.contrastText'/>
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                select
                label="Role"
                name="role"
                value={formData.role}
                onChange={handleChange}
                fullWidth
                required
              >
                <MenuItem value="member">Member</MenuItem>
                <MenuItem value="distributor">Distributor</MenuItem>
              </TextField>
            </Grid>
          </Grid>
        );
      default:
        return 'Unknown step';
    }
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
          <SignupFormSkeleton />
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
                  mb: 3,
                  color: theme.palette.primary.contrastText
                }}
              >
                Create Account
              </Typography>
              
              <Stepper 
                activeStep={activeStep} 
                alternativeLabel={!isMobile}
                orientation={isMobile ? 'vertical' : 'horizontal'}
                sx={{ mb: 4 }}
              >
                <Step>
                  <StepLabel>Account Details</StepLabel>
                </Step>
                <Step>
                  <StepLabel>Business Information</StepLabel>
                </Step>
              </Stepper>
              
              <form onSubmit={activeStep === 1 ? handleSubmit : (e) => e.preventDefault()}>
                {getStepContent(activeStep)}
                
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
                  <Button
                    disabled={activeStep === 0}
                    onClick={handleBack}
                    variant="outlined"
                  >
                    Back
                  </Button>
                  
                  {activeStep === 0 ? (
                    <Button
                      variant="contained"
                      color="primary"
                      onClick={handleNext}
                    >
                      Next
                    </Button>
                  ) : (
                    <Button
                      type="submit"
                      variant="contained"
                      color="primary"
                      disabled={loading}
                    >
                      {loading ? <CircularProgress size={24} /> : "Sign Up"}
                    </Button>
                  )}
                </Box>
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
                Already have an account? 
                <Links 
                  link="/login" 
                  linkText="Login Now" 
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
            <Typography variant="body1" sx={{ textAlign: 'center', mb: 3 }}>
              We've sent a verification code to <strong>{formData.email}</strong>. 
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
              color="primary.contrastText"
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

export default SignupForm;