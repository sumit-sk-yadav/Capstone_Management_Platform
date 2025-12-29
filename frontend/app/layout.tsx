import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/components/AuthProvider';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
    title: 'Capstone Management Platform',
    description: 'Manage capstone projects for students, professors, and administrators',
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en">
            <body className={inter.className}>
                <AuthProvider>
                    {children}
                </AuthProvider>
            </body>
        </html>
    );
}
