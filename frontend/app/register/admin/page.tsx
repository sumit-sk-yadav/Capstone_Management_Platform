'use client';

import { useState } from 'react';
import { useAuth } from '@/components/AuthProvider';
import Link from 'next/link';

export default function AdminRegistration() {
    const { registerAdmin } = useAuth();
    const [formData, setFormData] = useState({
        email: '',
        username: '',
        password: '',
        password2: '',
        first_name: '',
        last_name: '',
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        if (formData.password !== formData.password2) {
            setError('Passwords do not match');
            setLoading(false);
            return;
        }

        try {
            await registerAdmin(formData);
        } catch (err: any) {
            setError(err.message);
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4">
            <div className="card max-w-[500px] w-full">
                <div className="text-center mb-6">
                    <h1 className="text-2xl font-extrabold text-gradient mb-1">Admin Registration</h1>
                    <p className="text-gray-500 text-sm font-medium">Create administrative account</p>
                </div>

                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-6 text-sm flex items-center">
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest pl-1">First Name</label>
                            <input
                                type="text"
                                required
                                className="input"
                                value={formData.first_name}
                                onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                                placeholder="Admin"
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest pl-1">Last Name</label>
                            <input
                                type="text"
                                required
                                className="input"
                                value={formData.last_name}
                                onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                                placeholder="User"
                            />
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest pl-1">Username</label>
                        <input
                            type="text"
                            required
                            className="input"
                            value={formData.username}
                            onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                            placeholder="adminuser"
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest pl-1">Email Address</label>
                        <input
                            type="email"
                            required
                            className="input"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            placeholder="admin@university.edu"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest pl-1">Password</label>
                            <input
                                type="password"
                                required
                                className="input"
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                placeholder="••••••••"
                                minLength={8}
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest pl-1">Confirm</label>
                            <input
                                type="password"
                                required
                                className="input"
                                value={formData.password2}
                                onChange={(e) => setFormData({ ...formData, password2: e.target.value })}
                                placeholder="••••••••"
                                minLength={8}
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full btn btn-primary mt-4"
                    >
                        {loading ? 'Creating Account...' : 'Register as Admin'}
                    </button>
                </form>

                <div className="mt-6 text-center text-sm">
                    <p className="text-gray-400 text-xs font-semibold uppercase tracking-widest">
                        Already have an account?{' '}
                        <Link href="/login" className="text-capstone-teal hover:text-capstone-blue transition-colors ml-1">
                            Log in
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
