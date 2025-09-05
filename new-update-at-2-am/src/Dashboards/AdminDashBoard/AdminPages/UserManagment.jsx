import React, { useEffect, useState } from 'react';
import { Container, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Button, TextField, MenuItem,InputAdornment,Divider, InputLabel, Grid, IconButton, Menu, Chip, Pagination, TablePagination, Box, Collapse, Badge } from '@mui/material';
import { Block, Search, Clear, MoreVert, LockOpen, Login, Visibility, FilterAlt, ExpandMore, ExpandLess, Add } from '@mui/icons-material';
import api from '../../../services/api';
import { useAuth } from '../../../middleware/auth';
import 'jspdf-autotable';
import Toast from '../../../Components/Toast/Toast';
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import AddUsers from '../../DashBoardComponents/AddUsers';
import { useNavigate } from 'react-router-dom';
import { FilterTextField, FilterSelect, FilterFormControl } from '../../DashBoardComponents/FilterStyles';
import {
  ContentContainer,
  FilterContainer,
} from '../../DashBoardComponents/StyledComponents';
import { TableSkeleton } from '../../../Components/Skeletons/LoadingSkeletons';

const UserManagment = () => {
  const { currentUserId } = useAuth();
  const [users, setUsers] = useState([]);
  const [filter, setFilter] = useState({ role: '', isBlocked: '', search: '', sort: '', dateRange: [null, null] });
  const [menuAnchorEl, setMenuAnchorEl] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [toast, setToast] = useState({ open: false, message: '', severity: 'success' });
  const [openAddUser, setOpenAddUser] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [showFilters, setShowFilters] = useState(false);
  const [activeFilters, setActiveFilters] = useState(0);
  const [loading, setLoading] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const navigate = useNavigate();

  const showToast = (message, severity = 'success') => {
    setToast({ open: true, message, severity });
  };

  const handleCloseToast = () => {
    setToast({ ...toast, open: false });
  };

  const handleOpenAddUser = () => {
    setOpenAddUser(true);
  };

  const handleCloseAddUser = () => {
    setOpenAddUser(false);
  };

  const refreshUsers = async () => {
    try {
      setLoading(true);
      const response = await api.get('/auth/users');
      setUsers(response.data.users);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshUsers();
  }, []);

  useEffect(() => {
    const count = Object.values(filter).filter(value => 
      value !== '' && value !== null && 
      !(Array.isArray(value) && value.every(v => v === null))
    ).length;
    setActiveFilters(count);
  }, [filter]);

  const handleBlockUser = async (userId) => {
    try {
      const response = await api.post('/auth/block-user', { userId });
      setUsers(users.map(user => user._id === userId ? { ...user, isBlocked: true } : user));
      showToast(response.data.message, 'success');
      handleMenuClose();
    } catch (error) {
      console.error('Error blocking user:', error);
      showToast(error.response?.data?.message || 'Error blocking user', 'error');
    }
  };

  const handleUnblockUser = async (userId) => {
    try {
      const response = await api.post('/auth/unblock-user', { userId });
      setUsers(users.map(user => user._id === userId ? { ...user, isBlocked: false } : user));
      showToast(response.data.message, 'success');
      handleMenuClose();
    } catch (error) {
      console.error('Error unblocking user:', error);
      showToast(error.response?.data?.message || 'Error unblocking user', 'error');
    }
  };

  const handleLoginAsUser = async (email, loginKey) => {
    try {
      // Save the current admin token before switching
      const currentToken = localStorage.getItem('token');
      if (currentToken) {
        localStorage.setItem('adminToken', currentToken);
      }

      const response = await api.post('/auth/login', { 
        email, 
        login_key: loginKey,
        adminId: currentUserId
      });
      
      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
        showToast(response.data.message, 'success');
        
        // Redirect based on user role
        switch (response.data.user.role) {
          case 'member':
            window.location.href = '/dashboard/co-op-member';
            break;
          case 'distributor':
            window.location.href = '/dashboard/distributor';
            break;
          case 'admin':
            window.location.href = '/dashboard/admin';
            break;
          default:
            break;
        }
      }
      handleMenuClose();
    } catch (error) {
      console.error('Error logging in as user:', error);
      showToast(error.response?.data?.message || 'Error logging in as user', 'error');
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilter({ ...filter, [name]: value });
  };

  const handleDateChange = (date, index) => {
    const newDateRange = [...filter.dateRange];
    newDateRange[index] = date;
    setFilter({ ...filter, dateRange: newDateRange });
  };

  const handleClearFilters = () => {
    setFilter({ role: '', isBlocked: '', search: '', sort: '', dateRange: [null, null] });
  };

  const handleViewUser = (userId) => {
    navigate(`/dashboard/admin/user-profile-view/${userId}`);
    handleMenuClose();
  };

  const handleMenuClick = (event, user) => {
    setMenuAnchorEl(event.currentTarget);
    setSelectedUser(user);
  };

  const handleMenuClose = () => {
    setMenuAnchorEl(null);
    setSelectedUser(null);
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const filteredUsers = users
    .filter(user => {
      return (
        (filter.role ? user.role === filter.role : true) &&
        (filter.isBlocked ? user.isBlocked.toString() === filter.isBlocked : true) &&
        (filter.search ? user.name.toLowerCase().includes(filter.search.toLowerCase()) || user.email.toLowerCase().includes(filter.search.toLowerCase()) : true) &&
        (filter.dateRange[0] ? new Date(user.createdAt) >= filter.dateRange[0] : true) &&
        (filter.dateRange[1] ? new Date(user.createdAt) <= filter.dateRange[1] : true)
      );
    })
    .sort((a, b) => {
      if (filter.sort === 'asc') {
        return new Date(a.createdAt) - new Date(b.createdAt);
      } else if (filter.sort === 'desc') {
        return new Date(b.createdAt) - new Date(a.createdAt);
      } else {
        return 0;
      }
    });

  const paginatedUsers = filteredUsers.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  if (loading) {
    return <TableSkeleton columnsNum={8} />;
  }

  return (
    <Container maxWidth="xl" sx={{ overflowX: 'hidden', mt: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        User Management
      </Typography>

      <Box sx={{ display: 'flex', gap: 2 }}>
        
        <Button
          variant="contained"
          color="primary.main"
          onClick={handleOpenAddUser}
          sx={{bgcolor:"primary.main",mb: 2  ,borderRadius: '50%', width: '40px', height: '50px'}}
        >
          <Add color='primary.contrastText' />
        </Button>
      </Box>
      </Box>

      <ContentContainer sx={{boxShadow: 'none' ,border:'1px solid',borderColor: 'primary.contrastText' }}>
        <Paper sx={{ mb: 3, p: 2}}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Button
              onClick={() => setShowFilters(!showFilters)}
              startIcon={<FilterAlt color="primary.contrastText" />}
              endIcon={showFilters ? <ExpandLess color="primary.contrastText" /> : <ExpandMore color="primary.contrastText" />}
              color="primary.contrastText"
            >
              <Badge badgeContent={activeFilters} color="primary.contrastText" sx={{ mr: 1 }}>
                Filters
              </Badge>
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
                      {['All Users', 'Members Only', 'Distributors Only', 'Blocked Users', 'Active Users'].map((label) => (
                        <Chip
                          key={label}
                          label={label}
                          onClick={() => {
                            if (label === 'Members Only') {
                              setFilter(prev => ({ ...prev, role: 'member' }));
                            } else if (label === 'Distributors Only') {
                              setFilter(prev => ({ ...prev, role: 'distributor' }));
                            } else if (label === 'Blocked Users') {
                              setFilter(prev => ({ ...prev, isBlocked: 'true' }));
                            } else if (label === 'Active Users') {
                              setFilter(prev => ({ ...prev, isBlocked: 'false' }));
                            } else {
                              handleClearFilters();
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
                    label="Search Users"
                    name="search"
                    value={filter.search}
                    onChange={handleFilterChange}
                    fullWidth
                    placeholder="Search by name or email..."
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
                    <InputLabel>User Role</InputLabel>
                    <FilterSelect
                      value={filter.role}
                      onChange={handleFilterChange}
                      label="User Role"
                      name="role"
                    >
                      <MenuItem value=""><em>All Roles</em></MenuItem>
                      <MenuItem value="member">Member</MenuItem>
                      <MenuItem value="distributor">Distributor</MenuItem>
                      <MenuItem value="admin">Admin</MenuItem>
                    </FilterSelect>
                  </FilterFormControl>
                </Grid>

                <Grid item xs={12} sm={6} md={4}>
                  <FilterFormControl fullWidth>
                    <InputLabel>User Status</InputLabel>
                    <FilterSelect
                      value={filter.isBlocked}
                      onChange={handleFilterChange}
                      label="User Status"
                      name="isBlocked"
                    >
                      <MenuItem value=""><em>All Status</em></MenuItem>
                      <MenuItem value="true">Blocked</MenuItem>
                      <MenuItem value="false">Active</MenuItem>
                    </FilterSelect>
                  </FilterFormControl>
                </Grid>

                <Grid item xs={12}>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 2 }}>
                    Registration Date Range
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6} md={4}>
                      <TextField
                        type="date"
                        label="From Date"
                        value={filter.dateRange[0] ? filter.dateRange[0].toISOString().split('T')[0] : ''}
                        onChange={(e) => handleDateChange(new Date(e.target.value), 0)}
                        InputLabelProps={{ shrink: true }}
                        fullWidth
                        sx={{ 
                          '& .MuiInputBase-root': {
                            height: '40px'
                          },
                          '& .MuiOutlinedInput-input': {
                            padding: '8px 14px'
                          }
                        }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6} md={4}>
                      <TextField
                        type="date"
                        label="To Date"
                        value={filter.dateRange[1] ? filter.dateRange[1].toISOString().split('T')[0] : ''}
                        onChange={(e) => handleDateChange(new Date(e.target.value), 1)}
                        InputLabelProps={{ shrink: true }}
                        fullWidth
                        sx={{ 
                          '& .MuiInputBase-root': {
                            height: '40px'
                          },
                          '& .MuiOutlinedInput-input': {
                            padding: '8px 14px'
                          }
                        }}
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
            {filter.role && (
              <Chip
                label={`Role: ${filter.role}`}
                onDelete={() => setFilter(prev => ({ ...prev, role: '' }))}
                color="primary"
                variant="outlined"
              />
            )}
            {filter.isBlocked && (
              <Chip
                label={`Status: ${filter.isBlocked === 'true' ? 'Blocked' : 'Active'}`}
                onDelete={() => setFilter(prev => ({ ...prev, isBlocked: '' }))}
                color="primary"
                variant="outlined"
              />
            )}
            {filter.search && (
              <Chip
                label={`Search: ${filter.search}`}
                onDelete={() => setFilter(prev => ({ ...prev, search: '' }))}
                color="primary"
                variant="outlined"
              />
            )}
          </Box>
        )}

        <div style={{ overflowX: 'auto' }}>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Business Name</TableCell>
                  <TableCell>Role</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {paginatedUsers.map((user) => (
                  <TableRow key={user._id}>
                    <TableCell>{user.name}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>{user.businessName}</TableCell>
                    <TableCell>{user.role}</TableCell>
                    <TableCell>
                      {user.isBlocked ? (
                        <Chip label="Blocked" sx={{ bgcolor: 'rgba(255, 0, 0, 0.1)', color: 'red' }} />
                      ) : (
                        <Chip label="Active" sx={{ bgcolor: 'rgba(0, 255, 0, 0.1)', color: 'green' }} />
                      )}
                    </TableCell>
                    <TableCell>
                      <IconButton onClick={(event) => handleMenuClick(event, user)}>
                        <MoreVert color="primary.contrastText" />
                      </IconButton>
                      <Menu
                        anchorEl={menuAnchorEl}
                        open={Boolean(menuAnchorEl)}
                        onClose={handleMenuClose}
                        color="primary.contrastText"
                        anchorOrigin={{
                          vertical: 'top',
                          horizontal: 'left',
                        }}
                        transformOrigin={{
                          vertical: 'top',
                          horizontal: 'right',
                        }}
                      >
                        <MenuItem onClick={() => handleViewUser(selectedUser._id)}>
                          <Visibility color="primary.contrastText" /> View
                        </MenuItem>
                        {selectedUser?.isBlocked ? (
                          <MenuItem onClick={() => handleUnblockUser(selectedUser._id)}>
                            <LockOpen color="secondary" /> Unblock
                          </MenuItem>
                        ) : (
                          <MenuItem onClick={() => handleBlockUser(selectedUser._id)}>
                            <Block color="error" /> Block
                          </MenuItem>
                        )}
                        {selectedUser?.role !== 'admin' && (
                          <MenuItem onClick={() => handleLoginAsUser(selectedUser.email, selectedUser.login_key)}>
                            <Login  color="primary.contrastText"/> Login as User
                          </MenuItem>
                        )}
                      </Menu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </div>
        <Box sx={{ 
          mt: 3, 
          display: 'flex', 
          justifyContent: 'center',
          alignItems: 'center',
          gap: 2,
          flexWrap: 'wrap',
          bgcolor: 'background.paper',
          p: 2,
          borderRadius: 2,
          boxShadow: '0 0 10px rgba(0,0,0,0.1)'
        }}>
          <TablePagination
            component="div"
            count={filteredUsers.length}
            page={page}
            onPageChange={handleChangePage}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            rowsPerPageOptions={[5, 10, 25, 50]}
            sx={{
              '.MuiTablePagination-select': {
                borderRadius: 1,
                bgcolor: 'primary.main',
                color: 'primary.contrastText',
              },
              '.MuiTablePagination-selectIcon': {
                color: 'primary.contrastText',
              },
            }}
          />
          <Pagination
            count={Math.ceil(filteredUsers.length / rowsPerPage)}
            page={page + 1}
            onChange={(e, p) => setPage(p - 1)}
            color="primary.contrastText"
            size={isMobile ? "small" : "medium"}
            sx={{
              '& .MuiPaginationItem-root': {
                borderRadius: 1,
                '&.Mui-selected': {
                  bgcolor: 'primary.contrastText',
                  color: 'white',
                  '&:hover': {
                    bgcolor: 'primary.contrastText',
                  },
                },
              },
            }}
          />
        </Box>
      </ContentContainer>

      <AddUsers open={openAddUser} handleClose={handleCloseAddUser} refreshUsers={refreshUsers} />
      <Toast open={toast.open} message={toast.message} severity={toast.severity} handleClose={handleCloseToast} />
    </Container>
  );
};

export default UserManagment;