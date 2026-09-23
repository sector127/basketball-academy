'use client'
import React, {useEffect, useState} from 'react';
import DashboardLayout from "@/components/DashboardLayout";
import {useTranslations} from "next-intl";
import Card from "@/components/Card";
import Link from "next/link";
import Loader from "@/components/Loader";
import {motion} from "framer-motion";

export default function TeamsPage() {
    const t = useTranslations('Teams');
    const [teams, setTeams] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        async function fetchTeams() {
            try {
                const response = await fetch('/api/coach/teams');
                if (!response.ok) {
                    throw new Error('Failed to fetch teams');
                }
                const data = await response.json();
                if (Array.isArray(data)) {
                    setTeams(data);
                } else {
                    console.error('Expected an array of teams, but received:', data);
                    setTeams([]);
                }
            } catch (error) {
                console.error('Error fetching teams:', error);
                setError(error.message);
            } finally {
                setLoading(false);
            }
        }

        fetchTeams()
    }, []);


    if (loading) {
        return (
            <DashboardLayout>
                <motion.div
                    initial={{opacity: 0}}
                    animate={{opacity: 1}}
                    transition={{duration: 0.5}}
                >
                    <h1 className="text-3xl font-bold mb-8">{t('title')}</h1>
                    <Loader/>
                    <p>{t('loadingTeams')}</p>
                </motion.div>
            </DashboardLayout>
        );
    }

    if (error) {
        return (
            <DashboardLayout>
                <motion.div
                    initial={{opacity: 0}}
                    animate={{opacity: 1}}
                    transition={{duration: 0.5}}
                >
                    <h1 className="text-3xl font-bold mb-8">{t('title')}</h1>
                    <p className="text-red-500">Error: {error}</p>
                </motion.div>
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
                <h1 className="text-3xl font-bold mb-8">{t('title')}</h1>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6">
                    {teams.length > 0 ? (
                        teams.map((team) => (
                            <Link key={team._id} href={`/dashboard/coach/teams/${team._id}`}>
                                <motion.div
                                    whileHover={{scale: 1.05}}
                                    whileTap={{scale: 0.95}}
                                >
                                    <Card title={team.name} description={team.description}/>
                                </motion.div>
                            </Link>
                        ))
                    ) : (
                        <p>{t('noTeams')}</p>
                    )}
                </div>
            </motion.div>
        </DashboardLayout>
    );
}
