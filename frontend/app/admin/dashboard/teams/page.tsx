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
    is_solo: boolean;
}

interface Team {
    id: number;
    name: string;
    members: Student[];
    member_count: number;
}

interface Cohort {
    id: number;
    name: string;
    start_date: string;
    end_date: string;
    is_active: boolean;
    teams_locked: boolean;
    total_students: number;
    students_with_teams: number;
    students_without_teams: number;
}

export default function AdminTeamsPage() {
    const { user } = useAuth();
    const [cohorts, setCohorts] = useState<Cohort[]>([]);
    const [selectedCohort, setSelectedCohort] = useState<string>('');
    const [selectedCohortData, setSelectedCohortData] = useState<Cohort | null>(null);
    const [teams, setTeams] = useState<Team[]>([]);
    const [students, setStudents] = useState<Student[]>([]);
    const [teamSize, setTeamSize] = useState<number>(4);
    const [loading, setLoading] = useState(false);
    const [generating, setGenerating] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        fetchCohorts();
    }, []);

    useEffect(() => {
        if (selectedCohort) {
            fetchCohortData(selectedCohort);
        } else {
            setTeams([]);
            setStudents([]);
            setSelectedCohortData(null);
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

    const fetchCohortData = async (cohortId: string) => {
        setLoading(true);
        setError('');
        try {
            const [teamsRes, studentsRes, cohortRes] = await Promise.all([
                api.get(`/api/students/team-matching/list_teams/?cohort_id=${cohortId}`),
                api.get(`/api/students/cohorts/${cohortId}/students/`),
                api.get(`/api/students/cohorts/${cohortId}/`)
            ]);
            setTeams(teamsRes.data);
            setStudents(studentsRes.data);
            setSelectedCohortData(cohortRes.data);
        } catch (err: any) {
            setError('Failed to fetch cohort data');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleGenerateTeams = async () => {
        if (!selectedCohort || !confirm(`This will recreate teams with a target size of ${teamSize} members. Existing teams will be replaced. Continue?`)) return;

        setGenerating(true);
        setError('');
        setSuccess('');

        try {
            const res = await api.post('/api/students/team-matching/generate/', {
                cohort_id: selectedCohort,
                team_size: teamSize
            });
            setSuccess(res.data.message);
            fetchCohortData(selectedCohort);
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to generate teams');
        } finally {
            setGenerating(false);
        }
    };

    const handleDissolveTeams = async () => {
        if (!selectedCohort || !confirm('Are you sure you want to dissolve all teams? This will move all team members to unassigned.')) return;

        setLoading(true);
        try {
            const res = await api.post('/api/students/team-matching/dissolve_teams/', {
                cohort_id: selectedCohort
            });
            setSuccess(res.data.message);
            fetchCohortData(selectedCohort);
        } catch (err: any) {
            console.error("Failed to dissolve teams:", err);
            setError(err.response?.data?.error || 'Failed to dissolve teams');
            setLoading(false);
        }
    };

    const handleToggleLock = async () => {
        if (!selectedCohort) return;
        try {
            const res = await api.post(`/api/students/cohorts/${selectedCohort}/toggle_lock/`);
            if (selectedCohortData) {
                setSelectedCohortData({
                    ...selectedCohortData,
                    teams_locked: res.data.teams_locked
                });
            }
        } catch (err: any) {
            console.error("Failed to toggle lock:", err);
            alert("Failed to toggle lock. Please try again.");
        }
    };

    const handleDragStart = (e: React.DragEvent, studentId: number) => {
        e.dataTransfer.setData('studentId', studentId.toString());
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    };

    const updateLocalState = (studentId: number, changes: Partial<Student>, teamId?: number) => {
        // Update student in list
        const updatedStudents = students.map(s =>
            s.id === studentId ? { ...s, ...changes } : s
        );
        setStudents(updatedStudents);

        // Update selectedCohortData counts optimistically
        if (selectedCohortData) {
            const student = students.find(s => s.id === studentId);
            if (!student) return;

            let withTeams = selectedCohortData.students_with_teams;
            let withoutTeams = selectedCohortData.students_without_teams;

            // Simple logic: if moving to team from (unassigned or solo), increment withTeams
            const wasInTeam = !!student.team;
            const nowInTeam = !!changes.team;

            if (!wasInTeam && nowInTeam) {
                withTeams++;
                withoutTeams--;
            } else if (wasInTeam && !nowInTeam) {
                withTeams--;
                withoutTeams++;
            }

            setSelectedCohortData({
                ...selectedCohortData,
                students_with_teams: withTeams,
                students_without_teams: withoutTeams
            });
        }

        // Update Teams state (member lists)
        const student = students.find(s => s.id === studentId);
        if (!student) return;

        setTeams(prevTeams => prevTeams.map(t => {
            // Remove from old team
            if (t.id === student.team) {
                return {
                    ...t,
                    members: t.members.filter(m => m.id !== studentId),
                    member_count: t.members.length - 1
                };
            }
            // Add to new team
            if (t.id === teamId) {
                return {
                    ...t,
                    members: [...t.members, { ...student, ...changes }],
                    member_count: t.members.length + 1
                };
            }
            return t;
        }));
    };

    const handleDropOnTeam = async (e: React.DragEvent, teamId: number) => {
        e.preventDefault();
        if (selectedCohortData?.teams_locked) return;

        const studentId = parseInt(e.dataTransfer.getData('studentId'));
        if (!studentId) return;

        const student = students.find(s => s.id === studentId);
        if (!student || student.team === teamId) return;

        // Optimistic UI Update
        const previousStudent = { ...student };
        updateLocalState(studentId, { team: teamId, is_solo: false }, teamId);

        try {
            await api.post(`/api/students/teams/${teamId}/add_member/`, { student_id: studentId });
            // No fetchCohortData() here to prevent flicker
        } catch (err: any) {
            console.error('Failed to move student:', err);
            alert('Failed to move student. Reverting...');
            // Revert state
            updateLocalState(studentId, previousStudent, previousStudent.team || undefined);
        }
    };

    const handleDropOnSolo = async (e: React.DragEvent) => {
        e.preventDefault();
        if (selectedCohortData?.teams_locked) return;

        const studentId = parseInt(e.dataTransfer.getData('studentId'));
        if (!studentId) return;

        const student = students.find(s => s.id === studentId);
        if (!student || student.is_solo) return;

        // Optimistic UI Update
        const previousStudent = { ...student };
        updateLocalState(studentId, { team: null, is_solo: true });

        try {
            await api.post('/api/students/student-ops/mark_solo/', { student_id: studentId });
        } catch (err: any) {
            console.error('Failed to mark student as solo:', err);
            alert('Failed to mark student as solo. Reverting...');
            // Revert
            updateLocalState(studentId, previousStudent, previousStudent.team || undefined);
        }
    };

    const handleDropOnUnassigned = async (e: React.DragEvent) => {
        e.preventDefault();
        if (selectedCohortData?.teams_locked) return;

        const studentId = parseInt(e.dataTransfer.getData('studentId'));
        if (!studentId) return;

        const student = students.find(s => s.id === studentId);
        // If already unassigned and not solo, do nothing
        if (!student || (!student.team && !student.is_solo)) return;

        // Optimistic UI Update
        const previousStudent = { ...student };
        updateLocalState(studentId, { team: null, is_solo: false });

        try {
            if (student.team) {
                await api.post(`/api/students/teams/${student.team}/remove_member/`, { student_id: studentId });
            }
            if (student.is_solo) {
                await api.post('/api/students/student-ops/unmark_solo/', { student_id: studentId });
            }
        } catch (err: any) {
            console.error('Failed to unassign student:', err);
            alert('Failed to unassign student. Reverting...');
            // Revert
            updateLocalState(studentId, previousStudent, previousStudent.team || undefined);
        }
    };


    const handleRemoveMember = async (teamId: number, studentId: number) => {
        if (selectedCohortData?.teams_locked) return;
        if (!confirm('Are you sure you want to remove this student from the team?')) return;

        const student = students.find(s => s.id === studentId);
        if (!student) return;

        // Optimistic UI Update
        const previousStudent = { ...student };
        updateLocalState(studentId, { team: null });

        try {
            await api.post(`/api/students/teams/${teamId}/remove_member/`, { student_id: studentId });
        } catch (err: any) {
            console.error('Failed to remove student:', err);
            alert('Failed to remove student. Please try again.');
            // Revert
            updateLocalState(studentId, previousStudent, previousStudent.team || undefined);
        }
    };

    const unassignedStudents = students.filter(s => !s.team && !s.is_solo);
    const soloStudents = students.filter(s => s.is_solo);

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold mb-6 text-gray-800">Team Management</h1>

            {/* Cohort Selection */}
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 mb-6">
                <div className="flex flex-col md:flex-row gap-4 items-end">
                    <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Select Cohort</label>
                        <select
                            className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                            value={selectedCohort}
                            onChange={(e) => setSelectedCohort(e.target.value)}
                        >
                            <option value="">-- Select a Cohort --</option>
                            {cohorts.map(c => (
                                <option key={c.id} value={c.id}>
                                    {c.name} ({c.total_students} students)
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="w-full md:w-48">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Target Team Size
                        </label>
                        <input
                            type="number"
                            min="2"
                            max="10"
                            value={teamSize}
                            onChange={(e) => setTeamSize(Math.min(10, Math.max(2, parseInt(e.target.value) || 4)))}
                            className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                            placeholder="4"
                            disabled={selectedCohortData?.teams_locked}
                        />
                        <p className="text-xs text-gray-500 mt-1">Members per team (2-10)</p>
                    </div>

                    <button
                        onClick={handleGenerateTeams}
                        disabled={!selectedCohort || generating || loading || selectedCohortData?.teams_locked}
                        className="btn bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-6 py-2.5 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 whitespace-nowrap"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                        </svg>
                        {generating ? 'Generating...' : 'Auto-Generate Teams'}
                    </button>
                    <button
                        onClick={handleDissolveTeams}
                        disabled={!selectedCohort || generating || loading || selectedCohortData?.teams_locked}
                        className="btn bg-red-600 hover:bg-red-700 text-white font-semibold px-6 py-2.5 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 whitespace-nowrap ml-2"
                        title="Dissolve all teams and unassign students"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        Dissolve Teams
                    </button>
                </div>
            </div>

            {error && <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg mb-6">{error}</div>}
            {success && <div className="bg-green-50 border border-green-200 text-green-700 p-4 rounded-lg mb-6">{success}</div>}

            {selectedCohortData && (
                <div className="bg-gradient-to-r from-indigo-50 to-blue-50 p-6 rounded-lg border border-indigo-100 mb-6 relative overflow-hidden">
                    {/* Lock Toggle */}
                    <div className="absolute top-6 right-6 flex items-center bg-white/80 backdrop-blur-sm px-4 py-2 rounded-full shadow-sm border border-indigo-100">
                        <span className="mr-3 text-sm font-medium text-gray-700">
                            {selectedCohortData.teams_locked ? 'Teams Locked' : 'Teams Unlocked'}
                        </span>
                        <button
                            onClick={handleToggleLock}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${selectedCohortData.teams_locked ? 'bg-red-500' : 'bg-gray-200'
                                }`}
                        >
                            <span
                                className={`${selectedCohortData.teams_locked ? 'translate-x-6' : 'translate-x-1'
                                    } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
                            />
                        </button>
                    </div>

                    <h2 className="text-xl font-semibold text-gray-800 mb-4">{selectedCohortData.name} Overview</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-white p-4 rounded-lg border border-gray-200">
                            <div className="text-sm text-gray-600 mb-1">Total Students</div>
                            <div className="text-3xl font-bold text-indigo-600">{selectedCohortData.total_students}</div>
                        </div>
                        <div className="bg-white p-4 rounded-lg border border-gray-200">
                            <div className="text-sm text-gray-600 mb-1">Students in Teams</div>
                            <div className="text-3xl font-bold text-green-600">{selectedCohortData.students_with_teams}</div>
                        </div>
                        <div className="bg-white p-4 rounded-lg border border-gray-200">
                            <div className="text-sm text-gray-600 mb-1">Unassigned Students</div>
                            <div className="text-3xl font-bold text-orange-600">{selectedCohortData.students_without_teams}</div>
                        </div>
                    </div>
                </div>
            )}

            {loading ? (
                <div className="text-center p-12 bg-gray-50 rounded-lg">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mb-4"></div>
                    <p className="text-gray-600">Loading cohort data...</p>
                </div>
            ) : selectedCohort ? (
                <div className="space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Unassigned Students */}
                        <div
                            className="bg-orange-50 border border-orange-200 p-6 rounded-lg flex flex-col h-full"
                            onDragOver={handleDragOver}
                            onDrop={handleDropOnUnassigned}
                        >
                            <h3 className="text-lg font-semibold text-orange-900 mb-4 flex items-center justify-between">
                                <span className="flex items-center gap-2">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                    </svg>
                                    Unassigned ({unassignedStudents.length})
                                </span>
                            </h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 flex-1 content-start">
                                {unassignedStudents.length > 0 ? unassignedStudents.map(student => (
                                    <div
                                        key={student.id}
                                        draggable={!selectedCohortData?.teams_locked}
                                        onDragStart={(e) => handleDragStart(e, student.id)}
                                        className={`bg-white p-3 rounded border border-orange-300 hover:shadow-md transition-shadow ${selectedCohortData?.teams_locked ? 'opacity-70 cursor-not-allowed' : 'cursor-move'}`}
                                    >
                                        <div className="font-medium text-gray-800">{student.first_name} {student.last_name}</div>
                                        <div className="text-sm text-gray-600">{student.email}</div>
                                    </div>
                                )) : (
                                    <div className="col-span-full text-center text-orange-400 text-sm italic py-8 border-2 border-dashed border-orange-200 rounded">
                                        Drop students here to unassign
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Solo Projects */}
                        <div
                            className="bg-purple-50 border border-purple-200 p-6 rounded-lg flex flex-col h-full"
                            onDragOver={handleDragOver}
                            onDrop={handleDropOnSolo}
                        >
                            <h3 className="text-lg font-semibold text-purple-900 mb-4 flex items-center justify-between">
                                <span className="flex items-center gap-2">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                    </svg>
                                    Solo Projects ({soloStudents.length})
                                </span>
                            </h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 flex-1 content-start">
                                {soloStudents.length > 0 ? soloStudents.map(student => (
                                    <div
                                        key={student.id}
                                        draggable={!selectedCohortData?.teams_locked}
                                        onDragStart={(e) => handleDragStart(e, student.id)}
                                        className={`bg-white p-3 rounded border border-purple-300 hover:shadow-md transition-shadow ${selectedCohortData?.teams_locked ? 'opacity-70 cursor-not-allowed' : 'cursor-move'}`}
                                    >
                                        <div className="font-medium text-gray-800">{student.first_name} {student.last_name}</div>
                                        <div className="text-sm text-gray-600">{student.email}</div>
                                    </div>
                                )) : (
                                    <div className="col-span-full text-center text-purple-400 text-sm italic py-8 border-2 border-dashed border-purple-200 rounded">
                                        Drop students here for solo projects
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Teams Grid */}
                    <div>
                        <h3 className="text-xl font-semibold text-gray-800 mb-4">
                            Teams {teams.length > 0 && `(${teams.length})`}
                        </h3>
                        {teams.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {teams.map(team => (
                                    <div
                                        key={team.id}
                                        onDragOver={handleDragOver}
                                        onDrop={(e) => handleDropOnTeam(e, team.id)}
                                        className="bg-white rounded-lg shadow-md border border-gray-200 p-5 hover:shadow-lg transition-shadow"
                                    >
                                        <div className="flex justify-between items-start mb-4 pb-3 border-b border-gray-200">
                                            <h4 className="text-lg font-bold text-gray-800">{team.name}</h4>
                                            <span className="bg-indigo-100 text-indigo-700 text-xs font-semibold px-2.5 py-1 rounded-full">
                                                {team.member_count} {team.member_count === 1 ? 'member' : 'members'}
                                            </span>
                                        </div>
                                        {team.members.length > 0 ? (
                                            <ul className="space-y-2">
                                                {team.members.map(member => (
                                                    <li
                                                        key={member.id}
                                                        draggable={!selectedCohortData?.teams_locked}
                                                        onDragStart={(e) => handleDragStart(e, member.id)}
                                                        className={`flex items-center gap-2 text-sm bg-gray-50 p-2.5 rounded hover:bg-gray-100 group ${selectedCohortData?.teams_locked ? 'opacity-70 cursor-not-allowed' : 'cursor-move'}`}
                                                    >
                                                        <svg className="w-4 h-4 text-indigo-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                                            <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                                                        </svg>
                                                        <div className="flex-1 min-w-0">
                                                            <div className="font-medium text-gray-800 truncate">
                                                                {member.first_name} {member.last_name}
                                                            </div>
                                                            <div className="text-xs text-gray-500 truncate">{member.email}</div>
                                                        </div>
                                                        {!selectedCohortData?.teams_locked && (
                                                            <button
                                                                onClick={() => handleRemoveMember(team.id, member.id)}
                                                                className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                                                title="Remove from team"
                                                            >
                                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                                                </svg>
                                                            </button>
                                                        )}
                                                    </li>
                                                ))}
                                            </ul>
                                        ) : (
                                            <p className="text-gray-400 text-sm italic text-center py-4 border-2 border-dashed border-gray-100 rounded">
                                                Drop students here
                                            </p>
                                        )}
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-16 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                                <svg className="mx-auto h-16 w-16 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                </svg>
                                <p className="text-gray-600 font-medium text-lg mb-2">No teams found</p>
                                <p className="text-gray-500 text-sm">Click "Auto-Generate Teams" to create teams based on student preferences.</p>
                            </div>
                        )}
                    </div>
                </div>
            ) : (
                <div className="text-center py-16 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                    <svg className="mx-auto h-16 w-16 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                    <p className="text-gray-600 font-medium text-lg mb-2">Select a Cohort</p>
                    <p className="text-gray-500 text-sm">Choose a cohort from the dropdown above to view and manage teams.</p>
                </div>
            )}
        </div>
    );
}

