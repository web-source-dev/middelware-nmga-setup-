import axios from 'axios';

// Create an axios instance with default config
const api = axios.create({
  baseURL: process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000',
  headers: {
    'Content-Type': 'application/json'
  },
  timeout: 120000 // Increased to 2 minutes timeout for complex filtering and sorting operations
});

// Request interceptor to automatically add token to all requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle token expiration
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid - only clear token
      localStorage.removeItem('token');
      
      // Redirect to login page
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Helper function to decode JWT token (client-side)
export const decodeToken = (token) => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    return JSON.parse(jsonPayload);
  } catch (error) {
    return null;
  }
};

// Helper function to get current user context from token
export const getCurrentUserContext = () => {
  const token = localStorage.getItem('token');
  if (!token) {
    return {
      token: null,
      isAuthenticated: false,
      user: null,
      isImpersonating: false
    };
  }

  const decoded = decodeToken(token);
  if (!decoded) {
    return {
      token,
      isAuthenticated: false,
      user: null,
      isImpersonating: false
    };
  }

  return {
    token,
    isAuthenticated: true,
    user: {
      id: decoded.isImpersonating ? decoded.impersonatedUserId : decoded.id,
      role: decoded.role
    },
    isImpersonating: decoded.isImpersonating || false,
    impersonatedUserId: decoded.impersonatedUserId,
    adminId: decoded.adminId
  };
};

// Helper function to check if user is authenticated
export const isAuthenticated = () => {
  const token = localStorage.getItem('token');
  if (!token) return false;
  
  const decoded = decodeToken(token);
  return decoded !== null;
};

// Helper function to check if user is admin
export const isAdmin = () => {
  const token = localStorage.getItem('token');
  if (!token) return false;
  
  const decoded = decodeToken(token);
  if (decoded && decoded.isImpersonating) {
    // If admin is impersonating, check the original admin's role
    return decoded.adminId && decoded.role === 'admin';
  }
  return decoded && decoded.role === 'admin';
};

// Helper function to check if user is distributor
export const isDistributor = () => {
  const token = localStorage.getItem('token');
  if (!token) return false;
  
  const decoded = decodeToken(token);
  if (decoded && decoded.isImpersonating) {
    // If admin is impersonating, check the impersonated user's role
    return decoded.role === 'distributor';
  }
  return decoded && decoded.role === 'distributor';
};

// Helper function to check if user is member
export const isMember = () => {
  const token = localStorage.getItem('token');
  if (!token) return false;
  
  const decoded = decodeToken(token);
  if (decoded && decoded.isImpersonating) {
    // If admin is impersonating, check the impersonated user's role
    return decoded.role === 'member';
  }
  return decoded && decoded.role === 'member';
};

// Helper function to check if admin is impersonating another user
export const isImpersonating = () => {
  const token = localStorage.getItem('token');
  if (!token) return false;
  
  const decoded = decodeToken(token);
  return decoded && decoded.isImpersonating === true;
};

export default api;