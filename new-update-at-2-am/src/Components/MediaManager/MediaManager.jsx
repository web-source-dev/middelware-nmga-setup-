import React, { useState, useEffect } from "react";
import { 
  Box, 
  Typography, 
  Paper, 
  Grid, 
  Divider,
  CircularProgress,
  Container,
  useTheme,
  Button
} from "@mui/material";
import MediaLibrary from "./MediaLibrary";
import MediaToolbar from "./MediaToolbar";
import FolderTree from "./FolderTree";
import MediaUploader from "./MediaUploader";
import MediaDetails from "./MediaDetails";
import api from "../../services/api";
import { useAuth } from "../../middleware/auth";
import { useSnackbar } from "notistack";

const MediaManager = ({
  selectorMode = false,
  onMediaSelect = null,
  initialFolder = "root",
  onFolderChange = null
}) => {
  const theme = useTheme();
  const { enqueueSnackbar } = useSnackbar();
  const { currentUserId, isImpersonating } = useAuth();
  
  // State management
  const [loading, setLoading] = useState(false);
  const [mediaItems, setMediaItems] = useState([]);
  const [folders, setFolders] = useState([]);
  const [selectedFolder, setSelectedFolder] = useState(initialFolder);
  const [selectedMedia, setSelectedMedia] = useState(null);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [viewMode, setViewMode] = useState("grid"); // "grid" or "list"
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState("desc");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0
  });
  const [stats, setStats] = useState({
    total: 0,
    images: 0,
    videos: 0,
    documents: 0,
    others: 0,
    folders: 0
  });
  // Force refresh counter
  const [refreshCounter, setRefreshCounter] = useState(0);

  // Use the initialFolder value when it changes
  useEffect(() => {
    setSelectedFolder(initialFolder);
  }, [initialFolder]);

  // Notify parent component when folder changes
  const handleFolderSelect = (folderId) => {
    setSelectedFolder(folderId);
    if (onFolderChange) {
      onFolderChange(folderId);
    }
  };

  // Fetch media items
  const fetchMedia = async () => {
    setLoading(true);
    try {
      const params = {
        page: pagination.currentPage,
        limit: 20,
        folder: selectedFolder,
        sortBy,
        sortOrder
      };
      
      if (searchQuery) {
        params.search = searchQuery;
      }
      
      if (filterType !== "all") {
        params.type = filterType;
      }
      
      console.log("Fetching media with params:", params); // Debug log
      
      const response = await api.get(`/api/media-manager/media`, { params });
      
      console.log("Media fetched:", response.data.media); // Debug log
      setMediaItems(response.data.media);
      setPagination({
        currentPage: response.data.currentPage,
        totalPages: response.data.totalPages,
        totalItems: response.data.totalItems
      });
      
    } catch (error) {
      console.error("Error fetching media:", error);
      enqueueSnackbar("Failed to load media items", { variant: "error" });
    } finally {
      setLoading(false);
    }
  };

  // Fetch folders
  const fetchFolders = async () => {
    try {
      // Remove any query params to get ALL folders regardless of parent
      const response = await api.get(`/api/media-manager/folders`);
      setFolders(response.data);
    } catch (error) {
      console.error("Error fetching folders:", error);
      enqueueSnackbar("Failed to load folders", { variant: "error" });
    }
  };

  // Fetch stats
  const fetchStats = async () => {
    try {
      const response = await api.get(`/api/media-manager/stats`);
      setStats(response.data);
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  // Initial data loading
  useEffect(() => {
    fetchFolders();
    fetchStats();
  }, [refreshCounter]); // Add refresh counter dependency to ensure folders refresh

  // Fetch media when parameters change
  useEffect(() => {
    fetchMedia();
  }, [
    selectedFolder,
    pagination.currentPage,
    sortBy,
    sortOrder,
    searchQuery,
    filterType,
    refreshCounter // Add refresh counter as dependency
  ]);

  // Handle media upload
  const handleMediaUpload = async (mediaItems) => {
    try {
      // If mediaItems is an array and contains at least one item with a folderId
      if (Array.isArray(mediaItems) && mediaItems.length > 0 && mediaItems[0].folderId) {
        // Set selected folder to match the folder where media was uploaded
        const targetFolder = mediaItems[0].folderId;
        if (targetFolder !== selectedFolder) {
          setSelectedFolder(targetFolder);
        }
      }
      
      // Increment refresh counter to trigger re-fetch
      setRefreshCounter(prev => prev + 1);
      
      // Also fetch stats
      await fetchStats();
      
      enqueueSnackbar("Media uploaded successfully", { variant: "success" });
    } catch (error) {
      console.error("Error handling media upload:", error);
      // Force refresh anyway
      setRefreshCounter(prev => prev + 1);
    }
  };

  // Handle media deletion
  const handleMediaDelete = async (mediaId) => {
    try {
      await api.delete(`/api/media-manager/media/${mediaId}`);
      setSelectedMedia(null);
      // Trigger a refresh
      setRefreshCounter(prev => prev + 1);
      await fetchStats();
      enqueueSnackbar("Media deleted successfully", { variant: "success" });
    } catch (error) {
      console.error("Error deleting media:", error);
      enqueueSnackbar("Failed to delete media", { variant: "error" });
    }
  };

  // Handle folder renaming
  const handleRenameFolder = async (folderId, newName) => {
    try {
      if (!folderId || !newName || !newName.trim()) {
        throw new Error('Invalid folder ID or name');
      }
      
      // Log the user ID to make sure it's valid
      console.log(`Renaming folder ${folderId} to "${newName}" for user ${currentUserId}`);
      
      if (!currentUserId) {
        throw new Error('User ID not found. Please log in again.');
      }
      
      const response = await api.put(`/api/media-manager/folders/${folderId}`, {
        name: newName.trim()
      });
      
      console.log("Rename folder complete, response:", response.data);
      
      // Force immediate refresh of folders
      await fetchFolders();
      // Double-check we have the updated folder
      const updatedFolders = await api.get(`/api/media-manager/folders`);
      console.log("Updated folders after rename:", updatedFolders.data);
      
      // Increment refresh counter to trigger UI update
      setRefreshCounter(prev => prev + 1);
      
      enqueueSnackbar("Folder renamed successfully", { variant: "success" });
      setTimeout(() => {
        fetchFolders().then(() => {
          setRefreshCounter(prev => prev + 1);
        });
      }, 500); // 500ms delay
      return response.data;
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || "Failed to rename folder";
      console.error("Error renaming folder:", error);
      console.error("Error details:", error.response?.data || error.message);
      enqueueSnackbar(errorMessage, { variant: "error" });
      throw error;
    }
  };

  // Handle folder creation
  const handleCreateFolder = async (folderName, parentId = selectedFolder) => {
    try {
      // Special case: If folder name is empty, just refresh folders and return null
      // This is used by the rename and delete functions to trigger a refresh
      if (!folderName || folderName.trim() === "") {
        console.log("Empty folder name provided - refreshing folders without creating");
        // Increment refresh counter to trigger re-fetch
        setRefreshCounter(prev => prev + 1);
        return null;
      }
      
      console.log(`Creating folder "${folderName}" with parent ${parentId}`);
      
      const response = await api.post(`/api/media-manager/folders`, {
        name: folderName,
        parentId: parentId
      });
      
      // Increment refresh counter to trigger re-fetch of both media and folders
      setRefreshCounter(prev => prev + 1);
      
      enqueueSnackbar("Folder created successfully", { variant: "success" });
      
      // Return the created folder data
      setTimeout(() => {
        fetchFolders().then(() => {
          setRefreshCounter(prev => prev + 1);
        });
      }, 500); // 500ms delay
      return response.data;
    } catch (error) {
      console.error("Error creating folder:", error);
      enqueueSnackbar("Failed to create folder", { variant: "error" });
      throw error; // Re-throw to handle in the calling component
    }
  };

  // Handle folder deletion
  const handleDeleteFolder = async (folderId) => {
    try {
      console.log(`Deleting folder ${folderId} for user ${currentUserId}`);
      
      if (!folderId) {
        throw new Error('Invalid folder ID');
      }
      
      if (!currentUserId) {
        throw new Error('User ID not found. Please log in again.');
      }
      
      // First, find all child folders to handle properly
      const childFolders = folders.filter(f => f.parentId === folderId);
      if (childFolders.length > 0) {
        console.log(`Folder has ${childFolders.length} child folders that will be moved`);
      }
      
      // Make API call to delete the folder with detailed error handling
      try {
        const response = await api.delete(`/api/media-manager/folders/${folderId}`);
        console.log("Delete folder response:", response.data);
      } catch (deleteError) {
        console.error("API error deleting folder:", deleteError);
        console.error("Error response:", deleteError.response?.data);
        throw new Error(deleteError.response?.data?.message || 'Failed to delete folder');
      }
      
      // If we were in the deleted folder, go to root
      if (selectedFolder === folderId) {
        console.log("Currently selected folder was deleted, switching to root");
        setSelectedFolder("root");
      }
      
      // Force a refresh to update the UI
      console.log("Triggering refresh after folder deletion");
      try {
        await fetchFolders(); // Immediately fetch folders
      } catch (fetchError) {
        console.error("Error refreshing folders after delete:", fetchError);
      }
      
      setRefreshCounter(prev => prev + 1); // Also increment refresh counter
      await fetchStats(); // Update stats
      
      enqueueSnackbar("Folder deleted successfully", { variant: "success" });
      setTimeout(() => {
        fetchFolders().then(() => {
          setRefreshCounter(prev => prev + 1);
        });
      }, 500); // 500ms delay
      return { message: "Folder deleted successfully" };
    } catch (error) {
      console.error("Error deleting folder:", error);
      enqueueSnackbar(error.message || "Failed to delete folder", { variant: "error" });
      throw error; // Re-throw to handle in the calling component
    }
  };

  // Handle pagination change
  const handlePageChange = (event, page) => {
    setPagination({
      ...pagination,
      currentPage: page
    });
  };

  // Update this handler to support external selection callback
  const handleMediaSelection = (media) => {
    setSelectedMedia(media);
    
    // If in selector mode, also call the external callback
    if (selectorMode && onMediaSelect) {
      onMediaSelect(media);
    }
  };

  return (
    <Container maxWidth="xl" sx={{ mt: selectorMode ? 0 : 3, mb: selectorMode ? 0 : 6, height: selectorMode ? '100%' : 'auto' }}>
      {!selectorMode && (
        <>
          <Typography variant="h4" gutterBottom>
            Media Manager
          </Typography>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
            <Button
              variant="contained"
              color="primary"
              onClick={() => setUploadDialogOpen(true)}
            >
              Add Media
            </Button>
          </Box>
        </>
      )}
      
      <Paper 
        elevation={selectorMode ? 0 : 3} 
        sx={{ 
          p: 0, 
          overflow: 'hidden', 
          borderRadius: selectorMode ? 0 : 2,
          height: { xs: 'calc(100vh - 120px)', sm: 'calc(100vh - 150px)', md: selectorMode ? '100%' : 'calc(100vh - 180px)' },
          display: 'flex', 
          flexDirection: 'column',
          border: selectorMode ? 'none' : undefined
        }}
      >
        <MediaToolbar 
          onSearch={setSearchQuery}
          searchValue={searchQuery}
          onFilterChange={setFilterType}
          filterValue={filterType}
          onSortChange={setSortBy}
          sortValue={sortBy}
          onSortOrderChange={setSortOrder}
          sortOrderValue={sortOrder}
          onViewModeChange={setViewMode}
          viewModeValue={viewMode}
          onUploadClick={() => setUploadDialogOpen(true)}
          onCreateFolder={handleCreateFolder}
          stats={stats}
          selectorMode={selectorMode}
        />
        
        <Divider />
        
        <Box sx={{ 
          display: 'flex', 
          flexGrow: 1, 
          overflow: 'hidden',
          flexDirection: { xs: 'column', md: 'row' }  // Stack on mobile, row on desktop
        }}>
          {/* Left Sidebar - Folder Navigation */}
          <Box sx={{ 
            width: { xs: '100%', md: 240 }, 
            height: { xs: selectedFolder === "root" ? 'auto' : '200px', md: 'auto' },
            borderRight: { xs: 'none', md: `1px solid ${theme.palette.divider}` },
            borderBottom: { xs: `1px solid ${theme.palette.divider}`, md: 'none' },
            p: 1,
            overflow: 'auto'
          }}>
            <FolderTree 
              folders={folders}
              selectedFolder={selectedFolder}
              onFolderSelect={handleFolderSelect}
              onDeleteFolder={handleDeleteFolder}
              onCreateFolder={handleCreateFolder}
              onRenameFolder={handleRenameFolder}
            />
          </Box>
          
          {/* Main Content Area */}
          <Box sx={{ 
            flexGrow: 1, 
            p: 2,
            width: { xs: '100%', md: 'calc(100% - 240px)' },
            height: { xs: selectedMedia ? 'calc(100% - 200px - 300px)' : 'calc(100% - 200px)', md: 'auto' },
            overflow: 'auto',
            display: 'flex'
          }}>
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%' }}>
                <CircularProgress />
              </Box>
            ) : (
              <MediaLibrary 
                mediaItems={mediaItems}
                viewMode={viewMode}
                onMediaSelect={handleMediaSelection}
                selectedMedia={selectedMedia}
                onMediaDelete={handleMediaDelete}
                pagination={pagination}
                onPageChange={handlePageChange}
                selectorMode={selectorMode}
              />
            )}
          </Box>
          
          {/* Right Sidebar - Media Details - Shows at bottom on mobile */}
          {selectedMedia && (
            <Box sx={{ 
              width: { xs: '100%', md: 300 },
              height: { xs: '300px', md: 'auto' },
              borderLeft: { xs: 'none', md: `1px solid ${theme.palette.divider}` },
              borderTop: { xs: `1px solid ${theme.palette.divider}`, md: 'none' },
              p: 2,
              overflow: 'auto'
            }}>
              <MediaDetails 
                media={selectedMedia}
                onClose={() => setSelectedMedia(null)}
                onDelete={() => handleMediaDelete(selectedMedia._id)}
                folders={folders}
                onUpdate={() => setRefreshCounter(prev => prev + 1)}
              />
            </Box>
          )}
        </Box>
      </Paper>

      {/* Upload Dialog */}
      <MediaUploader
        open={uploadDialogOpen}
        onClose={() => setUploadDialogOpen(false)}
        onUploadComplete={handleMediaUpload}
        currentFolder={selectedFolder}
        folders={folders}
      />
    </Container>
  );
};

export default MediaManager; 