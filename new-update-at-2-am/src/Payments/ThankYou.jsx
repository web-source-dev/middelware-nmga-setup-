import React from 'react';
import { Box, Typography, Button, Container } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

const ThankYou = () => {
    const navigate = useNavigate();

    return (
        <Container maxWidth="sm">
            <Box
                sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minHeight: '60vh',
                    textAlign: 'center',
                }}
            >
                <CheckCircleIcon 
                    color="success" 
                    sx={{ fontSize: 80, mb: 2 }} 
                />
                <Typography variant="h4" gutterBottom>
                    Thank You for Your Payment!
                </Typography>
                <Typography variant="body1" color="text.secondary" paragraph>
                    Your transaction has been completed successfully. 
                    You will receive a confirmation email shortly.
                </Typography>
                <Box sx={{ mt: 4 }}>
                    <Button
                        variant="contained"
                        color="primary"
                        onClick={() => navigate('/dashboard')}
                        sx={{ mr: 2 }}
                    >
                        Go to Dashboard
                    </Button>
                    <Button
                        variant="outlined"
                        onClick={() => navigate('/commitments')}
                    >
                        View Commitments
                    </Button>
                </Box>
            </Box>
        </Container>
    );
};

export default ThankYou; 