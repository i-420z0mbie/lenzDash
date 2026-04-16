// src/api.js
import axios from 'axios';

const BASE_URL = 'https://binarylenz.mycasaz.com/';

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('access_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const getCurrentSchoolId = async () => {
  try {
    // Option 1: from user profile endpoint
    const profile = await api.get('/main/user-profile/');
    if (profile.data.school_id) return profile.data.school_id;
  } catch (e) { console.warn('Profile endpoint failed', e); }

  try {
    // Option 2: fallback – get first class's school
    const classes = await api.get('/main/class-overview/');
    if (classes.data.length > 0 && classes.data[0].school) {
      return classes.data[0].school;
    }
  } catch (e) { console.warn('Classes endpoint failed', e); }

  return null;
};




export default api;