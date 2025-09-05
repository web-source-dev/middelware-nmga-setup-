import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Box,
    Container,
    Grid,
    Typography,
    Card,
    CardContent,
    Button,
    Divider,
    Alert,
    CircularProgress,
    Skeleton
} from '@mui/material';
import PaymentsForm from './paymentsForm';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import axios from 'axios';

const PaymentPage = () => {
    const { commitmentId } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [paymentData, setPaymentData] = useState(null);
    const userId = localStorage.getItem('user_id');

    useEffect(() => {
        const fetchPaymentData = async () => {
            try {
                const response = await axios.get(
                    `${process.env.REACT_APP_BACKEND_URL}/payments/checkout-data/${commitmentId}`,
                    {
                        params: { userId }
                    }
                );
                setPaymentData(response.data);
                setLoading(false);
            } catch (err) {
                setError(err.response?.data?.message || 'Error fetching payment data');
                setLoading(false);
            }
        };

        fetchPaymentData();
    }, [commitmentId, userId]);

    const handlePaymentSuccess = async (paymentDetails) => {
        try {
            await axios.post(`${process.env.REACT_APP_BACKEND_URL}/payments/create`, {
                commitmentId,
                userId: paymentData.user._id,
                dealId: paymentData.deal._id,
                amount: paymentData.commitment.modifiedTotalPrice || paymentData.commitment.totalPrice,
                paymentMethod: paymentDetails.method,
                transactionId: paymentDetails.transactionId,
                paymentDetails: paymentDetails,
                billingDetails: {
                    name: paymentData.user.name,
                    email: paymentData.user.email,
                    phone: paymentData.user.phone
                }
            });
            navigate('/thank-you');
        } catch (error) {
            setError(error.response?.data?.message || 'Payment processing failed');
        }
    };

    if (loading) {
        return (
            <Container maxWidth="lg" sx={{ py: 4 }}>
                <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                    <CircularProgress />
                </Box>
            </Container>
        );
    }

    if (error) {
        return (
            <Container maxWidth="lg" sx={{ py: 4 }}>
                <Alert severity="error">{error}</Alert>
                <Button 
                    startIcon={<ArrowBackIcon />}
                    onClick={() => navigate(-1)}
                    sx={{ mt: 2 }}
                >
                    Go Back
                </Button>
            </Container>
        );
    }

    return (
        <Container maxWidth="lg" sx={{ py: 4 }}>
            <Button
                startIcon={<ArrowBackIcon />}
                onClick={() => navigate(-1)}
                sx={{ mb: 3 }}
            >
                Back
            </Button>

            <Grid container spacing={4}>
                <Grid item xs={12} md={5}>
                    <Card sx={{ mb: 3, borderRadius: 2 }}>
                        <CardContent>
                            <Typography variant="h6" color="primary" gutterBottom>
                                Order Summary
                            </Typography>
                            <Divider sx={{ my: 2 }} />
                            
                            <Box sx={{ mb: 3 }}>
                                <Typography variant="subtitle1" gutterBottom>
                                    Deal Details
                                </Typography>
                                <Grid container spacing={1}>
                                    <Grid item xs={6}>
                                        <Typography color="text.secondary">Name:</Typography>
                                    </Grid>
                                    <Grid item xs={6}>
                                        <Typography>{paymentData.deal.name}</Typography>
                                    </Grid>
                                    <Grid item xs={6}>
                                        <Typography color="text.secondary">Quantity:</Typography>
                                    </Grid>
                                    <Grid item xs={6}>
                                        <Typography>
                                            {paymentData.commitment.modifiedQuantity || paymentData.commitment.quantity}
                                        </Typography>
                                    </Grid>
                                    <Grid item xs={6}>
                                        <Typography color="text.secondary">Price per unit:</Typography>
                                    </Grid>
                                    <Grid item xs={6}>
                                        <Typography>
                                            ${((paymentData.commitment.modifiedTotalPrice || paymentData.commitment.totalPrice) / 
                                              (paymentData.commitment.modifiedQuantity || paymentData.commitment.quantity)).toFixed(2)}
                                        </Typography>
                                    </Grid>
                                </Grid>
                            </Box>

                            <Divider sx={{ my: 2 }} />
                            
                            <Box sx={{ mb: 3 }}>
                                <Typography variant="subtitle1" gutterBottom>
                                    Distributor Information
                                </Typography>
                                <Grid container spacing={1}>
                                    <Grid item xs={6}>
                                        <Typography color="text.secondary">Business Name:</Typography>
                                    </Grid>
                                    <Grid item xs={6}>
                                        <Typography>
                                            {paymentData.distributor.businessName}
                                        </Typography>
                                    </Grid>
                                    <Grid item xs={6}>
                                        <Typography color="text.secondary">Contact:</Typography>
                                    </Grid>
                                    <Grid item xs={6}>
                                        <Typography>
                                            {paymentData.distributor.phone}
                                        </Typography>
                                    </Grid>
                                </Grid>
                            </Box>

                            <Divider sx={{ my: 2 }} />
                            
                            <Box>
                                <Typography variant="h6" color="primary" gutterBottom>
                                    Total Amount
                                </Typography>
                                <Typography variant="h4">
                                    ${paymentData.commitment.modifiedTotalPrice || paymentData.commitment.totalPrice}
                                </Typography>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid item xs={12} md={7}>
                    <Card sx={{ borderRadius: 2 }}>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>
                                Payment Method
                            </Typography>
                            <PaymentsForm 
                                amount={paymentData.commitment.modifiedTotalPrice || paymentData.commitment.totalPrice}
                                onSuccess={handlePaymentSuccess}
                                userDetails={paymentData.user}
                            />
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>
        </Container>
    );
};

export default PaymentPage; 