import React, { useState } from 'react';
import { TextField, FormControl, InputLabel, Select, MenuItem, Button } from '@material-ui/core';

const DealForm = ({ onSubmit, initialValues = {} }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    size: '',
    originalCost: '',
    discountPrice: '',
    minQtyForDiscount: '',
    category: '',
    status: 'Active',
    dealEndsAt: '',
    images: [],
    ...initialValues
  });

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleImageChange = (event) => {
    const files = event.target.files;
    const imageData = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const reader = new FileReader();
      reader.onloadend = () => {
        imageData.push(reader.result);
        if (imageData.length === files.length) {
          setFormData({ ...formData, images: imageData });
        }
      };
      reader.readAsDataURL(file);
    }
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
      <input
        type="file"
        accept="image/*"
        multiple
        onChange={handleImageChange}
        style={{ margin: '20px 0' }}
      />
      <Button type="submit" variant="contained" color="primary" fullWidth>
        Submit
      </Button>
    </form>
  );
};

export default DealForm; 