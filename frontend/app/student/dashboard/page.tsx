'use client';
import { useAuth } from '@/components/AuthProvider';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { Team, StudentProfile } from '@/types/team';

export default function StudentDashboard() {
    const { user, loading, logout, isAuthenticated } = useAuth();
    const router = useRouter();
    const [team, setTeam] = useState<Team | null>(null);
    const [profile, setProfile] = useState<StudentProfile | null>(null);
    const [loadingData, setLoadingData] = useState(true);
    const [requesting, setRequesting] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    useEffect(() => {
        if (!loading && !isAuthenticated) {
            router.push('/login');
        }
    }, [loading, isAuthenticated, router]);

    const fetchData = async () => {
        if (!isAuthenticated) return;
        setLoadingData(true);
        try {
            const [teamRes, profileRes] = await Promise.all([
                api.get('/api/students/my-team/'),
                api.get('/api/students/my-profile/')
            ]);

            if (teamRes.status === 200 && teamRes.data && !teamRes.data.message) {
                setTeam(teamRes.data);
            } else {
                setTeam(null);
            }
            if (profileRes.status === 200 && profileRes.data) {
                setProfile(profileRes.data);
            }
        } catch (error) {
            console.error('Failed to fetch data:', error);
        } finally {
            setLoadingData(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [isAuthenticated]);

    const handleRequestTeam = async () => {
        setRequesting(true);
        setMessage(null);
        try {
            const res = await api.post(`/api/students/profiles/${profile?.id}/request_team/`);
            setMessage({ type: 'success', text: res.data.message });
            fetchData();
        } catch (err: any) {
            setMessage({ type: 'error', text: err.response?.data?.error || 'Failed to request team' });
        } finally {
            setRequesting(false);
        }
    };

    if (loading || !user) return <div className="p-8 text-center">Loading...</div>;

    const showPreferences = !profile?.cohort_teams_locked && !profile?.has_team;

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'unassigned': return <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm font-medium">Unassigned</span>;
            case 'manual_student': return <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-medium">Student Formed</span>;
            case 'manual_admin': return <span className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full text-sm font-medium">Admin Assigned</span>;
            case 'auto_matched': return <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-medium">Auto-Matched</span>;
            case 'solo_assignment': return <span className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-sm font-medium">Solo Project</span>;
            default: return null;
        }
    };

    return (
        <div className="space-y-6">
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 overflow-hidden relative">
                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-bl-full opacity-50 -mr-8 -mt-8"></div>

                <div className="relative z-10">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                        <div>
                            <h2 className="text-3xl font-bold text-gray-900 mb-2">Welcome, {user.first_name}!</h2>
                            <p className="text-gray-500">Cohort ID: {profile?.cohort_id}</p>
                        </div>
                        {profile && (
                            <div className="flex flex-col items-end gap-2">
                                <div className="text-sm font-medium text-gray-500 uppercase tracking-wider">Assignment Status</div>
                                {getStatusBadge(profile.assignment_status)}
                            </div>
                        )}
                    </div>

                    {message && (
                        <div className={`p-4 rounded-lg mb-6 ${message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-red-50 text-red-700 border border-red-100'}`}>
                            {message.text}
                        </div>
                    )}

                    {loadingData ? (
                        <div className="flex items-center gap-3 text-gray-400 py-4">
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-indigo-600"></div>
                            <span>Loading team details...</span>
                        </div>
                    ) : team ? (
                        <div className="mt-8">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                                    <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                    </svg>
                                    Your Team: <span className="text-indigo-600">{team.name}</span>
                                </h3>
                                {team.is_locked && (
                                    <span className="bg-gray-800 text-white text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
                                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                                        </svg>
                                        LOCKED
                                    </span>
                                )}
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                {team.members.map((member) => (
                                    <div key={member.id} className="flex items-center p-4 bg-gray-50 rounded-xl border border-gray-100 group hover:border-indigo-200 transition-colors">
                                        <div className="bg-white text-indigo-700 rounded-full w-12 h-12 shadow-sm flex items-center justify-center font-bold mr-4 text-lg border border-indigo-50">
                                            {member.first_name[0]}{member.last_name[0]}
                                        </div>
                                        <div className="min-w-0">
                                            <p className="font-bold text-gray-900 truncate">
                                                {member.first_name} {member.last_name}
                                                {member.id === profile?.id && <span className="ml-2 text-[10px] bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded-full uppercase tracking-tighter">You</span>}
                                            </p>
                                            <p className="text-xs text-gray-500 truncate">{member.email}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="mt-6 p-6 bg-amber-50 rounded-xl border border-amber-100">
                            <div className="flex items-start gap-4">
                                <div className="bg-amber-100 p-2 rounded-lg">
                                    <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-bold text-amber-900 mb-1">No Team Assigned Yet</h3>
                                    <p className="text-amber-800 text-sm mb-4">
                                        The team formation process is currently underway. You can either nominate specific teammates or ask to be matched automatically.
                                    </p>
                                    {!profile?.cohort_teams_locked && !profile?.is_solo && (
                                        <div className="flex gap-3">
                                            {profile?.seeking_team ? (
                                                <div className="flex items-center gap-2 text-indigo-600 font-semibold text-sm bg-white px-4 py-2 rounded-lg border border-indigo-100">
                                                    <div className="animate-pulse w-2 h-2 bg-indigo-600 rounded-full"></div>
                                                    Matching Request Active
                                                </div>
                                            ) : (
                                                <button
                                                    onClick={handleRequestTeam}
                                                    disabled={requesting}
                                                    className="bg-indigo-600 text-white font-bold py-2 px-6 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
                                                >
                                                    {requesting ? 'Processing...' : 'Find Me a Team'}
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {showPreferences && (
                    <Link href="/student/dashboard/preferences" className="block group">
                        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 group-hover:border-indigo-400 group-hover:shadow-md transition-all h-full relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-50 rounded-bl-full opacity-30 -mr-6 -mt-6 transition-transform group-hover:scale-110"></div>
                            <div className="relative z-10">
                                <div className="flex items-center justify-between mb-6">
                                    <div className="bg-indigo-100 p-3 rounded-xl">
                                        <svg className="w-8 h-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                                        </svg>
                                    </div>
                                    <svg className="w-6 h-6 text-gray-300 group-hover:text-indigo-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                                    </svg>
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 mb-2">Team Preferences</h3>
                                <p className="text-gray-600 text-sm leading-relaxed mb-4">
                                    Nominate students you'd like to work with. We'll do our best to pair you with at least one teammate from your list.
                                </p>
                                <div className="inline-flex items-center text-indigo-600 font-bold group-hover:gap-2 transition-all">
                                    Manage Preferences
                                </div>
                            </div>
                        </div>
                    </Link>
                )}

                <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 h-full relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-gray-50 rounded-bl-full opacity-50 -mr-6 -mt-6"></div>
                    <div className="relative z-10">
                        <div className="flex items-center justify-between mb-6">
                            <div className="bg-gray-100 p-3 rounded-xl group-hover:bg-indigo-50 transition-colors">
                                <svg className="w-8 h-8 text-gray-400 group-hover:text-indigo-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                                </svg>
                            </div>
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">My Capstone Project</h3>
                        <p className="text-gray-600 text-sm leading-relaxed">
                            {team ? "Project selection will begin once you've finalized your project proposal with your team." : "Project details will be released once teams are finalized and locked."}
                        </p>
                        {team && (
                            <div className="mt-6 text-gray-400 text-xs font-medium uppercase tracking-widest">Available Soon</div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
