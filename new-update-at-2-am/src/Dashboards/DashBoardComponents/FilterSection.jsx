import React from 'react';
import { Box, Grid } from '@mui/material';

export const FilterSection = ({ children }) => (
  <Box mb={3}>
    <Grid container spacing={2}>
      {children}
    </Grid>
  </Box>
);

export const FilterItem = ({ children }) => (
  <Grid item xs={12} sm={6} md={3}>
    {children}
  </Grid>
); 