import React, { useState, useEffect } from "react";
import api from "../../services/api";
import { useAuth } from "../../middleware/auth";
import { useParams, useNavigate } from "react-router-dom";
import {
  Box,
  Button,
  Stack,
  Typography,
  Divider,
  Card,
  CardContent,
  CardHeader,
  Grid,
  Chip,
  TextField,
  Select as MuiSelect,
  MenuItem,
  FormControl,
  FormLabel,
  InputLabel,
  CircularProgress,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Modal,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  IconButton,
  Paper,
  Alert,
  Snackbar,
  Badge,
  Tooltip,
  AlertTitle,
  Container,
  Avatar,
  useTheme,
  useMediaQuery,
  LinearProgress,
  Skeleton,
  styled,
  alpha,
} from "@mui/material";
import {
  ArrowBack as ArrowBackIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  GetApp as DownloadIcon,
  Group as GroupIcon,
  Business as BusinessIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  LocationOn as LocationIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Refresh as RefreshIcon,
  Assignment as AssignmentIcon,
  Person as PersonIcon,
  ArrowForward as ArrowForwardIcon,
  Inventory as InventoryIcon,
  AttachMoney as AttachMoneyIcon,
} from "@mui/icons-material";
import { saveAs } from "file-saver";
import * as XLSX from "xlsx";
import { motion } from "framer-motion";

// Styled components for enhanced UI
const PageContainer = styled(Container)(({ theme }) => ({
  paddingTop: theme.spacing(4),
  paddingBottom: theme.spacing(8),
}));

const StyledCard = styled(Card)(({ theme }) => ({
  borderRadius: theme.spacing(2),
  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08)',
  height: '100%',
  transition: 'transform 0.3s, box-shadow 0.3s',
  overflow: 'visible',
  '&:hover': {
    boxShadow: '0 12px 48px rgba(0, 0, 0, 0.12)',
    transform: 'translateY(-5px)',
  },
}));

const StyledCardHeader = styled(CardHeader)(({ theme }) => ({
  paddingBottom: theme.spacing(1),
  '& .MuiCardHeader-title': {
    fontSize: '1.25rem',
    fontWeight: 600,
  },
  '& .MuiCardHeader-subheader': {
    fontSize: '0.875rem',
  },
}));

const AnimatedBox = styled(motion.div)({
  width: '100%',
});

const InfoItem = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  marginBottom: theme.spacing(2),
}));

const InfoLabel = styled(Typography)(({ theme }) => ({
  fontWeight: 600,
  color: theme.palette.text.secondary,
  marginRight: theme.spacing(2),
  minWidth: 100,
}));

const InfoValue = styled(Typography)(({ theme }) => ({
  color: theme.palette.text.primary,
  display: 'flex',
  alignItems: 'center',
}));

const InfoIcon = styled(Box)(({ theme }) => ({
  marginRight: theme.spacing(1.5),
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: theme.palette.primary.main,
}));

const StatusChip = styled(Chip)(({ theme, statuscolor }) => ({
  borderRadius: '4px',
  fontWeight: 500,
  backgroundColor: theme.palette[statuscolor].light,
  color: theme.palette[statuscolor].dark,
  '& .MuiChip-label': {
    padding: '0 10px',
  },
}));

const MemberAvatar = styled(Avatar)(({ theme }) => ({
  width: 80,
  height: 80,
  backgroundColor: theme.palette.primary.main,
  fontSize: '2rem',
  marginBottom: theme.spacing(2),
}));

const SupplierBadge = styled(Badge)(({ theme }) => ({
  '& .MuiBadge-badge': {
    right: -10,
    top: 0,
    padding: '0 6px',
    backgroundColor: theme.palette.primary.main,
    color: theme.palette.primary.contrastText,
  },
}));

const AssignSuppliers = () => {
  const { memberId } = useParams();
  const navigate = useNavigate();
  const theme = useTheme();
  
  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };
  
  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.5
      }
    }
  };

  const [member, setMember] = useState(null);
  const [commitments, setCommitments] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [assignedSuppliers, setAssignedSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [exportLoading, setExportLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
  });
  const [selectedSupplierId, setSelectedSupplierId] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [alertOpen, setAlertOpen] = useState(false);
  const [selectedSupplierToRemove, setSelectedSupplierToRemove] = useState(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "info"
  });
  const [supplierMemberCounts, setSupplierMemberCounts] = useState({});

  // Get user data from middleware
  const { currentUserId, isImpersonating } = useAuth();
  const distributorId = currentUserId;

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch member data and commitments
        const memberResponse = await api.get(
          `/api/suppliers/export-member-data/${memberId}`
        );
        
        setMember(memberResponse.data.data.member);
        setCommitments(memberResponse.data.data.commitments);
        
        // Handle multiple suppliers if available, otherwise fallback to single supplier
        if (memberResponse.data.data.suppliers && memberResponse.data.data.suppliers.length > 0) {
          setAssignedSuppliers(memberResponse.data.data.suppliers);
        } else if (memberResponse.data.data.supplier) {
          setAssignedSuppliers([memberResponse.data.data.supplier]);
        } else {
          setAssignedSuppliers([]);
        }
        
        // Fetch all suppliers
        const suppliersResponse = await api.get(
          `/api/suppliers/by-distributor`
        );
        setSuppliers(suppliersResponse.data.suppliers);
        
        // Calculate number of members per supplier
        const counts = {};
        suppliersResponse.data.suppliers.forEach(supplier => {
          if (supplier.assignedTo) {
            counts[supplier._id] = supplier.assignedTo.length;
          } else {
            counts[supplier._id] = 0;
          }
        });
        setSupplierMemberCounts(counts);
        
      } catch (error) {
        console.error("Error fetching data:", error);
        setSnackbar({
          open: true,
          message: "Failed to fetch data. Please try again.",
          severity: "error"
        });
      } finally {
        setLoading(false);
      }
    };

    if (memberId && distributorId) {
      fetchData();
    }
  }, [memberId, distributorId]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSupplierSelect = (e) => {
    setSelectedSupplierId(e.target.value);
  };

  const handleCreateSupplier = async () => {
    try {
      if (!formData.name || !formData.email) {
        setSnackbar({
          open: true,
          message: "Please provide both name and email for the supplier",
          severity: "warning"
        });
        return;
      }
      
      const response = await api.post(`/api/suppliers`, {
        ...formData,
      });
      
      setSnackbar({
        open: true,
        message: "Supplier has been created successfully",
        severity: "success"
      });
      
      // Add new supplier to list and reset form
      setSuppliers([...suppliers, response.data.supplier]);
      setFormData({ name: "", email: "" });
      setModalOpen(false);
      
    } catch (error) {
      console.error("Error creating supplier:", error);
      setSnackbar({
        open: true,
        message: error.response?.data?.message || "Failed to create supplier",
        severity: "error"
      });
    }
  };

  const handleAssignSupplier = async () => {
    try {
      if (!selectedSupplierId) {
        setSnackbar({
          open: true,
          message: "Please select a supplier to assign",
          severity: "warning"
        });
        return;
      }
      
      const response = await api.put(`/api/suppliers/assign/${selectedSupplierId}`, {
        memberId,
        multiMemberAssignment: true // Ensure the same supplier can be assigned to multiple members
      });
      
      // Check if the response contains the updated list of assigned suppliers
      if (response.data.assignedSuppliers) {
        setAssignedSuppliers(response.data.assignedSuppliers);
      } else {
        // Find the selected supplier from the list
        const supplier = suppliers.find(s => s._id === selectedSupplierId);
        // Add the new supplier to the existing list of assigned suppliers
        setAssignedSuppliers(prev => [...prev, supplier]);
      }
      
      // Update the member count for this supplier
      setSupplierMemberCounts(prev => ({
        ...prev,
        [selectedSupplierId]: (prev[selectedSupplierId] || 0) + 1
      }));
      
      // Reset the selection
      setSelectedSupplierId("");
      
      setSnackbar({
        open: true,
        message: "Sales person has been assigned successfully",
        severity: "success"
      });
      
    } catch (error) {
      console.error("Error assigning supplier:", error);
      setSnackbar({
        open: true,
        message: error.response?.data?.message || "Failed to assign sales person",
        severity: "error"
      });
    }
  };

  const handleRemoveSupplier = async () => {
    try {
      const supplierToRemove = selectedSupplierToRemove;
      console.log('Removing supplier:', supplierToRemove, 'for member:', memberId);
      
      if (!supplierToRemove) {
        console.log('No supplier selected for removal');
        return;
      }
      
      const response = await api.put(`/api/suppliers/unassign/${supplierToRemove}`, {
        memberId
      });
      
      console.log('Remove supplier response:', response.data);
      
      // Update the member count for this supplier
      if (supplierMemberCounts[supplierToRemove] > 0) {
        setSupplierMemberCounts(prev => ({
          ...prev,
          [supplierToRemove]: prev[supplierToRemove] - 1
        }));
      }
      
      // Remove the specific supplier from the list
      setAssignedSuppliers(prev => prev.filter(s => s._id !== supplierToRemove));
      setSelectedSupplierToRemove(null);
      setAlertOpen(false);
      
      setSnackbar({
        open: true,
        message: "Sales person has been unassigned successfully",
        severity: "success"
      });
    } catch (error) {
      console.error("Error removing supplier:", error);
      setSnackbar({
        open: true,
        message: "Failed to remove sales person",
        severity: "error"
      });
    }
  };

  const handleExportData = async () => {
    try {
      setExportLoading(true);
      
      // Create Excel workbook
      const wb = XLSX.utils.book_new();
      
      // Member info sheet
      const memberData = [
        ["Member Information"],
        ["Name", member.name],
        ["Business Name", member.businessName || "N/A"],
        ["Email", member.email],
        ["Phone", member.phone || "N/A"],
        ["Address", member.address || "N/A"],
        [""],
        ["Sales person Information"],
        ["Name", assignedSuppliers.length > 0 ? assignedSuppliers[0].name : "Not Assigned"],
        ["Email", assignedSuppliers.length > 0 ? assignedSuppliers[0].email : "N/A"],
      ];
      const memberSheet = XLSX.utils.aoa_to_sheet(memberData);
      XLSX.utils.book_append_sheet(wb, memberSheet, "Member Info");
      
      // Commitments sheet with detailed information
      const commitmentHeaders = [
        "Deal Name",
        "Category",
        "Size",
        "Quantity",
        "Price/Unit",
        "Total Price",
        "Status",
        "Date"
      ];
      
      const commitmentRows = [];
      commitmentRows.push(commitmentHeaders);
      
      commitments.forEach(commitment => {
        commitment.sizeCommitments.forEach(sizeCommit => {
          commitmentRows.push([
            commitment.dealName,
            commitment.category || "N/A",
            sizeCommit.size,
            sizeCommit.quantity,
            `$${sizeCommit.pricePerUnit.toFixed(2)}`,
            `$${sizeCommit.totalPrice.toFixed(2)}`,
            commitment.status,
            new Date(commitment.createdAt).toLocaleDateString()
          ]);
        });
      });
      
      const commitmentSheet = XLSX.utils.aoa_to_sheet(commitmentRows);
      XLSX.utils.book_append_sheet(wb, commitmentSheet, "Commitments");
      
      // Export excel file
      const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
      const fileName = `${member.businessName || member.name}_Data.xlsx`;
      
      saveAs(
        new Blob([excelBuffer], { type: "application/octet-stream" }),
        fileName
      );
      
      setSnackbar({
        open: true,
        message: "Member data has been exported successfully",
        severity: "success"
      });
    } catch (error) {
      console.error("Export error:", error);
      setSnackbar({
        open: true,
        message: "There was an error exporting the data",
        severity: "error"
      });
    } finally {
      setExportLoading(false);
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const getSupplierMemberCount = (supplierId) => {
    return supplierMemberCounts[supplierId] || 0;
  };

  if (loading) {
    return (
      <PageContainer>
        <Box sx={{ width: '100%', mb: 4 }}>
          <Stack direction="row" alignItems="center" spacing={2}>
            <Skeleton variant="circular" width={40} height={40} />
            <Skeleton variant="text" width={300} height={40} />
          </Stack>
        </Box>
        
        <Box sx={{ width: '100%', mb: 2 }}>
          <Skeleton variant="text" width={200} />
          <LinearProgress sx={{ my: 1 }} />
        </Box>
        
        <Grid container spacing={4}>
          <Grid item xs={12} md={6}>
            <Skeleton variant="rounded" height={300} sx={{ borderRadius: 4 }} />
          </Grid>
          <Grid item xs={12} md={6}>
            <Skeleton variant="rounded" height={300} sx={{ borderRadius: 4 }} />
          </Grid>
          <Grid item xs={12}>
            <Skeleton variant="rounded" height={400} sx={{ borderRadius: 4 }} />
          </Grid>
          <Grid item xs={12}>
            <Skeleton variant="rounded" height={300} sx={{ borderRadius: 4 }} />
          </Grid>
        </Grid>
      </PageContainer>
    );
  }

  return (
    <Container maxWidth='xl'>
      <AnimatedBox
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Header section with breadcrumbs */}
        <Box sx={{ mb: 4 }}>
          <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
            <IconButton
              onClick={() => navigate(-1)}
              aria-label="Go back"
              size="small"
              sx={{ 
                color: 'primary.contrastText',
                backgroundColor: alpha(theme.palette.primary.main, 0.1),
                '&:hover': {
                  backgroundColor: alpha(theme.palette.primary.main, 0.2),
                }
              }}
            >
              <ArrowBackIcon sx={{ color: 'primary.contrastText' }} />
            </IconButton>
          </Stack>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography
              variant="h4"
              component={motion.h1}
              sx={{ fontWeight: 700, color: 'text.primary', mb: 1 }}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              Manage Sales person for {member.businessName || member.name}
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
          <Typography
            variant="body1"
            color="text.secondary"
            sx={{ maxWidth: 800 }}
          >
            Assign sales person to manage member orders and view commitment details in one place.
          </Typography>
        </Box>

        {/* Member & Summary Cards */}
        <Grid container spacing={4} sx={{ mb: 5 }}>
          {/* Member Information Card */}
          <Grid item xs={12} md={6} component={motion.div} variants={itemVariants}>
            <StyledCard>
              <StyledCardHeader 
                title="Member Information" 
                />
              <CardContent>
                <Box sx={{ textAlign: 'center', display:'flex',gap:4 , alignItems:'center'}}>
                  <MemberAvatar>
                    {member.name.charAt(0).toUpperCase()}
                  </MemberAvatar>
                 <Box>
                 <Typography variant="h6" fontWeight="bold">
                    {member.name}
                  </Typography>
                  {member.businessName && (
                    <Chip
                      icon={<BusinessIcon fontSize="small" sx={{ color: 'primary.contrastText' }} />}
                      label={member.businessName}
                      size="small"
                      sx={{ mt: 1 }}
                    />
                  )}
                 </Box>
                </Box>
                
                <Divider sx={{ my: 2 }} />
                
                <Stack spacing={2}>
                  <InfoItem>
                    <InfoIcon>
                      <EmailIcon fontSize="small" sx={{ color: 'primary.contrastText' }} />
                    </InfoIcon>
                    <InfoLabel>Email:</InfoLabel>
                    <InfoValue>{member.email}</InfoValue>
                  </InfoItem>
                  
                  <InfoItem>
                    <InfoIcon>
                      <PhoneIcon fontSize="small" sx={{ color: 'primary.contrastText' }} />
                    </InfoIcon>
                    <InfoLabel>Phone:</InfoLabel>
                    <InfoValue>{member.phone || "Not provided"}</InfoValue>
                  </InfoItem>
                  
                  <InfoItem>
                    <InfoIcon>
                      <LocationIcon fontSize="small" sx={{ color: 'primary.contrastText' }} />
                    </InfoIcon>
                    <InfoLabel>Address:</InfoLabel>
                    <InfoValue>{member.address || "Not provided"}</InfoValue>
                  </InfoItem>
                </Stack>
              </CardContent>
            </StyledCard>
          </Grid>

          {/* Commitment Summary Card */}
          <Grid item xs={12} md={6} component={motion.div} variants={itemVariants}>
            <StyledCard>
              <StyledCardHeader 
                title="Commitment Summary"
                avatar={
                  <Avatar 
                    sx={{ 
                      bgcolor: 'secondary.main',
                      height: 40,
                      width: 40
                    }}
                  >
                    <AssignmentIcon sx={{ color: 'primary.contrastText' }} />
                  </Avatar>
                }
              />
              <CardContent>
                <Grid container spacing={3} sx={{ mb: 3 }}>
                  <Grid item xs={6}>
                    <Paper
                      elevation={0}
                      sx={{
                        p: 2,
                        textAlign: 'center',
                        borderRadius: 2,
                        bgcolor: alpha(theme.palette.primary.main, 0.1),
                        height: '100%'
                      }}
                    >
                      <InventoryIcon 
                        color="primary.contrastText" 
                        sx={{ fontSize: 36, mb: 1 }} 
                      />
                      <Typography variant="h5" fontWeight="bold">
                        {commitments.length}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Total Deals
                      </Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={6}>
                    <Paper
                      elevation={0}
                      sx={{
                        p: 2,
                        textAlign: 'center',
                        borderRadius: 2,
                        bgcolor: alpha(theme.palette.success.main, 0.1),
                        height: '100%'
                      }}
                    >
                      <AttachMoneyIcon 
                        color="primary.contrastText" 
                        sx={{ fontSize: 36, mb: 1 }} 
                      />
                      <Typography variant="h5" fontWeight="bold">
                        ${commitments.reduce((sum, c) => sum + c.totalPrice, 0).toFixed(2)}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Total Value
                      </Typography>
                    </Paper>
                  </Grid>
                </Grid>
                
                <Divider sx={{ my: 2 }} />
                
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Current Status:
                  </Typography>
                  <StatusChip
                    label={assignedSuppliers.length > 0 ? "Sales person Assigned" : "No Sales person"}
                    statuscolor={assignedSuppliers.length > 0 ? "success" : "warning"}
                    sx={{
                      color: 'primary.contrastText',
                      borderRadius: 2,
                    }}
                    icon={assignedSuppliers.length > 0 ? <CheckCircleIcon fontSize="small" sx={{ color: 'primary.contrastText' }} /> : <InfoIcon fontSize="small" sx={{ color: 'primary.contrastText' }} />}
                  />
                </Box>
              </CardContent>
            </StyledCard>
          </Grid>
        </Grid>

        {/* Supplier Assignment Card */}
        <Grid container sx={{ mb: 5 }}>
          <Grid item xs={12} component={motion.div} variants={itemVariants}>
            <StyledCard>
              <StyledCardHeader 
                title="Sales person Assignment" 
                subheader="Assign this member to a sales person who will handle their committed deals"
                avatar={
                  <Avatar 
                    sx={{ 
                      bgcolor: 'info.main',
                      height: 40,
                      width: 40
                    }}
                  >
                    <GroupIcon sx={{ color: 'primary.contrastText' }} />
                  </Avatar>
                }
              />
              <CardContent>
                {assignedSuppliers.length > 0 ? (
                  <AnimatedBox
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.4 }}
                  >
                    <Paper
                      elevation={0}
                      sx={{
                        p: 4,
                        mb: 4,
                        borderRadius: 3,
                        position: 'relative',
                        border: '1px solid',
                        borderColor: 'primary.contrastText',
                        overflow: 'hidden'
                      }}
                    >
                      <Typography variant="h6" color="primary.contrastText" gutterBottom fontWeight="600">
                        Assigned Sales Persons ({assignedSuppliers.length})
                      </Typography>
                      
                      {assignedSuppliers.map((supplier, index) => (
                        <Box
                          key={supplier._id}
                          sx={{
                            display: "flex",
                            flexDirection: { xs: "column", md: "row" },
                            alignItems: { xs: "stretch", md: "center" },
                            justifyContent: "space-between",
                            mt: index > 0 ? 4 : 0,
                            pb: index < assignedSuppliers.length - 1 ? 4 : 0,
                            borderBottom: index < assignedSuppliers.length - 1 ? `1px solid ${alpha(theme.palette.divider, 0.2)}` : 'none'
                          }}
                        >
                          <Stack spacing={2} sx={{ mb: { xs: 4, md: 0 } }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                              <Avatar 
                                sx={{ 
                                  bgcolor: 'primary.contrastText', 
                                  mr: 2,
                                  width: 48,
                                  height: 48
                                }}
                              >
                                {supplier.name.charAt(0).toUpperCase()}
                              </Avatar>
                              <Box>
                                <Typography variant="subtitle1" fontWeight="bold">
                                  {supplier.name}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                  {supplier.email}
                                </Typography>
                              </Box>
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <Tooltip title={`${getSupplierMemberCount(supplier._id)} members are assigned to this supplier`}>
                                <Chip
                                  icon={<GroupIcon fontSize="small" sx={{ color: 'primary.contrastText' }} />}
                                  label={`${getSupplierMemberCount(supplier._id)} members assigned`}
                                  color="primary.contrastText"
                                  size="small"
                                  sx={{ mr: 1 }}
                                />
                              </Tooltip>
                            </Box>
                          </Stack>
                          <Button
                            variant="outlined"
                            color="error"
                            startIcon={<DeleteIcon sx={{ color: 'primary.contrastText' }} />}
                            onClick={() => {
                              console.log('Setting selectedSupplierToRemove to:', supplier._id);
                              setSelectedSupplierToRemove(supplier._id);
                              setAlertOpen(true);
                            }}
                            sx={{ 
                              px: 3,
                              py: 1,
                              borderRadius: 2,
                              boxShadow: 'none',
                              borderWidth: 2,
                              '&:hover': { 
                                borderWidth: 2,
                                backgroundColor: alpha(theme.palette.error.main, 0.04)
                              }
                            }}
                          >
                            Remove
                          </Button>
                        </Box>
                      ))}
                    </Paper>

                    <Divider sx={{ my: 4 }}>
                      <Chip 
                        label="ADD ANOTHER SALES PERSON" 
                        size="small" 
                        sx={{ 
                          backgroundColor: alpha(theme.palette.primary.main, 0.1),
                          color: 'text.secondary'
                        }} 
                      />
                    </Divider>

                    <Paper
                      elevation={0}
                      sx={{
                        p: 4,
                        mb: 4,
                        borderRadius: 3,
                        border: '1px solid',
                        borderColor: alpha(theme.palette.primary.main, 0.3),
                        bgcolor: alpha(theme.palette.primary.main, 0.04)
                      }}
                    >
                      <Typography variant="h6" sx={{ mb: 3, color: 'primary.contrastText', fontWeight: 600 }}>
                        Assign Additional Sales Person
                      </Typography>
                      
                      <Grid container spacing={3}>
                        <Grid item xs={12} md={8}>
                          <FormControl fullWidth>
                            <InputLabel id="sales-person-select-label">Select a sales person</InputLabel>
                            <MuiSelect
                              labelId="sales-person-select-label"
                              label="Select a sales person"
                              value={selectedSupplierId}
                              onChange={handleSupplierSelect}
                              sx={{ 
                                borderRadius: 2,
                                '& .MuiOutlinedInput-notchedOutline': {
                                  borderColor: alpha(theme.palette.primary.main, 0.3),
                                }
                              }}
                            >
                              {suppliers.length === 0 ? (
                                <MenuItem value="" disabled>No Sales Person available. Create one first.</MenuItem>
                              ) : (
                                suppliers
                                  // Filter out already assigned suppliers
                                  .filter(supplier => !assignedSuppliers.some(assigned => assigned._id === supplier._id))
                                  .map((supplier) => (
                                    <MenuItem key={supplier._id} value={supplier._id}>
                                      <Stack direction="row" alignItems="center" spacing={1.5} width="100%">
                                        <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main' }}>
                                          {supplier.name.charAt(0).toUpperCase()}
                                        </Avatar>
                                        <Box sx={{ flexGrow: 1 }}>
                                          <Typography>{supplier.name}</Typography>
                                          <Typography variant="caption" color="text.secondary">
                                            {supplier.email}
                                          </Typography>
                                        </Box>
                                        <SupplierBadge 
                                          badgeContent={getSupplierMemberCount(supplier._id)} 
                                          color="primary"
                                        >
                                          <GroupIcon color="primary.contrastText" fontSize="small" />
                                        </SupplierBadge>
                                      </Stack>
                                    </MenuItem>
                                  ))
                              )}
                            </MuiSelect>
                          </FormControl>
                        </Grid>
                        <Grid item xs={12} md={4}>
                          <Button
                            variant="contained"
                            color="primary.main"
                            onClick={handleAssignSupplier}
                            disabled={!selectedSupplierId}
                            fullWidth
                            sx={{ 
                              height: '100%',
                              borderRadius: 2,
                              boxShadow: 2,
                              minHeight: '56px',
                              fontWeight: 'bold',
                              '&:hover': { boxShadow: 4 }
                            }}
                            endIcon={<ArrowForwardIcon sx={{ color: 'primary.contrastText' }} />}
                          >
                            Assign Sales Person
                          </Button>
                        </Grid>
                      </Grid>
                    </Paper>

                    <Divider sx={{ my: 4 }}>
                      <Chip 
                        label="OR" 
                        size="small" 
                        sx={{ 
                          backgroundColor: alpha(theme.palette.secondary.main, 0.1),
                          color: 'text.secondary'
                        }} 
                      />
                    </Divider>

                    <Paper
                      elevation={0}
                      sx={{
                        p: 4,
                        borderRadius: 3,
                        border: '1px solid',
                        borderColor: alpha(theme.palette.secondary.main, 0.3),
                        bgcolor: alpha(theme.palette.secondary.main, 0.04)
                      }}
                    >
                      <Typography variant="h6" sx={{ mb: 3, color: 'secondary.main', fontWeight: 600 }}>
                        Create New Sales Person
                      </Typography>
                      <Button
                        startIcon={<AddIcon sx={{ color: 'primary.contrastText' }} />}
                        variant="outlined"
                        color="primary.contrastText"
                        onClick={() => setModalOpen(true)}
                        sx={{ 
                          borderRadius: 2,
                          borderWidth: 2,
                          fontWeight: 'bold',
                          '&:hover': { 
                            borderWidth: 2,
                            backgroundColor: alpha(theme.palette.secondary.main, 0.04)
                          }
                        }}
                      >
                        Create New Sales Person
                      </Button>
                    </Paper>
                  </AnimatedBox>
                ) : (
                  <AnimatedBox
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.4 }}
                  >
                    <Alert 
                      severity="info" 
                      variant="outlined"
                      sx={{ 
                        mb: 4, 
                        borderRadius: 3,
                        padding: 2
                      }}
                    >
                      <AlertTitle>
                        <Typography fontWeight="bold">No Sales Person Assigned</Typography>
                      </AlertTitle>
                      <Typography>
                        This member is not assigned to any sales person. Assigning a sales person helps you organize which sales person will handle this member's orders.
                      </Typography>
                    </Alert>
                    <Paper
                      elevation={0}
                      sx={{
                        p: 4,
                        mb: 4,
                        borderRadius: 3,
                        border: '1px solid',
                        borderColor: alpha(theme.palette.primary.main, 0.3),
                        bgcolor: alpha(theme.palette.primary.main, 0.04)
                      }}
                    >
                      <Typography variant="h6" sx={{ mb: 3, color: 'primary.main', fontWeight: 600 }}>
                        Assign a Sales Person
                      </Typography>
                      
                      <Grid container spacing={3}>
                        <Grid item xs={12} md={8}>
                          <FormControl fullWidth>
                            <InputLabel id="sales-person-select-label">Select a sales person</InputLabel>
                            <MuiSelect
                              labelId="sales-person-select-label"
                              label="Select a sales person"
                              value={selectedSupplierId}
                              onChange={handleSupplierSelect}
                              sx={{ 
                                borderRadius: 2,
                                '& .MuiOutlinedInput-notchedOutline': {
                                  borderColor: alpha(theme.palette.primary.main, 0.3),
                                }
                              }}
                            >
                              {suppliers.length === 0 ? (
                                <MenuItem value="" disabled>No Sales Person available. Create one first.</MenuItem>
                              ) : (
                                suppliers.map((supplier) => (
                                  <MenuItem key={supplier._id} value={supplier._id}>
                                    <Stack direction="row" alignItems="center" spacing={1.5} width="100%">
                                      <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main' }}>
                                        {supplier.name.charAt(0).toUpperCase()}
                                      </Avatar>
                                      <Box sx={{ flexGrow: 1 }}>
                                        <Typography>{supplier.name}</Typography>
                                        <Typography variant="caption" color="text.secondary">
                                          {supplier.email}
                                        </Typography>
                                      </Box>
                                      <SupplierBadge 
                                        badgeContent={getSupplierMemberCount(supplier._id)} 
                                        color="primary.contrastText"
                                      >
                                        <GroupIcon color="primary.contrastText" fontSize="small" />
                                      </SupplierBadge>
                                    </Stack>
                                  </MenuItem>
                                ))
                              )}
                            </MuiSelect>
                          </FormControl>
                        </Grid>
                        <Grid item xs={12} md={4}>
                          <Button
                            variant="contained"
                            color="primary.contrastText"
                            onClick={handleAssignSupplier}
                            disabled={!selectedSupplierId}
                            fullWidth
                            sx={{ 
                              height: '100%',
                              borderRadius: 2,
                              boxShadow: 2,
                              minHeight: '56px',
                              fontWeight: 'bold',
                              '&:hover': { boxShadow: 4 }
                            }}
                            endIcon={<ArrowForwardIcon sx={{ color: 'primary.contrastText' }} />}
                          >
                            Assign Sales Person
                          </Button>
                        </Grid>
                      </Grid>
                    </Paper>

                    <Divider sx={{ my: 4 }}>
                      <Chip 
                        label="OR" 
                        size="small" 
                        sx={{ 
                          backgroundColor: alpha(theme.palette.secondary.main, 0.1),
                          color: 'text.secondary'
                        }} 
                      />
                    </Divider>

                    <Paper
                      elevation={0}
                      sx={{
                        p: 4,
                        borderRadius: 3,
                        border: '1px solid',
                        borderColor: alpha(theme.palette.secondary.main, 0.3),
                        bgcolor: alpha(theme.palette.secondary.main, 0.04)
                      }}
                    >
                      <Typography variant="h6" sx={{ mb: 3, color: 'secondary.main', fontWeight: 600 }}>
                        Create New Sales Person
                      </Typography>
                      <Button
                        startIcon={<AddIcon sx={{ color: 'primary.contrastText' }} />}
                        variant="outlined"
                        color="primary.contrastText"
                        onClick={() => setModalOpen(true)}
                        sx={{ 
                          borderRadius: 2,
                          borderWidth: 2,
                          fontWeight: 'bold',
                          '&:hover': { 
                            borderWidth: 2,
                            backgroundColor: alpha(theme.palette.secondary.main, 0.04)
                          }
                        }}
                      >
                        Create New Sales Person
                      </Button>
                    </Paper>
                  </AnimatedBox>
                )}
              </CardContent>
            </StyledCard>
          </Grid>
        </Grid>

        {/* Commitment Details Card */}
        <Grid container sx={{ mb: 5 }}>
          <Grid item xs={12} component={motion.div} variants={itemVariants}>
            <StyledCard>
              <StyledCardHeader 
                title="Commitment Details" 
                avatar={
                  <Avatar 
                    sx={{ 
                      bgcolor: 'warning.main',
                      height: 40,
                      width: 40
                    }}
                  >
                      <AssignmentIcon sx={{ color: 'primary.contrastText' }} />
                  </Avatar>
                }
              />
              <CardContent>
                <Box 
                  component={Paper} 
                  elevation={0}
                  sx={{ 
                    width: '100%',
                    overflow: 'auto',
                    borderRadius: 3,
                    border: '1px solid',
                    borderColor: alpha(theme.palette.primary.main, 0.1),
                  }}
                >
                  <Table>
                    <TableHead>
                      <TableRow sx={{ backgroundColor: alpha(theme.palette.primary.main, 0.04) }}>
                        <TableCell sx={{ fontWeight: 'bold' }}>Deal Name</TableCell>
                        <TableCell sx={{ fontWeight: 'bold' }}>Category</TableCell>
                        <TableCell sx={{ fontWeight: 'bold' }}>Sizes</TableCell>
                        <TableCell sx={{ fontWeight: 'bold' }}>Total Price</TableCell>
                        <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {commitments.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                            <Box sx={{ textAlign: 'center', p: 3 }}>
                              <InfoIcon color="disabled" sx={{ fontSize: 48, mb: 2, opacity: 0.6 }} />
                              <Typography variant="h6" color="text.secondary">
                                No commitments found
                              </Typography>
                              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                                This member has not made any commitments yet
                              </Typography>
                            </Box>
                          </TableCell>
                        </TableRow>
                      ) : (
                        commitments.map((commitment) => (
                          <TableRow 
                            key={commitment.id}
                            sx={{ 
                              '&:hover': { 
                                backgroundColor: alpha(theme.palette.primary.main, 0.04) 
                              },
                              cursor: 'pointer'
                            }}
                          >
                            <TableCell>
                              <Typography fontWeight="medium">{commitment.dealName}</Typography>
                            </TableCell>
                            <TableCell>{commitment.category || "N/A"}</TableCell>
                            <TableCell>
                              <Stack spacing={1}>
                                {commitment.sizeCommitments.map((sizeCommit, index) => (
                                  <Chip
                                    key={index}
                                    size="small"
                                    label={`${sizeCommit.size}: ${sizeCommit.quantity} units`}
                                    sx={{ 
                                      borderRadius: 1,
                                      bgcolor: alpha(theme.palette.primary.main, 0.08),
                                      color: 'text.primary',
                                      fontWeight: 500
                                    }}
                                  />
                                ))}
                              </Stack>
                            </TableCell>
                            <TableCell>
                              <Typography 
                                fontWeight="bold" 
                                color="success.main"
                              >
                                ${commitment.totalPrice.toFixed(2)}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <StatusChip
                                label={commitment.status}
                                statuscolor={
                                  commitment.status === "approved"
                                    ? "success"
                                    : commitment.status === "pending"
                                    ? "warning"
                                    : "error"
                                }
                                size="small"
                              />
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </Box>
              </CardContent>
            </StyledCard>
          </Grid>
        </Grid>

        {/* Create Supplier Modal */}
        <Dialog 
          open={modalOpen} 
          onClose={() => setModalOpen(false)}
          aria-labelledby="create-supplier-modal"
          PaperProps={{
            sx: {
              borderRadius: 3,
              boxShadow: theme.shadows[10]
            }
          }}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle sx={{ pb: 1 }}>
            <Stack direction="row" alignItems="center" spacing={1.5}>
              <Avatar sx={{ bgcolor: 'secondary.main' }}>
                <AddIcon />
              </Avatar>
              <Typography variant="h5" component="h2" fontWeight="bold">
                Create New Sales person
              </Typography>
            </Stack>
          </DialogTitle>
          
          <DialogContent sx={{ pt: 3 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Create a new sales person to assign to this member. After creating the sales person, you'll be able to assign them to this member.
              {assignedSuppliers.length > 0 && " Remember to remove the current sales person first before assigning a new one."}
            </Typography>
            
            <FormControl fullWidth sx={{ mb: 3 }}>
              <FormLabel sx={{ mb: 1, color: 'text.primary', fontWeight: 500 }}>
                Sales person Name
              </FormLabel>
              <TextField
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="Enter sales person name"
                fullWidth
                size="medium"
                required
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2
                  }
                }}
              />
            </FormControl>
            <FormControl fullWidth sx={{ mb: 4 }}>
              <FormLabel sx={{ mb: 1, color: 'text.primary', fontWeight: 500 }}>
                Sales person Email
              </FormLabel>
              <TextField
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="Enter sales person email"
                type="email"
                fullWidth
                size="medium"
                required
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2
                  }
                }}
              />
            </FormControl>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 3 }}>
            <Button 
              onClick={() => setModalOpen(false)}
              variant="outlined"
              sx={{ 
                borderRadius: 2,
                minWidth: 100,
                textTransform: 'none',
                fontWeight: 600
              }}
            >
              Cancel
            </Button>
            <Button 
              variant="contained" 
              color="secondary" 
              onClick={handleCreateSupplier}
              startIcon={<AddIcon />}
              disabled={!formData.name || !formData.email}
              sx={{ 
                borderRadius: 2,
                minWidth: 150,
                textTransform: 'none',
                fontWeight: 600
              }}
            >
              Create Sales person
            </Button>
          </DialogActions>
        </Dialog>

        {/* Confirmation Dialog for Removing Sales person */}
        <Dialog
          open={alertOpen}
          onClose={() => setAlertOpen(false)}
          aria-labelledby="alert-dialog-title"
          aria-describedby="alert-dialog-description"
          PaperProps={{
            sx: {
              borderRadius: 3,
              boxShadow: theme.shadows[10]
            }
          }}
        >
          <DialogTitle id="alert-dialog-title" sx={{ pb: 1 }}>
            <Stack direction="column" alignItems="center" spacing={1.5}>
              <Typography variant="h5" fontWeight="bold" color="primary.contrastText">
                Remove Sales Person Assignment
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                This will only remove this specific sales person
                <br />
                Other sales persons assigned to this member will not be affected
                <br />
                You can assign this sales person again later if needed
              </Typography>
            </Stack>
          </DialogTitle>
          <DialogContent>
            <DialogContentText id="alert-dialog-description" sx={{ mt: 2 }}>
              {selectedSupplierToRemove && (
                <>
                  Are you sure you want to remove <b>{assignedSuppliers.find(s => s._id === selectedSupplierToRemove)?.name}</b> as a sales person for <b>{member?.name}</b>?
                  <Alert severity="info" sx={{ mt: 3, mb: 1 }}>
                    <Typography variant="body2">
                      • This will only remove this specific sales person
                    </Typography>
                    <Typography variant="body2">
                      • Other sales persons assigned to this member will not be affected
                    </Typography>
                    <Typography variant="body2">
                      • You can assign this sales person again later if needed
                    </Typography>
                  </Alert>
                </>
              )}
            </DialogContentText>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 3 }}>
            <Button 
              onClick={() => setAlertOpen(false)}
              variant="outlined"
              sx={{ 
                borderRadius: 2,
                minWidth: 100,
                textTransform: 'none',
                fontWeight: 600
              }}
            >
              Cancel
            </Button>
            <Button 
              color="error" 
              onClick={() => {
                console.log('Confirm button clicked, selectedSupplierToRemove:', selectedSupplierToRemove);
                handleRemoveSupplier();
              }} 
              autoFocus
              variant="contained"
              startIcon={<DeleteIcon />}
              sx={{ 
                borderRadius: 2,
                minWidth: 150,
                textTransform: 'none',
                fontWeight: 600
              }}
            >
              Remove Sales Person
            </Button>
          </DialogActions>
        </Dialog>

        {/* Snackbar for notifications */}
        <Snackbar 
          open={snackbar.open} 
          autoHideDuration={5000} 
          onClose={handleCloseSnackbar}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert 
            onClose={handleCloseSnackbar} 
            severity={snackbar.severity} 
            sx={{ 
              width: '100%',
              borderRadius: 2,
              boxShadow: theme.shadows[3]
            }}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </AnimatedBox>
    </Container>
  );
};

export default AssignSuppliers;
