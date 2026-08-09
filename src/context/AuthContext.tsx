import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppUser, AppSettings } from '../types';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { requestNotificationPermission, getExpoPushToken } from '../lib/notifications';

interface AuthContextValue {
  user: AppUser | null;
  settings: AppSettings;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, username: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
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
  resetPassword: async () => {},
  updateProfile: async () => {},
  updateSettings: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadSettings();

    if (isSupabaseConfigured && supabase) {
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session) {
          fetchProfile(session.user.id, session.user.email!);
        } else {
          loadUserFromStorage();
        }
      });

      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        if (session) {
          fetchProfile(session.user.id, session.user.email!);
        } else {
          setUser(null);
          setIsLoading(false);
        }
      });

      return () => subscription.unsubscribe();
    } else {
      loadUserFromStorage();
    }
  }, []);

  async function loadSettings() {
    const raw = await AsyncStorage.getItem(SETTINGS_STORAGE_KEY);
    if (raw) {
      try { setSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(raw) }); } catch {}
    }
  }

  async function loadUserFromStorage() {
    const raw = await AsyncStorage.getItem(AUTH_STORAGE_KEY);
    if (raw) {
      try { setUser(JSON.parse(raw)); } catch {}
    }
    setIsLoading(false);
  }

  async function fetchProfile(id: string, email: string) {
    if (!supabase) return;
    try {
      const { data } = await supabase.from('profiles').select('*').eq('id', id).single();
      if (data) {
        const appUser: AppUser = {
          id,
          name: data.name,
          username: data.username,
          email,
          avatar: data.avatar,
        };
        setUser(appUser);
        await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(appUser));
        // Register push token so server-sent notifications can reach this device
        getExpoPushToken().then((token) => {
          if (token) supabase!.from('profiles').update({ push_token: token }).eq('id', id);
        });
      }
    } catch {}
    setIsLoading(false);
  }

  async function login(email: string, password: string) {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw new Error(error.message);
      if (data.user) {
        await fetchProfile(data.user.id, data.user.email!);
        const raw = await AsyncStorage.getItem(SETTINGS_STORAGE_KEY);
        const s: AppSettings = raw ? { ...DEFAULT_SETTINGS, ...JSON.parse(raw) } : DEFAULT_SETTINGS;
        if (s.notificationsEnabled) requestNotificationPermission();
      }
      return;
    }

    // Mock fallback (no Supabase configured)
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
    if (settings.notificationsEnabled) requestNotificationPermission();
  }

  async function register(name: string, username: string, email: string, password: string) {
    if (isSupabaseConfigured && supabase) {
      const uname = username.startsWith('@') ? username : `@${username}`;

      // Check username availability BEFORE creating the auth user — otherwise
      // a unique-constraint failure leaves an orphaned auth account with no
      // profile, permanently locking out that email address.
      const { data: taken } = await supabase
        .from('profiles_public')
        .select('id')
        .ilike('username', uname)
        .maybeSingle();
      if (taken) throw new Error("Ce nom d'utilisateur est déjà pris.");

      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) throw new Error(error.message);
      if (data.user) {
        if (!data.session) {
          // Email confirmation is enabled: no session yet, so the RLS-guarded
          // profile insert would fail. The profile is created on first login.
          throw new Error(
            'Vérifiez votre boîte mail pour confirmer votre compte, puis connectez-vous.'
          );
        }
        const avatar = name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
        const { error: profileError } = await supabase.from('profiles').insert({
          id: data.user.id,
          name: name.trim(),
          username: uname,
          email: email.trim(),
          avatar,
        });
        if (profileError) {
          throw new Error(
            "Impossible de créer le profil. Réessayez ou choisissez un autre nom d'utilisateur."
          );
        }
        await fetchProfile(data.user.id, email);
        if (settings.notificationsEnabled) requestNotificationPermission();
      }
      return;
    }

    // Mock fallback
    const avatar = name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
    const newUser: AppUser = {
      id: Date.now().toString(),
      name: name.trim(),
      username: username.startsWith('@') ? username : `@${username}`,
      email: email.trim(),
      avatar,
    };
    setUser(newUser);
    await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(newUser));
    if (settings.notificationsEnabled) requestNotificationPermission();
  }

  async function resetPassword(email: string) {
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      if (error) throw new Error(error.message);
      return;
    }
    // Mock: silently succeed -- no real email can be sent without Supabase
  }

  async function logout() {
    if (isSupabaseConfigured && supabase) {
      await supabase.auth.signOut();
      // AppContext purges @huco_state via its SIGNED_OUT listener.
    } else {
      // Mock mode has no auth event: purge app state here so the next
      // account on this device doesn't inherit the previous user's data.
      await AsyncStorage.removeItem('@huco_state');
    }
    setUser(null);
    await AsyncStorage.removeItem(AUTH_STORAGE_KEY);
  }

  async function updateProfile(updates: Partial<AppUser>) {
    if (!user) return;
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.from('profiles').update({
        name: updates.name,
        username: updates.username,
        avatar: updates.avatar,
        updated_at: new Date().toISOString(),
      }).eq('id', user.id);
      if (error) {
        // Never apply locally what the server rejected (e.g. username taken)
        // or local and server state diverge permanently.
        throw new Error(
          error.code === '23505'
            ? "Ce nom d'utilisateur est déjà pris."
            : 'Impossible de mettre à jour le profil. Réessayez.'
        );
      }
    }
    const updated = { ...user, ...updates };
    setUser(updated);
    await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(updated));
  }

  async function updateSettings(updates: Partial<AppSettings>) {
    const updated = { ...settings, ...updates };
    setSettings(updated);
    await AsyncStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(updated));
    if (updates.notificationsEnabled === true) {
      requestNotificationPermission();
    }
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
        resetPassword,
        updateProfile,
        updateSettings,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
