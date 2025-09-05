import React, { useState, useEffect } from 'react';
import { Card, CardContent, Typography, Box, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Chip } from '@mui/material';
import { Person as PersonIcon, ShoppingCart as ShoppingCartIcon, AttachMoney as MoneyIcon } from '@mui/icons-material';
import api from '../services/api';
import { useAuth } from '../middleware/auth';
import { useNavigate } from 'react-router-dom';
import moment from 'moment';

const AllMembersForDistributor = () => {
    const [members, setMembers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();
    
    // Get user info from middleware
    const { currentUserId, isImpersonating, userRole } = useAuth();

    useEffect(() => {
        if (currentUserId) {
            fetchMembers();
        }
    }, [currentUserId]);

    const fetchMembers = async () => {
        try {
            setLoading(true);
            setError(null);
            
            if (!currentUserId) {
                throw new Error('User ID not found. Please log in again.');
            }
            
            const response = await api.get('/api/distributor/members');
            
            if (response.data.success) {
                setMembers(response.data.data);
            } else {
                throw new Error(response.data.message || 'Failed to fetch members');
            }
        } catch (error) {
            console.error('Error fetching members:', error);
            let errorMessage = 'Failed to fetch members. Please try again later.';
            
            if (error.response?.status === 401 || error.response?.status === 403) {
                errorMessage = 'You are not authorized to view these members.';
            } else if (error.message === 'Network Error') {
                errorMessage = 'Network error. Please check your internet connection.';
            }
            
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const totalCommitments = members.reduce((sum, member) => sum + member.totalCommitments, 0);
    const totalRevenue = members.reduce((sum, member) => sum + member.totalSpent, 0);
    const totalQuantity = members.reduce((sum, member) => sum + member.quantity, 0);

    const rows = members.map(member => ({
        ...member,
        id: member.member._id
    }));

    if (loading) {
        return (
            <Box sx={{ p: 3, display: 'flex', justifyContent: 'center' }}>
                <Typography>Loading members...</Typography>
            </Box>
        );
    }

    return (
        <Box sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                <Typography variant="h4" gutterBottom>
                    Member Commitments Overview
                </Typography>
                {isImpersonating && (
                    <Chip
                        label="Admin Mode"
                        color="warning"
                        variant="outlined"
                        sx={{ fontWeight: 'bold' }}
                    />
                )}
            </Box>
            
            {error && (
                <Box sx={{ mb: 3, p: 2, bgcolor: 'error.light', color: 'error.contrastText', borderRadius: 1 }}>
                    <Typography>{error}</Typography>
                </Box>
            )}
            
            <Stack direction="row" spacing={2} sx={{ mb: 3 }}>
                <Card sx={{ flex: 1 }}>
                    <CardContent>
                        <Stack direction="row" spacing={1} alignItems="center">
                            <PersonIcon color="primary.contrastText" />
                            <Box>
                                <Typography variant="h6">{members.length}</Typography>
                                <Typography color="textSecondary">Total Members</Typography>
                            </Box>
                        </Stack>
                    </CardContent>
                </Card>
                <Card sx={{ flex: 1 }}>
                    <CardContent>
                        <Stack direction="row" spacing={1} alignItems="center">
                            <ShoppingCartIcon color="primary.contrastText" />
                            <Box>
                                <Typography variant="h6">{totalQuantity}</Typography>
                                <Typography color="textSecondary">Total Quantity</Typography>
                            </Box>
                        </Stack>
                    </CardContent>
                </Card>
                <Card sx={{ flex: 1 }}>
                    <CardContent>
                        <Stack direction="row" spacing={1} alignItems="center">
                            <MoneyIcon color="primary.contrastText" />
                            <Box>
                                <Typography variant="h6">${totalRevenue.toFixed(2)}</Typography>
                                <Typography color="textSecondary">Total Revenue</Typography>
                            </Box>
                        </Stack>
                    </CardContent>
                </Card>
            </Stack>

            <Paper elevation={3} sx={{ width: '100%' }}>
                <TableContainer>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>Member Name</TableCell>
                                <TableCell>Email</TableCell>
                                <TableCell>Total Commitments</TableCell>
                                <TableCell>Total Spent</TableCell>
                                <TableCell>Last Commitment</TableCell>
                                <TableCell>Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {rows.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} align="center">
                                        <Typography variant="body1" sx={{ py: 3 }}>
                                            No members found
                                        </Typography>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                rows.map((row) => (
                                    <TableRow key={row.id}>
                                        <TableCell>{row.member.name}</TableCell>
                                        <TableCell>{row.member.email}</TableCell>
                                        <TableCell>{row.totalCommitments}</TableCell>
                                        <TableCell>${row.totalSpent.toFixed(2)}</TableCell>
                                        <TableCell>{moment(row.lastCommitment).format('MMMM Do YYYY')}</TableCell>
                                        <TableCell>
                                            <Typography
                                                variant="body2"
                                                sx={{
                                                    color: 'primary.contrastText',
                                                    cursor: 'pointer',
                                                    '&:hover': { textDecoration: 'underline' }
                                                }}
                                                onClick={() => navigate(`/dashboard/distributor/view/co-op-membors/member/${row.member._id}`)}
                                            >
                                                View Details
                                            </Typography>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Paper>
        </Box>
    );
};

export default AllMembersForDistributor;