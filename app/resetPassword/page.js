'use client'
import React, {useState} from 'react';
import {LuMail} from "react-icons/lu";

const ResetPasswordPage = () => {
    const [email, setEmail] = useState('');
    const [isSubmitted, setIsSubmitted] = useState(false);

    const handleSubmit = (e) => {
        e.preventDefault();
        // Handle password reset logic here
        console.log('Password reset requested for:', email);
        setIsSubmitted(true);
    };

    return (
        <div className="min-h-screen bg-gray-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-lg shadow-lg">
                {!isSubmitted ? (
                    <>
                        {/* Header */}
                        <div>
                            <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                                Reset your password
                            </h2>
                            <p className="mt-2 text-center text-sm text-gray-600">
                                Enter your email address and we&apos;ll send you a link to reset your password
                            </p>
                        </div>

                        {/* Form */}
                        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                            <div>
                                <label htmlFor="email" className="text-sm font-medium text-gray-700">
                                    Email address
                                </label>
                                <div className="mt-1 relative">
                                    <div
                                        className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <LuMail className="h-5 w-5 text-gray-400"/>
                                    </div>
                                    <input
                                        id="email"
                                        name="email"
                                        type="email"
                                        autoComplete="email"
                                        required
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                        placeholder="Enter your email"
                                    />
                                </div>
                            </div>

                            {/* Submit Button */}
                            <div>
                                <button
                                    type="submit"
                                    className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                >
                                    Send Reset Link
                                </button>
                            </div>

                            {/* Back to login */}
                            <div className="text-center">
                                <a href="/login" className="font-medium text-blue-600 hover:text-blue-500">
                                    Back to login
                                </a>
                            </div>
                        </form>
                    </>
                ) : (
                    // Success Message
                    <div className="text-center">
                        <div
                            className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
                            <svg
                                className="h-6 w-6 text-green-600"
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M5 13l4 4L19 7"
                                />
                            </svg>
                        </div>
                        <h3 className="text-lg leading-6 font-medium text-gray-900">Check your email</h3>
                        <div className="mt-2">
                            <p className="text-sm text-gray-500">
                                We&apos;ve sent a password reset link to {email}
                            </p>
                        </div>
                        <div className="mt-6">
                            <a href="/login" className="font-medium text-blue-600 hover:text-blue-500">
                                Back to login
                            </a>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ResetPasswordPage;