import React, { useEffect, useState } from 'react';
import { Container, Typography, Paper, TableCell, TextField, Button, MenuItem, InputLabel, Grid, CardContent, Divider, Box, Avatar, TablePagination, TableContainer, Table, TableHead, TableBody, TableRow, InputAdornment, Chip, Collapse, Badge } from '@mui/material';
import { Search, Clear, ViewList, ViewModule, TableChart, Assessment, Today, Error, Warning, FilterAlt, ExpandMore, ExpandLess } from '@mui/icons-material';
import { saveAs } from 'file-saver';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import { formatDistanceToNow ,isToday} from 'date-fns';
import { FilterTextField, FilterSelect, FilterFormControl } from '../../DashBoardComponents/FilterStyles';
import {
  DashboardHeader,
  ViewToggleButton,
  StatsCard,
  ContentContainer,
  GridItemCard,
  ListItemContainer,
  ActionButtonContainer,
  FilterContainer,
} from '../../DashBoardComponents/StyledComponents';
import { TableSkeleton } from '../../../Components/Skeletons/LoadingSkeletons';
import api from '../../../services/api';

const DisplayLogs = () => {
    const [logs, setLogs] = useState([]);
    const [filteredLogs, setFilteredLogs] = useState([]);
    const [filter, setFilter] = useState({
        logType: '',
        search: '',
        dateRange: '',
        sort: '',
        role: '',
        fromDate: '',
        toDate: ''
    });
    const [anchorEl, setAnchorEl] = useState(null);
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [layout, setLayout] = useState('table');
    const [showFilters, setShowFilters] = useState(false);
    const [activeFilters, setActiveFilters] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchLogs = async () => {
            try {
                const response = await api.get(`/common/logs`);
                setLogs(response.data);
                setFilteredLogs(response.data);
                setLoading(false);
            } catch (error) {
                console.error('Error fetching logs:', error);
            }
        };

        fetchLogs();
    }, []);

    useEffect(() => {
        handleSearch();
    }, [filter]);

    useEffect(() => {
        const count = Object.values(filter).filter(value => value !== '').length;
        setActiveFilters(count);
    }, [filter]);

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilter({ ...filter, [name]: value });
    };

    const handleDateChange = (date, index) => {
        const newDateRange = [...filter.dateRange];
        newDateRange[index] = date;
        setFilter({ ...filter, dateRange: newDateRange });
    };

    const handleSearch = () => {
        let filtered = logs;
        if (filter.search) {
            filtered = filtered.filter(log => log.user_id?.name?.toLowerCase().includes(filter.search.toLowerCase()));
        }
        if (filter.logType) {
            filtered = filtered.filter(log => log.type === filter.logType);
        }
        if (filter.role) {
            filtered = filtered.filter(log => log.user_id?.role === filter.role);
        }
        if (filter.dateRange) {
            const today = new Date();
            const pastDate = new Date();
            pastDate.setDate(today.getDate() - parseInt(filter.dateRange));
            filtered = filtered.filter(log => {
                const logDate = new Date(log.createdAt);
                return logDate >= pastDate && logDate <= today;
            });
        }
        if (filter.sort) {
            filtered = filtered.sort((a, b) => {
                if (filter.sort === 'asc') {
                    return new Date(a.createdAt) - new Date(b.createdAt);
                } else if (filter.sort === 'desc') {
                    return new Date(b.createdAt) - new Date(a.createdAt);
                }
                return 0;
            });
        }
        setFilteredLogs(filtered);
    };

    const handleClearFilters = () => {
        setFilter({
            logType: '',
            search: '',
            dateRange: '',
            sort: '',
            role: '',
            fromDate: '',
            toDate: ''
        });
        setFilteredLogs(logs);
    };

    const handleDownloadClick = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const handleDownloadClose = () => {
        setAnchorEl(null);
    };

    const handleDownloadCSV = () => {
        const csvData = filteredLogs.map(log => ({
            Type: log.type,
            Message: log.message,
            User: log.user_id.name,
            Date: new Date(log.createdAt).toLocaleDateString(),
        }));

        const csvContent = [
            ['Type', 'Message', 'User', 'Date'],
            ...csvData.map(log => Object.values(log)),
        ]
            .map(e => e.join(','))
            .join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        saveAs(blob, 'logs.csv');
        handleDownloadClose();
    };

    const handleDownloadPDF = () => {
        const doc = new jsPDF();
        doc.text('Logs Report', 20, 10);
        doc.autoTable({
            head: [['Type', 'Message', 'User', 'Date']],
            body: filteredLogs.map(log => [
                log.type,
                log.message,
                log.user_id.name,
                new Date(log.createdAt).toLocaleDateString(),
            ]),
        });
        doc.save('logs.pdf');
        handleDownloadClose();
    };

    const handleChangePage = (event, newPage) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    const paginatedLogs = filteredLogs.slice(
        page * rowsPerPage,
        page * rowsPerPage + rowsPerPage
    );

    if (loading) {
        return <TableSkeleton columnsNum={5} />;
    }

    return (
        <Container maxWidth="xl">
            <DashboardHeader>
                <Box>
                    <Typography variant="h4" fontWeight="bold" gutterBottom>
                        System Logs
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        {filteredLogs.length} entries found
                    </Typography>
                </Box>
                
                <ActionButtonContainer>
                    <ViewToggleButton
                        variant={layout === 'list' ? 'contained' : 'outlined'}
                        onClick={() => setLayout('list')}
                        startIcon={<ViewList color="primary.contrastText" />}
                        sx={{ borderColor: 'primary.contrastText', color: 'primary.contrastText' }}
                    >
                        List View
                    </ViewToggleButton>
                    <ViewToggleButton
                        variant={layout === 'grid' ? 'contained' : 'outlined'}
                        onClick={() => setLayout('grid')}
                        startIcon={<ViewModule color="primary.contrastText" />}
                        sx={{ borderColor: 'primary.contrastText', color: 'primary.contrastText' }}
                    >
                        Grid View
                    </ViewToggleButton>
                    <ViewToggleButton
                        variant={layout === 'table' ? 'contained' : 'outlined'}
                        onClick={() => setLayout('table')}
                        startIcon={<TableChart color="primary.contrastText" />}
                        disabled={isMobile}
                        sx={{ borderColor: 'primary.contrastText', color: 'primary.contrastText' }}
                    >
                        Table View
                    </ViewToggleButton>
                </ActionButtonContainer>
            </DashboardHeader>

            <Grid container spacing={3} sx={{ mb: 3 }}>
                <Grid item xs={12} sm={6} md={3}>
                    <StatsCard>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Avatar sx={{ bgcolor: 'primary.main' }}>
                                <Assessment color="primary.contrastText" />
                            </Avatar>
                            <Typography variant="h6">Total Logs</Typography>
                        </Box>
                        <Typography variant="h4">{logs.length}</Typography>
                        <Typography variant="body2" color="text.secondary">
                            All time
                        </Typography>
                    </StatsCard>
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                    <StatsCard>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Avatar sx={{ bgcolor: 'success.main' }}>
                                <Today color="primary.contrastText" />
                            </Avatar>
                            <Typography variant="h6">Today's Logs</Typography>
                        </Box>
                        <Typography variant="h4">
                            {logs.filter(log => isToday(new Date(log.createdAt))).length}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Last 24 hours
                        </Typography>
                    </StatsCard>
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                    <StatsCard>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Avatar sx={{ bgcolor: 'error.main' }}>
                                <Error color="primary.contrastText" />
                            </Avatar>
                            <Typography variant="h6">Error Logs</Typography>
                        </Box>
                        <Typography variant="h4" color="error.main">
                            {logs.filter(log => log.type === 'error').length}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Require attention
                        </Typography>
                    </StatsCard>
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                    <StatsCard>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Avatar sx={{ bgcolor: 'warning.main' }}>
                                <Warning color="primary.contrastText" />
                            </Avatar>
                            <Typography variant="h6">Warning Logs</Typography>
                        </Box>
                        <Typography variant="h4" color="warning.main">
                            {logs.filter(log => log.type === 'warning').length}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            May need review
                        </Typography>
                    </StatsCard>
                </Grid>
            </Grid>

            <ContentContainer sx={{mt:10}}>
                <Paper sx={{ mb: 3, p: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                        <Button
                            onClick={() => setShowFilters(!showFilters)}
                            startIcon={<FilterAlt color="primary.contrastText" />}
                            endIcon={showFilters ? <ExpandLess color="primary.contrastText" /> : <ExpandMore color="primary.contrastText" />}
                            color="primary.contrastText"
                        >
                            <Badge badgeContent={activeFilters} color="primary.contrastText" sx={{ mr: 1 }}>
                                Filters
                            </Badge>
                        </Button>
                        {activeFilters > 0 && (
                            <Button
                                variant="text"
                                startIcon={<Clear color="primary.contrastText" />}
                                onClick={handleClearFilters}
                                size="small"
                            >
                                Clear All
                            </Button>
                        )}
                    </Box>

                    <Collapse in={showFilters}>
                        <FilterContainer>
                            <Grid container spacing={2}>
                                <Grid item xs={12}>
                                    <Box sx={{ mb: 2 }}>
                                        <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                                            Quick Filters
                                        </Typography>
                                        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                                            {['Today', 'Last 7 Days', 'Last 30 Days', 'Errors Only', 'Warnings Only'].map((label) => (
                                                <Chip
                                                    key={label}
                                                    label={label}
                                                    onClick={() => {
                                                        if (label === 'Today') {
                                                            setFilter(prev => ({ ...prev, dateRange: '1' }));
                                                        } else if (label === 'Last 7 Days') {
                                                            setFilter(prev => ({ ...prev, dateRange: '7' }));
                                                        } else if (label === 'Last 30 Days') {
                                                            setFilter(prev => ({ ...prev, dateRange: '30' }));
                                                        } else if (label === 'Errors Only') {
                                                            setFilter(prev => ({ ...prev, logType: 'error' }));
                                                        } else if (label === 'Warnings Only') {
                                                            setFilter(prev => ({ ...prev, logType: 'warning' }));
                                                        }
                                                    }}
                                                    variant="outlined"
                                                    color="primary.contrastText"
                                                    sx={{
                                                        '&:hover': {
                                                            backgroundColor: 'primary.light',
                                                            color: 'primary.contrastText'
                                                        }
                                                    }}
                                                />
                                            ))}
                                        </Box>
                                    </Box>
                                </Grid>

                                <Grid item xs={12} md={4}>
                                    <FilterTextField
                                        label="Search Logs"
                                        name="search"
                                        value={filter.search}
                                        onChange={handleFilterChange}
                                        fullWidth
                                        placeholder="Search by user or message..."
                                        InputProps={{
                                            startAdornment: (
                                                <InputAdornment position="start">
                                                    <Search fontSize="small" color="primary.contrastText" />
                                                </InputAdornment>
                                            ),
                                        }}
                                    />
                                </Grid>

                                <Grid item xs={12} sm={6} md={4}>
                                    <FilterFormControl fullWidth>
                                        <InputLabel>Log Type</InputLabel>
                                        <FilterSelect
                                            value={filter.logType}
                                            onChange={handleFilterChange}
                                            label="Log Type"
                                            name="logType"
                                        >
                                            <MenuItem value=""><em>All Types</em></MenuItem>
                                            <MenuItem value="info">
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                    <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'info.main' }} />
                                                    Info
                                                </Box>
                                            </MenuItem>
                                            <MenuItem value="warning">
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                    <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'warning.main' }} />
                                                    Warning
                                                </Box>
                                            </MenuItem>
                                            <MenuItem value="error">
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                    <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'error.main' }} />
                                                    Error
                                                </Box>
                                            </MenuItem>
                                        </FilterSelect>
                                    </FilterFormControl>
                                </Grid>

                                <Grid item xs={12} sm={6} md={4}>
                                    <FilterFormControl fullWidth>
                                        <InputLabel>User Role</InputLabel>
                                        <FilterSelect
                                            value={filter.role}
                                            onChange={handleFilterChange}
                                            label="User Role"
                                            name="role"
                                        >
                                            <MenuItem value=""><em>All Roles</em></MenuItem>
                                            <MenuItem value="member">Member</MenuItem>
                                            <MenuItem value="distributor">Distributor</MenuItem>
                                            <MenuItem value="admin">Admin</MenuItem>
                                        </FilterSelect>
                                    </FilterFormControl>
                                </Grid>

                                <Grid item xs={12}>
                                    <Divider sx={{ my: 2 }} />
                                    <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 2 }}>
                                        Date Range
                                    </Typography>
                                    <Grid container spacing={2}>
                                        <Grid item xs={12} sm={6} md={4}>
                                            <TextField
                                                type="date"
                                                label="From Date"
                                                sx={{ 
                                                    '& .MuiInputBase-root': {
                                                        height: '40px'  // Reduced height to match other inputs
                                                    },
                                                    '& .MuiOutlinedInput-input': {
                                                        padding: '8px 14px'  // Adjust padding to center the content
                                                    }
                                                }}
                                                value={filter.fromDate}
                                                onChange={(e) => handleFilterChange({
                                                    target: { name: 'fromDate', value: e.target.value }
                                                })}
                                                InputLabelProps={{ shrink: true }}
                                                fullWidth
                                            />
                                        </Grid>
                                        <Grid item xs={12} sm={6} md={4}>
                                            <TextField
                                                type="date"
                                                label="To Date"
                                                sx={{ 
                                                    '& .MuiInputBase-root': {
                                                        height: '40px'  // Reduced height to match other inputs
                                                    },
                                                    '& .MuiOutlinedInput-input': {
                                                        padding: '8px 14px'  // Adjust padding to center the content
                                                    }
                                                }}
                                                value={filter.toDate}
                                                onChange={(e) => handleFilterChange({
                                                    target: { name: 'toDate', value: e.target.value }
                                                })}
                                                InputLabelProps={{ shrink: true }}
                                                fullWidth
                                            />
                                        </Grid>
                                    </Grid>
                                </Grid>
                            </Grid>
                        </FilterContainer>
                    </Collapse>
                </Paper>

                {activeFilters > 0 && (
                    <Box sx={{ mb: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                        {filter.logType && (
                            <Chip
                                label={`Type: ${filter.logType}`}
                                onDelete={() => setFilter(prev => ({ ...prev, logType: '' }))}
                                color="primary.contrastText"
                                variant="outlined"
                            />
                        )}
                        {filter.role && (
                            <Chip
                                label={`Role: ${filter.role}`}
                                onDelete={() => setFilter(prev => ({ ...prev, role: '' }))}
                                color="primary.contrastText"
                                variant="outlined"
                            />
                        )}
                        {filter.dateRange && (
                            <Chip
                                label={`Last ${filter.dateRange} days`}
                                onDelete={() => setFilter(prev => ({ ...prev, dateRange: '' }))}
                                color="primary.contrastText"
                                variant="outlined"
                            />
                        )}
                        {filter.search && (
                            <Chip
                                label={`Search: ${filter.search}`}
                                onDelete={() => setFilter(prev => ({ ...prev, search: '' }))}
                                color="primary.contrastText"
                                variant="outlined"
                            />
                        )}
                    </Box>
                )}

                {filteredLogs.length === 0 ? (
                    <EmptyState />
                ) : (
                    <>
                        {layout === 'table' && !isMobile && (
                            <TableView logs={paginatedLogs} />
                        )}
                        
                        {layout === 'grid' && (
                            <GridView logs={paginatedLogs} />
                        )}
                        
                        {(layout === 'list' || (layout === 'table' && isMobile)) && (
                            <ListView logs={paginatedLogs} />
                        )}

                        <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center' }}>
                            <TablePagination
                                component="div"
                                count={filteredLogs.length}
                                page={page}
                                onPageChange={handleChangePage}
                                rowsPerPage={rowsPerPage}
                                onRowsPerPageChange={handleChangeRowsPerPage}
                                rowsPerPageOptions={[5, 10, 25, 50]}
                            />
                        </Box>
                    </>
                )}
            </ContentContainer>
        </Container>
    );
};

const TableView = ({ logs }) => (
    <TableContainer component={Paper}>
        <Table>
            <TableHead>
                <TableRow>
                    <TableCell>Type</TableCell>
                    <TableCell>Message</TableCell>
                    <TableCell>User</TableCell>
                    <TableCell>Date</TableCell>
                </TableRow>
            </TableHead>
            <TableBody>
                {logs.map((log) => (
                    <TableRow key={log._id}>
                        <TableCell>{log.type}</TableCell>
                        <TableCell>{log.message}</TableCell>
                        <TableCell>{log.user_id?.name}</TableCell>
                        <TableCell>{new Date(log.createdAt).toLocaleDateString()}</TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    </TableContainer>
);

const GridView = ({ logs }) => (
    <Grid container spacing={3}>
        {logs.map((log) => (
            <Grid item xs={12} sm={6} md={4} key={log._id}>
                <GridItemCard>
                    <CardContent>
                        <Typography variant="h6" gutterBottom color="primary.contrastText" fontWeight="bold">
                            {log.type}
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                            {log.message}
                        </Typography>
                        <Divider sx={{ my: 1 }} />
                        <Box display="flex" alignItems="center" gap={1}>
                            <Avatar>{log.user_id?.name?.charAt(0) || 'U'}</Avatar>
                            <Box>
                                <Typography variant="body2" fontWeight="bold">
                                    {log.user_id?.name || 'Unknown User'}
                                </Typography>
                                <Typography variant="caption" color="textSecondary">
                                    {formatDistanceToNow(new Date(log.createdAt), { addSuffix: true })}
                                </Typography>
                            </Box>
                        </Box>
                    </CardContent>
                </GridItemCard>
            </Grid>
        ))}
    </Grid>
);

const ListView = ({ logs }) => (
    <Box>
        {logs.map((log) => (
            <ListItemContainer key={log._id}>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Typography variant="subtitle1" color="primary.contrastText" fontWeight="bold">
                        {log.type}
                    </Typography>
                    <Typography variant="caption" color="textSecondary">
                        {formatDistanceToNow(new Date(log.createdAt), { addSuffix: true })}
                    </Typography>
                </Box>
                <Typography variant="body2" color="textSecondary">
                    {log.message}
                </Typography>
                <Box display="flex" alignItems="center" gap={1} mt={1}>
                    <Avatar sx={{ width: 24, height: 24, fontSize: '0.75rem' }}>
                        {log.user_id?.name?.charAt(0) || 'U'}
                    </Avatar>
                    <Typography variant="body2">
                        {log.user_id?.name || 'Unknown User'}
                    </Typography>
                </Box>
            </ListItemContainer>
        ))}
    </Box>
);

const EmptyState = () => (
    <Box display="flex" flexDirection="column" alignItems="center" mt={4}>
        <img 
            src="https://image.shutterstock.com/image-vector/no-result-data-document-file-250nw-2192195861.jpg" 
            alt="No data" 
            style={{ 
                mixBlendMode: 'multiply', 
                width: '150px', 
                marginBottom: '1rem' 
            }} 
        />
        <Typography variant="h6" color="textSecondary">
            No logs match the filter criteria.
        </Typography>
    </Box>
);

export default DisplayLogs;
