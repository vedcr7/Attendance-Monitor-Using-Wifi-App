/**
 * apiClient.ts — Axios instance configured for the backend.
 *
 * BASE_URL points to your local machine IP when running on a physical device.
 * Android emulator uses 10.0.2.2, physical device uses your PC's WiFi IP.
 *
 * HOW TO FIND YOUR PC'S IP:
 *   Run in CMD: ipconfig
 *   Look for "IPv4 Address" under your WiFi adapter (e.g. 192.168.1.5)
 *   Replace the IP below with yours.
 */
import axios from 'axios';
import EncryptedStorage from 'react-native-encrypted-storage';

// ── Change this to your PC's local IP address ─────────────────────────────
// Physical device: use your PC's WiFi IP (e.g. 'http://192.168.1.5:3000')
// Emulator:        use 'http://10.0.2.2:3000'
export const API_BASE_URL = 'https://attendance-monitor-using-wifi-app.onrender.com';
// ─────────────────────────────────────────────────────────────────────────

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT token to every request automatically
apiClient.interceptors.request.use(async config => {
  try {
    const token = await EncryptedStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch {
    // No token stored yet — fine for login requests
  }
  return config;
});

// Standardise error messages
apiClient.interceptors.response.use(
  response => response,
  error => {
    const message =
      error.response?.data?.error ||
      error.message ||
      'Network error. Check your connection.';
    return Promise.reject(new Error(message));
  },
);

export default apiClient;
