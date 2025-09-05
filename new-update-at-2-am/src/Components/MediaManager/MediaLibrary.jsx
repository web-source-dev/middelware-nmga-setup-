import React, { useState } from "react";
import { 
  Grid,
  Card,
  CardMedia,
  CardContent,
  CardActions,
  Typography,
  IconButton,
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Checkbox,
  Pagination,
  Paper,
  Chip,
  Tooltip,
  useTheme,
  Skeleton,
  Dialog,
  DialogTitle,
  DialogContent
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import VisibilityIcon from "@mui/icons-material/Visibility";
import CloudDownloadIcon from "@mui/icons-material/CloudDownload";
import MovieIcon from "@mui/icons-material/Movie";
import ImageIcon from "@mui/icons-material/Image";
import DescriptionIcon from "@mui/icons-material/Description";
import InsertDriveFileIcon from "@mui/icons-material/InsertDriveFile";
import StarIcon from "@mui/icons-material/Star";
import StarBorderIcon from "@mui/icons-material/StarBorder";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import CloseIcon from "@mui/icons-material/Close";
import { format } from "date-fns";

// Helper function to format file size
const formatFileSize = (bytes) => {
  if (!bytes) return "Unknown";
  
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  if (bytes === 0) return "0 Bytes";
  
  const i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)), 10);
  if (i === 0) return `${bytes} ${sizes[i]}`;
  
  return `${(bytes / (1024 ** i)).toFixed(1)} ${sizes[i]}`;
};

// Get icon for media type
const getMediaTypeIcon = (type) => {
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

const MediaLibrary = ({
  mediaItems,
  viewMode,
  onMediaSelect,
  selectedMedia,
  onMediaDelete,
  pagination,
  onPageChange,
  selectorMode = false
}) => {
  const theme = useTheme();
  const [mediaViewerOpen, setMediaViewerOpen] = useState(false);
  const [viewedMedia, setViewedMedia] = useState(null);
  
  // Function to open media in popup viewer
  const handleOpenMediaViewer = (media, e) => {
    if (e) e.stopPropagation();
    setViewedMedia(media);
    setMediaViewerOpen(true);
  };
  
  // Function to close media viewer
  const handleCloseMediaViewer = () => {
    setMediaViewerOpen(false);
    setViewedMedia(null);
  };
  
  // Grid View
  const GridView = () => (
    <Grid container spacing={1}>
      {mediaItems.map((media) => (
        <Grid item xs={6} sm={4} md={4} lg={3} key={media._id}>
          <Card 
            sx={{ 
              cursor: 'pointer',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              transition: 'transform 0.2s, box-shadow 0.2s',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: 6
              },
              ...(selectedMedia?._id === media._id ? {
                border: `2px solid ${theme.palette.primary.contrastText}`,
                boxShadow: 4
              } : {})
            }}
            onClick={() => onMediaSelect(media)}
          >
            <Box sx={{ position: 'relative', paddingTop: '75%' }}>
              {media.type === "image" ? (
                <Box
                  sx={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    cursor: 'zoom-in'
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleOpenMediaViewer(media, e);
                  }}
                >
                  <CardMedia
                    component="img"
                    sx={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover'
                    }}
                    image={media.url}
                    alt={media.name}
                  />
                </Box>
              ) : media.type === "video" ? (
                <Box 
                  sx={{ 
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    bgcolor: 'rgba(0,0,0,0.1)',
                    overflow: 'hidden'
                  }}
                >
                  {/* Video thumbnail with play icon overlay */}
                  <Box 
                    component="img"
                    src={`https://res.cloudinary.com/${process.env.REACT_APP_CLOUDINARY_NAME}/video/upload/c_scale,w_600,q_auto,so_0/f_jpg/${media.url.split('/').pop().split('.')[0]}`}
                    alt={media.name}
                    sx={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover'
                    }}
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.nextSibling.style.display = 'flex';
                    }}
                  />
                  <Box 
                    sx={{ 
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: '100%',
                      display: 'none',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <MovieIcon sx={{ fontSize: 60, color: 'rgba(0,0,0,0.3)' }} />
                  </Box>
                  {/* Play button overlay */}
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
                      bgcolor: 'rgba(0,0,0,0.2)',
                      opacity: 0.8,
                      transition: 'opacity 0.2s',
                      '&:hover': {
                        opacity: 1,
                        cursor: 'pointer'
                      },
                      zIndex: 2
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenMediaViewer(media, e);
                    }}
                  >
                    <PlayArrowIcon sx={{ color: 'white', fontSize: 48 }} />
                  </Box>
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
                    justifyContent: 'center',
                    bgcolor: 'rgba(0,0,0,0.05)'
                  }}
                >
                  {getMediaTypeIcon(media.type)}
                </Box>
              )}
              
              <Chip
                label={media.type}
                size="small"
                sx={{
                  position: 'absolute',
                  top: 8,
                  left: 8,
                  bgcolor: 'rgba(255,255,255,0.8)',
                  '& .MuiChip-label': {
                    px: 1,
                  }
                }}
                icon={getMediaTypeIcon(media.type)}
              />
              
              {media.isPinned && (
                <Tooltip title="Pinned">
                  <StarIcon 
                    sx={{
                      position: 'absolute',
                      top: 8,
                      right: 8,
                      color: theme.palette.warning.main
                    }}
                  />
                </Tooltip>
              )}
            </Box>
            
            <CardContent sx={{ flexGrow: 1, p: 1, pb: 1 }}>
              <Typography variant="subtitle2" noWrap>
                {media.name}
              </Typography>
            </CardContent>
            
            {!selectorMode && (
              <CardActions sx={{ justifyContent: 'space-between', p: 0.5 }}>
                <Box>
                  <Tooltip title="Preview">
                    <IconButton size="small" onClick={(e) => {
                      e.stopPropagation();
                      window.open(media.url, '_blank');
                    }}>
                      <VisibilityIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Download">
                    <IconButton size="small" component="a" href={media.url} download target="_blank" onClick={(e) => e.stopPropagation()}>
                      <CloudDownloadIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Box>
                
                <Tooltip title="Delete">
                  <IconButton 
                    size="small" 
                    color="error"
                    onClick={(e) => {
                      e.stopPropagation();
                      onMediaDelete(media._id);
                    }}
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </CardActions>
            )}
          </Card>
        </Grid>
      ))}
      
      {mediaItems.length === 0 && (
        <Grid item xs={12}>
          <Box 
            sx={{ 
              py: 10, 
              display: 'flex', 
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'text.secondary'
            }}
          >
            <InsertDriveFileIcon sx={{ fontSize: 60, mb: 2, opacity: 0.3 }} />
            <Typography variant="h6">No media found</Typography>
            <Typography variant="body2">
              Upload some files or change your search criteria
            </Typography>
          </Box>
        </Grid>
      )}
    </Grid>
  );
  
  // List View
  const ListView = () => (
    <TableContainer component={Paper} sx={{ borderRadius: 2, boxShadow: 1 }}>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell padding="checkbox"></TableCell>
            <TableCell>Name</TableCell>
            <TableCell>Type</TableCell>
            <TableCell>Date</TableCell>
            {!selectorMode && <TableCell align="right">Actions</TableCell>}
          </TableRow>
        </TableHead>
        <TableBody>
          {mediaItems.map((media) => (
            <TableRow 
              key={media._id}
              hover
              selected={selectedMedia?._id === media._id}
              onClick={() => onMediaSelect(media)}
              sx={{ cursor: 'pointer' }}
            >
              <TableCell padding="checkbox">
                {media.isPinned ? (
                  <StarIcon fontSize="small" color="warning" />
                ) : (
                  <StarBorderIcon fontSize="small" color="action" sx={{ opacity: 0.3 }} />
                )}
              </TableCell>
              <TableCell>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  {media.type === "video" ? (
                    <Box sx={{ position: 'relative', mr: 1 }}>
                      {getMediaTypeIcon(media.type)}
                      <IconButton 
                        size="small" 
                        sx={{ 
                          position: 'absolute', 
                          top: -4, 
                          right: -4, 
                          background: 'rgba(0,0,0,0.1)',
                          p: 0.3
                        }}
                        onClick={(e) => handleOpenMediaViewer(media, e)}
                      >
                        <PlayArrowIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  ) : media.type === "image" ? (
                    <Box sx={{ position: 'relative', mr: 1 }}>
                      {getMediaTypeIcon(media.type)}
                      <IconButton 
                        size="small" 
                        sx={{ 
                          position: 'absolute', 
                          top: -4, 
                          right: -4, 
                          background: 'rgba(0,0,0,0.1)',
                          p: 0.3
                        }}
                        onClick={(e) => handleOpenMediaViewer(media, e)}
                      >
                        <VisibilityIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  ) : (
                    getMediaTypeIcon(media.type)
                  )}
                  <Typography sx={{ ml: 1 }} variant="body2">
                    {media.name}
                  </Typography>
                </Box>
              </TableCell>
              <TableCell>{media.type}</TableCell>
              <TableCell>
                {media.createdAt ? format(new Date(media.createdAt), 'MMM d, yyyy') : 'Unknown'}
              </TableCell>
              {!selectorMode && (
                <TableCell align="right">
                  <Tooltip title="Preview">
                    <IconButton size="small" onClick={(e) => {
                      e.stopPropagation();
                      window.open(media.url, '_blank');
                    }}>
                      <VisibilityIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Download">
                    <IconButton size="small" component="a" href={media.url} download target="_blank" onClick={(e) => e.stopPropagation()}>
                      <CloudDownloadIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Delete">
                    <IconButton 
                      size="small" 
                      color="error"
                      onClick={(e) => {
                        e.stopPropagation();
                        onMediaDelete(media._id);
                      }}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              )}
            </TableRow>
          ))}
          
          {mediaItems.length === 0 && (
            <TableRow>
              <TableCell colSpan={selectorMode ? 5 : 6} align="center" sx={{ py: 5 }}>
                <Box 
                  sx={{ 
                    display: 'flex', 
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'text.secondary'
                  }}
                >
                  <InsertDriveFileIcon sx={{ fontSize: 40, mb: 1, opacity: 0.3 }} />
                  <Typography variant="body1">No media found</Typography>
                </Box>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );
  
  // Media Viewer Dialog
  const MediaViewerDialog = () => (
    <Dialog
      open={mediaViewerOpen}
      onClose={handleCloseMediaViewer}
      maxWidth="lg"
      fullWidth
    >
      <DialogTitle>
        {viewedMedia?.name}
        <IconButton
          aria-label="close"
          onClick={handleCloseMediaViewer}
          sx={{ position: 'absolute', right: 8, top: 8 }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent sx={{ p: 1, display: 'flex', justifyContent: 'center', overflow: 'hidden' }}>
        {viewedMedia?.type === "video" ? (
          <Box component="video" 
            controls 
            autoPlay
            sx={{ maxWidth: '100%', maxHeight: 'calc(100vh - 200px)' }}
            src={viewedMedia.url}
          />
        ) : viewedMedia?.type === "image" ? (
          <Box 
            component="img" 
            src={viewedMedia.url} 
            alt={viewedMedia.name}
            sx={{ maxWidth: '100%', maxHeight: 'calc(100vh - 200px)' }}
          />
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 4 }}>
            {getMediaTypeIcon(viewedMedia?.type)}
            <Typography variant="body1" sx={{ mt: 2 }}>
              Preview not available. <a href={viewedMedia?.url} target="_blank" rel="noopener noreferrer">Open file</a>
            </Typography>
          </Box>
        )}
      </DialogContent>
    </Dialog>
  );
  
  return (
    <Box sx={{ width: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Media Content */}
      <Box sx={{ flexGrow: 1, width: '100%', mb: 2 }}>
        {viewMode === "grid" ? <GridView /> : <ListView />}
      </Box>
      
      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', pt: 2 }}>
          <Pagination 
            count={pagination.totalPages}
            page={pagination.currentPage}
            onChange={onPageChange}
            color="primary.contrastText"
            showFirstButton
            showLastButton
          />
        </Box>
      )}
      
      {/* Media Viewer Dialog */}
      <MediaViewerDialog />
    </Box>
  );
};

export default MediaLibrary; 