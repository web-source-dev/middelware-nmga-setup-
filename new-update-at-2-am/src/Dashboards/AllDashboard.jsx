import React, { useEffect } from 'react';
import { Route, Routes, useMatch, useLocation, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import AdminDashboard from './AdminDashBoard/AdminDashboard';
import DistributerDashboard from './DistributerDashboard/DistributerDashboard';
import CoopmemberDashboard from './ProcurementDashboard/ProcurementDashboard';
import { useAuth } from '../middleware/auth';
import { isAuthenticated } from '../services/api';

const AllDashboard = () => {
  let match = useMatch('/dashboard/*');
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated: authStatus } = useAuth();

  useEffect(() => {
    // Check authentication status using middleware
    if (!authStatus) {
      navigate('/login');
      return;
    }

    // Extract authentication data from URL parameters for token only
    const params = new URLSearchParams(location.search);
    const token = params.get('token');
    
    // Only save token to localStorage if present
    if (token) {      
      // Clear the token parameter from the URL to avoid security issues
      const cleanUrl = window.location.pathname;
      window.history.replaceState({}, document.title, cleanUrl);
    }
  }, [location, authStatus, navigate]);

  return (
    <>
      <Helmet>
        <title>NMGA - Dashboard</title>
        <meta name="description" content="NMGA Dashboard - Access your personalized dashboard for market access and business management" />
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
      <Routes>
        <Route path="/admin/*" element={<AdminDashboard />} />
        <Route path="/distributor/*" element={<DistributerDashboard />} />
        <Route path="/co-op-member/*" element={<CoopmemberDashboard />} />
      </Routes>
    </>
  );
}

export default AllDashboard;
