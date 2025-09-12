import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { useAuth } from '../../middleware/auth';
import {
    Container,
    Typography,
    Grid,
    Box,
    Button,
    Chip,
    Card,
    CardContent,
    CircularProgress,
    Fade,
    IconButton,
    Tooltip,
    Divider,
    useTheme,
    useMediaQuery,
    Paper,
    Skeleton,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
} from '@mui/material';
import {
    Timeline,
    TimelineItem,
    TimelineSeparator,
    TimelineConnector,
    TimelineContent,
    TimelineDot,
} from '@mui/lab';
import { 
    ArrowBack, 
    Person, 
    ShoppingCart, 
    AttachMoney, 
    Info,
    CalendarToday,
    LocalOffer,
    Email,
    ContentCopy,
    CheckCircle,
    Category,
    Discount,
    CompareArrows
} from '@mui/icons-material';
import CommitmentChat from './CommitmentChat';

const CommitmentDetailsSkeleton = () => (
    <Container>
        <Fade in>
            <Grid container spacing={3}>
                <Grid item xs={12}>
                    <Skeleton variant="text" sx={{ fontSize: '2rem', mb: 2 }} />
                    <Paper sx={{ p: 3 }}>
                        <Grid container spacing={3}>
                            <Grid item xs={12} md={6}>
                                <Box>
                                    <Skeleton variant="text" sx={{ fontSize: '1.5rem', mb: 1 }} />
                                    {[...Array(4)].map((_, index) => (
                                        <Skeleton key={index} variant="text" sx={{ mb: 1 }} />
                                    ))}
                                </Box>
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <Box>
                                    <Skeleton variant="text" sx={{ fontSize: '1.5rem', mb: 1 }} />
                                    <Skeleton variant="rectangular" height={200} />
                                </Box>
                            </Grid>
                        </Grid>
                    </Paper>
                </Grid>
                <Grid item xs={12}>
                    <Paper sx={{ p: 3 }}>
                        <Skeleton variant="text" sx={{ fontSize: '1.5rem', mb: 2 }} />
                        {[...Array(5)].map((_, index) => (
                            <Box key={index} sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                <Skeleton variant="circular" width={40} height={40} sx={{ mr: 2 }} />
                                <Box sx={{ flex: 1 }}>
                                    <Skeleton variant="text" />
                                    <Skeleton variant="text" width="60%" />
                                </Box>
                            </Box>
                        ))}
                    </Paper>
                </Grid>
            </Grid>
        </Fade>
    </Container>
);

const CommitmentDetails = () => {
    const { commitmentId } = useParams();
    const navigate = useNavigate();
    const { currentUserId } = useAuth();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
    const [commitment, setCommitment] = useState(null);
    const [loading, setLoading] = useState(true);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        const fetchCommitmentDetails = async () => {
            try {
                const response = await api.get(
                    `/deals/commit/details/${commitmentId}`,
                    {
                        params: {
                            populate: true  
                        }
                    }
                );
                console.log('Fetched commitment:', response.data);
                setCommitment(response.data);
                setLoading(false);
            } catch (error) {
                console.error('Error fetching commitment details:', error);
                setLoading(false);
            }
        };

        fetchCommitmentDetails();
    }, [commitmentId]);

    const handleCopyId = () => {
        navigator.clipboard.writeText(commitmentId);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };
    const userRole = localStorage.getItem('user_role');

    if (loading) {
        return <CommitmentDetailsSkeleton />;
    }

    if (!commitment) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
                <Typography variant="h6" color="error">Commitment not found</Typography>
            </Box>
        );
    }

    const getStatusColor = (status) => {
        const colors = {
            pending: 'warning',
            approved: 'success',
            declined: 'error',
            cancelled: 'error'
        };
        return colors[status] || 'default';
    };

    const cardStyle = {
        height: '100%',
        transition: 'transform 0.3s, box-shadow 0.3s',
        borderRadius: 4,
        border: '1px solid',
        borderColor: theme.palette.mode === 'light' ? 'rgba(0, 0, 0, 0.08)' : 'divider',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
        bgcolor: theme.palette.mode === 'light' ? 'rgba(255, 255, 255, 0.9)' : 'background.paper',
        backdropFilter: 'blur(8px)',
        '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: '0 8px 30px rgba(0, 0, 0, 0.08)',
        },
    };

    // Calculate totals from size commitments
    const calculateTotalFromSizeCommitments = (sizeCommitments) => {
        if (!sizeCommitments || !Array.isArray(sizeCommitments)) return 0;
        return sizeCommitments.reduce((total, item) => total + item.quantity, 0);
    };

    const originalTotalQuantity = calculateTotalFromSizeCommitments(commitment.sizeCommitments);
    const modifiedTotalQuantity = commitment.modifiedSizeCommitments ? 
        calculateTotalFromSizeCommitments(commitment.modifiedSizeCommitments) : 0;

    return (
        <Fade in={true}>
            <Container maxWidth="xl" sx={{ py: 4 }}>
                <Box sx={{ mb: 4 }}>
                    <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                        <Button
                            startIcon={<ArrowBack color="primary.contrastText" />}
                            onClick={() => navigate(-1)}
                            variant="outlined"
                            color="primary.contrastText"
                            sx={{ 
                                borderRadius: 3,
                                borderColor: 'primary.contrastText',
                                transition: 'all 0.3s',
                                '&:hover': {
                                    transform: 'translateX(-4px)',
                                    bgcolor: 'primary.main',
                                    borderColor: 'primary.main'
                                }
                            }}
                        >
                            Back to List
                        </Button>
                        <Chip
                            label={commitment.status.toUpperCase()}
                            color={getStatusColor(commitment.status)}
                            size="large"
                            sx={{ 
                                borderRadius: 3,
                                px: 2,
                                height: 40,
                                '& .MuiChip-label': {
                                    fontWeight: 600,
                                    fontSize: '0.9rem',
                                    letterSpacing: '0.02em'
                                }
                            }}
                        />
                    </Box>
                    {userRole === 'admin' && (
                        <Box display="flex" alignItems="center" gap={1}>
                            <Typography variant="caption" color="text.secondary">
                                Commitment ID:
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                                {commitmentId}
                            </Typography>
                            <Tooltip title={copied ? "Copied!" : "Copy ID"}>
                                <IconButton 
                                    size="small" 
                                    onClick={handleCopyId}
                                    sx={{
                                        transition: 'all 0.2s',
                                        '&:hover': {
                                            transform: 'scale(1.1)',
                                            bgcolor: 'rgba(0, 0, 0, 0.04)'
                                        }
                                    }}
                                >
                                    {copied ? 
                                        <CheckCircle color="success" fontSize="small" /> : 
                                        <ContentCopy fontSize="small" sx={{ opacity: 0.6 }} />
                                    }
                                </IconButton>
                            </Tooltip>
                        </Box>
                    )}
                </Box>

                <Grid container spacing={4}>
                    {/* Chat Section - Left Side on Desktop */}
                    <Grid item xs={12} md={5} lg={4} sx={{ order: { xs: 2, md: 1 } }}>
                        <Box sx={{ 
                            position: { md: 'sticky' },
                            top: { md: '20px' },
                            height: { md: 'calc(100vh)' },
                            overflow: 'hidden'
                        }}>
                            <CommitmentChat 
                                commitmentId={commitment._id} 
                                commitment={commitment}
                            />
                        </Box>
                    </Grid>

                    {/* Details Section - Right Side on Desktop */}
                    <Grid item xs={12} md={7} lg={8} sx={{ order: { xs: 1, md: 2 } }}>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                            {/* Deal Information Card */}
                            <Card elevation={0} sx={cardStyle}>
                                <CardContent sx={{ p: 3 }}>
                                    <Box display="flex" alignItems="flex-start" mb={2}>
                                        <LocalOffer sx={{ 
                                            mr: 2, 
                                            color: 'primary.contrastText',
                                            fontSize: 35,
                                            bgcolor: 'rgba(25, 118, 210, 0.08)',
                                            p: 1,
                                            borderRadius: 2
                                        }} />
                                        <Box flex={1}>
                                            <Typography variant="h5" component="div" gutterBottom sx={{
                                                fontWeight: 600,
                                                color: 'text.primary',
                                                letterSpacing: '-0.01em'
                                            }}>
                                                {commitment.dealId.name}
                                            </Typography>
                                            <Box display="flex" alignItems="center" gap={1}>
                                                <Category fontSize="small" sx={{ color: 'text.secondary' }} />
                                                <Typography variant="body2" color="text.secondary" sx={{
                                                    fontWeight: 500
                                                }}>
                                                    {commitment.dealId.category}
                                                </Typography>
                                            </Box>
                                            <Typography variant="body1" sx={{ 
                                                mt: 2,
                                                color: 'text.secondary',
                                                lineHeight: 1.6
                                            }}>
                                                {commitment.dealId.description}
                                            </Typography>
                                        </Box>
                                    </Box>
                                </CardContent>
                            </Card>

                            {/* Discount Tier Information (if applied) */}
                            {commitment.sizeCommitments && commitment.sizeCommitments.some(sc => sc.appliedDiscountTier) ? (
                                <Card elevation={0} sx={{
                                    ...cardStyle,
                                    bgcolor: 'rgba(76, 175, 80, 0.04)'
                                }}>
                                    <CardContent sx={{ p: 3 }}>
                                        <Box display="flex" alignItems="center" mb={2}>
                                            <Box sx={{
                                                mr: 2,
                                                p: 1,
                                                borderRadius: 2,
                                                bgcolor: 'rgba(76, 175, 80, 0.12)'
                                            }}>
                                                <Discount sx={{ color: 'success.main' }} />
                                            </Box>
                                            <Typography variant="h6" color="success.main" fontWeight="600">
                                                Applied Size-Specific Discount Tiers
                                            </Typography>
                                        </Box>
                                        <Divider sx={{ mb: 3, opacity: 0.1 }} />
                                        <Box sx={{ ml: 4 }}>
                                            {commitment.sizeCommitments
                                                .filter(sc => sc.appliedDiscountTier)
                                                .map((sc, idx) => (
                                                    <Box key={idx} sx={{ mb: 2 }}>
                                                        <Typography variant="body1" color="text.primary" fontWeight="500">
                                                            {sc.size}:
                                                        </Typography>
                                                        <Typography variant="body2" color="success.main" sx={{ ml: 2 }}>
                                                            <strong>${sc.appliedDiscountTier.tierDiscount}</strong> price at {sc.appliedDiscountTier.tierQuantity}+ units
                                                        </Typography>
                                                    </Box>
                                                ))}
                                        </Box>
                                    </CardContent>
                                </Card>
                            ) : commitment.appliedDiscountTier && (
                                <Card elevation={0} sx={{
                                    ...cardStyle,
                                    bgcolor: 'rgba(76, 175, 80, 0.04)'
                                }}>
                                    <CardContent sx={{ p: 3 }}>
                                        <Box display="flex" alignItems="center" mb={2}>
                                            <Box sx={{
                                                mr: 2,
                                                p: 1,
                                                borderRadius: 2,
                                                bgcolor: 'rgba(76, 175, 80, 0.12)'
                                            }}>
                                                <Discount sx={{ color: 'success.main' }} />
                                            </Box>
                                            <Typography variant="h6" color="success.main" fontWeight="600">
                                                Applied Discount Tier
                                            </Typography>
                                        </Box>
                                        <Divider sx={{ mb: 3, opacity: 0.1 }} />
                                        <Box sx={{ ml: 4 }}>
                                            <Typography variant="body1" color="text.primary">
                                                <strong>{commitment.appliedDiscountTier.tierDiscount}%</strong> discount applied
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary">
                                                Tier activated at {commitment.appliedDiscountTier.tierQuantity}+ units
                                            </Typography>
                                        </Box>
                                    </CardContent>
                                </Card>
                            )}

                            {/* Commitment Size Details */}
                            <Card elevation={0} sx={cardStyle}>
                                <CardContent sx={{ p: 3 }}>
                                    <Typography variant="h6" gutterBottom sx={{ 
                                        color: 'primary.contrastText',
                                        fontWeight: 600,
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 1,
                                        mb: 2
                                    }}>
                                        <ShoppingCart fontSize="small" color="primary.contrastText" />
                                        Size Commitments
                                    </Typography>
                                    <Divider sx={{ mb: 3, opacity: 0.1 }} />
                                    
                                    {/* Original Commitments */}
                                    <Typography variant="subtitle1" fontWeight="500" sx={{ mb: 2 }}>
                                        Original Commitments
                                    </Typography>
                                    <TableContainer component={Paper} sx={{ mb: 3, boxShadow: 'none', border: '1px solid', borderColor: 'divider' }}>
                                        <Table size="small">
                                            <TableHead>
                                                <TableRow>
                                                    <TableCell>Size</TableCell>
                                                    <TableCell align="right">Quantity</TableCell>
                                                    <TableCell align="right">Price Per Unit</TableCell>
                                                    <TableCell align="right">Discount Tier</TableCell>
                                                    <TableCell align="right">Total Price</TableCell>
                                                </TableRow>
                                            </TableHead>
                                            <TableBody>
                                                {commitment.sizeCommitments && commitment.sizeCommitments.map((sizeCommit, index) => (
                                                    <TableRow key={index}>
                                                        <TableCell component="th" scope="row">{sizeCommit.size}</TableCell>
                                                        <TableCell align="right">{sizeCommit.quantity}</TableCell>
                                                        <TableCell align="right">${Number(sizeCommit.pricePerUnit).toFixed(2)}</TableCell>
                                                        <TableCell align="right">
                                                            {sizeCommit.appliedDiscountTier ? (
                                                                <Chip 
                                                                    label={`$${sizeCommit.appliedDiscountTier.tierDiscount} at ${sizeCommit.appliedDiscountTier.tierQuantity}+`}
                                                                    size="small"
                                                                    color="success"
                                                                    variant="outlined"
                                                                />
                                                            ) : (
                                                                <Typography variant="caption" color="text.secondary">None</Typography>
                                                            )}
                                                        </TableCell>
                                                        <TableCell align="right">${Number(sizeCommit.totalPrice || sizeCommit.quantity * sizeCommit.pricePerUnit).toFixed(2)}</TableCell>
                                                    </TableRow>
                                                ))}
                                                <TableRow sx={{ bgcolor: 'rgba(0, 0, 0, 0.04)' }}>
                                                    <TableCell colSpan={1}><strong>Total</strong></TableCell>
                                                    <TableCell align="right"><strong>{originalTotalQuantity}</strong></TableCell>
                                                    <TableCell align="right"></TableCell>
                                                    <TableCell align="right"></TableCell>
                                                    <TableCell align="right"><strong>${Number(commitment.totalPrice).toFixed(2)}</strong></TableCell>
                                                </TableRow>
                                            </TableBody>
                                        </Table>
                                    </TableContainer>

                                    {/* Modified Commitments (if applicable) */}
                                    {commitment.modifiedByDistributor && commitment.modifiedSizeCommitments && commitment.modifiedSizeCommitments.length > 0 && (
                                        <>
                                            <Typography variant="subtitle1" fontWeight="500" sx={{ mb: 2, color: 'warning.main', display: 'flex', alignItems: 'center', gap: 1 }}>
                                                <CompareArrows fontSize="small" />
                                                Modified by Distributor
                                            </Typography>
                                            <TableContainer component={Paper} sx={{ mb: 3, boxShadow: 'none', border: '1px solid', borderColor: 'warning.light' }}>
                                                <Table size="small">
                                                    <TableHead>
                                                        <TableRow sx={{ bgcolor: 'rgba(255, 152, 0, 0.08)' }}>
                                                            <TableCell>Size</TableCell>
                                                            <TableCell align="right">Quantity</TableCell>
                                                            <TableCell align="right">Price Per Unit</TableCell>
                                                            <TableCell align="right">Total Price</TableCell>
                                                        </TableRow>
                                                    </TableHead>
                                                    <TableBody>
                                                        {commitment.modifiedSizeCommitments.map((sizeCommit, index) => (
                                                            <TableRow key={index}>
                                                                <TableCell component="th" scope="row">{sizeCommit.size}</TableCell>
                                                                <TableCell align="right">{sizeCommit.quantity}</TableCell>
                                                                <TableCell align="right">${Number(sizeCommit.pricePerUnit).toFixed(2)}</TableCell>
                                                                <TableCell align="right">${Number(sizeCommit.totalPrice || sizeCommit.quantity * sizeCommit.pricePerUnit).toFixed(2)}</TableCell>
                                                            </TableRow>
                                                        ))}
                                                        <TableRow sx={{ bgcolor: 'rgba(255, 152, 0, 0.08)' }}>
                                                            <TableCell colSpan={1}><strong>Total</strong></TableCell>
                                                            <TableCell align="right"><strong>{modifiedTotalQuantity}</strong></TableCell>
                                                            <TableCell align="right"></TableCell>
                                                            <TableCell align="right"><strong>${Number(commitment.modifiedTotalPrice).toFixed(2)}</strong></TableCell>
                                                        </TableRow>
                                                    </TableBody>
                                                </Table>
                                            </TableContainer>
                                        </>
                                    )}
                                </CardContent>
                            </Card>

                            <Grid container spacing={3}>
                                {/* User Information Card */}
                                <Grid item xs={12} md={6}>
                                    <Card elevation={0} sx={cardStyle}>
                                        <CardContent sx={{ p: 3 }}>
                                            <Typography variant="h6" gutterBottom sx={{ 
                                                color: 'primary.contrastText',
                                                fontWeight: 600,
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: 1,
                                                mb: 2
                                            }}>
                                                <Person fontSize="small" color="primary.contrastText" />
                                                User Information
                                            </Typography>
                                            <Divider sx={{ 
                                                mb: 3,
                                                opacity: 0.1
                                            }} />
                                            
                                            <Box display="flex" flexDirection="column" gap={3}>
                                                <Box display="flex" alignItems="center">
                                                    <Box sx={{
                                                        mr: 2,
                                                        p: 1,
                                                        borderRadius: 2,
                                                        bgcolor: 'rgba(25, 118, 210, 0.08)'
                                                    }}>
                                                        <Person sx={{ color: 'primary.contrastText' }} />
                                                    </Box>
                                                    <Typography variant="body1" fontWeight="500">
                                                        {commitment.userId.name}
                                                    </Typography>
                                                </Box>

                                                <Box display="flex" alignItems="center">
                                                    <Box sx={{
                                                        mr: 2,
                                                        p: 1,
                                                        borderRadius: 2,
                                                        bgcolor: 'rgba(25, 118, 210, 0.08)'
                                                    }}>
                                                        <Email sx={{ color: 'primary.contrastText' }} />
                                                    </Box>
                                                    <Typography variant="body1" fontWeight="500">
                                                        {commitment.userId.email}
                                                    </Typography>
                                                </Box>
                                            </Box>
                                        </CardContent>
                                    </Card>
                                </Grid>

                                {/* Commitment Summary Card */}
                                <Grid item xs={12} md={6}>
                                    <Card elevation={0} sx={cardStyle}>
                                        <CardContent sx={{ p: 3 }}>
                                            <Typography variant="h6" gutterBottom sx={{ 
                                                color: 'primary.contrastText',
                                                fontWeight: 600,
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: 1,
                                                mb: 2
                                            }}>
                                                <Info fontSize="small" color="primary.contrastText" />
                                                Commitment Summary
                                            </Typography>
                                            <Divider sx={{ mb: 3, opacity: 0.1 }} />
                                            
                                            <Box display="flex" flexDirection="column" gap={3}>
                                                <Box display="flex" alignItems="center">
                                                    <Box sx={{
                                                        mr: 2,
                                                        p: 1,
                                                        borderRadius: 2,
                                                        bgcolor: 'rgba(25, 118, 210, 0.08)'
                                                    }}>
                                                        <ShoppingCart sx={{ color: 'primary.contrastText' }} />
                                                    </Box>
                                                    <Box>
                                                        <Typography variant="body1" fontWeight="500">
                                                            Total Quantity: {
                                                                commitment.modifiedByDistributor ? 
                                                                modifiedTotalQuantity : 
                                                                originalTotalQuantity
                                                            }
                                                        </Typography>
                                                        {commitment.modifiedByDistributor && (
                                                            <Typography variant="caption" color="text.secondary" sx={{ 
                                                                display: 'block',
                                                                textDecoration: 'line-through',
                                                                opacity: 0.7
                                                            }}>
                                                                Original: {originalTotalQuantity}
                                                            </Typography>
                                                        )}
                                                    </Box>
                                                </Box>

                                                <Box display="flex" alignItems="center">
                                                    <Box sx={{
                                                        mr: 2,
                                                        p: 1,
                                                        borderRadius: 2,
                                                        bgcolor: 'rgba(25, 118, 210, 0.08)'
                                                    }}>
                                                        <AttachMoney sx={{ color: 'primary.contrastText' }} />
                                                    </Box>
                                                    <Box>
                                                        <Typography variant="body1" fontWeight="500">
                                                            Total Price: ${commitment.modifiedTotalPrice || commitment.totalPrice}
                                                        </Typography>
                                                        {commitment.modifiedTotalPrice && (
                                                            <Typography variant="caption" color="text.secondary" sx={{ 
                                                                display: 'block',
                                                                textDecoration: 'line-through',
                                                                opacity: 0.7
                                                            }}>
                                                                Original: ${commitment.totalPrice}
                                                            </Typography>
                                                        )}
                                                    </Box>
                                                </Box>

                                                <Box display="flex" alignItems="center">
                                                    <Box sx={{
                                                        mr: 2,
                                                        p: 1,
                                                        borderRadius: 2,
                                                        bgcolor: 'rgba(25, 118, 210, 0.08)'
                                                    }}>
                                                        <CalendarToday sx={{ color: 'primary.contrastText' }} />
                                                    </Box>
                                                    <Typography variant="body1" fontWeight="500">
                                                        Created: {new Date(commitment.createdAt).toLocaleDateString(undefined, {
                                                            year: 'numeric',
                                                            month: 'long',
                                                            day: 'numeric',
                                                            hour: '2-digit',
                                                            minute: '2-digit'
                                                        })}
                                                    </Typography>
                                                </Box>
                                            </Box>
                                        </CardContent>
                                    </Card>
                                </Grid>
                            </Grid>

                            {/* Distributor Response Card */}
                            {commitment.distributorResponse && (
                                <Card elevation={0} sx={{
                                    ...cardStyle,
                                    bgcolor: 'rgba(2, 136, 209, 0.04)'
                                }}>
                                    <CardContent sx={{ p: 3 }}>
                                        <Box display="flex" alignItems="center" mb={2}>
                                            <Box sx={{
                                                mr: 2,
                                                p: 1,
                                                borderRadius: 2,
                                                bgcolor: 'rgba(2, 136, 209, 0.08)'
                                            }}>
                                                <Info sx={{ color: 'info.main' }} />
                                            </Box>
                                            <Typography variant="h6" color="info.main" fontWeight="600">
                                                Distributor Response
                                            </Typography>
                                        </Box>
                                        <Divider sx={{ 
                                            mb: 3,
                                            opacity: 0.1
                                        }} />
                                        <Typography 
                                            variant="body1" 
                                            sx={{ 
                                                ml: 4, 
                                                fontStyle: 'italic',
                                                p: 2.5,
                                                bgcolor: 'background.paper',
                                                borderRadius: 3,
                                                boxShadow: '0 2px 12px rgba(0, 0, 0, 0.04)',
                                                border: '1px solid',
                                                borderColor: 'rgba(2, 136, 209, 0.1)',
                                                lineHeight: 1.6,
                                                color: 'text.primary'
                                            }}
                                        >
                                            "{commitment.distributorResponse}"
                                        </Typography>
                                    </CardContent>
                                </Card>
                            )}

                            {/* Timeline Card */}
                            <Card elevation={0} sx={cardStyle}>
                                <CardContent sx={{ p: 3 }}>
                                    <Typography variant="h6" gutterBottom sx={{ 
                                        color: 'primary.contrastText',
                                        fontWeight: 600,
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 1,
                                        mb: 2
                                    }}>
                                        <CalendarToday fontSize="small" color="primary.contrastText" />
                                        Status Timeline
                                    </Typography>
                                    <Divider sx={{ 
                                        mb: 3,
                                        opacity: 0.1
                                    }} />
                                    
                                    <Timeline>
                                        <TimelineItem>
                                            <TimelineSeparator>
                                                <TimelineDot 
                                                    sx={{ 
                                                        boxShadow: '0 0 0 4px rgba(25, 118, 210, 0.12)',
                                                        bgcolor: 'primary.contrastText'
                                                    }} 
                                                />
                                                <TimelineConnector sx={{ bgcolor: 'primary.light' }} />
                                            </TimelineSeparator>
                                            <TimelineContent>
                                                <Typography variant="body1" fontWeight="500" color="primary.contrastText">
                                                    Commitment Created
                                                </Typography>
                                                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                                                    {new Date(commitment.createdAt).toLocaleString(undefined, {
                                                        year: 'numeric',
                                                        month: 'long',
                                                        day: 'numeric',
                                                        hour: '2-digit',
                                                        minute: '2-digit'
                                                    })}
                                                </Typography>
                                                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                                                    {originalTotalQuantity} units, ${Number(commitment.totalPrice).toFixed(2)}
                                                </Typography>
                                                {commitment.appliedDiscountTier && (
                                                    <Typography variant="caption" color="success.main" sx={{ display: 'block', mt: 0.5 }}>
                                                        {commitment.appliedDiscountTier.tierDiscount}% discount applied
                                                    </Typography>
                                                )}
                                            </TimelineContent>
                                        </TimelineItem>

                                        {commitment.modifiedByDistributor && (
                                            <TimelineItem>
                                                <TimelineSeparator>
                                                    <TimelineDot 
                                                        sx={{ 
                                                            boxShadow: '0 0 0 4px rgba(255, 152, 0, 0.12)',
                                                            bgcolor: 'warning.main'
                                                        }}
                                                    />
                                                    <TimelineConnector sx={{ bgcolor: 'warning.light' }} />
                                                </TimelineSeparator>
                                                <TimelineContent>
                                                    <Typography variant="body1" fontWeight="500" color="warning.main">
                                                        Modified by Distributor
                                                    </Typography>
                                                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                                                        Quantity: {modifiedTotalQuantity} | Price: ${Number(commitment.modifiedTotalPrice).toFixed(2)}
                                                    </Typography>
                                                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5, opacity: 0.7 }}>
                                                        <span style={{ textDecoration: 'line-through' }}>
                                                            Original: {originalTotalQuantity} units, ${Number(commitment.totalPrice).toFixed(2)}
                                                        </span>
                                                    </Typography>
                                                </TimelineContent>
                                            </TimelineItem>
                                        )}

                                        <TimelineItem>
                                            <TimelineSeparator>
                                                <TimelineDot 
                                                    sx={{ 
                                                        boxShadow: `0 0 0 4px ${theme.palette[getStatusColor(commitment.status)].light}20`,
                                                        bgcolor: theme.palette[getStatusColor(commitment.status)].main
                                                    }}
                                                />
                                            </TimelineSeparator>
                                            <TimelineContent>
                                                <Typography variant="body1" fontWeight="500" color={`${getStatusColor(commitment.status)}.main`}>
                                                    Current Status: {commitment.status.toUpperCase()}
                                                </Typography>
                                                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                                                    Final: {commitment.modifiedByDistributor ? modifiedTotalQuantity : originalTotalQuantity} units, 
                                                    ${Number(commitment.modifiedTotalPrice || commitment.totalPrice).toFixed(2)}
                                                </Typography>
                                            </TimelineContent>
                                        </TimelineItem>
                                    </Timeline>
                                </CardContent>
                            </Card>
                        </Box>
                    </Grid>
                </Grid>
            </Container>
        </Fade>
    );
};

export default CommitmentDetails; 