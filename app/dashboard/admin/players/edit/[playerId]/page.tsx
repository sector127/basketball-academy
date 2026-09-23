'use client';
import {useForm, Controller} from 'react-hook-form';
import {zodResolver} from '@hookform/resolvers/zod';
import {useRouter} from 'next/navigation';
import useSWR from 'swr';
import DashboardLayout from '@/components/DashboardLayout';
import {useToast} from '@/hooks/use-toast';
import {playerSchema, PlayerFormData} from '@/schemas/playerSchema';
import {
    Button,
    Card,
    CardContent,
    TextField,
    Typography,
    MenuItem,
    CircularProgress,
    Box,
    Avatar
} from '@mui/material';
import Grid from '@mui/material/Grid2';
import React, {useEffect, useState} from 'react';
import Loader from "@/components/Loader";
import {MdCloudUpload} from "react-icons/md";

interface EditPlayerPageProps {
    params: Promise<{ playerId: string }>
}

const EditPlayerPage = ({params}: EditPlayerPageProps) => {
    const {toast} = useToast();
    const router = useRouter();
    const {playerId} = React.use(params) as { playerId: string };
    const [imagePreview, setImagePreview] = useState(null);

    const {data: player, error: playerError, isLoading: playerLoading} = useSWR(
        `/api/admin/players/${playerId}`,
        fetcher
    );

    const {data: teams, error: teamsError, isLoading: teamsLoading} = useSWR('/api/admin/teams', fetcher);

    const {register, handleSubmit, control, reset, formState: {errors, isSubmitting}} = useForm<PlayerFormData>({
        resolver: zodResolver(playerSchema),
        defaultValues: {
            name: '',
            lastname: '',
            dateOfBirth: '',
            height: 0,
            position: '',
            jerseyNum: 0,
            teamId: '',
            tel: '',
            address: '',
            guardian: '',
            guardianTel: '',
        },
    });

    useEffect(() => {
        if (player) {
            const updatedValues = {
                name: player.name || '',
                lastname: player.lastname || '',
                dateOfBirth: player.dateOfBirth
                    ? new Date(player.dateOfBirth).toISOString().split('T')[0]
                    : '',
                height: player.height || 0,
                position: player.position || '',
                jerseyNum: player.jerseyNum || 0,
                teamId: player.team?._id || '',
                tel: player.tel || '',
                address: player.address || '',
                guardian: player.guardian || '',
                guardianTel: player.guardianTel || '',
            };
            reset(updatedValues);

            // Set initial image preview if player has a profile picture
            if (player.profilePicture) {
                setImagePreview(player.profilePicture);
            }
        }
    }, [player, reset]);

    const handleImageChange = (event) => {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const onSubmit = async (data: PlayerFormData) => {
        try {
            const formData = new FormData();

            // Append all form fields
            Object.keys(data).forEach(key => {
                if (data[key] !== undefined && data[key] !== null) {
                    formData.append(key, data[key]);
                }
            });

            // Append profile picture if a new one was selected
            const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
            if (fileInput && fileInput.files[0]) {
                formData.append('profilePicture', fileInput.files[0]);
            }

            const response = await fetch(`/api/players/${playerId}`, {
                method: 'PUT',
                body: formData, // Send as FormData instead of JSON
            });

            if (response.ok) {
                const updatedPlayer = await response.json();
                console.log('Player updated:', updatedPlayer);

                toast({
                    title: 'Success',
                    description: 'Player updated successfully!',
                    variant: 'newSuccess',
                });

                router.push('/dashboard/players');
            } else {
                const errorData = await response.json();
                console.log(errorData);

                toast({
                    title: 'Error',
                    description: errorData.error || 'Failed to update player',
                    variant: 'destructive',
                });
            }
        } catch (error) {
            console.error('Error updating player:', error);

            toast({
                title: 'Error',
                description: 'An unexpected error occurred. Please try again.',
                variant: 'destructive',
            });
        }
    };

    if (playerLoading || teamsLoading) {
        return (
            <DashboardLayout>
                <Loader/>
            </DashboardLayout>
        );
    }

    if (playerError || teamsError) {
        return (
            <DashboardLayout>
                <Typography color="error">Failed to load data. Please try again.</Typography>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <Card>
                <CardContent>
                    <Typography variant="h5" gutterBottom>
                        Edit Player
                    </Typography>
                    <form onSubmit={handleSubmit(onSubmit)}>
                        <Grid container spacing={3}>
                            {/* Profile Picture Upload */}
                            <Grid size={12}>
                                <Box
                                    sx={{
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        gap: 2,
                                        mb: 2
                                    }}
                                >
                                    <Avatar
                                        src={imagePreview}
                                        sx={{
                                            width: 100,
                                            height: 100,
                                            mb: 2
                                        }}
                                    />
                                    <Button
                                        component="label"
                                        variant="outlined"
                                        startIcon={<MdCloudUpload/>}
                                    >
                                        Update Profile Picture
                                        <input
                                            type="file"
                                            hidden
                                            accept="image/*"
                                            onChange={handleImageChange}
                                        />
                                    </Button>
                                </Box>
                            </Grid>

                        </Grid>
                        <Grid container spacing={3}>
                            {/* Name */}
                            <Grid size={3}>
                                <TextField
                                    fullWidth
                                    label="Name"
                                    {...register('name')}
                                    error={!!errors.name}
                                    helperText={errors.name?.message}
                                />
                            </Grid>

                            {/* Last Name */}
                            <Grid size={3}>
                                <TextField
                                    fullWidth
                                    label="Last Name"
                                    {...register('lastname')}
                                    error={!!errors.lastname}
                                    helperText={errors.lastname?.message}
                                />
                            </Grid>

                            {/* Date of Birth */}
                            <Grid size={3}>
                                <TextField
                                    fullWidth
                                    label="Date of Birth"
                                    type="date"
                                    {...register('dateOfBirth')}
                                    error={!!errors.dateOfBirth}
                                    helperText={errors.dateOfBirth?.message}
                                />
                            </Grid>

                            {/* Height */}
                            <Grid size={3}>
                                <TextField
                                    fullWidth
                                    label="Height (cm)"
                                    type="number"
                                    {...register('height', {valueAsNumber: true})}
                                    error={!!errors.height}
                                    helperText={errors.height?.message}
                                />
                            </Grid>

                            {/* Position */}
                            <Grid size={3}>
                                <Controller
                                    name="position"
                                    control={control}
                                    render={({field}) => (
                                        <TextField
                                            {...field}
                                            fullWidth
                                            select
                                            label="Position"
                                            error={!!errors.position}
                                            helperText={errors.position?.message}
                                        >
                                            <MenuItem value="">Select a position</MenuItem>
                                            <MenuItem value="Point Guard">Point Guard</MenuItem>
                                            <MenuItem value="Shooting Guard">Shooting Guard</MenuItem>
                                            <MenuItem value="Small Forward">Small Forward</MenuItem>
                                            <MenuItem value="Power Forward">Power Forward</MenuItem>
                                            <MenuItem value="Center">Center</MenuItem>
                                        </TextField>
                                    )}
                                />
                            </Grid>

                            {/* Jersey Number */}
                            <Grid size={3}>
                                <TextField
                                    fullWidth
                                    label="Jersey Number"
                                    type="number"
                                    {...register('jerseyNum', {valueAsNumber: true})}
                                    error={!!errors.jerseyNum}
                                    helperText={errors.jerseyNum?.message}
                                />
                            </Grid>

                            {/* Team */}
                            <Grid size={3}>
                                <Controller
                                    name="teamId"
                                    control={control}
                                    render={({field}) => (
                                        <TextField
                                            {...field}
                                            fullWidth
                                            select
                                            label="Team"
                                            error={!!errors.teamId}
                                            helperText={errors.teamId?.message}
                                            disabled={teamsLoading}
                                        >
                                            <MenuItem value="">Select a team</MenuItem>
                                            {teams?.map((team) => (
                                                <MenuItem key={team._id} value={team._id}>
                                                    {team.name}
                                                </MenuItem>
                                            ))}
                                        </TextField>
                                    )}
                                />
                            </Grid>

                            {/* Phone Number */}
                            <Grid size={3}>
                                <TextField
                                    fullWidth
                                    label="Phone Number"
                                    {...register('tel')}
                                    error={!!errors.tel}
                                    helperText={errors.tel?.message}
                                />
                            </Grid>

                            {/* Address */}
                            <Grid size={6}>
                                <TextField
                                    fullWidth
                                    label="Address"
                                    {...register('address')}
                                    error={!!errors.address}
                                    helperText={errors.address?.message}
                                    multiline
                                    rows={4}
                                />
                            </Grid>

                            {/* Guardian */}
                            <Grid size={3}>
                                <Controller
                                    name="guardian"
                                    control={control}
                                    render={({field}) => (
                                        <TextField
                                            {...field}
                                            fullWidth
                                            select
                                            label="Guardian"
                                            error={!!errors.guardian}
                                            helperText={errors.guardian?.message}
                                        >
                                            <MenuItem value="">Select a guardian</MenuItem>
                                            <MenuItem value="Mother">Mother</MenuItem>
                                            <MenuItem value="Father">Father</MenuItem>
                                            <MenuItem value="Other">Other</MenuItem>
                                        </TextField>
                                    )}
                                />
                            </Grid>

                            {/* Guardian Phone Number */}
                            <Grid size={3}>
                                <TextField
                                    fullWidth
                                    label="Guardian Phone Number"
                                    {...register('guardianTel')}
                                    error={!!errors.guardianTel}
                                    helperText={errors.guardianTel?.message}
                                />
                            </Grid>
                        </Grid>
                        <div className="flex justify-end mt-4">
                            <Button
                                type="submit"
                                variant="contained"
                                color="primary"
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? <CircularProgress size={24}/> : 'Update Player'}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </DashboardLayout>
    );
};

export default EditPlayerPage;

const fetcher = (url: string) => fetch(url).then((res) => res.json());