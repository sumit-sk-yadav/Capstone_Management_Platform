'use client';
import { useAuth } from '@/components/AuthProvider';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { Team } from '@/types/team';

export default function StudentDashboard() {
    const { user, loading, logout, isAuthenticated } = useAuth();
    const router = useRouter();
    const [team, setTeam] = useState<Team | null>(null);
    const [profile, setProfile] = useState<any>(null);
    const [loadingTeam, setLoadingTeam] = useState(true);

    useEffect(() => {
        if (!loading && !isAuthenticated) {
            router.push('/login');
        }
    }, [loading, isAuthenticated, router]);

    useEffect(() => {
        const fetchData = async () => {
            if (!isAuthenticated) return;
            try {
                const [teamRes, profileRes] = await Promise.all([
                    api.get('/api/students/my-team/'),
                    api.get('/api/students/my-profile/')
                ]);

                if (teamRes.status === 200 && teamRes.data && !teamRes.data.message) {
                    setTeam(teamRes.data);
                }
                if (profileRes.status === 200 && profileRes.data) {
                    setProfile(profileRes.data);
                }
            } catch (error) {
                console.error('Failed to fetch data:', error);
            } finally {
                setLoadingTeam(false);
            }
        };

        fetchData();
    }, [isAuthenticated]);

    if (loading || !user) return <div className="p-8 text-center">Loading...</div>;

    const showPreferences = !profile?.cohort_teams_locked && !profile?.team;

    return (
        <div className="space-y-6">
            <div className="card bg-white p-6 rounded-lg shadow-sm border border-gray-100 mb-6">
                <h2 className="text-2xl font-semibold mb-4 text-gray-800">Welcome, {user.first_name}!</h2>

                {loadingTeam ? (
                    <p className="text-gray-600">Loading team details...</p>
                ) : team ? (
                    <div className="mt-6 border-t pt-4">
                        <h3 className="text-xl font-medium text-gray-800 mb-4">Your Team: <span className="text-blue-600">{team.name}</span></h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {team.members.map((member) => (
                                <div key={member.id} className="flex items-center p-3 bg-gray-50 rounded-lg border border-gray-200">
                                    <div className="bg-blue-100 text-blue-700 rounded-full w-10 h-10 flex items-center justify-center font-bold mr-3 uppercase">
                                        {member.first_name[0]}{member.last_name[0]}
                                    </div>
                                    <div>
                                        <p className="font-medium text-gray-800">{member.first_name} {member.last_name}</p>
                                        <p className="text-xs text-gray-500">{member.email}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ) : (
                    <p className="text-gray-600">You have no assigned team yet. Once the matching process is complete, your team details will appear here.</p>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {showPreferences && (
                    <Link href="/student/dashboard/preferences" className="block group">
                        <div className="card bg-white p-6 rounded-lg shadow-sm border border-gray-200 group-hover:border-blue-400 transition-colors h-full">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-xl font-semibold text-gray-800">Teammate Preferences</h3>
                                <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                </svg>
                            </div>
                            <p className="text-gray-600">
                                Nominate students you want to work with on your capstone project.
                            </p>
                            <div className="mt-4 text-blue-600 font-medium group-hover:underline">Manage Preferences &rarr;</div>
                        </div>
                    </Link>
                )}

                {/* Placeholder for Project */}
                <div className="card bg-gray-50 p-6 rounded-lg border border-dashed border-gray-300 flex flex-col justify-center items-center text-center h-full opacity-75">
                    <h3 className="text-lg font-semibold text-gray-500 mb-2">My Capstone Project</h3>
                    <p className="text-sm text-gray-400">Project details will be available once teams are finalized.</p>
                </div>
            </div>
        </div>
    );
}
