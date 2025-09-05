import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { useAuth } from '../../middleware/auth';
import axios from 'axios';
import {
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  Grid,
  Avatar,
  Skeleton,
} from '@mui/material';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { PhotoCamera, Visibility, VisibilityOff} from '@mui/icons-material';
import Toast from '../../Components/Toast/Toast';
import { styled } from '@mui/material/styles';
import InputAdornment from '@mui/material/InputAdornment';
import IconButton from '@mui/material/IconButton';

const FormContainer = styled(Box)(({ theme }) => ({
  padding: theme.spacing(3),
}));

const AvatarContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  marginBottom: theme.spacing(3),
}));

const StyledButton = styled(Button)(({ theme }) => ({
  marginTop: theme.spacing(2),
}));

const SettingsSkeleton = () => (
  <Box>
    <Skeleton variant="text" sx={{ fontSize: '2rem', mb: 3 }} />
    <Grid container spacing={3}>
      <Grid item xs={12} md={4}>
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Skeleton variant="circular" width={150} height={150} sx={{ mx: 'auto', mb: 2 }} />
          <Skeleton variant="text" sx={{ fontSize: '1.5rem', mb: 1 }} />
          <Skeleton variant="text" width="80%" sx={{ mx: 'auto' }} />
          <Box sx={{ mt: 2 }}>
            <Skeleton variant="rectangular" width={120} height={36} sx={{ mx: 'auto' }} />
          </Box>
        </Paper>
      </Grid>
      <Grid item xs={12} md={8}>
        <Paper sx={{ p: 3 }}>
          <Grid container spacing={2}>
            {[...Array(6)].map((_, index) => (
              <Grid item xs={12} sm={6} key={index}>
                <Skeleton variant="text" sx={{ fontSize: '1rem', mb: 1 }} />
                <Skeleton variant="rectangular" height={56} />
              </Grid>
            ))}
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
                <Skeleton variant="rectangular" width={120} height={36} />
                <Skeleton variant="rectangular" width={120} height={36} />
              </Box>
            </Grid>
          </Grid>
        </Paper>
      </Grid>
    </Grid>
  </Box>
);

const UserProfileViewSettings = ({ userId }) => {
  const { currentUserId, isImpersonating, userRole } = useAuth();
  const [loading, setLoading] = useState(true);
  const [initialValues, setInitialValues] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    businessName: '',
    contactPerson: '',
    logo:'',
    additionalEmails: [],
    additionalPhoneNumbers: []
  });
  const [passwordValues, setPasswordValues] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const [avatar, setAvatar] = useState(null);
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [showPassword, setShowPassword] = useState({
    oldPassword: false,
    newPassword: false,
    confirmPassword: false,
  });

  useEffect(() => {
    if (userId) {
      fetchUserData();
    }
  }, [userId]);

  const fetchUserData = async () => {
    try {
      // If admin is viewing another user's profile, use the userId prop
      const targetUserId = userId || currentUserId;
      const response = await api.get(`/api/users/${targetUserId}`);
      setInitialValues({
        name: response.data.name || '',
        email: response.data.email || '',
        phone: response.data.phone || '',
        address: response.data.address || '',
        businessName: response.data.businessName || '',
        contactPerson: response.data.contactPerson || '',
        logo: response.data.logo || '',
        additionalEmails: response.data.additionalEmails || [],
        additionalPhoneNumbers: response.data.additionalPhoneNumbers || []
      });
      setLoading(false);
    } catch (error) {
      console.error('Error fetching user data:', error);
      setLoading(false);
      setSnackbar({
        open: true,
        message: 'Error loading user data',
        severity: 'error'
      });
    }
  };

  const handleAddEmail = () => {
    const newEmails = [...formik.values.additionalEmails, { email: '', label: '' }];
    formik.setFieldValue('additionalEmails', newEmails);
  };

  const handleRemoveEmail = (index) => {
    const newEmails = formik.values.additionalEmails.filter((_, i) => i !== index);
    formik.setFieldValue('additionalEmails', newEmails);
  };

  const handleAddPhone = () => {
    const newPhones = [...formik.values.additionalPhoneNumbers, { number: '', label: '' }];
    formik.setFieldValue('additionalPhoneNumbers', newPhones);
  };

  const handleRemovePhone = (index) => {
    const newPhones = formik.values.additionalPhoneNumbers.filter((_, i) => i !== index);
    formik.setFieldValue('additionalPhoneNumbers', newPhones);
  };

  const formik = useFormik({
    enableReinitialize: true,
    initialValues: initialValues,
    validationSchema: Yup.object({
      name: Yup.string().required('Required'),
      email: Yup.string().email('Invalid email address').required('Required'),
      phone: Yup.string().required('Required'),
      address: Yup.string(),
      businessName: Yup.string(),
      contactPerson: Yup.string(),
      additionalEmails: Yup.array().of(
        Yup.object().shape({
          email: Yup.string().email('Invalid email address'),
          label: Yup.string()
        })
      ),
      additionalPhoneNumbers: Yup.array().of(
        Yup.object().shape({
          number: Yup.string(),
          label: Yup.string()
        })
      )
    }),
          onSubmit: async (values) => {
        try {
          // If admin is updating another user's profile, use the userId prop
          const targetUserId = userId || currentUserId;
          await api.put(`/api/users/${targetUserId}`, values);
          setSnackbar({ 
            open: true, 
          message: 'Profile updated successfully',
          severity: 'success'
        });
      } catch (error) {
        console.error('Error updating profile:', error);
        setSnackbar({
          open: true,
          message: 'Error updating profile',
          severity: 'error'
        });
      }
    },
  });

  const handleAvatarChange = async (event) => {
    const file = event.target.files[0];
    if (file) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('upload_preset', process.env.REACT_APP_CLOUDINARY_UPLOAD_PRESET);
        formData.append('cloud_name', process.env.REACT_APP_CLOUDINARY_NAME);

        try {
            // Upload to Cloudinary
            const response = await axios.post(`https://api.cloudinary.com/v1_1/${process.env.REACT_APP_CLOUDINARY_NAME}/image/upload`, formData);
            const imageUrl = response.data.secure_url; // Get the URL of the uploaded image

                          // Send the URL to your backend
              const targetUserId = userId || currentUserId;
              await api.post(`/api/users/avatar/${targetUserId}`, { avatar: imageUrl });
              setAvatar(imageUrl); // Update the avatar state
            fetchUserData(); // Fetch user data again to update the avatar
            setSnackbar({
                open: true,
                message: 'Profile picture updated successfully',
                severity: 'success'
            });
        } catch (error) {
            console.error('Error uploading avatar:', error);
            setSnackbar({
                open: true,
                message: 'Error updating profile picture',
                severity: 'error'
            });
        }
    }
  };
  
  const handlePasswordChange = async (event) => {
    event.preventDefault();
  
    // Check if newPassword and confirmPassword match
    if (passwordValues.newPassword !== passwordValues.confirmPassword) {
      setSnackbar({
        open: true,
        message: 'New passwords do not match',
        severity: 'error',
      });
      return;
    }
  
    try {
      const targetUserId = userId || currentUserId;
      const response = await api.post(
        `/api/users/password/${targetUserId}`,
        {
          oldPassword: passwordValues.oldPassword,
          newPassword: passwordValues.newPassword,
        }
      );
  
      setSnackbar({
        open: true,
        message: response.data.message || 'Password changed successfully',
        severity: 'success',
      });
  
      // Clear form after success
      setPasswordValues({ oldPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error) {
      console.error('Error changing password:', error);
      setSnackbar({
        open: true,
        message: error.response?.data?.message || 'Error changing password',
        severity: 'error',
      });
    }
  };
  
  // Handler to toggle password visibility
  const handleClickShowPassword = (field) => {
    setShowPassword((prev) => ({
      ...prev,
      [field]: !prev[field],
    }));
  };

  const handleMouseDownPassword = (event) => {
    event.preventDefault();
  };

  if (loading) {
    return <SettingsSkeleton />;
  }

  const getInitials = (name) => {
    return name.split(' ').map(word => word[0]).join('').toUpperCase();
  };

  return (
    <Box sx={{ flexGrow: 1 }}>
      <Typography variant="h4" gutterBottom>
        {userRole === 'admin' ? 'User Settings' : 'Member Settings'}
      </Typography>

      <Grid container spacing={3}>
        {/* Profile Section - Render only when not showing Change Password */}
        {!showPasswordChange && (
          <Grid item xs={12} md={12}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Profile Information
              </Typography>
              
              {/* Avatar and Upload Button */}
              <AvatarContainer>
                <Avatar
                  src={initialValues.logo}
                  sx={{ 
                    width: 100, 
                    height: 100, 
                    mr: 2, 
                    bgcolor: 'primary.main', 
                    color: 'primary.contrastText',
                    fontSize: '2.5rem',
                    fontWeight: 'bold'
                  }}
                >
                  {!initialValues.logo && getInitials(initialValues.name)}
                </Avatar>
                <label htmlFor="avatar-input">
                  <input
                    accept="image/*"
                    id="avatar-input"
                    type="file"
                    hidden
                    onChange={handleAvatarChange}
                  />
                  <IconButton
                    color="primary.contrastText"
                    component="span"
                  >
                    <PhotoCamera color='primary.contrastText'/>
                  </IconButton>
                </label>
              </AvatarContainer>

              {/* Profile Form */}
              <FormContainer>
                <form onSubmit={formik.handleSubmit}>
                  <Grid container spacing={3}>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        id="name"
                        name="name"
                        label="Full Name"
                        value={formik.values.name}
                        onChange={formik.handleChange}
                        error={formik.touched.name && Boolean(formik.errors.name)}
                        helperText={formik.touched.name && formik.errors.name}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        id="email"
                        name="email"
                        label="Email Address"
                        type="email"
                        value={formik.values.email}
                        onChange={formik.handleChange}
                        disabled
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        id="phone"
                        name="phone"
                        label="Phone Number"
                        value={formik.values.phone}
                        onChange={formik.handleChange}
                        error={formik.touched.phone && Boolean(formik.errors.phone)}
                        helperText={formik.touched.phone && formik.errors.phone}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        id="address"
                        name="address"
                        label="Address"
                        value={formik.values.address}
                        onChange={formik.handleChange}
                        error={formik.touched.address && Boolean(formik.errors.address)}
                        helperText={formik.touched.address && formik.errors.address}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        id="businessName"
                        name="businessName"
                        label="Business Name"
                        value={formik.values.businessName}
                        onChange={formik.handleChange}
                        error={formik.touched.businessName && Boolean(formik.errors.businessName)}
                        helperText={formik.touched.businessName && formik.errors.businessName}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        id="contactPerson"
                        name="contactPerson"
                        label="Contact Person"
                        value={formik.values.contactPerson}
                        onChange={formik.handleChange}
                        error={formik.touched.contactPerson && Boolean(formik.errors.contactPerson)}
                        helperText={formik.touched.contactPerson && formik.errors.contactPerson}
                      />
                    </Grid>
                    
                    {/* Additional Emails Section */}
                    <Grid item xs={12}>
                      <Typography variant="h6" gutterBottom>
                        Additional Emails
                      </Typography>
                      {formik.values.additionalEmails.map((emailItem, index) => (
                        <Box key={index} sx={{ display: 'flex', gap: 2, mb: 2 }}>
                          <TextField
                            fullWidth
                            name={`additionalEmails.${index}.email`}
                            label="Email"
                            value={emailItem.email}
                            onChange={formik.handleChange}
                            error={formik.touched.additionalEmails?.[index]?.email && Boolean(formik.errors.additionalEmails?.[index]?.email)}
                            helperText={formik.touched.additionalEmails?.[index]?.email && formik.errors.additionalEmails?.[index]?.email}
                          />
                          <TextField
                            fullWidth
                            name={`additionalEmails.${index}.label`}
                            label="Label"
                            value={emailItem.label}
                            onChange={formik.handleChange}
                          />
                          <IconButton onClick={() => handleRemoveEmail(index)}sx={{
                            fontSize: '1.5rem',
                            borderRadius:'50%',
                            width:'54px',
                            height:'54px',
                            backgroundColor:'rgb(239, 68, 68)',
                            color:'white'
                          }}>
                           X
                          </IconButton>
                        </Box>
                      ))}
                      <Button
                        variant="outlined"
                        color='primary.contrastText'
                        onClick={handleAddEmail}
                      >
                        Add Email
                      </Button>
                    </Grid>

                    {/* Additional Phone Numbers Section */}
                    <Grid item xs={12}>
                      <Typography variant="h6" gutterBottom>
                        Additional Phone Numbers
                      </Typography>
                      {formik.values.additionalPhoneNumbers.map((phoneItem, index) => (
                        <Box key={index} sx={{ display: 'flex', gap: 2, mb: 2 }}>
                          <TextField
                            fullWidth
                            name={`additionalPhoneNumbers.${index}.number`}
                            label="Phone Number"
                            value={phoneItem.number}
                            onChange={formik.handleChange}
                          />
                          <TextField
                            fullWidth
                            name={`additionalPhoneNumbers.${index}.label`}
                            label="Label"
                            value={phoneItem.label}
                            onChange={formik.handleChange}
                          />
                          <IconButton onClick={() => handleRemovePhone(index)} sx={{
                            fontSize: '1.5rem',
                            borderRadius:'50%',
                            width:'54px',
                            height:'54px',
                            backgroundColor:'rgb(239, 68, 68)',
                            color:'white'
                          }}>
                            X
                          </IconButton>
                        </Box>
                      ))}
                      <Button
                        variant="outlined"
                        onClick={handleAddPhone}
                        color='primary.contrastText'
                        sx={{ mb: 2 }}
                      >
                        Add Phone Number
                      </Button>
                    </Grid>
                    <Grid item xs={12} sx={{ borderTop: 1, borderColor: 'primary.main' }}> 
                      <StyledButton color="primary" variant="contained" type="submit">
                        Update Profile
                      </StyledButton>
                      <StyledButton 
                        color="secondary" 
                        variant="outlined" 
                        onClick={() => setShowPasswordChange(true)}
                        sx={{ ml: 2 }}
                      >
                        Change Password
                      </StyledButton>
                    </Grid>
                  </Grid>
                </form>
              </FormContainer>
            </Paper>
          </Grid>
        )}

        {/* Change Password Section */}
        {showPasswordChange && (
          <Grid item xs={12} md={12}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Change Password
              </Typography>
              <FormContainer>
                <form onSubmit={handlePasswordChange}>
                  <Grid container spacing={3}>
                    <Grid item xs={12} sm={6} sx={{ margin: '0 auto' }}>
                      <TextField
                        fullWidth
                        id="oldPassword"
                        name="oldPassword"
                        label="Old Password"
                        type={showPassword.oldPassword ? 'text' : 'password'}
                        value={passwordValues.oldPassword}
                        onChange={(e) => setPasswordValues({ ...passwordValues, oldPassword: e.target.value })}
                        InputProps={{
                          endAdornment: (
                            <InputAdornment position="end">
                              <IconButton
                                aria-label="toggle old password visibility"
                                onClick={() => handleClickShowPassword('oldPassword')}
                                onMouseDown={handleMouseDownPassword}
                                edge="end"
                              >
                                {showPassword.oldPassword ? <VisibilityOff /> : <Visibility />}
                              </IconButton>
                            </InputAdornment>
                          ),
                        }}
                      />
                      <TextField
                        fullWidth
                        id="newPassword"
                        name="newPassword"
                        label="New Password"
                        type={showPassword.newPassword ? 'text' : 'password'}
                        value={passwordValues.newPassword}
                        onChange={(e) => setPasswordValues({ ...passwordValues, newPassword: e.target.value })}
                        sx={{ mt: 2 }}
                        InputProps={{
                          endAdornment: (
                            <InputAdornment position="end">
                              <IconButton
                                aria-label="toggle new password visibility"
                                onClick={() => handleClickShowPassword('newPassword')}
                                onMouseDown={handleMouseDownPassword}
                                edge="end"
                              >
                                {showPassword.newPassword ? <VisibilityOff /> : <Visibility />}
                              </IconButton>
                            </InputAdornment>
                          ),
                        }}
                      />
                      <TextField
                        fullWidth
                        id="confirmPassword"
                        name="confirmPassword"
                        label="Confirm Password"
                        type={showPassword.confirmPassword ? 'text' : 'password'}
                        value={passwordValues.confirmPassword}
                        onChange={(e) => setPasswordValues({ ...passwordValues, confirmPassword: e.target.value })}
                        sx={{ mt: 2 }}
                        InputProps={{
                          endAdornment: (
                            <InputAdornment position="end">
                              <IconButton
                                aria-label="toggle confirm password visibility"
                                onClick={() => handleClickShowPassword('confirmPassword')}
                                onMouseDown={handleMouseDownPassword}
                                edge="end"
                              >
                                {showPassword.confirmPassword ? <VisibilityOff /> : <Visibility />}
                              </IconButton>
                            </InputAdornment>
                          ),
                        }}
                      />
                      <StyledButton 
                        color="primary" 
                        variant="contained" 
                        type="submit"
                      >
                        Change Password
                      </StyledButton>
                      <StyledButton 
                        color="secondary" 
                        variant="outlined" 
                        sx={{ ml: 2, mt: 2 }}
                        onClick={() => setShowPasswordChange(false)}
                      >
                        Cancel
                      </StyledButton>
                    </Grid>
                  </Grid>
                </form>
              </FormContainer>
            </Paper>
          </Grid>
        )}
      </Grid>

      {/* Toast for notifications */}
      <Toast 
        open={snackbar.open} 
        message={snackbar.message} 
        severity={snackbar.severity} 
        handleClose={() => setSnackbar({ ...snackbar, open: false })} 
      />
    </Box>
  );
};

export default UserProfileViewSettings; 
