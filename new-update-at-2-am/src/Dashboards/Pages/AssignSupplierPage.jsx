import React, { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Box, Container } from '@mui/material';
import AssignSuppliers from '../Components/AssignSuppliers';

const AssignSupplierPage = () => {
  const navigate = useNavigate();
  const { memberId } = useParams();
  // Ensure memberId is available
  useEffect(() => {
    if (!memberId) {
      navigate(-1);
    }
  }, [memberId, navigate]);

  return (
    <Container maxWidth="xl" sx={{ py: 5 }}>
      <AssignSuppliers />
    </Container>
  );
};

export default AssignSupplierPage; 