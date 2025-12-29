import Link from 'next/link';

export default function Home() {
    return (
        <main className="flex min-h-screen flex-col items-center justify-center p-24">
            <div className="text-center">
                <h1 className="text-4xl font-bold mb-8">Capstone Management Platform</h1>
                <p className="text-xl mb-12 text-gray-600 dark:text-gray-400">
                    Manage your capstone projects efficiently
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
                    {/* Student Registration */}
                    <div className="card hover:shadow-lg transition-shadow">
                        <h2 className="text-2xl font-semibold mb-4">Students</h2>
                        <p className="text-gray-600 dark:text-gray-400 mb-4">
                            Register or login to manage your capstone project
                        </p>
                        <div className="space-y-2">
                            <Link href="/register/student" className="block btn btn-primary">
                                Student Registration
                            </Link>
                            <Link href="/login" className="block btn bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600">
                                Student Login
                            </Link>
                        </div>
                    </div>

                    {/* Professor Registration */}
                    <div className="card hover:shadow-lg transition-shadow">
                        <h2 className="text-2xl font-semibold mb-4">Professors</h2>
                        <p className="text-gray-600 dark:text-gray-400 mb-4">
                            Guide and evaluate student projects
                        </p>
                        <div className="space-y-2">
                            <Link href="/register/professor" className="block btn btn-primary">
                                Professor Registration
                            </Link>
                            <Link href="/login" className="block btn bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600">
                                Professor Login
                            </Link>
                        </div>
                    </div>

                    {/* Admin Login */}
                    <div className="card hover:shadow-lg transition-shadow md:col-span-2">
                        <h2 className="text-2xl font-semibold mb-4">Administrators</h2>
                        <p className="text-gray-600 dark:text-gray-400 mb-4">
                            Manage the entire platform with Google authentication
                        </p>
                        <Link href="/admin-login" className="btn btn-primary">
                            Admin Login with Google
                        </Link>
                    </div>
                </div>
            </div>
        </main>
    );
}
