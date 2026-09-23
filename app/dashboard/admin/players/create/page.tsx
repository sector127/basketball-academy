'use client';
import {useForm, Controller} from 'react-hook-form';
import {zodResolver} from '@hookform/resolvers/zod';
import {useRouter} from 'next/navigation';
import useSWR from 'swr';
import DashboardLayout from '@/components/DashboardLayout';
import {useToast} from "@/hooks/use-toast";
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
import React, {useState} from "react";
import {MdCloudUpload} from "react-icons/md";

interface Team {
    _id: string;
    name: string;
}

const AddPlayerPage = () => {
    const {toast} = useToast();
    const router = useRouter();
    const [imagePreview, setImagePreview] = useState<string | null>(null);

    const {register, handleSubmit, control, formState: {errors, isSubmitting}} = useForm<PlayerFormData>({
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
        }
    });

    const {data: teams, error: teamsError, isLoading: teamsLoading} = useSWR<Team[]>('/api/admin/teams', fetcher);

    const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const onSubmit = async (data: PlayerFormData) => {
        try {
            const formData = new FormData();

            // Append all text fields
            Object.keys(data).forEach(key => {
                if (data[key] !== undefined && data[key] !== null) {
                    formData.append(key, data[key].toString());
                }
            });

            // Append profile picture if exists
            const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
            if (fileInput && fileInput.files?.[0]) {
                formData.append('profilePicture', fileInput.files[0]);
            }

            const response = await fetch('/api/admin/players', {
                method: 'POST',
                body: formData,
            });

            if (response.ok) {
                const player = await response.json();
                console.log('New player created:', player);

                toast({
                    title: 'Success',
                    description: 'Player added successfully!',
                    variant: 'newSuccess',
                });

                router.push('/dashboard/admin/players');
            } else {
                const errorData = await response.json();
                console.log(errorData);

                toast({
                    title: 'Error',
                    description: errorData.error || 'Failed to add player',
                    variant: 'destructive',
                });
            }
        } catch (error) {
            console.error('Error creating player:', error);

            toast({
                title: 'Error',
                description: 'An unexpected error occurred. Please try again.',
                variant: 'destructive',
            });
        }
    };

    return (
        <DashboardLayout>
            <Card>
                <CardContent>
                    <Typography variant="h5" gutterBottom>
                        Add Player
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
                                        src={imagePreview || undefined}
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
                                        Upload Profile Picture
                                        <input
                                            type="file"
                                            hidden
                                            accept="image/*"
                                            onChange={handleImageChange}
                                        />
                                    </Button>
                                </Box>
                            </Grid>

                            {/* Name */}
                            <Grid size={3}>
                                <TextField
                                    fullWidth
                                    label="Name"
                                    {...register("name")}
                                    error={!!errors.name}
                                    helperText={errors.name?.message}
                                />
                            </Grid>

                            {/* Last Name */}
                            <Grid size={3}>
                                <TextField
                                    fullWidth
                                    label="Last Name"
                                    {...register("lastname")}
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
                                    {...register("dateOfBirth")}
                                    error={!!errors.dateOfBirth}
                                    helperText={errors.dateOfBirth?.message}
                                    InputLabelProps={{
                                        shrink: true,
                                    }}
                                />
                            </Grid>

                            {/* Height */}
                            <Grid size={3}>
                                <TextField
                                    fullWidth
                                    label="Height (cm)"
                                    type="number"
                                    {...register("height", {valueAsNumber: true})}
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
                                    {...register("jerseyNum", {valueAsNumber: true})}
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
                                            disabled={teamsLoading || !!teamsError}
                                        >
                                            <MenuItem value="">Select a team</MenuItem>
                                            {teamsLoading ? (
                                                <MenuItem disabled>Loading teams...</MenuItem>
                                            ) : teamsError ? (
                                                <MenuItem disabled>Error loading teams</MenuItem>
                                            ) : (
                                                teams?.map((team) => (
                                                    <MenuItem key={team._id} value={team._id}>
                                                        {team.name}
                                                    </MenuItem>
                                                ))
                                            )}
                                        </TextField>
                                    )}
                                />
                            </Grid>

                            {/* Phone Number */}
                            <Grid size={3}>
                                <TextField
                                    fullWidth
                                    label="Phone Number"
                                    {...register("tel")}
                                    error={!!errors.tel}
                                    helperText={errors.tel?.message}
                                />
                            </Grid>

                            {/* Address */}
                            <Grid size={6}>
                                <TextField
                                    fullWidth
                                    label="Address"
                                    {...register("address")}
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
                                    {...register("guardianTel")}
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
                                {isSubmitting ? <CircularProgress size={24}/> : 'Add Player'}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </DashboardLayout>
    );
};

export default AddPlayerPage;

// Utility function for fetching data using useSWR
const fetcher = (url: string) => fetch(url).then((res) => res.json());