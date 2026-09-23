"use client";
import React, {useState} from "react";
import {Card, CardHeader, CardTitle, CardContent, CardFooter, CardDescription} from "@/components/ui/card";
import {Input} from "@/components/ui/input";
import {Label} from "@/components/ui/label";
import {Button} from "@/components/ui/button";
import {signIn} from "next-auth/react";
import Image from "next/image";
import Link from "next/link";
import {motion} from "framer-motion";

const SignIn = () => {
    const [error, setError] = useState(""); // State to store error messages

    const handleSignIn = async (event) => {
        event.preventDefault(); // Prevent the default form submission behavior
        const formData = new FormData(event.target);
        const data = {
            email: formData.get("email"),
            password: formData.get("password"),
            redirect: false, // Prevent automatic redirection
        };

        // Call the signIn function
        const result = await signIn("credentials", data);

        if (result?.error) {
            console.log(result.error);
            // Handle authentication error
            setError(
                result.error === "Configuration"
                    ? "Invalid email or password."
                    : "An error occurred. Please try again."
            );
        } else {
            // Redirect to the dashboard on success
            window.location.href = "/dashboard";
        }
    };

    return (
        <div
            className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 p-6 md:p-10">
            <motion.div
                className="w-full max-w-md flex flex-col gap-6"
                initial={{opacity: 0, y: 30}}
                animate={{opacity: 1, y: 0}}
                transition={{duration: 0.6}}
            >
                <Link
                    href={"/"}
                    className="text-lg flex items-center justify-center space-x-2 mb-6"
                >
                    <Image
                        src="/assets/images/logo.png"
                        alt="BBA-logo"
                        width={60}
                        height={60}
                        className="object-contain transition-transform hover:scale-105 duration-500"
                        priority
                    />
                </Link>
                <Card className="bg-white dark:bg-gray-800 shadow-xl rounded-xl">
                    <CardHeader className="text-center">
                        <CardTitle className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                            Welcome Back
                        </CardTitle>
                        <CardDescription className="text-gray-700 dark:text-gray-400">
                            Please log in to continue
                        </CardDescription>
                    </CardHeader>
                    <form onSubmit={handleSignIn} className="space-y-4">
                        <CardContent className="space-y-4">
                            {/* Display error message if there's an error */}
                            {error && (
                                <motion.div
                                    className="text-red-500 text-sm text-center"
                                    initial={{opacity: 0}}
                                    animate={{opacity: 1}}
                                >
                                    {error}
                                </motion.div>
                            )}
                            <div className="space-y-2">
                                <Label htmlFor="email" className="text-gray-700 dark:text-gray-300">
                                    Email
                                </Label>
                                <Input
                                    id="email"
                                    name="email"
                                    type="email"
                                    placeholder="Enter your email"
                                    required
                                    className="border-gray-300 dark:border-gray-700"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="password" className="text-gray-700 dark:text-gray-300">
                                    Password
                                </Label>
                                <Input
                                    id="password"
                                    name="password"
                                    type="password"
                                    placeholder="Enter your password"
                                    required
                                    className="border-gray-300 dark:border-gray-700"
                                />
                            </div>
                        </CardContent>
                        <CardFooter>
                            <Button
                                type="submit"
                                className="w-full bg-blue-600 hover:bg-blue-700 text-white dark:bg-blue-500 dark:hover:bg-blue-600"
                            >
                                Sign in
                            </Button>
                        </CardFooter>
                    </form>
                </Card>
            </motion.div>
        </div>
    );
};

export default SignIn;
