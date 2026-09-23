import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { AuthUser, UserRole } from '../types';
import { authApi } from '../services/authApi';

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  loading: boolean;
  login: (email: string, pass: string, expectedRole?: UserRole) => Promise<AuthUser>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  hasRole: (...roles: UserRole[]) => boolean;
  getRoleRedirectPath: (role?: UserRole) => string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(() => {
    try {
      const saved = localStorage.getItem('lm_auth_user');
      if (!saved) return null;
      const parsed = JSON.parse(saved);
      if (!parsed || !parsed.role || typeof parsed.role !== 'string') {
        localStorage.removeItem('lm_auth_user');
        return null;
      }
      return parsed;
    } catch {
      localStorage.removeItem('lm_auth_user');
      return null;
    }
  });
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('lm_token'));
  const [loading, setLoading] = useState<boolean>(true);

  const getRoleRedirectPath = useCallback((role?: UserRole): string => {
    const targetRole = role || user?.role;
    switch (targetRole) {
      case 'SUPER_ADMIN':
      case 'ADMIN':
        return '/admin/dashboard';
      case 'LEGAL_METROLOGY_OFFICER':
      case 'FIELD_VERIFICATION_OFFICER':
      case 'GATC_OFFICER':
        return '/officer/dashboard';
      case 'BUSINESS_USER':
        return '/applicant/dashboard';
      default:
        return '/login';
    }
  }, [user?.role]);

  const refreshUser = useCallback(async () => {
    const currentToken = localStorage.getItem('lm_token');
    if (!currentToken) {
      setUser(null);
      setLoading(false);
      return;
    }
    try {
      const res = await authApi.getMe();
      const rawData = res.data as any;
      const u = rawData?.user || rawData;
      if (res.success && u && u.role) {
        const normalizedUser: AuthUser = {
          id: u._id || u.id,
          name: u.name || '',
          email: u.email || '',
          role: u.role,
          phone: u.phone,
          designation: u.designation,
          jurisdiction: u.jurisdiction,
          stakeholderId: u.stakeholderId || rawData?.stakeholder?._id,
          token: currentToken,
        };
        setUser(normalizedUser);
        localStorage.setItem('lm_auth_user', JSON.stringify(normalizedUser));
      } else {
        throw new Error('User session invalid or role missing');
      }
    } catch {
      setUser(null);
      setToken(null);
      localStorage.removeItem('lm_auth_user');
      localStorage.removeItem('lm_token');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUser();

    const handleExpired = () => {
      setUser(null);
      setToken(null);
      localStorage.removeItem('lm_auth_user');
      localStorage.removeItem('lm_token');
    };

    window.addEventListener('auth:expired', handleExpired);
    return () => window.removeEventListener('auth:expired', handleExpired);
  }, [refreshUser]);

  const login = async (email: string, pass: string, expectedRole?: UserRole): Promise<AuthUser> => {
    const res = await authApi.login({
      email,
      password: pass,
      selectedRole: expectedRole,
    });
    if (!res.success || !res.data) {
      throw new Error(res.message || 'Authentication failed');
    }

    const { token: newToken, user: u, stakeholder } = res.data;
    const normalizedUser: AuthUser = {
      id: u._id || u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      phone: u.phone,
      designation: u.designation,
      jurisdiction: u.jurisdiction,
      stakeholderId: u.stakeholderId || stakeholder?._id,
      token: newToken,
    };

    localStorage.setItem('lm_token', newToken);
    localStorage.setItem('lm_auth_user', JSON.stringify(normalizedUser));
    setToken(newToken);
    setUser(normalizedUser);
    setLoading(false);
    return normalizedUser;
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } finally {
      setUser(null);
      setToken(null);
      localStorage.removeItem('lm_auth_user');
      localStorage.removeItem('lm_token');
    }
  };

  const hasRole = (...roles: UserRole[]): boolean => {
    if (!user) return false;
    return roles.includes(user.role);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        logout,
        refreshUser,
        hasRole,
        getRoleRedirectPath,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
