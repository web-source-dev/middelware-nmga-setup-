import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  Divider,
  TextField,
  Chip,
  IconButton,
  Stack,
  FormControlLabel,
  Switch,
  Tab,
  Tabs,
  CircularProgress,
  Alert,
  LinearProgress,
  Paper
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import FileUploader from "./FileUploader";
import api from "../../services/api";
import { useAuth } from "../../middleware/auth";
import { useSnackbar } from "notistack";
import DescriptionIcon from "@mui/icons-material/Description";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";

const MediaUploader = ({
  open,
  onClose,
  onUploadComplete,
  currentFolder,
  folders
}) => {
  const { enqueueSnackbar } = useSnackbar();
  const { 
    currentUserId, 
    isImpersonating, 
    isCollaborator, 
    isAdmin, 
    isCollaboratorManager, 
    isMediaManager, 
    isDealManager 
  } = useAuth();

  // Check if user can perform actions (upload media)
  const canPerformActions = () => {
    // Main account owner (not a collaborator)
    if (!isCollaborator) return true;
    
    // Admin (with or without impersonating)
    if (isAdmin) return true;
    
    // Collaborator manager
    if (isCollaboratorManager) return true;
    
    // Media manager
    if (isMediaManager) return true;
    
    // Deal manager
    if (isDealManager) return true;
    
    // All other collaborators cannot perform actions
    return false;
  };
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [activeTab, setActiveTab] = useState(0);
  const [mediaList, setMediaList] = useState([]);
  const [uploadedUrls, setUploadedUrls] = useState([]);
  const [metadata, setMetadata] = useState({
    folderId: currentFolder,
    tags: [],
    isPinned: false,
    isPublic: false
  });
  const [tagInput, setTagInput] = useState("");
  const [error, setError] = useState(null);

  // Reset state when dialog opens or folder changes
  useEffect(() => {
    if (open) {
      setActiveTab(0);
      setMediaList([]);
      setUploadedUrls([]);
      setError(null);
      setUploading(false);
      setUploadProgress(0);
      
      // IMPORTANT: Always reset metadata with current folder
      setMetadata({
        folderId: currentFolder || "root",
        tags: [],
        isPinned: false,
        isPublic: false
      });
      
      setTagInput("");
      console.log("Uploader opened with folder:", currentFolder);
    }
  }, [open, currentFolder]);

  const handleTabChange = (event, newValue) => {
    // Don't allow tab change if uploading
    if (uploading) return;
    setActiveTab(newValue);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    console.log(`Changing ${name} to ${value}`);
    setMetadata({
      ...metadata,
      [name]: value
    });
  };

  const handleSwitchChange = (e) => {
    const { name, checked } = e.target;
    setMetadata({
      ...metadata,
      [name]: checked
    });
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !metadata.tags.includes(tagInput.trim())) {
      setMetadata({
        ...metadata,
        tags: [...metadata.tags, tagInput.trim()]
      });
      setTagInput("");
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    setMetadata({
      ...metadata,
      tags: metadata.tags.filter(tag => tag !== tagToRemove)
    });
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddTag();
    }
  };
  const handleCloudinaryUpload = (url, type) => {
    console.log(`Cloudinary upload callback: ${url}, type: ${type}`);
    
    // Check if this is the first upload before updating state
    const isFirstUpload = uploadedUrls.length === 0;
    
    setUploadedUrls(prev => [...prev, { url, type }]);
    
  };

  const handleCloudinaryRemove = (index) => {
    setUploadedUrls(prev => prev.filter((_, i) => i !== index));
  };

  const saveToDatabase = async () => {
    if (uploadedUrls.length === 0) {
      enqueueSnackbar("No media uploaded yet", { variant: "warning" });
      return;
    }

    setUploading(true);
    setError(null);
    setUploadProgress(0);
    
    try {
      const totalItems = uploadedUrls.length;
      const savedItems = [];
      
      for (let i = 0; i < uploadedUrls.length; i++) {
        const { url, type } = uploadedUrls[i];
        
        // Update progress
        setUploadProgress(Math.round(((i) / totalItems) * 100));
        
        // Extract filename from URL
        const filenameWithExtension = url.split('/').pop().split('?')[0];
        
        const mediaData = {
          name: filenameWithExtension,
          url,
          type,
          folderId: metadata.folderId || "root", // Ensure folderId is always set
          tags: metadata.tags || [],
          isPinned: metadata.isPinned || false,
          isPublic: metadata.isPublic || false
        };
        
        console.log(`Saving media item ${i+1}/${totalItems} with data:`, mediaData);
        
        const response = await api.post(`/api/media-manager/upload/direct`, mediaData);
        savedItems.push(response.data);
      }
      
      setUploadProgress(100);
      console.log(`Successfully saved ${savedItems.length} media items`);
      enqueueSnackbar(`Successfully saved ${savedItems.length} media items`, { variant: "success" });
      
      // Pass the complete list of saved items back to the parent
      if (onUploadComplete && savedItems.length > 0) {
        onUploadComplete(savedItems);
      }
      
      onClose();
    } catch (error) {
      console.error("Error saving media to database:", error);
      setError(error.message || "Failed to save media to database");
      enqueueSnackbar("Failed to save media to database", { variant: "error" });
      setUploading(false);
    }
  };

  const handleClose = () => {
    // Prevent closing if upload is in progress
    if (uploading) return;
    onClose();
  };

  // Helper function to get folder display name with path
  const getFolderDisplayName = (folder) => {
    // Build a map of folders by ID for quick lookup
    const folderMap = folders.reduce((map, f) => {
      map[f._id] = f;
      return map;
    }, {});
    
    // If it's a top-level folder, just return its name
    if (folder.parentId === "root") {
      return folder.name;
    }
    
    // For subfolders, construct a path
    let path = folder.name;
    let currentId = folder.parentId;
    
    // Prevent infinite loops with a reasonable depth limit
    let depth = 0;
    const maxDepth = 5;
    
    while (currentId && currentId !== "root" && depth < maxDepth) {
      const parentFolder = folderMap[currentId];
      if (!parentFolder) break;
      
      path = `${parentFolder.name} / ${path}`;
      currentId = parentFolder.parentId;
      depth++;
    }
    
    return path;
  };

  // Combined function to handle full upload workflow
  const handleUploadWithMetadata = async (files) => {
    if (files && files.length > 0) {
      // First proceed to metadata tab
      setActiveTab(1);
    } else if (uploadedUrls.length > 0) {
      // If files are already uploaded, save to database
      await saveToDatabase();
    } else {
      enqueueSnackbar("Please select files to upload", { variant: "warning" });
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={handleClose}
      maxWidth="xl" 
      fullWidth
      scroll="paper"
      PaperProps={{
        sx: { 
          borderRadius: 2,
          height: { xs: '100%', sm: '80vh' },
          maxHeight: { xs: '100%', sm: '80vh' },
          m: { xs: 0, sm: 2 },
          width: { xs: '100%', sm: 'auto', md: '80vw', lg: '80vw', xl: '60vw' }
        }
      }}
    >
      <DialogTitle sx={{ 
        m: 0, 
        p: { xs: 1, sm: 2 }, 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center' 
      }}>
        <Typography variant="h6">Upload Media</Typography>
        <IconButton
          aria-label="close"
          onClick={handleClose}
          disabled={uploading}
          sx={{
            color: (theme) => theme.palette.grey[500],
          }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      
      <Divider />
      
      {uploading && (
        <Box sx={{ width: '100%', px: 2 }}>
          <Typography variant="body2" sx={{ mt: 1 }}>
            Saving media to library... {uploadProgress}%
          </Typography>
          <LinearProgress 
            variant="determinate" 
            value={uploadProgress} 
            sx={{ my: 1, height: 6, borderRadius: 3 }} 
          />
        </Box>
      )}
      
      {error && (
        <Alert severity="error" sx={{ mx: 2, mt: 1 }}>
          {error}
        </Alert>
      )}
      
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs 
          value={activeTab} 
          onChange={handleTabChange} 
          aria-label="media uploader tabs"
          disabled={uploading}
        >
          <Tab 
            label="Upload Files" 
            icon={<CloudUploadIcon />} 
            iconPosition="start"
          />
          <Tab 
            label="Set Details" 
            icon={<DescriptionIcon />} 
            iconPosition="start" 
            disabled={uploading || uploadedUrls.length === 0}
          />
        </Tabs>
      </Box>
      
      <DialogContent sx={{ p: 0, display: 'flex', flexDirection: 'column' }}>
        {activeTab === 0 ? (
          <Box sx={{ flexGrow: 1, overflowY: 'auto', p: { xs: 1, sm: 2 } }}>
            <FileUploader 
              onUpload={handleCloudinaryUpload}
              onRemove={handleCloudinaryRemove}
              initialImages={[]}
              disabled={uploading || !canPerformActions()}
            />
          </Box>
        ) : (
          <Box sx={{ 
            p: { xs: 2, sm: 3 }, 
            flexGrow: 1, 
            overflowY: 'auto' 
          }}>
            <Typography variant="subtitle1" gutterBottom>
              Media Details
            </Typography>
            
            <Box sx={{ mb: 4 }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                {uploadedUrls.length} media item{uploadedUrls.length !== 1 ? 's' : ''} will be saved with these details
              </Typography>
              <Divider />
            </Box>
            
            <Stack spacing={3}>
              <FormControl fullWidth>
                <InputLabel id="folder-select-label">Folder</InputLabel>
                <Select
                  labelId="folder-select-label"
                  name="folderId"
                  value={metadata.folderId || "root"}
                  onChange={handleInputChange}
                  label="Folder"
                  disabled={uploading}
                >
                  <MenuItem value="root">Root Folder</MenuItem>
                  {folders.map((folder) => (
                    <MenuItem key={folder._id} value={folder._id}>
                      {getFolderDisplayName(folder)}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              
              <Box>
                <Typography variant="subtitle2" gutterBottom>
                  Tags
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 1 }}>
                  {metadata.tags.map((tag) => (
                    <Chip 
                      key={tag}
                      label={tag}
                      onDelete={uploading ? undefined : () => handleRemoveTag(tag)}
                    />
                  ))}
                </Box>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <TextField
                    placeholder="Add tag"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyPress={handleKeyPress}
                    fullWidth
                    disabled={uploading}
                  />
                  <Button 
                    variant="outlined" 
                    onClick={handleAddTag}
                    disabled={!tagInput.trim() || uploading}
                  >
                    Add
                  </Button>
                </Box>
              </Box>
              
              <Box>
                <Typography variant="subtitle2" gutterBottom>
                  Options
                </Typography>
                <Stack>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={metadata.isPinned}
                        onChange={handleSwitchChange}
                        name="isPinned"
                        disabled={uploading}
                      />
                    }
                    label="Pin Media"
                  />
                  
                  {/* <FormControlLabel
                    control={
                      <Switch
                        checked={metadata.isPublic}
                        onChange={handleSwitchChange}
                        name="isPublic"
                        disabled={uploading}
                      />
                    }
                    label="Make Public"
                  /> */}
                </Stack>
              </Box>
            </Stack>
          </Box>
        )}
      </DialogContent>
      
      <Divider />
      
      <DialogActions sx={{ 
        p: { xs: 1, sm: 2 }, 
        justifyContent: 'space-between' 
      }}>
        {activeTab === 0 ? (
          <>
            <Button 
              onClick={handleClose} 
              color="inherit"
              disabled={uploading}
            >
              Cancel
            </Button>

            <Box>
              {uploadedUrls.length > 0 && (
                <Button 
                  onClick={() => setActiveTab(1)} 
                  variant="contained"
                  color="primary"
                  disabled={uploading || !canPerformActions()}
                >
                  Next: Set Details
                </Button>
               
              )}
            </Box>
          </>
        ) : (
          <>
            <Button 
              onClick={() => setActiveTab(0)} 
              color="inherit"
              disabled={uploading}
            >
              Back
            </Button>
            <Button 
              onClick={saveToDatabase} 
              variant="contained"
              disabled={uploading || !canPerformActions()}
              startIcon={uploading ? <CircularProgress size={20} color="inherit" /> : null}
            >
              {uploading ? 'Saving...' : 'Save to Library'}
            </Button>
          </>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default MediaUploader; 