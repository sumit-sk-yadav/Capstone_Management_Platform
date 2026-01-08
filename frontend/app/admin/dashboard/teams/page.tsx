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
    team: number | null;
}

interface Team {
    id: number;
    name: string;
    members: Student[];
}

interface Cohort {
    id: number;
    name: string;
}

export default function AdminTeamsPage() {
    const { user } = useAuth();
    const [cohorts, setCohorts] = useState<Cohort[]>([]);
    const [selectedCohort, setSelectedCohort] = useState<string>('');
    const [teams, setTeams] = useState<Team[]>([]);
    const [loading, setLoading] = useState(false);
    const [generating, setGenerating] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        fetchCohorts();
    }, []);

    useEffect(() => {
        if (selectedCohort) {
            fetchTeams(selectedCohort);
        } else {
            setTeams([]);
        }
    }, [selectedCohort]);

    const fetchCohorts = async () => {
        try {
            const res = await api.get('/api/students/cohorts/');
            setCohorts(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    const fetchTeams = async (cohortId: string) => {
        setLoading(true);
        try {
            const res = await api.get(`/api/students/team-matching/list_teams/?cohort_id=${cohortId}`);
            setTeams(res.data);
        } catch (err: any) {
            setError('Failed to fetch teams');
        } finally {
            setLoading(false);
        }
    };

    const handleGenerateTeams = async () => {
        if (!selectedCohort || !confirm('This will recreate teams based on preferences. Existing teams fitting the algorithm may be changed. Continue?')) return;

        setGenerating(true);
        setError('');
        setSuccess('');

        try {
            const res = await api.post('/api/students/team-matching/generate/', {
                cohort_id: selectedCohort
            });
            setSuccess(res.data.message);
            fetchTeams(selectedCohort);
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to generate teams');
        } finally {
            setGenerating(false);
        }
    };

    return (
        <div className="max-w-6xl mx-auto p-6">
            <h1 className="text-3xl font-bold mb-6 text-gray-800">Team Management</h1>

            <div className="flex flex-col md:flex-row gap-4 mb-8 items-end">
                <div className="w-full md:w-64">
                    <label className="block text-sm font-medium text-gray-500 mb-1">Select Cohort</label>
                    <select
                        className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                        value={selectedCohort}
                        onChange={(e) => setSelectedCohort(e.target.value)}
                    >
                        <option value="">-- Select Cohort --</option>
                        {cohorts.map(c => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                    </select>
                </div>

                <div className="flex gap-2">
                    <button
                        onClick={handleGenerateTeams}
                        disabled={!selectedCohort || generating}
                        className="btn btn-primary bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded disabled:opacity-50"
                    >
                        {generating ? 'Generating...' : 'Auto-Generate Teams'}
                    </button>
                    {/* Placeholder for manual create */}
                    <button
                        disabled
                        className="btn bg-gray-200 text-gray-500 px-4 py-2 rounded cursor-not-allowed"
                        title="Coming soon"
                    >
                        Create Team
                    </button>
                </div>
            </div>

            {error && <div className="bg-red-50 text-red-600 p-4 rounded mb-6">{error}</div>}
            {success && <div className="bg-green-50 text-green-600 p-4 rounded mb-6">{success}</div>}

            {loading ? (
                <div className="text-center p-8 text-gray-500">Loading teams...</div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {teams.map(team => (
                        <div key={team.id} className="bg-white rounded-lg shadow border border-gray-100 p-4">
                            <h3 className="font-bold text-lg mb-3 text-gray-800 border-b pb-2 flex justify-between">
                                {team.name}
                                <span className="text-xs font-normal text-gray-500 mt-1">{team.members.length} members</span>
                            </h3>
                            {team.members.length > 0 ? (
                                <ul className="space-y-2">
                                    {team.members.map(member => (
                                        <li key={member.id} className="text-sm flex items-center justify-between text-gray-700 bg-gray-50 p-2 rounded">
                                            <span>{member.first_name} {member.last_name}</span>
                                            {/* Future: Drag handle or Move button */}
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="text-gray-400 text-sm italic">No members assigned.</p>
                            )}
                        </div>
                    ))}
                    {teams.length === 0 && selectedCohort && !loading && (
                        <div className="col-span-full text-center py-12 text-gray-400 bg-gray-50 rounded border border-dashed">
                            No teams found. Try generating them!
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
