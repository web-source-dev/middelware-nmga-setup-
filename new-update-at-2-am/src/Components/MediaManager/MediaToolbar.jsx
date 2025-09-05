import React, { useState } from "react";
import {
  Box,
  TextField,
  Button,
  IconButton,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Tooltip,
  InputAdornment,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Stack,
  Typography,
  Divider
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import FilterListIcon from "@mui/icons-material/FilterList";
import GridViewIcon from "@mui/icons-material/GridView";
import ViewListIcon from "@mui/icons-material/ViewList";
import SortIcon from "@mui/icons-material/Sort";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import CreateNewFolderIcon from "@mui/icons-material/CreateNewFolder";
import ImageIcon from "@mui/icons-material/Image";
import VideoLibraryIcon from "@mui/icons-material/VideoLibrary";
import FolderIcon from "@mui/icons-material/Folder";
import DescriptionIcon from "@mui/icons-material/Description";

const MediaToolbar = ({
  onSearch,
  searchValue,
  onFilterChange,
  filterValue,
  onSortChange,
  sortValue,
  onSortOrderChange,
  sortOrderValue,
  onViewModeChange,
  viewModeValue,
  onUploadClick,
  onCreateFolder,
  stats,
  selectorMode = false
}) => {
  const [newFolderDialogOpen, setNewFolderDialogOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");

  const handleCreateFolder = () => {
    if (newFolderName.trim()) {
      onCreateFolder(newFolderName.trim());
      setNewFolderName("");
      setNewFolderDialogOpen(false);
    }
  };

  return (
    <Box sx={{ 
      p: { xs: 1, sm: 2 }, 
      display: "flex", 
      alignItems: "center", 
      flexWrap: "wrap", 
      gap: { xs: 1, sm: 2 }
    }}>
      {/* Left side: Statistics */}
      {!selectorMode && (
        <Stack 
          direction="row" 
          spacing={{ xs: 1, sm: 2 }} 
          sx={{ 
            display: { xs: 'none', sm: 'none', md: 'flex' } 
          }}
        >
          <Tooltip title="Total Files">
            <Chip
              icon={<FolderIcon />}
              label={`${stats.total} files`}
              variant="outlined"
              color="primary.contrastText"
              size="small"
            />
          </Tooltip>
          
          <Tooltip title="Images">
            <Chip
              icon={<ImageIcon />}
              label={`${stats.images}`}
              variant="outlined"
              color="success"
              size="small"
            />
          </Tooltip>
          
          <Tooltip title="Videos">
            <Chip
              icon={<VideoLibraryIcon />}
              label={`${stats.videos}`}
              variant="outlined"
              color="error"
              size="small"
            />
          </Tooltip>
          
          <Tooltip title="Documents">
            <Chip
              icon={<DescriptionIcon />}
              label={`${stats.documents}`}
              variant="outlined"
              color="warning"
              size="small"
            />
          </Tooltip>
        </Stack>
      )}

      {/* Search Field */}
      <TextField
        placeholder="Search media..."
        value={searchValue}
        onChange={(e) => onSearch(e.target.value)}
        size="small"
        sx={{ 
          flexGrow: 1, 
          maxWidth: { xs: '100%', sm: 300 },
          minWidth: { xs: '100%', sm: 'auto' },
          mb: { xs: 1, sm: 0 },
          order: { xs: -1, sm: 0 }  // Make search full-width at top on mobile
        }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon />
            </InputAdornment>
          ),
        }}
      />

      {/* Filter Dropdown */}
      <FormControl 
        size="small" 
        sx={{ 
          minWidth: { xs: '48%', sm: 120 }
        }}
      >
        <InputLabel id="media-filter-label">Filter</InputLabel>
        <Select
          labelId="media-filter-label"
          value={filterValue}
          onChange={(e) => onFilterChange(e.target.value)}
          label="Filter"
        >
          <MenuItem value="all">All Files</MenuItem>
          <MenuItem value="image">Images</MenuItem>
          <MenuItem value="video">Videos</MenuItem>
        </Select>
      </FormControl>

      {/* Sort Order Toggle */}
      <Tooltip title={sortOrderValue === "asc" ? "Ascending" : "Descending"}>
        <Button
          size="small"
          variant="outlined"
          onClick={() => onSortOrderChange(sortOrderValue === "asc" ? "desc" : "asc")}
          sx={{ 
            minWidth: 40, 
            px: 1,
            display: { xs: 'none', sm: 'inline-flex' }
          }}
        >
          {sortOrderValue === "asc" ? "A→Z" : "Z→A"}
        </Button>
      </Tooltip>

      {/* View Mode Toggle */}
      <Box sx={{ display: 'flex', ml: 'auto' }}>
        <Tooltip title="Grid View">
          <IconButton
            color={viewModeValue === "grid" ? "primary.contrastText" : "default"}
            onClick={() => onViewModeChange("grid")}
            size="small"
          >
            <GridViewIcon />
          </IconButton>
        </Tooltip>
        <Tooltip title="List View">
          <IconButton
            color={viewModeValue === "list" ? "primary.contrastText" : "default"}
            onClick={() => onViewModeChange("list")}
            size="small"
          >
            <ViewListIcon />
          </IconButton>
        </Tooltip>
      </Box>

      {/* New Folder Button - Only in non-selector mode */}
      {!selectorMode && (
        <Button
          variant="outlined"
          startIcon={<CreateNewFolderIcon color="primary.contrastText" />}
          onClick={() => setNewFolderDialogOpen(true)}
          size="small"
          color="primary.contrastText"
          sx={{ 
            display: { xs: 'none', sm: 'inline-flex' } 
          }}
        >
          New Folder
        </Button>
      )}

      {/* Mobile-only new folder button */}
      {!selectorMode && (
        <Tooltip title="New Folder">
          <IconButton
            onClick={() => setNewFolderDialogOpen(true)}
            sx={{ 
              display: { xs: 'inline-flex', sm: 'none' } 
            }}
            size="small"
          >
            <CreateNewFolderIcon />
          </IconButton>
        </Tooltip>
      )}

      {/* New Folder Dialog */}
      <Dialog open={newFolderDialogOpen} onClose={() => setNewFolderDialogOpen(false)}>
        <DialogTitle>Create New Folder</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Folder Name"
            type="text"
            fullWidth
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setNewFolderDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleCreateFolder} variant="contained" disabled={!newFolderName.trim()}>
            Create
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default MediaToolbar; 