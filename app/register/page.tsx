'use client'
import React, {useState} from 'react';
import {useForm} from 'react-hook-form';
import {z} from 'zod';
import {zodResolver} from '@hookform/resolvers/zod';
import {LuEyeOff, LuLock, LuMail, LuUser, LuEye, LuCheckCircle, LuXCircle} from "react-icons/lu";

// Zod schema for form validation
const registerSchema = z.object({
    name: z.string()
        .min(2, 'Name must be at least 2 characters')
        .max(50, 'Name must be less than 50 characters'),
    email: z.string()
        .email('Please enter a valid email address'),
    password: z.string()
        .min(8, 'Password must be at least 8 characters')
        .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
        .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
        .regex(/[0-9]/, 'Password must contain at least one number')
        .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
    confirmPassword: z.string(),
    terms: z.boolean().refine(val => val === true, {
        message: 'You must accept the terms and conditions'
    })
}).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
});

type RegisterFormData = z.infer<typeof registerSchema>;

const RegisterPage = () => {
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const {
        register,
        handleSubmit,
        formState: {errors},
        watch
    } = useForm<RegisterFormData>({
        resolver: zodResolver(registerSchema),
        defaultValues: {
            name: '',
            email: '',
            password: '',
            confirmPassword: '',
            terms: false
        }
    });

    const passwordCriteria = [
        {label: 'At least 8 characters', test: (pass: string) => pass.length >= 8},
        {label: 'Contains a number', test: (pass: string) => /\d/.test(pass)},
        {label: 'Contains an uppercase letter', test: (pass: string) => /[A-Z]/.test(pass)},
        {label: 'Contains a lowercase letter', test: (pass: string) => /[a-z]/.test(pass)},
        {label: 'Contains a special character', test: (pass: string) => /[^A-Za-z0-9]/.test(pass)}
    ];

    const currentPassword = watch('password');

    const onSubmit = async (data: RegisterFormData) => {
        setIsLoading(true);
        try {
            // Simulated API call - replace with your actual registration endpoint
            const response = await registerUser(data);
            console.log('Registration successful:', response);
            // Redirect to login page or show success message
            // window.location.href = '/login';
        } catch (error: any) {
            console.error('Registration failed:', error);
        } finally {
            setIsLoading(false);
        }
    };

    // Simulated registration function - replace with your actual API call
    const registerUser = async (userData: RegisterFormData) => {
        await new Promise(resolve => setTimeout(resolve, 1000));
        if (userData.email === 'test@test.com') {
            throw new Error('Email already exists');
        }
        return {success: true, message: 'Registration successful'};
    };

    return (
        <div className="min-h-screen bg-gray-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-lg shadow-lg">
                {/* Header */}
                <div>
                    <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                        Create your account
                    </h2>
                    <p className="mt-2 text-center text-sm text-gray-600">
                        Join us today and get started
                    </p>
                </div>

                {/* Form */}
                <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
                    <div className="space-y-4">
                        {/* Full Name Field */}
                        <div>
                            <label htmlFor="name" className="text-sm font-medium text-gray-700">
                                Full Name
                            </label>
                            <div className="mt-1 relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <LuUser className="h-5 w-5 text-gray-400"/>
                                </div>
                                <input
                                    {...register('name')}
                                    type="text"
                                    className={`block w-full pl-10 pr-3 py-2 border ${
                                        errors.name ? 'border-red-300' : 'border-gray-300'
                                    } rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
                                    placeholder="Enter your full name"
                                />
                            </div>
                            {errors.name && (
                                <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
                            )}
                        </div>

                        {/* Email Field */}
                        <div>
                            <label htmlFor="email" className="text-sm font-medium text-gray-700">
                                Email address
                            </label>
                            <div className="mt-1 relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <LuMail className="h-5 w-5 text-gray-400"/>
                                </div>
                                <input
                                    {...register('email')}
                                    type="email"
                                    className={`block w-full pl-10 pr-3 py-2 border ${
                                        errors.email ? 'border-red-300' : 'border-gray-300'
                                    } rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
                                    placeholder="Enter your email"
                                />
                            </div>
                            {errors.email && (
                                <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
                            )}
                        </div>

                        {/* Password Field */}
                        <div>
                            <label htmlFor="password" className="text-sm font-medium text-gray-700">
                                Password
                            </label>
                            <div className="mt-1 relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <LuLock className="h-5 w-5 text-gray-400"/>
                                </div>
                                <input
                                    {...register('password')}
                                    type={showPassword ? "text" : "password"}
                                    className={`block w-full pl-10 pr-10 py-2 border ${
                                        errors.password ? 'border-red-300' : 'border-gray-300'
                                    } rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
                                    placeholder="Create a password"
                                />
                                <button
                                    type="button"
                                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                                    onClick={() => setShowPassword(!showPassword)}
                                >
                                    {showPassword ? (
                                        <LuEyeOff className="h-5 w-5 text-gray-400"/>
                                    ) : (
                                        <LuEye className="h-5 w-5 text-gray-400"/>
                                    )}
                                </button>
                            </div>
                            {errors.password && (
                                <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
                            )}

                            {/* Password strength indicators */}
                            <div className="mt-2 space-y-2">
                                {passwordCriteria.map((criterion, index) => (
                                    <div key={index} className="flex items-center text-sm">
                                        {criterion.test(currentPassword || '') ? (
                                            <LuCheckCircle className="h-4 w-4 text-green-500 mr-2"/>
                                        ) : (
                                            <LuXCircle className="h-4 w-4 text-gray-300 mr-2"/>
                                        )}
                                        <span
                                            className={criterion.test(currentPassword || '') ? 'text-green-600' : 'text-gray-500'}>
                      {criterion.label}
                    </span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Confirm Password Field */}
                        <div>
                            <label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700">
                                Confirm Password
                            </label>
                            <div className="mt-1 relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <LuLock className="h-5 w-5 text-gray-400"/>
                                </div>
                                <input
                                    {...register('confirmPassword')}
                                    type={showConfirmPassword ? "text" : "password"}
                                    className={`block w-full pl-10 pr-10 py-2 border ${
                                        errors.confirmPassword ? 'border-red-300' : 'border-gray-300'
                                    } rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
                                    placeholder="Confirm your password"
                                />
                                <button
                                    type="button"
                                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                >
                                    {showConfirmPassword ? (
                                        <LuEyeOff className="h-5 w-5 text-gray-400"/>
                                    ) : (
                                        <LuEye className="h-5 w-5 text-gray-400"/>
                                    )}
                                </button>
                            </div>
                            {errors.confirmPassword && (
                                <p className="mt-1 text-sm text-red-600">{errors.confirmPassword.message}</p>
                            )}
                        </div>
                    </div>

                    {/* Terms and Conditions */}
                    <div className="flex items-center">
                        <input
                            {...register('terms')}
                            type="checkbox"
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <label htmlFor="terms" className="ml-2 block text-sm text-gray-900">
                            I agree to the{' '}
                            <a href="#" className="text-blue-600 hover:text-blue-500">
                                Terms and Conditions
                            </a>
                        </label>
                    </div>
                    {errors.terms && (
                        <p className="mt-1 text-sm text-red-600">{errors.terms.message}</p>
                    )}

                    {/* Submit Button */}
                    <div>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className={`group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white ${
                                isLoading ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
                            } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
                        >
                            {isLoading ? (
                                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg"
                       fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor"
                            strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Creating account...
                </span>
                            ) : (
                                'Create Account'
                            )}
                        </button>
                    </div>

                    {/* Sign in link */}
                    <div className="text-center">
                        <p className="text-sm text-gray-600">
                            Already have an account?{' '}
                            <a href="#" className="font-medium text-blue-600 hover:text-blue-500">
                                Sign in
                            </a>
                        </p>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default RegisterPage;