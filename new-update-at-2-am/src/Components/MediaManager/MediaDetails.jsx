import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Divider,
  TextField,
  Button,
  IconButton,
  Chip,
  FormControl,
  Select,
  MenuItem,
  InputLabel,
  Stack,
  Paper,
  Switch,
  FormControlLabel,
  Tooltip,
  Avatar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Menu,
  ListItemIcon,
  ListItemText,
  CircularProgress
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import EditIcon from "@mui/icons-material/Edit";
import SaveIcon from "@mui/icons-material/Save";
import DeleteIcon from "@mui/icons-material/Delete";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import ImageIcon from "@mui/icons-material/Image";
import MovieIcon from "@mui/icons-material/Movie";
import DescriptionIcon from "@mui/icons-material/Description";
import InsertDriveFileIcon from "@mui/icons-material/InsertDriveFile";
import StarIcon from "@mui/icons-material/Star";
import DriveFileMoveIcon from "@mui/icons-material/DriveFileMove";
import { format } from "date-fns";
import api from "../../services/api";
import { useAuth } from "../../middleware/auth";
import { useSnackbar } from "notistack";

const MediaDetails = ({ media, onClose, onDelete, folders, onUpdate }) => {
  const { enqueueSnackbar } = useSnackbar();
  const { currentUserId, isImpersonating } = useAuth();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [mediaData, setMediaData] = useState({
    name: media.name,
    folderId: media.folderId || "root",
    tags: media.tags || [],
    isPinned: media.isPinned || false,
    isPublic: media.isPublic || false
  });
  const [tagInput, setTagInput] = useState("");
  
  // Menu state
  const [menuAnchorEl, setMenuAnchorEl] = useState(null);
  const menuOpen = Boolean(menuAnchorEl);
  
  // Move dialog state
  const [moveDialogOpen, setMoveDialogOpen] = useState(false);
  const [selectedFolder, setSelectedFolder] = useState(media.folderId || "root");
  const [movingMedia, setMovingMedia] = useState(false);

  useEffect(() => {
    setMediaData({
      name: media.name,
      folderId: media.folderId || "root",
      tags: media.tags || [],
      isPinned: media.isPinned || false,
      isPublic: media.isPublic || false
    });
  }, [media]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setMediaData({
      ...mediaData,
      [name]: value
    });
  };

  const handleSwitchChange = (e) => {
    const { name, checked } = e.target;
    setMediaData({
      ...mediaData,
      [name]: checked
    });
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !mediaData.tags.includes(tagInput.trim())) {
      setMediaData({
        ...mediaData,
        tags: [...mediaData.tags, tagInput.trim()]
      });
      setTagInput("");
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    setMediaData({
      ...mediaData,
      tags: mediaData.tags.filter(tag => tag !== tagToRemove)
    });
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddTag();
    }
  };
  const handleSave = async () => {
    setSaving(true);
    try {
      await api.put(`/api/media-manager/media/${media._id}`, mediaData);
      setEditing(false);
      onUpdate();
      enqueueSnackbar("Media updated successfully", { variant: "success" });
    } catch (error) {
      console.error("Error updating media:", error);
      enqueueSnackbar("Failed to update media", { variant: "error" });
    } finally {
      setSaving(false);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(media.url);
    enqueueSnackbar("Link copied to clipboard", { variant: "success" });
  };

  // Handle opening the menu
  const handleMenuOpen = (event) => {
    setMenuAnchorEl(event.currentTarget);
  };
  
  // Handle closing the menu
  const handleMenuClose = () => {
    setMenuAnchorEl(null);
  };
  
  // Open move dialog
  const handleOpenMoveDialog = () => {
    setSelectedFolder(media.folderId || "root");
    setMoveDialogOpen(true);
    handleMenuClose();
  };
  
  // Move media to a different folder
  const handleMoveMedia = async () => {
    if (selectedFolder === media.folderId) {
      setMoveDialogOpen(false);
      return;
    }
    
    setMovingMedia(true);
    
    try {
      await api.put(`/api/media-manager/media/${media._id}`, {
        folderId: selectedFolder
      });
      
      // Update local media data with new folder
      setMediaData({
        ...mediaData,
        folderId: selectedFolder
      });
      
      enqueueSnackbar("Media moved successfully", { variant: "success" });
      onUpdate();
    } catch (error) {
      console.error("Error moving media:", error);
      enqueueSnackbar("Failed to move media", { variant: "error" });
    } finally {
      setMovingMedia(false);
      setMoveDialogOpen(false);
    }
  };

  // Helper function to get media type icon
  const getMediaTypeIcon = () => {
    switch (media.type) {
      case "image":
        return <ImageIcon fontSize="large" color="success" />;
      case "video":
        return <MovieIcon fontSize="large" color="error" />;
      case "document":
        return <DescriptionIcon fontSize="large" color="warning" />;
      default:
        return <InsertDriveFileIcon fontSize="large" color="action" />;
    }
  };

  // Helper function to format date
  const formatDate = (dateString) => {
    if (!dateString) return "Unknown";
    return format(new Date(dateString), "PPpp"); // Format: Apr 29, 2022, 5:30 PM
  };

  // Helper function to format file size
  const formatFileSize = (bytes) => {
    if (!bytes) return "Unknown";
    
    const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
    if (bytes === 0) return "0 Bytes";
    
    const i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)), 10);
    if (i === 0) return `${bytes} ${sizes[i]}`;
    
    return `${(bytes / (1024 ** i)).toFixed(1)} ${sizes[i]}`;
  };

  // Get folder name from ID with path
  const getFolderName = (folderId) => {
    if (folderId === "root") return "Root Folder";
    
    // Build a map of folders by ID for quick lookup
    const folderMap = folders.reduce((map, folder) => {
      map[folder._id] = folder;
      return map;
    }, {});
    
    // Find the folder
    const folder = folderMap[folderId];
    if (!folder) return "Unknown Folder";
    
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

  return (
    <Box sx={{ 
      height: '100%', 
      display: 'flex', 
      flexDirection: 'column',
      overflow: 'hidden'
    }}>
      {/* Header */}
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        mb: 1
      }}>
        <Typography variant="subtitle1" fontWeight="medium">
          Media Details
        </Typography>
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </Box>
      
      <Divider sx={{ mb: 1 }} />

      {/* Preview */}
      <Box sx={{ mb: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        {media.type === "image" ? (
          <Box
            component="img"
            src={media.url}
            alt={media.name}
            sx={{
              width: '100%',
              height: 'auto',
              maxHeight: { xs: 100, sm: 150, md: 200 },
              borderRadius: 1,
              objectFit: 'contain',
              bgcolor: 'background.paper'
            }}
          />
        ) : (
          <Paper
            sx={{
              width: '100%',
              height: { xs: 80, sm: 100, md: 120 },
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: 'background.default',
              borderRadius: 1
            }}
          >
            {getMediaTypeIcon()}
          </Paper>
        )}
      </Box>

      {/* Media Info */}
      <Box sx={{ mb: 1, flexGrow: 1, overflowY: 'auto' }}>
        {editing ? (
          // Edit Mode
          <Stack spacing={1}>
            <TextField
              label="Name"
              name="name"
              value={mediaData.name}
              onChange={handleInputChange}
              fullWidth
              size="small"
            />
            
            <FormControl fullWidth size="small">
              <InputLabel id="folder-select-label">Folder</InputLabel>
              <Select
                labelId="folder-select-label"
                name="folderId"
                value={mediaData.folderId}
                onChange={handleInputChange}
                label="Folder"
              >
                <MenuItem value="root">Root Folder</MenuItem>
                {folders.map((folder) => (
                  <MenuItem key={folder._id} value={folder._id}>
                    {getFolderName(folder._id)}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            
            <Box>
              <Typography variant="subtitle2" gutterBottom>
                Tags
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 1 }}>
                {mediaData.tags.map((tag) => (
                  <Chip 
                    key={tag}
                    label={tag}
                    size="small"
                    onDelete={() => handleRemoveTag(tag)}
                  />
                ))}
              </Box>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <TextField
                  placeholder="Add tag"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  size="small"
                  fullWidth
                />
                <Button 
                  variant="outlined" 
                  size="small"
                  onClick={handleAddTag}
                  disabled={!tagInput.trim()}
                >
                  Add
                </Button>
              </Box>
            </Box>
            
            <FormControlLabel
              control={
                <Switch
                  checked={mediaData.isPinned}
                  onChange={handleSwitchChange}
                  name="isPinned"
                />
              }
              label="Pin Media"
            />
{/*             
            <FormControlLabel
              control={
                <Switch
                  checked={mediaData.isPublic}
                  onChange={handleSwitchChange}
                  name="isPublic"
                />
              }
              label="Make Public"
            /> */}
          </Stack>
        ) : (
          // View Mode
          <Stack spacing={1}>
            <Box>
              <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.7rem', md: '0.75rem' } }}>
                Name
              </Typography>
              <Typography variant="body1" sx={{ 
                wordBreak: 'break-word',
                fontSize: { xs: '0.85rem', md: '1rem' }
              }}>
                {media.name}
              </Typography>
            </Box>
            
            <Box>
              <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.7rem', md: '0.75rem' } }}>
                Type
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                {getMediaTypeIcon()}
                <Typography variant="body2">
                  {media.type.charAt(0).toUpperCase() + media.type.slice(1)}
                </Typography>
              </Box>
            </Box>
            
            <Box>
              <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.7rem', md: '0.75rem' } }}>
                Size
              </Typography>
              <Typography variant="body1">
                {formatFileSize(media.size)}
              </Typography>
            </Box>
            
            <Box>
              <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.7rem', md: '0.75rem' } }}>
                Folder
              </Typography>
              <Typography variant="body1">
                {getFolderName(media.folderId)}
              </Typography>
            </Box>
            
            <Box>
              <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.7rem', md: '0.75rem' } }}>
                Date Added
              </Typography>
              <Typography variant="body1">
                {formatDate(media.createdAt)}
              </Typography>
            </Box>
            
            <Box>
              <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.7rem', md: '0.75rem' } }}>
                Tags
              </Typography>
              {media.tags && media.tags.length > 0 ? (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {media.tags.map((tag) => (
                    <Chip key={tag} label={tag} size="small" />
                  ))}
                </Box>
              ) : (
                <Typography variant="body2" color="text.secondary" fontStyle="italic">
                  No tags
                </Typography>
              )}
            </Box>
            
            <Box>
              <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.7rem', md: '0.75rem' } }}>
                Status
              </Typography>
              <Stack direction="row" spacing={1} sx={{ mt: 0.5 }}>
                {media.isPinned && (
                  <Chip 
                    icon={<StarIcon />} 
                    label="Pinned" 
                    size="small" 
                    color="warning" 
                    variant="outlined" 
                  />
                )}
                {media.isPublic && (
                  <Chip 
                    label="Public" 
                    size="small" 
                    color="success" 
                    variant="outlined" 
                  />
                )}
                {!media.isPinned && !media.isPublic && (
                  <Typography variant="body2" color="text.secondary" fontStyle="italic">
                    Standard
                  </Typography>
                )}
              </Stack>
            </Box>
          </Stack>
        )}
      </Box>

      {/* Action Buttons */}
      <Box sx={{ mt: 'auto' }}>
        <Divider sx={{ mb: 1 }} />
        
        {editing ? (
          <Stack direction="row" spacing={1} justifyContent="flex-end">
            <Button 
              variant="outlined" 
              onClick={() => setEditing(false)}
              startIcon={<CloseIcon />}
              size="small"
            >
              Cancel
            </Button>
            <Button 
              variant="contained" 
              onClick={handleSave}
              startIcon={<SaveIcon />}
              size="small"
            >
              Save
            </Button>
          </Stack>
        ) : (
          <Stack spacing={1}>
            <Button 
              fullWidth 
              variant="outlined" 
              onClick={() => setEditing(true)}
              startIcon={<EditIcon />}
              size="small"
            >
              Edit Details
            </Button>
            
            <Stack direction="row" spacing={1}>
              <Button 
                variant="outlined" 
                color="secondary"
                onClick={handleCopyLink}
                startIcon={<ContentCopyIcon />}
                sx={{ flex: 1 }}
                size="small"
              >
                Copy Link
              </Button>
              
              <Button 
                variant="outlined" 
                color="error"
                onClick={onDelete}
                startIcon={<DeleteIcon />}
                sx={{ flex: 1 }}
                size="small"
              >
                Delete
              </Button>
            </Stack>
          </Stack>
        )}
      </Box>

      {/* Context Menu */}
      <Menu
        anchorEl={menuAnchorEl}
        open={menuOpen}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => { setEditing(true); handleMenuClose(); }}>
          <ListItemIcon>
            <EditIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Edit Media</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleOpenMoveDialog}>
          <ListItemIcon>
            <DriveFileMoveIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Move to Folder</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleCopyLink}>
          <ListItemIcon>
            <ContentCopyIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Copy Link</ListItemText>
        </MenuItem>
      </Menu>
      
      {/* Move Dialog */}
      <Dialog
        open={moveDialogOpen}
        onClose={() => setMoveDialogOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Move Media to Folder</DialogTitle>
        <DialogContent>
          <FormControl fullWidth sx={{ mt: 1 }}>
            <InputLabel id="move-folder-select-label">Destination Folder</InputLabel>
            <Select
              labelId="move-folder-select-label"
              value={selectedFolder}
              onChange={(e) => setSelectedFolder(e.target.value)}
              label="Destination Folder"
            >
              <MenuItem value="root">Root Folder</MenuItem>
              {folders.map((folder) => (
                <MenuItem key={folder._id} value={folder._id}>
                  {getFolderName(folder._id)}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setMoveDialogOpen(false)} disabled={movingMedia}>
            Cancel
          </Button>
          <Button 
            onClick={handleMoveMedia} 
            variant="contained" 
            disabled={selectedFolder === media.folderId || movingMedia}
            startIcon={movingMedia ? <CircularProgress size={16} /> : null}
          >
            {movingMedia ? "Moving..." : "Move"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default MediaDetails; 