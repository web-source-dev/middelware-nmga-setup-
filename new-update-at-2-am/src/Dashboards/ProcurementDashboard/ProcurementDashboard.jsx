import React, { useEffect, useState } from 'react';
import { Route, Routes, useMatch, useNavigate } from 'react-router-dom';
import Sidebar from '../Sidebar';
import Logout from '../DashBoardComponents/Logout';
import ProfileManagement from '../AdminDashBoard/AdminPages/ProfileManagement';
import AnnouncementToast from '../../Components/Toast/announcmentToast';
import MemberOverview from './memberPages/MemberOverview';
import MemberCommitments from './memberPages/MemberCommitments';
// import MemberFavorites from './memberPages/MemberFavorites';
import MemberAnalytics from './memberPages/MemberAnalytics';
import MemberSettings from './memberPages/MemberSettings';
import NotificationIcon from '../../Components/Notification/NotificationIcon';
import DisplaySplashContent from '../../Components/SplashPage/DisplaySplashContent';
import { Helmet } from 'react-helmet';
import DetailedAnalytics from './memberPages/DetailedAnalytics';
import { Button } from '@mui/material';
import SplashAgain from '../Components/SplashAgain';
import AddMembers from './memberPages/AddMembers';
import MemberCommitmentDetails from './memberPages/MemberCommitmentDetails';
import api from '../../services/api';
import { isAuthenticated, isAdmin, isMember, getCurrentUserContext } from '../../services/api';
import { useAuth } from '../../middleware/auth';
import { AdminPanelSettings } from '@mui/icons-material';

const MemberDashboard = () => {
  let match = useMatch('/dashboard/co-op-member/*');
  const navigate = useNavigate();
  const [splashContent, setSplashContent] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Get authentication context
  const { isAuthenticated: authStatus, isAdmin: adminStatus, isMember: memberStatus, isImpersonating } = useAuth();
  const userContext = getCurrentUserContext();
  const userId = userContext.user?.id;

  useEffect(() => {
    // Check authentication and role access
    if (!authStatus) {
      navigate('/login');
      return;
    }

    // Only allow admin and member access
    if (!adminStatus && !memberStatus) {
      navigate('/dashboard');
      return;
    }

    // Fetch dashboard data
    fetchDashboardData();
    fetchSplashContent();
  }, [authStatus, adminStatus, memberStatus, navigate]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await api.get('/member/dashboard-access');
      setUser(response.data.user);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setError('Failed to load dashboard data');
      if (error.response?.status === 401) {
        navigate('/login');
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchSplashContent = async () => {
    try {
      const userRole = userContext.user?.role || 'member';
      const response = await api.get('/api/splash', {
        headers: { 'user-role': userRole }
      });
      setSplashContent(response.data);
    } catch (error) {
      console.error('Error fetching splash content:', error);
    }
  };

  const handleGoBackToAdmin = () => {
    const adminToken = localStorage.getItem('adminToken');
    if (adminToken) {
      localStorage.setItem('token', adminToken);
      localStorage.removeItem('adminToken');
      window.location.href = '/dashboard/admin';
    }
  };

  // Show loading state
  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <div>Loading dashboard...</div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <div>Error: {error}</div>
      </div>
    );
  }

  // Build navigation links based on user role and permissions
  const links = [
    { path: 'overview', label: 'Overview' },
    { path: 'commitments', label: 'My Commitments' },
    { path: `profile`, label: 'Profile' },
  ];

  // Add additional links for users who haven't been added by someone else
  if (!user?.addedBy) {
    links.push({ path: 'analytics', label: 'Analytics' });
    links.push({ path: 'add-members', label: 'Add Stores' });
    links.push({ path: 'detailed-analytics', label: 'Detailed Analytics' });
  }

  return (
    <>
      <Helmet>
        <title>NMGA - Procurement Dashboard</title>
        <meta name="description" content="NMGA Procurement Dashboard - Manage procurement processes, track orders, and optimize your supply chain" />
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
      {splashContent.length > 0 && <DisplaySplashContent content={splashContent} />}
      <div style={{ display: 'flex', width: '100%' }}>
        <Sidebar match={match} links={links} />
        <div style={{ flexGrow: 1, padding: '10px' }}>
          <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
            {/* Show impersonation indicator if admin is impersonating */}
            {isImpersonating && (
              <div style={{ 
                backgroundColor: '#ff9800', 
                color: 'white', 
                padding: '4px 8px', 
                borderRadius: '4px', 
                fontSize: '12px',
                marginRight: '8px'
              }}>
                Admin Mode
              </div>
            )}
            
            {/* Show "Go Back to Admin Dashboard" button only when impersonating */}
            {isImpersonating && localStorage.getItem('adminToken') && (
              <Button
                onClick={handleGoBackToAdmin}
                startIcon={<AdminPanelSettings />}
                sx={{
                  border: '2px solid',
                  borderColor: '#ff9800',
                  color: '#ff9800',
                  backgroundColor: 'white',
                  padding: { xs: '4px 4px', md: '10px 10px' },
                  cursor: 'pointer',
                  borderRadius: 25,
                  fontSize: { xs: '12px', md: '16px' },
                  fontWeight: 'bold',
                  textTransform: 'uppercase',
                  transition: 'background-color 0.3s ease',
                  marginRight: '4px',
                  '&:hover': {
                    backgroundColor: '#ff9800',
                    color: 'white',
                  },
                }}
              >
                Back to Admin
              </Button>
            )}
            
            <Button 
              onClick={() => {
                const authParams = `id=${userId}&session=${userId}&role=distributor&offer=true&token=${encodeURIComponent(localStorage.getItem('token'))}&user_role=${encodeURIComponent(userContext.user?.role || 'member')}&user_id=${encodeURIComponent(userId)}`;
                navigate(`offers/view/splash-content?${authParams}`);
              }}
              sx={{
                border: '2px solid',
                borderColor : 'primary.contrastText',
                color: 'primary.contrastText',
                backgroundColor: 'white',
                padding: { xs: '4px 4px', md: '10px 10px' },
                cursor: 'pointer',
                borderRadius: 25,
                fontSize: { xs: '12px', md: '16px' },
                fontWeight: 'bold',
                textTransform: 'uppercase',
                transition: 'background-color 0.3s ease',
                marginRight: '4px',
                '&:hover': {
                  backgroundColor: 'primary.main',
                  color: 'primary.contrastText',
                },
              }}
            >
              Advertisements
            </Button>

            <Button
              onClick={() => navigate('/deals-catlog')}
              sx={{
                border: '2px solid',
                borderColor: 'primary.contrastText',
                color: 'primary.contrastText',
                backgroundColor: 'white',
                padding: { xs: '4px 4px', md: '10px 10px' },
                cursor: 'pointer',
                borderRadius: 25,
                fontSize: { xs: '12px', md: '16px' },
                fontWeight: 'bold',
                textTransform: 'uppercase',
                transition: 'background-color 0.3s ease',
                marginRight: '4px',
                '&:hover': {
                  backgroundColor: 'primary.main',
                  color: 'primary.contrastText',
                },
              }}
            >
              Explore Deals
            </Button>

            <NotificationIcon />
            <Logout />
          </div>

          <Routes>
            <Route path="/" element={<MemberOverview />} />
            <Route path="overview" element={<>
              <AnnouncementToast event="member_dashboard" />
              <MemberOverview />
            </>} />
            <Route path="commitments" element={<>
              <AnnouncementToast event="commitments" />
              <MemberCommitments />
            </>} />
            {/* <Route path="favorites" element={<>
              <AnnouncementToast event="favorites" />
              <MemberFavorites />
            </>} /> */}
            <Route path="analytics" element={<>
              <AnnouncementToast event="analytics" />
              <MemberAnalytics />
            </>} />
            <Route path="profile" element={<>
              <AnnouncementToast event="profile" />
              <ProfileManagement />
            </>} />
            <Route path="offers/view/splash-content" element={<>
              <SplashAgain />
            </>} />
            <Route path="settings" element={<MemberSettings />} />
            <Route path="detailed-analytics" element={<DetailedAnalytics />} />
            <Route path="add-members" element={
              <>
                <AnnouncementToast event="add-members" />
                {!user?.addedBy && <AddMembers />}
              </>
            } />
            <Route path="/store-commitment-details/:memberId" element={<MemberCommitmentDetails />} />
          </Routes>
        </div>
      </div>
    </>
  );
}

export default MemberDashboard;
