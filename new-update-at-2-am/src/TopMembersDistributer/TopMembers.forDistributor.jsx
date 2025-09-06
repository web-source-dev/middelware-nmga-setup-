import React, { useState, useEffect } from 'react';
import { Paper, Typography, TextField, Box, Stack, Table, Button, TableBody, TableCell, TableContainer, TableHead, TableRow, Chip } from '@mui/material';
import api from '../services/api';
import { useAuth } from '../middleware/auth';
import { useParams, useNavigate } from 'react-router-dom';

const TopMembersForDistributor = () => {
    const [members, setMembers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [limit, setLimit] = useState(5);
    
    // Get user data from middleware
    const { currentUserId, isImpersonating } = useAuth();
    const distributorId = currentUserId;
    const navigate = useNavigate();

    useEffect(() => {
        if (distributorId) {
            fetchTopMembers();
        }
    }, [distributorId, limit]);

    const fetchTopMembers = async () => {
        try {
            const response = await api.get(`/api/distributor/top-members?limit=${limit}`);
            if (response.data.success) {
                setMembers(response.data.data || []);
            } else {
                console.warn('API returned unsuccessful response:', response.data);
                setMembers([]);
            }
            setLoading(false);
        } catch (error) {
            console.error('Error fetching top members:', error);
            setMembers([]);
            setLoading(false);
        }
    };

    const rows = members
        .filter(member => member && member.member && member.member._id) // Filter out invalid members
        .map((member, index) => ({
            ...member,
            id: member.member._id,
            rank: index,
        }));

    return (
        <Box sx={{ p: 3 }}>
            <Paper elevation={3} sx={{ p: 3 }}>
                <Stack direction="row" spacing={2} alignItems="center" justifyContent='space-between'>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Typography variant="h5" gutterBottom>
                            Top Members
                        </Typography>
                        {isImpersonating && (
                            <Chip 
                                label="Admin Mode" 
                                color="warning" 
                                variant="outlined"
                                size="small"
                                sx={{ fontWeight: 'bold' }}
                            />
                        )}
                    </Box>
                    <Button sx={{
                        color: 'primary.contrastText',
                    }}
                     onClick={()=> navigate (`all/co-op-membors`)}>
                        View All
                    </Button>
                </Stack>
                <TableContainer>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>No.</TableCell>
                                <TableCell>Member Name</TableCell>
                                <TableCell>Email</TableCell>
                                <TableCell>Total Commitments</TableCell>
                                <TableCell>Total Spent</TableCell>
                                <TableCell>Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={6} align="center">Loading...</TableCell>
                                </TableRow>
                            ) : rows.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} align="center">No members found</TableCell>
                                </TableRow>
                            ) : rows.map((row) => (
                                <TableRow key={row.id}>
                                    <TableCell>
                                        <Stack direction="row" spacing={1} alignItems="center">
                                            {row.rank + 1}
                                        </Stack>
                                    </TableCell>
                                    <TableCell>{row.member.name}</TableCell>
                                    <TableCell>{row.member.email}</TableCell>
                                    <TableCell>{row.totalCommitments}</TableCell>
                                    <TableCell>${row.totalSpent.toFixed(2)}</TableCell>
                                    <TableCell>
                                        <Typography
                                            variant="body2"
                                            sx={{
                                                color: 'primary.contrastText',
                                                cursor: 'pointer',
                                                '&:hover': { textDecoration: 'underline' },
                                            }}
                                            onClick={() => navigate(`view/co-op-membors/member/${row.member._id}`)}
                                        >
                                            View Details
                                        </Typography>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Paper>
        </Box>
    );
};

export default TopMembersForDistributor;