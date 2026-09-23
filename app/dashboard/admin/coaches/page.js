'use client'
import React, {useEffect, useState} from 'react';
import DashboardLayout from "@/components/DashboardLayout";
import Loader from "@/components/Loader";
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import Image from "next/image"; // Adjust the path as necessary
import {motion} from "framer-motion";

export default function CoachesPage() {
    const [coaches, setCoaches] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        async function fetchCoaches() {
            try {
                const response = await fetch('/api/admin/coaches');
                if (!response.ok) {
                    throw new Error('Failed to fetch coaches');
                }
                const data = await response.json();
                setCoaches(data);
            } catch (error) {
                setError(error.message);
            } finally {
                setLoading(false);
            }
        }

        fetchCoaches();
    }, []);

    if (loading) {
        return (
            <DashboardLayout>
                <h1 className="text-3xl font-bold mb-8">Coaches</h1>
                <Loader/>
            </DashboardLayout>
        );
    }

    if (error) {
        return (
            <DashboardLayout>
                <h1 className="text-3xl font-bold mb-8">Coaches</h1>
                <p className="text-red-500">Error: {error}</p>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <motion.div
                initial={{opacity: 0, y: 20}}
                animate={{opacity: 1, y: 0}}
                transition={{duration: 0.5}}
            >
                <div className="container mx-auto py-6">
                    <h1 className="text-3xl font-bold mb-8">Our Coaches</h1>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6">
                        {
                            coaches.length > 0 ?
                                coaches.map(coach => (
                                    <motion.div key={coach._id} whileHover={{scale: 1.05}} whileTap={{scale: 0.95}}>
                                        <Card key={coach._id}
                                              className="h-full hover:shadow-md transition-shadow duration-300 border-2 hover:border-primary/20 cursor-pointer">
                                            <CardHeader className="pb-2">
                                                <CardTitle className="text-xl">
                                                    {coach.name} {coach.lastName}
                                                </CardTitle>
                                            </CardHeader>
                                            <CardContent className="flex items-center justify-center">
                                                {coach.image ? (
                                                    <Image
                                                        src={coach.image}
                                                        alt={`${coach.name} ${coach.lastName}`}
                                                        width={150}
                                                        height={150}
                                                    />
                                                ) : (
                                                    <div
                                                        className="w-[150px] h-[150px] bg-gray-200 flex items-center justify-center">
                                                        <span>No Image</span>
                                                    </div>
                                                )}
                                            </CardContent>
                                        </Card>
                                    </motion.div>
                                )) :
                                <p>No coaches available.</p>
                        }
                    </div>
                </div>
            </motion.div>
        </DashboardLayout>
    );
}