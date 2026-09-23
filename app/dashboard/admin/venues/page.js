'use client'

import {useState, useEffect} from "react";
import {useTranslations} from "next-intl";
import {motion} from "framer-motion";
import {Plus, MapPin, Navigation} from "lucide-react";
import Link from "next/link";

// Shadcn components
import DashboardLayout from "@/components/DashboardLayout";
import {Button} from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {Input} from "@/components/ui/input";
import {Label} from "@/components/ui/label";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {Badge} from "@/components/ui/badge";
import {Skeleton} from "@/components/ui/skeleton";
import {useToast} from "@/hooks/use-toast";

// Map Component
const MapPreview = ({latitude, longitude}) => {
    // Convert to correct numeric format
    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);

    // Create OpenStreetMap URL with marker
    const mapUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${lng - 0.01}%2C${lat - 0.01}%2C${lng + 0.01}%2C${lat + 0.01}&layer=mapnik&marker=${lat}%2C${lng}`;

    return (
        <div className="relative h-[140px] w-full overflow-hidden rounded-md border bg-muted">
            <iframe
                src={mapUrl}
                className="h-full w-full"
                title="Venue location map"
                loading="lazy"
            />
            <div
                className="absolute bottom-2 right-2 bg-background/80 backdrop-blur-sm p-1.5 rounded text-xs font-medium flex items-center">
                <Navigation className="h-3 w-3 mr-1"/>
                {lat.toFixed(4)}, {lng.toFixed(4)}
            </div>
        </div>
    );
};

export default function VenuesPage() {
    const t = useTranslations('Venues');
    const [venues, setVenues] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [open, setOpen] = useState(false);
    const {toast} = useToast();

    // Form state
    const [newVenue, setNewVenue] = useState({
        name: '',
        latitude: '',
        longitude: '',
        address: '',
        capacity: '',
    });

    // Form validation
    const [formErrors, setFormErrors] = useState({});

    useEffect(() => {
        fetchVenues();
    }, []);

    async function fetchVenues() {
        try {
            setLoading(true);
            const response = await fetch('/api/admin/venues');
            if (!response.ok) {
                throw new Error('Failed to fetch venues');
            }
            const data = await response.json();
            if (Array.isArray(data)) {
                setVenues(data);
            } else {
                console.error('Expected an array of venues, but received:', data);
                setVenues([]);
            }
        } catch (error) {
            console.error('Error fetching venues:', error);
            setError(error.message);
            toast({
                title: "Error",
                description: `Failed to load venues: ${error.message}`,
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    }

    const validateForm = () => {
        const errors = {};
        if (!newVenue.name.trim()) errors.name = "Name is required";
        if (!newVenue.latitude) errors.latitude = "Latitude is required";
        if (!newVenue.longitude) errors.longitude = "Longitude is required";
        if (!newVenue.address.trim()) errors.address = "Address is required";

        // Validate latitude/longitude format
        const latNum = parseFloat(newVenue.latitude);
        const lngNum = parseFloat(newVenue.longitude);

        if (isNaN(latNum) || latNum < -90 || latNum > 90) {
            errors.latitude = "Latitude must be between -90 and 90";
        }

        if (isNaN(lngNum) || lngNum < -180 || lngNum > 180) {
            errors.longitude = "Longitude must be between -180 and 180";
        }

        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleInputChange = (e) => {
        const {id, value} = e.target;
        setNewVenue({
            ...newVenue,
            [id]: value,
        });
    };

    const handleCreateVenue = async () => {
        if (!validateForm()) return;

        try {
            const requestBody = {
                name: newVenue.name,
                location: {
                    type: "Point",
                    coordinates: [parseFloat(newVenue.longitude), parseFloat(newVenue.latitude)]
                },
                address: newVenue.address,
                capacity: newVenue.capacity ? parseInt(newVenue.capacity) : undefined
            };

            const response = await fetch('/api/admin/venues', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestBody),
            });

            if (response.ok) {
                const newVenueData = await response.json();
                setVenues([...venues, newVenueData]);
                setOpen(false);
                resetForm();
                toast({
                    title: "Success",
                    description: "Venue created successfully",
                });
            } else {
                const data = await response.json();
                toast({
                    title: "Error",
                    description: data.error || "An error occurred while creating venue",
                    variant: "destructive",
                });
            }
        } catch (error) {
            console.error('Error creating venue:', error);
            toast({
                title: "Error",
                description: "An error occurred while creating venue",
                variant: "destructive",
            });
        }
    };

    const resetForm = () => {
        setNewVenue({
            name: '',
            latitude: '',
            longitude: '',
            address: '',
            capacity: '',
        });
        setFormErrors({});
    };

    // Loading skeletons
    if (loading) {
        return (
            <DashboardLayout>
                <div className="container mx-auto py-6">
                    <div className="flex justify-between items-center mb-8">
                        <h1 className="text-3xl font-bold">{t('title')}</h1>
                        <Skeleton className="h-10 w-[100px]"/>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[1, 2, 3, 4, 5, 6].map((i) => (
                            <Skeleton key={i} className="h-[280px] rounded-lg"/>
                        ))}
                    </div>
                </div>
            </DashboardLayout>
        );
    }

    // Error state
    if (error) {
        return (
            <DashboardLayout>
                <div className="container mx-auto py-6">
                    <h1 className="text-3xl font-bold mb-8">{t('title')}</h1>
                    <Card className="border-red-200 bg-red-50 dark:bg-red-950/20">
                        <CardHeader>
                            <CardTitle className="text-red-600">Error Loading Venues</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p>{error}</p>
                        </CardContent>
                        <CardFooter>
                            <Button variant="outline" onClick={fetchVenues}>Retry</Button>
                        </CardFooter>
                    </Card>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <div className="container mx-auto py-6">
                <motion.div
                    initial={{opacity: 0}}
                    animate={{opacity: 1}}
                    transition={{duration: 0.3}}
                >
                    {/* Header with actions */}
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                        <div>
                            <h1 className="text-3xl font-bold">{t('title')}</h1>
                            <p className="text-muted-foreground mt-1">
                                {venues.length} {venues.length === 1 ? 'venue' : 'venues'} available for your academy
                            </p>
                        </div>

                        <Button onClick={() => setOpen(true)}>
                            <Plus className="mr-2 h-4 w-4"/>
                            Add Venue
                        </Button>
                    </div>

                    {/* Venues Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {venues.length > 0 ? (
                            venues.map((venue) => (
                                <Link key={venue._id} href={`/dashboard/admin/venues/${venue._id}`} className="block">
                                    <motion.div
                                        whileHover={{y: -5}}
                                        transition={{type: "spring", stiffness: 300}}
                                    >
                                        <Card
                                            className="h-full hover:shadow-md transition-shadow duration-300 border-2 hover:border-primary/20">
                                            <CardHeader className="pb-2">
                                                <div className="flex justify-between items-start">
                                                    <CardTitle className="text-xl">{venue.name}</CardTitle>
                                                    <Badge variant="outline">
                                                        {venue.capacity ? `${venue.capacity} seats` : 'No capacity set'}
                                                    </Badge>
                                                </div>
                                                <CardDescription className="flex items-center gap-1 line-clamp-1">
                                                    <MapPin className="h-3 w-3 flex-shrink-0"/>
                                                    {venue.address || 'No address provided'}
                                                </CardDescription>
                                            </CardHeader>
                                            <CardContent>
                                                {/* Map Preview */}
                                                <MapPreview
                                                    latitude={venue.location?.coordinates[1]}
                                                    longitude={venue.location?.coordinates[0]}
                                                />
                                            </CardContent>
                                            <CardFooter className="pt-0">
                                                <Button variant="ghost"
                                                        className="w-full justify-start hover:bg-primary/10">
                                                    View Details
                                                </Button>
                                            </CardFooter>
                                        </Card>
                                    </motion.div>
                                </Link>
                            ))
                        ) : (
                            <Card className="col-span-full">
                                <CardHeader>
                                    <CardTitle>No Venues Found</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p>{t('noVenues')}</p>
                                </CardContent>
                                <CardFooter>
                                    <Button onClick={() => setOpen(true)}>
                                        <Plus className="mr-2 h-4 w-4"/>
                                        Add Your First Venue
                                    </Button>
                                </CardFooter>
                            </Card>
                        )}
                    </div>
                </motion.div>

                {/* Add Venue Dialog */}
                <Dialog open={open} onOpenChange={(isOpen) => {
                    setOpen(isOpen);
                    if (!isOpen) resetForm();
                }}>
                    <DialogContent className="sm:max-w-[500px]">
                        <DialogHeader>
                            <DialogTitle>{t('createVenue')}</DialogTitle>
                            <DialogDescription>
                                {t('createVenueDescription')}
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-5 py-4">
                            <div className="grid gap-2">
                                <Label htmlFor="name" className={formErrors.name ? "text-destructive" : ""}>
                                    Venue Name *
                                </Label>
                                <Input
                                    id="name"
                                    value={newVenue.name}
                                    onChange={handleInputChange}
                                    className={formErrors.name ? "border-destructive" : ""}
                                    placeholder="E.g., Main Campus Dojo"
                                />
                                {formErrors.name && <p className="text-destructive text-sm">{formErrors.name}</p>}
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="latitude" className={formErrors.latitude ? "text-destructive" : ""}>
                                        Latitude *
                                    </Label>
                                    <Input
                                        id="latitude"
                                        type="text"
                                        inputMode="decimal"
                                        value={newVenue.latitude}
                                        onChange={handleInputChange}
                                        className={formErrors.latitude ? "border-destructive" : ""}
                                        placeholder="E.g., 51.5074"
                                    />
                                    {formErrors.latitude &&
                                        <p className="text-destructive text-sm">{formErrors.latitude}</p>}
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="longitude"
                                           className={formErrors.longitude ? "text-destructive" : ""}>
                                        Longitude *
                                    </Label>
                                    <Input
                                        id="longitude"
                                        type="text"
                                        inputMode="decimal"
                                        value={newVenue.longitude}
                                        onChange={handleInputChange}
                                        className={formErrors.longitude ? "border-destructive" : ""}
                                        placeholder="E.g., -0.1278"
                                    />
                                    {formErrors.longitude &&
                                        <p className="text-destructive text-sm">{formErrors.longitude}</p>}
                                </div>
                            </div>

                            {/* Map preview in the form */}
                            {newVenue.latitude && newVenue.longitude && !formErrors.latitude && !formErrors.longitude && (
                                <div className="bg-muted p-2 rounded-md">
                                    <p className="text-xs text-muted-foreground mb-2">Location Preview:</p>
                                    <MapPreview
                                        latitude={newVenue.latitude}
                                        longitude={newVenue.longitude}
                                    />
                                </div>
                            )}

                            <div className="grid gap-2">
                                <Label htmlFor="address">
                                    Address <span className="text-muted-foreground">(optional)</span>
                                </Label>
                                <Input
                                    id="address"
                                    value={newVenue.address}
                                    onChange={handleInputChange}
                                    placeholder="Full street address"
                                />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="capacity">
                                    Capacity <span className="text-muted-foreground">(optional)</span>
                                </Label>
                                <Input
                                    id="capacity"
                                    type="number"
                                    value={newVenue.capacity}
                                    onChange={handleInputChange}
                                    placeholder="Maximum number of students"
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setOpen(false)} className="mr-2">
                                Cancel
                            </Button>
                            <Button type="submit" onClick={handleCreateVenue}>
                                Create Venue
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </DashboardLayout>
    );
}