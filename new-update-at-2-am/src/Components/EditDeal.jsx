import React, { useState } from 'react';
import { TextField, FormControl, InputLabel, Select, MenuItem, Box, Button } from '@mui/material';

const EditDeal = ({ deal, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    name: deal.name,
    description: deal.description,
    size: deal.size,
    originalCost: deal.originalCost,
    discountPrice: deal.discountPrice,
    minQtyForDiscount: deal.minQtyForDiscount,
    category: deal.category,
    status: deal.status,
    dealEndsAt: deal.dealEndsAt,
    images: deal.images
  });

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit}>
      <TextField
        label="Name"
        name="name"
        value={formData.name}
        onChange={handleChange}
        fullWidth
        required
        margin="normal"
      />
      <TextField
        label="Description"
        name="description"
        value={formData.description}
        onChange={handleChange}
        fullWidth
        multiline
        rows={4}
        margin="normal"
      />
      <TextField
        label="Size"
        name="size"
        value={formData.size}
        onChange={handleChange}
        fullWidth
        required
        margin="normal"
      />
      <TextField
        label="Original Cost"
        name="originalCost"
        type="number"
        value={formData.originalCost}
        onChange={handleChange}
        fullWidth
        required
        margin="normal"
      />
      <TextField
        label="Discount Price"
        name="discountPrice"
        type="number"
        value={formData.discountPrice}
        onChange={handleChange}
        fullWidth
        required
        margin="normal"
      />
      <TextField
        label="Minimum Quantity for Discount"
        name="minQtyForDiscount"
        type="number"
        value={formData.minQtyForDiscount}
        onChange={handleChange}
        fullWidth
        required
        margin="normal"
      />
      <FormControl fullWidth margin="normal">
        <InputLabel>Category</InputLabel>
        <Select
          name="category"
          value={formData.category}
          onChange={handleChange}
          required
        >
          <MenuItem value="Wine">Wine</MenuItem>
          <MenuItem value="Beer">Beer</MenuItem>
          <MenuItem value="Spirits">Spirits</MenuItem>
        </Select>
      </FormControl>
      <FormControl fullWidth margin="normal">
        <InputLabel>Status</InputLabel>
        <Select
          name="status"
          value={formData.status}
          onChange={handleChange}
          required
        >
          <MenuItem value="Active">Active</MenuItem>
          <MenuItem value="Inactive">Inactive</MenuItem>
        </Select>
      </FormControl>
      <TextField
        label="Deal Ends At"
        name="dealEndsAt"
        type="datetime-local"
        value={formData.dealEndsAt}
        onChange={handleChange}
        fullWidth
        required
        margin="normal"
        InputLabelProps={{
          shrink: true,
        }}
      />
      <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
        <Button type="submit" variant="contained" color="primary">
          Save Changes
        </Button>
        <Button variant="outlined" onClick={onCancel}>
          Cancel
        </Button>
      </Box>
    </form>
  );
};

export default EditDeal; 