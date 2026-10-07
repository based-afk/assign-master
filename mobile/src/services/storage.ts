import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const TOKEN_KEY = 'pm_secure_auth_token';
const USER_KEY = 'pm_secure_user_data';

// Web memory fallback if running in browser
let webTokenFallback: string | null = null;
let webUserFallback: string | null = null;

export const StorageService = {
  async saveToken(token: string): Promise<void> {
    if (Platform.OS === 'web') {
      try {
        localStorage.setItem(TOKEN_KEY, token);
      } catch {
        webTokenFallback = token;
      }
      return;
    }
    // Native Android Keystore / iOS Keychain
    await SecureStore.setItemAsync(TOKEN_KEY, token, {
      keychainAccessible: SecureStore.WHEN_UNLOCKED,
    });
  },

  async getToken(): Promise<string | null> {
    if (Platform.OS === 'web') {
      try {
        return localStorage.getItem(TOKEN_KEY) || webTokenFallback;
      } catch {
        return webTokenFallback;
      }
    }
    return await SecureStore.getItemAsync(TOKEN_KEY);
  },

  async saveUser(user: any): Promise<void> {
    const jsonStr = JSON.stringify(user);
    if (Platform.OS === 'web') {
      try {
        localStorage.setItem(USER_KEY, jsonStr);
      } catch {
        webUserFallback = jsonStr;
      }
      return;
    }
    await SecureStore.setItemAsync(USER_KEY, jsonStr);
  },

  async getUser(): Promise<any | null> {
    let jsonStr: string | null = null;
    if (Platform.OS === 'web') {
      try {
        jsonStr = localStorage.getItem(USER_KEY) || webUserFallback;
      } catch {
        jsonStr = webUserFallback;
      }
    } else {
      jsonStr = await SecureStore.getItemAsync(USER_KEY);
    }
    if (!jsonStr) return null;
    try {
      return JSON.parse(jsonStr);
    } catch {
      return null;
    }
  },

  async clear(): Promise<void> {
    if (Platform.OS === 'web') {
      try {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
      } catch {}
      webTokenFallback = null;
      webUserFallback = null;
      return;
    }
    await SecureStore.deleteItemAsync(TOKEN_KEY).catch(() => {});
    await SecureStore.deleteItemAsync(USER_KEY).catch(() => {});
  },
};
