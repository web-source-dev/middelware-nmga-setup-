import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Button, 
  Divider,
  CircularProgress,
  Stack,
  Dialog
} from '@mui/material';
import { useSnackbar } from "notistack";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import MediaManager from './MediaManager';
import MediaUploader from './MediaUploader';
import api from '../../services/api';
import { useAuth } from '../../middleware/auth';

/**
 * MediaSelectorWrapper - A wrapper around MediaManager that adds selection functionality
 * 
 * @param {Object} props Component props
 * @param {Function} props.onMediaSelect Function to call when media is selected (receives media object with url)
 * @param {Function} props.onCancel Function to call when selection is cancelled
 */
const MediaSelectorWrapper = ({ onMediaSelect, onCancel }) => {
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

  // Check if user can perform actions (upload new media)
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
  const [selectedMedia, setSelectedMedia] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [folders, setFolders] = useState([]);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [currentFolder, setCurrentFolder] = useState("root"); // Track current folder
    
  // Fetch folders for the upload dialog
  useEffect(() => {
    const fetchFolders = async () => {
      try {
        const response = await api.get(`/api/media-manager/folders`);
        setFolders(response.data);
      } catch (error) {
        console.error("Error fetching folders:", error);
      }
    };
    
    fetchFolders();
  }, []);
  
  // Custom handlers for MediaManager events
  const handleMediaSelect = (media) => {
    setSelectedMedia(media);
  };
  
  const handleAdd = () => {
    if (!selectedMedia) {
      enqueueSnackbar("Please select a media item first", { variant: "warning" });
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Here we extract just the needed info from the media object
      const mediaToAdd = {
        url: selectedMedia.url,
        type: selectedMedia.type || 'image',
        name: selectedMedia.name,
        id: selectedMedia._id
      };
      
      onMediaSelect(mediaToAdd);
    } catch (error) {
      console.error("Error selecting media:", error);
      enqueueSnackbar("Failed to select media", { variant: "error" });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle media upload completion
  const handleUploadComplete = async (mediaItems) => {
    setUploadDialogOpen(false);
    
    try {
      // If upload returned items, check if they have a folder
      if (Array.isArray(mediaItems) && mediaItems.length > 0 && mediaItems[0].folderId) {
        // Set current folder to the one where media was uploaded
        setCurrentFolder(mediaItems[0].folderId);
      }
      
      // Trigger a refresh of the media manager
      setRefreshTrigger(prev => prev + 1);
      enqueueSnackbar("Media uploaded successfully", { variant: "success" });
    } catch (error) {
      console.error("Error handling media upload:", error);
      // Still trigger refresh
      setRefreshTrigger(prev => prev + 1);
    }
  };

  // Handler to track folder changes in MediaManager
  const handleFolderChange = (folderId) => {
    setCurrentFolder(folderId);
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Upload Button Area */}
      <Box sx={{ p: 2, borderBottom: '1px solid rgba(0, 0, 0, 0.12)', display: 'flex', justifyContent: 'flex-end' }}>
        <Button
          variant="contained"
          startIcon={<CloudUploadIcon />}
          onClick={() => setUploadDialogOpen(true)}
          disabled={!canPerformActions()}
          color="primary.contrastText"
        >
          Upload New Media
        </Button>
      </Box>
      
      {/* MediaManager with custom props */}
      <Box sx={{ flexGrow: 1, overflow: 'hidden' }}>
        <MediaManager
          onMediaSelect={handleMediaSelect}
          selectedMedia={selectedMedia}
          selectorMode={true} // This would be a prop to adjust the UI in MediaManager
          key={refreshTrigger} // Force re-render when new media is uploaded
          initialFolder={currentFolder} // Pass current folder
          onFolderChange={handleFolderChange} // Listen for folder changes
        />
      </Box>
      
      {/* Action buttons at the bottom */}
      <Box sx={{ p: 2, borderTop: '1px solid rgba(0, 0, 0, 0.12)' }}>
        <Divider sx={{ mb: 2 }} />
        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <Button
            variant="outlined"
            onClick={onCancel}
            disabled={isLoading}
          >
            Cancel
          </Button>
          
          <Button
            variant="contained"
            color="primary.contrastText"
            onClick={handleAdd}
            disabled={!selectedMedia || isLoading}
            startIcon={isLoading ? <CircularProgress size={20} color="inherit" /> : null}
          >
            {isLoading ? 'Adding...' : 'Add Selected Media'}
          </Button>
        </Box>
      </Box>
      
      {/* Upload Dialog */}
      <MediaUploader
        open={uploadDialogOpen}
        onClose={() => setUploadDialogOpen(false)}
        onUploadComplete={handleUploadComplete}
        currentFolder={currentFolder} // Use the tracked currentFolder
        folders={folders}
      />
    </Box>
  );
};

export default MediaSelectorWrapper; 