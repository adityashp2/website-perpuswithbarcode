'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { AdminUser, Anggota } from '@/types/database';
import { useData } from './dataContext';

interface AuthContextType {
  currentUser: AdminUser | null;
  currentAnggota: Anggota | null;
  isAdmin: boolean;
  isMember: boolean;
  login: (username: string) => { success: boolean; message: string };
  logout: () => void;
  switchRoleQuick: (type: 'ADM' | 'MBR') => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { adminUsers, anggota } = useData();
  const [currentUser, setCurrentUser] = useState<AdminUser | null>(null);
  const [currentAnggota, setCurrentAnggota] = useState<Anggota | null>(null);

  useEffect(() => {
    // Check saved session in localStorage
    try {
      const savedUser = localStorage.getItem('perpus_session_user');
      if (savedUser) {
        const parsed = JSON.parse(savedUser) as AdminUser;
        const found = adminUsers.find((u) => u.id === parsed.id) || parsed;
        if (!found.is_banned) {
          setCurrentUser(found);
          const matchedAnggota = anggota.find((a) => a.id_admin === found.id);
          setCurrentAnggota(matchedAnggota || null);
        } else {
          localStorage.removeItem('perpus_session_user');
        }
      }
    } catch (e) {
      console.error(e);
    }
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

    return { success: true, message: `Selamat datang kembali, ${user.username}!` };
  };

  const logout = () => {
    setCurrentUser(null);
    setCurrentAnggota(null);
    localStorage.removeItem('perpus_session_user');
  };

  const switchRoleQuick = (type: 'ADM' | 'MBR') => {
    const target = adminUsers.find((u) => u.type === type && !u.is_banned);
    if (target) {
      setCurrentUser(target);
      const matchedAnggota = anggota.find((a) => a.id_admin === target.id);
      setCurrentAnggota(matchedAnggota || null);
      localStorage.setItem('perpus_session_user', JSON.stringify(target));
    }
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        currentAnggota,
        isAdmin: currentUser?.type === 'ADM',
        isMember: currentUser?.type === 'MBR',
        login,
        logout,
        switchRoleQuick,
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
