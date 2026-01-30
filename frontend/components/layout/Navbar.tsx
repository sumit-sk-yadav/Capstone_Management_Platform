'use client';

import { useAuth } from '@/components/AuthProvider';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    HomeIcon,
    UserGroupIcon,
    ListBulletIcon,
    ArrowLeftOnRectangleIcon,
    UserIcon
} from '@heroicons/react/24/outline';

export default function Navbar() {
    const { user, logout } = useAuth();
    const pathname = usePathname();

    if (!user) return null;

    const adminLinks = [
        { name: 'Dashboard', href: '/admin/dashboard', icon: HomeIcon },
        { name: 'Team Matching', href: '/admin/dashboard/teams', icon: UserGroupIcon },
    ];

    const studentLinks = [
        { name: 'Dashboard', href: '/student/dashboard', icon: HomeIcon },
        { name: 'Preferences', href: '/student/dashboard/preferences', icon: ListBulletIcon },
    ];

    const professorLinks = [
        { name: 'Dashboard', href: '/professor/dashboard', icon: HomeIcon },
    ];

    let links: any[] = [];
    if (user.role === 'admin') links = adminLinks;
    else if (user.role === 'student') links = studentLinks;
    else if (user.role === 'professor') links = professorLinks;

    const isActive = (href: string) => pathname === href;

    return (
        <nav className="w-64 bg-slate-900 text-white min-h-screen flex flex-col fixed left-0 top-0 shadow-xl z-50">
            <div className="p-6">
                <h1 className="text-xl font-bold tracking-tight text-blue-400">Capstone CMP</h1>
                <p className="text-xs text-slate-400 mt-1 uppercase tracking-widest font-semibold">{user.role} Portal</p>
            </div>

            <div className="flex-1 px-4 py-4 space-y-1">
                {links.map((link) => (
                    <Link
                        key={link.name}
                        href={link.href}
                        className={`flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-all duration-200 group ${isActive(link.href)
                                ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50'
                                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                            }`}
                    >
                        <link.icon className={`w-5 h-5 ${isActive(link.href) ? 'text-white' : 'text-slate-400 group-hover:text-white'}`} />
                        <span className="font-medium">{link.name}</span>
                    </Link>
                ))}
            </div>

            <div className="p-4 border-t border-slate-800 mt-auto">
                <div className="flex items-center space-x-3 px-3 py-3 mb-4">
                    <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-xs font-bold text-white uppercase">
                        {user.first_name[0]}{user.last_name[0]}
                    </div>
                    <div className="overflow-hidden">
                        <p className="text-sm font-medium truncate">{user.first_name} {user.last_name}</p>
                        <p className="text-xs text-slate-500 truncate">{user.email}</p>
                    </div>
                </div>
                <button
                    onClick={logout}
                    className="w-full flex items-center space-x-3 px-3 py-2 text-slate-400 hover:bg-red-900/20 hover:text-red-400 rounded-lg transition-colors duration-200"
                >
                    <ArrowLeftOnRectangleIcon className="w-5 h-5" />
                    <span className="font-medium">Logout</span>
                </button>
            </div>
        </nav>
    );
}
