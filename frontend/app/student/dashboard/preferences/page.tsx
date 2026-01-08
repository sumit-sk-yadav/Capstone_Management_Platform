'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/components/AuthProvider';
import api from '@/lib/api';

interface Student {
    id: number;
    student_id: string;
    first_name: string;
    last_name: string;
    email: string;
}

interface Preference {
    id: number;
    preferred_student: number;
    preferred_student_details: Student;
    rank: number;
}

export default function StudentPreferencesPage() {
    const { user } = useAuth();
    const [preferences, setPreferences] = useState<Preference[]>([]);
    const [candidates, setCandidates] = useState<Student[]>([]);
    const [selectedCandidate, setSelectedCandidate] = useState<string>('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        if (user) {
            fetchData();
        }
    }, [user]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [prefRes, candRes] = await Promise.all([
                api.get('/api/students/preferences/'),
                api.get('/api/students/preferences/candidates/')
            ]);

            setPreferences(prefRes.data);
            setCandidates(candRes.data);
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to fetch data');
        } finally {
            setLoading(false);
        }
    };

    const handleAddPreference = async () => {
        if (!selectedCandidate) return;
        setError('');
        setSuccess('');

        try {
            const res = await api.post('/api/students/preferences/', {
                preferred_student: parseInt(selectedCandidate),
                rank: preferences.length + 1
            });

            setSuccess('Preference added successfully!');
            fetchData(); // Refresh list
            setSelectedCandidate('');
        } catch (err: any) {
            setError(err.response?.data?.non_field_errors?.[0] || err.response?.data?.error || 'Failed to add preference');
        }
    };

    const handleDeletePreference = async (id: number) => {
        if (!confirm('Are you sure you want to remove this preference?')) return;

        try {
            await api.delete(`/api/students/preferences/${id}/`);

            setPreferences(preferences.filter(p => p.id !== id));
            setSuccess('Preference removed.');
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to delete');
        }
    };

    if (loading) return <div className="p-8 text-center text-gray-500">Loading preferences...</div>;

    return (
        <div className="max-w-4xl mx-auto p-6">
            <h1 className="text-3xl font-bold mb-6 text-gray-800">Team Preferences</h1>
            <p className="mb-8 text-gray-600">
                Nominate students you would like to work with. This helps us form teams, but guarantees are not always possible.
            </p>

            {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded mb-6">
                    {error}
                </div>
            )}
            {success && (
                <div className="bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded mb-6">
                    {success}
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Selection Card */}
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 h-fit">
                    <h2 className="text-lg font-semibold mb-4 text-gray-700">Add Preference</h2>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-500 mb-1">Select Student</label>
                            <select
                                className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                                value={selectedCandidate}
                                onChange={(e) => setSelectedCandidate(e.target.value)}
                            >
                                <option value="">-- Choose a classmate --</option>
                                {candidates.map(student => (
                                    <option key={student.id} value={student.id}>
                                        {student.first_name} {student.last_name} ({student.email})
                                    </option>
                                ))}
                            </select>
                        </div>
                        <button
                            onClick={handleAddPreference}
                            disabled={!selectedCandidate}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                        >
                            Add to Preferences
                        </button>
                    </div>
                </div>

                {/* List Card */}
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                    <h2 className="text-lg font-semibold mb-4 text-gray-700">Your Nominations</h2>
                    {preferences.length === 0 ? (
                        <p className="text-gray-400 italic text-sm">No preferences added yet.</p>
                    ) : (
                        <ul className="space-y-3">
                            {preferences.map((pref) => (
                                <li key={pref.id} className="flex items-center justify-between p-3 bg-gray-50 rounded group hover:bg-blue-50 transition-colors">
                                    <div>
                                        <div className="font-medium text-gray-800">
                                            {pref.preferred_student_details.first_name} {pref.preferred_student_details.last_name}
                                        </div>
                                        <div className="text-xs text-gray-500">
                                            Rank: {pref.rank}
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => handleDeletePreference(pref.id)}
                                        className="text-red-400 hover:text-red-600 p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                        title="Remove"
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>
        </div>
    );
}
