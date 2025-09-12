import React from 'react';
import { Button } from '@mui/material';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../middleware/auth';

const Logout = () => {
  const navigate = useNavigate();
  const { isImpersonating } = useAuth();

  const handleLogout = async () => {
    try {
      // Check if admin is impersonating and has admin token
      const adminToken = localStorage.getItem('adminToken');
      
      if (isImpersonating && adminToken) {
        // Switch back to admin session
        localStorage.setItem('token', adminToken);
        localStorage.removeItem('adminToken');
        // Redirect to admin dashboard
        window.location.href = '/dashboard/admin';
        return;
      }
      
      // Regular logout - clear everything
      localStorage.clear();
      const wixSiteURL = 'https://www.nmgrocers.com/nmgrocercoop';
      window.location.href = `${wixSiteURL}?logout=true`;
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  return (
    <Button onClick={handleLogout} color="primary.contrastText" sx={{
      fontSize: '16px',
      fontWeight: '500',
      borderLeft: '4px solid',
      borderColor: 'primary.contrastText',
      borderRadius: 0
    }}>
      {isImpersonating && localStorage.getItem('adminToken') ? 'Exit Impersonation' : 'Logout'}
    </Button>
  );
};

export default Logout;
