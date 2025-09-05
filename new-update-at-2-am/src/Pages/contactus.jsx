import React, { useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  TextField,
  Button,
  Card,
  CardContent,
  useTheme,
  useMediaQuery,
  Paper,
  Snackbar,
  Alert,
  Skeleton
} from '@mui/material';
import { styled } from '@mui/system';
import { motion } from "framer-motion";
import EmailIcon from '@mui/icons-material/Email';
import PhoneIcon from '@mui/icons-material/Phone';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import SendIcon from '@mui/icons-material/Send';
import SupportAgentIcon from '@mui/icons-material/SupportAgent';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import api from '../services/api';

// Enhanced Styled Components matching home page theme
const GradientHeroSection = styled(Box)(({ theme }) => ({
  background: theme.palette.primary.main,
  color: 'white',
  position: 'relative',
  overflow: 'hidden',
  padding: '120px 0 80px 0',

}));

const AnimatedCard = styled(motion(Card))({
  height: '100%',
  transition: 'all 0.3s ease-in-out',
  background: 'rgba(255, 255, 255, 0.95)',
  backdropFilter: 'blur(10px)',
  border: '1px solid rgba(255, 255, 255, 0.2)',
  '&:hover': {
    transform: 'translateY(-8px)',
    boxShadow: '0 12px 24px rgba(0,0,0,0.2)',
  }
});

const GlassCard = styled(Paper)({
  background: 'rgba(255, 255, 255, 0.8)',
  backdropFilter: 'blur(10px)',
  border: '1px solid rgba(255, 255, 255, 0.2)',
  borderRadius: 16,
  padding: '24px',
});

const StyledTextField = styled(TextField)({
  '& .MuiOutlinedInput-root': {
    '&:hover fieldset': {
      borderColor: 'primary.main',
    },
    '&.Mui-focused fieldset': {
      borderColor: 'primary.main',
    },
  },
});

const ContactUs = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [openSnackbar, setOpenSnackbar] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const [snackbarMessage, setSnackbarMessage] = useState('Thank you for your message! We\'ll get back to you soon.');
  const [snackbarSeverity, setSnackbarSeverity] = useState('success');

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Get user data from localStorage
    const user_id = localStorage.getItem('user_id');
    const user_role = localStorage.getItem('user_role');

    if (!user_id || !user_role) {
      setSnackbarMessage('Please login to submit the form');
      setSnackbarSeverity('error');
      setOpenSnackbar(true);
      return;
    }

    try {
      const response = await api.post(`/api/contact/submit`, {
        ...formData,
        user_id,
        user_role
      });

      const data = await response.data;

      if (data.success) {
        setSnackbarMessage('Thank you for your message! We\'ll get back to you soon.');
        setSnackbarSeverity('success');
        setFormData({ name: '', email: '', subject: '', message: '' });
      } else {
        setSnackbarMessage(data.message || 'Error submitting form');
        setSnackbarSeverity('error');
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      setSnackbarMessage('Error submitting form. Please try again.');
      setSnackbarSeverity('error');
    }
    
    setOpenSnackbar(true);
  };

  const contactInfo = [
    {
      icon: <EmailIcon fontSize="large" />,
      title: 'Email Us',
      content: 'support@nmga.com',
      description: 'We aim to respond within 24 hours'
    },
    {
      icon: <PhoneIcon fontSize="large" />,
      title: 'Call Us',
      content: '+1 (555) 123-4567',
      description: 'Monday to Friday, 9am to 6pm EST'
    },
    {
      icon: <LocationOnIcon fontSize="large" />,
      title: 'Visit Us',
      content: '123 Business Avenue, Suite 100',
      description: 'New York, NY 10001'
    }
  ];

  const supportFeatures = [
    {
      icon: <SupportAgentIcon fontSize="large" />,
      title: '24/7 Support',
      description: 'Our dedicated team is always here to help you with any questions or concerns.'
    },
    {
      icon: <AccessTimeIcon fontSize="large" />,
      title: 'Quick Response',
      description: 'Get answers to your questions within 24 hours, guaranteed.'
    },
    {
      icon: <SendIcon fontSize="large" />,
      title: 'Multiple Channels',
      description: 'Reach us through email, phone, or visit our office - whatever works best for you.'
    }
  ];


  return (
    <Box>
      {/* Hero Section */}
      <GradientHeroSection>
        <Container maxWidth="lg">
          <Box sx={{ textAlign: 'center', position: 'relative', zIndex: 1 }}>
            <Typography variant="h2" component="h1" 
              sx={{ 
                fontWeight: 700,
                mb: 3,
                fontSize: isMobile ? '2.5rem' : '3.5rem',
              }}>
              Contact Us
            </Typography>
            <Typography variant="h5" sx={{ mb: 4, opacity: 0.9 }}>
              We're Here to Help You Succeed
            </Typography>
          </Box>
        </Container>
      </GradientHeroSection>

      <Container maxWidth="lg" sx={{ py: 8 }}>
        {/* Support Features */}
        <Box sx={{ mb: 8 }}>
          <Typography variant="h4" gutterBottom sx={{ textAlign: 'center', color: 'primary.contrastText', mb: 4 }}>
            How We Can Help
          </Typography>
          <Grid container spacing={4}>
            {supportFeatures.map((feature, index) => (
              <Grid item xs={12} md={4} key={index}>
                <AnimatedCard
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.2 }}
                >
                  <CardContent sx={{ textAlign: 'center' }}>
                    <Box sx={{ color: 'primary.contrastText', mb: 2 }}>{feature.icon}</Box>
                    <Typography variant="h5" sx={{ mb: 2 }}>
                      {feature.title}
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                      {feature.description}
                    </Typography>
                  </CardContent>
                </AnimatedCard>
              </Grid>
            ))}
          </Grid>
        </Box>

        <Grid container spacing={4}>
          {/* Contact Form */}
          <Grid item xs={12} md={8}>
            <GlassCard>
              <Typography variant="h4" gutterBottom sx={{ color: 'primary.contrastText', mb: 4 }}>
                Send Us a Message
              </Typography>
              <form onSubmit={handleSubmit}>
                <Grid container spacing={3}>
                  <Grid item xs={12} sm={6}>
                    <StyledTextField
                      fullWidth
                      label="Name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <StyledTextField
                      fullWidth
                      label="Email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <StyledTextField
                      fullWidth
                      label="Subject"
                      name="subject"
                      value={formData.subject}
                      onChange={handleChange}
                      required
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <StyledTextField
                      fullWidth
                      label="Message"
                      name="message"
                      multiline
                      rows={4}
                      value={formData.message}
                      onChange={handleChange}
                      required
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <Button
                      type="submit"
                      variant="contained"
                      size="large"
                      endIcon={<SendIcon sx={{color:'primary.contrastText'}} />}
                      sx={{
                          bgcolor: 'primary.main',
                          color: 'primary.contrastText',
                          '&:hover': {
                            bgcolor: 'primary.dark'
                          }
                      }}
                    >
                      Send Message
                    </Button>
                  </Grid>
                </Grid>
              </form>
            </GlassCard>
          </Grid>

          {/* Contact Information */}
          <Grid item xs={12} md={4}>
            <Box sx={{ height: '30%' }}>
              {contactInfo.map((info, index) => (
                <AnimatedCard
                  key={index}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.2 }}
                  sx={{ mb: 2 }}
                >
                  <CardContent>
                    <Box sx={{ color: 'primary.contrastText', mb: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
                      {info.icon}                      
                      <Typography variant="h6" gutterBottom>
                        {info.title}
                      </Typography>
                    </Box>
                    <Typography variant="body1" sx={{ mb: 1 }}>
                      {info.title === 'Email Us' ? (
                        <a href={`mailto:${info.content}`} style={{ color: 'inherit', textDecoration: 'none' }}>
                          {info.content}
                        </a>
                      ) : (
                        <a href={`tel:${info.content}`} style={{ color: 'inherit', textDecoration: 'none' }}>
                          {info.content}
                        </a>
                      )}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {info.description}
                    </Typography>
                  </CardContent>
                </AnimatedCard>
              ))}
            </Box>
          </Grid>
        </Grid>
      </Container>

      <Snackbar
        open={openSnackbar}
        autoHideDuration={6000}
        onClose={() => setOpenSnackbar(false)}
      >
        <Alert onClose={() => setOpenSnackbar(false)} severity={snackbarSeverity}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default ContactUs;