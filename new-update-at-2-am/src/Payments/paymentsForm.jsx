import React, { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import {
    Elements,
    PaymentElement,
    useStripe,
    useElements,
} from '@stripe/react-stripe-js';
import axios from 'axios';
import {
    Box,
    TextField,
    Typography,
    Button,
    CircularProgress,
    Alert,
    Paper,
    Grid,
    Stepper,
    Step,
    StepLabel,
} from '@mui/material';
import LockIcon from '@mui/icons-material/Lock';

// Initialize Stripe
if (!process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY) {
    console.error('Stripe publishable key is not configured');
} else {
    console.log('Stripe publishable key is available');
}

const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY)
    .then(stripe => {
        console.log('Stripe loaded successfully');
        return stripe;
    })
    .catch(err => {
        console.error('Error loading Stripe:', err);
        return null;
    });

const BillingForm = ({ formData, setFormData }) => (
    <Grid container spacing={2}>
        <Grid item xs={12}>
            <Typography variant="h6" gutterBottom>
                Billing Information
            </Typography>
        </Grid>
        <Grid item xs={12} sm={6}>
            <TextField
                fullWidth
                label="First Name"
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                required
            />
        </Grid>
        <Grid item xs={12} sm={6}>
            <TextField
                fullWidth
                label="Last Name"
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                required
            />
        </Grid>
        <Grid item xs={12}>
            <TextField
                fullWidth
                label="Email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
            />
        </Grid>
        <Grid item xs={12}>
            <TextField
                fullWidth
                label="Phone Number"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                required
            />
        </Grid>
        <Grid item xs={12}>
            <TextField
                fullWidth
                label="Address Line 1"
                value={formData.address1}
                onChange={(e) => setFormData({ ...formData, address1: e.target.value })}
                required
            />
        </Grid>
        <Grid item xs={12}>
            <TextField
                fullWidth
                label="Address Line 2"
                value={formData.address2}
                onChange={(e) => setFormData({ ...formData, address2: e.target.value })}
            />
        </Grid>
        <Grid item xs={12} sm={6}>
            <TextField
                fullWidth
                label="City"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                required
            />
        </Grid>
        <Grid item xs={12} sm={6}>
            <TextField
                fullWidth
                label="State/Province"
                value={formData.state}
                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                required
            />
        </Grid>
        <Grid item xs={12} sm={6}>
            <TextField
                fullWidth
                label="Postal Code"
                value={formData.postalCode}
                onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                required
            />
        </Grid>
        <Grid item xs={12} sm={6}>
            <TextField
                fullWidth
                label="Country"
                value={formData.country}
                onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                required
            />
        </Grid>
    </Grid>
);

const CheckoutForm = ({ amount, onSuccess, userDetails, formData }) => {
    const stripe = useStripe();
    const elements = useElements();
    const [error, setError] = useState(null);
    const [processing, setProcessing] = useState(false);
    const [message, setMessage] = useState(null);

    useEffect(() => {
        if (!stripe) {
            setError('Stripe failed to initialize. Please refresh the page.');
        }
    }, [stripe]);

    const handleStripeSubmit = async (event) => {
        event.preventDefault();

        if (!stripe || !elements) {
            setError('Stripe is not properly initialized');
            return;
        }

        setProcessing(true);
        setError(null);
        setMessage(null);

        try {
            const { error: submitError } = await elements.submit();
            if (submitError) {
                throw submitError;
            }

            // Create payment intent with all necessary details
            const response = await axios.post(
                `${process.env.REACT_APP_BACKEND_URL}/payments/create-stripe-payment`,
                {
                    amount,
                    currency: 'usd',
                    commitmentId: userDetails.commitmentId,
                    userDetails: {
                        name: `${formData.firstName} ${formData.lastName}`,
                        email: formData.email,
                        phone: formData.phone,
                        address: {
                            line1: formData.address1,
                            line2: formData.address2,
                            city: formData.city,
                            state: formData.state,
                            postal_code: formData.postalCode,
                            country: formData.country
                        }
                    },
                    dealName: userDetails.dealName
                }
            );

            const { clientSecret } = response.data;

            const { error: confirmError } = await stripe.confirmPayment({
                elements,
                clientSecret,
                confirmParams: {
                    return_url: `${window.location.origin}/payment-success`,
                    payment_method_data: {
                        billing_details: {
                            name: `${formData.firstName} ${formData.lastName}`,
                            email: formData.email,
                            phone: formData.phone,
                            address: {
                                line1: formData.address1,
                                line2: formData.address2,
                                city: formData.city,
                                state: formData.state,
                                postal_code: formData.postalCode,
                                country: formData.country
                            }
                        }
                    }
                }
            });

            if (confirmError) {
                throw confirmError;
            }

            setMessage('Payment successful!');
            onSuccess({
                method: 'stripe',
                details: response.data
            });

        } catch (err) {
            console.error('Payment error:', err);
            setError(err.message || 'An error occurred while processing your payment.');
        } finally {
            setProcessing(false);
        }
    };

    return (
        <Box component="form" onSubmit={handleStripeSubmit} sx={{ mt: 2 }}>
            <PaymentElement 
                options={{
                    layout: 'tabs',
                    defaultValues: {
                        billingDetails: {
                            name: `${formData.firstName} ${formData.lastName}`,
                            email: formData.email,
                            phone: formData.phone,
                            address: {
                                line1: formData.address1,
                                line2: formData.address2,
                                city: formData.city,
                                state: formData.state,
                                postal_code: formData.postalCode,
                                country: formData.country,
                            }
                        }
                    }
                }}
            />
            
            {error && (
                <Alert severity="error" sx={{ mt: 2 }}>
                    {error}
                </Alert>
            )}
            
            {message && (
                <Alert severity="success" sx={{ mt: 2 }}>
                    {message}
                </Alert>
            )}
            
            <Button
                variant="contained"
                type="submit"
                disabled={!stripe || processing}
                fullWidth
                size="large"
                startIcon={<LockIcon />}
                sx={{ mt: 2 }}
            >
                {processing ? (
                    <CircularProgress size={24} color="inherit" />
                ) : (
                    `Pay $${amount}`
                )}
            </Button>
        </Box>
    );
};

const PaymentsForm = ({ amount, onSuccess, userDetails }) => {
    const [activeStep, setActiveStep] = useState(0);
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        address1: '',
        address2: '',
        city: '',
        state: '',
        postalCode: '',
        country: ''
    });
    const [clientSecret, setClientSecret] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        const initializePayment = async () => {
            try {
                setLoading(true);
                const response = await axios.post(
                    `${process.env.REACT_APP_BACKEND_URL}/payments/create-stripe-payment`,
                    {
                        amount,
                        currency: 'usd'
                    },
                    {
                        headers: {
                            'Content-Type': 'application/json'
                        }
                    }
                );

                if (response.data && response.data.clientSecret) {
                    setClientSecret(response.data.clientSecret);
                } else {
                    throw new Error('Invalid response from server');
                }
            } catch (err) {
                console.error('Error initializing payment:', err);
                setError(err.message || 'Failed to initialize payment');
            } finally {
                setLoading(false);
            }
        };

        if (activeStep === 1) {
            initializePayment();
        }
    }, [activeStep, amount]);

    const handleNext = () => {
        setActiveStep((prevStep) => prevStep + 1);
    };

    const handleBack = () => {
        setActiveStep((prevStep) => prevStep - 1);
    };

    const steps = ['Billing Information', 'Payment'];

    return (
        <Paper sx={{ p: 3 }}>
            <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
                {steps.map((label) => (
                    <Step key={label}>
                        <StepLabel>{label}</StepLabel>
                    </Step>
                ))}
            </Stepper>

            {loading && (
                <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
                    <CircularProgress />
                </Box>
            )}

            {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                    {error}
                </Alert>
            )}

            {!loading && (
                <>
                    {activeStep === 0 && (
                        <BillingForm 
                            formData={formData}
                            setFormData={setFormData}
                        />
                    )}

                    {activeStep === 1 && clientSecret && (
                        <Elements 
                            stripe={stripePromise} 
                            options={{
                                clientSecret,
                                appearance: {
                                    theme: 'stripe',
                                    variables: {
                                        colorPrimary: '#1976d2',
                                    },
                                },
                            }}
                        >
                            <CheckoutForm 
                                amount={amount}
                                onSuccess={onSuccess}
                                userDetails={userDetails}
                                formData={formData}
                            />
                        </Elements>
                    )}
                </>
            )}

            <Box sx={{ mt: 4, display: 'flex', justifyContent: 'space-between' }}>
                <Button
                    onClick={handleBack}
                    disabled={activeStep === 0}
                >
                    Back
                </Button>
                <Button
                    variant="contained"
                    onClick={handleNext}
                    disabled={activeStep === 1}
                >
                    {activeStep === steps.length - 1 ? 'Place Order' : 'Next'}
                </Button>
            </Box>
        </Paper>
    );
};

export default PaymentsForm;
