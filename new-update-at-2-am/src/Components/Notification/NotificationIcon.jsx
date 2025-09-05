import React, { useState, useEffect } from 'react';
import {
  IconButton,
  Badge,
  Drawer,
  Box,
  Typography,
  useTheme,
  useMediaQuery,
  Fade,
  Stack,
  Chip,
} from '@mui/material';
import { 
  NotificationsActive as NotificationsIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import api from '../../services/api';
import { getCurrentUserContext } from '../../services/api';
import Notification from './Notification';

const NotificationIcon = () => {
  const [unreadCount, setUnreadCount] = useState(0);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isImpersonating, setIsImpersonating] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000); // Poll every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchUnreadCount = async () => {
    try {
      const response = await api.get('/api/notifications/count');
      setUnreadCount(response.data.count);
      setIsImpersonating(response.data.isImpersonating || false);
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  };

  const toggleDrawer = () => {
    setIsDrawerOpen(!isDrawerOpen);
  };

  return (
    <>
      <Fade in={true}>
        <IconButton
          color="primary.contrastText"
          onClick={toggleDrawer}
          sx={{
            mr: 2,
            transition: 'transform 0.2s',
            '&:hover': {
              transform: 'scale(1.1)',
            },
            position: 'relative',
          }}
        >
          <Badge
            badgeContent={unreadCount}
            color="error"
            sx={{
              '& .MuiBadge-badge': {
                fontSize: '0.8rem',
                height: '20px',
                minWidth: '20px',
                borderRadius: '10px',
              }
            }}
          >
            <NotificationsIcon sx={{ fontSize: 28, color: 'primary.contrastText' }} />
          </Badge>
        </IconButton>
      </Fade>

      <Drawer
        anchor={isMobile ? "bottom" : "right"}
        open={isDrawerOpen}
        onClose={toggleDrawer}
        PaperProps={{
          sx: {
            width: {
              xs: '100%',
              sm: 400,
              md: 500
            },
            height: {
              xs: 'calc(100% - 56px)',  // Adjust for mobile bottom spacing
              sm: '100%'
            },
            maxWidth: '100%',
            borderTopLeftRadius: isMobile ? '16px' : '16px',
            borderTopRightRadius: isMobile ? '16px' : '0px',
            borderBottomLeftRadius: isMobile ? '0px' : '16px',
            boxShadow: theme.shadows[8],
          }
        }}
        SlideProps={{
          timeout: 300,
        }}
      >
        <Box 
          sx={{ 
            width: '100%', 
            height: '100%', 
            overflowY: 'auto',
            bgcolor: theme.palette.background.default,
          }}
        >
          <Box
            sx={{
              position: 'sticky',
              top: 0,
              zIndex: 1,
              bgcolor: theme.palette.background.paper,
              borderBottom: `1px solid ${theme.palette.divider}`,
              px: 2,
              py: 1.5,
            }}
          >
            <Stack 
              direction="row" 
              alignItems="center" 
              justifyContent="space-between"
              spacing={2}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="h6" component="div">
                  Notifications
                </Typography>
                {isImpersonating && (
                  <Chip
                    label="Admin Mode"
                    size="small"
                    color="warning"
                    sx={{ fontSize: '0.7rem', height: '20px' }}
                  />
                )}
              </Box>
              <IconButton
                onClick={toggleDrawer}
                size="small"
                sx={{
                  color: 'text.secondary',
                  '&:hover': {
                    color: 'text.primary',
                    bgcolor: 'action.hover',
                  },
                }}
              >
                <CloseIcon color='primary.contrastText' />
              </IconButton>
            </Stack>
          </Box>
          <Notification onClose={toggleDrawer} />
        </Box>
      </Drawer>
    </>
  );
};

export default NotificationIcon; 