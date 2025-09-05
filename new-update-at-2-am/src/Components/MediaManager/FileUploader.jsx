import React, { useState, useRef, useEffect } from "react";
import {
  Box,
  Typography,
  Button,
  IconButton,
  Grid,
  Card,
  CardMedia,
  CardContent,
  CardActions,
  Chip,
  LinearProgress,
  CircularProgress,
  Alert,
  Paper,
  Stack,
  Tooltip
} from "@mui/material";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import DeleteIcon from "@mui/icons-material/Delete";
import ImageIcon from "@mui/icons-material/Image";
import MovieIcon from "@mui/icons-material/Movie";
import DescriptionIcon from "@mui/icons-material/Description";
import InsertDriveFileIcon from "@mui/icons-material/InsertDriveFile";
import AddIcon from "@mui/icons-material/Add";
import { useSnackbar } from "notistack";

const FileUploader = ({ onUpload, onRemove, initialImages = [], disabled = false }) => {
  const { enqueueSnackbar } = useSnackbar();
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({});
  const [errors, setErrors] = useState({});
  const fileInputRef = useRef(null);
  
  // Cloudinary configuration
  const cloudName = process.env.REACT_APP_CLOUDINARY_NAME;
  const uploadPreset = process.env.REACT_APP_CLOUDINARY_UPLOAD_PRESET || "ml_default";
  
  // Drag and drop state
  const [isDragging, setIsDragging] = useState(false);
  
  useEffect(() => {
    // Initialize with any initial images
    if (initialImages && initialImages.length > 0) {
      setFiles(initialImages.map(img => ({
        id: img.id || `initial-${Math.random().toString(36).substr(2, 9)}`,
        name: img.name || "Initial file",
        preview: img.url,
        uploaded: true,
        url: img.url,
        type: getFileType(img.url)
      })));
    }
  }, [initialImages]);
  
  // Handle drag events
  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (disabled || uploading) return;
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (disabled || uploading) return;
    e.dataTransfer.dropEffect = 'copy';
    setIsDragging(true);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    if (disabled || uploading) return;
    
    const droppedFiles = Array.from(e.dataTransfer.files);
    processFiles(droppedFiles);
  };
  
  const getFileType = (filename) => {
    if (!filename) return "other";
    
    const extension = filename.split('.').pop().toLowerCase();
    
    const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp'];
    const videoExtensions = ['mp4', 'webm', 'ogg', 'mov', 'avi', 'wmv', 'flv', 'mkv'];
    const documentExtensions = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt', 'csv'];
    
    if (imageExtensions.includes(extension)) return "image";
    if (videoExtensions.includes(extension)) return "video";
    if (documentExtensions.includes(extension)) return "document";
    
    return "other";
  };
  
  const processFiles = (selectedFiles) => {
    // Process each file
    const newFiles = selectedFiles.map(file => {
      // Create a unique ID for this file
      const fileId = `file-${Math.random().toString(36).substr(2, 9)}`;
      
      // Create an object URL for preview
      const preview = URL.createObjectURL(file);
      
      const fileType = file.type.split('/')[0];
      const type = fileType === 'image' ? 'image' : 
                 fileType === 'video' ? 'video' : 
                 fileType === 'application' ? 'document' : 'other';
      
      return {
        id: fileId,
        file,
        name: file.name,
        preview,
        size: file.size,
        type,
        uploaded: false
      };
    });
    
    // Add new files to state
    setFiles(prev => [...prev, ...newFiles]);
    
    // Automatically start uploading new files
    uploadFiles(newFiles);
  };
  
  const handleFileSelect = (event) => {
    if (disabled) return;
    
    const selectedFiles = Array.from(event.target.files);
    processFiles(selectedFiles);
    
    // Reset the file input
    event.target.value = null;
  };
  
  const uploadFile = async (file) => {
    if (!cloudName) {
      console.error("Cloudinary cloud name is not configured");
      setErrors(prev => ({
        ...prev,
        [file.id]: "Cloud configuration missing"
      }));
      return null;
    }
    
    const formData = new FormData();
    formData.append('file', file.file);
    formData.append('upload_preset', uploadPreset);
    
    try {
      // Create upload URL
      const uploadUrl = `https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`;
      
      // Use fetch with progress tracking
      const xhr = new XMLHttpRequest();
      
      const promise = new Promise((resolve, reject) => {
        xhr.open('POST', uploadUrl);
        
        // Track upload progress
        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            const progress = Math.round((event.loaded / event.total) * 100);
            setUploadProgress(prev => ({
              ...prev,
              [file.id]: progress
            }));
          }
        };
        
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            const response = JSON.parse(xhr.responseText);
            resolve(response);
          } else {
            reject(new Error(`Upload failed with status: ${xhr.status}`));
          }
        };
        
        xhr.onerror = () => reject(new Error('Network error during upload'));
        
        xhr.send(formData);
      });
      
      const response = await promise;
      
      // Clear the progress once upload is complete
      setUploadProgress(prev => {
        const updated = { ...prev };
        delete updated[file.id];
        return updated;
      });
      
      // Return the Cloudinary response
      return {
        url: response.secure_url,
        publicId: response.public_id,
        type: file.type,
        size: response.bytes,
        width: response.width,
        height: response.height,
        format: response.format
      };
    } catch (error) {
      console.error(`Error uploading file ${file.name}:`, error);
      setErrors(prev => ({
        ...prev,
        [file.id]: error.message || "Upload failed"
      }));
      return null;
    }
  };
  
  const uploadFiles = async (filesToUpload) => {
    if (!filesToUpload || filesToUpload.length === 0) {
      return;
    }
    
    setUploading(true);
    
    // Upload each file
    for (const file of filesToUpload) {
      // Set initial progress for this file
      setUploadProgress(prev => ({
        ...prev,
        [file.id]: 0
      }));
      
      const result = await uploadFile(file);
      
      if (result) {
        // Update the file in our state
        setFiles(prev => prev.map(f => 
          f.id === file.id ? {
            ...f,
            uploaded: true,
            url: result.url,
            ...result
          } : f
        ));
        
        // Call the onUpload callback with the result
        onUpload(result.url, file.type);
        
        enqueueSnackbar(`Uploaded: ${file.name}`, { variant: "success" });
      }
    }
    
    setUploading(false);
  };
  
  const handleRemoveFile = (fileId) => {
    if (disabled) return;
    
    // Find the file to be removed
    const fileToRemove = files.find(file => file.id === fileId);
    
    // If the file has been uploaded, call the onRemove callback
    if (fileToRemove && fileToRemove.uploaded) {
      const index = files.findIndex(file => file.id === fileId);
      if (index !== -1) {
        onRemove(index);
      }
    }
    
    // Remove from our state
    setFiles(prev => prev.filter(file => file.id !== fileId));
    
    // Clear any errors/progress for this file
    setErrors(prev => {
      const updated = { ...prev };
      delete updated[fileId];
      return updated;
    });
    
    setUploadProgress(prev => {
      const updated = { ...prev };
      delete updated[fileId];
      return updated;
    });
  };
  
  const getFileTypeIcon = (type) => {
    switch (type) {
      case "image":
        return <ImageIcon color="success" />;
      case "video":
        return <MovieIcon color="error" />;
      case "document":
        return <DescriptionIcon color="warning" />;
      default:
        return <InsertDriveFileIcon color="action" />;
    }
  };
  
  const formatFileSize = (bytes) => {
    if (!bytes) return "Unknown";
    
    const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
    if (bytes === 0) return "0 Bytes";
    
    const i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)), 10);
    if (i === 0) return `${bytes} ${sizes[i]}`;
    
    return `${(bytes / (1024 ** i)).toFixed(1)} ${sizes[i]}`;
  };
  
  return (
    <Box sx={{ width: '100%' }}>
      {/* File Upload Area */}
      <Paper 
        elevation={0} 
        sx={{ 
          p: { xs: 1, sm: 2 }, 
          mb: 2, 
          border: `2px dashed ${isDragging ? 'primary.contrastText' : 'rgba(0, 0, 0, 0.1)'}`,
          backgroundColor: isDragging ? 'rgba(25, 118, 210, 0.04)' : 'rgba(0, 0, 0, 0.01)',
          borderRadius: 2,
          textAlign: 'center',
          transition: 'all 0.2s ease-in-out'
        }}
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={handleFileSelect}
          style={{ display: 'none' }}
          disabled={disabled || uploading}
          accept="image/*,video/*,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        />
        
        <Box sx={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          py: { xs: 2, sm: 3 } 
        }}>
          <CloudUploadIcon sx={{ 
            fontSize: { xs: 40, sm: 60 }, 
            color: 'primary.contrastText', 
            opacity: 0.7, 
            mb: 1 
          }} />
          
          <Typography variant="h6" gutterBottom sx={{ 
            fontSize: { xs: '1rem', sm: '1.25rem' } 
          }}>
            Drag & Drop Files or
          </Typography>
          
          <Button
            variant="contained"
            onClick={() => fileInputRef.current.click()}
            disabled={disabled || uploading}
            startIcon={<AddIcon />}
            size="small"
            sx={{ mt: 1 }}
          >
            Browse Files
          </Button>
          
          <Typography variant="body2" color="text.secondary" sx={{ 
            mt: 1,
            fontSize: { xs: '0.75rem', sm: '0.875rem' },
            display: { xs: 'none', sm: 'block' }
          }}>
            Supported file types: Images, Videos, PDFs, Documents
          </Typography>
          {uploading && (
            <Typography variant="body2" color="primary.contrastText" sx={{ mt: 1 }}>
              Uploading files... Please wait.
            </Typography>
          )}
        </Box>
      </Paper>
      
      {/* File Preview Grid */}
      {files.length > 0 && (
        <Typography variant="subtitle1" sx={{ mb: 1 }}>
          {files.length} file{files.length !== 1 ? 's' : ''}
          {uploading ? ' - Uploading...' : ''}
        </Typography>
      )}
      
      <Grid container spacing={1}>
        {files.map((file) => (
          <Grid item xs={6} sm={6} md={4} key={file.id}>
            <Card variant="outlined" sx={{ position: 'relative' }}>
              {/* File Preview */}
              <Box sx={{ position: 'relative', paddingTop: '56.25%', bgcolor: 'rgba(0, 0, 0, 0.03)' }}>
                {file.type === 'image' ? (
                  <CardMedia
                    component="img"
                    image={file.preview || file.url}
                    alt={file.name}
                    sx={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover'
                    }}
                  />
                ) : file.type === 'video' ? (
                  <Box 
                    sx={{ 
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <MovieIcon sx={{ fontSize: 60, color: 'rgba(0, 0, 0, 0.2)' }} />
                  </Box>
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
                      justifyContent: 'center'
                    }}
                  >
                    {getFileTypeIcon(file.type)}
                  </Box>
                )}
                
                {/* File Type Chip */}
                <Tooltip title={file.type}>
                  <Chip
                    label={file.type}
                    size="small"
                    icon={getFileTypeIcon(file.type)}
                    sx={{
                      position: 'absolute',
                      top: 8,
                      left: 8,
                      bgcolor: 'rgba(255, 255, 255, 0.9)'
                    }}
                  />
                </Tooltip>
                
                {/* Upload Status Chip */}
                {file.uploaded ? (
                  <Tooltip title="Successfully uploaded">
                    <Chip
                      label="Uploaded"
                      size="small"
                      color="success"
                      sx={{
                        position: 'absolute',
                        top: 8,
                        right: 8
                      }}
                    />
                  </Tooltip>
                ) : (
                  <Tooltip title="Uploading in progress">
                    <CircularProgress 
                      size={24}
                      sx={{
                        position: 'absolute',
                        top: 8,
                        right: 8
                      }}
                    />
                  </Tooltip>
                )}
              </Box>
              
              {/* Progress Bar */}
              {uploadProgress[file.id] !== undefined && (
                <Box sx={{ px: 1 }}>
                  <LinearProgress 
                    variant="determinate" 
                    value={uploadProgress[file.id]} 
                    sx={{ height: 4, my: 1, borderRadius: 2 }}
                  />
                  <Typography variant="caption" align="center" display="block">
                    {uploadProgress[file.id]}%
                  </Typography>
                </Box>
              )}
              
              {/* Error Message */}
              {errors[file.id] && (
                <Alert severity="error" sx={{ borderRadius: 0 }}>
                  {errors[file.id]}
                </Alert>
              )}
              
              {/* File Info */}
              <CardContent sx={{ py: 0.5, px: 1 }}>
                <Typography variant="subtitle2" noWrap title={file.name} sx={{
                  fontSize: { xs: '0.75rem', sm: '0.875rem' }
                }}>
                  {file.name}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{
                  fontSize: { xs: '0.65rem', sm: '0.75rem' }
                }}>
                  {formatFileSize(file.size)}
                </Typography>
              </CardContent>
              
              <CardActions sx={{ justifyContent: 'flex-end', pt: 0, pb: 0.5, px: 0.5 }}>
                <IconButton
                  size="small"
                  color="error"
                  onClick={() => handleRemoveFile(file.id)}
                  disabled={disabled || (uploading && !file.uploaded)}
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default FileUploader; 