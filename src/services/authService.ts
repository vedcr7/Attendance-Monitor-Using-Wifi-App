/**
 * authService.ts — All authentication API calls.
 * Token is stored in EncryptedStorage (hardware-backed on Android).
 */
import EncryptedStorage from 'react-native-encrypted-storage';
import apiClient from './apiClient';
import type { AuthUser } from '../types';

const TOKEN_KEY = 'auth_token';
const USER_KEY  = 'auth_user';

// ── API calls ──────────────────────────────────────────────────────────────

export async function loginWithPassword(
  email: string,
  password: string,
): Promise<{ token: string; user: AuthUser }> {
  const res = await apiClient.post('/api/auth/login', { email, password });
  await persistSession(res.data.token, res.data.user);
  return res.data;
}

export async function requestOtp(phone: string): Promise<{ _dev_otp?: string }> {
  const res = await apiClient.post('/api/auth/request-otp', { phone });
  return res.data;
}

export async function verifyOtp(
  phone: string,
  otp: string,
): Promise<{ token: string; user: AuthUser }> {
  const res = await apiClient.post('/api/auth/verify-otp', { phone, otp });
  await persistSession(res.data.token, res.data.user);
  return res.data;
}

export async function getMe(): Promise<AuthUser | null> {
  try {
    const res = await apiClient.get('/api/auth/me');
    return res.data.user;
  } catch {
    return null;
  }
}

// ── Token persistence ──────────────────────────────────────────────────────

async function persistSession(token: string, user: AuthUser): Promise<void> {
  await EncryptedStorage.setItem(TOKEN_KEY, token);
  await EncryptedStorage.setItem(USER_KEY, JSON.stringify(user));
}

export async function loadStoredSession(): Promise<{
  token: string;
  user: AuthUser;
} | null> {
  try {
    const token = await EncryptedStorage.getItem(TOKEN_KEY);
    const userJson = await EncryptedStorage.getItem(USER_KEY);
    if (!token || !userJson) return null;
    return { token, user: JSON.parse(userJson) };
  } catch {
    return null;
  }
}

export async function logout(): Promise<void> {
  await EncryptedStorage.removeItem(TOKEN_KEY);
  await EncryptedStorage.removeItem(USER_KEY);
}
