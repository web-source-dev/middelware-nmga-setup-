import React, { useState } from 'react';
import { 
  Box, 
  Button, 
  Typography, 
  Grid, 
  Card, 
  CardMedia, 
  CardActions, 
  IconButton,
  Dialog,
  DialogContent,
  DialogTitle,
  Divider,
  Chip,
  Paper
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddPhotoAlternateIcon from '@mui/icons-material/AddPhotoAlternate';
import CloseIcon from '@mui/icons-material/Close';
import ImageIcon from '@mui/icons-material/Image';
import MovieIcon from '@mui/icons-material/Movie';
import VisibilityIcon from '@mui/icons-material/Visibility';
import MediaSelectorWrapper from './MediaSelectorWrapper';

/**
 * MediaSelector component for selecting media from MediaManager
 * @param {Object} props Component props
 * @param {Array} props.selectedMedia Array of selected media URLs
 * @param {Function} props.onSelect Callback when media is selected (receives media URL)
 * @param {Function} props.onRemove Callback when media is removed (receives index)
 */
const MediaSelector = ({ selectedMedia = [], onSelect, onRemove }) => {
  const [open, setOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  
  const handleOpen = () => {
    setOpen(true);
  };
  
  const handleClose = () => {
    setOpen(false);
  };

  const handlePreviewOpen = (url) => {
    setPreviewUrl(url);
    setPreviewOpen(true);
  };

  const handlePreviewClose = () => {
    setPreviewOpen(false);
  };

  // Used to determine if the media is an image or video
  const getMediaType = (url) => {
    const videoExtensions = ['.mp4', '.webm', '.ogg', '.mov'];
    return videoExtensions.some(ext => url.toLowerCase().includes(ext)) ? 'video' : 'image';
  };
  
  // Handle media selection from the MediaManager
  const handleMediaSelect = (media) => {
    if (media && media.url) {
      // If the onSelect expects just the URL (backward compatibility)
      if (onSelect.length <= 1) {
        onSelect(media.url);
      } else {
        // If onSelect can handle more metadata
        onSelect(media);
      }
      handleClose();
    }
  };
  
  return (
    <Box sx={{ width: '100%' }}>
      {/* Full-width Add Media Button at the top */}
      <Paper 
        elevation={0} 
        variant="outlined" 
        sx={{ 
          mb: 3, 
          borderRadius: 2,
          overflow: 'hidden',
          borderStyle: 'dashed',
          borderWidth: 2,
          borderColor: 'primary.light'
        }}
      >
        <Button
          onClick={handleOpen}
          fullWidth
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            p: 3,
            transition: 'all 0.2s ease-in-out',
            bgcolor: 'rgba(0, 0, 0, 0.02)',
            '&:hover': {
              bgcolor: 'rgba(0, 0, 0, 0.04)',
            }
          }}
        >
          <AddPhotoAlternateIcon sx={{ fontSize: 48, color: 'primary.contrastText', mb: 1 }} />
          <Typography variant="h6" color="primary.contrastText" sx={{ fontWeight: 'medium' }}>
            Add Media From Library
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Upload or select existing images and videos
          </Typography>
        </Button>
      </Paper>
      
      {/* Selected Media Section Title */}
      {selectedMedia.length > 0 && (
        <Box sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
          <Typography variant="subtitle1" fontWeight="bold">
            Selected Media ({selectedMedia.length})
          </Typography>
          <Divider sx={{ flexGrow: 1, ml: 2 }} />
        </Box>
      )}
      
      {/* Display selected media below the button */}
      <Grid container spacing={2}>
        {selectedMedia.map((url, index) => (
          <Grid item xs={12} sm={6} md={4} lg={3} key={index}>
            <Card 
              variant="outlined" 
              sx={{ 
                position: 'relative',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                borderRadius: 2,
                overflow: 'hidden',
                transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: '0 8px 16px rgba(0,0,0,0.1)'
                } 
              }}
            >
              <Box sx={{ position: 'relative', paddingTop: '75%' }}>
                {getMediaType(url) === 'image' ? (
                  <CardMedia
                    component="img"
                    image={url}
                    alt={`Selected media ${index + 1}`}
                    sx={{ 
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover'
                    }}
                  />
                ) : (
                  <Box
                    sx={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      bgcolor: 'rgba(0,0,0,0.1)'
                    }}
                  >
                    <video
                      src={url}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover'
                      }}
                    />
                  </Box>
                )}
                
                <Chip
                  icon={getMediaType(url) === 'image' ? <ImageIcon /> : <MovieIcon />}
                  label={getMediaType(url) === 'image' ? 'Image' : 'Video'}
                  size="small"
                  sx={{
                    position: 'absolute',
                    top: 8,
                    left: 8,
                    fontSize: '0.7rem',
                    height: 24,
                    backgroundColor: 'rgba(255, 255, 255, 0.9)',
                    backdropFilter: 'blur(4px)',
                    '& .MuiChip-icon': {
                      color: getMediaType(url) === 'image' ? 'primary.contrastText' : 'error.main'
                    }
                  }}
                />
              </Box>
              
              <CardActions sx={{ 
                p: 1, 
                justifyContent: 'space-between', 
                mt: 'auto',
                bgcolor: 'background.paper'
              }}>
                <IconButton 
                  size="small" 
                  color="primary.contrastText" 
                  onClick={() => handlePreviewOpen(url)}
                  aria-label="view"
                  sx={{ 
                    borderRadius: 1,
                    '&:hover': { bgcolor: 'primary.50' } 
                  }}
                >
                  <VisibilityIcon fontSize="small" />
                </IconButton>
                
                <IconButton 
                  size="small" 
                  color="error" 
                  onClick={() => onRemove(index)}
                  aria-label="delete"
                  sx={{ 
                    borderRadius: 1,
                    '&:hover': { bgcolor: 'error.50' } 
                  }}
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>
      
      {/* Media Manager Dialog */}
      <Dialog 
        open={open} 
        onClose={handleClose}
        maxWidth="xl"
        fullWidth
        PaperProps={{
          sx: { borderRadius: 2, height: '90vh' }
        }}
      >
        <DialogTitle sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          p: 2
        }}>
          <Typography variant="h6">Select Media</Typography>
          <IconButton onClick={handleClose} size="small">
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        
        <Divider />
        
        <DialogContent sx={{ p: 0 }}>
          <MediaSelectorWrapper 
            onMediaSelect={handleMediaSelect} 
            onCancel={handleClose} 
          />
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog
        open={previewOpen}
        onClose={handlePreviewClose}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: { borderRadius: 2, overflow: 'hidden' }
        }}
      >
        <DialogTitle sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          bgcolor: 'background.paper',
          p: 2
        }}>
          <Typography variant="h6">Media Preview</Typography>
          <IconButton onClick={handlePreviewClose} size="small">
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        
        <DialogContent sx={{ p: 0, display: 'flex', justifyContent: 'center', alignItems: 'center', bgcolor: '#000' }}>
          {previewUrl && getMediaType(previewUrl) === 'image' ? (
            <img 
              src={previewUrl} 
              alt="Preview" 
              style={{ 
                maxWidth: '100%', 
                maxHeight: '70vh',
                objectFit: 'contain'
              }} 
            />
          ) : previewUrl ? (
            <video 
              src={previewUrl} 
              controls 
              autoPlay 
              style={{ 
                maxWidth: '100%', 
                maxHeight: '70vh' 
              }} 
            />
          ) : null}
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default MediaSelector; 