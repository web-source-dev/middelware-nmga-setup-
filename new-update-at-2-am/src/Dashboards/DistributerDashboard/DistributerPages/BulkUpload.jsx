import React, { useState } from 'react';
import api from '../../../services/api';
import { useAuth } from '../../../middleware/auth';
import {
    Box,
    Button,
    Paper,
    Typography,
    Alert,
    CircularProgress,
    Skeleton,
    Chip
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import DownloadIcon from '@mui/icons-material/Download';

const BulkUploadSkeleton = () => (
    <Box sx={{ width: '100%', p: 3 }}>
        <Skeleton variant="text" sx={{ fontSize: '2rem', mb: 3 }} />
        <Paper sx={{ p: 4 }}>
            <Box sx={{ textAlign: 'center' }}>
                <Skeleton variant="circular" width={80} height={80} sx={{ mx: 'auto', mb: 2 }} />
                <Skeleton variant="text" sx={{ fontSize: '1.5rem', mb: 1 }} />
                <Skeleton variant="text" width="60%" sx={{ mx: 'auto', mb: 3 }} />
                <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2 }}>
                    <Skeleton variant="rectangular" width={150} height={40} />
                    <Skeleton variant="rectangular" width={150} height={40} />
                </Box>
            </Box>
        </Paper>
    </Box>
);

const BulkUpload = () => {
    const { currentUserId, isImpersonating } = useAuth();
    const [file, setFile] = useState(null);
    const [loading, setLoading] = useState(false);
    const [isDownloading, setIsDownloading] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '', details: [] });

    const handleFileChange = (event) => {
        const file = event.target.files[0];
        if (file && file.type === 'text/csv') {
            setFile(file);
            setMessage({ type: 'info', text: 'File selected: ' + file.name });
        } else {
            setMessage({ type: 'error', text: 'Please select a valid CSV file' });
        }
    };

    const handleDownloadTemplate = async () => {
        if (isDownloading) return;
        try {
            setIsDownloading(true);
            const response = await api.get('/deals/bulk/template', {
                responseType: 'blob'
            });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', 'deals_template.csv');
            document.body.appendChild(link);
            link.click();
            link.remove();

            setMessage({ type: 'success', text: 'Template downloaded successfully' });
        } catch (error) {
            console.error('Error downloading template:', error);
            setMessage({ type: 'error', text: 'Error downloading template. Please try again later.' });
        } finally {
            setIsDownloading(false);
        }
    };

    const handleUpload = async () => {
        if (!file || loading) {
            setMessage({ type: 'error', text: 'Please select a file first' });
            return;
        }

        setLoading(true);
        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await api.post('/deals/bulk/upload', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });
            
            setMessage({ 
                type: 'success', 
                text: `Successfully uploaded ${response.data.count} deals` 
            });
        } catch (error) {
            const errorData = error.response?.data;
            console.error('Error uploading deals:', errorData);
            setMessage({ 
                type: 'error', 
                text: errorData?.message || 'Error uploading deals. Please check the file format and try again.',
                details: errorData?.errors || []
            });
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <BulkUploadSkeleton />;
    }

    return (
        <Box sx={{ p: 3 }}>
            <Paper sx={{ p: 4, borderRadius: 2, maxWidth: 1200, mx: 'auto' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
                    <Typography variant="h5" color="primary.contrastText" gutterBottom>
                        Bulk Upload Deals
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
                
                <Box sx={{ 
                    display: 'flex', 
                    flexDirection: 'column',
                    gap: 4,
                }}>
                    <Box sx={{ 
                        p: 4, 
                        border: '2px dashed #ccc',
                        borderRadius: 2,
                        textAlign: 'center',
                        bgcolor: 'rgba(0, 0, 0, 0.02)'
                    }}>
                        <Typography variant="h6" color="textSecondary" gutterBottom>
                            Step 1: Get Started
                        </Typography>
                        <Typography variant="body1" color="textSecondary" gutterBottom sx={{ mb: 2 }}>
                            Download our template CSV file to ensure correct formatting
                        </Typography>
                        <Button
                            variant="outlined"
                            startIcon={isDownloading ? <CircularProgress size={20} /> : <DownloadIcon sx={{ color: 'primary.contrastText' }} />}
                            onClick={handleDownloadTemplate}
                            disabled={isDownloading}
                            color="primary.contrastText"
                            sx={{ 
                                mt: 1,
                                borderRadius: 2,
                                px: 3,
                                py: 1,
                            }}
                        >
                            {isDownloading ? 'Downloading...' : 'Download Template'}
                        </Button>
                    </Box>

                    <Box sx={{ 
                        p: 4, 
                        border: '2px dashed #ccc',
                        borderRadius: 2,
                        textAlign: 'center',
                        bgcolor: 'rgba(0, 0, 0, 0.02)',
                        transition: 'all 0.3s ease',
                        '&:hover': {
                            borderColor: 'primary.main',
                            bgcolor: 'rgba(0, 0, 0, 0.03)'
                        }
                    }}>
                        <Typography variant="h6" color="textSecondary" gutterBottom>
                            Step 2: Upload Your File
                        </Typography>
                        <input
                            accept=".csv"
                            style={{ display: 'none' }}
                            id="raised-button-file"
                            type="file"
                            onChange={handleFileChange}
                        />
                        <label htmlFor="raised-button-file">
                            <Button
                                variant="contained"
                                component="span"
                                startIcon={loading ? <CircularProgress size={20} /> : <CloudUploadIcon sx={{ color: 'primary.contrastText' }} />}
                                disabled={loading}
                                sx={{ 
                                    mb: 1,
                                    borderRadius: 2,
                                    px: 3,
                                    py: 1,
                                    color: 'primary.contrastText'
                                }}
                            >
                                {loading ? 'Uploading...' : 'Select CSV File'}
                            </Button>
                        </label>
                        {file && (
                            <Box sx={{ 
                                mt: 2, 
                                p: 1, 
                                bgcolor: 'background.paper',
                                borderRadius: 1,
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 1
                            }}>
                                <Typography variant="body2" color="textSecondary">
                                    Selected: {file.name}
                                </Typography>
                            </Box>
                        )}
                    </Box>

                    {message.text && (
                        <Box sx={{ mt: 2 }}>
                            <Alert 
                                severity={message.type}
                                sx={{ 
                                    borderRadius: 2,
                                    '& .MuiAlert-message': {
                                        width: '100%'
                                    }
                                }}
                                variant="filled"
                            >
                                {message.text}
                            </Alert>
                            {message.details && message.details.length > 0 && (
                                <Box sx={{ 
                                    mt: 2, 
                                    maxHeight: '200px', 
                                    overflowY: 'auto',
                                    p: 3,
                                    bgcolor: '#f8f9fa',
                                    borderRadius: 2,
                                    border: '1px solid #e9ecef'
                                }}>
                                    <Typography variant="subtitle2" color="error" gutterBottom>
                                        Error Details:
                                    </Typography>
                                    {message.details.map((error, index) => (
                                        <Typography 
                                            key={index} 
                                            variant="body2" 
                                            color="error" 
                                            sx={{ 
                                                mb: 1,
                                                display: 'flex',
                                                alignItems: 'center',
                                                '&:before': {
                                                    content: '"•"',
                                                    mr: 1
                                                }
                                            }}
                                        >
                                            {error}
                                        </Typography>
                                    ))}
                                </Box>
                            )}
                        </Box>
                    )}

                    <Button
                        variant="contained"
                        color="primary.contrastText"
                        onClick={handleUpload}
                        startIcon={loading ? <CircularProgress size={20} /> : <CloudUploadIcon sx={{ color: 'primary.contrastText' }} />}
                        disabled={!file || loading}
                        sx={{ 
                            py: 1.5,
                            px: 4,
                            borderRadius: 2,
                            alignSelf: 'center',
                            minWidth: 200,
                            boxShadow: 2,
                            color: 'primary.contrastText',
                            backgroundColor: 'primary.main',

                        }}
                    >
                        {loading ? (
                            <CircularProgress size={24} color="inherit" />
                        ) : (
                            'Upload Deals'
                        )}
                    </Button>
                </Box>
            </Paper>
        </Box>
    );
};

export default BulkUpload;
