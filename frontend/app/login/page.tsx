'use client';

import { useState } from 'react';
import { useAuth } from '@/components/AuthProvider';
import Link from 'next/link';

export default function LoginPage() {
    const { login } = useAuth();
    const [formData, setFormData] = useState({
        email: '',
        password: '',
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            await login(formData);
        } catch (err: any) {
            setError(err.message);
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4">
            <div className="card max-w-md w-full">
                <h1 className="text-3xl font-bold mb-6 text-center">Login</h1>
                <p className="text-center text-gray-600 dark:text-gray-400 mb-6">
                    Welcome back! Please login to your account.
                </p>

                {error && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Email</label>
                        <input
                            type="email"
                            required
                            className="input"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            placeholder="your@email.com"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">Password</label>
                        <input
                            type="password"
                            required
                            className="input"
                            value={formData.password}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            placeholder="••••••••"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full btn btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? 'Logging in...' : 'Login'}
                    </button>
                </form>

                <div className="mt-6 space-y-2 text-center text-sm">
                    <p className="text-gray-600 dark:text-gray-400">
                        Don't have an account?
                    </p>
                    <div className="flex flex-wrap gap-4 justify-center">
                        <Link href="/register/student" className="text-blue-600 hover:underline">
                            Student
                        </Link>
                        <span className="text-gray-400">|</span>
                        <Link href="/register/professor" className="text-blue-600 hover:underline">
                            Professor
                        </Link>
                        <span className="text-gray-400">|</span>
                        <Link href="/register/admin" className="text-blue-600 hover:underline">
                            Admin
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
