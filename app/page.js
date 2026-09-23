'use client'

import React from 'react';
import Link from 'next/link';

export default function LandingPage() {
    return (
        <div className="min-h-screen bg-gray-50 flex flex-col justify-between">
            {/* Header */}
            <header className="bg-blue-600 text-white p-4">
                <div className="container mx-auto flex justify-between items-center">
                    <h1 className="text-3xl font-bold">Basketball Academy</h1>
                    <nav>
                        <Link href="/login" className="text-lg hover:underline">
                            Login
                        </Link>
                    </nav>
                </div>
            </header>

            {/* Main Content */}
            <main className="container mx-auto px-4 py-20 text-center">
                <h2 className="text-4xl font-bold mb-8">Welcome to Our Basketball Academy</h2>
                <p className="text-lg mb-6">
                    Join us to nurture young talents and build future champions.
                </p>
                <Link prefetch={true} href="/dashboard"
                      className="px-6 py-3 bg-blue-600 text-white rounded-full text-lg hover:bg-blue-700">
                    Visit Dashboard
                </Link>
            </main>

            {/* Footer */}
            <footer className="bg-blue-600 text-white p-4">
                <div className="container mx-auto text-center">
                    <p>&copy; 2024 Basketball Academy. All rights reserved.</p>
                </div>
            </footer>
        </div>
    );
}
