import React, { useEffect } from 'react';
import { Box, Container } from '@mui/material';
import AllCoopMembers from '../Components/AllCoopMembers';

const CoopMembersPage = () => {

  return (
    <Container maxWidth="xl" sx={{ py: 5 }}>
      <AllCoopMembers />
    </Container>
  );
};

export default CoopMembersPage; 