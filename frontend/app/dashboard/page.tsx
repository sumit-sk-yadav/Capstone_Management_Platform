'use client';

import { useEffect } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function Dashboard() {
    const { user, loading, logout, isAuthenticated } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading && !isAuthenticated) {
            router.push('/login');
        }
    }, [loading, isAuthenticated, router]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600 dark:text-gray-400">Loading...</p>
                </div>
            </div>
        );
    }

    if (!user) {
        return null;
    }

    return (
        <div className="min-h-screen p-8">
            <div className="max-w-4xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-bold">Dashboard</h1>
                    <button onClick={logout} className="btn bg-red-600 text-white hover:bg-red-700">
                        Logout
                    </button>
                </div>

                <div className="card mb-6">
                    <h2 className="text-2xl font-semibold mb-4">Welcome, {user.first_name}!</h2>

                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                            <span className="font-medium">Email:</span> {user.email}
                        </div>
                        <div>
                            <span className="font-medium">Username:</span> {user.username}
                        </div>
                        <div>
                            <span className="font-medium">Role:</span>{' '}
                            <span className="capitalize px-2 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 rounded">
                                {user.role}
                            </span>
                        </div>
                        <div>
                            <span className="font-medium">Joined:</span>{' '}
                            {new Date(user.date_joined).toLocaleDateString()}
                        </div>
                    </div>
                </div>

                {user.role === 'student' && (
                    <div className="card">
                        <h3 className="text-xl font-semibold mb-4">Student Dashboard</h3>
                        <p className="text-gray-600 dark:text-gray-400">
                            Student-specific features will be added here (capstone projects, team management, etc.)
                        </p>
                    </div>
                )}

                {user.role === 'professor' && (
                    <div className="card">
                        <h3 className="text-xl font-semibold mb-4">Professor Dashboard</h3>
                        <p className="text-gray-600 dark:text-gray-400">
                            Professor-specific features will be added here (project reviews, student evaluation, etc.)
                        </p>
                    </div>
                )}

                {user.role === 'admin' && (
                    <div className="card">
                        <h3 className="text-xl font-semibold mb-4">Admin Dashboard</h3>
                        <p className="text-gray-600 dark:text-gray-400">
                            Admin-specific features will be added here (user management, cohort management, etc.)
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
