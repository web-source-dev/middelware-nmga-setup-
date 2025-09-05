import React from 'react';
import { Typography, Box, Alert, AlertTitle } from '@mui/material';
import { Info as InfoIcon } from '@mui/icons-material';

const PriceDisclaimer = ({ variant = 'alert', sx = {} }) => {
  const disclaimerText = "The savings amount shown is an estimate based on the cost of a single bottle. All purchase commitments apply to full cases, not individual bottles. The dollar amount referenced reflects an approximate per-bottle savings when purchasing by the case.";

  if (variant === 'alert') {
    return (
      <Alert 
        severity="info" 
        icon={<InfoIcon />}
        sx={{ 
          mb: 2, 
          '& .MuiAlert-message': {
            fontSize: '0.875rem'
          },
          ...sx
        }}
      >
        <AlertTitle sx={{ fontSize: '0.9rem', fontWeight: 600 }}>
          Price Information
        </AlertTitle>
        <Typography variant="body2" sx={{ fontSize: '0.8rem', lineHeight: 1.4 }}>
          {disclaimerText}
        </Typography>
      </Alert>
    );
  }

  if (variant === 'text') {
    return (
      <Typography 
        variant="caption" 
        color="text.secondary" 
        sx={{ 
          display: 'block', 
          fontSize: '0.9rem', 
          lineHeight: 1.3,
          fontStyle: 'italic',
          mt: 0.5,
          ...sx
        }}
      >
        <strong>Note:</strong> {disclaimerText}
      </Typography>
    );
  }

  if (variant === 'compact') {
    return (
      <Box sx={{ 
        p: 1, 
        bgcolor: 'info.light', 
        borderRadius: 1, 
        border: '1px solid',
        borderColor: 'info.main',
        ...sx
      }}>
        <Typography 
          variant="caption" 
          color="info.dark" 
          sx={{ 
            fontSize: '0.7rem', 
            lineHeight: 1.3,
            fontWeight: 500
          }}
        >
          {disclaimerText}
        </Typography>
      </Box>
    );
  }

  return null;
};

export default PriceDisclaimer; 