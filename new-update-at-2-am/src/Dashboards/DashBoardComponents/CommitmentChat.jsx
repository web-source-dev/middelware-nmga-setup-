import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Paper,
  TextField,
  IconButton,
  Typography,
  Avatar,
  Divider,
  CircularProgress,
  Alert,
  useTheme,
  useMediaQuery,
  Badge,
  Tooltip,
  Chip,
  Skeleton,
} from '@mui/material';
import { 
  Send as SendIcon,
  AccessTime as AccessTimeIcon,
  DoneAll as DoneAllIcon,
  AdminPanelSettings as AdminIcon,
  Person as PersonIcon,
  Business as BusinessIcon,
} from '@mui/icons-material';
import api from '../../services/api';
import { useAuth } from '../../middleware/auth';

const ChatSkeleton = () => (
  <Paper sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
    <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
      <Skeleton variant="text" sx={{ fontSize: '1.5rem' }} />
    </Box>
    
    <Box sx={{ flex: 1, p: 2, overflow: 'auto' }}>
      {[...Array(5)].map((_, index) => (
        <Box
          key={index}
          sx={{
            display: 'flex',
            flexDirection: index % 2 === 0 ? 'row' : 'row-reverse',
            mb: 2,
            gap: 1
          }}
        >
          <Skeleton variant="circular" width={40} height={40} />
          <Box sx={{ maxWidth: '70%' }}>
            <Skeleton variant="text" sx={{ fontSize: '0.875rem' }} />
            <Skeleton variant="rectangular" height={60} sx={{ borderRadius: 1 }} />
            <Skeleton variant="text" width={100} sx={{ fontSize: '0.75rem' }} />
          </Box>
        </Box>
      ))}
    </Box>

    <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
      <Box sx={{ display: 'flex', gap: 1 }}>
        <Skeleton variant="rectangular" sx={{ flex: 1 }} height={56} />
        <Skeleton variant="circular" width={56} height={56} />
      </Box>
    </Box>
  </Paper>
);

const CommitmentChat = ({ commitmentId, commitment }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const messagesEndRef = useRef(null);
  const chatContainerRef = useRef(null);
  const { currentUserId, userRole, isAdmin } = useAuth();

  const scrollToBottom = () => {
    if (chatContainerRef.current) {
      const { scrollHeight, clientHeight } = chatContainerRef.current;
      chatContainerRef.current.scrollTo({
        top: scrollHeight - clientHeight,
        behavior: 'smooth'
      });
    }
  };

  const canAccessChat = () => {
    if (!commitment || !commitment.userId || !commitment.dealId) {
      console.log('Commitment data not fully loaded:', commitment);
      return false;
    }

    // Check if user is authorized to access this chat
    const isUserMatch = commitment.userId._id === currentUserId;
    const isDistributorMatch = commitment.dealId.distributor && 
                              commitment.dealId.distributor._id === currentUserId;

    console.log('Access check:', {
      isAdmin,
      userRole,
      currentUserId,
      commitmentUserId: commitment.userId._id,
      distributorId: commitment.dealId.distributor?._id,
      isUserMatch,
      isDistributorMatch
    });

    return isAdmin || isUserMatch || isDistributorMatch;
  };

  const fetchMessages = async () => {
    try {
      if (!commitment) {
        console.log('Waiting for commitment data...');
        return;
      }

      if (!canAccessChat()) {
        setError('You do not have permission to access this chat');
        setLoading(false);
        return;
      }

      const response = await api.get(
        `/chat/${commitmentId}?userId=${currentUserId}`
      );
      setMessages(response.data);
      setLoading(false);
      setTimeout(scrollToBottom, 100);
    } catch (error) {
      console.error('Error fetching messages:', error);
      setError(error.response?.data?.message || 'Failed to load messages');
      setLoading(false);
    }
  };

  useEffect(() => {
    if (commitment) {
      fetchMessages();
    }
  }, [commitment, commitmentId]);

  useEffect(() => {
    if (commitment) {
      const interval = setInterval(fetchMessages, 5000);
      return () => clearInterval(interval);
    }
  }, [commitment, commitmentId]);

  useEffect(() => {
    const markMessagesAsRead = async () => {
      try {
        if (!commitment || !canAccessChat()) return;
        
        await api.put(
          `/chat/${commitmentId}/read`,
          { userId: currentUserId }
        );
      } catch (error) {
        console.error('Error marking messages as read:', error);
      }
    };

    if (messages.length > 0) {
      markMessagesAsRead();
    }
  }, [messages, commitment]);
  const [sending, setSending] = useState(false);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !canAccessChat()) return;

    try {
      setSending(true);
      await api.post(`/chat/${commitmentId}`, {
        senderId: currentUserId,
        message: newMessage.trim(),
        role: isAdmin ? 'admin' : userRole, // Ensure admin role is set correctly
        isAdminMessage: isAdmin // Add flag for admin messages
      });
      setNewMessage('');
      fetchMessages();
    } catch (error) {
      console.error('Error sending message:', error);
      setError(error.response?.data?.message || 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const formatMessageTime = (timestamp) => {
    const date = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
  };

  const getRoleIcon = (role, isAdminMessage) => {
    if (isAdminMessage || role === 'admin') {
      return <AdminIcon fontSize="small" color="primary.contrastText" />;
    }
    switch(role) {
      case 'distributor':
        return <BusinessIcon fontSize="small" color="primary.contrastText" />;
      default:
        return <PersonIcon fontSize="small" color="primary.contrastText" />;
    }
  };

  const getRoleColor = (role, isAdminMessage) => {
    if (isAdminMessage || role === 'admin') {
      return 'error';
    }
    switch(role) {
      case 'distributor':
        return 'secondary.contrastText';
      default:
        return 'primary.main';
    }
  };

  const MessageBubble = ({ message, isCurrentUser }) => {
    const isAdminMessage = message.isAdminMessage || message.senderId.role === 'admin';
    const roleColor = getRoleColor(message.senderId.role, isAdminMessage);
    
    const bubbleStyle = {
      maxWidth: '70%',
      minWidth: '100px',
      bgcolor: isCurrentUser 
        ? (isAdminMessage ? 'error.main' : 'primary.main') // Use primary.main for yellow color for current user
        : 'grey.100', // Use grey.100 for normal messages
      color: isCurrentUser ? 'primary.contrastText' : 'primary.contrastText', // Use primary.contrastText for black text
      p: 1.5,
      borderRadius: 3,
      position: 'relative',
      boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
      '&::after': {
        content: '""',
        position: 'absolute',
        top: 10,
        [isCurrentUser ? 'right' : 'left']: -8,
        borderStyle: 'solid',
        borderWidth: '8px 8px 8px 0',
        borderColor: `transparent ${isCurrentUser 
          ? (isAdminMessage ? theme.palette.error.main : theme.palette.primary.main) // Yellow for current user
          : theme.palette.grey[100]} transparent transparent`, // Grey for others
        transform: isCurrentUser ? 'scaleX(-1)' : 'none'
      }
    };

    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: isCurrentUser ? 'row-reverse' : 'row',
          gap: 1,
          alignItems: 'flex-start',
          mb: 2
        }}
      >
        <Tooltip title={`${message.senderId.name} (${isAdminMessage ? 'Admin' : message.senderId.role})`}>
          <Badge
            overlap="circular"
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            badgeContent={getRoleIcon(message.senderId.role, isAdminMessage)}
            color={roleColor}
          >
            <Avatar
              sx={{
                width: 40,
                height: 40,
                bgcolor: isAdminMessage 
                  ? 'error.main' 
                  : (message.senderId.role === 'distributor' ? 'secondary.main' : 'primary.main'), // Sky blue for distributor, yellow for member
                fontSize: '1rem',
                color: 'primary.contrastText' // Avatar text should use primary.contrastText (black)
              }}
            >
              {message.senderId.name?.[0] || '?'}
            </Avatar>
          </Badge>
        </Tooltip>

        <Box sx={{ maxWidth: '75%' }}>
          <Box sx={bubbleStyle}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
              <Typography variant="caption" sx={{ opacity: 0.8 }}>
                {message.senderId.name}
              </Typography>
              <Chip
                label={isAdminMessage ? 'Admin' : message.senderId.role}
                size="small"
                color={roleColor}
                sx={{ 
                  height: 20, 
                  '& .MuiChip-label': { 
                    px: 1, 
                    fontSize: '0.7rem',
                    fontWeight: isAdminMessage ? 600 : 400
                  }
                }}
              />
              {isAdminMessage && (
                <Chip
                  label="Admin Action"
                  size="small"
                  color="error"
                  variant="outlined"
                  sx={{ 
                    height: 20, 
                    '& .MuiChip-label': { 
                      px: 1, 
                      fontSize: '0.7rem',
                      fontWeight: 600
                    }
                  }}
                />
              )}
            </Box>
            <Typography variant="body1" sx={{ wordBreak: 'break-word' }}>
              {message.message}
            </Typography>
          </Box>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: isCurrentUser ? 'flex-end' : 'flex-start',
              gap: 0.5,
              mt: 0.5
            }}
          >
            <AccessTimeIcon sx={{ fontSize: 12, opacity: 0.7 }} />
            <Typography variant="caption" sx={{ opacity: 0.7 }}>
              {formatMessageTime(message.createdAt)}
            </Typography>
            {isCurrentUser && (
              <DoneAllIcon 
                sx={{ 
                  fontSize: 12, 
                  opacity: 1, 
                  ml: 0.5, 
                  color: message.isRead ? (isAdminMessage ? 'error.main' : 'primary.main') : 'inherit'
                }} 
              />
            )}
          </Box>
        </Box>
      </Box>
    );
  };

  if (!commitment) {
    return <CircularProgress />;
  }

  if (loading && !error) {
    return <ChatSkeleton />;
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        {error}
      </Alert>
    );
  }

  if (!canAccessChat()) {
    return (
      <Alert severity="warning">
        You do not have permission to access this chat
      </Alert>
    );
  }

  const getChatPartnerName = () => {
    if (userRole === 'member') {
      return commitment.dealId.distributor?.name || 'Distributor';
    } else {
      return commitment.userId?.name || 'Member';
    }
  };

  return (
    <Paper 
      elevation={2} 
      sx={{ 
        height: isMobile ? 'calc(100vh - 200px)' : '600px',
        display: 'flex', 
        flexDirection: 'column',
        borderRadius: 4,
        overflow: 'hidden',
        bgcolor: 'background.default',
        border: '1px solid',
        borderColor: theme.palette.mode === 'light' ? 'rgba(0, 0, 0, 0.08)' : 'divider',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)'
      }}
    >
      <Box sx={{ 
        p: 2.5, 
        bgcolor: isAdmin 
          ? 'rgba(239, 83, 80, 0.08)' 
          : 'primary.main', // Yellow color for header
        color: isAdmin ? 'error.main' : 'primary.contrastText', // Black text
        display: 'flex',
        alignItems: 'center',
        gap: 2,
        borderBottom: '1px solid',
        borderColor: theme.palette.mode === 'light' ? 'rgba(0, 0, 0, 0.08)' : 'divider'
      }}>
        <Badge
          overlap="circular"
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          badgeContent={getRoleIcon(userRole, isAdmin)}
          color={getRoleColor(userRole, isAdmin)}
        >
          <Avatar
            sx={{
              width: 48,
              height: 48,
              bgcolor: isAdmin 
                ? 'rgba(239, 83, 80, 0.12)' 
                : 'secondary.main', // Yellow for member
              color: 'primary.contrastText', // Avatar text color to black
              fontWeight: 600
            }}
          >
            {isAdmin ? 'A' : userRole[0].toUpperCase()}
          </Avatar>
        </Badge>
        <Box>
          <Typography variant="h6" sx={{ 
            fontSize: '1.1rem', 
            fontWeight: 600,
            letterSpacing: '0.01em'
          }}>
            {isAdmin ? 'Admin Chat Room' : 'Chat Room'}
          </Typography>
          <Typography variant="caption" sx={{ 
            opacity: 0.8, 
            display: 'block',
            fontSize: '0.85rem'
          }}>
            Deal: {commitment.dealId.name}
          </Typography>
        </Box>
      </Box>
      
      <Box
        ref={chatContainerRef}
        sx={{ 
          flex: 1, 
          overflowY: 'auto', 
          p: 2.5,
          bgcolor: theme.palette.mode === 'light' 
            ? 'rgba(0, 0, 0, 0.02)' 
            : 'background.paper',
          backgroundImage: theme.palette.mode === 'light'
            ? 'linear-gradient(rgba(255,255,255,.9), rgba(255,255,255,.9))'
            : 'none',
          backgroundAttachment: 'fixed',
          '&::-webkit-scrollbar': {
            width: '6px',
          },
          '&::-webkit-scrollbar-track': {
            bgcolor: 'transparent',
          },
          '&::-webkit-scrollbar-thumb': {
            bgcolor: 'rgba(0, 0, 0, 0.1)',
            borderRadius: '10px',
            '&:hover': {
              bgcolor: 'rgba(0, 0, 0, 0.15)'
            }
          },
        }}
      >
        {messages.map((message) => (
          <MessageBubble
            key={message._id}
            message={message}
            isCurrentUser={message.senderId._id === currentUserId}
          />
        ))}
        <div ref={messagesEndRef} />
      </Box>
      
      <Box 
        component="form" 
        onSubmit={handleSendMessage}
        sx={{ 
          p: 2.5, 
          bgcolor: theme.palette.mode === 'light' 
            ? 'rgba(0, 0, 0, 0.02)' 
            : 'background.paper',
          borderTop: '1px solid',
          borderColor: theme.palette.mode === 'light' 
            ? 'rgba(0, 0, 0, 0.08)' 
            : 'divider'
        }}
      >
        <Box sx={{ display: 'flex', gap: 1.5 }}>
          <TextField
            fullWidth
            size="medium"
            placeholder={`Type your message${isAdmin ? ' as Admin' : ''}...`}
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            multiline
            maxRows={3}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 3,
                bgcolor: 'background.paper',
                '&:hover': {
                  bgcolor: theme.palette.mode === 'light' 
                    ? 'rgba(0, 0, 0, 0.04)' 
                    : 'action.hover'
                },
                '& fieldset': {
                  borderColor: isAdmin 
                    ? 'rgba(239, 83, 80, 0.2)' 
                    : 'primary.main' // Yellow border for message box
                },
                '&:hover fieldset': {
                  borderColor: isAdmin 
                    ? 'error.main' 
                    : 'primary.main' // Yellow border on hover
                }
              }
            }}
          />
          <Tooltip title={`Send Message${isAdmin ? ' as Admin' : ''}`}>
            <IconButton 
              type="submit" 
              disabled={!newMessage.trim()}
              sx={{
                bgcolor: isAdmin 
                  ? 'rgba(239, 83, 80, 0.08)' 
                  : 'primary.contrastText', // Yellow for send button
                color: isAdmin ? 'error.main' : 'primary.main', // Black color for icon
                width: 48,
                height: 48,
                borderRadius: 3,
                transition: 'all 0.2s ease-in-out',
                '&:hover': {
                  bgcolor: isAdmin 
                    ? 'rgba(239, 83, 80, 0.15)' 
                    : 'primary.dark', // Darker yellow on hover
                  transform: 'scale(1.05)'
                },
                '&:disabled': {
                  bgcolor: 'action.disabledBackground',
                  color: 'action.disabled'
                }
              }}
            >
              {sending ? <CircularProgress size={24} /> : <SendIcon />}

            </IconButton>
          </Tooltip>
        </Box>
      </Box>
    </Paper>
  );
};

export default CommitmentChat; 