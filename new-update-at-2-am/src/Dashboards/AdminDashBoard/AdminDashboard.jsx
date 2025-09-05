import React, { useEffect, useState } from 'react';
import { Route, Routes, useMatch, useNavigate } from 'react-router-dom';
import Sidebar from '../Sidebar';
import DefualtPage from './AdminPages/DefualtPage';
import UserManagment from './AdminPages/UserManagment';
import DisplayLogs from './AdminPages/DisplayLogs';
import ProfileManagement from './AdminPages/ProfileManagement';
import Announcements from './AdminPages/Announcements';
import Logout from '../DashBoardComponents/Logout';
import AnnouncementToast from '../../Components/Toast/announcmentToast';
import DealsManagment from './AdminPages/DealManagement';
import Analytics from './AdminPages/Analytics';
import AllCommitments from './AdminPages/AllCommitments';
import NotificationIcon from '../../Components/Notification/NotificationIcon';
import CreateSplashContent from '../../Components/SplashPage/CreateSplashContent';
import DisplaySplashContent from '../../Components/SplashPage/DisplaySplashContent';
import LoadSplash from '../../Components/SplashPage/LoadSplash';
import api from '../../services/api';
import { useAuth } from '../../middleware/auth';
import { Helmet } from 'react-helmet';
import AllDealsAdmin from './AdminPages/AllDealsAdmin';
import AdminContactDisplay from './AdminPages/AdminContactDisplay';
import MembersnotCommiting from './AdminPages/MembersnotCommiting';
import { Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, Typography, Box, CircularProgress, Fade } from '@mui/material';
import { CloudUpload, InfoOutlined } from '@mui/icons-material';
import UserProfileView from './AdminPages/userProfileView';
import AllTopMembers from '../../Pages/AllTopMembers';
import EachMemberDetail from '../../Pages/EachMemberDetail';

const AdminDashboard = () => {
  let match = useMatch('/dashboard/admin/*');
  const navigate = useNavigate();
  const { currentUserId, userRole, isImpersonating } = useAuth();
  const [splashContent, setSplashContent] = useState([]);
  const [importDialog, setImportDialog] = useState(false);
  const [importLoading, setImportLoading] = useState(false);
  const [importStats, setImportStats] = useState(null);

  useEffect(() => {
    // Check if user is authenticated and has admin role
    if (!currentUserId || userRole !== 'admin') {
      navigate('/login');
    }
  }, [currentUserId, userRole, navigate]);

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

  const openImportDialog = () => {
    setImportDialog(true);
    setImportStats(null);
  };

  const closeImportDialog = () => {
    setImportDialog(false);
  };

  const handleImportUsers = async () => {
    try {
      setImportLoading(true);
      
      const response = await api.post('/auth/add-user/import-users');
      
      setImportStats(response.data.stats);
    } catch (error) {
      console.error('Error importing users:', error);
    } finally {
      setImportLoading(false);
    }
  };

  const links = [
    { path: '', label: 'Dashboard' },
    { path: 'analytics', label: 'Analytics' },
    { path: 'usermanagement', label: 'User Manage' },
    { path: 'all-deals', label: 'All Committed Deals' },
    { path: 'inactive-members', label: 'Members Tracking' },
    { path: 'logs', label: 'User Monitoring' },
    { path: 'splash-content', label: 'Splash Content' },
    { path: 'deal-management', label: 'Deal Management' },
    { path: 'announcements', label: 'Announcements' },
    { path: 'request/contact/manage', label: 'Contact' },
  ];

  return (
    <>
      <Helmet>
        <title>NMGA - Admin Dashboard</title>
        <meta name="description" content="NMGA Admin Dashboard - Manage users, monitor activities, and control system settings" />
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
      {splashContent.length > 0 && <DisplaySplashContent content={splashContent} />}
      <div style={{ display: 'flex', width: '100%' }}>
        <Sidebar match={match} links={links} />
        <div style={{ flexGrow: 1, padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'flex-end',paddingBottom:5, alignItems: 'center' ,marginBottom:5 ,borderBottom:'1px solid',borderColor:'primary.main'}}>
            <Button
              variant="contained"
              color="primary"
              onClick={openImportDialog}
              startIcon={<CloudUpload sx={{ color: 'primary.contrastText' }} />}
              sx={{ mr: 2, bgcolor: "primary.main" }}
            >
              Import Users
            </Button>
            <NotificationIcon />
            <Logout />
          </div>
          <Routes>
            <Route path="" element={<>
              <AnnouncementToast event="login" />
              <DefualtPage />
            </>} />
            <Route path="analytics" element={<>
              <AnnouncementToast event="analytics" />
              <Analytics />
            </>} />
            <Route path="overview" element={<AllCommitments />} />
            <Route path="usermanagement" element={<>
              <AnnouncementToast event="user_management" />
              <UserManagment />
            </>} />
            <Route path="inactive-members" element={<>
              <AnnouncementToast event="inactive_members" />
              <MembersnotCommiting />
            </>} />
            <Route path="logs" element={<>
              <AnnouncementToast event="logs" />
              <DisplayLogs />
            </>} />
            <Route path="profile-management" element={<>
              <AnnouncementToast event="profile" />
              <ProfileManagement /> 
            </>} />
            <Route path="user-profile-view/:userId" element={<>
              <AnnouncementToast event="user_profile_view" />
              <UserProfileView />
            </>} />
            <Route path="splash-content/*" element={<>
              <AnnouncementToast event="splash_content" />
              <Routes>
              <Route path="/" element={<LoadSplash />} />
                <Route path="create" element={<CreateSplashContent />} />
                <Route path="edit/:id" element={<CreateSplashContent />} />
              </Routes>
            </>} />
            <Route path="deal-management" element={<>
              <AnnouncementToast event="deal_management" />
              <DealsManagment />
            </>} />
            <Route path="announcements" element={<>
              <AnnouncementToast event="announcements" />
              <Announcements />
            </>} />
            <Route path="all-deals" element={<>
              <AnnouncementToast event="all_deals" />
              <AllDealsAdmin />
            </>} />
            
            <Route path="request/contact/manage" element={<>
              <AdminContactDisplay />
            </>} />
            <Route path="all-members" element={<>
              <AnnouncementToast event="all_members" />
              <AllTopMembers />
            </>} />
            <Route path="member-details/:memberId" element={<>
              <AnnouncementToast event="member_details" />
              <EachMemberDetail />
            </>} />
          </Routes>          

        </div>
      </div>

      {/* Import Users Dialog */}
      <Dialog open={importDialog} onClose={closeImportDialog}>
        <DialogTitle>Import Users</DialogTitle>
        <DialogContent sx={{ minWidth: '400px' }}>
          {importLoading ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 3 }}>
              <CircularProgress size={60} />
              <Typography variant="body1" sx={{ mt: 2 }}>
                Importing users from Excel file...
              </Typography>
            </Box>
          ) : importStats ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 3 }}>
              <Box 
                sx={{ 
                  width: 150, 
                  height: 150, 
                  borderRadius: '50%', 
                  bgcolor: 'primary.main',
                  display: 'flex', 
                  flexDirection: 'column',
                  justifyContent: 'center',
                  alignItems: 'center',
                  mb: 2
                }}
              >
                <Typography variant="h3" component="div" sx={{ color: 'primary.contrastText' }}>
                  {importStats.created}
                </Typography>
                <Typography variant="body2" sx={{ color: 'primary.contrastText' }}>
                  Users Created
                </Typography>
              </Box>
              
              {importStats.created === 0 && (
                <Fade in={true} timeout={800}>
                  <Box 
                    sx={{ 
                      mt: 2, 
                      p: 3, 
                      bgcolor: 'rgba(48, 102, 156, 0.38)', 
                      borderRadius: 2, 
                      border: '1px solid', 
                      borderColor: 'primary.main',
                      maxWidth: '350px',
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: 2,
                      boxShadow: '0 4px 8px rgba(0,0,0,0.05)',
                    }}
                  >
                    <InfoOutlined sx={{ color: 'primary.main', mt: 0.5 }} />
                    <Typography variant="body1" sx={{ color: 'text.primary' }}>
                      No new users were created. The file is either empty or all users already exist in the system.
                    </Typography>
                  </Box>
                </Fade>
              )}
              
              <Box sx={{ mt: 3, textAlign: 'center' }}>
                <Typography variant="h6" component="div" gutterBottom>
                  Default Password: changeme123
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Users will be prompted to change this on first login
                </Typography>
              </Box>
            </Box>
          ) : (
            <DialogContentText>
              This will import users from the Excel file stored on the server.
              <br /><br />
              The system will use the existing users.xlsx file located in the server directory.
              <br /><br />
              Click "Start Import" to begin.
            </DialogContentText>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={closeImportDialog} color="primary">
            Close
          </Button>
          {!importLoading && !importStats && (
            <Button 
              onClick={handleImportUsers} 
              color="primary" 
              variant="contained" 
              startIcon={<CloudUpload sx={{ color: 'primary.contrastText' }} />}
              disabled={importLoading}
            >
              Start Import
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </>
  );
}

export default AdminDashboard;
