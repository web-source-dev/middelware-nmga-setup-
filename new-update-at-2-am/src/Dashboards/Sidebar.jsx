import React, { useState } from "react";
import {
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  IconButton,
  Tooltip,
  Typography,
  Divider,
  Collapse,
  Box,
  Popper,
  Paper,
  ClickAwayListener,
} from "@mui/material";
import {
  Home,
  Person,
  Settings,
  Description,
  Menu,
  ChevronLeft,
  GroupAdd,
  AssignmentInd,
  Lock,
  AccountBox,
  Visibility,
  CloudUpload,
  LocalOffer,
  Campaign,
  Announcement,
  TrackChanges,
  Speed,
  BugReport,
  History,
  ExpandLess,
  ExpandMore,
  Dashboard,
  Analytics as AnalyticsIcon,
  SupervisorAccount,
  MonitorHeart,
  Assessment,
  ContentPaste,
  Store,
  Inventory,
  ShoppingCart,
  Business,
  LocalShipping,
  Assignment as AssignmentIcon,
  HandshakeOutlined,
  People,
  CompareArrows,
  ContactSupport,
  Groups,
  PhotoLibrary,
  Storefront,
} from "@mui/icons-material";
import Links from "../Components/Buttons/Links";
import { useLocation } from "react-router-dom";
import { useAuth } from "../middleware/auth";

const Sidebar = ({ match, links, userRole = "admin" }) => {
  const [isOpen, setIsOpen] = useState(true);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [openSubmenus, setOpenSubmenus] = useState({});
  const [anchorEl, setAnchorEl] = useState(null);
  const [openPopupMenu, setOpenPopupMenu] = useState(null);
  const location = useLocation();

  const userContext = useAuth();
  const showContactButton = userContext.userRole === "distributor" || userContext.userRole === "member";

  const toggleSidebar = () => setIsOpen((prev) => !prev);
  const toggleMobileSidebar = () => setIsMobileOpen((prev) => !prev);
  const toggleSubmenu = (title) => {
    setOpenSubmenus((prev) => ({ ...prev, [title]: !prev[title] }));
  };

  const handlePopupMenu = (event, title) => {
    if (!isOpen) {
      setAnchorEl(event.currentTarget);
      setOpenPopupMenu(openPopupMenu === title ? null : title);
    } else {
      toggleSubmenu(title);
    }
  };

  const handleClosePopup = () => {
    setOpenPopupMenu(null);
    setAnchorEl(null);
  };

  // Check if a link is active
  const isLinkActive = (path) => {
    const currentPath = location.pathname;
    // Exclude "/dashboard" from the path matching
    // Check if it's an exact match at the end of the path or if it contains the path component
    return currentPath.endsWith(`/${path}`) || 
           (path !== '' && currentPath.includes(`/${path}`) && 
            !path.includes('dashboard'));
  };

  // Check if any sublink in a group is active
  const isAnySubLinkActive = (subLinks) => {
    if (!subLinks) return false;
    return subLinks.some(subLink => isLinkActive(subLink.path));
  };

  const getIcon = (label) => {
    switch (label) {
      case "Dashboard":
        return <Dashboard  color='primary.contrastText'/>;
      case "Analytics":
        return <AnalyticsIcon  color='primary.contrastText'/>;
      case "User Manage":
        return <SupervisorAccount  color='primary.contrastText'/>;
      case "User Monitoring":
        return <MonitorHeart  color='primary.contrastText'/>;
      case "Overview":
        return <Home  color='primary.contrastText'/>;
      case "Splash Content":
        return <ContentPaste  color='primary.contrastText'/>;
      case "Deal Management":
        return <LocalOffer  color='primary.contrastText'/>;
      case "Announcements":
        return <Announcement  color='primary.contrastText'/>;
      case "Orders":
        return <ShoppingCart  color='primary.contrastText'/>;
      case "Suppliers":
        return <LocalShipping  color='primary.contrastText'/>;
      case "Profile":
        return <Person  color='primary.contrastText'/>;
      case "Create Deal":
        return <Store  color='primary.contrastText'/>;
      case "Manage Deals":
        return <Business  color='primary.contrastText'/>;
      case "Bulk Upload":
        return <Inventory color='primary.contrastText' />;
      case "User Creation/Deletion":
        return <GroupAdd  color='primary.contrastText'/>;
      case "Role Assignment":
        return <AssignmentInd color='primary.contrastText'/>;
      case "Access Control":
        return <Lock  color='primary.contrastText'/>;
      case "Profile Management":
        return <AccountBox  color='primary.contrastText'/>;
      case "System-wide User Monitoring":
        return <Visibility  color='primary.contrastText'/>;
      case "Splash Page Content Upload":
        return <CloudUpload  color='primary.contrastText'/>;
      case "Promotional Content Management":
        return <Campaign  color='primary.contrastText'/>;
      case "System-wide Announcements":
        return <Announcement  color='primary.contrastText'/>;
      case "User Activity Tracking":
        return <TrackChanges  color='primary.contrastText'/>;
      case "System Performance Metrics":
        return <Speed  color='primary.contrastText'/>;
      case "Error Logging":
        return <BugReport  color='primary.contrastText'/>;
      case "Audit Trails":
        return <History  color='primary.contrastText'/>;
      case "All Commitments":
        return <AssignmentIcon  color='primary.contrastText'/>;
      case "All Deals":
        return <Business  color='primary.contrastText'/>;
      case "All Committed Deals":
        return <HandshakeOutlined  color='primary.contrastText'/>;
      case "Co-op Members":
        return <People  color='primary.contrastText'/>;
      case "Compare Supply":
        return <CompareArrows color='primary.contrastText'/>;
      case "Contact":
        return <ContactSupport color='primary.contrastText'/>;
      case "My Commitments":
        return <AssignmentIcon color='primary.contrastText'/>;
      case "Add Stores":
        return <Store color='primary.contrastText'/>;
      case "Detailed Analytics":
        return <Assessment  color='primary.contrastText'/>;
      case "Members Tracking":
        return <TrackChanges  color='primary.contrastText'/>;
      case "Team Management":
        return <Groups  color='primary.contrastText'/>;
      case "Stores/Contacts":
        return <Storefront  color='primary.contrastText'/>;
      case "Media":
        return <PhotoLibrary  color='primary.contrastText'/>;
      default:
        return <Description  color='primary.contrastText'/>;
    }
  };

  return (
    <>
      {/* Mobile Toggle Button */}
      <IconButton
        onClick={toggleMobileSidebar}
        sx={{ position: "fixed", top: 5, left: 5, zIndex: 1300, display: { xs: "block", sm: "block", md: "none" } }}
      >
        <Menu  color='primary.contrastText'/>
      </IconButton>

      {/* Sidebar for Desktop */}
      <Drawer
        variant="permanent"
        sx={{
          display: { xs: "none", sm: "none", md: "block" },
          width: isOpen ? 240 : 80,
          flexShrink: 0,
          "& .MuiDrawer-paper": {
            width: isOpen ? 240 : 80,
            transition: "width 0.3s",
            overflowX: "hidden",
          },
        }}
      >
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: isOpen ? "space-between" : "center",
              padding: "10px 15px",
            }}
          >
            {isOpen && <Typography variant="h6">Dashboard</Typography>}
            <IconButton onClick={toggleSidebar}>{isOpen ? <ChevronLeft  color='primary.contrastText'/> : <Menu  color='primary.contrastText'/>}</IconButton>
          </div>
          <Divider />
          <List>
            {links.map((link, index) => (
              link.title ? (
                <div key={index}>
                  <Tooltip key={index} title={link.title} placement="right" disableHoverListener={isOpen}>
                  <ListItem 
                    button 
                    onClick={(e) => handlePopupMenu(e, link.title)}
                    sx={{
                      backgroundColor: isAnySubLinkActive(link.subLinks) ? 'rgba(0, 85, 164, 0.1)' : 'transparent',
                    }}
                  >
                    <ListItemIcon sx={{ justifyContent: isOpen ? "space-around" : "center", alignItems: "center", display: "flex", fontSize: "10em" }}>{<LocalOffer />}</ListItemIcon>
                    {isOpen && <ListItemText primary={link.title} />}
                    {isOpen && (
                      (openSubmenus[link.title] ? <ExpandLess  color='primary.contrastText'/> : <ExpandMore  color='primary.contrastText'/>)
                    )}
                  </ListItem>
                    </Tooltip>

                    {isOpen ? (
                      <Collapse in={openSubmenus[link.title]} timeout="auto" unmountOnExit>
                        <List component="div" disablePadding>
                          {link.subLinks.map((subLink, subIndex) => (
                            <Tooltip key={subIndex} title={subLink.label} placement="right" disableHoverListener={isOpen}>
                              <ListItem 
                                button 
                                sx={{ 
                                  pl: 4,
                                  backgroundColor: isLinkActive(subLink.path) ? 'rgba(0, 85, 164, 0.1)' : 'transparent',
                                }}
                              >
                                <ListItemIcon sx={{ justifyContent: isOpen ? "space-around" : "center", alignItems: "center", display: "flex", fontSize: "10em" }}>
                                  {getIcon(subLink.label)}
                                </ListItemIcon>
                                {isOpen && <ListItemText primary={<Links link={`${match.pathnameBase}/${subLink.path}`} linkText={subLink.label} size="0.97em" />} />}
                              </ListItem>
                            </Tooltip>
                          ))}
                        </List>
                      </Collapse>
                    ) : (
                      <Popper
                        open={openPopupMenu === link.title}
                        anchorEl={anchorEl}
                        placement="right-start"
                        style={{ zIndex: 1400 }}
                      >
                        <ClickAwayListener onClickAway={handleClosePopup}>
                          <Paper sx={{ p: 1, bgcolor: 'background.paper' }}>
                            <Box
                              sx={{
                                display: 'flex',
                                flexDirection: 'column',
                                gap: 1,
                                minWidth: 180,
                              }}
                            >
                              {link.subLinks.map((subLink, subIndex) => (
                                <ListItem 
                                  button 
                                  key={subIndex}
                                  onClick={handleClosePopup}
                                  dense
                                  sx={{
                                    backgroundColor: isLinkActive(subLink.path) ? 'rgba(0, 85, 164, 0.1)' : 'transparent',
                                  }}
                                >
                                  <ListItemIcon sx={{ minWidth: 40 }}>
                                    {getIcon(subLink.label)}
                                  </ListItemIcon>
                                  <ListItemText 
                                    primary={
                                      <Links 
                                        link={`${match.pathnameBase}/${subLink.path}`} 
                                        linkText={subLink.label} 
                                        size="0.97em" 
                                      />
                                    } 
                                  />
                                </ListItem>
                              ))}
                            </Box>
                          </Paper>
                        </ClickAwayListener>
                      </Popper>
                    )}
                </div>
              ) : (
                <Tooltip key={index} title={link.label} placement="right" disableHoverListener={isOpen}>
                  <ListItem 
                    button
                    sx={{
                      backgroundColor: isLinkActive(link.path) ? 'rgba(0, 85, 164, 0.1)' : 'transparent',
                    }}
                  >
                    <ListItemIcon sx={{ justifyContent: isOpen ? "space-around" : "center", alignItems: "center", display: "flex", fontSize: "10em" }}>
                      {getIcon(link.label)}
                    </ListItemIcon>
                    {isOpen && <ListItemText primary={<Links link={`${match.pathnameBase}/${link.path}`} linkText={link.label} size="0.97em" />} />}
                  </ListItem>
                </Tooltip>
              )
            ))}
          </List>
          
          {/* Contact button - only visible for distributor and member roles and positioned at bottom */}
          {showContactButton && (
            <List sx={{ marginTop: 'auto' }}>
              <Divider />
              <Tooltip title="Contact" placement="right" disableHoverListener={isOpen}>
                <ListItem 
                  button
                  sx={{
                    backgroundColor: isLinkActive('contact') ? 'rgba(0, 85, 164, 0.1)' : 'transparent',
                  }}
                >
                  <ListItemIcon sx={{ justifyContent: isOpen ? "space-around" : "center", alignItems: "center", display: "flex", fontSize: "10em" }}>
                    <ContactSupport  color='primary.contrastText'/>
                  </ListItemIcon>
                  {isOpen && <ListItemText primary={<Links link={`/contact`} linkText="Contact" size="0.97em" />} />}
                </ListItem>
              </Tooltip>
            </List>
          )}
        </Box>
      </Drawer>

      {/* Sidebar for Mobile */}
      <Drawer
        variant="temporary"
        open={isMobileOpen}
        onClose={toggleMobileSidebar}
        sx={{ "& .MuiDrawer-paper": { width: 340, pt: "40px" } }}
        anchor="left"
      >
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          <List>
            {links.map((link, index) => (
              link.title ? (
                <div key={index}>
                  <ListItem 
                    button 
                    onClick={() => toggleSubmenu(link.title)}
                    sx={{
                      backgroundColor: isAnySubLinkActive(link.subLinks) ? 'rgba(0, 85, 164, 0.1)' : 'transparent',
                    }}
                  >
                    <ListItemIcon>{getIcon(link.title)}</ListItemIcon>
                    <ListItemText primary={link.title} />
                    {openSubmenus[link.title] ? <ExpandLess  color='primary.contrastText'/> : <ExpandMore  color='primary.contrastText'/>}
                  </ListItem>
                  <Collapse in={openSubmenus[link.title]} timeout="auto" unmountOnExit>
                    <List component="div" disablePadding>
                      {link.subLinks.map((subLink, subIndex) => (
                        <ListItem 
                          button 
                          key={subIndex} 
                          onClick={toggleMobileSidebar} 
                          sx={{ 
                            pl: 4,
                            backgroundColor: isLinkActive(subLink.path) ? 'rgba(0, 85, 164, 0.1)' : 'transparent',
                          }}
                        >
                          <ListItemIcon>{getIcon(subLink.label)}</ListItemIcon>
                          <ListItemText primary={<Links link={`${match.pathnameBase}/${subLink.path}`} linkText={subLink.label} />} />
                        </ListItem>
                      ))}
                    </List>
                  </Collapse>
                </div>
              ) : (
                <ListItem 
                  button 
                  key={index} 
                  onClick={toggleMobileSidebar}
                  sx={{
                    backgroundColor: isLinkActive(link.path) ? 'rgba(0, 85, 164, 0.1)' : 'transparent',
                  }}
                >
                  <ListItemIcon>{getIcon(link.label)}</ListItemIcon>
                  <ListItemText primary={<Links link={`${match.pathnameBase}/${link.path}`} linkText={link.label} />} />
                </ListItem>
              )
            ))}
          </List>

          {/* Contact button for mobile - only visible for distributor and member roles and positioned at bottom */}
          {showContactButton && (
            <List sx={{ marginTop: 'auto' }}>
              <Divider />
              <ListItem 
                button 
                onClick={toggleMobileSidebar}
                sx={{
                  backgroundColor: isLinkActive('contact') ? 'rgba(0, 85, 164, 0.1)' : 'transparent',
                }}
              >
                <ListItemIcon><ContactSupport /></ListItemIcon>
                <ListItemText primary={<Links link={`/contact`} linkText="Contact" />} />
              </ListItem>
            </List>
          )}
        </Box>
      </Drawer>
    </>
  );
};

export default Sidebar;
