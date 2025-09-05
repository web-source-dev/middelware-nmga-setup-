const DealStats = ({ deal }) => {
  const calculateSavings = () => {
    const originalTotal = deal.totalSold * deal.originalCost;
    const discountTotal = deal.totalRevenue;
    return originalTotal - discountTotal;
  };

  return (
    <Grid container spacing={2}>
      <Grid item xs={12} sm={6} md={3}>
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6">Total Sold</Typography>
          <Typography variant="h4">{deal.totalSold}</Typography>
        </Paper>
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6">Total Revenue</Typography>
          <Typography variant="h4">${deal.totalRevenue}</Typography>
        </Paper>
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6">Total Savings</Typography>
          <Typography variant="h4">${calculateSavings()}</Typography>
        </Paper>
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6">Views</Typography>
          <Typography variant="h4">{deal.views}</Typography>
        </Paper>
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6">Impressions</Typography>
          <Typography variant="h4">{deal.impressions}</Typography>
        </Paper>
      </Grid>
    </Grid>
  );
}; 