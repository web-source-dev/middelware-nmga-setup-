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
import { Button, Alert } from '@mui/material';
import SplashAgain from '../Components/SplashAgain';
import AddMembers from './memberPages/AddMembers';
import MemberCommitmentDetails from './memberPages/MemberCommitmentDetails';
import CollaboratorManagement from '../../Components/CollaboratorManagement';
import api from '../../services/api';
import { isAuthenticated, isAdmin, isMember, getCurrentUserContext } from '../../services/api';
import { useAuth } from '../../middleware/auth';
import { CollaboratorAccessControl } from '../../Components/CollaboratorAccessControl';
import { AdminPanelSettings } from '@mui/icons-material';
import InfoIcon from '@mui/icons-material/Info';
const MemberDashboard = () => {
  let match = useMatch('/dashboard/co-op-member/*');
  const navigate = useNavigate();
  const [splashContent, setSplashContent] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Get authentication context
  const {
    isAuthenticated: authStatus,
    isAdmin: adminStatus,
    isMember: memberStatus,
    isImpersonating,
    isCollaborator,
    collaboratorName,
    collaboratorRole,
    isCollaboratorManager,
    isCommitmentManager,
    isSubstoreManager,
    hasCollaboratorRole,
    isAdmin: isAdminUser,
    currentUserId
  } = useAuth();
  const userContext = getCurrentUserContext();

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
  const buildNavigationLinks = () => {
    const baseLinks = [
      { path: 'overview', label: 'Overview' },
      { path: `profile`, label: 'Profile' }
    ];

    // If not a collaborator, is a manager, or is admin, show all links (for main account holders)
    if (!isCollaborator || isCollaboratorManager || isAdminUser) {
      if (!user?.addedBy) {
        return [
          ...baseLinks,
          { path: 'commitments', label: 'My Commitments' },
          { path: 'analytics', label: 'Analytics' },
          { path: 'add-members', label: 'Add Stores' },
          { path: 'detailed-analytics', label: 'Detailed Analytics' },
          { path: 'collaborators', label: 'Staff Management' }
        ];
      }
      return baseLinks;
    }

    // For specific collaborator roles, show limited links
    const roleBasedLinks = [...baseLinks];

    // Commitment Manager can access commitment-related features
    if (isCommitmentManager) {
      roleBasedLinks.push({ path: 'commitments', label: 'My Commitments' });
      roleBasedLinks.push({ path: 'analytics', label: 'Analytics' });
      roleBasedLinks.push({ path: 'detailed-analytics', label: 'Detailed Analytics' });
    }

    // Substore Manager can access substore management
    if (isSubstoreManager) {
      roleBasedLinks.push({ path: 'add-members', label: 'Add Stores' });
    }

    // Viewer role gets minimal access
    if (collaboratorRole === 'viewer') {
      return [
        ...baseLinks,
        { path: 'commitments', label: 'My Commitments' },
        { path: 'analytics', label: 'Analytics' },
        { path: 'add-members', label: 'Add Stores' },
        { path: 'detailed-analytics', label: 'Detailed Analytics' },
        { path: 'collaborators', label: 'Staff Management' }
      ];
    }

    return roleBasedLinks;
  };

  const links = buildNavigationLinks();

  // Get role-specific information message for collaborators
  const getRoleInfoMessage = () => {
    if (!isCollaborator) return null;

    const roleMessages = {
      'viewer': 'You have read-only access. You can view all information but cannot perform any actions like creating, editing, or deleting.',
      'deal_manager': 'You can manage deals and commitments. You can create, edit, and manage deals.',
      'supplier_manager': 'You can manage suppliers and compare supply data. You can add suppliers, assign sales persons, and compare supply information.',
      'media_manager': 'You can manage media and assets. You can upload, organize, and manage all media files and folders.',
      'commitment_manager': 'You can manage commitments and member details. You can view and manage member commitments and related information.',
      'substore_manager': 'You can manage sub-stores and related operations. You have access to sub-store management features.',
      'manager': 'You have full control of the account. You can access all features and perform all actions.'
    };

    return roleMessages[collaboratorRole] || 'You have limited access based on your assigned role. Some features may be restricted.';
  };

  const displayRole = (role) => {
    if (role === 'distributor') return 'Distributor';
    if (role === 'supplier_manager') return 'Supplier Manager';
    if (role === 'media_manager') return 'Media Manager';
    if (role === 'commitment_manager') return 'Commitment Manager';
    if (role === 'substore_manager') return 'Sub-Store Manager';
    if (role === 'viewer') return 'Viewer';
    if (role === 'deal_manager') return 'Deal Manager';
    if (role === 'manager') return 'Account Admin';
  };
  const getRoleColor = (role) => {
    switch (role) {
      case 'distributor': return '#1976d2'; // Blue
      case 'manager': return '#d32f2f'; // Red
      case 'deal_manager': return '#7b1fa2'; // Purple
      case 'supplier_manager': return '#388e3c'; // Green
      case 'media_manager': return '#f57c00'; // Orange
      case 'commitment_manager': return '#5d4037'; // Brown
      case 'substore_manager': return '#00796b'; // Teal
      case 'viewer': return '#616161'; // Grey
      default: return '#616161'; // Default grey
    }
  };
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
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center',borderBottom: '1px solid #e0e0e0',paddingBottom: '10px' }}>
            {/* Show role information for collaborators */}
            <div>
            {isCollaborator && getRoleInfoMessage() && (
              <Alert
                severity="info"
                icon={<InfoIcon />}
                sx={{
                  mb: 2,
                  '& .MuiAlert-message': {
                    fontSize: '0.875rem'
                  }
                }}
              >
                <strong>Role Information:</strong> {getRoleInfoMessage()}
              </Alert>
            )}
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>


              {/* Show collaborator indicator */}
              {isCollaborator && (
                <div style={{
                  backgroundColor: getRoleColor(collaboratorRole),
                  color: 'white',
                  padding: '6px 12px',
                  borderRadius: '20px',
                  fontSize: '12px',
                  fontWeight: '600',
                  marginRight: '12px',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}>
                  <div style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    backgroundColor: 'rgba(255,255,255,0.8)',
                    marginRight: '4px'
                  }}></div>
                  {displayRole(collaboratorRole)}
                </div>
              )}
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
                  const authParams = `id=${currentUserId}&session=${currentUserId}&role=distributor&offer=true&token=${encodeURIComponent(localStorage.getItem('token'))}&user_role=${encodeURIComponent(userContext.user?.role || 'member')}&user_id=${encodeURIComponent(currentUserId)}`;
                  navigate(`offers/view/splash-content?${authParams}`);
                }}
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
              <CollaboratorAccessControl requiredRoles={['commitment_manager', 'manager']}>
                <MemberAnalytics />
              </CollaboratorAccessControl>
            </>} />
            <Route path="profile" element={<>
              <AnnouncementToast event="profile" />
              <ProfileManagement />
            </>} />
            <Route path="offers/view/splash-content" element={<>
              <SplashAgain />
            </>} />
            <Route path="settings" element={<MemberSettings />} />
            <Route path="detailed-analytics" element={
              <CollaboratorAccessControl requiredRoles={['commitment_manager', 'manager']}>
                <DetailedAnalytics />
              </CollaboratorAccessControl>
            } />
            <Route path="add-members" element={
              <>
                <AnnouncementToast event="add-members" />
                <CollaboratorAccessControl requiredRoles={['substore_manager', 'manager']}>
                  {!user?.addedBy && <AddMembers />}
                </CollaboratorAccessControl>
              </>
            } />
            <Route path="/store-commitment-details/:memberId" element={<MemberCommitmentDetails />} />
            <Route path="collaborators" element={
              <>
                <AnnouncementToast event="team_management" />
                <CollaboratorAccessControl requiredRoles={['manager']}>
                  {!user?.addedBy && <CollaboratorManagement />}
                </CollaboratorAccessControl>
              </>
            } />
          </Routes>
        </div>
      </div>
    </>
  );
}

export default MemberDashboard;
