import React, { useState } from 'react';
import { Dialog, DialogActions, DialogContent, DialogTitle, Button, TextField } from '@mui/material';
import api from '../../services/api';
import Toast from '../../Components/Toast/Toast';
import { MenuItem, Select, FormControl, InputLabel } from '@mui/material';

const AddUsers = ({ open, handleClose, refreshUsers }) => {
  const [userData, setUserData] = useState({ name: '', email: '', role: '', businessName: '' });
  const [toast, setToast] = useState({ open: false, message: '', severity: 'success' });

  const showToast = (message, severity = 'success') => {
    setToast({ open: true, message, severity });
  };

  const handleCloseToast = () => {
    setToast({ ...toast, open: false });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setUserData({ ...userData, [name]: value });
  };

  const handleAddUser = async () => {
    try {
      const response = await api.post(`/auth/add/add-user`, userData);
      showToast(response.data.message, 'success');
      refreshUsers();
      setTimeout(() => {
        handleClose();
      }, 3000); // 3 seconds delay
    } catch (error) {
      console.error('Error adding user:', error);
      showToast(error.response.data.message, 'error');
    }
  };

  return (
    <Dialog open={open} onClose={handleClose}>
      <DialogTitle>Add User</DialogTitle>
      <DialogContent>
        <TextField
          autoFocus
          margin="dense"
          name="name"
          label="Name"
          type="text"
          fullWidth
          value={userData.name}
          onChange={handleChange}
        />
        <TextField
          margin="dense"
          name="email"
          label="Email"
          type="email"
          fullWidth
          value={userData.email}
          onChange={handleChange}
        />
        <TextField
          margin="dense"
          name="businessName"
          label="Business Name"
          type="text"
          fullWidth
          value={userData.businessName}
          onChange={handleChange}
        />
        <FormControl fullWidth margin="dense">
          <InputLabel>Role</InputLabel>
          <Select
            name="role"
            value={userData.role}
            onChange={handleChange}
            label="Role"
          >
            <MenuItem value="member">Member</MenuItem>
            <MenuItem value="distributor">Distributor</MenuItem>
          </Select>
        </FormControl>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} color="primary.contrastText">
          Cancel
        </Button>
        <Button onClick={handleAddUser} color="primary.contrastText">
          Invite
        </Button>
      </DialogActions>
      <Toast open={toast.open} message={toast.message} severity={toast.severity} handleClose={handleCloseToast} />
    </Dialog>
  );
};

export default AddUsers;
