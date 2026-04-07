export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3500/api';
export const AUTH_API_BASE_URL = `${API_BASE_URL.replace(/\/$/, '')}/auth`;
