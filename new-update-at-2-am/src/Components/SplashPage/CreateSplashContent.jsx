import React, { useState, useEffect } from 'react';
import { TextField, Button, Checkbox, FormControlLabel, Select, MenuItem, InputLabel, FormControl, Grid, Typography, Box, IconButton, Paper, Dialog, DialogContent, Alert, CircularProgress } from '@mui/material';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import RemoveCircleOutlineIcon from '@mui/icons-material/RemoveCircleOutline';
import CloudinaryUpload from '../cloudinary/cloudinary';
import VisibilityIcon from '@mui/icons-material/Visibility';
import './CreateSplashContent.css';
import { useNavigate, useParams } from 'react-router-dom';
import DisplaySplashContent from './DisplaySplashContent';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import api from '../../services/api';

const CreateSplashContent = () => {
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [formData, setFormData] = useState({
    cards: [{
      title: '',
      subheading: '',
      content: '',
      media: [],
      ctaButtons: [{ text: '', link: '' }]
    }],
    displaySettings: {
      displayType: 'modal',
      animation: 'fade',
      navigationStyle: 'slider',
      autoPlay: false
    },
    scheduling: {
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      showOnlyOnce: false,
      frequency: 'once',
      daysOfWeek: [],
      timeOfDay: {
        start: '00:00',
        end: '23:59'
      }
    },
    targeting: {
      userRoles: ['all']
    },
    isActive: true
  });

  const { id } = useParams();
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (id) {
      const fetchSplashContent = async () => {
        try {
          setLoading(true);
          const response = await api.get(`/api/splash/${id}`);
          
          // Format dates properly for the date input fields
          const formattedData = { ...response.data };
          if (formattedData.scheduling) {
            // Ensure dates are in YYYY-MM-DD format
            if (formattedData.scheduling.startDate) {
              formattedData.scheduling.startDate = new Date(formattedData.scheduling.startDate)
                .toISOString().split('T')[0];
            }
            if (formattedData.scheduling.endDate) {
              formattedData.scheduling.endDate = new Date(formattedData.scheduling.endDate)
                .toISOString().split('T')[0];
            }
          }
          
          setFormData(formattedData);
          setIsEditing(true);
        } catch (error) {
          console.error('Error fetching splash content:', error);
          setError('Failed to load splash content');
        } finally {
          setLoading(false);
        }
      };
      fetchSplashContent();
    }
  }, [id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    const nameParts = name.split('.');
    
    if (nameParts.length === 3) {
      // Handle nested properties like scheduling.timeOfDay.start
      const [section, subsection, field] = nameParts;
      setFormData((prev) => ({
        ...prev,
        [section]: {
          ...prev[section],
          [subsection]: {
            ...prev[section][subsection],
            [field]: value
          }
        },
      }));
    } else if (nameParts.length === 2) {
      // Handle properties like scheduling.startDate
      const [section, field] = nameParts;
      setFormData((prev) => ({
        ...prev,
        [section]: {
          ...prev[section],
          [field]: value,
        },
      }));
    } else {
      // Handle top-level properties
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleCheckboxChange = (e) => {
    const { name, checked } = e.target;
    const [section, field] = name.split('.');
    if (field) {
      setFormData((prev) => ({
        ...prev,
        [section]: {
          ...prev[section],
          [field]: checked,
        },
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: checked,
      }));
    }
  };

  const handleCardChange = (index, e) => {
    const { name, value } = e.target;
    const newCards = [...formData.cards];
    newCards[index] = { ...newCards[index], [name]: value };
    setFormData({ ...formData, cards: newCards });
  };

  const handleMediaUpload = (index, url, type) => {
    const newCards = [...formData.cards];
    newCards[index].media.push({ type, url });
    setFormData({ ...formData, cards: newCards });
  };

  const handleMediaRemove = (index, mediaIndex) => {
    const newCards = [...formData.cards];
    newCards[index].media.splice(mediaIndex, 1);
    setFormData({ ...formData, cards: newCards });
  };

  const handleCtaChange = (index, ctaIndex, e) => {
    const { name, value } = e.target;
    const newCards = [...formData.cards];
    newCards[index].ctaButtons[ctaIndex] = { ...newCards[index].ctaButtons[ctaIndex], [name]: value };
    setFormData({ ...formData, cards: newCards });
  };

  const addCard = () => {
    setFormData({ ...formData, cards: [...formData.cards, { title: '', subheading: '', content: '', media: [], ctaButtons: [{ text: '', link: '' }] }] });
  };

  const removeCard = (index) => {
    const newCards = [...formData.cards];
    newCards.splice(index, 1);
    setFormData({ ...formData, cards: newCards });
  };

  const addCtaButton = (index) => {
    const newCards = [...formData.cards];
    newCards[index].ctaButtons.push({ text: '', link: '' });
    setFormData({ ...formData, cards: newCards });
  };

  const removeCtaButton = (index, ctaIndex) => {
    const newCards = [...formData.cards];
    newCards[index].ctaButtons.splice(ctaIndex, 1);
    setFormData({ ...formData, cards: newCards });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);

      // Validate required fields
      if (!formData.cards[0].title || !formData.cards[0].content) {
        setError('Title and content are required');
        return;
      }
      
      // Ensure timeOfDay is properly formatted as an object with start and end times
      const dataToSubmit = {
        ...formData,
        scheduling: {
          ...formData.scheduling,
          timeOfDay: {
            start: formData.scheduling.timeOfDay?.start || '00:00',
            end: formData.scheduling.timeOfDay?.end || '23:59'
          }
        }
      };
      
      console.log("formdata before submitting", dataToSubmit);

      if (isEditing) {
        await api.patch(`/api/splash/${id}`, dataToSubmit); 
      } else {
        await api.post(`/api/splash/create`, dataToSubmit);
      }
      navigate('/dashboard/admin/splash-content');
    } catch (error) {
      console.error('Error saving splash content:', error);
      setError(error.response?.data?.error || 'Failed to save splash content');
    } finally {
      setLoading(false);
    }
  };

  const handleNextCard = () => {
    setCurrentCardIndex((prevIndex) => (prevIndex + 1) % formData.cards.length);
  };

  useEffect(() => {
    if (formData.displaySettings.autoPlay && formData.cards.length > 1) {
      const interval = setInterval(() => {
        handleNextCard();
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [formData.displaySettings.autoPlay, formData.cards.length]);

  if (loading) return (
    <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
      <CircularProgress />
    </Box>
  );

  return (
    <Box sx={{ 
      p: 4, 
      bgcolor: '#ffffff',
      borderRadius: 3,
      maxWidth: 1500,
      margin: '0 auto',
      boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
      transition: '0.3s',
      '&:hover': {
        boxShadow: '0 8px 30px rgba(0,0,0,0.2)',
      }
    }}>
      <Button variant="contained" color="primary" onClick={() => navigate('/dashboard/admin/splash-content')} sx={{ mb: 2, borderRadius: 2 }}>
        <ArrowBackIcon color="primary.contrastText" />
        Back
      </Button>
      <Typography 
        variant="h4" 
        gutterBottom 
        sx={{ 
          textAlign: 'center', 
          mb: 4,
          fontWeight: 700,
          color: 'primary.contrastText'
        }}
      >
        {isEditing ? 'Edit Splash Content' : 'Create Splash Content'}
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>{error}</Alert>
      )}

      <form onSubmit={handleSubmit}>

      <Paper sx={{ p: 3, mb: 4, borderRadius: 2, boxShadow: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h6" sx={{ color: 'primary.contrastText', fontWeight: 600 }}>Cards</Typography>
            <Button 
              variant="contained" 
              color="primary" 
              startIcon={<AddCircleOutlineIcon color="primary.contrastText" />} 
              onClick={addCard}
              sx={{ 
                borderRadius: 2,
                textTransform: 'none',
              }}
            >
              Add New Card
            </Button>
          </Box>
          
          {formData.cards.map((card, index) => (
            <Paper 
              key={index} 
              sx={{ 
                mb: 3, 
                p: 3, 
                borderRadius: 2, 
                border: '1px solid #e0e0e0',
                position: 'relative',
                boxShadow: 0,
                transition: '0.3s',
                '&:hover': {
                  boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
                }
              }}
              elevation={2}
            >
              <Box sx={{ position: 'absolute', right: 16, top: 16 }}>
                <IconButton 
                  color="error" 
                  onClick={() => removeCard(index)}
                  sx={{ 
                    bgcolor: 'primary.main',
                    '&:hover': {
                      bgcolor: 'primary.main',
                    }
                  }}
                >
                  <RemoveCircleOutlineIcon color="error.main" />
                </IconButton>
              </Box>

              <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600, color: 'primary.contrastText' }}>
                Card {index + 1}
              </Typography>

              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Title"
                    name="title"
                    value={card.title}
                    onChange={(e) => handleCardChange(index, e)}
                    sx={{ bgcolor: '#f8f9fa', borderRadius: 2 }}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Subheading"
                    name="subheading"
                    value={card.subheading}
                    onChange={(e) => handleCardChange(index, e)}
                    sx={{ bgcolor: '#f8f9fa', borderRadius: 2 }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Content"
                    name="content"
                    value={card.content}
                    onChange={(e) => handleCardChange(index, e)}
                    multiline
                    rows={4}
                    sx={{ bgcolor: '#f8f9fa', borderRadius: 2 }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="h6">Media</Typography>
                  <CloudinaryUpload
                    onUpload={(url, type) => handleMediaUpload(index, url, type)}
                    onRemove={(mediaIndex) => handleMediaRemove(index, mediaIndex)}
                    initialImages={card.media.map(media => media.url)}
                  />
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="h6" color="primary.contrastText" fontWeight="bold">CTA Buttons</Typography>
                  {card.ctaButtons.map((cta, ctaIndex) => (
                    <Grid container spacing={2} key={ctaIndex} sx={{ alignItems: 'center', mt: 1 }}>
                      <Grid item xs={12} md={5.5}>
                        <TextField
                          fullWidth
                          label="Button Text"
                          name="text"
                          value={cta.text}
                          onChange={(e) => handleCtaChange(index, ctaIndex, e)}
                          sx={{ bgcolor: '#f8f9fa', borderRadius: 2 }}
                        />
                      </Grid>
                      <Grid item xs={12} md={5.5}>
                        <TextField
                          fullWidth
                          label="Button Link"
                          name="link"
                          value={cta.link}
                          onChange={(e) => handleCtaChange(index, ctaIndex, e)}
                          sx={{ bgcolor: '#f8f9fa', borderRadius: 2 }}
                        />
                      </Grid>
                      <Grid item xs={12} md={1}>
                        <IconButton color="error" onClick={() => removeCtaButton(index, ctaIndex)}>
                          <RemoveCircleOutlineIcon color="error.main" />
                        </IconButton>
                      </Grid>
                    </Grid>
                  ))}
                  <Button variant="contained" color="primary" onClick={() => addCtaButton(index)} sx={{ mt: 2 }}>
                    Add CTA Button
                  </Button>
                </Grid>
              </Grid>
            </Paper>
          ))}
        </Paper>

        <Paper sx={{ p: 3, mb: 4, borderRadius: 2, boxShadow: 2 }}>
          <Typography variant="h6" sx={{ mb: 3, color: 'primary.contrastText', fontWeight: 600 }}>Scheduling</Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Start Date"
                type="date"
                name="scheduling.startDate"
                value={formData.scheduling.startDate}
                onChange={handleChange}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="End Date"
                type="date"
                name="scheduling.endDate"
                value={formData.scheduling.endDate}
                onChange={handleChange}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControlLabel
                control={<Checkbox name="scheduling.showOnlyOnce" checked={formData.scheduling.showOnlyOnce} onChange={handleCheckboxChange} />}
                label="Show Only Once"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Frequency</InputLabel>
                <Select name="scheduling.frequency" value={formData.scheduling.frequency} onChange={handleChange}>
                  <MenuItem value="once">Once</MenuItem>
                  <MenuItem value="daily">Daily</MenuItem>
                  <MenuItem value="weekly">Weekly</MenuItem>
                  <MenuItem value="monthly">Monthly</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Days of Week</InputLabel>
                <Select
                  name="scheduling.daysOfWeek"
                  multiple
                  value={formData.scheduling.daysOfWeek}
                  onChange={(e) => setFormData({ ...formData, scheduling: { ...formData.scheduling, daysOfWeek: e.target.value } })}
                  renderValue={(selected) => selected.join(', ')}
                >
                  <MenuItem value={0}>Sunday</MenuItem>
                  <MenuItem value={1}>Monday</MenuItem>
                  <MenuItem value={2}>Tuesday</MenuItem>
                  <MenuItem value={3}>Wednesday</MenuItem>
                  <MenuItem value={4}>Thursday</MenuItem>
                  <MenuItem value={5}>Friday</MenuItem>
                  <MenuItem value={6}>Saturday</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Time of Day Start"
                type="time"
                name="scheduling.timeOfDay.start"
                value={formData.scheduling.timeOfDay.start}
                onChange={handleChange}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Time of Day End"
                type="time"
                name="scheduling.timeOfDay.end"
                value={formData.scheduling.timeOfDay.end}
                onChange={handleChange}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
          </Grid>
        </Paper>

        <Paper sx={{ p: 3, mb: 4, borderRadius: 2, boxShadow: 2 }}>
          <Typography variant="h6" sx={{ mb: 3, color: 'primary.contrastText', fontWeight: 600 }}>Targeting</Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>User Roles</InputLabel>
                <Select
                  name="targeting.userRoles"
                  multiple
                  value={formData.targeting.userRoles}
                  onChange={(e) => setFormData({ ...formData, targeting: { ...formData.targeting, userRoles: e.target.value } })}
                  renderValue={(selected) => selected.join(', ')}
                >
                  <MenuItem value="member">Member</MenuItem>
                  <MenuItem value="distributor">Distributor</MenuItem>
                  <MenuItem value="admin">Admin</MenuItem>
                  <MenuItem value="all">All</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControlLabel
                control={<Checkbox name="isActive" checked={formData.isActive} onChange={handleCheckboxChange} />}
                label="Is Active"
              />
            </Grid>
          </Grid>
        </Paper>

        <Box sx={{ 
          display: 'flex', 
          gap: 2, 
          justifyContent: 'center',
          mt: 4 
        }}>
          <Button 
            type="submit" 
            variant="contained" 
            color="primary"
            size="large"
            sx={{ 
              minWidth: 150,
              borderRadius: 2,
              textTransform: 'none',
              '&:hover': {
                backgroundColor: 'transparent',
                color: 'primary.contrastText',
                border: '1px solid',
                borderColor: 'primary.contrastText',
              }
            }}
          >
            {isEditing ? 'Update Content' : 'Create Content'}
          </Button>
          <Button
            variant="contained"
            color="primary.contrastText"
            size="large"
            onClick={() => setPreviewOpen(true)}
            startIcon={<VisibilityIcon color="primary.contrastText" />}
            sx={{ 
              minWidth: 150,
              borderRadius: 2,
              color: 'primary.contrastText',
              border: '1px solid',
              borderColor: 'primary.contrastText',
              textTransform: 'none',
              '&:hover': {
                backgroundColor: 'primary.main',
                border:'none'
              }
            }}
          >
            Preview
          </Button>
        </Box>
      </form>

      <Dialog 
        open={previewOpen} 
        onClose={() => setPreviewOpen(false)}
        maxWidth="xl"
        fullWidth
      >
        <DialogContent>
          <DisplaySplashContent 
            content={[formData]}
            preview={true}
            onClose={() => setPreviewOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default CreateSplashContent;