import React, { useState, useEffect } from 'react';
import { 
  Button, 
  TextField, 
  Select, 
  MenuItem, 
  InputLabel, 
  FormControl, 
  Box, 
  Typography, 
  Grid, 
  Paper,
  Chip,
  Autocomplete,
  FormHelperText,
  Divider,
  Switch,
  FormControlLabel
} from '@mui/material';
import { styled } from '@mui/material/styles';

// Updated styled components
const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(2),
  borderRadius: theme.spacing(1),
  boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)',
  backgroundColor: '#ffffff',
  maxWidth: '800px',
  margin: '0 auto'
}));

const StyledFormControl = styled(FormControl)(({ theme }) => ({
  '& .MuiOutlinedInput-root': {
    borderRadius: theme.spacing(1),
    height: '40px',
    '&:hover fieldset': {
      borderColor: theme.palette.primary.main,
    },
  },
  '& .MuiInputLabel-root': {
    transform: 'translate(14px, 8px) scale(1)',
  },
  '& .MuiInputLabel-shrink': {
    transform: 'translate(14px, -9px) scale(0.75)',
  },
}));

const StyledTextField = styled(TextField)(({ theme }) => ({
  '& .MuiOutlinedInput-root': {
    borderRadius: theme.spacing(1),
    '&:not(.MuiInputBase-multiline)': {
      height: '40px',
    },
  },
  '& .MuiInputLabel-root': {
    transform: 'translate(14px, 8px) scale(1)',
  },
  '& .MuiInputLabel-shrink': {
    transform: 'translate(14px, -9px) scale(0.75)',
  },
}));

const StyledSelect = styled(Select)(({ theme }) => ({
  '& .MuiPaper-root': {
    maxHeight: '32px * 4', // Height of 4 items
  },
  '& .MuiMenu-paper': {
    maxHeight: '32px * 4',
  },
  '& .MuiMenuItem-root': {
    height: '32px',
    minHeight: '32px',
    padding: '4px 16px',
    '&:hover': {
      backgroundColor: theme.palette.action.hover,
    },
  },
}));

const AddAnnouncement = ({ onClose, onAdd, initialData }) => {
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    category: 'General',
    priority: 'Medium',
    event: '',
    startTime: '',
    endTime: '',
    tags: [],
    isActive: true,
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (initialData) {
      setFormData({
        ...initialData,
        startTime: new Date(initialData.startTime).toISOString().slice(0, 16),
        endTime: new Date(initialData.endTime).toISOString().slice(0, 16),
        tags: initialData.tags || [],
      });
    }
  }, [initialData]);

  const eventOptions = [
    'login',
    'signup',
    'admin_dashboard',
    'distributor_dashboard',
    'procurement_dashboard',
    'deal_management',
    'user_management',
    'analytics',
    'profile',
    'orders',
    'suppliers',
    'splash_content',
    'announcements',
    'logs'
  ];

  const validateForm = () => {
    const newErrors = {};
    if (!formData.title.trim()) newErrors.title = 'Title is required';
    if (!formData.content.trim()) newErrors.content = 'Content is required';
    if (!formData.startTime) newErrors.startTime = 'Start time is required';
    if (!formData.endTime) newErrors.endTime = 'End time is required';
    if (new Date(formData.endTime) <= new Date(formData.startTime)) {
      newErrors.endTime = 'End time must be after start time';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (validateForm()) {
      try {
        await onAdd(formData);
        onClose();
      } catch (error) {
        console.error('Error submitting announcement:', error);
      }
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when field is modified
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  return (
    <StyledPaper>
      <Box component="form" onSubmit={handleSubmit} sx={{ width: '100%' }}>
        <Grid container spacing={2}>
          {/* Title Field */}
          <Grid item xs={12}>
            <StyledTextField
              label="Title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
              fullWidth
              error={!!errors.title}
              helperText={errors.title}
              size="small"
            />
          </Grid>

          {/* Content Field */}
          <Grid item xs={12}>
            <StyledTextField
              label="Content"
              name="content"
              value={formData.content}
              onChange={handleChange}
              required
              fullWidth
              multiline
              rows={3}
              error={!!errors.content}
              helperText={errors.content}
              size="small"
            />
          </Grid>

          {/* Category and Priority */}
          <Grid item xs={12} sm={6}>
            <StyledFormControl fullWidth size="small">
              <InputLabel>Category</InputLabel>
              <StyledSelect
                name="category"
                value={formData.category}
                onChange={handleChange}
                label="Category"
                MenuProps={{
                  PaperProps: {
                    style: {
                      maxHeight: 32 * 4.5,
                      marginTop: 8,
                    },
                  },
                }}
              >
                <MenuItem value="General">
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: 'info.main' }} />
                    General
                  </Box>
                </MenuItem>
                <MenuItem value="Event">
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: 'warning.main' }} />
                    Event
                  </Box>
                </MenuItem>
                <MenuItem value="Update">
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: 'success.main' }} />
                    Update
                  </Box>
                </MenuItem>
              </StyledSelect>
            </StyledFormControl>
          </Grid>

          <Grid item xs={12} sm={6}>
            <StyledFormControl fullWidth size="small">
              <InputLabel>Priority</InputLabel>
              <StyledSelect
                name="priority"
                value={formData.priority}
                onChange={handleChange}
                label="Priority"
                MenuProps={{
                  PaperProps: {
                    style: {
                      maxHeight: 32 * 4.5,
                      marginTop: 8,
                    },
                  },
                }}
              >
                <MenuItem value="Low">
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'success.main' }} />
                    Low
                  </Box>
                </MenuItem>
                <MenuItem value="Medium">
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'warning.main' }} />
                    Medium
                  </Box>
                </MenuItem>
                <MenuItem value="High">
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'error.main' }} />
                    High
                  </Box>
                </MenuItem>
              </StyledSelect>
            </StyledFormControl>
          </Grid>

          {/* Event Selection */}
          <Grid item xs={12}>
            <StyledFormControl fullWidth size="small">
              <InputLabel>Event</InputLabel>
              <StyledSelect
                name="event"
                value={formData.event}
                onChange={handleChange}
                label="Event"
                MenuProps={{
                  PaperProps: {
                    style: {
                      maxHeight: 32 * 4.5,
                      marginTop: 8,
                    },
                  },
                }}
              >
                {eventOptions.map((option) => (
                  <MenuItem 
                    key={option} 
                    value={option}
                    sx={{
                      height: '32px',
                      minHeight: '32px',
                      fontSize: '0.875rem',
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box 
                        sx={{ 
                          width: 6, 
                          height: 6, 
                          borderRadius: '50%', 
                          bgcolor: option === formData.event ? 'primary.main' : 'text.disabled' 
                        }} 
                      />
                      {option.split('_').map(word => 
                        word.charAt(0).toUpperCase() + word.slice(1)
                      ).join(' ')}
                    </Box>
                  </MenuItem>
                ))}
              </StyledSelect>
              <FormHelperText>Display location</FormHelperText>
            </StyledFormControl>
          </Grid>

          {/* Tags */}
          <Grid item xs={12}>
            <Autocomplete
              multiple
              freeSolo
              size="small"
              value={formData.tags}
              onChange={(event, newValue) => {
                setFormData(prev => ({ ...prev, tags: newValue }));
              }}
              options={[]}
              renderTags={(value, getTagProps) =>
                value.map((option, index) => (
                  <Chip
                    size="small"
                    label={option}
                    {...getTagProps({ index })}
                    color="primary"
                    variant="outlined"
                  />
                ))
              }
              renderInput={(params) => (
                <StyledTextField
                  {...params}
                  label="Tags"
                  placeholder="Add tags"
                  helperText="Press enter to add tags"
                  size="small"
                />
              )}
            />
          </Grid>

          {/* Date and Time Fields */}
          <Grid item xs={12} sm={6}>
            <StyledTextField
              label="Start Time"
              type="datetime-local"
              name="startTime"
              value={formData.startTime}
              onChange={handleChange}
              required
              fullWidth
              error={!!errors.startTime}
              helperText={errors.startTime}
              InputLabelProps={{ shrink: true }}
              size="small"
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <StyledTextField
              label="End Time"
              type="datetime-local"
              name="endTime"
              value={formData.endTime}
              onChange={handleChange}
              required
              fullWidth
              error={!!errors.endTime}
              helperText={errors.endTime}
              InputLabelProps={{ shrink: true }}
              size="small"
            />
          </Grid>

          {/* Active Status */}
          <Grid item xs={12}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.isActive}
                    onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                    color="primary"
                    size="small"
                  />
                }
                label={
                  <Typography variant="body2" color="textSecondary">
                    Active
                  </Typography>
                }
              />
              <Typography variant="caption" color="textSecondary">
                Toggle to set the announcement status
              </Typography>
            </Box>
          </Grid>

          {/* Submit Button */}
          <Grid item xs={12}>
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
              <Button 
                type="submit" 
                variant="contained" 
                color="primary"
                size="small"
                sx={{
                  minWidth: 100,
                  height: '32px',
                  borderRadius: 1,
                  textTransform: 'none',
                  '&:hover': {
                    backgroundColor: 'primary.dark',
                  }
                }}
              >
                {initialData ? 'Save Changes' : 'Create'}
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Box>
    </StyledPaper>
  );
};

export default AddAnnouncement;
