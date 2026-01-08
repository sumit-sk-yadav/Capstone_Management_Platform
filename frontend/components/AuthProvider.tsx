'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { setTokens, removeTokens, isAuthenticated as checkAuth } from '@/lib/auth';
import { User, AuthContextType, LoginData, RegisterData, LoginResponse } from '@/types/auth';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        // Check for existing session on mount
        const loadUser = async () => {
            if (checkAuth()) {
                try {
                    const response = await api.get('/api/auth/me/');
                    setUser(response.data);
                } catch (error) {
                    console.error('Failed to load user:', error);
                    removeTokens();
                }
            }
            setLoading(false);
        };

        loadUser();
    }, []);

    const login = async (data: LoginData) => {
        try {
            const response = await api.post<LoginResponse>('/api/auth/login/', data);
            const { user, tokens } = response.data;

            setTokens(tokens.access, tokens.refresh);
            setUser(user);

            // Redirect based on role
            const dashboardMap = {
                admin: '/dashboard/admin',
                student: '/dashboard/student',
                professor: '/dashboard/professor',
            };
            router.push(dashboardMap[user.role] || '/dashboard');
        } catch (error: any) {
            const message = error.response?.data?.error || 'Login failed';
            throw new Error(message);
        }
    };

    const registerStudent = async (data: RegisterData) => {
        try {
            const response = await api.post<LoginResponse>('/api/auth/register/student/', data);
            const { user, tokens } = response.data;

            setTokens(tokens.access, tokens.refresh);
            setUser(user);
            router.push('/dashboard/student');
        } catch (error: any) {
            const message = error.response?.data?.email?.[0] ||
                error.response?.data?.password?.[0] ||
                'Registration failed';
            throw new Error(message);
        }
    };

    const registerProfessor = async (data: RegisterData) => {
        try {
            const response = await api.post<LoginResponse>('/api/auth/register/professor/', data);
            const { user, tokens } = response.data;

            setTokens(tokens.access, tokens.refresh);
            setUser(user);
            router.push('/dashboard/professor');
        } catch (error: any) {
            const message = error.response?.data?.email?.[0] ||
                error.response?.data?.password?.[0] ||
                'Registration failed';
            throw new Error(message);
        }
    };

    const registerAdmin = async (data: RegisterData) => {
        try {
            const response = await api.post<LoginResponse>('/api/auth/register/admin/', data);
            const { user, tokens } = response.data;

            setTokens(tokens.access, tokens.refresh);
            setUser(user);
            router.push('/dashboard/admin');
        } catch (error: any) {
            const message = error.response?.data?.email?.[0] ||
                error.response?.data?.password?.[0] ||
                'Registration failed';
            throw new Error(message);
        }
    };

    const logout = () => {
        removeTokens();
        setUser(null);
        router.push('/');
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                loading,
                login,
                registerStudent,
                registerProfessor,
                registerAdmin,
                logout,
                isAuthenticated: !!user,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
