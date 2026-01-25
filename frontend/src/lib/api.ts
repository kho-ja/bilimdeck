/**
 * Axios API client configured for Django backend
 * Automatically attaches JWT Bearer token from NextAuth session
 */

import axios from 'axios';
import { getSession, signOut } from 'next-auth/react';
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
  async (error) => {
    const originalRequest = error.config;
    const status = error.response?.status;

    if (status === 401 && originalRequest && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const session = await getSession();
        const newToken = (session as any)?.accessToken;

        if (newToken) {
          originalRequest.headers = {
            ...(originalRequest.headers || {}),
            Authorization: `Bearer ${newToken}`,
          };
          return apiClient(originalRequest);
        }
      } catch {
        // Fall through to sign-out below
      }

      if (typeof window !== 'undefined') {
        await signOut({ callbackUrl: '/login' });
      }
    }

    return Promise.reject(error);
  }
);
