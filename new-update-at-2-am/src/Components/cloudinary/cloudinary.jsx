import React, { useState, useEffect } from "react";
import { Box, Button, Typography, Paper, Grid, Card, CardMedia, CardActions, IconButton, CircularProgress, Dialog, DialogContent, Stack, Alert } from "@mui/material";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import DeleteIcon from "@mui/icons-material/Delete";
import VisibilityIcon from "@mui/icons-material/Visibility";
import MovieIcon from "@mui/icons-material/Movie";
import ImageIcon from "@mui/icons-material/Image";
import { useDropzone } from "react-dropzone";
import axios from "axios";
import CloseIcon from "@mui/icons-material/Close";

const CloudinaryUpload = ({ onUpload, onRemove, initialImages = [], disabled = false }) => {
  const [media, setMedia] = useState([]);
  const [previewItem, setPreviewItem] = useState(null);
  const [uploadError, setUploadError] = useState(null);

  useEffect(() => {
    const formattedMedia = initialImages.map(url => ({
      name: url,
      preview: url,
      progress: 100,
      url: url,
      type: url.match(/\.(mp4|webm|ogg)$/i) ? 'video' : 'image'
    }));
    setMedia(formattedMedia);
  }, [initialImages]);

  const handleUpload = async (file) => {
    if (disabled) return;
    
    setUploadError(null);
    const previewUrl = URL.createObjectURL(file);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", process.env.REACT_APP_CLOUDINARY_UPLOAD_PRESET);

    const resourceType = file.type.startsWith('video/') ? 'video' : 'image';
    const fileId = Date.now() + '_' + file.name; // Create unique ID for tracking
    const fileData = { 
      id: fileId,
      name: file.name, 
      preview: previewUrl, 
      progress: 0, 
      url: null,
      type: resourceType,
      error: null,
      uploading: true
    };
    
    // Add to media list immediately to show progress
    setMedia(prev => [...prev, fileData]);

    try {
      console.log(`Starting upload for ${file.name} (${resourceType})`);
      const cloudName = process.env.REACT_APP_CLOUDINARY_NAME;
      if (!cloudName) {
        throw new Error("Cloudinary configuration missing. Please check your environment variables.");
      }
      
      const response = await axios.post(
        `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`,
        formData,
        {
          onUploadProgress: (progressEvent) => {
            const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setMedia(prev =>
              prev.map(f => (f.id === fileId ? { ...f, progress: percent } : f))
            );
          },
        }
      );

      // Update the file with the uploaded URL
      setMedia(prev =>
        prev.map(f =>
          f.id === fileId ? { 
            ...f, 
            progress: 100, 
            url: response.data.secure_url,
            uploading: false 
          } : f
        )
      );

      console.log(`Upload complete for ${file.name}, URL: ${response.data.secure_url}`);
      onUpload(response.data.secure_url, resourceType);
    } catch (error) {
      console.error(`Error uploading ${file.name}:`, error);
      
      // Update the file with error status but keep it visible
      setMedia(prev => 
        prev.map(f => 
          f.id === fileId ? { 
            ...f, 
            error: error.message || "Upload failed", 
            uploading: false 
          } : f
        )
      );
      
      setUploadError(`Failed to upload ${file.name}: ${error.message || "Unknown error"}`);
    }
  };

  const handleRemove = (indexToRemove) => {
    if (disabled) return;
    
    const mediaToRemove = media[indexToRemove];
    
    // Only call onRemove if it was a successfully uploaded file
    if (mediaToRemove.url && onRemove) {
      onRemove(indexToRemove);
    }
    
    setMedia(prev => prev.filter((_, index) => index !== indexToRemove));
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: (acceptedFiles) => {
      if (disabled) return;
      acceptedFiles.forEach((file) => handleUpload(file));
    },
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif'],
      'video/*': ['.mp4', '.webm', '.ogg']
    },
    multiple: true,
    disabled
  });

  const PreviewDialog = () => {
    if (!previewItem) return null;
    
    return (
      <Dialog 
        open={Boolean(previewItem)} 
        onClose={() => setPreviewItem(null)}
        maxWidth="lg"
        fullWidth
      >
        <DialogContent sx={{ p: 0, backgroundColor: 'black', position: 'relative' }}>
          <IconButton
            onClick={() => setPreviewItem(null)}
            sx={{
              position: 'absolute',
              right: 8,
              top: 8,
              color: 'white',
              backgroundColor: 'rgba(0,0,0,0.5)',
              '&:hover': { backgroundColor: 'rgba(0,0,0,0.7)' },
              zIndex: 1
            }}
          >
            <CloseIcon />
          </IconButton>
          {previewItem.type === 'video' ? (
            <Box sx={{ width: '100%', height: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <video
                src={previewItem.url || previewItem.preview}
                controls
                style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                autoPlay
              />
            </Box>
          ) : (
            <Box sx={{ width: '100%', height: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <img
                src={previewItem.url || previewItem.preview}
                alt={previewItem.name || 'Preview'}
                style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
              />
            </Box>
          )}
        </DialogContent>
      </Dialog>
    );
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Drag & Drop Upload Box */}
      <Paper
        {...getRootProps()}
        sx={{
          p: 4,
          textAlign: "center",
          border: "2px dashed #1976d2",
          borderRadius: 3,
          bgcolor: isDragActive ? "action.hover" : "background.paper",
          cursor: disabled ? "not-allowed" : "pointer",
          opacity: disabled ? 0.7 : 1,
          transition: 'all 0.3s ease',
          '&:hover': !disabled ? {
            backgroundColor: 'rgba(25, 118, 210, 0.04)',
            borderColor: '#1976d2'
          } : {}
        }}
      >
        <input {...getInputProps()} disabled={disabled} />
        <CloudUploadIcon color="primary" sx={{ fontSize: 60 }} />
        <Typography variant="h6" sx={{ mt: 2 }}>
          {isDragActive ? "Drop the files here..." : 
            disabled ? "Upload disabled during active upload" : "Drag & Drop images or videos"}
        </Typography>
        <Stack direction="row" spacing={1} justifyContent="center" sx={{ mt: 2 }}>
          <Button variant="contained" startIcon={<ImageIcon />} disabled={disabled}>
            Select Images
          </Button>
          <Button variant="contained" startIcon={<MovieIcon />} disabled={disabled}>
            Select Videos
          </Button>
        </Stack>
        <Typography variant="caption" sx={{ display: 'block', mt: 2, color: 'text.secondary' }}>
          Supported formats: JPG, PNG, GIF, MP4, WEBM, OGG
        </Typography>
      </Paper>

      {uploadError && (
        <Alert severity="error" sx={{ mt: 2, mb: 0 }} onClose={() => setUploadError(null)}>
          {uploadError}
        </Alert>
      )}

      {/* Uploaded Media Display */}
      <Grid container spacing={2} sx={{ mt: 3 }}>
        {media.map((file, index) => (
          <Grid item xs={12} sm={6} md={4} key={file.id || index}>
            <Card sx={{ 
              borderRadius: 2, 
              boxShadow: 3,
              transition: 'transform 0.3s ease',
              '&:hover': {
                transform: 'translateY(-4px)'
              },
              border: file.error ? '1px solid #f44336' : undefined
            }}>
              <Box sx={{ position: 'relative', paddingTop: '56.25%' }}>
                {file.type === 'video' ? (
                  <video
                    src={file.url || file.preview}
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover'
                    }}
                    onError={(e) => {
                      console.error('Error loading video:', e);
                      e.target.style.display = 'none';
                    }}
                  />
                ) : (
                  <CardMedia
                    component="img"
                    image={file.url || file.preview}
                    alt={file.name || 'Media preview'}
                    sx={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover'
                    }}
                    onError={(e) => {
                      console.error('Error loading image:', e);
                      e.target.src = 'https://via.placeholder.com/300?text=Preview+not+available';
                    }}
                  />
                )}
                {file.type === 'video' && (
                  <Box
                    sx={{
                      position: 'absolute',
                      top: 8,
                      left: 8,
                      backgroundColor: 'rgba(0,0,0,0.5)',
                      color: 'white',
                      padding: '4px 8px',
                      borderRadius: 1,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 0.5
                    }}
                  >
                    <MovieIcon fontSize="small" />
                    <Typography variant="caption">Video</Typography>
                  </Box>
                )}
                
                {file.error && (
                  <Box
                    sx={{
                      position: 'absolute',
                      bottom: 0,
                      left: 0,
                      right: 0,
                      backgroundColor: 'rgba(244, 67, 54, 0.8)',
                      color: 'white',
                      padding: '4px 8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <Typography variant="caption">Upload Failed</Typography>
                  </Box>
                )}
              </Box>
              <CardActions sx={{ justifyContent: "space-between", p: 1 }}>
                {file.uploading && file.progress < 100 ? (
                  <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                    <CircularProgress size={24} sx={{ mr: 1 }} />
                    <Typography variant="caption">{file.progress}%</Typography>
                  </Box>
                ) : (
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <IconButton 
                      onClick={() => !disabled && setPreviewItem(file)} 
                      color="primary"
                      size="small"
                      disabled={disabled}
                    >
                      <VisibilityIcon />
                    </IconButton>
                    <IconButton 
                      onClick={() => handleRemove(index)} 
                      color="error"
                      size="small"
                      disabled={disabled}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                )}
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>

      <PreviewDialog />
    </Box>
  );
};

export default CloudinaryUpload;
