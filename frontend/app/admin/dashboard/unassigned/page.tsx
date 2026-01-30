'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/components/AuthProvider';
import api from '@/lib/api';
import Link from 'next/link';

interface Student {
    id: number;
    student_id: string;
    first_name: string;
    last_name: string;
    email: string;
    seeking_team: boolean;
    assignment_status: string;
}

interface Cohort {
    id: number;
    name: string;
    total_students: number;
    students_with_teams: number;
    students_without_teams: number;
}

export default function UnassignedStudentsPage() {
    const { user } = useAuth();
    const [cohorts, setCohorts] = useState<Cohort[]>([]);
    const [selectedCohort, setSelectedCohort] = useState<string>('');
    const [unassignedStudents, setUnassignedStudents] = useState<Student[]>([]);
    const [loading, setLoading] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        fetchCohorts();
    }, []);

    useEffect(() => {
        if (selectedCohort) {
            fetchUnassignedStudents(selectedCohort);
        } else {
            setUnassignedStudents([]);
        }
    }, [selectedCohort]);

    const fetchCohorts = async () => {
        try {
            const res = await api.get('/api/students/cohorts/');
            setCohorts(res.data);
            if (res.data.length > 0 && !selectedCohort) {
                setSelectedCohort(res.data[0].id.toString());
            }
        } catch (err) {
            console.error('Failed to fetch cohorts', err);
        }
    };

    const fetchUnassignedStudents = async (cohortId: string) => {
        setLoading(true);
        setError('');
        try {
            const res = await api.get(`/api/students/teams/unassigned/?cohort_id=${cohortId}`);
            setUnassignedStudents(res.data.students);
        } catch (err: any) {
            setError('Failed to fetch unassigned students');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleAutoMatch = async () => {
        if (!selectedCohort) return;
        setActionLoading(true);
        setError('');
        setSuccess('');
        try {
            const res = await api.post('/api/students/teams/auto_match/', { cohort_id: selectedCohort });
            setSuccess(res.data.message);
            fetchUnassignedStudents(selectedCohort);
        } catch (err: any) {
            setError(err.response?.data?.error || 'Auto-match failed');
        } finally {
            setActionLoading(false);
        }
    };

    const handleAssignSolo = async (studentId: number) => {
        if (!selectedCohort) return;
        setActionLoading(true);
        setError('');
        try {
            await api.post('/api/students/profiles/assign_solo_projects/', {
                cohort_id: selectedCohort,
                student_ids: [studentId]
            });
            setSuccess('Assigned solo project successfully');
            fetchUnassignedStudents(selectedCohort);
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to assign solo project');
        } finally {
            setActionLoading(false);
        }
    };

    if (!user) return <div className="p-8 text-center">Loading...</div>;

    return (
        <div className="max-w-6xl mx-auto p-6 space-y-8">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-gray-900">Unassigned Students</h1>
                <div className="flex gap-4">
                    <select
                        className="p-2 border rounded-lg bg-white shadow-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                        value={selectedCohort}
                        onChange={(e) => setSelectedCohort(e.target.value)}
                    >
                        <option value="">Select Cohort</option>
                        {cohorts.map(c => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                    </select>
                    <button
                        onClick={handleAutoMatch}
                        disabled={!selectedCohort || actionLoading || loading}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50"
                    >
                        {actionLoading ? 'Processing...' : 'Auto-Match All'}
                    </button>
                </div>
            </div>

            {error && <div className="bg-red-50 text-red-700 p-4 rounded-lg border border-red-200">{error}</div>}
            {success && <div className="bg-green-50 text-green-700 p-4 rounded-lg border border-green-200">{success}</div>}

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                {loading ? (
                    <div className="p-12 text-center text-gray-500">Loading unassigned students...</div>
                ) : unassignedStudents.length > 0 ? (
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50 border-b border-gray-200">
                                <th className="p-4 font-semibold text-gray-700">Name</th>
                                <th className="p-4 font-semibold text-gray-700">Email</th>
                                <th className="p-4 font-semibold text-gray-700">ID</th>
                                <th className="p-4 font-semibold text-gray-700">Status</th>
                                <th className="p-4 font-semibold text-gray-700">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {unassignedStudents.map((student) => (
                                <tr key={student.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                                    <td className="p-4 font-medium text-gray-800">{student.first_name} {student.last_name}</td>
                                    <td className="p-4 text-gray-600">{student.email}</td>
                                    <td className="p-4 text-gray-600 text-sm font-mono">{student.student_id}</td>
                                    <td className="p-4">
                                        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-orange-100 text-orange-700">
                                            {student.assignment_status}
                                        </span>
                                    </td>
                                    <td className="p-4">
                                        <button
                                            onClick={() => handleAssignSolo(student.id)}
                                            className="text-indigo-600 hover:text-indigo-800 font-medium text-sm"
                                        >
                                            Assign Solo
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : (
                    <div className="p-12 text-center">
                        <div className="text-gray-400 mb-2">
                            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <p className="text-gray-600 font-medium text-lg">All students are assigned!</p>
                        <p className="text-gray-500">No unassigned students found for this cohort.</p>
                    </div>
                )}
            </div>

            <div className="flex justify-start">
                <Link href="/admin/dashboard/teams" className="text-indigo-600 hover:underline flex items-center gap-2">
                    &larr; Back to Team Management
                </Link>
            </div>
        </div>
    );
}
