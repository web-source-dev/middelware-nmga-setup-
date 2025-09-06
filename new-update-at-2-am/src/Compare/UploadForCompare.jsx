import React, { useState } from 'react';
import api from '../services/api';
import { useAuth } from '../middleware/auth';
import { 
  Alert, Box, Button, Card, CardContent, CardHeader, 
  LinearProgress, Typography, TextField, CircularProgress,
  Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions
} from '@mui/material';
import { 
  Upload as UploadIcon, 
  Download as DownloadIcon, 
  Description as FileIcon,
  Error as ErrorIcon,
  Info as InfoIcon 
} from '@mui/icons-material';

const UploadForCompare = ({ dealId, dealName, onUploadComplete }) => {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [summary, setSummary] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showValidationDialog, setShowValidationDialog] = useState(false);
  const [validationDialogMessage, setValidationDialogMessage] = useState('');
  const [showHelpDialog, setShowHelpDialog] = useState(false);

  // Get user info from middleware
  const { 
    isCollaborator, 
    isAdmin, 
    isCollaboratorManager, 
    isSupplierManager 
  } = useAuth();

  // Check if user can perform actions (download template, upload file)
  const canPerformActions = () => {
    // Main account owner (not a collaborator)
    if (!isCollaborator) return true;
    
    // Admin (with or without impersonating)
    if (isAdmin) return true;
    
    // Collaborator manager
    if (isCollaboratorManager) return true;
    
    // Supplier manager
    if (isSupplierManager) return true;
    
    // All other collaborators cannot perform actions
    return false;
  };
  
  const validateCSVFile = (selectedFile) => {
    // Check if file is selected
    if (!selectedFile) {
      return { valid: false, message: 'Please select a file to upload.' };
    }
    
    // Check file size
    if (selectedFile.size > 10 * 1024 * 1024) { // 10 MB limit
      return { valid: false, message: 'File size exceeds 10MB limit.' };
    }
    
    // Check file type
    if (selectedFile.type !== 'text/csv' && !selectedFile.name.endsWith('.csv')) {
      return { valid: false, message: 'Please select a valid CSV file.' };
    }
    
    return { valid: true };
  };
  
  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    
    const validation = validateCSVFile(selectedFile);
    
    if (!validation.valid) {
      setValidationDialogMessage(validation.message);
      setShowValidationDialog(true);
      setFile(null);
      return;
    }
    
    setFile(selectedFile);
    setError(null);
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!file) {
      setValidationDialogMessage('Please select a file to upload.');
      setShowValidationDialog(true);
      return;
    }
    
    try {
      setUploading(true);
      setUploadProgress(0);
      setError(null);
      
      const formData = new FormData();
      formData.append('comparisonFile', file);
      
      const response = await api.post(
        `/api/compare/upload/${dealId}`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data'
          },
          onUploadProgress: (progressEvent) => {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setUploadProgress(percentCompleted);
          },
          timeout: 30000 // 30 second timeout
        }
      );
      
      setSuccess(true);
      setSummary(response.data.summary);
      
      // Call the parent component callback
      setTimeout(() => {
        if (onUploadComplete) {
          onUploadComplete(response.data);
        }
      }, 2000);
      
    } catch (err) {
      console.error('Error uploading comparison file:', err);
      let errorMessage = 'Failed to upload file. Please check the file format and try again.';
      
      if (err.response) {
        // The request was made and the server responded with an error
        errorMessage = err.response.data?.message || errorMessage;
        
        // Handle specific error cases
        if (err.response.status === 413) {
          errorMessage = 'File size is too large. Please upload a smaller file.';
        } else if (err.response.status === 400) {
          errorMessage = err.response.data?.message || 'Invalid file format or data. Please check your CSV file.';
        } else if (err.response.status === 403) {
          errorMessage = 'You are not authorized to upload for this deal.';
        } else if (err.response.status === 404) {
          errorMessage = 'Deal not found. Please refresh and try again.';
        }
      } else if (err.request) {
        // The request was made but no response was received
        errorMessage = 'No response from server. Please check your connection and try again.';
      } else if (err.code === 'ECONNABORTED') {
        errorMessage = 'Request timed out. The file may be too large or the server is busy.';
      }
      
      setError(errorMessage);
    } finally {
      setUploading(false);
    }
  };
  
  const handleDownloadTemplate = async () => {
    try {
      const response = await api.get(`/api/compare/template/${dealId}`, { 
        responseType: 'blob' 
      });
      
      // Create a blob URL and trigger download
      const blob = new Blob([response.data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `comparison-template-${dealId}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading template:', error);
      setError('Failed to download template. Please try again.');
    }
  };
  
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };
  
  const handleCloseValidationDialog = () => {
    setShowValidationDialog(false);
  };
  
  const handleOpenHelpDialog = () => {
    setShowHelpDialog(true);
  };
  
  const handleCloseHelpDialog = () => {
    setShowHelpDialog(false);
  };
  
  return (
    <Box className="upload-container" sx={{ p: 2 }}>
      <Alert severity="info" sx={{ mb: 2 }}>
        <Typography variant="h6">Uploading comparison data for: {dealName}</Typography>
        <Typography>
          Please upload a CSV file with the actual quantities and prices delivered to members.
          The CSV should match the template format.
        </Typography>
      </Alert>
      
      <Card sx={{ mb: 4 }}>
        <CardHeader 
          title="Instructions" 
          action={
            <Button
              variant="text"
              onClick={handleOpenHelpDialog}
              color="primary.contrastText"
              startIcon={<InfoIcon sx={{ color: 'primary.contrastText' }} />}
              size="small"
            >
              Help
            </Button>
          }
        />
        <CardContent>
          <Box component="ol" sx={{ pl: 2 }}>
            <li>Download the template CSV file for this deal</li>
            <li>Fill in the <strong>actualQuantity</strong> and <strong>actualPrice</strong> columns</li>
            <li>Upload the completed CSV file</li>
          </Box>
          <Button
            variant="outlined"
            onClick={handleDownloadTemplate}
            disabled={!canPerformActions()}
            sx={{ mt: 2 }}
            color="primary.contrastText"
            startIcon={<DownloadIcon sx={{ color: 'primary.contrastText' }} />}
          >
            Download Template
          </Button>
        </CardContent>
      </Card>
      
      <Box component="form" onSubmit={handleSubmit}>
        <Box sx={{ mb: 4 }}>
          <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1 }}>
            Select CSV File
          </Typography>
          <TextField
            type="file"
            fullWidth
            onChange={handleFileChange}
            disabled={uploading || !canPerformActions()}
            InputProps={{ 
              inputProps: { accept: '.csv' }
            }}
          />
          {file && (
            <Alert severity="success" sx={{ mt: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <FileIcon sx={{ mr: 1, color: 'primary.contrastText' }} /> 
                {file.name} ({Math.round(file.size / 1024)} KB)
              </Box>
            </Alert>
          )}
        </Box>
        
        {error && (
          <Alert 
            severity="error" 
            sx={{ mb: 2 }}
            action={
              <Button 
                color="inherit" 
                size="small"
                onClick={() => setError(null)}
              >
                DISMISS
              </Button>
            }
          >
            <Typography variant="body1" fontWeight="medium">{error}</Typography>
          </Alert>
        )}
        
        {uploading && (
          <Box sx={{ mb: 3 }}>
            <LinearProgress 
              variant="determinate" 
              value={uploadProgress} 
            />
            <Typography align="center" variant="caption">
              {uploadProgress}%
            </Typography>
          </Box>
        )}
        
        {success && summary && (
          <Alert severity="success" sx={{ mb: 2 }}>
            <Typography variant="h6">Upload Successful!</Typography>
            <Typography>Your comparison data has been processed.</Typography>
            <Box sx={{ mt: 1 }}>
              <Typography fontWeight="bold">Summary:</Typography>
              <Box component="ul" sx={{ mt: 1 }}>
                <li>Total Committed Quantity: {summary.totalCommittedQuantity}</li>
                <li>Total Actual Quantity: {summary.totalActualQuantity}</li>
                <li>Quantity Difference: {summary.quantityDifferenceTotal}</li>
                <li>Price Difference: {formatCurrency(summary.priceDifferenceTotal)}</li>
              </Box>
            </Box>
          </Alert>
        )}
        
        <Box sx={{ mt: 3 }}>
          <Button
            variant="contained"
            type="submit"
            disabled={uploading || !file || success || !canPerformActions()}
            fullWidth
            startIcon={uploading ? null : <UploadIcon sx={{ color: 'primary.contrastText' }} />}
          >
            {uploading ? (
              <>
                <Box component="span" sx={{ display: 'inline-block', mr: 1 }}>
                  <CircularProgress size={20} />
                </Box>
                Uploading...
              </>
            ) : (
              'Upload and Process'
            )}
          </Button>
        </Box>
      </Box>
      
      {/* Validation Error Dialog */}
      <Dialog
        open={showValidationDialog}
        onClose={handleCloseValidationDialog}
        aria-labelledby="validation-dialog-title"
      >
        <DialogTitle id="validation-dialog-title" sx={{ display: 'flex', alignItems: 'center' }}>
          <ErrorIcon color="primary.contrastText" sx={{ mr: 1 }} />
          Validation Error
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            {validationDialogMessage}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseValidationDialog} color="primary" autoFocus>
            OK
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Help Dialog */}
      <Dialog
        open={showHelpDialog}
        onClose={handleCloseHelpDialog}
        aria-labelledby="help-dialog-title"
        maxWidth="md"
      >
        <DialogTitle id="help-dialog-title" sx={{ display: 'flex', alignItems: 'center' }}>
          <InfoIcon color="info" sx={{ mr: 1 }} />
          CSV Upload Help
        </DialogTitle>
        <DialogContent>
          <DialogContentText component="div">
            <Typography variant="h6" gutterBottom>CSV Format Requirements:</Typography>
            <Box component="ul" sx={{ pl: 2 }}>
              <li>The CSV must include these columns: <code>memberId, memberName, commitmentId, size, committedQuantity, actualQuantity, committedPrice, actualPrice</code></li>
              <li>All IDs must be valid MongoDB IDs (24 character hexadecimal)</li>
              <li>Quantities and prices must be numeric values</li>
              <li>Maximum file size: 10MB</li>
            </Box>
            
            <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>Common Issues:</Typography>
            <Box component="ul" sx={{ pl: 2 }}>
              <li>Excel may change the format of your CSV when saving. Make sure IDs remain as text fields.</li>
              <li>Ensure your CSV uses commas as separators, not semicolons or tabs.</li>
              <li>If you open the CSV in Excel, make sure to save it as CSV UTF-8 (Comma delimited).</li>
              <li>Make sure there are no blank lines at the end of the file.</li>
            </Box>
            
            <Typography variant="body1" gutterBottom sx={{ mt: 2 }}>
              For the best results, download the template for this deal, modify only the <strong>actualQuantity</strong> and <strong>actualPrice</strong> columns, and upload it.
            </Typography>
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseHelpDialog} color="primary">
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default UploadForCompare;
