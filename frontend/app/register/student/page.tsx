'use client';

import { useState } from 'react';
import { useAuth } from '@/components/AuthProvider';
import Link from 'next/link';

export default function StudentRegistration() {
    const { registerStudent } = useAuth();
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
            await registerStudent(formData);
        } catch (err: any) {
            setError(err.message);
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4">
            <div className="card max-w-md w-full">
                <h1 className="text-3xl font-bold mb-6 text-center">Student Registration</h1>

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
                            placeholder="student@example.com"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">Username</label>
                        <input
                            type="text"
                            required
                            className="input"
                            value={formData.username}
                            onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                            placeholder="studentuser"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">First Name</label>
                            <input
                                type="text"
                                required
                                className="input"
                                value={formData.first_name}
                                onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                                placeholder="John"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Last Name</label>
                            <input
                                type="text"
                                required
                                className="input"
                                value={formData.last_name}
                                onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                                placeholder="Doe"
                            />
                        </div>
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
                            minLength={8}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">Confirm Password</label>
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

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full btn btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? 'Creating Account...' : 'Register as Student'}
                    </button>
                </form>

                <div className="mt-6 text-center text-sm">
                    <p className="text-gray-600 dark:text-gray-400">
                        Already have an account?{' '}
                        <Link href="/login" className="text-blue-600 hover:underline">
                            Login here
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
