'use client';

import { useAuth } from '@/components/AuthProvider';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function AdminDashboard() {
    const { user, loading, logout, isAuthenticated } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading && !isAuthenticated) {
            router.push('/login');
        }
    }, [loading, isAuthenticated, router]);

    if (loading || !user) return <div className="p-8 text-center">Loading...</div>;

    return (
        <div className="min-h-screen p-8">
            <div className="max-w-6xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-800">Admin Dashboard</h1>
                    <button onClick={logout} className="btn bg-red-600 text-white hover:bg-red-700 px-4 py-2 rounded">
                        Logout
                    </button>
                </div>

                <div className="card bg-white p-6 rounded-lg shadow-sm border border-gray-100 mb-8">
                    <h2 className="text-2xl font-semibold mb-2 text-gray-800">Overview</h2>
                    <p className="text-gray-600">Manage cohorts, users, and teams from here.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <Link href="/admin/dashboard/teams" className="block group">
                        <div className="card bg-white p-6 rounded-lg shadow-sm border border-gray-200 group-hover:border-indigo-400 transition-colors h-full">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-xl font-semibold text-gray-800">Team Matching</h3>
                                <svg className="w-6 h-6 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                                </svg>
                            </div>
                            <p className="text-gray-600">
                                View student preferences and generate teams for each cohort.
                            </p>
                            <div className="mt-4 text-indigo-600 font-medium group-hover:underline">Manage Teams &rarr;</div>
                        </div>
                    </Link>

                    {/* Placeholder for Cohort Management */}
                    <div className="card bg-white p-6 rounded-lg shadow-sm border border-gray-200 flex flex-col justify-between opacity-75">
                        <div>
                            <h3 className="text-xl font-semibold text-gray-800 mb-2">Cohort Management</h3>
                            <p className="text-sm text-gray-500">Create and manage student cohorts.</p>
                        </div>
                        <button disabled className="mt-4 text-sm text-gray-400 bg-gray-100 py-1 px-3 rounded w-fit cursor-not-allowed">Coming Soon</button>
                    </div>

                    {/* Placeholder for User Management */}
                    <div className="card bg-white p-6 rounded-lg shadow-sm border border-gray-200 flex flex-col justify-between opacity-75">
                        <div>
                            <h3 className="text-xl font-semibold text-gray-800 mb-2">User Management</h3>
                            <p className="text-sm text-gray-500">Add or remove students and professors.</p>
                        </div>
                        <button disabled className="mt-4 text-sm text-gray-400 bg-gray-100 py-1 px-3 rounded w-fit cursor-not-allowed">Coming Soon</button>
                    </div>
                </div>
            </div>
        </div>
    );
}
