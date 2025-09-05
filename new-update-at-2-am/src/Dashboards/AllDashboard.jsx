import React, { useEffect } from 'react';
import { Route, Routes, useMatch, useLocation } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import AdminDashboard from './AdminDashBoard/AdminDashboard';
import DistributerDashboard from './DistributerDashboard/DistributerDashboard';
import CoopmemberDashboard from './ProcurementDashboard/ProcurementDashboard';

const AllDashboard = () => {
  let match = useMatch('/dashboard/*');
  const location = useLocation();

  useEffect(() => {
    // Extract authentication data from URL parameters
    const params = new URLSearchParams(location.search);
    const token = params.get('token');
    const userRole = params.get('user_role');
    const userId = params.get('user_id');
    const adminId = params.get('admin_id');
    
    // If we have authentication data in the URL, save it to localStorage
    if (token) localStorage.setItem('token', token);
    if (userRole) localStorage.setItem('user_role', userRole);
    if (userId) localStorage.setItem('user_id', userId);
    if (adminId) localStorage.setItem('admin_id', adminId);
    
    // Clear the parameters from the URL to avoid security issues
    if (token || userRole || userId || adminId) {
      const cleanUrl = window.location.pathname;
      window.history.replaceState({}, document.title, cleanUrl);
    }
  }, [location]);

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
