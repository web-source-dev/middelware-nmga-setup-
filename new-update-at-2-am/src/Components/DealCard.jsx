import React from 'react';
import { Card, CardContent, Typography } from '@mui/material';

const DealCard = ({ deal }) => {
  return (
    <Card sx={{ maxWidth: 345, m: 2 }}>
      <CardContent>
        <Typography variant="body2" color="text.secondary">
          Original Price: ${deal.originalCost}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Discount Price: ${deal.discountPrice}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Min Quantity for Discount: {deal.minQtyForDiscount}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Total Sold: {deal.totalSold}
        </Typography>
      </CardContent>
    </Card>
  );
};

export default DealCard; 