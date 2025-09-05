import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import {
  Badge,
  Box,
  IconButton,
  List,
  ListItem,
  Typography,
  Divider,
  Button,
  CircularProgress,
  Chip,
  Alert,
  Snackbar
} from '@mui/material';
import {
  NotificationsActive as NotificationsActiveIcon,
  Delete as DeleteIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
  Warning as WarningIcon,
  Close as CloseIcon
} from '@mui/icons-material';

const Notification = ({ onClose }) => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  useEffect(() => {
    fetchNotifications();
    fetchUnreadCount();
    // Set up polling for new notifications every 30 seconds
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchNotifications = async (pageNum = 1) => {
    try {
      setLoading(true);
      const response = await api.get(`/api/notifications?page=${pageNum}&limit=10`);
      const { notifications: newNotifications, totalPages, currentPage } = response.data;
      
      if (pageNum === 1) {
        setNotifications(newNotifications);
      } else {
        setNotifications(prev => [...prev, ...newNotifications]);
      }
      
      setHasMore(currentPage < totalPages);
      setPage(currentPage);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      showSnackbar('Failed to fetch notifications', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchUnreadCount = async () => {
    try {
      const response = await api.get('/api/notifications/count');
      setUnreadCount(response.data.count);
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  };

  const handleMarkAsRead = async (notificationIds) => {
    try {
      await api.put('/api/notifications/read', { notificationIds });
      setNotifications(prev =>
        prev.map(notification =>
          notificationIds.includes(notification._id)
            ? { ...notification, isRead: true }
            : notification
        )
      );
      fetchUnreadCount();
      showSnackbar('Notifications marked as read', 'success');
    } catch (error) {
      console.error('Error marking notifications as read:', error);
      showSnackbar('Failed to mark notifications as read', 'error');
    }
  };

  const handleDelete = async (notificationIds) => {
    try {
      await api.delete('/api/notifications', { data: { notificationIds } });
      setNotifications(prev =>
        prev.filter(notification => !notificationIds.includes(notification._id))
      );
      fetchUnreadCount();
      showSnackbar('Notifications deleted', 'success');
    } catch (error) {
      console.error('Error deleting notifications:', error);
      showSnackbar('Failed to delete notifications', 'error');
    }
  };

  const showSnackbar = (message, severity) => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'auth':
        return <NotificationsActiveIcon color="primary.contrastText" />;
      case 'deal':
        return <InfoIcon color="info" />;
      case 'favorite':
        return <CheckCircleIcon color="success" />;
      case 'commitment':
        return <WarningIcon color="warning" />;
      case 'chat':
        return <ErrorIcon color="error" />;
      default:
        return <InfoIcon color='primary.contrastText' />;
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high':
        return 'error';
      case 'medium':
        return 'warning';
      case 'low':
        return 'info';
      default:
        return 'default';
    }
  };

  const formatTimeAgo = (date) => {
    const now = new Date();
    const past = new Date(date);
    const diffInSeconds = Math.floor((now - past) / 1000);
    
    if (diffInSeconds < 60) return 'just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`;
    return new Date(date).toLocaleDateString();
  };

  const loadMore = () => {
    fetchNotifications(page + 1);
  };

  const markAllAsRead = () => {
    const unreadIds = notifications
      .filter(notification => !notification.isRead)
      .map(notification => notification._id);
    if (unreadIds.length > 0) {
      handleMarkAsRead(unreadIds);
    }
  };

  return (
    <Box sx={{ maxWidth: 800, margin: 'auto' }}>
      <Box 
        sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          p: { xs: 1.5, sm: 2 },
          position: 'sticky',
          top: 0,
          bgcolor: 'background.paper',
          zIndex: 1,
          gap: 1,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
          {unreadCount > 0 && (
            <Chip
              icon={<NotificationsActiveIcon />}
              label={`${unreadCount} unread`}
              color="error"
              size="small"
              sx={{ 
                height: 24,
                '& .MuiChip-label': {
                  px: 1,
                  fontSize: '0.75rem',
                },
              }}
            />
          )}
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            color="primary.contrastText"
            onClick={markAllAsRead}
            disabled={unreadCount === 0}
            size="small"
            startIcon={<CheckCircleIcon color='primary.contrastText' />}
            sx={{
              borderRadius: 20,
              textTransform: 'none',
              minWidth: { xs: 'auto', sm: '120px' },
              px: { xs: 1, sm: 2 },
              '& .MuiButton-startIcon': {
                mr: { xs: 0, sm: 1 },
              },
              '& .MuiButton-endIcon': {
                ml: { xs: 0, sm: 1 },
              },
            }}
          >
            <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
              Mark all read
            </Box>
          </Button>
        </Box>
      </Box>

      {loading && notifications.length === 0 ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
          <CircularProgress size={40} />
        </Box>
      ) : notifications.length === 0 ? (
        <Box 
          sx={{ 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            p: { xs: 3, sm: 4 },
            color: 'text.secondary',
            minHeight: { xs: '50vh', sm: 'auto' },
            justifyContent: 'center',
          }}
        >
          <NotificationsActiveIcon sx={{ fontSize: { xs: 40, sm: 48 }, mb: 2, opacity: 0.5, color: 'primary.contrastText' }}  />
          <Typography variant="h6" align="center">No notifications</Typography>
          <Typography variant="body2" align="center">You're all caught up!</Typography>
        </Box>
      ) : (
        <List sx={{ p: 0 }}>
          {notifications.map((notification, index) => (
            <React.Fragment key={notification._id}>
              <ListItem
                sx={{
                  bgcolor: notification.isRead ? 'transparent' : 'action.hover',
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    bgcolor: 'action.selected',
                  },
                  px: { xs: 1.5, sm: 3 },
                  py: { xs: 1.5, sm: 2 },
                }}
                secondaryAction={
                  <Box sx={{ 
                    display: 'flex', 
                    gap: 1,
                    position: { xs: 'relative', sm: 'absolute' },
                    right: { xs: 0, sm: 16 },
                    mt: { xs: 1, sm: 0 },
                  }}>
                    <IconButton
                      size="small"
                      onClick={() => handleMarkAsRead([notification._id])}
                      disabled={notification.isRead}
                      sx={{
                        color: notification.isRead ? 'success.main' : 'action.active',
                        '&:hover': {
                          bgcolor: 'action.hover',
                        },
                      }}
                    >
                      <CheckCircleIcon fontSize="small" color='primary.contrastText' />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => handleDelete([notification._id])}
                      sx={{
                        color: 'error.light',
                        '&:hover': {
                          bgcolor: 'error.lighter',
                        },
                      }}
                    >
                      <DeleteIcon fontSize="small" color='primary.contrastText' />
                    </IconButton>
                  </Box>
                }
              >
                <Box sx={{ 
                  display: 'flex', 
                  width: '100%', 
                  gap: { xs: 1, sm: 2 },
                  flexDirection: { xs: 'column', sm: 'row' },
                }}>
                  <Box 
                    sx={{ 
                      display: 'flex', 
                      alignItems: { xs: 'center', sm: 'flex-start' },
                      color: `${notification.type}.main`,
                    }}
                  >
                    {getNotificationIcon(notification.type)}
                  </Box>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Box sx={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      mb: 0.5, 
                      gap: 1,
                      flexWrap: 'wrap',
                    }}>
                      <Typography
                        variant="subtitle2"
                        component="div"
                        sx={{
                          fontWeight: notification.isRead ? 400 : 600,
                          color: notification.isRead ? 'text.secondary' : 'text.primary',
                          fontSize: { xs: '0.875rem', sm: '1rem' },
                        }}
                      >
                        {notification.title}
                      </Typography>
                      <Chip
                        size="small"
                        label={notification.priority}
                        color={getPriorityColor(notification.priority)}
                        sx={{ 
                          height: 20,
                          '& .MuiChip-label': {
                            px: 1,
                            fontSize: '0.75rem',
                          },
                        }}
                      />
                    </Box>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{
                        mb: 0.5,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        display: '-webkit-box',
                        WebkitLineClamp: { xs: 3, sm: 2 },
                        WebkitBoxOrient: 'vertical',
                        fontSize: { xs: '0.8125rem', sm: '0.875rem' },
                      }}
                    >
                      {notification.message}
                    </Typography>
                    <Typography 
                      variant="caption" 
                      sx={{ 
                        color: 'text.disabled',
                        display: 'block',
                        fontSize: { xs: '0.75rem', sm: '0.8125rem' },
                      }}
                    >
                      {formatTimeAgo(notification.createdAt)}
                    </Typography>
                  </Box>
                </Box>
              </ListItem>
              {index < notifications.length - 1 && (
                <Divider sx={{ opacity: 0.5 }} />
              )}
            </React.Fragment>
          ))}
        </List>
      )}

      {hasMore && (
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'center', 
          p: { xs: 1.5, sm: 2 },
          pb: { xs: 3, sm: 2 },
        }}>
          <Button
            variant="text"
            onClick={loadMore}
            disabled={loading}
            sx={{
              textTransform: 'none',
              borderRadius: 20,
              minWidth: { xs: '50%', sm: '120px' },
              color: 'primary.contrastText',
              bgcolor:'primary.main'
            }}
          >
            {loading ? (
              <CircularProgress size={20} sx={{ mr: 1 }} />
            ) : (
              'Load More'
            )}
          </Button>
        </Box>
      )}

      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        sx={{
          bottom: { xs: 16, sm: 24 },
        }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          variant="filled"
          sx={{
            width: '100%',
            boxShadow: 4,
            borderRadius: 2,
            '& .MuiAlert-message': {
              fontSize: { xs: '0.875rem', sm: '1rem' },
            },
          }}
          action={
            <IconButton
              size="small"
              aria-label="close"
              color="inherit"
              onClick={handleCloseSnackbar}
            >
              <CloseIcon fontSize="small" color='primary.contrastText' />
            </IconButton>
          }
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Notification;
