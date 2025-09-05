import React, { useEffect, useState } from 'react';
import { Route, Routes, useMatch, useNavigate } from 'react-router-dom';
import Sidebar from '../Sidebar';
import api from '../../services/api';
import { useAuth } from '../../middleware/auth';
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
import { AdminPanelSettings } from '@mui/icons-material';

const DistributerDashboard = () => {
  const navigate = useNavigate();
  let match = useMatch('/dashboard/distributor/*');
  const { currentUserId, userRole, isImpersonating } = useAuth();
  const [splashContent, setSplashContent] = useState([]);

  useEffect(() => {
    // Check if user is authenticated and has the right role
    if (!currentUserId || (userRole !== 'distributor' && !isImpersonating)) {
      navigate('/login');
    }
  }, [currentUserId, userRole, isImpersonating, navigate]);

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

  const links = [
    { path: '', label: 'Dashboard' },
    { path: `profile`, label: 'Profile' },
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
  ];

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
          <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center',borderBottom: '1px solid #e0e0e0',paddingBottom: '10px' }}>
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
              <CreateDeal />
            </>} />
            <Route path="deal/manage" element={<>
              <AnnouncementToast event="deal_management" />
              <ManageDeals />
            </>} />
            <Route path="edit-deal/:dealId" element={<>
              <AnnouncementToast event="deal_management" />
              <EditDeal />
            </>} />
            <Route path="deal/bulk" element={<>
              <AnnouncementToast event="deal_management" />
              <BulkUpload />
            </>} />
            <Route path="allcommitments/view/:userId" element={<>
              <AnnouncementToast event="deal_management" />
              <Commitments />
            </>} />
            <Route path="all/committed/deals" element={<>
              <AnnouncementToast event="deal_management" />
              <AllDeals />
            </>} />
            <Route path="all/co-op-membors" element={<>
              <AnnouncementToast event="deal_management" />
              <AllMembersForDistributor />
            </>} />
            <Route path="view/co-op-membors/member/:memberId" element={<>
              <AnnouncementToast event="deal_management" />
              <ViewSingleMember />
            </>} />
            <Route path="offers/view/splash-content" element={<>
              <AnnouncementToast event="deal_management" />
              <SplashAgain />
            </>} />
            <Route path="coop-members" element={<>
              <AnnouncementToast event="deal_management" />
              <CoopMembersPage />
            </>} />
            <Route path="assign-supplier/:memberId" element={<>
              <AnnouncementToast event="deal_management" />
              <AssignSupplierPage />
            </>} />
            <Route path="distributor/compare" element={<>
              <AnnouncementToast event="deal_management" />
              <Compare />
            </>} />
            <Route path="media" element={<>
              <AnnouncementToast event="media" />
              <MediaManager />
            </>} />
            <Route path="Stores/Contacts" element={<>
              <AnnouncementToast event="deal_management" />
              <MemberCommitments />
            </>} />
            <Route path="Stores/Contacts/:memberId" element={<>
              <AnnouncementToast event="deal_management" />
              <MemberDetails />
            </>} />
          </Routes>
        </div>
      </div>
    </>
  );
}

export default DistributerDashboard;
