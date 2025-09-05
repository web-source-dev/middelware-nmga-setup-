import React, { useState, useEffect } from "react";
import api from "../../services/api";
import { useAuth } from "../../middleware/auth";
import { Link } from "react-router-dom";
import {
  Box,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Typography,
  Button,
  Stack,
  Grid,
  TextField,
  InputAdornment,
  IconButton,
  Menu,
  MenuItem,
  Paper,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  Select as MuiSelect,
  CircularProgress,
  Chip,
  Tooltip,
  Badge,
  Alert,
  Snackbar,
} from "@mui/material";
import {
  Search as SearchIcon,
  GetApp as DownloadIcon,
  OpenInNew as ExternalLinkIcon,
  People as PeopleIcon,
  Group as GroupIcon,
  CalendarMonth as CalendarIcon,
  FilterAltOff as FilterOffIcon,
} from "@mui/icons-material";
import { saveAs } from "file-saver";
import * as XLSX from "xlsx";

const AllCoopMembers = () => {
  const [members, setMembers] = useState([]);
  const [allMembers, setAllMembers] = useState([]); // All fetched members before filtering
  const [filteredMembers, setFilteredMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [exportLoading, setExportLoading] = useState(false);
  const [supplierFilter, setSupplierFilter] = useState("all");
  const [bulkExportSupplierId, setBulkExportSupplierId] = useState("");
  const [suppliers, setSuppliers] = useState([]);
  const [anchorEl, setAnchorEl] = useState(null);
  const [menuMember, setMenuMember] = useState(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "info"
  });
  
  // Month filter - current month by default
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();
  const [monthFilter, setMonthFilter] = useState(`${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`);
  
  // Generate available month options for the dropdown - last 12 months
  const getMonthOptions = () => {
    // Add "Current Month" and "All Time" options
    const options = [
      { value: `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`, label: 'Current Month' },
      { value: 'all', label: 'All Time' }
    ];
    
    // Generate the last 11 months (plus current = 12 total)
    let date = new Date(currentYear, currentMonth);
    for (let i = 1; i < 12; i++) {
      // Move to previous month
      date.setMonth(date.getMonth() - 1);
      
      const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
      ];
      
      const monthName = monthNames[date.getMonth()];
      const year = date.getFullYear();
      
      options.push({
        value: `${year}-${String(date.getMonth() + 1).padStart(2, '0')}`,
        label: `${monthName} ${year}`
      });
    }
    
    return options;
  };
  
  // Get user data from middleware
  const { currentUserId, isImpersonating } = useAuth();
  const distributorId = currentUserId;

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Determine if we need to send month filter to backend
        let url = `/api/suppliers/committed-members`;
        
        if (monthFilter && monthFilter !== 'all') {
          const [year, month] = monthFilter.split('-');
          url += `?month=${month}&year=${year}`;
        }
        
        // Fetch members who have committed to deals with month filter
        const membersResponse = await api.get(url);
        
        // Process and store members data, handling multiple suppliers
        const membersData = membersResponse.data.members.map(member => {
          // Use the suppliers array if available, or fall back to the single supplier
          const memberSuppliers = member.suppliers || (member.supplier ? [member.supplier] : []);
          return {
            ...member,
            suppliers: memberSuppliers,
            // Keep supplier property for backward compatibility
            supplier: memberSuppliers.length > 0 ? memberSuppliers[0] : null
          };
        });
        
        // Store all members for later filtering
        setAllMembers(membersData);
        setMembers(membersData);
        setFilteredMembers(membersData);

        // Fetch suppliers
        const suppliersResponse = await api.get(
          `/api/suppliers/by-distributor`
        );
        setSuppliers(suppliersResponse.data.suppliers);
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

    fetchData();
  }, [distributorId, monthFilter]);

  // Handle month filter change
  const handleMonthFilterChange = (e) => {
    const newMonthFilter = e.target.value;
    setMonthFilter(newMonthFilter);
    // The fetchData function will be called from useEffect when monthFilter changes
  };

  useEffect(() => {
    // Apply filters
    let result = members;

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (member) =>
          member.user.name.toLowerCase().includes(query) ||
          member.user.businessName?.toLowerCase().includes(query) ||
          member.user.email.toLowerCase().includes(query)
      );
    }

    // Supplier filter
    if (supplierFilter !== "all") {
      if (supplierFilter === "assigned") {
        result = result.filter((member) => member.suppliers && member.suppliers.length > 0);
      } else if (supplierFilter === "unassigned") {
        result = result.filter((member) => !member.suppliers || member.suppliers.length === 0);
      } else {
        // Filter by specific supplier ID
        result = result.filter(
          (member) =>
            member.suppliers && member.suppliers.some(supplier => supplier._id === supplierFilter)
        );
      }
    }

    setFilteredMembers(result);
  }, [searchQuery, members, supplierFilter]);

  // Get month filter options
  const monthOptions = getMonthOptions();

  const handleExportMemberData = async (memberId) => {
    try {
      setExportLoading(true);
      const response = await api.get(
        `/api/suppliers/export-member-data/${memberId}`
      );
      
      // Create Excel workbook
      const wb = XLSX.utils.book_new();
      
      // Member info sheet
      const memberData = [
        ["Member Information"],
        ["Name", response.data.data.member.name],
        ["Business Name", response.data.data.member.businessName || "N/A"],
        ["Email", response.data.data.member.email],
        ["Phone", response.data.data.member.phone || "N/A"],
        ["Address", response.data.data.member.address || "N/A"],
        [""],
        ["Supplier Information"],
        ["Name", response.data.data.supplier?.name || "Not Assigned"],
        ["Email", response.data.data.supplier?.email || "N/A"],
      ];
      const memberSheet = XLSX.utils.aoa_to_sheet(memberData);
      XLSX.utils.book_append_sheet(wb, memberSheet, "Member Info");
      
      // Order summary by product/size
      const orderSummary = [
        ["Order Summary by Product & Size"],
        ["Deal Name", "Category", "Size", "Quantity", "Price/Unit", "Total Value", "Status"],
      ];
      
      // Group by product and size for summary
      const productSizes = {};
      
      response.data.data.commitments.forEach(commitment => {
        commitment.sizeCommitments.forEach(sizeCommit => {
          const key = `${commitment.dealName}|${commitment.category || 'N/A'}|${sizeCommit.size}|${commitment.status}`;
          
          if (!productSizes[key]) {
            productSizes[key] = {
              dealName: commitment.dealName,
              category: commitment.category || 'N/A',
              size: sizeCommit.size,
              quantity: 0,
              pricePerUnit: sizeCommit.pricePerUnit,
              value: 0,
              status: commitment.status
            };
          }
          
          productSizes[key].quantity += sizeCommit.quantity;
          productSizes[key].value += sizeCommit.totalPrice;
        });
      });
      
      // Add order summary to sheet
      Object.values(productSizes).forEach(item => {
        orderSummary.push([
          item.dealName,
          item.category,
          item.size,
          item.quantity,
          `$${item.pricePerUnit.toFixed(2)}`,
          `$${item.value.toFixed(2)}`,
          item.status
        ]);
      });
      
      const orderSummarySheet = XLSX.utils.aoa_to_sheet(orderSummary);
      XLSX.utils.book_append_sheet(wb, orderSummarySheet, "Order Summary");
      
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
      
      response.data.data.commitments.forEach(commitment => {
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
      XLSX.utils.book_append_sheet(wb, commitmentSheet, "Detailed Commitments");
      
      // Approved orders ready for shipping
      const shippingDetails = [
        ["Shipping Details - Approved Orders Only"],
        ["Deal Name", "Category", "Size", "Quantity", "Price/Unit", "Total Price", "Date Approved"]
      ];
      
      // Filter only approved commitments for shipping
      response.data.data.commitments
        .filter(commitment => commitment.status === "approved")
        .forEach(commitment => {
          commitment.sizeCommitments.forEach(sizeCommit => {
            shippingDetails.push([
              commitment.dealName,
              commitment.category || "N/A",
              sizeCommit.size,
              sizeCommit.quantity,
              `$${sizeCommit.pricePerUnit.toFixed(2)}`,
              `$${sizeCommit.totalPrice.toFixed(2)}`,
              new Date(commitment.createdAt).toLocaleDateString()
            ]);
          });
        });
      
      const shippingSheet = XLSX.utils.aoa_to_sheet(shippingDetails);
      XLSX.utils.book_append_sheet(wb, shippingSheet, "Shipping Details");
      
      // Summary sheet
      const summaryData = [
        ["Summary Information"],
        ["Total Deals", response.data.data.summary.totalDeals],
        ["Total Spent", `$${response.data.data.summary.totalSpent.toFixed(2)}`],
        ["Total Approved Value", `$${response.data.data.commitments
          .filter(c => c.status === "approved")
          .reduce((sum, c) => sum + c.totalPrice, 0).toFixed(2)}`],
        ["Total Pending Value", `$${response.data.data.commitments
          .filter(c => c.status === "pending")
          .reduce((sum, c) => sum + c.totalPrice, 0).toFixed(2)}`],
        ["Total Items Ordered", response.data.data.commitments
          .reduce((sum, c) => sum + c.sizeCommitments.reduce((s, sc) => s + sc.quantity, 0), 0)],
      ];
      const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
      XLSX.utils.book_append_sheet(wb, summarySheet, "Summary");
      
      // Export excel file
      const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
      const memberFileName = `${response.data.data.member.businessName || response.data.data.member.name}_Order_Details_${new Date().toISOString().split('T')[0]}.xlsx`;
      
      saveAs(
        new Blob([excelBuffer], { type: "application/octet-stream" }),
        memberFileName
      );
      
      setSnackbar({
        open: true,
        message: "Member order data has been exported successfully",
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

  const handleExportSupplierData = async (supplierId) => {
    try {
      setExportLoading(true);
      const response = await api.get(
        `/api/suppliers/export-supplier-data/${supplierId}`
      );
      
      // Create Excel workbook
      const wb = XLSX.utils.book_new();
      
      // Supplier info sheet
      const supplierData = [
        ["Supplier Information"],
        ["Name", response.data.data.supplier.name],
        ["Email", response.data.data.supplier.email],
        [""],
        ["Summary"],
        ["Total Members", response.data.data.summary.totalMembers],
        ["Total Commitments", response.data.data.summary.totalCommitments],
        ["Total Value", `$${response.data.data.summary.totalValue.toFixed(2)}`],
      ];
      const supplierSheet = XLSX.utils.aoa_to_sheet(supplierData);
      XLSX.utils.book_append_sheet(wb, supplierSheet, "Supplier Info");
      
      // Create a product summary sheet by size/category
      const productSummary = [
        ["Product Summary By Size & Category"],
        ["Deal Name", "Category", "Size", "Total Quantity", "Total Value"],
      ];
      
      // Group by product, size, and category
      const productSizes = {};
      
      response.data.data.members.forEach(memberData => {
        memberData.commitments.forEach(commitment => {
          commitment.sizeCommitments.forEach(sizeCommit => {
            const key = `${commitment.dealName}|${commitment.category || 'N/A'}|${sizeCommit.size}`;
            
            if (!productSizes[key]) {
              productSizes[key] = {
                dealName: commitment.dealName,
                category: commitment.category || 'N/A',
                size: sizeCommit.size,
                quantity: 0,
                value: 0
              };
            }
            
            productSizes[key].quantity += sizeCommit.quantity;
            productSizes[key].value += sizeCommit.totalPrice;
          });
        });
      });
      
      // Add product summary to sheet
      Object.values(productSizes).forEach(item => {
        productSummary.push([
          item.dealName,
          item.category,
          item.size,
          item.quantity,
          `$${item.value.toFixed(2)}`
        ]);
      });
      
      const productSummarySheet = XLSX.utils.aoa_to_sheet(productSummary);
      XLSX.utils.book_append_sheet(wb, productSummarySheet, "Product Summary");
      
      // Create printable packing slips for each member with approved orders
      response.data.data.members.forEach(memberData => {
        // Only create packing slips for members who have approved commitments
        const approvedCommitments = memberData.commitments.filter(c => c.status === "approved");
        
        if (approvedCommitments.length > 0) {
          const packingSlip = [
            [`PACKING SLIP - ${response.data.data.supplier.name}`],
            [""],
            ["SHIP TO:"],
            [memberData.member.name],
            [memberData.member.businessName || ""],
            [memberData.member.address || "Address not provided"],
            [memberData.member.email],
            [memberData.member.phone || "No phone number"],
            [""],
            ["ORDER DETAILS:"],
            ["Deal Name", "Category", "Size", "Quantity", "Price/Unit", "Total"]
          ];
          
          let totalOrderValue = 0;
          let totalItems = 0;
          
          approvedCommitments.forEach(commitment => {
            commitment.sizeCommitments.forEach(sizeCommit => {
              packingSlip.push([
                commitment.dealName,
                commitment.category || "N/A",
                sizeCommit.size,
                sizeCommit.quantity,
                `$${sizeCommit.pricePerUnit.toFixed(2)}`,
                `$${sizeCommit.totalPrice.toFixed(2)}`
              ]);
              
              totalOrderValue += sizeCommit.totalPrice;
              totalItems += sizeCommit.quantity;
            });
          });
          
          // Add order totals
          packingSlip.push(
            [""],
            ["Order Summary:"],
            ["Total Items:", totalItems],
            ["Total Value:", `$${totalOrderValue.toFixed(2)}`],
            [""],
            ["SHIPPING NOTES:"],
            ["This order has been pre-paid through the co-op."],
            ["Please include this packing slip with the shipment."],
            ["Questions? Contact supplier at:", response.data.data.supplier.email]
          );
          
          const packingSlipSheet = XLSX.utils.aoa_to_sheet(packingSlip);
          
          // Set column widths for better printing
          const colWidths = [
            { wch: 30 }, // Deal Name
            { wch: 15 }, // Category
            { wch: 10 }, // Size
            { wch: 10 }, // Quantity
            { wch: 10 }, // Price/Unit
            { wch: 15 }, // Total
          ];
          
          packingSlipSheet['!cols'] = colWidths;
          
          // Create a name based on the business name if available, otherwise use member name
          const sheetName = `Slip-${memberData.member.businessName || memberData.member.name}`.slice(0, 30);
          XLSX.utils.book_append_sheet(wb, packingSlipSheet, sheetName);
        }
      });
      
      // Consolidated members data sheet with all commitments
      const consolidatedHeaders = [
        "Member Name",
        "Business Name",
        "Email",
        "Phone",
        "Address",
        "Deal Name",
        "Category",
        "Size",
        "Quantity",
        "Price/Unit",
        "Total Price",
        "Status",
        "Date"
      ];
      
      const consolidatedRows = [consolidatedHeaders];
      
      // Process all members and their commitments into a single sheet
      response.data.data.members.forEach(memberData => {
        memberData.commitments.forEach(commitment => {
          commitment.sizeCommitments.forEach(sizeCommit => {
            consolidatedRows.push([
              memberData.member.name,
              memberData.member.businessName || "N/A",
              memberData.member.email,
              memberData.member.phone || "N/A",
              memberData.member.address || "N/A",
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
      });
      
      const consolidatedSheet = XLSX.utils.aoa_to_sheet(consolidatedRows);
      XLSX.utils.book_append_sheet(wb, consolidatedSheet, "All Commitments");
      
      // Individual member sheets with detailed information
      response.data.data.members.forEach((memberData) => {
        const memberInfo = [
          ["Member Information"],
          ["Name", memberData.member.name],
          ["Business Name", memberData.member.businessName || "N/A"],
          ["Email", memberData.member.email],
          ["Phone", memberData.member.phone || "N/A"],
          ["Address", memberData.member.address || "N/A"],
          ["Total Deals", memberData.summary.totalDeals],
          ["Total Spent", `$${memberData.summary.totalSpent.toFixed(2)}`],
          [""],
          ["Commitments"],
          ["Deal Name", "Category", "Size", "Quantity", "Price/Unit", "Total Price", "Status", "Date"]
        ];
        
        memberData.commitments.forEach(commitment => {
          commitment.sizeCommitments.forEach(sizeCommit => {
            memberInfo.push([
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
        
        const memberSheet = XLSX.utils.aoa_to_sheet(memberInfo);
        XLSX.utils.book_append_sheet(wb, memberSheet, `${memberData.member.name}`);
      });
      
      // Export excel file
      const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
      const supplierFileName = `${response.data.data.supplier.name}_Fulfillment_Instructions_${new Date().toISOString().split('T')[0]}.xlsx`;
      
      saveAs(
        new Blob([excelBuffer], { type: "application/octet-stream" }),
        supplierFileName
      );
      
      setSnackbar({
        open: true,
        message: "Supplier fulfillment package with packing slips has been exported successfully",
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

  const handleExportAllData = async () => {
    try {
      setExportLoading(true);
      
      // Create Excel workbook
      const wb = XLSX.utils.book_new();
      
      // Get detailed commitment data for all members
      const memberDetailPromises = filteredMembers.map(member => 
        api.get(`/api/suppliers/export-member-data/${member.user._id}`)
      );
      
      const memberDetailsResponses = await Promise.all(memberDetailPromises);
      const allMemberDetails = memberDetailsResponses.map(response => response.data.data);
      
      // Summary sheet
      const summaryData = [
        ["Co-op Members Summary"],
        ["Total Members", filteredMembers.length],
        ["Total with Suppliers", filteredMembers.filter(m => m.supplier).length],
        ["Without Suppliers", filteredMembers.filter(m => !m.supplier).length],
        ["Total Value of All Commitments", `$${filteredMembers.reduce((sum, m) => sum + m.totalSpent, 0).toFixed(2)}`],
        ["Total Number of Deals", filteredMembers.reduce((sum, m) => sum + m.dealCount, 0)],
        [""],
        ["Members List"],
        ["Name", "Business Name", "Email", "Phone", "Total Spent", "Deal Count", "Supplier", "Supplier Email"]
      ];
      
      filteredMembers.forEach(member => {
        summaryData.push([
          member.user.name,
          member.user.businessName || "N/A",
          member.user.email,
          member.user.phone || "N/A",
          `$${member.totalSpent.toFixed(2)}`,
          member.dealCount,
          member.supplier ? member.supplier.name : "Not Assigned",
          member.supplier ? member.supplier.email : "N/A"
        ]);
      });
      
      const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
      XLSX.utils.book_append_sheet(wb, summarySheet, "Members Summary");
      
      // Comprehensive inventory tracking sheet
      const inventorySheet = [
        ["Inventory Management Tracking Sheet"],
        ["Deal Name", "Category", "Size", "Total Ordered", "Assignment Status", "Assigned Supplier", "Supplier Contact", "# of Members", "Status Breakdown", "Value"]
      ];
      
      // Get all unique deal+size combinations
      const uniqueProducts = {};
      
      allMemberDetails.forEach(memberDetail => {
        memberDetail.commitments.forEach(commitment => {
          commitment.sizeCommitments.forEach(sizeCommit => {
            const key = `${commitment.dealName}|${commitment.category || 'N/A'}|${sizeCommit.size}`;
            
            if (!uniqueProducts[key]) {
              uniqueProducts[key] = {
                dealName: commitment.dealName,
                category: commitment.category || 'N/A',
                size: sizeCommit.size,
                totalQuantity: 0,
                totalValue: 0,
                suppliers: new Map(), // supplier name -> count
                statuses: {
                  approved: 0,
                  pending: 0,
                  declined: 0,
                  cancelled: 0
                },
                memberCount: new Set()
              };
            }
            
            uniqueProducts[key].totalQuantity += sizeCommit.quantity;
            uniqueProducts[key].totalValue += sizeCommit.totalPrice;
            uniqueProducts[key].statuses[commitment.status] += sizeCommit.quantity;
            uniqueProducts[key].memberCount.add(memberDetail.member.id);
            
            // Track which supplier is assigned to this product
            if (memberDetail.supplier) {
              const supplierName = memberDetail.supplier.name;
              uniqueProducts[key].suppliers.set(
                supplierName, 
                (uniqueProducts[key].suppliers.get(supplierName) || 0) + sizeCommit.quantity
              );
            }
          });
        });
      });
      
      // Add data to inventory sheet
      Object.values(uniqueProducts).forEach(product => {
        // Find primary supplier (the one assigned the most of this product)
        let primarySupplier = { name: "Not Assigned", quantity: 0, email: "N/A" };
        let secondarySuppliers = [];
        
        if (product.suppliers.size > 0) {
          // Find the supplier with the most quantity
          product.suppliers.forEach((quantity, supplierName) => {
            if (quantity > primarySupplier.quantity) {
              if (primarySupplier.name !== "Not Assigned") {
                secondarySuppliers.push(`${primarySupplier.name} (${primarySupplier.quantity})`);
              }
              // Find the supplier email
              let supplierEmail = "N/A";
              suppliers.forEach(s => {
                if (s.name === supplierName) supplierEmail = s.email;
              });
              primarySupplier = { name: supplierName, quantity, email: supplierEmail };
            } else {
              secondarySuppliers.push(`${supplierName} (${quantity})`);
            }
          });
        }
        
        const assignmentStatus = product.suppliers.size > 0 
          ? product.suppliers.size > 1 ? "Multiple Suppliers" : "Single Supplier"
          : "Unassigned";
          
        const statusBreakdown = `Approved: ${product.statuses.approved}, Pending: ${product.statuses.pending}`;
        
        inventorySheet.push([
          product.dealName,
          product.category,
          product.size,
          product.totalQuantity,
          assignmentStatus,
          primarySupplier.name,
          primarySupplier.email,
          product.memberCount.size,
          statusBreakdown,
          `$${product.totalValue.toFixed(2)}`
        ]);
      });
      
      const inventorySheetObj = XLSX.utils.aoa_to_sheet(inventorySheet);
      
      // Set column widths
      const colWidths = [
        { wch: 30 }, // Deal name
        { wch: 15 }, // Category
        { wch: 10 }, // Size
        { wch: 12 }, // Total ordered
        { wch: 18 }, // Assignment status
        { wch: 20 }, // Supplier
        { wch: 25 }, // Supplier contact
        { wch: 12 }, // # of members
        { wch: 25 }, // Status breakdown
        { wch: 12 }, // Value
      ];
      
      inventorySheetObj['!cols'] = colWidths;
      XLSX.utils.book_append_sheet(wb, inventorySheetObj, "Inventory Tracking");
      
      // Supplier summary sheet
      const supplierSummary = [
        ["Supplier Summary"],
        ["Name", "Email", "Members Assigned", "Total Commitment Value", "Number of Products"]
      ];
      
      // Create a map to track supplier stats
      const supplierStats = {};
      
      filteredMembers.forEach(member => {
        if (member.supplier) {
          const supplierId = member.supplier._id;
          if (!supplierStats[supplierId]) {
            supplierStats[supplierId] = {
              name: member.supplier.name,
              email: member.supplier.email,
              memberCount: 0,
              totalValue: 0,
              productCount: 0
            };
          }
          supplierStats[supplierId].memberCount += 1;
          supplierStats[supplierId].totalValue += member.totalSpent;
          supplierStats[supplierId].productCount += member.dealCount;
        }
      });
      
      // Add supplier stats to the sheet
      Object.values(supplierStats).forEach(stats => {
        supplierSummary.push([
          stats.name,
          stats.email,
          stats.memberCount,
          `$${stats.totalValue.toFixed(2)}`,
          stats.productCount
        ]);
      });
      
      const supplierSummarySheet = XLSX.utils.aoa_to_sheet(supplierSummary);
      XLSX.utils.book_append_sheet(wb, supplierSummarySheet, "Supplier Summary");
      
      // Create detailed product summary by deal and size
      const productDetailSummary = [
        ["Product Summary By Deal & Size"],
        ["Deal Name", "Category", "Size", "Total Orders", "Total Quantity", "Avg. Price/Unit", "Total Value", "Members Ordered"]
      ];
      
      // Group products by deal name, category, and size
      const productDetailStats = {};
      
      allMemberDetails.forEach(memberDetail => {
        memberDetail.commitments.forEach(commitment => {
          commitment.sizeCommitments.forEach(sizeCommit => {
            const key = `${commitment.dealName}|${commitment.category || 'N/A'}|${sizeCommit.size}`;
            
            if (!productDetailStats[key]) {
              productDetailStats[key] = {
                dealName: commitment.dealName,
                category: commitment.category || 'N/A',
                size: sizeCommit.size,
                orderCount: 0,
                totalQuantity: 0,
                priceSum: 0,
                totalValue: 0,
                members: new Set()
              };
            }
            
            productDetailStats[key].orderCount += 1;
            productDetailStats[key].totalQuantity += sizeCommit.quantity;
            productDetailStats[key].priceSum += sizeCommit.pricePerUnit;
            productDetailStats[key].totalValue += sizeCommit.totalPrice;
            productDetailStats[key].members.add(memberDetail.member.name);
          });
        });
      });
      
      // Add product stats to the sheet
      Object.values(productDetailStats).forEach(stats => {
        productDetailSummary.push([
          stats.dealName,
          stats.category,
          stats.size,
          stats.orderCount,
          stats.totalQuantity,
          `$${(stats.priceSum / stats.orderCount).toFixed(2)}`,
          `$${stats.totalValue.toFixed(2)}`,
          Array.from(stats.members).join(", ")
        ]);
      });
      
      const productDetailSheet = XLSX.utils.aoa_to_sheet(productDetailSummary);
      XLSX.utils.book_append_sheet(wb, productDetailSheet, "Product Summary");
      
      // All orders consolidated view
      const allOrders = [
        ["All Orders Consolidated"],
        ["Member Name", "Business Name", "Supplier", "Deal Name", "Category", "Size", "Quantity", "Price/Unit", "Total Price", "Status", "Date"]
      ];
      
      allMemberDetails.forEach(memberDetail => {
        const member = memberDetail.member;
        const supplier = memberDetail.supplier ? memberDetail.supplier.name : "Not Assigned";
        
        memberDetail.commitments.forEach(commitment => {
          commitment.sizeCommitments.forEach(sizeCommit => {
            allOrders.push([
              member.name,
              member.businessName || "N/A",
              supplier,
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
      });
      
      const allOrdersSheet = XLSX.utils.aoa_to_sheet(allOrders);
      XLSX.utils.book_append_sheet(wb, allOrdersSheet, "All Orders");
      
      // Export excel file
      const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
      const summaryFileName = `Co-op_Complete_Order_Summary_${new Date().toISOString().split('T')[0]}.xlsx`;
      
      saveAs(
        new Blob([excelBuffer], { type: "application/octet-stream" }),
        summaryFileName
      );
      
      setSnackbar({
        open: true,
        message: "Complete order summary has been exported successfully",
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

  const handleBulkSupplierExport = () => {
    if (!bulkExportSupplierId) {
      setSnackbar({
        open: true,
        message: "Please select a supplier to export data",
        severity: "warning"
      });
      return;
    }
    
    handleExportSupplierData(bulkExportSupplierId);
  };

  const handleMenuOpen = (event, member) => {
    setAnchorEl(event.currentTarget);
    setMenuMember(member);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setMenuMember(null);
  };

  const handleCloseSnackbar = () => {
    setSnackbar({...snackbar, open: false});
  };

  // Function to reset all filters to default values
  const handleResetFilters = () => {
    setSearchQuery(""); // Clear search
    setSupplierFilter("all"); // Reset supplier filter
    setMonthFilter(`${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`); // Set to current month
    
    setSnackbar({
      open: true,
      message: "All filters have been reset",
      severity: "success"
    });
  };

  // Count members per supplier for the bulk export dropdown
  const getMembersCountBySupplierId = (supplierId) => {
    return members.filter(m => m.suppliers && m.suppliers.some(supplier => supplier._id === supplierId)).length;
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>
        <CircularProgress size={60} />
      </Box>
    );
  }

  // Check if any supplier has multiple members assigned
  const hasMultipleMembersPerSupplier = suppliers.some(supplier => 
    getMembersCountBySupplierId(supplier._id) > 1
  );

  return (
    <Box sx={{ py: 5, px: 2 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={5}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography variant="h4">Suppliers</Typography>
          {isImpersonating && (
            <Chip 
              label="Admin Mode" 
              color="warning" 
              variant="outlined"
              sx={{ fontWeight: 'bold' }}
            />
          )}
        </Box>
        <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
          <FormControl sx={{ minWidth: { xs: "100%", md: 300 } }}>
            <InputLabel id="bulk-supplier-export-label">Export All Members for Supplier</InputLabel>
            <MuiSelect
              labelId="bulk-supplier-export-label"
              value={bulkExportSupplierId}
              onChange={(e) => setBulkExportSupplierId(e.target.value)}
              label="Export All Members for Supplier"
              fullWidth
            >
              {suppliers.map((supplier) => {
                const memberCount = getMembersCountBySupplierId(supplier._id);
                return (
                  <MenuItem key={supplier._id} value={supplier._id} disabled={memberCount === 0}>
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <Typography>{supplier.name}</Typography>
                      <Badge 
                        badgeContent={memberCount} 
                        color={memberCount > 0 ? "primary.contrastText" : "error"}
                        sx={{ mr: 1 }}
                      >
                        <GroupIcon fontSize="small" color="primary.contrastText" />
                      </Badge>
                    </Stack>
                  </MenuItem>
                );
              })}
            </MuiSelect>
          </FormControl>
          <Stack direction="row" spacing={2}>
            <Button
              startIcon={<PeopleIcon sx={{ color: 'primary.contrastText' }} />}
              variant="contained"
              color="primary.contrastText"
              sx={{
                color: 'primary.contrastText',
                backgroundColor: 'primary.main',
              }}
              onClick={handleBulkSupplierExport}
              disabled={exportLoading || !bulkExportSupplierId}
            >
              Export Supplier Data
            </Button>
            <Button
              startIcon={<DownloadIcon sx={{ color: 'primary.contrastText' }} />}
              variant="contained"
              color="primary"
              onClick={handleExportAllData}
              disabled={exportLoading}
            >
              Export Summary
            </Button>
          </Stack>
        </Stack>
      </Stack>

      {monthFilter !== 'all' && (
        <Alert severity="info" sx={{ mb: 3 }}>
          <Typography fontWeight="bold">
            Showing data for {monthOptions.find(option => option.value === monthFilter)?.label || 'selected month'}:
          </Typography>
          <Typography>
            {filteredMembers.length} members with commitments during this period.
            Total value: ${filteredMembers.reduce((sum, member) => sum + member.totalSpent, 0).toFixed(2)}
          </Typography>
        </Alert>
      )}

      <Grid container spacing={4} mb={5}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>Total Members</Typography>
              <Typography variant="h4">{filteredMembers.length}</Typography>
              <Typography variant="body2" color="textSecondary">
                With commitments {monthFilter !== 'all' ? 'in selected month' : 'to your deals'}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>Members with Sales persons</Typography>
              <Typography variant="h4">
                {filteredMembers.filter((member) => member.suppliers && member.suppliers.length > 0).length}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                {filteredMembers.length > 0 
                  ? ((filteredMembers.filter((member) => member.suppliers && member.suppliers.length > 0).length / filteredMembers.length) * 100).toFixed(1) 
                  : 0}% assigned
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>Total Commitments Value</Typography>
              <Typography variant="h4">
                ${filteredMembers.reduce((sum, member) => sum + member.totalSpent, 0).toFixed(2)}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Across {filteredMembers.reduce((sum, member) => sum + member.dealCount, 0)} deals
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Stack direction={{ xs: "column", md: "row" }} spacing={4} mb={5}>
        <TextField
          fullWidth
          placeholder="Search members..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton>
                  <SearchIcon sx={{ color: 'primary.contrastText' }} />
                </IconButton>
              </InputAdornment>
            ),
          }}
        />

        <FormControl sx={{ minWidth: { xs: "100%", md: 300 } }}>
          <InputLabel id="supplier-filter-label">Filter by Sales person</InputLabel>
          <MuiSelect
            labelId="supplier-filter-label"
            value={supplierFilter}
            onChange={(e) => setSupplierFilter(e.target.value)}
            label="Filter by Sales person"
          >
            <MenuItem value="all">All Members</MenuItem>
            <MenuItem value="assigned">With Supplier</MenuItem>
            <MenuItem value="unassigned">Without Supplier</MenuItem>
            {suppliers.map((supplier) => {
              const memberCount = getMembersCountBySupplierId(supplier._id);
              return (
                <MenuItem key={supplier._id} value={supplier._id} disabled={memberCount === 0}>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <Typography>{supplier.name}</Typography>
                    <Badge 
                      badgeContent={memberCount} 
                      color={memberCount > 0 ? "primary" : "error"}
                      sx={{ ml: 1 }}
                    >
                      <GroupIcon fontSize="small" />
                    </Badge>
                  </Stack>
                </MenuItem>
              );
            })}
          </MuiSelect>
        </FormControl>
        
        {/* Month filter */}
        <FormControl sx={{ minWidth: { xs: "100%", md: 250 } }}>
          <InputLabel id="month-filter-label">Filter by month</InputLabel>
          <MuiSelect
            labelId="month-filter-label"
            value={monthFilter}
            onChange={handleMonthFilterChange}
            label="Filter by month"
            startAdornment={
              loading ? (
                <CircularProgress size={20} color="inherit" sx={{ mr: 1 }} />
              ) : (
                <CalendarIcon color="primary.contrastText" sx={{ mr: 1 }} />
              )
            }
            disabled={loading}
            MenuProps={{
              PaperProps: {
                style: {
                  maxHeight: 224, // Shows 4 items (56px per item)
                  overflow: 'auto'
                }
              }
            }}
          >
            {monthOptions.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </MuiSelect>
        </FormControl>
      </Stack>

      <Paper sx={{ width: '100%', overflow: 'hidden' }}>
        {filteredMembers.length === 0 ? (
          <Box p={5} textAlign="center" sx={{ 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center',
            justifyContent: 'center',
            height: '300px'
          }}>
            <FilterOffIcon sx={{ fontSize: 60, color: 'primary.contrastText', mb: 2, opacity: 0.7 }} />
            <Typography variant="h5" color="textSecondary" gutterBottom fontWeight="medium">
              No members found
            </Typography>
            <Typography variant="body1" color="textSecondary" mb={4} sx={{ maxWidth: 500 }}>
              {monthFilter !== 'all' 
                ? 'No members made commitments during this period. Try selecting a different month or adjust your filter criteria.' 
                : 'No members match your current filter criteria. Try adjusting your search or supplier filter.'}
            </Typography>
            <Button 
              variant="contained"
              color="primary.contrastText"
              onClick={handleResetFilters}
              startIcon={<FilterOffIcon sx={{ color: 'primary.contrastText' }} />}
              size="large"
              sx={{ 
                px: 3, 
                py: 1,
                borderRadius: 2,
                backgroundColor: 'primary.main',
              }}
            >
              Reset All Filters
            </Button>
          </Box>
        ) : (
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Member</TableCell>
                <TableCell>Business</TableCell>
                <TableCell>Contact</TableCell>
                <TableCell>Total Spent</TableCell>
                <TableCell>Deals</TableCell>
                <TableCell>Supplier</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredMembers.map((member) => (
                <TableRow key={member.user._id}>
                  <TableCell>
                    <Typography fontWeight="bold">{member.user.name}</Typography>
                  </TableCell>
                  <TableCell>{member.user.businessName || "N/A"}</TableCell>
                  <TableCell>
                    <Typography>{member.user.email}</Typography>
                    <Typography variant="body2">{member.user.phone || "No phone"}</Typography>
                  </TableCell>
                  <TableCell>${member.totalSpent.toFixed(2)}</TableCell>
                  <TableCell>{member.dealCount}</TableCell>
                  <TableCell>
                    {member.suppliers && member.suppliers.length > 0 ? (
                      <Tooltip title={`${member.suppliers.length} sales persons assigned to this member`}>
                        <Stack direction="column" spacing={1}>
                          {member.suppliers.map(supplier => (
                            <Chip 
                              key={supplier._id}
                              label={supplier.name} 
                              color="success" 
                              size="small"
                              icon={<GroupIcon fontSize="small" />}
                              sx={{ mb: 0.5 }}
                            />
                          ))}
                        </Stack>
                      </Tooltip>
                    ) : (
                      <Chip 
                        label="Not Assigned" 
                        color="error" 
                        size="small" 
                      />
                    )}
                  </TableCell>
                  <TableCell>
                    <Stack direction="row" spacing={1}>
                      <Button
                        component={Link}
                        to={`/dashboard/distributor/assign-supplier/${member.user._id}`}
                        size="small"
                        variant="contained"
                        color="primary"
                        startIcon={<ExternalLinkIcon sx={{ color: 'primary.contrastText' }} />}
                      >
                        {member.suppliers && member.suppliers.length > 0 ? "Manage Suppliers" : "Assign Suppliers"}
                      </Button>
                      <Button
                        size="small"
                        variant="outlined"
                        color="primary.contrastText"
                        startIcon={<DownloadIcon sx={{ color: 'primary.contrastText' }} />}
                        onClick={(e) => handleMenuOpen(e, member)}
                      >
                        Export
                      </Button>
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Paper>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem 
          onClick={() => {
            handleExportMemberData(menuMember?.user._id);
            handleMenuClose();
          }}
          disabled={exportLoading}
        >
          Member Data
        </MenuItem>
        {menuMember?.suppliers && menuMember.suppliers.length > 0 && menuMember.suppliers.map(supplier => (
          <MenuItem
            key={supplier._id}
            onClick={() => {
              handleExportSupplierData(supplier._id);
              handleMenuClose();
            }}
            disabled={exportLoading}
          >
            All Members for {supplier.name}
          </MenuItem>
        ))}
      </Menu>

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
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default AllCoopMembers;
