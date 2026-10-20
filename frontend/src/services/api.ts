import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'https://universal-list.onrender.com/api';

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

// ========================
// AUTH
// ========================
export const loginUser = async (credentials: any) => {
  const response = await api.post('/auth/login', credentials);
  return response.data;
};

export const registerUser = async (userData: any) => {
  const response = await api.post('/auth/register', userData);
  return response.data;
};

export const getMe = async () => {
  const response = await api.get('/auth/me');
  return response.data;
};

// ========================
// CATEGORIES & TYPES
// ========================
export const getCategories = async () => {
  const response = await api.get('/categories');
  return response.data;
};

export const getCategoryById = async (id: string | number) => {
  const response = await api.get(`/categories/${id}`);
  return response.data;
};

export const getCategoryTypes = async (categoryId: string | number) => {
  const response = await api.get(`/categories/${categoryId}/types`);
  return response.data;
};

export const getCategoryBrands = async (categoryId: string | number, typeId?: string | number) => {
  const response = await api.get(`/categories/${categoryId}/brands`, {
    params: { typeId }
  });
  return response.data;
};

export const createCategory = async (data: any) => {
  const response = await api.post('/categories', data);
  return response.data;
};

export const updateCategory = async (id: string | number, data: any) => {
  const response = await api.put(`/categories/${id}`, data);
  return response.data;
};

export const deleteCategory = async (id: string | number) => {
  const response = await api.delete(`/categories/${id}`);
  return response.data;
};

export const createCategoryType = async (categoryId: string | number, data: any) => {
  const response = await api.post(`/categories/${categoryId}/types`, data);
  return response.data;
};

export const updateCategoryType = async (typeId: string | number, data: any) => {
  const response = await api.put(`/categories/types/${typeId}`, data);
  return response.data;
};

// ========================
// BRANDS
// ========================
export const getBrands = async () => {
  const response = await api.get('/brands');
  return response.data;
};

export const getBrandById = async (id: string | number) => {
  const response = await api.get(`/brands/${id}`);
  return response.data;
};

export const createBrand = async (brandData: any) => {
  const response = await api.post('/brands', brandData);
  return response.data;
};

export const updateBrand = async (id: string | number, brandData: any) => {
  const response = await api.put(`/brands/${id}`, brandData);
  return response.data;
};

export const deleteBrand = async (id: string | number) => {
  const response = await api.delete(`/brands/${id}`);
  return response.data;
};

// ========================
// MODELS & COMPATIBILITY
// ========================
export const getModels = async (params?: any) => {
  const response = await api.get('/models', { params });
  return response.data;
};

export const getModelById = async (id: string | number) => {
  const response = await api.get(`/models/${id}`);
  return response.data;
};

export const getModelCompatibility = async (id: string | number) => {
  const response = await api.get(`/models/${id}/compatibility`);
  return response.data;
};

export const createModel = async (modelData: any) => {
  const response = await api.post('/models', modelData);
  return response.data;
};

export const updateModel = async (id: string | number, modelData: any) => {
  const response = await api.put(`/models/${id}`, modelData);
  return response.data;
};

export const deleteModel = async (id: string | number) => {
  const response = await api.delete(`/models/${id}`);
  return response.data;
};

export const addModelCompatibility = async (id: string | number, data: any) => {
  const response = await api.post(`/models/${id}/compatibility`, data);
  return response.data;
};

export const requestModel = async (requestData: any) => {
  const response = await api.post('/models/request', requestData);
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

export const downloadSampleCsv = async (): Promise<Blob> => {
  const response = await api.get('/models/sample-csv', {
    responseType: 'blob',
  });
  return response.data;
};

// ========================
// SEARCH & DASHBOARD
// ========================
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

// ========================
// ADMIN SERVICES
// ========================
export const getAdminMetrics = async () => {
  const response = await api.get('/admin/dashboard');
  return response.data;
};

export const getAdminUsers = async () => {
  const response = await api.get('/admin/users');
  return response.data;
};

export const updateUserStatus = async (id: number | string, status: string) => {
  const response = await api.patch(`/admin/users/${id}/status`, { status });
  return response.data;
};

export const updateUserRole = async (id: number | string, roleId: number | string) => {
  const response = await api.patch(`/admin/users/${id}/role`, { roleId });
  return response.data;
};

export const getAiJobs = async () => {
  const response = await api.get('/admin/ai/jobs');
  return response.data;
};

export const runAiJob = async (isDryRun: boolean = false) => {
  const response = await api.post('/admin/ai/jobs/run', { isDryRun });
  return response.data;
};

export const getAiCandidates = async (params?: { status?: string; jobId?: number }) => {
  const response = await api.get('/admin/ai/candidates', { params });
  return response.data;
};

export const approveAiCandidate = async (id: number | string) => {
  const response = await api.post(`/admin/ai/candidates/${id}/approve`);
  return response.data;
};

export const rejectAiCandidate = async (id: number | string, reason?: string) => {
  const response = await api.post(`/admin/ai/candidates/${id}/reject`, { reason });
  return response.data;
};

export const getAiSettings = async () => {
  const response = await api.get('/admin/ai/settings');
  return response.data;
};

export const updateAiSettings = async (settings: any) => {
  const response = await api.put('/admin/ai/settings', settings);
  return response.data;
};

export const getAvailableGeminiModels = async () => {
  const response = await api.get('/admin/ai/models');
  return response.data;
};

export const getAuditLogs = async () => {
  const response = await api.get('/admin/audit-logs');
  return response.data;
};

// ========================
// AD SETTINGS
// ========================
export const getAdSettings = async () => {
  const response = await api.get('/ad-settings');
  return response.data;
};

export const updateAdSettings = async (settings: any) => {
  const response = await api.put('/ad-settings', settings);
  return response.data;
};
