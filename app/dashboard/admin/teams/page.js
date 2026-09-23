'use client'
import React, {useEffect, useState} from 'react';
import DashboardLayout from "@/components/DashboardLayout";
import {useTranslations} from "next-intl";
import {Button} from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {motion} from "framer-motion";
import {Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle} from "@/components/ui/card";
import Image from "next/image";
import TeamAddEditForm from "@/components/TeamAddEditForm";
import {useForm} from "react-hook-form";
import Link from "next/link";
import Loader from "@/components/Loader";
import {useToast} from "@/hooks/use-toast";

export default function TeamsPage() {
    const t = useTranslations('Teams');
    const [teams, setTeams] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const {register, handleSubmit, setValue, reset} = useForm();
    const [isEditing, setIsEditing] = useState(false);
    const [currentTeamId, setCurrentTeamId] = useState(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const {toast} = useToast();

    useEffect(() => {
        async function fetchTeams() {
            try {
                const response = await fetch('/api/admin/teams');
                if (!response.ok) {
                    throw new Error('Failed to fetch teams');
                }
                const data = await response.json();
                setTeams(Array.isArray(data) ? data : []);
            } catch (error) {
                console.error('Error fetching teams:', error);
                setError(error.message);
            } finally {
                setLoading(false);
            }
        }

        fetchTeams();
    }, []);

    const onSubmit = async (data) => {
        try {
            let url = '/api/admin/teams';
            let method = 'POST';

            if (isEditing && currentTeamId) {
                url = `/api/admin/teams/${currentTeamId}`;
                method = 'PUT';
            }

            const response = await fetch(url, {
                method,
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify(data),
            });

            if (response.ok) {
                const updatedTeam = await response.json();
                setTeams(isEditing
                    ? teams.map(team => team._id === currentTeamId ? updatedTeam : team)
                    : [...teams, updatedTeam]
                );

                toast({
                    title: isEditing ? 'Team updated' : 'Team created',
                    description: `The team ${updatedTeam.name} has been ${isEditing ? 'updated' : 'created'}`,
                    variant: 'newSuccess'
                });

                reset();
                setIsEditing(false);
                setCurrentTeamId(null);
                setIsDialogOpen(false);
            } else {
                const errorData = await response.json();
                console.error('Error response from server:', errorData);
                setError(errorData.error || 'An error occurred while saving the team');

                toast({
                    title: 'Error',
                    description: errorData.error || 'An error occurred while saving the team',
                    variant: 'destructive'
                });
            }
        } catch (error) {
            console.error('Error saving team:', error);
            setError('An error occurred while saving the team');

            toast({
                title: 'Error',
                description: 'An unexpected error occurred while saving the team',
                variant: 'destructive'
            });
        }
    };

    const handleEditClick = (team) => {
        setIsEditing(true);
        setCurrentTeamId(team._id);
        setValue('name', team.name);
        setValue('description', team.description);
        setValue('coach', team.coach?._id);
        setIsDialogOpen(true); // Open the dialog for editing
    };

    const handleCreateClick = () => {
        setIsEditing(false);
        setCurrentTeamId(null);
        reset();
        setIsDialogOpen(true);
    };

    if (loading) {
        return (
            <DashboardLayout>
                <motion.div initial={{opacity: 0}} animate={{opacity: 1}} transition={{duration: 0.5}}>
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
                <motion.div initial={{opacity: 0}} animate={{opacity: 1}} transition={{duration: 0.5}}>
                    <h1 className="text-3xl font-bold mb-8">{t('title')}</h1>
                    <p className="text-red-500">Error: {error}</p>
                </motion.div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <div className="container mx-auto py-6">
                <motion.div initial={{opacity: 0, y: 20}} animate={{opacity: 1, y: 0}} transition={{duration: 0.5}}>
                    <div className="flex justify-between">
                        <h1 className="text-3xl font-bold mb-8">{t('title')}</h1>
                        <Button variant="default" onClick={handleCreateClick}>{t('createTeam')}</Button>
                    </div>
                    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                        <DialogContent className="sm:max-w-[425px]">
                            <DialogHeader>
                                <DialogTitle>{isEditing ? t('editTeam') : t('createTeam')}</DialogTitle>
                                <DialogDescription>
                                    {isEditing ? t('editTeamDescription') : t('createTeamDescription')}
                                </DialogDescription>
                            </DialogHeader>
                            <form onSubmit={handleSubmit(onSubmit)}>
                                <TeamAddEditForm
                                    register={register}
                                    setValue={setValue}
                                    initialValues={isEditing ? teams.find(team => team._id === currentTeamId) : null}
                                />
                                <DialogFooter>
                                    <Button type="submit">
                                        {isEditing ? t('updateTeam') : t('saveTeam')}
                                    </Button>
                                </DialogFooter>
                            </form>
                        </DialogContent>
                    </Dialog>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6">
                        {teams.length > 0 ? (
                            teams.map((team) => (
                                <motion.div key={team._id} whileHover={{scale: 1.05}} whileTap={{scale: 0.95}}>
                                    <Card
                                        className="h-full hover:shadow-md transition-shadow duration-300 border-2 hover:border-primary/20">
                                        <Link key={team._id} href={`/dashboard/admin/teams/${team._id}`}>
                                            <CardHeader className="pb-2">
                                                <CardTitle className="text-xl">{team.name}</CardTitle>
                                                <CardDescription className="flex items-center gap-1 line-clamp-1">
                                                    {team.description}
                                                </CardDescription>
                                            </CardHeader>
                                            <CardContent className="flex items-center justify-center">
                                                <Image
                                                    src="/assets/images/logo.png"
                                                    alt="BBA-logo"
                                                    width={150}
                                                    height={150}
                                                    className="object-contain transition-all duration-700"
                                                    priority
                                                />
                                            </CardContent>
                                        </Link>
                                        <CardFooter className="flex justify-between p-4">
                                            <Button variant="outline" onClick={() => handleEditClick(team)}>
                                                {t('editTeam')}
                                            </Button>
                                            <Button variant="destructive">{t('deleteTeam')}</Button>
                                        </CardFooter>
                                    </Card>
                                </motion.div>
                            ))
                        ) : (
                            <p>{t('noTeams')}</p>
                        )}
                    </div>
                </motion.div>
            </div>
        </DashboardLayout>
    );
}
