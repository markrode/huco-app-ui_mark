import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppUser, AppSettings } from '../types';

interface AuthContextValue {
  user: AppUser | null;
  settings: AppSettings;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, username: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (updates: Partial<AppUser>) => Promise<void>;
  updateSettings: (updates: Partial<AppSettings>) => Promise<void>;
}

const DEFAULT_SETTINGS: AppSettings = {
  notificationsEnabled: true,
  recommendationAlerts: true,
  weeklyDigest: false,
};

const AUTH_STORAGE_KEY = '@huco_auth_user';
const SETTINGS_STORAGE_KEY = '@huco_settings';

const AuthContext = createContext<AuthContextValue>({
  user: null,
  settings: DEFAULT_SETTINGS,
  isLoading: true,
  isAuthenticated: false,
  login: async () => {},
  register: async () => {},
  logout: async () => {},
  updateProfile: async () => {},
  updateSettings: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      AsyncStorage.getItem(AUTH_STORAGE_KEY),
      AsyncStorage.getItem(SETTINGS_STORAGE_KEY),
    ]).then(([rawUser, rawSettings]) => {
      if (rawUser) {
        try { setUser(JSON.parse(rawUser)); } catch {}
      }
      if (rawSettings) {
        try { setSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(rawSettings) }); } catch {}
      }
      setIsLoading(false);
    });
  }, []);

  async function login(email: string, _password: string) {
    // TODO: swap with Supabase →
    // const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    // if (error) throw new Error(error.message)
    // const profile = await supabase.from('profiles').select('*').eq('id', data.user.id).single()
    const displayName = email
      .split('@')[0]
      .replace(/[._-]/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase());
    const mockUser: AppUser = {
      id: 'user-mock-1',
      name: displayName,
      username: `@${email.split('@')[0]}`,
      email,
      avatar: displayName.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2),
    };
    setUser(mockUser);
    await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(mockUser));
  }

  async function register(name: string, username: string, email: string, _password: string) {
    // TODO: swap with Supabase →
    // const { data, error } = await supabase.auth.signUp({ email, password })
    // if (error) throw new Error(error.message)
    // await supabase.from('profiles').insert({ id: data.user.id, name, username, email, avatar })
    const avatar = name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
    const newUser: AppUser = {
      id: Date.now().toString(),
      name: name.trim(),
      username: username.startsWith('@') ? username : `@${username}`,
      email: email.trim(),
      avatar,
    };
    setUser(newUser);
    await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(newUser));
  }

  async function logout() {
    // TODO: swap with Supabase → await supabase.auth.signOut()
    setUser(null);
    await AsyncStorage.removeItem(AUTH_STORAGE_KEY);
  }

  async function updateProfile(updates: Partial<AppUser>) {
    if (!user) return;
    // TODO: swap with Supabase → await supabase.from('profiles').update(updates).eq('id', user.id)
    const updated = { ...user, ...updates };
    setUser(updated);
    await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(updated));
  }

  async function updateSettings(updates: Partial<AppSettings>) {
    const updated = { ...settings, ...updates };
    setSettings(updated);
    await AsyncStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(updated));
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        settings,
        isLoading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
        updateProfile,
        updateSettings,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
