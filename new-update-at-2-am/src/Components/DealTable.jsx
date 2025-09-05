const DealTable = ({ deals, onEdit, onDelete }) => {
  return (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Name</TableCell>
            <TableCell>Description</TableCell>
            <TableCell>Size</TableCell>
            <TableCell>Original Cost</TableCell>
            <TableCell>Discount Price</TableCell>
            <TableCell>Min Qty for Discount</TableCell>
            <TableCell>Category</TableCell>
            <TableCell>Status</TableCell>
            <TableCell>Total Sold</TableCell>
            <TableCell>Total Revenue</TableCell>
            <TableCell>Views</TableCell>
            <TableCell>Impressions</TableCell>
            <TableCell>Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {deals.map((deal) => (
            <TableRow key={deal._id}>
              <TableCell>{deal.name}</TableCell>
              <TableCell>{deal.description}</TableCell>
              <TableCell>{deal.size}</TableCell>
              <TableCell>${deal.originalCost}</TableCell>
              <TableCell>${deal.discountPrice}</TableCell>
              <TableCell>{deal.minQtyForDiscount}</TableCell>
              <TableCell>{deal.category}</TableCell>
              <TableCell>{deal.status}</TableCell>
              <TableCell>{deal.totalSold}</TableCell>
              <TableCell>${deal.totalRevenue}</TableCell>
              <TableCell>{deal.views}</TableCell>
              <TableCell>{deal.impressions}</TableCell>
              <TableCell>
                <IconButton onClick={() => onEdit(deal)}>
                  <EditIcon />
                </IconButton>
                <IconButton onClick={() => onDelete(deal._id)}>
                  <DeleteIcon />
                </IconButton>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}; 