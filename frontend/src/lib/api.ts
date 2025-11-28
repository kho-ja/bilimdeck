/**
 * Axios API client configured for Django backend
 * Automatically attaches JWT Bearer token from NextAuth session
 */

import axios from 'axios';
import { getSession } from 'next-auth/react';
import { auth } from '@/auth';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

// Create axios instance with base configuration
export const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  async (config) => {
    let token = null;

    // Get token from session (server or client)
    if (typeof window === 'undefined') {
      // Server-side: use auth() from NextAuth
      const session = await auth();
      token = (session as any)?.accessToken;
    } else {
      // Client-side: use getSession() from next-auth/react
      const session = await getSession();
      token = (session as any)?.accessToken;
    }

    // Attach Bearer token if available
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle 401 Unauthorized
    if (error.response?.status === 401) {
      // Token expired or invalid - could trigger re-authentication
      console.error('Unauthorized access - token may be expired');
    }
    return Promise.reject(error);
  }
);
