import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import CreateDeal from './CreateDeal';
import Toast from '../../../Components/Toast/Toast';
import api from '../../../services/api';
import { useAuth } from '../../../middleware/auth';
import { Button, Container, Box, Paper, Grid, Skeleton } from '@mui/material';

const EditDealSkeleton = () => (
  <Container>
    <Box sx={{ mb: 4 }}>
      <Skeleton variant="text" sx={{ fontSize: '2rem', mb: 3 }} />
      <Paper sx={{ p: 3 }}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            {[...Array(4)].map((_, index) => (
              <Box key={index} sx={{ mb: 3 }}>
                <Skeleton variant="text" sx={{ mb: 1 }} />
                <Skeleton variant="rectangular" height={56} />
              </Box>
            ))}
          </Grid>
          <Grid item xs={12} md={6}>
            <Box sx={{ mb: 3 }}>
              <Skeleton variant="text" sx={{ mb: 1 }} />
              <Skeleton variant="rectangular" height={200} />
            </Box>
            {[...Array(2)].map((_, index) => (
              <Box key={index} sx={{ mb: 3 }}>
                <Skeleton variant="text" sx={{ mb: 1 }} />
                <Skeleton variant="rectangular" height={56} />
              </Box>
            ))}
          </Grid>
          <Grid item xs={12}>
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
              <Skeleton variant="rectangular" width={100} height={36} />
              <Skeleton variant="rectangular" width={100} height={36} />
            </Box>
          </Grid>
        </Grid>
      </Paper>
    </Box>
  </Container>
);

const EditDeal = () => {
  const location = useLocation();
  const { deal } = location.state;
  const [toast, setToast] = useState({
    open: false,
    message: '',
    severity: 'success'
  });
  const navigate = useNavigate();
  const { currentUserId, isImpersonating } = useAuth();
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleUpdateDeal = async (updatedDeal) => {
    if (isSubmitting) return;
    try {
      setIsSubmitting(true);
      setLoading(true);
      const response = await api.put(`/deals/update/${updatedDeal._id}`, updatedDeal);
      setToast({
        open: true,
        message: 'Deal updated successfully',
        severity: 'success'
      });
      navigate(`/dashboard/distributor/deal/manage`);
    } catch (error) {
      setToast({
        open: true,
        message: 'Error updating deal',
        severity: 'error'
      });
      console.error('Error updating deal:', error);
    } finally {
      setIsSubmitting(false);
      setLoading(false);
    }
  };

  const handleCloseToast = () => {
    setToast({ ...toast, open: false });
  };

  if (loading) {
    return <EditDealSkeleton />;
  }

  return (
    <div>
      <CreateDeal
        initialData={deal}
        onClose={() => navigate('/manage-deals')}
        onSubmit={handleUpdateDeal}
        isSubmitting={isSubmitting}
      />
      <Toast
        open={toast.open}
        message={toast.message}
        severity={toast.severity}
        handleClose={handleCloseToast}
      />
    </div>
  );
};

export default EditDeal;
