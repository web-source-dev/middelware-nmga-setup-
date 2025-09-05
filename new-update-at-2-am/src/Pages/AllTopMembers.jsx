import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Container, 
  Paper, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow,
  TablePagination,
  TextField,
  InputAdornment,
  CircularProgress,
  Button,
  Chip
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import SearchIcon from '@mui/icons-material/Search';
import PersonIcon from '@mui/icons-material/Person';
import api from '../services/api';
import { Helmet } from 'react-helmet';

const AllTopMembers = () => {
  const [members, setMembers] = useState([]);
  const [filteredMembers, setFilteredMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const navigate = useNavigate();

  // Fetch all members
  useEffect(() => {
    const fetchMembers = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          navigate('/login');
          return;
        }
        const response = await api.get(`/api/members/all-members/admin`);

        setMembers(response.data.members);
        setFilteredMembers(response.data.members);
      } catch (error) {
        console.error('Error fetching members:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMembers();
  }, [navigate]);

  // Handle search
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredMembers(members);
    } else {
      const filtered = members.filter(member => 
        member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (member.businessName && member.businessName.toLowerCase().includes(searchTerm.toLowerCase()))
      );
      setFilteredMembers(filtered);
    }
    setPage(0);
  }, [searchTerm, members]);

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleViewMember = (memberId) => {
    navigate(`/dashboard/admin/member-details/${memberId}`);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Helmet>
        <title>NMGA - All Members</title>
        <meta name="description" content="NMGA All Members - View all members in the NMGA network" />
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
      <Button onClick={() => navigate(-1)} sx={{ mb: 3 ,border:'1px solid',borderRadius:'10px', borderColor: 'primary.contrastText', color: 'primary.contrastText' }}>Go Back</Button>
      <Paper elevation={3} sx={{ p: 3, borderRadius: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            All Members
          </Typography>
          <TextField
            placeholder="Search members..."
            variant="outlined"
            size="small"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
            sx={{ width: '300px' }}
          />
        </Box>

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                <TableCell><Typography variant="subtitle1" fontWeight="bold">Name</Typography></TableCell>
                <TableCell><Typography variant="subtitle1" fontWeight="bold">Email</Typography></TableCell>
                <TableCell><Typography variant="subtitle1" fontWeight="bold">Business Name</Typography></TableCell>
                <TableCell><Typography variant="subtitle1" fontWeight="bold">Contact Person</Typography></TableCell>
                <TableCell><Typography variant="subtitle1" fontWeight="bold">Phone</Typography></TableCell>
                <TableCell><Typography variant="subtitle1" fontWeight="bold">Actions</Typography></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredMembers.length > 0 ? (
                filteredMembers
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((member) => (
                    <TableRow key={member._id} hover>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <PersonIcon sx={{ mr: 1, color: 'primary.contrastText' }} />
                          {member.name}
                        </Box>
                      </TableCell>
                      <TableCell>{member.email}</TableCell>
                      <TableCell>{member.businessName || 'N/A'}</TableCell>
                      <TableCell>{member.contactPerson || 'N/A'}</TableCell>
                      <TableCell>{member.phone || 'N/A'}</TableCell>
                      <TableCell>
                        <Button 
                          variant="contained" 
                          size="small" 
                          onClick={() => handleViewMember(member._id)}
                          sx={{ 
                            backgroundColor: '#4CAF50', 
                            '&:hover': { backgroundColor: '#388E3C' } 
                          }}
                        >
                          View Details
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    <Typography variant="body1" sx={{ py: 2 }}>
                      No members found
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
        
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={filteredMembers.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Paper>
    </Container>
  );
};

export default AllTopMembers;
