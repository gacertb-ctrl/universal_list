import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor for adding auth token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const loginUser = async (credentials: any) => {
  const response = await api.post('/auth/login', credentials);
  return response.data;
};

export const registerUser = async (userData: any) => {
  const response = await api.post('/auth/register', userData);
  return response.data;
};

export const getModels = async (params?: any) => {
  const response = await api.get('/models', { params });
  return response.data;
};

export const getBrands = async () => {
  const response = await api.get('/brands');
  return response.data;
};

export const getCategories = async () => {
  const response = await api.get('/categories');
  return response.data;
};

export const createModel = async (modelData: any) => {
  const response = await api.post('/models', modelData);
  return response.data;
};

export const updateModel = async (id: string, modelData: any) => {
  const response = await api.put(`/models/${id}`, modelData);
  return response.data;
};

export const deleteModel = async (id: string) => {
  const response = await api.delete(`/models/${id}`);
  return response.data;
};

export const createBrand = async (brandData: any) => {
  const response = await api.post('/brands', brandData);
  return response.data;
};

export const updateBrand = async (id: string, brandData: any) => {
  const response = await api.put(`/brands/${id}`, brandData);
  return response.data;
};

export const deleteBrand = async (id: string) => {
  const response = await api.delete(`/brands/${id}`);
  return response.data;
};

export const searchModels = async (q: string) => {
  const response = await api.get('/search/models', { params: { q } });
  return response.data;
};

export const searchSuggestions = async (q: string) => {
  const response = await api.get('/search/suggest', { params: { q } });
  return response.data;
};

export const getDashboardStats = async () => {
  const response = await api.get('/dashboard/stats');
  return response.data;
};

export const getRecentUpdates = async () => {
  const response = await api.get('/dashboard/recent-updates');
  return response.data;
};

export const requestModel = async (requestData: any) => {
  const response = await api.post('/models/request', requestData);
  return response.data;
};

export const getAdSettings = async () => {
  const response = await api.get('/ad-settings');
  return response.data;
};

export const updateAdSettings = async (settings: any) => {
  const response = await api.put('/ad-settings', settings);
  return response.data;
};

export const bulkImportModels = async (file: File) => {
  const formData = new FormData();
  formData.append('file', file);
  const response = await api.post('/models/bulk-import', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

