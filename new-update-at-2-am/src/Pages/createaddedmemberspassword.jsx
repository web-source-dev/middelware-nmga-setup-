import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  TextField,
  Stack,
  Typography,
  Container,
  Paper,
  InputAdornment,
  IconButton,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Grid,
  CircularProgress,
  Alert,
  Card,
  CardContent,
  Divider
} from '@mui/material';
import { styled } from '@mui/material/styles';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { useSnackbar } from 'notistack';

// Get the API URL directly
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

// Custom styled component for the logo
const Logo = styled('img')({
  maxHeight: '80px',
  margin: '0 auto',
  display: 'block'
});

// Custom styled component for requirement items
const RequirementItem = ({ met, text }) => (
  <ListItem dense>
    <ListItemIcon sx={{ minWidth: 30 }}>
      {met ? (
        <CheckIcon fontSize="small" color="success" />
      ) : (
        <CloseIcon fontSize="small" color="error" />
      )}
    </ListItemIcon>
    <ListItemText 
      primary={text} 
      primaryTypographyProps={{ 
        fontSize: 14, 
        color: met ? 'success.main' : 'text.secondary'
      }} 
    />
  </ListItem>
);

const CreateAddedMembersPassword = () => {
  const { enqueueSnackbar } = useSnackbar();
  const navigate = useNavigate();
  const location = useLocation();
  const [token, setToken] = useState('');
  const [userData, setUserData] = useState(null);
  const [passwords, setPasswords] = useState({
    password: '',
    confirmPassword: ''
  });
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [confirmPasswordVisible, setConfirmPasswordVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [tokenValid, setTokenValid] = useState(false);

  // Password strength requirements
  const [requirements, setRequirements] = useState({
    length: false,
    uppercase: false,
    lowercase: false,
    number: false,
    special: false,
    match: false
  });

  useEffect(() => {
    // Get token from URL query parameters
    const searchParams = new URLSearchParams(location.search);
    const tokenFromUrl = searchParams.get('token');
    
    if (tokenFromUrl) {
      setToken(tokenFromUrl);
      verifyToken(tokenFromUrl);
    } else {
      setError('No token provided. Please use the link sent in your invitation email.');
    }
  }, [location]);

  const verifyToken = async (token) => {
    try {
      setIsLoading(true);
      
      const response = await axios.get(`${API_URL}/auth/verify-password-token/${token}`);
      
      if (response.data.success) {
        setUserData(response.data.user);
        setTokenValid(true);
      } else {
        setError('Invalid or expired token. Please request a new invitation.');
      }
    } catch (error) {
      console.error('Token verification error:', error);
      setError('Invalid or expired token. Please request a new invitation.');
    } finally {
      setIsLoading(false);
    }
  };

  const validatePassword = (password, confirmPassword) => {
    const newRequirements = {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /[0-9]/.test(password),
      special: /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password),
      match: password === confirmPassword && password !== ''
    };
    
    setRequirements(newRequirements);
    
    return Object.values(newRequirements).every(req => req === true);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    setPasswords(prev => {
      const updated = { ...prev, [name]: value };
      validatePassword(
        name === 'password' ? value : updated.password,
        name === 'confirmPassword' ? value : updated.confirmPassword
      );
      return updated;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validatePassword(passwords.password, passwords.confirmPassword)) {
      enqueueSnackbar('Please make sure your password meets all requirements', {
        variant: 'error',
      });
      return;
    }
    
    try {
      setIsLoading(true);
      
      console.log("Making API call to:", `${API_URL}/auth/create-password`);
      const response = await axios.post(`${API_URL}/auth/create-password`, {
        token,
        password: passwords.password
      });
      
      if (response.data.success) {
        enqueueSnackbar('Your password has been set successfully. You can now log in.', {
          variant: 'success',
        });
        
        // Navigate to login page
        navigate('/login');
      }
    } catch (error) {
      console.error('Password creation error:', error);
      enqueueSnackbar(error.response?.data?.message || 'Failed to create password', {
        variant: 'error',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Container maxWidth="md" sx={{ py: 5 }}>
      <Card>
        <CardContent sx={{ py: 4 }}>
          <Box sx={{ textAlign: 'center', mb: 3 }}>
            <Logo src="/logo.png" alt="NMGA Logo" />
          </Box>
          
          <Box sx={{ maxWidth: '600px', mx: 'auto' }}>
            <Box sx={{ textAlign: 'center', mb: 4 }}>
              <Typography variant="h4" component="h1" gutterBottom>
                Create Your Password
              </Typography>
              
              {userData && (
                <Typography variant="h6" gutterBottom sx={{ mt: 1 }}>
                  Welcome, {userData.name}!
                </Typography>
              )}
              
              <Typography variant="body1" sx={{ mt: 2 }}>
                You were invited to join NMGA. Please create a password to complete your registration.
              </Typography>
            </Box>
            
            {error ? (
              <Alert severity="error" sx={{ mb: 4 }}>
                {error}
              </Alert>
            ) : tokenValid ? (
              <Box component="form" onSubmit={handleSubmit}>
                <Stack spacing={3}>
                  <TextField
                    label="Create Password"
                    name="password"
                    type={passwordVisible ? 'text' : 'password'}
                    value={passwords.password}
                    onChange={handleChange}
                    placeholder="Create a strong password"
                    required
                    fullWidth
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            aria-label="toggle password visibility"
                            onClick={() => setPasswordVisible(!passwordVisible)}
                            edge="end"
                          >
                            {passwordVisible ? <VisibilityOffIcon /> : <VisibilityIcon />}
                          </IconButton>
                        </InputAdornment>
                      )
                    }}
                  />
                  
                  <TextField
                    label="Confirm Password"
                    name="confirmPassword"
                    type={confirmPasswordVisible ? 'text' : 'password'}
                    value={passwords.confirmPassword}
                    onChange={handleChange}
                    placeholder="Confirm your password"
                    required
                    fullWidth
                    error={passwords.confirmPassword !== '' && !requirements.match}
                    helperText={passwords.confirmPassword !== '' && !requirements.match ? 'Passwords do not match' : ''}
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            aria-label="toggle password visibility"
                            onClick={() => setConfirmPasswordVisible(!confirmPasswordVisible)}
                            edge="end"
                          >
                            {confirmPasswordVisible ? <VisibilityOffIcon /> : <VisibilityIcon />}
                          </IconButton>
                        </InputAdornment>
                      )
                    }}
                  />
                  
                  <Paper variant="outlined" sx={{ p: 2, bgcolor: 'background.paper', mt: 2, mb: 3 }}>
                    <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'medium', mb: 1 }}>
                      Password Requirements:
                    </Typography>
                    <List dense disablePadding>
                      <RequirementItem met={requirements.length} text="At least 8 characters long" />
                      <RequirementItem met={requirements.uppercase} text="Contains uppercase letter" />
                      <RequirementItem met={requirements.lowercase} text="Contains lowercase letter" />
                      <RequirementItem met={requirements.number} text="Contains a number" />
                      <RequirementItem met={requirements.special} text="Contains a special character" />
                      <RequirementItem met={requirements.match} text="Passwords match" />
                    </List>
                  </Paper>
                  
                  <Button
                    type="submit"
                    variant="contained"
                    color="primary"
                    size="large"
                    disabled={isLoading || !Object.values(requirements).every(req => req === true)}
                    sx={{ mt: 2 }}
                  >
                    {isLoading ? <CircularProgress size={24} /> : 'Create Password'}
                  </Button>
                </Stack>
              </Box>
            ) : (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <CircularProgress />
                <Typography sx={{ mt: 2 }}>Verifying your invitation...</Typography>
              </Box>
            )}
          </Box>
        </CardContent>
      </Card>
    </Container>
  );
};

export default CreateAddedMembersPassword;
