'use client';

import DashboardShell from '@/components/layout/DashboardShell';

export default function StudentLayout({ children }: { children: React.ReactNode }) {
    return <DashboardShell>{children}</DashboardShell>;
}
