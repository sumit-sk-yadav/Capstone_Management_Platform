'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/components/AuthProvider';
import api from '@/lib/api';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Cohort {
    id: number;
    name: string;
    min_team_size: number;
    max_team_size: number;
    allow_solo_projects: boolean;
    auto_matching_strategy: string;
    team_formation_deadline: string | null;
}

export default function CohortSettingsPage({ params }: { params: { id: string } }) {
    const { id } = params;
    const { user } = useAuth();
    const router = useRouter();
    const [cohort, setCohort] = useState<Cohort | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [showWarning, setShowWarning] = useState(false);

    useEffect(() => {
        fetchCohort();
    }, [id]);

    const fetchCohort = async () => {
        try {
            const res = await api.get(`/api/students/cohorts/${id}/`);
            setCohort(res.data);
        } catch (err) {
            setError('Failed to fetch cohort settings');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (force = false) => {
        if (!cohort) return;

        if (cohort.min_team_size > cohort.max_team_size) {
            setError('Minimum team size cannot be greater than maximum team size');
            return;
        }

        // Unusual values check
        if (!force && (cohort.min_team_size < 2 || cohort.max_team_size > 15)) {
            setShowWarning(true);
            return;
        }

        setSaving(true);
        setError('');
        setSuccess('');

        try {
            await api.patch(`/api/students/cohorts/${id}/`, {
                min_team_size: cohort.min_team_size,
                max_team_size: cohort.max_team_size,
                allow_solo_projects: cohort.allow_solo_projects,
                auto_matching_strategy: cohort.auto_matching_strategy,
                team_formation_deadline: cohort.team_formation_deadline
            });
            setSuccess('Settings updated successfully');
            setShowWarning(false);
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to save settings');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="p-8 text-center">Loading settings...</div>;
    if (!cohort) return <div className="p-8 text-center text-red-600">Cohort not found</div>;

    return (
        <div className="max-w-4xl mx-auto p-6 space-y-8">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-gray-900">Cohort Settings: {cohort.name}</h1>
                <Link href="/admin/dashboard/teams" className="text-gray-500 hover:text-gray-700">
                    Cancel
                </Link>
            </div>

            {error && <div className="bg-red-50 text-red-700 p-4 rounded-lg border border-red-200">{error}</div>}
            {success && <div className="bg-green-50 text-green-700 p-4 rounded-lg border border-green-200">{success}</div>}

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-2">
                        <label className="block font-semibold text-gray-700">Minimum Team Size</label>
                        <input
                            type="number"
                            value={cohort.min_team_size}
                            onChange={(e) => setCohort({ ...cohort, min_team_size: parseInt(e.target.value) || 0 })}
                            className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                        />
                        <p className="text-sm text-gray-500">The smallest allowed number of students per team.</p>
                    </div>

                    <div className="space-y-2">
                        <label className="block font-semibold text-gray-700">Maximum Team Size</label>
                        <input
                            type="number"
                            value={cohort.max_team_size}
                            onChange={(e) => setCohort({ ...cohort, max_team_size: parseInt(e.target.value) || 0 })}
                            className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                        />
                        <p className="text-sm text-gray-500">The largest allowed number of students per team.</p>
                    </div>
                </div>

                <div className="space-y-4 pt-4 border-t border-gray-100">
                    <div className="flex items-center gap-3">
                        <input
                            type="checkbox"
                            id="allow_solo"
                            checked={cohort.allow_solo_projects}
                            onChange={(e) => setCohort({ ...cohort, allow_solo_projects: e.target.checked })}
                            className="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500"
                        />
                        <label htmlFor="allow_solo" className="font-semibold text-gray-700 cursor-pointer">
                            Allow Solo Projects
                        </label>
                    </div>
                    <p className="text-sm text-gray-500 ml-8">When enabled, admins can assign students to individual projects. Students cannot request this themselves.</p>
                </div>

                <div className="space-y-2 pt-4 border-t border-gray-100">
                    <label className="block font-semibold text-gray-700">Auto-Matching Strategy</label>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {['balanced', 'preference_based', 'fill_existing'].map((strategy) => (
                            <button
                                key={strategy}
                                onClick={() => setCohort({ ...cohort, auto_matching_strategy: strategy })}
                                className={`p-3 border rounded-lg text-sm font-medium transition-all ${cohort.auto_matching_strategy === strategy
                                    ? 'bg-indigo-50 border-indigo-500 text-indigo-700 shadow-sm'
                                    : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
                                    }`}
                            >
                                {strategy.replace('_', ' ').charAt(0).toUpperCase() + strategy.replace('_', ' ').slice(1)}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="space-y-2 pt-4 border-t border-gray-100">
                    <label className="block font-semibold text-gray-700">Formation Deadline</label>
                    <input
                        type="datetime-local"
                        value={cohort.team_formation_deadline?.slice(0, 16) || ''}
                        onChange={(e) => setCohort({ ...cohort, team_formation_deadline: e.target.value })}
                        className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                    <p className="text-sm text-gray-500">Deadline for students to find teams before auto-matching is suggested.</p>
                </div>

                {showWarning && (
                    <div className="bg-amber-50 border border-amber-200 p-4 rounded-lg flex items-start gap-3">
                        <svg className="w-6 h-6 text-amber-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        <div>
                            <p className="font-semibold text-amber-800">Unusual Team Sizes</p>
                            <p className="text-sm text-amber-700 mb-4">You've entered team sizes that might be impractical. Are you sure you want to proceed?</p>
                            <div className="flex gap-4">
                                <button
                                    onClick={() => handleSave(true)}
                                    className="bg-amber-600 text-white px-3 py-1.5 rounded text-sm font-medium hover:bg-amber-700"
                                >
                                    Yes, Save Anyway
                                </button>
                                <button
                                    onClick={() => setShowWarning(false)}
                                    className="bg-white border border-amber-300 text-amber-700 px-3 py-1.5 rounded text-sm font-medium hover:bg-amber-50"
                                >
                                    Review Values
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                <div className="pt-6 border-t border-gray-100 flex gap-4">
                    <button
                        onClick={() => handleSave()}
                        disabled={saving}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-lg font-bold shadow-lg shadow-indigo-200 transition-all disabled:opacity-50"
                    >
                        {saving ? 'Saving...' : 'Save Settings'}
                    </button>
                    <Link
                        href={`/admin/dashboard/teams`}
                        className="p-3 text-gray-600 font-medium hover:text-gray-900"
                    >
                        Back to Teams
                    </Link>
                </div>
            </div>
        </div>
    );
}
