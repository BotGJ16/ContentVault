import axios from 'axios';
import { ContentItem } from '@/utils/mockData';

const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';

const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Auth API
export const authApi = {
  login: async (credentials: { address: string; signature: string }) => {
    return api.post('/auth/login', credentials);
  },
  
  logout: async () => {
    return api.post('/auth/logout');
  },
  
  getProfile: async (address: string) => {
    return api.get(`/auth/profile/${address}`);
  },
  
  updateProfile: async (profileData: any) => {
    return api.put('/auth/profile', profileData);
  },
};

// Content API
export const contentApi = {
  getContent: async (params: { page?: number; limit?: number; category?: string; search?: string }) => {
    return api.get('/content', { params });
  },
  
  getFeaturedContent: async () => {
    return api.get('/content/featured');
  },
  
  getUserContent: async (address: string) => {
    return api.get(`/content/user/${address}`);
  },
  
  getPurchasedContent: async (address: string) => {
    return api.get(`/content/purchased/${address}`);
  },
  
  uploadContent: async (data: any, onProgress?: (progress: number) => void) => {
    const formData = new FormData();
    
    if (data.file) {
      formData.append('file', data.file);
    }
    formData.append('title', data.title);
    formData.append('description', data.description);
    formData.append('price', data.price.toString());
    formData.append('isPublic', data.isPublic.toString());
    formData.append('tags', JSON.stringify(data.tags));
    
    return api.post('/content/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(progress);
        }
      },
    });
  },
  
  purchaseContent: async (contentId: string, price: number) => {
    return api.post(`/content/purchase/${contentId}`, { price });
  },
  
  tipCreator: async (contentId: string, amount: number) => {
    return api.post(`/content/tip/${contentId}`, { amount });
  },
  
  getContent: async (contentId: string) => {
    return api.get(`/content/${contentId}`);
  },
  
  updateContent: async (contentId: string, data: any) => {
    return api.put(`/content/${contentId}`, data);
  },
  
  deleteContent: async (contentId: string) => {
    return api.delete(`/content/${contentId}`);
  },
};

// User API
export const userApi = {
  getUserProfile: async (address: string) => {
    return api.get(`/user/profile/${address}`);
  },
  
  getUserAnalytics: async (address: string) => {
    return api.get(`/user/analytics/${address}`);
  },
  
  followUser: async (userAddress: string) => {
    return api.post(`/user/follow/${userAddress}`);
  },
  
  unfollowUser: async (userAddress: string) => {
    return api.delete(`/user/follow/${userAddress}`);
  },
  
  getFollowers: async (userAddress: string) => {
    return api.get(`/user/followers/${userAddress}`);
  },
  
  getFollowing: async (userAddress: string) => {
    return api.get(`/user/following/${userAddress}`);
  },
};

// Payment API
export const paymentApi = {
  getPaymentHistory: async (address: string) => {
    return api.get(`/payments/history/${address}`);
  },
  
  getEarnings: async (address: string) => {
    return api.get(`/payments/earnings/${address}`);
  },
  
  withdrawEarnings: async () => {
    return api.post('/payments/withdraw');
  },
  
  getTransactionReceipt: async (txHash: string) => {
    return api.get(`/payments/receipt/${txHash}`);
  },
};

// AI API
export const aiApi = {
  getRecommendations: async (userAddress: string, limit = 10) => {
    return api.get(`/ai/recommendations/${userAddress}`, { params: { limit } });
  },
  
  getTrendingContent: async (limit = 10) => {
    return api.get('/ai/trending', { params: { limit } });
  },
  
  getSimilarContent: async (contentId: string, limit = 5) => {
    return api.get(`/ai/similar/${contentId}`, { params: { limit } });
  },
};

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('authToken');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;