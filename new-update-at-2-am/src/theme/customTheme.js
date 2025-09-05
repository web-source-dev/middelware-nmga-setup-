import { createTheme } from '@mui/material/styles';

const customTheme = createTheme({
  palette: {
    primary: {
      main: '#fbde59',
      light: '#fce47a',
      dark: '#f9d633',
      contrastText: '#333333',
    },
    secondary: {
        main: '#5ac9cd',
        light: '#7dd4d7',
        dark: '#4aa8ac',
        contrastText: '#ffffff',
    },
    text: {
      primary: '#333333',
      secondary: '#666666',
      disabled: '#999999',
    },
    background: {
      default: '#ffffff',
      paper: '#ffffff',
      light: '#e5f0fe',
    },
    inherit: {
      main: '#fbde59',
    },
    success: {
      main: '#4caf50',
      light: '#81c784',
      dark: '#388e3c',
    },
    error: {
      main: '#f44336',
      light: '#e57373',
      dark: '#d32f2f',
    },
    warning: {
      main: '#ff9800',
      light: '#ffb74d',
      dark: '#f57c00',
    },
    info: {
      main: '#2196f3',
      light: '#64b5f6',
      dark: '#1976d2',
    },
    grey: {
      50: '#fafafa',
      100: '#f5f5f5',
      200: '#eeeeee',
      300: '#e0e0e0',
      400: '#bdbdbd',
      500: '#9e9e9e',
      600: '#757575',
      700: '#616161',
      800: '#424242',
      900: '#212121',
    },
  },
  typography: {
    fontFamily: [
      '-apple-system',
      'BlinkMacSystemFont',
      '"Segoe UI"',
      'Roboto',
      '"Helvetica Neue"',
      'Arial',
      'sans-serif',
    ].join(','),
    h1: {
      color: '#333333',
      fontWeight: 600,
    },
    h2: {
      color: '#333333',
      fontWeight: 600,
    },
    h3: {
      color: '#333333',
      fontWeight: 600,
    },
    h4: {
      color: '#333333',
      fontWeight: 600,
    },
    h5: {
      color: '#333333',
      fontWeight: 600,
    },
    h6: {
      color: '#333333',
      fontWeight: 600,
    },
    body1: {
      color: '#333333',
    },
    body2: {
      color: '#666666',
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 8,
          fontWeight: 500,
        },
        contained: {
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          '&:hover': {
            boxShadow: '0 4px 8px rgba(0,0,0,0.15)',
          },
        },
        outlined: {
          borderWidth: 2,
          '&:hover': {
            borderWidth: 2,
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          border: '1px solid #e0e0e0',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 8,
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          fontWeight: 500,
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 8,
          },
        },
      },
    },
    MuiTableHead: {
      styleOverrides: {
        root: {
          backgroundColor: '#e5f0fe',
          '& .MuiTableCell-head': {
            fontWeight: 600,
            color: '#333333',
          },
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          borderBottom: '1px solid #e0e0e0',
        },
      },
    },
    MuiTableRow: {
      styleOverrides: {
        root: {
          '&:hover': {
            backgroundColor: '#e5f0fe',
          },
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: '#ffffff',
          color: '#333333',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundColor: '#ffffff',
          borderRight: '1px solid #e0e0e0',
        },
      },
    },
    MuiListItem: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          margin: '2px 8px',
          '&:hover': {
            backgroundColor: '#e5f0fe',
          },
        },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          margin: '2px 8px',
          '&:hover': {
            backgroundColor: '#e5f0fe',
          },
          '&.Mui-selected': {
            backgroundColor: '#5ac9cd',
            color: '#ffffff',
            '&:hover': {
              backgroundColor: '#4aa8ac',
            },
          },
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          '&:hover': {
            backgroundColor: '#e5f0fe',
          },
        },
      },
    },
    MuiSwitch: {
      styleOverrides: {
        root: {
          '& .MuiSwitch-switchBase.Mui-checked': {
            color: '#5ac9cd',
          },
          '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
            backgroundColor: '#5ac9cd',
          },
        },
      },
    },
    MuiCheckbox: {
      styleOverrides: {
        root: {
          color: '#5ac9cd',
          '&.Mui-checked': {
            color: '#5ac9cd',
          },
        },
      },
    },
    MuiRadio: {
      styleOverrides: {
        root: {
          color: '#5ac9cd',
          '&.Mui-checked': {
            color: '#5ac9cd',
          },
        },
      },
    },
    MuiLinearProgress: {
      styleOverrides: {
        root: {
          backgroundColor: '#e5f0fe',
        },
        bar: {
          backgroundColor: '#5ac9cd',
        },
      },
    },
    MuiCircularProgress: {
      styleOverrides: {
        root: {
          color: '#5ac9cd',
        },
      },
    },
    MuiSkeleton: {
      styleOverrides: {
        root: {
          backgroundColor: '#e5f0fe',
        },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: {
          borderRadius: 8,
        },
      },
    },
    MuiSnackbar: {
      styleOverrides: {
        root: {
          '& .MuiAlert-root': {
            borderRadius: 8,
          },
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 12,
        },
      },
    },
    MuiMenu: {
      styleOverrides: {
        paper: {
          borderRadius: 8,
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        },
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          backgroundColor: '#333333',
          color: '#ffffff',
          borderRadius: 6,
          fontSize: '0.875rem',
        },
      },
    },
    MuiPagination: {
      styleOverrides: {
        root: {
          '& .MuiPaginationItem-root': {
            borderRadius: 8,
            '&.Mui-selected': {
              backgroundColor: '#5ac9cd',
              color: '#ffffff',
              '&:hover': {
                backgroundColor: '#4aa8ac',
              },
            },
          },
        },
      },
    },
  },
  shape: {
    borderRadius: 8,
  },
  shadows: [
    'none',
    '0 2px 4px rgba(0,0,0,0.1)',
    '0 4px 8px rgba(0,0,0,0.1)',
    '0 6px 12px rgba(0,0,0,0.1)',
    '0 8px 16px rgba(0,0,0,0.1)',
    '0 10px 20px rgba(0,0,0,0.1)',
    '0 12px 24px rgba(0,0,0,0.1)',
    '0 14px 28px rgba(0,0,0,0.1)',
    '0 16px 32px rgba(0,0,0,0.1)',
    '0 18px 36px rgba(0,0,0,0.1)',
    '0 20px 40px rgba(0,0,0,0.1)',
    '0 22px 44px rgba(0,0,0,0.1)',
    '0 24px 48px rgba(0,0,0,0.1)',
    '0 26px 52px rgba(0,0,0,0.1)',
    '0 28px 56px rgba(0,0,0,0.1)',
    '0 30px 60px rgba(0,0,0,0.1)',
    '0 32px 64px rgba(0,0,0,0.1)',
    '0 34px 68px rgba(0,0,0,0.1)',
    '0 36px 72px rgba(0,0,0,0.1)',
    '0 38px 76px rgba(0,0,0,0.1)',
    '0 40px 80px rgba(0,0,0,0.1)',
    '0 42px 84px rgba(0,0,0,0.1)',
    '0 44px 88px rgba(0,0,0,0.1)',
    '0 46px 92px rgba(0,0,0,0.1)',
  ],
});

export default customTheme; 