import React, { useState, useEffect } from 'react';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Button, Chip } from '@mui/material';
import { Card, CardContent, Typography, Box, Grid, Stack } from '@mui/material';
import { Person as PersonIcon, ShoppingCart as ShoppingCartIcon, AttachMoney as MoneyIcon, ArrowBack } from '@mui/icons-material';
import api from '../services/api';
import { useAuth } from '../middleware/auth';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import moment from 'moment';

const ViewSingleMember = () => {
    const [memberData, setMemberData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { memberId } = useParams();
    const navigate = useNavigate();
    
    // Get user info from middleware
    const { currentUserId, isImpersonating, userRole } = useAuth();
    
    useEffect(() => {
        if (currentUserId && memberId) {
            fetchMemberDetails();
        }
    }, [currentUserId, memberId]);

    const fetchMemberDetails = async () => {
        try {
            setLoading(true);
            setError(null);
            
            if (!currentUserId) {
                throw new Error('User ID not found. Please log in again.');
            }
            
            if (!memberId) {
                throw new Error('Member ID not found.');
            }
            
            const response = await api.get(`/api/distributor/member/${memberId}`);
            
            if (response.data.success) {
                setMemberData(response.data.data);
            } else {
                throw new Error(response.data.message || 'Failed to fetch member details');
            }
        } catch (error) {
            console.error('Error fetching member details:', error);
            let errorMessage = 'Failed to fetch member details. Please try again later.';
            
            if (error.response?.status === 401 || error.response?.status === 403) {
                errorMessage = 'You are not authorized to view this member.';
            } else if (error.response?.status === 404) {
                errorMessage = 'Member not found.';
            } else if (error.message === 'Network Error') {
                errorMessage = 'Network error. Please check your internet connection.';
            }
            
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <Box sx={{ p: 3, display: 'flex', justifyContent: 'center' }}>
                <Typography>Loading member details...</Typography>
            </Box>
        );
    }

    if (error) {
        return (
            <Box sx={{ p: 3 }}>
                <Button sx={{ color: 'primary.contrastText', mb: 2 }} onClick={() => navigate(-1)}>
                    <ArrowBack color="primary.contrastText" />
                </Button>
                <Box sx={{ p: 2, bgcolor: 'error.light', color: 'error.contrastText', borderRadius: 1 }}>
                    <Typography>{error}</Typography>
                </Box>
            </Box>
        );
    }

    if (!memberData) {
        return (
            <Box sx={{ p: 3 }}>
                <Button sx={{ color: 'primary.contrastText', mb: 2 }} onClick={() => navigate(-1)}>
                    <ArrowBack color="primary.contrastText" />
                </Button>
                <Typography>No member data available</Typography>
            </Box>
        );
    }

    const totalCommitments = memberData.commitments.length;
    const totalSpent = memberData.commitments.reduce((sum, commitment) => sum + commitment.totalPrice, 0);
    const totalQuantity = memberData.commitments.reduce((sum, commitment) => {
        // Sum quantities from all size commitments
        const commitmentQuantity = commitment.sizeCommitments.reduce(
            (sizeSum, sizeCommitment) => sizeSum + sizeCommitment.quantity, 0
        );
        return sum + commitmentQuantity;
    }, 0);

    const rows = memberData.commitments.map(commitment => ({
        ...commitment,
        id: commitment._id,
        // Calculate total quantity for each commitment
        quantity: commitment.sizeCommitments.reduce(
            (sum, sizeCommitment) => sum + sizeCommitment.quantity, 0
        )
    }));

    return (
        <>
            <Button sx={{ color: 'primary.contrastText', mb: 2 }} onClick={() => navigate(-1)}>
                <ArrowBack color="primary.contrastText" />
            </Button>
            <Box sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                    <Typography variant="h4" gutterBottom>Member Details</Typography>
                    {isImpersonating && (
                        <Chip
                            label="Admin Mode"
                            color="warning"
                            variant="outlined"
                            sx={{ fontWeight: 'bold' }}
                        />
                    )}
                </Box>

                <Card sx={{ mb: 3 }}>
                    <CardContent>
                        <Typography variant="h6" gutterBottom>Member Information</Typography>
                        <Grid container spacing={2}>
                            <Grid item xs={6} md={3}>
                                <Typography color="textSecondary">Name</Typography>
                                <Typography>{memberData.member.name}</Typography>
                            </Grid>
                            <Grid item xs={6} md={3}>
                                <Typography color="textSecondary">Email</Typography>
                                <Typography>{memberData.member.email}</Typography>
                            </Grid>
                            <Grid item xs={6} md={3}>
                                <Typography color="textSecondary">Phone</Typography>
                                <Typography>{memberData.member.phone || 'N/A'}</Typography>
                            </Grid>
                            <Grid item xs={6} md={3}>
                                <Typography color="textSecondary">Address</Typography>
                                <Typography>{memberData.member.address || 'N/A'}</Typography>
                            </Grid>
                        </Grid> 
                    </CardContent>
                </Card>

                <Stack direction="row" spacing={2} sx={{ mb: 3 }}>
                    <Card sx={{ flex: 1 }}>
                        <CardContent>
                            <Stack direction="row" spacing={1} alignItems="center">
                                <ShoppingCartIcon color="primary.contrastText" />
                                <Box>
                                    <Typography variant="h6">{totalCommitments}</Typography>
                                    <Typography color="textSecondary">Total Commitments</Typography>
                                </Box>
                            </Stack>
                        </CardContent>
                    </Card>
                    <Card sx={{ flex: 1 }}>
                        <CardContent>
                            <Stack direction="row" spacing={1} alignItems="center">
                                <PersonIcon color="primary.contrastText" />
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
                                    <Typography variant="h6">${totalSpent.toFixed(2)}</Typography>
                                    <Typography color="textSecondary">Total Spent</Typography>
                                </Box>
                            </Stack>
                        </CardContent>
                    </Card>
                </Stack>

                <Card>
                    <CardContent>
                        <Typography variant="h6" gutterBottom>Commitment History</Typography>
                        <TableContainer component={Paper}>
                            <Table>
                                <TableHead>
                                    <TableRow>
                                        <TableCell>Deal Name</TableCell>
                                        <TableCell>Quantity</TableCell>
                                        <TableCell>Total Price</TableCell>
                                        <TableCell>Date</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {rows.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={4} align="center">
                                                <Typography variant="body1" sx={{ py: 3 }}>
                                                    No commitments found
                                                </Typography>
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        rows.map((row) => (
                                            <TableRow key={row.id}>
                                                <TableCell>{row.dealId.name}</TableCell>
                                                <TableCell>{row.quantity}</TableCell>
                                                <TableCell>${row.totalPrice.toFixed(2)}</TableCell>
                                                <TableCell>{moment(row.createdAt).format('MMMM Do YYYY, h:mm a')}</TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </CardContent>
                </Card>
            </Box>
        </>
    );
};

export default ViewSingleMember;