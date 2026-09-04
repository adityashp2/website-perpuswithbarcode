'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { AdminUser, Anggota } from '@/types/database';
import { useData } from './dataContext';

interface AuthContextType {
  currentUser: AdminUser | null;
  currentAnggota: Anggota | null;
  isAdmin: boolean;
  isMember: boolean;
  isAuthReady: boolean;
  login: (username: string) => { success: boolean; message: string; role?: AdminUser['type'] };
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { adminUsers, anggota } = useData();
  const [currentUser, setCurrentUser] = useState<AdminUser | null>(null);
  const [currentAnggota, setCurrentAnggota] = useState<Anggota | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);

  useEffect(() => {
    // Check saved session in localStorage
    const restoreSession = async () => {
      try {
        const savedUser = localStorage.getItem('perpus_session_user');
        if (savedUser) {
          const parsed = JSON.parse(savedUser) as AdminUser;
          const found = adminUsers.find((u) => u.id === parsed.id);
          if (found && !found.is_banned) {
            setCurrentUser(found);
            setCurrentAnggota(anggota.find((a) => a.id_admin === found.id) || null);
          } else {
            localStorage.removeItem('perpus_session_user');
          }
        }
      } catch (e) {
        console.error('Gagal memulihkan sesi:', e);
      } finally {
        setIsAuthReady(true);
      }
    };
    void restoreSession();
  }, [adminUsers, anggota]);

  const login = (username: string) => {
    const user = adminUsers.find(
      (u) => u.username.toLowerCase() === username.trim().toLowerCase()
    );

    if (!user) {
      return { success: false, message: 'Username tidak ditemukan!' };
    }

    if (user.is_banned) {
      return {
        success: false,
        message: `Akun Anda dinonaktifkan/banned oleh Admin. Alasan: ${user.banned_reason || 'Pelanggaran ketentuan perpustakaan.'}`,
      };
    }

    setCurrentUser(user);
    const matchedAnggota = anggota.find((a) => a.id_admin === user.id);
    setCurrentAnggota(matchedAnggota || null);
    localStorage.setItem('perpus_session_user', JSON.stringify(user));

    return { success: true, message: `Selamat datang kembali, ${user.username}!`, role: user.type };
  };

  const logout = () => {
    setCurrentUser(null);
    setCurrentAnggota(null);
    localStorage.removeItem('perpus_session_user');
    window.location.href = '/login';
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        currentAnggota,
        isAdmin: currentUser?.type === 'ADM',
        isMember: currentUser?.type === 'MBR',
        isAuthReady,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
