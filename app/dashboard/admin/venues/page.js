'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Plus, MapPin, Building2, ExternalLink } from 'lucide-react';
import Link from 'next/link';

// Shadcn components
import DashboardLayout from '@/components/DashboardLayout';
import { PageHeader } from '@/components/ui/page-header';
import { EmptyState } from '@/components/ui/empty-state';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';

// Map Component
const MapPreview = ({ latitude, longitude }) => {
  const lat = parseFloat(latitude);
  const lng = parseFloat(longitude);

  if (isNaN(lat) || isNaN(lng)) {
    return (
      <div className="flex h-[140px] w-full items-center justify-center rounded-xl border bg-slate-50 dark:bg-slate-800 text-xs text-slate-400">
        No map coordinates available
      </div>
    );
  }

  const mapUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${lng - 0.01}%2C${lat - 0.01}%2C${lng + 0.01}%2C${lat + 0.01}&layer=mapnik&marker=${lat}%2C${lng}`;

  return (
    <div className="relative h-[140px] w-full overflow-hidden rounded-xl border border-slate-200/80 bg-slate-100 dark:border-slate-800 dark:bg-slate-800">
      <iframe
        title="Map"
        width="100%"
        height="100%"
        frameBorder="0"
        scrolling="no"
        marginHeight={0}
        marginWidth={0}
        src={mapUrl}
        className="h-full w-full pointer-events-none"
      />
    </div>
  );
};

export default function VenuesPage() {
  const [venues, setVenues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [open, setOpen] = useState(false);
  const { toast } = useToast();

  const [newVenue, setNewVenue] = useState({
    name: '',
    latitude: '',
    longitude: '',
    address: '',
    capacity: '',
  });

  const [formErrors, setFormErrors] = useState({});

  const fetchVenues = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/venues');
      if (!response.ok) {
        throw new Error('Failed to fetch venues');
      }
      const data = await response.json();
      setVenues(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message);
      toast({
        title: 'Error',
        description: `Failed to load venues: ${err.message}`,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchVenues();
  }, [fetchVenues]);

  const validateForm = () => {
    const errors = {};
    if (!newVenue.name.trim()) errors.name = 'Name is required';
    if (!newVenue.latitude) errors.latitude = 'Latitude is required';
    if (!newVenue.longitude) errors.longitude = 'Longitude is required';
    if (!newVenue.address.trim()) errors.address = 'Address is required';

    const latNum = parseFloat(newVenue.latitude);
    const lngNum = parseFloat(newVenue.longitude);

    if (isNaN(latNum) || latNum < -90 || latNum > 90) {
      errors.latitude = 'Latitude must be between -90 and 90';
    }

    if (isNaN(lngNum) || lngNum < -180 || lngNum > 180) {
      errors.longitude = 'Longitude must be between -180 and 180';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleInputChange = (e) => {
    const { id, value } = e.target;
    setNewVenue((prev) => ({
      ...prev,
      [id]: value,
    }));
  };

  const handleCreateVenue = async () => {
    if (!validateForm()) return;

    try {
      const response = await fetch('/api/admin/venues', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newVenue.name,
          address: newVenue.address,
          capacity: newVenue.capacity ? parseInt(newVenue.capacity, 10) : undefined,
          location: {
            type: 'Point',
            coordinates: [parseFloat(newVenue.longitude), parseFloat(newVenue.latitude)],
          },
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create venue');
      }

      toast({
        title: 'Success',
        description: 'Venue created successfully',
      });

      setNewVenue({ name: '', latitude: '', longitude: '', address: '', capacity: '' });
      setOpen(false);
      fetchVenues();
    } catch (err) {
      toast({
        title: 'Error',
        description: err.message,
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <PageHeader title="Venues & Facilities" subtitle="Loading academy arenas..." />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-64 w-full rounded-2xl" />
          ))}
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <PageHeader title="Venues & Facilities" subtitle="Error loading arenas" />
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-300">
          Error: {error}
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <PageHeader
        title="Venues & Facilities"
        subtitle="Manage match gyms, training practice courts, and geographic arena locations"
        badge={`${venues.length} Arenas`}
        icon={Building2}
        actions={
          <Button
            onClick={() => setOpen(true)}
            className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-semibold shadow-sm"
          >
            <Plus className="mr-1.5 h-4 w-4" /> Add Venue
          </Button>
        }
      />

      {/* Add Venue Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[480px] rounded-2xl">
          <DialogHeader>
            <DialogTitle>Add New Venue</DialogTitle>
            <DialogDescription>
              Enter arena facility details and geographic coordinates for court bookings.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="name">Venue Name</Label>
              <Input
                id="name"
                value={newVenue.name}
                onChange={handleInputChange}
                placeholder="e.g. BBA Main Court - Olympic Palace"
              />
              {formErrors.name && <p className="text-xs text-rose-500">{formErrors.name}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                value={newVenue.address}
                onChange={handleInputChange}
                placeholder="e.g. 6 University St, Tbilisi"
              />
              {formErrors.address && <p className="text-xs text-rose-500">{formErrors.address}</p>}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="latitude">Latitude</Label>
                <Input
                  id="latitude"
                  value={newVenue.latitude}
                  onChange={handleInputChange}
                  placeholder="e.g. 41.7225"
                />
                {formErrors.latitude && <p className="text-xs text-rose-500">{formErrors.latitude}</p>}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="longitude">Longitude</Label>
                <Input
                  id="longitude"
                  value={newVenue.longitude}
                  onChange={handleInputChange}
                  placeholder="e.g. 44.7788"
                />
                {formErrors.longitude && <p className="text-xs text-rose-500">{formErrors.longitude}</p>}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="capacity">Capacity (Seats, optional)</Label>
              <Input
                id="capacity"
                type="number"
                value={newVenue.capacity}
                onChange={handleInputChange}
                placeholder="e.g. 3000"
              />
            </div>
          </div>

          <DialogFooter className="pt-3 border-t border-slate-100 dark:border-slate-800">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateVenue} className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-semibold">
              Save Venue
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {venues.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {venues.map((venue) => (
              <div
                key={venue._id}
                className="group relative flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-amber-500/30 hover:shadow-lg dark:border-slate-800 dark:bg-slate-900/90"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                      {venue.name}
                    </h3>
                    <Badge variant="outline" className="text-[11px] font-semibold shrink-0">
                      {venue.capacity ? `${venue.capacity} seats` : 'Arena'}
                    </Badge>
                  </div>

                  <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mb-4 line-clamp-1">
                    <MapPin className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                    <span>{venue.address || 'Saburtalo, Tbilisi'}</span>
                  </p>

                  <MapPreview
                    latitude={venue.location?.coordinates?.[1]}
                    longitude={venue.location?.coordinates?.[0]}
                  />
                </div>

                <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
                  <span className="font-mono text-[11px]">
                    {venue.location?.coordinates
                      ? `${venue.location.coordinates[1].toFixed(4)}, ${venue.location.coordinates[0].toFixed(4)}`
                      : 'Coordinates set'}
                  </span>
                  <Link
                    href={`/dashboard/admin/venues/${venue._id}`}
                    className="font-semibold text-amber-600 hover:text-amber-700 dark:text-amber-400 flex items-center gap-1"
                  >
                    Details <ExternalLink className="h-3 w-3" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={Building2}
            title="No venues found"
            description="Add training arenas and court facilities for academy schedules."
            actionText="Add Venue"
            onAction={() => setOpen(true)}
          />
        )}
      </motion.div>
    </DashboardLayout>
  );
}
