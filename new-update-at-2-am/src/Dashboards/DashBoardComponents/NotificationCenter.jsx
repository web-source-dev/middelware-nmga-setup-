import { Skeleton } from '@mui/material';

const NotificationSkeleton = () => (
  <Paper sx={{ width: '100%', maxWidth: 360 }}>
    <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
      <Skeleton variant="text" sx={{ fontSize: '1.25rem' }} />
    </Box>
    <List sx={{ maxHeight: 400, overflow: 'auto' }}>
      {[...Array(5)].map((_, index) => (
        <ListItem key={index} divider>
          <ListItemAvatar>
            <Skeleton variant="circular" width={40} height={40} />
          </ListItemAvatar>
          <ListItemText
            primary={<Skeleton variant="text" width="80%" />}
            secondary={
              <Box>
                <Skeleton variant="text" width="60%" />
                <Skeleton variant="text" width="40%" />
              </Box>
            }
          />
        </ListItem>
      ))}
    </List>
    <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider', textAlign: 'center' }}>
      <Skeleton variant="text" width={120} sx={{ mx: 'auto' }} />
    </Box>
  </Paper>
);

const NotificationCenter = () => {
  // ... existing state ...

  if (loading) {
    return <NotificationSkeleton />;
  }

  // ... rest of component
}; 