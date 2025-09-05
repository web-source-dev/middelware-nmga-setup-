import React, { useEffect, useState } from 'react';
import api from '../../../services/api';
import AddAnnouncement from '../../DashBoardComponents/AddAnouncment';
import Toast from '../../../Components/Toast/Toast';
import { Button, Skeleton,TextField, List, Collapse,InputAdornment, IconButton, Typography, Dialog, DialogActions, DialogContent, DialogTitle, Paper, Grid, Box, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Card, CardContent, CardActions, Container, MenuItem, InputLabel, Chip, Switch,Tooltip, Pagination, TablePagination, Avatar, Divider } from '@mui/material';
import { Edit, Delete,ToggleOn, ViewList, ViewModule, Search, Clear, FilterAlt, ExpandMore, ExpandLess, Add, Assessment, PriorityHigh, Event } from '@mui/icons-material';
import useMediaQuery from '@mui/material/useMediaQuery';
import { TableChart } from '@mui/icons-material';
import 'jspdf-autotable';
import { useTheme } from '@mui/material/styles';
import { FilterTextField, FilterSelect, FilterFormControl } from '../../DashBoardComponents/FilterStyles';
import { 
  DashboardHeader,
  ViewToggleButton,
  StatsCard,
  ContentContainer,
  ActionButtonContainer,
  FilterContainer,
} from '../../DashBoardComponents/StyledComponents';

const AnnouncementsSkeleton = () => (
  <Box sx={{ width: '100%' }}>
    <Skeleton variant="text" sx={{ fontSize: '2rem', mb: 2 }} />
    <Grid container spacing={3}>
      {[...Array(4)].map((_, index) => (
        <Grid item xs={12} md={6} key={index}>
          <Card>
            <CardContent>
              <Skeleton variant="text" sx={{ fontSize: '1.5rem', mb: 1 }} />
              <Skeleton variant="text" count={3} />
              <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                <Skeleton variant="rectangular" width={80} height={32} />
                <Skeleton variant="rectangular" width={80} height={32} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  </Box>
);

const Announcements = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [filter, setFilter] = useState({
    category: '',
    isActive: '',
    search: '',
    sort: '',
    priority: '',
    event: '',
    fromDate: '',
    toDate: '',
    dateRange: ''
  });
  const [anchorEl, setAnchorEl] = useState(null);
  const [showAddPopup, setShowAddPopup] = useState(false);
  const [showEditPopup, setShowEditPopup] = useState(false);
  const [currentAnnouncement, setCurrentAnnouncement] = useState(null);
  const [toast, setToast] = useState({ open: false, message: '', severity: 'success' });
  const [view, setView] = useState('list');
  const isMobile = useMediaQuery('(max-width:600px)');
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('md'));
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [showFilters, setShowFilters] = useState(false);
  const [activeFilters, setActiveFilters] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnnouncements = async () => {
      try {
        const response = await api.get(`/common/announcements/all`);
        setAnnouncements(response.data);
      } catch (error) {
        console.error('Error fetching announcements:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAnnouncements();
  }, []);

  useEffect(() => {
    const count = Object.values(filter).filter(value => value !== '').length;
    setActiveFilters(count);
  }, [filter]);

  const handleAddAnnouncement = async (announcement) => {
    try {
      const response = await api.post(`/common/announcements/create`, announcement);
      setAnnouncements([...announcements, response.data.announcement]);
      setToast({ open: true, message: 'Announcement added successfully', severity: 'success' });
    } catch (error) {
      console.error('Error adding announcement:', error);
      setToast({ open: true, message: 'Error adding announcement', severity: 'error' });
    }
  };

  const handleEditAnnouncement = async (id, updatedAnnouncement) => {
    try {
      const response = await api.put(`/common/announcements/${id}`, updatedAnnouncement);
      setAnnouncements(announcements.map(announcement => announcement._id === id ? response.data.announcement : announcement));
      setShowEditPopup(false);
      setToast({ open: true, message: 'Announcement edited successfully', severity: 'success' });
    } catch (error) {
      console.error('Error editing announcement:', error);
      setToast({ open: true, message: 'Error editing announcement', severity: 'error' });
    }
  };

  const handleDeleteAnnouncement = async (id) => {
    try {
      await api.delete(`/common/announcements/${id}`);
      setAnnouncements(announcements.filter(announcement => announcement._id !== id));
      setToast({ open: true, message: 'Announcement deleted successfully', severity: 'success' });
    } catch (error) {
      console.error('Error deleting announcement:', error);
      setToast({ open: true, message: 'Error deleting announcement', severity: 'error' });
    }
  };

  const handleToggleActive = async (id, isActive) => {
    try {
      const response = await api.patch(`/common/announcements/${id}`, { isActive });
      setAnnouncements(announcements.map(announcement => announcement._id === id ? response.data.announcement : announcement));
      setToast({ open: true, message: `Announcement ${isActive ? 'activated' : 'deactivated'} successfully`, severity: 'success' });
    } catch (error) {
      console.error('Error toggling announcement:', error);
      setToast({ open: true, message: 'Error toggling announcement', severity: 'error' });
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilter({ ...filter, [name]: value });
  };

  const handleClearFilters = () => {
    setFilter({ category: '', isActive: '', search: '', sort: '', priority: '', event: '', fromDate: '', toDate: '', dateRange: '' });
  };

  const handleDownloadClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleDownloadClose = () => {
    setAnchorEl(null);
  };


  const filteredAnnouncements = announcements
    .filter(announcement => {
      return (
        (filter.category ? announcement.category === filter.category : true) &&
        (filter.isActive ? announcement.isActive.toString() === filter.isActive : true) &&
        (filter.search ? announcement.title.toLowerCase().includes(filter.search.toLowerCase()) || announcement.content.toLowerCase().includes(filter.search.toLowerCase()) : true) &&
        (filter.priority ? announcement.priority === filter.priority : true) &&
        (filter.event ? announcement.event === filter.event : true)
      );
    })
    .sort((a, b) => {
      if (filter.sort === 'asc') {
        return new Date(a.startTime) - new Date(b.startTime);
      } else if (filter.sort === 'desc') {
        return new Date(b.startTime) - new Date(a.startTime);
      } else {
        return 0;
      }
    });

  const paginatedAnnouncements = filteredAnnouncements.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  if (loading) {
    return <AnnouncementsSkeleton />;
  }

  return (
    <Container maxWidth='xl' style={{ overflowX: 'hidden'}}>
      <DashboardHeader>
        <Box>
          <Typography variant="h4" fontWeight="bold" gutterBottom>
            All Announcements
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {filteredAnnouncements.length} announcements found
          </Typography>
        </Box>

        <Box display="flex" gap={2}>
          <Button
            variant="contained"
            color="primary"
            onClick={() => setShowAddPopup(true)}
            startIcon={<Add color="primary.contrastText" />}
          >
            Add Announcement
          </Button>
          
          <ActionButtonContainer>
            <ViewToggleButton
              variant={view === 'list' ? 'contained' : 'outlined'}
              onClick={() => setView('list')}
              startIcon={<ViewList color="primary.contrastText" />}
            >
              List View
            </ViewToggleButton>
            <ViewToggleButton
              variant={view === 'grid' ? 'contained' : 'outlined'}
              onClick={() => setView('grid')}
              startIcon={<ViewModule color="primary.contrastText" />}
            >
              Grid View
            </ViewToggleButton>
            <ViewToggleButton
              variant={view === 'table' ? 'contained' : 'outlined'}
              onClick={() => setView('table')}
              startIcon={<TableChart color="primary.contrastText" />}
              disabled={isMobile}
            >
              Table View
            </ViewToggleButton>
          </ActionButtonContainer>
        </Box>
      </DashboardHeader>

      <Grid container spacing={3} sx={{ mb: 10 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatsCard>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Avatar sx={{ bgcolor: 'primary.contrastText' }}>
                <Assessment color="primary.contrastText" />
              </Avatar>
              <Typography variant="h6">Total</Typography>
            </Box>
            <Typography variant="h4">{announcements.length}</Typography>
            <Typography variant="body2" color="text.secondary">
              All announcements
            </Typography>
          </StatsCard>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <StatsCard>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Avatar sx={{ bgcolor: 'success.main' }}>
                <ToggleOn color="primary.contrastText" />
              </Avatar>
              <Typography variant="h6">Active</Typography>
            </Box>
            <Typography variant="h4">
              {announcements.filter(a => a.isActive).length}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Currently active
            </Typography>
          </StatsCard>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <StatsCard>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Avatar sx={{ bgcolor: 'error.main' }}>
                <PriorityHigh color="primary.contrastText" />
              </Avatar>
              <Typography variant="h6">High Priority</Typography>
            </Box>
            <Typography variant="h4" color="error.main">
              {announcements.filter(a => a.priority === 'High').length}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Require attention
            </Typography>
          </StatsCard>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <StatsCard>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Avatar sx={{ bgcolor: 'warning.main' }}>
                <Event color="primary.contrastText" />
              </Avatar>
              <Typography variant="h6">Events</Typography>
            </Box>
            <Typography variant="h4" color="warning.main">
              {announcements.filter(a => a.category === 'event').length}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Upcoming events
            </Typography>
          </StatsCard>
        </Grid>
      </Grid>

      <ContentContainer>
        <Paper sx={{ mb: 3, p: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Button
              onClick={() => setShowFilters(!showFilters)}
              startIcon={<FilterAlt color="primary.contrastText" />}
              endIcon={showFilters ? <ExpandLess color="primary.contrastText" /> : <ExpandMore color="primary.contrastText" />}
              color="primary.contrastText"
            >
              Filters
            </Button>
            {activeFilters > 0 && (
              <Button
                variant="text"
                startIcon={<Clear color="primary.contrastText" />}
                onClick={handleClearFilters}
                size="small"
                color="primary.contrastText"
              >
                Clear All
              </Button>
            )}
          </Box>

          <Collapse in={showFilters}>
            <FilterContainer>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                      Quick Filters
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                      {['Today', 'Last 7 Days', 'Last 30 Days', 'Active', 'High Priority', 'Events'].map((label) => (
                        <Chip
                          key={label}
                          label={label}
                          onClick={() => {
                            if (label === 'Today') {
                              setFilter(prev => ({ ...prev, dateRange: '1' }));
                            } else if (label === 'Last 7 Days') {
                              setFilter(prev => ({ ...prev, dateRange: '7' }));
                            } else if (label === 'Last 30 Days') {
                              setFilter(prev => ({ ...prev, dateRange: '30' }));
                            } else if (label === 'Active') {
                              setFilter(prev => ({ ...prev, isActive: 'true' }));
                            } else if (label === 'High Priority') {
                              setFilter(prev => ({ ...prev, priority: 'High' }));
                            } else if (label === 'Events') {
                              setFilter(prev => ({ ...prev, category: 'event' }));
                            }
                          }}
                          variant="outlined"
                          color="primary.contrastText"
                          sx={{
                            '&:hover': {
                              backgroundColor: 'primary.light',
                              color: 'primary.contrastText'
                            }
                          }}
                        />
                      ))}
                    </Box>
                  </Box>
                </Grid>

                <Grid item xs={12} md={4}>
                  <FilterTextField
                    label="Search Announcements"
                    name="search"
                    value={filter.search}
                    onChange={handleFilterChange}
                    fullWidth
                    placeholder="Search by title or content..."
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Search fontSize="small" color="primary.contrastText" />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>

                <Grid item xs={12} sm={6} md={4}>
                  <FilterFormControl fullWidth>
                    <InputLabel>Category</InputLabel>
                    <FilterSelect
                      value={filter.category}
                      onChange={handleFilterChange}
                      label="Category"
                      name="category"
                    >
                      <MenuItem value=""><em>All Categories</em></MenuItem>
                      <MenuItem value="news">
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'info.main' }} />
                          News
                        </Box>
                      </MenuItem>
                      <MenuItem value="event">
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'warning.main' }} />
                          Event
                        </Box>
                      </MenuItem>
                      <MenuItem value="update">
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'success.main' }} />
                          Update
                        </Box>
                      </MenuItem>
                    </FilterSelect>
                  </FilterFormControl>
                </Grid>

                <Grid item xs={12} sm={6} md={4}>
                  <FilterFormControl fullWidth>
                    <InputLabel>Priority</InputLabel>
                    <FilterSelect
                      value={filter.priority}
                      onChange={handleFilterChange}
                      label="Priority"
                      name="priority"
                    >
                      <MenuItem value=""><em>All Priorities</em></MenuItem>
                      <MenuItem value="High">High</MenuItem>
                      <MenuItem value="Medium">Medium</MenuItem>
                      <MenuItem value="Low">Low</MenuItem>
                    </FilterSelect>
                  </FilterFormControl>
                </Grid>

                <Grid item xs={12}>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 2 }}>
                    Date Range
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6} md={4}>
                      <TextField
                        type="date"
                        label="From Date"
                        sx={{ 
                          '& .MuiInputBase-root': {
                            height: '40px'
                          },
                          '& .MuiOutlinedInput-input': {
                            padding: '8px 14px'
                          }
                        }}
                        value={filter.fromDate}
                        onChange={(e) => handleFilterChange({
                          target: { name: 'fromDate', value: e.target.value }
                        })}
                        InputLabelProps={{ shrink: true }}
                        fullWidth
                      />
                    </Grid>
                    <Grid item xs={12} sm={6} md={4}>
                      <TextField
                        type="date"
                        label="To Date"
                        sx={{ 
                          '& .MuiInputBase-root': {
                            height: '40px'
                          },
                          '& .MuiOutlinedInput-input': {
                            padding: '8px 14px'
                          }
                        }}
                        value={filter.toDate}
                        onChange={(e) => handleFilterChange({
                          target: { name: 'toDate', value: e.target.value }
                        })}
                        InputLabelProps={{ shrink: true }}
                        fullWidth
                      />
                    </Grid>
                  </Grid>
                </Grid>
              </Grid>
            </FilterContainer>
          </Collapse>
        </Paper>

        {activeFilters > 0 && (
          <Box sx={{ mb: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            {filter.category && (
              <Chip
                label={`Category: ${filter.category}`}
                onDelete={() => setFilter(prev => ({ ...prev, category: '' }))}
                color="primary.contrastText"
                variant="outlined"
              />
            )}
            {filter.isActive && (
              <Chip
                label={`Status: ${filter.isActive === 'true' ? 'Active' : 'Inactive'}`}
                onDelete={() => setFilter(prev => ({ ...prev, isActive: '' }))}
                color="primary.contrastText"
                variant="outlined"
              />
            )}
            {filter.priority && (
              <Chip
                label={`Priority: ${filter.priority}`}
                onDelete={() => setFilter(prev => ({ ...prev, priority: '' }))}
                color="primary.contrastText"
                variant="outlined"
              />
            )}
            {filter.search && (
              <Chip
                label={`Search: ${filter.search}`}
                onDelete={() => setFilter(prev => ({ ...prev, search: '' }))}
                color="primary.contrastText"
                variant="outlined"
              />
            )}
          </Box>
        )}

        <div style={{ overflowX: 'auto' }}>
          {view === 'list' && (
            <List sx={{ width: '100%', margin: 'auto' }}>
              {paginatedAnnouncements.map((announcement) => (
                <Card 
                  key={announcement._id} 
                  elevation={4} 
                  sx={{ 
                    margin: '16px 0', 
                    backgroundColor: '#ffffff', 
                    borderRadius: '12px',
                    border: '1px solid #ddd',
                    padding: '12px',
                    boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.1)',
                  }}
                >
                  <CardContent>
                    <Typography variant="h6" color="primary.contrastText" fontWeight="bold">
                      {announcement.title}
                    </Typography>
                    <Typography variant="body1" color="textSecondary" sx={{ marginBottom: '8px' }}>
                      {announcement.content}
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#555', fontSize: '14px' }}>
                      <strong>Category:</strong> {announcement.category} | <strong>Priority:</strong> {announcement.priority} | <strong>Event:</strong> {announcement.event}
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#777', fontSize: '14px', marginTop: '4px' }}>
                      <strong>Start:</strong> {new Date(announcement.startTime).toLocaleString()} | <strong>End:</strong> {new Date(announcement.endTime).toLocaleString()}
                    </Typography>
                  </CardContent>
                  <CardActions sx={{ display: 'flex', justifyContent: 'space-between', padding: '8px 16px' }}>
                    <Switch
                      checked={announcement.isActive}
                      onChange={() => handleToggleActive(announcement._id, !announcement.isActive)}
                      color="primary.contrastText"
                    />
                    <Box>
                      <Tooltip title="Edit">
                        <IconButton 
                          onClick={() => { setCurrentAnnouncement(announcement); setShowEditPopup(true); }}
                          sx={{ color: '#1976d2' }}
                        >
                          <Edit color="primary.contrastText" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton 
                          onClick={() => handleDeleteAnnouncement(announcement._id)} 
                          sx={{ color: '#d32f2f' }}
                        >
                          <Delete color="primary.contrastText" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </CardActions>
                </Card>
              ))}
            </List>
          )}
          {view === 'grid' && (
            <Grid container spacing={3} sx={{ padding: '16px' }}>
              {paginatedAnnouncements.map((announcement) => (
                <Grid item xs={12} sm={6} md={4} key={announcement._id}>
                  <Card 
                    elevation={4} 
                    sx={{ 
                      backgroundColor: '#ffffff', 
                      borderRadius: '12px', 
                      border: '1px solid #ddd',
                      boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.1)',
                      transition: 'transform 0.2s ease-in-out',
                      '&:hover': { transform: 'scale(1.02)' },
                    }}
                  >
                    <CardContent>
                      <Typography 
                        variant="h6" 
                        color="primary.contrastText" 
                        fontWeight="bold" 
                        sx={{ marginBottom: '8px' }}
                      >
                        {announcement.title}
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#444', marginBottom: '8px' }}>
                        {announcement.content}
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#666', fontSize: '14px' }}>
                        <strong>Category:</strong> {announcement.category} | 
                        <strong> Priority:</strong> {announcement.priority} | 
                        <strong> Event:</strong> {announcement.event}
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#777', fontSize: '14px', marginTop: '6px' }}>
                        <strong>Start:</strong> {new Date(announcement.startTime).toLocaleString()} | 
                        <strong> End:</strong> {new Date(announcement.endTime).toLocaleString()}
                      </Typography>
                    </CardContent>
                    <CardActions sx={{ display: 'flex', justifyContent: 'space-between', padding: '8px 16px' }}>
                      <Switch
                        checked={announcement.isActive}
                        onChange={() => handleToggleActive(announcement._id, !announcement.isActive)}
                        color="primary.contrastText"
                      />
                      <Box>
                        <Tooltip title="Edit">
                          <IconButton 
                            onClick={() => { setCurrentAnnouncement(announcement); setShowEditPopup(true); }}
                            sx={{ color: '#1976d2' }}
                          >
                            <Edit color="primary.contrastText" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete">
                          <IconButton 
                            onClick={() => handleDeleteAnnouncement(announcement._id)} 
                            sx={{ color: '#d32f2f' }}
                          >
                            <Delete color="primary.contrastText" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </CardActions>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
          {view === 'table' && (
            <Box sx={{ width: '100%', overflowX: 'auto' }}>
              <TableContainer component={Paper} sx={{ borderRadius: '8px', boxShadow: '0px 2px 10px rgba(0, 0, 0, 0.1)' }}>
                <Table sx={{ minWidth: 800 }} aria-label="Announcements Table">
                  <TableHead>
                    <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                      <TableCell sx={{ fontWeight: 'bold' }}>Title</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Content</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Category</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Priority</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Event</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Start Time</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>End Time</TableCell>
                      <TableCell sx={{ fontWeight: 'bold', textAlign: 'center' }}>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {paginatedAnnouncements.map((announcement) => (
                      <TableRow 
                        key={announcement._id} 
                        sx={{
                          '&:nth-of-type(odd)': { backgroundColor: '#fafafa' },
                          '&:hover': { backgroundColor: '#f0f0f0' },
                          transition: 'background-color 0.2s ease-in-out'
                        }}
                      >
                        <TableCell>{announcement.title}</TableCell>
                        <TableCell sx={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '200px' }}>
                          {announcement.content}
                        </TableCell>
                        <TableCell>{announcement.category}</TableCell>
                        <TableCell>
                          <Chip 
                            label={announcement.priority} 
                            color={announcement.priority === 'High' ? 'error' : 'secondary'} 
                            variant="outlined"
                            sx={{ fontSize: '12px' }}
                          />
                        </TableCell>
                        <TableCell>{announcement.event}</TableCell>
                        <TableCell>{new Date(announcement.startTime).toLocaleString()}</TableCell>
                        <TableCell>{new Date(announcement.endTime).toLocaleString()}</TableCell>
                        <TableCell sx={{ textAlign: 'center' }}>
                          <Switch
                            checked={announcement.isActive}
                            onChange={() => handleToggleActive(announcement._id, !announcement.isActive)}
                            color="primary.contrastText"
                          />
                          <Tooltip title="Edit">
                            <IconButton onClick={() => { setCurrentAnnouncement(announcement); setShowEditPopup(true); }}>
                              <Edit color="primary.contrastText" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete">
                            <IconButton onClick={() => handleDeleteAnnouncement(announcement._id)}>
                              <Delete color="error" />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          )}
        </div>
        <Box sx={{ 
          mt: 3, 
          display: 'flex', 
          justifyContent: 'center',
          alignItems: 'center',
          gap: 2,
          flexWrap: 'wrap'
        }}>
          <TablePagination
            component="div"
            count={filteredAnnouncements.length}
            page={page}
            onPageChange={handleChangePage}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            rowsPerPageOptions={[5, 10, 25, 50]}
            sx={{
              '.MuiTablePagination-select': {
                borderRadius: 1,
                bgcolor: 'background.paper',
              },
              '.MuiTablePagination-selectIcon': {
                color: 'primary.main',
              },
            }}
          />
          <Pagination
            count={Math.ceil(filteredAnnouncements.length / rowsPerPage)}
            page={page + 1}
            onChange={(e, p) => setPage(p - 1)}
            color="primary"
            size={isMobile ? "small" : "medium"}
            sx={{
              '& .MuiPaginationItem-root': {
                borderRadius: 1,
                '&.Mui-selected': {
                  bgcolor: 'primary.main',
                  color: 'white',
                  '&:hover': {
                    bgcolor: 'primary.dark',
                  },
                },
              },
            }}
          />
        </Box>
      </ContentContainer>
      <Dialog open={showAddPopup} onClose={() => setShowAddPopup(false)}>
        <DialogTitle>Add Announcement</DialogTitle>
        <DialogContent>
          <AddAnnouncement onClose={() => setShowAddPopup(false)} onAdd={handleAddAnnouncement} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowAddPopup(false)} color="primary">Close</Button>
        </DialogActions>
      </Dialog>
      <Dialog open={showEditPopup} onClose={() => setShowEditPopup(false)}>
        <DialogTitle>Edit Announcement</DialogTitle>
        <DialogContent>
          {currentAnnouncement && (
            <AddAnnouncement
              onClose={() => setShowEditPopup(false)}
              onAdd={(updatedAnnouncement) => handleEditAnnouncement(currentAnnouncement._id, updatedAnnouncement)}
              initialData={currentAnnouncement}
            />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowEditPopup(false)} color="primary">Close</Button>
        </DialogActions>
      </Dialog>
      <Toast
        open={toast.open}
        message={toast.message}
        severity={toast.severity}
        handleClose={() => setToast({ ...toast, open: false })}
      />
    </Container>
  );
};

export default Announcements;