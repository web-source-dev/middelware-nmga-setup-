import React, { useState, useEffect } from 'react';
import {
  AppBar,
  Box,
  Toolbar,
  IconButton,
  Typography,
  Menu,
  Container,
  Avatar,
  Button,
  Tooltip,
  MenuItem,
  Drawer,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  useTheme,
  useMediaQuery,
  CardMedia
} from '@mui/material';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import MenuIcon from '@mui/icons-material/Menu';
import HomeIcon from '@mui/icons-material/Home';
import InfoIcon from '@mui/icons-material/Info';
import BusinessIcon from '@mui/icons-material/Business';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import SupportIcon from '@mui/icons-material/Support';
import LoginIcon from '@mui/icons-material/Login';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import SettingsIcon from '@mui/icons-material/Settings';
import DashboardIcon from '@mui/icons-material/Dashboard';
import LogoutIcon from '@mui/icons-material/Logout';
import axios from 'axios';
import { styled } from '@mui/system';
import 'typeface-poppins'; // Requires npm install typeface-poppins

// Add styled components for consistent styling
const StyledAppBar = styled(AppBar)(({ theme }) => ({
  background: theme.palette.background.default,
  boxShadow: theme.shadows[2],
  borderBottom: `1px solid ${theme.palette.grey[200]}`,
  backdropFilter: 'blur(10px)',
}));

const StyledToolbar = styled(Toolbar)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'space-between',
}));

const NavButton = styled(Button)(({ theme, active }) => ({
  my: 1,
  mx: 1.5,
  color: active ? theme.palette.secondary.main : theme.palette.primary.contrastText,
  fontWeight: active ? 600 : 500,
  fontSize: '0.95rem',
  letterSpacing: '0.02em',
  borderRadius: '8px',
  padding: '8px 16px',
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  '&:hover': {
    backgroundColor: theme.palette.secondary.contrastText,
    transform: 'translateY(-1px)',
  },
  '&::after': active ? {
    content: '""',
    display: 'block',
    width: '100%',
    height: '2px',
    backgroundColor: theme.palette.secondary.contrastText,
    position: 'absolute',
    bottom: '-4px',
    left: 0,
  } : null,
}));

const StyledAvatar = styled(Avatar)(({ theme }) => ({
  bgcolor: theme.palette.secondary.main,
  color: theme.palette.secondary.contrastText,
}));

const Header = () => {
  const [anchorElNav, setAnchorElNav] = useState(null);
  const [anchorElUser, setAnchorElUser] = useState(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState(null);

  const pages = [
    { title: 'Deals', path: '/deals-catlog', icon: <LocalOfferIcon /> },
  ];

  const settings = [
    { title: 'Login', path: '/login', icon: <LoginIcon /> },
    { title: 'Register', path: '/register', icon: <PersonAddIcon /> },
  ];

  const UserMenuPaperProps = {
    elevation: 3,
    sx: {
      borderRadius: '12px',
      marginTop: '8px',
      minWidth: '200px',
      boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
      '& .MuiMenuItem-root': {
        padding: '10px 16px',
        borderRadius: '8px',
        margin: '4px 8px',
        transition: 'all 0.2s ease',
        '&:hover': {
          backgroundColor: theme.palette.background.light,
        }
      }
    }
  };

  const handleOpenNavMenu = (event) => {
    setAnchorElNav(event.currentTarget);
  };

  const handleOpenUserMenu = (event) => {
    setAnchorElUser(event.currentTarget);
  };

  const handleCloseNavMenu = () => {
    setAnchorElNav(null);
  };

  const handleCloseUserMenu = () => {
    setAnchorElUser(null);
  };

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const isActive = (path) => {
    return location.pathname === path;
  };

  useEffect(() => {
    const fetchUserData = async () => {
      const userId = localStorage.getItem('user_id');
      if (userId) {
        try {
          const response = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/member/user/${userId}`);
          setUser(response.data);
        } catch (error) {
          console.error('Error fetching user data:', error);
        }
      }
    };

    fetchUserData();
  }, []);

  const handleLogout = async () => {
    const role = localStorage.getItem('user_role');
    const id = localStorage.getItem('user_id') || localStorage.getItem('admin_id');
    try {
      await axios.post(`${process.env.REACT_APP_BACKEND_URL}/auth/logout`, { id, role });
      localStorage.clear();
      navigate('/login');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const drawer = (
    <Box sx={{ width: 250 }} role="presentation" onClick={handleDrawerToggle}>
      <List>
        {pages.map((page) => (
          <ListItem 
            button 
            key={page.title} 
            component={Link} 
            to={page.path}
            sx={{
              bgcolor: isActive(page.path) ? 'background.light' : 'transparent',
              '&:hover': {
                bgcolor: 'background.light',
              }
            }}
          >
            <ListItemIcon sx={{ color: isActive(page.path) ? 'primary.main' : 'inherit' }}>
              {page.icon}
            </ListItemIcon>
            <ListItemText 
              primary={page.title} 
              sx={{ 
                color: isActive(page.path) ? 'primary.main' : 'inherit',
                fontWeight: isActive(page.path) ? 'bold' : 'normal'
              }}
            />
          </ListItem>
        ))}
      </List>
    </Box>
  );

  return (
    <StyledAppBar position="sticky">
      <Container maxWidth="xl">
        <StyledToolbar disableGutters sx={{ py: 1 }}>
          {/* Enhanced Logo */}
          <Typography
            variant="h6"
            component={Link}
            to="/"
            sx={{
              display: 'flex',
              alignItems: 'center',
              fontWeight: 800,
              color: 'text.primary',
              textDecoration: 'none',
              fontFamily: "'Poppins', sans-serif",
              '&:hover': {
                opacity: 0.9,
              }
            }}
          >
            <Box 
              component="span" 
              sx={{
                mr: 5,
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <CardMedia 
          component="img"
          height="50"
          width="200"
          image="/fav.png"
          alt="Logo"
          sx={{ objectFit: 'contain' }}
          />
            </Box>
          </Typography>

          {/* Enhanced Mobile Menu Button */}
          <IconButton
            onClick={handleDrawerToggle}
            sx={{
              color: 'text.primary',
              display: { xs: 'flex', md: 'none' },
              '&:hover': {
                backgroundColor: 'background.light'
              }
            }}
          >
            <MenuIcon sx={{ fontSize: '1.8rem' }} />
          </IconButton>

          {/* Desktop navigation */}
          <Box sx={{ flexGrow: 1, display: { xs: 'none', md: 'flex' } }}>
            {pages.map((page) => (
              <NavButton
                key={page.title}
                component={Link}
                to={page.path}
                onClick={handleCloseNavMenu}
                active={isActive(page.path) ? 1 : 0}
              >
                <Box sx={{ mr: 0.5, display: 'flex', alignItems: 'center' }}>
                  {page.icon}
                </Box>
                {page.title}
              </NavButton>
            ))}
          </Box>

          {/* Enhanced User Menu Section */}
          <Box sx={{ flexGrow: 0, display: 'flex', alignItems: 'center' }}>
            <Tooltip title={user ? "Account menu" : "Authentication options"}>
              <IconButton
                onClick={handleOpenUserMenu}
                sx={{
                  p: 0,
                  ml: 2,
                  display: 'flex',
                  alignItems: 'center',
                  transition: 'transform 0.2s ease',
                  '&:hover': {
                    transform: 'scale(1.05)'
                  }
                }}
              >
                <Box sx={{ position: 'relative' }}>
                  <StyledAvatar src={user?.logo} alt={user?.name}>
                    {!user && <PersonAddIcon sx={{ fontSize: '1.4rem' }} />}
                  </StyledAvatar>
                  <ArrowDropDownIcon sx={{ 
                    position: 'absolute', 
                    right: -8, 
                    bottom: -8, 
                    fontSize: '1.2rem', 
                    bgcolor: 'background.paper', 
                    borderRadius: '50%' 
                  }} />
                </Box>
              </IconButton>
            </Tooltip>
            
            <Menu
              PaperProps={UserMenuPaperProps}
              aria-label="user menu"
              sx={{ mt: '45px' }}
              id="menu-appbar"
              anchorEl={anchorElUser}
              anchorOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
              keepMounted
              transformOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
              open={Boolean(anchorElUser)}
              onClose={handleCloseUserMenu}
            >
              {user ? (
                <>
                  <MenuItem onClick={() => { 
                    const role = localStorage.getItem('user_role');
                    handleCloseUserMenu(); 
                    navigate(`/dashboard/${role === 'member' ? 'co-op-member' : role}/profile/${user._id}`) 
                  }}>
                    <ListItemIcon sx={{ minWidth: '36px !important' }}>
                      <InfoIcon sx={{ color: 'text.secondary', fontSize: '1.2rem' }} />
                    </ListItemIcon>
                    <Typography variant="body2" fontWeight={500}>Profile</Typography>
                  </MenuItem>
                  <MenuItem onClick={() => { 
                    const role = localStorage.getItem('user_role');
                    handleCloseUserMenu(); 
                    navigate(`/dashboard/${role === 'member' ? 'co-op-member' : role}/profile/${user._id}?tab=settings`) 
                  }}>
                    <ListItemIcon sx={{ minWidth: '36px !important' }}>
                      <SettingsIcon sx={{ color: 'text.secondary', fontSize: '1.2rem' }} />
                    </ListItemIcon>
                    <Typography variant="body2" fontWeight={500}>Settings</Typography>
                  </MenuItem>
                  <MenuItem onClick={() => { 
                    const role = localStorage.getItem('user_role');
                    handleCloseUserMenu(); 
                    navigate(`/dashboard/${role === 'member' ? 'co-op-member' : role}`) 
                  }}>
                    <ListItemIcon sx={{ minWidth: '36px !important' }}>
                      <DashboardIcon sx={{ color: 'text.secondary', fontSize: '1.2rem' }} />
                    </ListItemIcon>
                    <Typography variant="body2" fontWeight={500}>Dashboard</Typography>
                  </MenuItem>
                  <MenuItem onClick={() => { handleCloseUserMenu(); handleLogout() }}>
                    <ListItemIcon sx={{ minWidth: '36px !important' }}>
                      <LogoutIcon sx={{ color: 'text.secondary', fontSize: '1.2rem' }} />
                    </ListItemIcon>
                    <Typography variant="body2" fontWeight={500}>Logout</Typography>
                  </MenuItem>
                </>
              ) : (
                <>
                  <MenuItem onClick={() => { handleCloseUserMenu(); navigate('/login') }}>
                    <ListItemIcon sx={{ minWidth: '36px !important' }}>
                      <LoginIcon sx={{ color: 'text.secondary', fontSize: '1.2rem' }} />
                    </ListItemIcon>
                    <Box>
                      <Typography variant="body2" fontWeight={600}>Sign In</Typography>
                      <Typography variant="caption" color="textSecondary">Access your account</Typography>
                    </Box>
                  </MenuItem>
                  <MenuItem onClick={() => { handleCloseUserMenu(); navigate('/register') }}>
                    <ListItemIcon sx={{ minWidth: '36px !important' }}>
                      <PersonAddIcon sx={{ color: 'text.secondary', fontSize: '1.2rem' }} />
                    </ListItemIcon>
                    <Box>
                      <Typography variant="body2" fontWeight={600}>Register</Typography>
                      <Typography variant="caption" color="textSecondary">Create a new account</Typography>
                    </Box>
                  </MenuItem>
                </>
              )}
            </Menu>
          </Box>

          {/* Mobile Drawer */}
          <Drawer
            variant="temporary"
            anchor="left"
            open={mobileOpen}
            onClose={handleDrawerToggle}
            ModalProps={{
              keepMounted: true, // Better open performance on mobile
            }}
            sx={{
              display: { xs: 'block', md: 'none' },
              '& .MuiDrawer-paper': { 
                boxSizing: 'border-box', 
                width: 250,
                bgcolor: 'background.paper',
                borderRight: `1px solid ${theme.palette.grey[200]}`,
                transition: 'transform 0.3s ease-in-out',
              },
            }}
          >
            {drawer}
          </Drawer>
        </StyledToolbar>
      </Container>
    </StyledAppBar>
  );
};

export default Header;