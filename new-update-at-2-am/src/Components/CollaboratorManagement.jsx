import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Grid,
  Divider
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  PersonAdd as PersonAddIcon,
  Security as SecurityIcon
} from '@mui/icons-material';
import api from '../services/api';
import { useAuth } from '../middleware/auth';

const CollaboratorManagement = () => {
  const { 
    currentUserId, 
    userRole, 
    isCollaborator, 
    isAdmin 
  } = useAuth();

  // Check if user can perform actions (manage collaborators)
  const canPerformActions = () => {
    // Main account owner (not a collaborator)
    if (!isCollaborator) return true;
    
    // Admin (with or without impersonating)
    if (isAdmin) return true;
    
    // All other collaborators cannot perform actions
    return false;
  };
  const [collaborators, setCollaborators] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [editingCollaborator, setEditingCollaborator] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'viewer',
    password: ''
  });

  // Define available roles based on user's role
  const getAvailableRoles = () => {
    const baseRoles = [
      { value: 'viewer', label: 'Viewer', description: 'Read-only access' }
    ];

    if (userRole === 'distributor') {
      return [
        ...baseRoles,
        { value: 'deal_manager', label: 'Deal Manager', description: 'Manage deals and related resources' },
        // { value: 'supplier_manager', label: 'Supplier Manager', description: 'Add & manage suppliers' },
        // { value: 'media_manager', label: 'Media Manager', description: 'Handle assets and media' },
        { value: 'manager', label: 'Account Admin', description: 'Full control of the account' }
      ];
    } else if (userRole === 'member') {
      return [
        ...baseRoles,
        { value: 'commitment_manager', label: 'Commitment Manager', description: 'Manage commitments' },
        // { value: 'substore_manager', label: 'Substore Manager', description: 'Manage sub-stores' },
        { value: 'manager', label: 'Account Admin', description: 'Full control of the account' }
      ];
    }

    return baseRoles;
  };

  const availableRoles = getAvailableRoles();

  useEffect(() => {
    fetchCollaborators();
  }, []);

  const fetchCollaborators = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/collaborators');
      setCollaborators(response.data);
    } catch (error) {
      console.error('Error fetching collaborators:', error);
      setError('Failed to fetch collaborators');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setError('');
      setSuccess('');

      if (editingCollaborator) {
        // Update existing collaborator
        await api.put(`/api/collaborators/${editingCollaborator._id}`, formData);
        setSuccess('Collaborator updated successfully');
      } else {
        // Add new collaborator
        await api.post('/api/collaborators', formData);
        setSuccess('Collaborator added successfully');
      }

      setOpenDialog(false);
      setFormData({ name: '', email: '', role: 'viewer', password: '' });
      setEditingCollaborator(null);
      fetchCollaborators();
    } catch (error) {
      console.error('Error saving collaborator:', error);
      setError(error.response?.data?.message || 'Failed to save collaborator');
    }
  };

  const handleEdit = (collaborator) => {
    setEditingCollaborator(collaborator);
    setFormData({
      name: collaborator.name,
      email: collaborator.email,
      role: collaborator.role,
      password: '' // Don't pre-fill password for security
    });
    setOpenDialog(true);
  };

  const handleDelete = async (collaboratorId) => {
    if (window.confirm('Are you sure you want to delete this collaborator?')) {
      try {
        await api.delete(`/api/collaborators/${collaboratorId}`);
        setSuccess('Collaborator deleted successfully');
        fetchCollaborators();
      } catch (error) {
        console.error('Error deleting collaborator:', error);
        setError('Failed to delete collaborator');
      }
    }
  };

  const handleActivate = async (collaboratorId) => {
    try {
      await api.patch(`/api/collaborators/${collaboratorId}/activate`);
      setSuccess('Collaborator activated successfully');
      fetchCollaborators();
    } catch (error) {
      console.error('Error activating collaborator:', error);
      setError('Failed to activate collaborator');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'success';
      case 'invited': return 'warning';
      case 'accepted': return 'info';
      case 'restricted': return 'error';
      case 'deleted': return 'default';
      default: return 'default';
    }
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'manager': return 'error';
      case 'deal_manager': return 'primary';
      case 'supplier_manager': return 'secondary';
      case 'media_manager': return 'info';
      case 'commitment_manager': return 'warning';
      case 'substore_manager': return 'success';
      case 'viewer': return 'default';
      default: return 'default';
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <Typography>Loading collaborators...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h4" component="h1" gutterBottom>
            <SecurityIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
            Staff Management
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Manage staff and their access levels for your account
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setOpenDialog(true)}
          disabled={!canPerformActions()}
          sx={{ minWidth: 150 }}
        >
          Add Staff
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>
          {success}
        </Alert>
      )}

      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Current Staff ({collaborators.length})
          </Typography>
          
          {collaborators.length === 0 ? (
            <Box textAlign="center" py={4}>
              <PersonAddIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No staff yet
              </Typography>
              <Typography variant="body2" color="text.secondary" mb={2}>
                Add staff to help manage your account
              </Typography>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => setOpenDialog(true)}
                disabled={!canPerformActions()}
              >
                Add Your First Staff
              </Button>
            </Box>
          ) : (
            <TableContainer component={Paper} variant="outlined">
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Name</TableCell>
                    <TableCell>Email</TableCell>
                    <TableCell>Role</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {collaborators.map((collaborator, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        <Typography variant="body2" fontWeight="medium">
                          {collaborator.name}
                        </Typography>
                      </TableCell>
                      <TableCell>{collaborator.email}</TableCell>
                      <TableCell>
                        <Chip
                          label={availableRoles.find(r => r.value === collaborator.role)?.label || collaborator.role}
                          color={getRoleColor(collaborator.role)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={collaborator.status}
                          color={getStatusColor(collaborator.status)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        {collaborator.status === 'invited' && (
                          <Button
                            size="small"
                            variant="outlined"
                            color="success"
                            onClick={() => handleActivate(collaborator._id)}
                            disabled={!canPerformActions()}
                            sx={{ mr: 1 }}
                          >
                            Activate
                          </Button>
                        )}
                        <IconButton
                          size="small"
                          onClick={() => handleEdit(collaborator)}
                          disabled={!canPerformActions()}
                          color="primary"
                        >
                          <EditIcon />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => handleDelete(collaborator._id)}
                          disabled={!canPerformActions()}
                          color="error"
                        >
                          <DeleteIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Collaborator Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingCollaborator ? 'Edit Staff' : 'Add New Staff'}
        </DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Full Name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  margin="normal"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Email Address"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  margin="normal"
                  helperText="Must be unique and not already registered"
                />
              </Grid>
              <Grid item xs={12}>
                <FormControl fullWidth margin="normal">
                  <InputLabel>Role</InputLabel>
                  <Select
                    name="role"
                    value={formData.role}
                    onChange={handleInputChange}
                    label="Role"
                    required
                  >
                    {availableRoles.map((role) => (
                      <MenuItem key={role.value} value={role.value}>
                        <Box>
                          <Typography variant="body2" fontWeight="medium">
                            {role.label}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {role.description}
                          </Typography>
                        </Box>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Password"
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  required={!editingCollaborator}
                  margin="normal"
                  helperText={editingCollaborator ? "Leave blank to keep current password" : "Minimum 6 characters"}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
            <Button type="submit" variant="contained">
              {editingCollaborator ? 'Update' : 'Add'} Staff
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
};

export default CollaboratorManagement;
