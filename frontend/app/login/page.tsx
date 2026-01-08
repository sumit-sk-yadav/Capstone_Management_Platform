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
            <div className="card max-w-[420px] w-full">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-extrabold text-gradient mb-2">Capstone Central</h1>
                    <p className="text-gray-500 font-medium">Welcome back!</p>
                </div>

                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-6 text-sm flex items-center">
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="space-y-1">
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest pl-1">Email Address</label>
                        <input
                            type="email"
                            required
                            className="input"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            placeholder="name@university.edu"
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest pl-1">Password</label>
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
                        className="w-full btn btn-primary mt-2"
                    >
                        {loading ? 'Logging in...' : 'Log in'}
                    </button>
                </form>

                <div className="mt-8 text-center space-y-4">
                    <p className="text-gray-400 text-xs font-semibold uppercase tracking-widest">
                        New to Capstone Central?
                    </p>
                    <div className="flex flex-wrap justify-center gap-3 text-sm font-medium">
                        <Link href="/register/student" className="text-capstone-teal hover:text-capstone-blue transition-colors">
                            Student
                        </Link>
                        <span className="text-gray-300">•</span>
                        <Link href="/register/professor" className="text-capstone-teal hover:text-capstone-blue transition-colors">
                            Professor
                        </Link>
                        <span className="text-gray-300">•</span>
                        <Link href="/register/admin" className="text-capstone-teal hover:text-capstone-blue transition-colors">
                            Admin
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
