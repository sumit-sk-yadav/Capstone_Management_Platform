'use client';

import { useEffect } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function Dashboard() {
    const { user, loading, logout, isAuthenticated } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading) {
            if (!isAuthenticated) {
                router.push('/login');
            } else if (user) {
                const dashboardMap = {
                    admin: '/admin/dashboard',
                    student: '/student/dashboard',
                    professor: '/professor/dashboard',
                };
                router.push(dashboardMap[user.role as keyof typeof dashboardMap] || '/dashboard');
            }
        }
    }, [loading, isAuthenticated, user, router]);

    return (
        <div className="min-h-screen flex items-center justify-center">
            <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-4 text-gray-600 dark:text-gray-400">Loading your dashboard...</p>
            </div>
        </div>
    );
}
