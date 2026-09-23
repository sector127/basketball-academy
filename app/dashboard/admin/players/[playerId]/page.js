"use client";

import React, {useEffect, useState} from "react";
import DashboardLayout from "@/components/DashboardLayout";
import Image from "next/image";
import Loader from "@/components/Loader";
import {motion} from "framer-motion";
import {Card, CardContent} from "@/components/ui/card";
import {Badge} from "@/components/ui/badge";
import {Button} from "@/components/ui/button";
import {useRouter} from "next/navigation";
import {FaEdit} from "react-icons/fa";
import {useSession} from "next-auth/react";

export default function PlayerPage({params}) {
    const [player, setPlayer] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const {playerId} = React.use(params);
    const {data: session, status} = useSession();


    const router = useRouter();

    useEffect(() => {
        async function fetchPlayer() {
            try {
                const response = await fetch(`/api/admin/players/${playerId}`);
                if (!response.ok) {
                    throw new Error("Failed to fetch player");
                }
                const data = await response.json();
                setPlayer(data);
            } catch (error) {
                console.error("Error fetching player:", error);
                setError(error.message);
            } finally {
                setLoading(false);
            }
        }

        if (playerId) {
            fetchPlayer();
        }
    }, [playerId]);

    const handleEdit = () => {
        router.push(`/dashboard/admin/players/edit/${playerId}`);
    }

    if (loading) {
        return (
            <DashboardLayout>
                <Loader/>
            </DashboardLayout>
        );
    }

    if (error) {
        return (
            <DashboardLayout>
                <div className="flex justify-center items-center min-h-[50vh]">
                    <p className="text-red-500 text-lg font-semibold">Error: {error}</p>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <motion.div
                    className="flex flex-col md:flex-row justify-between items-center md:items-start space-y-8 md:space-y-0 md:space-x-8"
                    initial={{opacity: 0, y: 20}}
                    animate={{opacity: 1, y: 0}}
                    transition={{duration: 0.5}}
                >
                    {/* Profile Picture */}
                    <div className="w-full md:w-1/3 flex justify-center">
                        <div className="relative w-full h-96 md:h-auto">
                            <Image
                                src={player.profilePicture || "/uploads/default-profile-picture.jpg"}
                                alt={`${player.name} ${player.lastname}`}
                                width={500}
                                height={500}
                                sizes="(max-width: 768px) 100vw, 33vw"
                                className="object-cover rounded-lg shadow-2xl border border-gray-200 dark:border-gray-700"
                                priority
                            />
                        </div>
                    </div>

                    {/* Player Info */}
                    <div className="w-full md:w-2/3 flex flex-col space-y-8">
                        <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100">
                            {player.name} {player.lastname}
                        </h1>

                        <div className="flex items-center space-x-4">
                            <Badge variant="secondary" className="text-lg font-medium px-4 py-2">
                                #{player.jerseyNum || "XX"}
                            </Badge>
                            <Badge variant="outline" className="text-lg font-medium px-4 py-2">
                                {player.position}
                            </Badge>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            <Card>
                                <CardContent className='p-6'>
                                    <p className="text-gray-700 dark:text-gray-300 font-medium">Team</p>
                                    <p className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                                        {player.team.name}
                                    </p>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardContent className='p-6'>
                                    <p className="text-gray-700 dark:text-gray-300 font-medium">Age</p>
                                    <p className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                                        {player.age}
                                    </p>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardContent className='p-6'>
                                    <p className="text-gray-700 dark:text-gray-300 font-medium">Height</p>
                                    <p className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                                        {player.height} cm
                                    </p>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardContent className='p-6'>
                                    <p className="text-gray-700 dark:text-gray-300 font-medium">Guardian</p>
                                    <p className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                                        {player.guardian}
                                    </p>
                                </CardContent>
                            </Card>
                        </div>

                        <Card>
                            <CardContent className='p-6'>
                                <p className="text-lg font-medium text-gray-700 dark:text-gray-300">Contact
                                    Information</p>
                                <div className="mt-2 space-y-2">
                                    <p className="text-gray-900 dark:text-gray-100">
                                        <strong>Player Tel:</strong> {player.tel}
                                    </p>
                                    <p className="text-gray-900 dark:text-gray-100">
                                        <strong>Guardian Tel:</strong> {player.guardianTel}
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                        <Button variant="outline" size="lg" className="self-start" onClick={handleEdit}>
                            <FaEdit className="mr-2"/>
                            Edit Profile
                        </Button>
                    </div>
                </motion.div>
            </div>
        </DashboardLayout>
    );
}
