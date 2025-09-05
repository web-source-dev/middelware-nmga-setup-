import React from 'react';
import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';
import { Box, Typography, ThemeProvider } from "@mui/material";
import { Helmet } from 'react-helmet';
import { SnackbarProvider } from 'notistack';
import customTheme from './theme/customTheme';
import AllDashboard from './Dashboards/AllDashboard';
import './Components/Buttons/buttons.css';
import './Components/Inputs/input.css';
import SignupForm from './Forms/SignupForm';
import LoginForm from './Forms/LoginForm';
import ForgetPassword from './Forms/ForgetPassword';
import ResetPassword from './Forms/ResetPassword';
import CreatePassword from './Pages/CreatePassword';
import ViewDeal from './Dashboards/DistributerDashboard/DistributerPages/ViewDeal';
import DisplayDeals from './Pages/DisplayDeals';
import ViewSingleDeal from './Pages/ViewSingleDeal';
import CommitmentDetails from './Dashboards/DashBoardComponents/CommitmentDetails';
import CommitmentCharts from './Dashboards/DashBoardComponents/CommitmentCharts';
import PaymentPage from './Payments/PaymentPage';
import ThankYou from './Payments/ThankYou';
import Home from './Pages/home';
import ContactUs from './Pages/contactus';
import Header from './Components/HeaderFotter/Header';
import SingleDealCommitments from './Dashboards/DashBoardComponents/SingleDealCommitments';
import AllTopMembers from './Pages/AllTopMembers';
import EachMemberDetail from './Pages/EachMemberDetail';
import TopMembers from './Pages/TopMembers';
import DealAnalytics from './Dashboards/Components/DealAnalytics';
import AllCoopMembers from './Dashboards/Components/AllCoopMembers';
import Compare from './Compare/Compare';
import CreateAddedMembersPassword from './Pages/createaddedmemberspassword';

// Layout component to handle conditional rendering of Header and Footer
const Layout = ({ children }) => {
  const location = useLocation();
  const path = location.pathname;

  // List of routes where header and footer should not appear
  const noHeaderFooterRoutes = [
    '/dashboard',
    '/register',
    '/login',
    '/forget-password',
    '/reset-password',
    '/create-password',
    '/payment',
    '/thank-you'
  ];

  // Check if current path starts with any of the excluded routes
  const shouldShowHeaderFooter = !noHeaderFooterRoutes.some(route => 
    path.startsWith(route)
  );

  return (
    <>
      {children}
    </>
  );
};

const App = () => {
  return (
    <ThemeProvider theme={customTheme}>
      <SnackbarProvider maxSnack={3}>
        <Router>
          <Helmet>
            <title>NMGA - Next Generation Market Access</title>
            <meta name="description" content="NMGA - Your platform for next generation market access and business solutions" />
            <meta name="viewport" content="width=device-width, initial-scale=1.0" />
            <meta name="theme-color" content="#5ac9cd" />
          </Helmet>
          <Routes>
            {/* Public pages with header and footer */}
            <Route path="/" element={<Layout><Home /></Layout>} />
            <Route path="/contact" element={<Layout><ContactUs /></Layout>} />
            <Route path="/deals-catlog" element={<Layout><DisplayDeals /></Layout>} />
            <Route path="/deals-catlog/deals/:dealId" element={<Layout><ViewSingleDeal /></Layout>} />

            {/* Routes without header and footer */}
            <Route path="/dashboard/*" element={<AllDashboard />} />
            <Route path="/register" element={<SignupForm />} />
            <Route path="/login" element={<LoginForm />} />
            <Route path="/forget-password" element={<ForgetPassword />} />
            <Route path="/login/reset-password/:token" element={<ResetPassword />} />
            <Route path="/distributor/view/deals/:dealId/commitments" element={<SingleDealCommitments />} />
            <Route path="/login/create-password" element={<CreatePassword />} />
            <Route path="/distributor/view-deal/:dealId" element={<ViewDeal />} />
            <Route path="/dashboard/distributer/orders/:dealId" element={<ViewSingleDeal />} />
            <Route path="/commitment-details/:commitmentId" element={<CommitmentDetails />} />
            <Route path="/distributor/view/deals/:dealId/commitments/:commitmentId" element={<CommitmentDetails />} />
            <Route path="/commitment-charts/:userId" element={<CommitmentCharts />} />
            <Route path="/payment/:commitmentId" element={<PaymentPage />} />
            <Route path="/thank-you" element={<ThankYou />} />
            
            {/* Distributor Routes */}
            <Route path="/distributor/deal-analytics/:dealId" element={<DealAnalytics />} />
            <Route path="/distributor/compare" element={<Compare />} />

            {/* Admin Routes */}
            <Route path="/admin/deal-analytics/:dealId" element={<DealAnalytics />} />
            <Route path="/coop-members" element={<AllCoopMembers />} />
            <Route path="/create-password/:token" element={<CreateAddedMembersPassword />} />
          </Routes>
        </Router>
      </SnackbarProvider>
    </ThemeProvider>
  );
}

export default App;
