import React, { useEffect, useState } from 'react';
import { Route, Routes, useMatch, useNavigate } from 'react-router-dom';
import Sidebar from '../Sidebar';
import api from '../../services/api';
import { useAuth } from '../../middleware/auth';
import { CollaboratorAccessControl } from '../../Components/CollaboratorAccessControl';
import Logout from '../DashBoardComponents/Logout';
import ProfileManagement from '../AdminDashBoard/AdminPages/ProfileManagement';
import CreateDeal from './DistributerPages/CreateDeal';
import ManageDeals from './DistributerPages/ManageDeals';
import EditDeal from './DistributerPages/EditDeal';
import AnnouncementToast from '../../Components/Toast/announcmentToast';
import BulkUpload from './DistributerPages/BulkUpload';
import Commitments from '../DashBoardComponents/Commitment';
import DefualtPage from './DistributerPages/DefualtPage';
import NotificationIcon from '../../Components/Notification/NotificationIcon';
import DisplaySplashContent from '../../Components/SplashPage/DisplaySplashContent';
import { Helmet } from 'react-helmet';
import AllDeals from './DistributerPages/AcceptAllCommitments';
import AllMembersForDistributor from '../../TopMembersDistributer/AllMembersforDistributor';
import ViewSingleMember from '../../TopMembersDistributer/viewSingleMember';
import { Button } from '@mui/material';
import SplashAgain from '../Components/SplashAgain';
import CoopMembersPage from '../Pages/CoopMembersPage';
import AssignSupplierPage from '../Pages/AssignSupplierPage';
import { Navigate } from 'react-router-dom';
import Compare from '../../Compare/Compare';
import MemberCommitments from './DistributerPages/MemberCommitments';
import MemberDetails from './DistributerPages/MemberDetails';
import MediaManager from '../../Components/MediaManager/MediaManager';
import CollaboratorManagement from '../../Components/CollaboratorManagement';
import { AdminPanelSettings, Info as InfoIcon } from '@mui/icons-material';
import { Alert } from '@mui/material';

const DistributerDashboard = () => {
  const navigate = useNavigate();
  let match = useMatch('/dashboard/distributor/*');
  const {
    currentUserId,
    userRole,
    isImpersonating,
    isCollaborator,
    collaboratorName,
    collaboratorRole,
    isCollaboratorManager,
    isDealManager,
    isSupplierManager,
    isMediaManager,
    hasCollaboratorRole,
    isAdmin,
    isAuthenticated: authStatus
  } = useAuth();
  const [splashContent, setSplashContent] = useState([]);

  useEffect(() => {
    // Check authentication status using middleware
    if (!authStatus) {
      navigate('/login');
      return;
    }

    // Check if user has the right role
    if (userRole !== 'distributor' && !isImpersonating) {
      navigate('/dashboard');
      return;
    }
  }, [authStatus, userRole, isImpersonating, navigate]);

  useEffect(() => {
    const fetchSplashContent = async () => {
      try {
        const response = await api.get('/api/splash');
        setSplashContent(response.data);
      } catch (error) {
        console.error('Error fetching splash content:', error);
      }
    };

    fetchSplashContent();
  }, []);

  const handleGoBackToAdmin = () => {
    const adminToken = localStorage.getItem('adminToken');
    if (adminToken) {
      localStorage.setItem('token', adminToken);
      localStorage.removeItem('adminToken');
      window.location.href = '/dashboard/admin';
    }
  };

  // Build navigation links based on collaborator role
  const buildNavigationLinks = () => {
    const baseLinks = [
      { path: '', label: 'Dashboard' },
      { path: `profile`, label: 'Profile' }
    ];

    // If not a collaborator, is a manager, or is admin, show all links
    if (!isCollaborator || isCollaboratorManager || isAdmin || isImpersonating || collaboratorRole === 'viewer') {
      return [
        ...baseLinks,
        {
          title: 'Deals',
          subLinks: [
            { path: `deal/create`, label: 'Create Deal' },
            { path: `deal/manage`, label: 'Manage Deals' },
            { path: `deal/bulk`, label: 'Bulk Upload' },
          ]
        },
        { path: `all/committed/deals`, label: 'All Committed Deals' },
        { path: `Stores/Contacts`, label: 'Stores/Contacts' },
        { path: `coop-members`, label: 'Suppliers' },
        { path: `distributor/compare`, label: 'Compare Supply' },
        { path: `media`, label: 'Media' },
        { path: `collaborators`, label: 'Staff Management' }
      ];
    }

    // For specific collaborator roles, show limited links
    const roleBasedLinks = [...baseLinks];

    // Deal Manager can access deal-related features
    if (isDealManager) {
      roleBasedLinks.push({
        title: 'Deals',
        subLinks: [
          { path: `deal/create`, label: 'Create Deal' },
          { path: `deal/manage`, label: 'Manage Deals' },
          { path: `deal/bulk`, label: 'Bulk Upload' },
        ]
      });
      roleBasedLinks.push({ path: `all/committed/deals`, label: 'All Committed Deals' });
      roleBasedLinks.push({ path: `Stores/Contacts`, label: 'Stores/Contacts' });
    }

    // Supplier Manager can access supplier-related features
    if (isSupplierManager) {
      roleBasedLinks.push({ path: `coop-members`, label: 'Suppliers' });
      roleBasedLinks.push({ path: `distributor/compare`, label: 'Compare Supply' });
    }

    // Media Manager can access media features
    if (isMediaManager) {
      roleBasedLinks.push({ path: `media`, label: 'Media' });
    }

    // Viewer role gets minimal access
    if (collaboratorRole === 'viewer') {
      roleBasedLinks.push({ path: `all/committed/deals`, label: 'All Committed Deals' });
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
        <title>NMGA - Distributor Dashboard</title>
        <meta name="description" content="NMGA Distributor Dashboard - Manage your distribution network, track orders, and monitor sales performance" />
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
      {splashContent.length > 0 && <DisplaySplashContent content={splashContent} />}
      <div style={{ display: 'flex', width: '100%' }}>
        <Sidebar match={match} links={links} />
        <div style={{ flexGrow: 1, padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e0e0e0', paddingBottom: '10px' }}>
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
              <Button
                onClick={() => {
                  const authParams = `id=${currentUserId}&session=${currentUserId}&role=distributor&offer=true&user_role=${encodeURIComponent(userRole)}&user_id=${encodeURIComponent(currentUserId)}`;
                  navigate(`offers/view/splash-content?${authParams}`);
                }}
                sx={{
                  border: '2px solid',
                  borderColor: 'primary.contrastText',
                  color: 'primary.contrastText',
                  backgroundColor: 'white',
                  padding: 1,
                  cursor: 'pointer',
                  borderRadius: 25,
                  fontSize: '16px',
                  fontWeight: 'bold',
                  textTransform: 'uppercase',
                  transition: 'background-color 0.3s ease',
                  marginRight: '20px',
                  '&:hover': {
                    backgroundColor: 'primary.main',
                    color: 'primary.contrastText',
                  },
                }}
              >
                Advertisements
              </Button>


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
                    padding: 1,
                    cursor: 'pointer',
                    borderRadius: 25,
                    fontSize: '16px',
                    fontWeight: 'bold',
                    textTransform: 'uppercase',
                    transition: 'background-color 0.3s ease',
                    marginRight: '20px',
                    '&:hover': {
                      backgroundColor: '#ff9800',
                      color: 'white',
                    },
                  }}
                >
                  Back to Admin
                </Button>
              )}

              <NotificationIcon />
              <Logout />
            </div>
          </div>

          <Routes>
            <Route path="" element={<>
              <AnnouncementToast event="signup" />
              <DefualtPage />
            </>} />
            <Route path="profile" element={<>
              <AnnouncementToast event="profile" />
              <ProfileManagement />
            </>} />
            <Route path="deal/create" element={<>
              <AnnouncementToast event="deal_management" />
              <CollaboratorAccessControl requiredRoles={['deal_manager', 'manager']}>
                <CreateDeal />
              </CollaboratorAccessControl>
            </>} />
            <Route path="deal/manage" element={<>
              <AnnouncementToast event="deal_management" />
              <CollaboratorAccessControl requiredRoles={['deal_manager', 'manager']}>
                <ManageDeals />
              </CollaboratorAccessControl>
            </>} />
            <Route path="edit-deal/:dealId" element={<>
              <AnnouncementToast event="deal_management" />
              <CollaboratorAccessControl requiredRoles={['deal_manager', 'manager']}>
                <EditDeal />
              </CollaboratorAccessControl>
            </>} />
            <Route path="deal/bulk" element={<>
              <AnnouncementToast event="deal_management" />
              <CollaboratorAccessControl requiredRoles={['deal_manager', 'manager']}>
                <BulkUpload />
              </CollaboratorAccessControl>
            </>} />
            <Route path="allcommitments/view/:userId" element={<>
              <AnnouncementToast event="deal_management" />
              <Commitments />
            </>} />
            <Route path="all/committed/deals" element={<>
              <AnnouncementToast event="deal_management" />
              <CollaboratorAccessControl requiredRoles={['deal_manager', 'manager', 'viewer']}>
                <AllDeals />
              </CollaboratorAccessControl>
            </>} />
            <Route path="all/co-op-membors" element={<>
              <AnnouncementToast event="deal_management" />
              <CollaboratorAccessControl requiredRoles={['supplier_manager', 'manager']}>
                <AllMembersForDistributor />
              </CollaboratorAccessControl>
            </>} />
            <Route path="view/co-op-membors/member/:memberId" element={<>
              <AnnouncementToast event="deal_management" />
              <CollaboratorAccessControl requiredRoles={['supplier_manager', 'manager']}>
                <ViewSingleMember />
              </CollaboratorAccessControl>
            </>} />
            <Route path="offers/view/splash-content" element={<>
              <AnnouncementToast event="deal_management" />
              <SplashAgain />
            </>} />
            <Route path="coop-members" element={<>
              <AnnouncementToast event="deal_management" />
              <CollaboratorAccessControl requiredRoles={['supplier_manager', 'manager']}>
                <CoopMembersPage />
              </CollaboratorAccessControl>
            </>} />
            <Route path="assign-supplier/:memberId" element={<>
              <AnnouncementToast event="deal_management" />
              <CollaboratorAccessControl requiredRoles={['supplier_manager', 'manager']}>
                <AssignSupplierPage />
              </CollaboratorAccessControl>
            </>} />
            <Route path="distributor/compare" element={<>
              <AnnouncementToast event="deal_management" />
              <CollaboratorAccessControl requiredRoles={['supplier_manager', 'manager']}>
                <Compare />
              </CollaboratorAccessControl>
            </>} />
            <Route path="media" element={<>
              <AnnouncementToast event="media" />
              <CollaboratorAccessControl requiredRoles={['media_manager', 'manager']}>
                <MediaManager />
              </CollaboratorAccessControl>
            </>} />
            <Route path="Stores/Contacts" element={<>
              <AnnouncementToast event="deal_management" />
              <CollaboratorAccessControl requiredRoles={['deal_manager', 'manager']}>
                <MemberCommitments />
              </CollaboratorAccessControl>
            </>} />
            <Route path="Stores/Contacts/:memberId" element={<>
              <AnnouncementToast event="deal_management" />
              <CollaboratorAccessControl requiredRoles={['deal_manager', 'manager']}>
                <MemberDetails />
              </CollaboratorAccessControl>
            </>} />
            <Route path="collaborators" element={<>
              <AnnouncementToast event="team_management" />
              <CollaboratorAccessControl requiredRoles={['manager']}>
                <CollaboratorManagement />
              </CollaboratorAccessControl>
            </>} />
          </Routes>
        </div>
      </div>
    </>
  );
}

export default DistributerDashboard;
