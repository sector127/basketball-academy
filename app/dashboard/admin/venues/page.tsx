'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { motion } from 'framer-motion';
import {
  Plus,
  MapPin,
  Building2,
  ExternalLink,
  Edit2,
  Trash2,
  Search,
  Users,
  Trophy,
  Navigation,
  AlertTriangle,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import DashboardLayout from '@/components/DashboardLayout';

// Shadcn components
import { PageHeader } from '@/components/ui/page-header';
import { StatCard } from '@/components/ui/stat-card';
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useIsAdmin } from '@/hooks/use-is-admin';

export interface VenueLocation {
  type?: string;
  coordinates?: [number, number];
}

export interface VenueItem {
  _id: string;
  name: string;
  address: string;
  capacity?: number;
  type?: 'indoor' | 'outdoor' | 'training_facility' | string;
  description?: string;
  location?: VenueLocation;
}

interface VenueFormData {
  name: string;
  address: string;
  latitude: string;
  longitude: string;
  capacity: string;
  type: string;
  description: string;
}

interface FormErrors {
  name?: string;
  address?: string;
  latitude?: string;
  longitude?: string;
}

interface MapPreviewProps {
  latitude?: number | string;
  longitude?: number | string;
  name?: string;
}

// Dynamic import for Leaflet-based Location Picker to avoid SSR issues
const VenueLocationPicker = dynamic(
  () => import('@/components/venues/VenueLocationPicker'),
  {
    ssr: false,
    loading: () => (
      <div className="h-[210px] w-full rounded-xl bg-slate-100 dark:bg-slate-800 animate-pulse flex flex-col items-center justify-center gap-2 text-xs text-slate-400">
        <MapPin className="h-6 w-6 text-amber-500 animate-bounce" />
        <span>Loading interactive court map...</span>
      </div>
    ),
  }
);

// Map Preview for Cards with link out to Google Maps
const MapPreview: React.FC<MapPreviewProps> = ({ latitude, longitude, name }) => {
  const lat = typeof latitude === 'number' ? latitude : parseFloat(latitude || '');
  const lng = typeof longitude === 'number' ? longitude : parseFloat(longitude || '');

  if (isNaN(lat) || isNaN(lng)) {
    return (
      <div className="flex h-[140px] w-full items-center justify-center rounded-xl border border-slate-200/80 bg-slate-50 dark:border-slate-800 dark:bg-slate-800/60 text-xs text-slate-400">
        No map coordinates available
      </div>
    );
  }

  const mapUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${lng - 0.008}%2C${lat - 0.008}%2C${lng + 0.008}%2C${lat + 0.008}&layer=mapnik&marker=${lat}%2C${lng}`;
  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;

  return (
    <div className="relative group/map h-[140px] w-full overflow-hidden rounded-xl border border-slate-200/80 bg-slate-100 dark:border-slate-800 dark:bg-slate-800 shadow-inner">
      <iframe
        title={`Map of ${name || 'Venue'}`}
        width="100%"
        height="100%"
        scrolling="no"
        src={mapUrl}
        className="h-full w-full pointer-events-none"
      />
      {/* Hover action to open external map */}
      <a
        href={googleMapsUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover/map:opacity-100 transition-opacity flex items-center justify-center gap-1.5 text-xs font-semibold text-white backdrop-blur-[2px]"
      >
        <Navigation className="h-3.5 w-3.5 text-amber-400" />
        <span>Open in Google Maps</span>
        <ExternalLink className="h-3 w-3" />
      </a>
    </div>
  );
};

export default function VenuesPage() {
  const t = useTranslations('Venues');
  const isAdmin = useIsAdmin();
  const [venues, setVenues] = useState<VenueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingVenueId, setEditingVenueId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Delete Alert Dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [venueToDelete, setVenueToDelete] = useState<VenueItem | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Form State
  const [formData, setFormData] = useState<VenueFormData>({
    name: '',
    address: '',
    latitude: '',
    longitude: '',
    capacity: '',
    type: 'indoor',
    description: '',
  });

  const [formErrors, setFormErrors] = useState<FormErrors>({});

  const fetchVenues = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/venues');
      if (!response.ok) {
        throw new Error('Failed to fetch venues');
      }
      const data: unknown = await response.json();
      setVenues(Array.isArray(data) ? (data as VenueItem[]) : []);
      setError(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
      toast({
        title: 'Error',
        description: `Failed to load venues: ${message}`,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchVenues();
  }, [fetchVenues]);

  // Derived KPI metrics
  const stats = useMemo(() => {
    const total = venues.length;
    let totalCap = 0;
    let ratedCount = 0;
    const districts = new Set<string>();

    venues.forEach((v) => {
      if (v.capacity && typeof v.capacity === 'number') {
        totalCap += v.capacity;
        ratedCount++;
      }
      if (v.address) {
        const lower = v.address.toLowerCase();
        if (lower.includes('saburtalo')) districts.add('Saburtalo');
        if (lower.includes('vake')) districts.add('Vake');
        if (lower.includes('didube')) districts.add('Didube');
        if (lower.includes('vera')) districts.add('Vera');
        if (lower.includes('brooklyn')) districts.add('Brooklyn');
      }
    });

    const avgCap = ratedCount > 0 ? Math.round(totalCap / ratedCount) : 0;
    const districtText =
      districts.size > 0
        ? Array.from(districts).slice(0, 3).join(', ')
        : 'Tbilisi Metro';

    return {
      total,
      totalCap,
      avgCap,
      districtText,
    };
  }, [venues]);

  // Filtered venues list
  const filteredVenues = useMemo(() => {
    return venues.filter((venue) => {
      const matchesSearch =
        searchQuery.trim() === '' ||
        venue.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        venue.address?.toLowerCase().includes(searchQuery.toLowerCase());

      const venueType = venue.type || 'indoor';
      const matchesType = typeFilter === 'all' || venueType === typeFilter;

      return matchesSearch && matchesType;
    });
  }, [venues, searchQuery, typeFilter]);

  // Validation
  const validateForm = () => {
    const errors: FormErrors = {};
    if (!formData.name.trim()) errors.name = 'Venue name is required';
    if (!formData.address.trim()) errors.address = 'Address is required';
    if (!formData.latitude) errors.latitude = 'Latitude is required';
    if (!formData.longitude) errors.longitude = 'Longitude is required';

    const latNum = parseFloat(formData.latitude);
    const lngNum = parseFloat(formData.longitude);

    if (isNaN(latNum) || latNum < -90 || latNum > 90) {
      errors.latitude = 'Latitude must be between -90 and 90';
    }

    if (isNaN(lngNum) || lngNum < -180 || lngNum > 180) {
      errors.longitude = 'Longitude must be between -180 and 180';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Open Add Dialog
  const handleOpenAdd = () => {
    setIsEditing(false);
    setEditingVenueId(null);
    setFormData({
      name: '',
      address: '',
      latitude: '41.7225',
      longitude: '44.7788',
      capacity: '',
      type: 'indoor',
      description: '',
    });
    setFormErrors({});
    setDialogOpen(true);
  };

  // Open Edit Dialog
  const handleOpenEdit = (venue: VenueItem) => {
    setIsEditing(true);
    setEditingVenueId(venue._id);
    setFormData({
      name: venue.name || '',
      address: venue.address || '',
      latitude: venue.location?.coordinates?.[1]?.toString() || '41.7225',
      longitude: venue.location?.coordinates?.[0]?.toString() || '44.7788',
      capacity: venue.capacity ? venue.capacity.toString() : '',
      type: venue.type || 'indoor',
      description: venue.description || '',
    });
    setFormErrors({});
    setDialogOpen(true);
  };

  // Open Delete Confirmation Dialog
  const handleOpenDelete = (venue: VenueItem) => {
    setVenueToDelete(venue);
    setDeleteDialogOpen(true);
  };

  // Save (Create or Update) Venue
  const handleSaveVenue = async () => {
    if (!validateForm()) return;

    try {
      setSubmitting(true);
      const payload = {
        name: formData.name.trim(),
        address: formData.address.trim(),
        capacity: formData.capacity ? parseInt(formData.capacity, 10) : undefined,
        type: formData.type || 'indoor',
        description: formData.description.trim(),
        location: {
          type: 'Point',
          coordinates: [
            parseFloat(formData.longitude),
            parseFloat(formData.latitude),
          ],
        },
      };

      const url = isEditing
        ? `/api/admin/venues/${editingVenueId}`
        : '/api/admin/venues';
      const method = isEditing ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = (await response.json()) as { error?: string };
        throw new Error(errorData.error || 'Failed to save venue');
      }

      toast({
        title: 'Success',
        description: isEditing ? t('venueUpdated') : t('venueCreated'),
      });

      setDialogOpen(false);
      fetchVenues();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Delete Venue
  const handleDeleteVenue = async () => {
    if (!venueToDelete) return;

    try {
      setDeleting(true);
      const response = await fetch(`/api/admin/venues/${venueToDelete._id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = (await response.json()) as { error?: string };
        throw new Error(errorData.error || 'Failed to delete venue');
      }
      const result = (await response.json()) as { archived?: boolean; message?: string };

      toast({
        title: 'Success',
        description: result.archived ? result.message : t('venueDeleted'),
      });

      setDeleteDialogOpen(false);
      setVenueToDelete(null);
      fetchVenues();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setDeleting(false);
    }
  };

  // Location Picker change handler
  const handleLocationChange = ({
    latitude,
    longitude,
    address: suggestedAddress,
    suggestedName,
    suggestedCapacity,
  }: {
    latitude?: string;
    longitude?: string;
    address?: string;
    suggestedName?: string;
    suggestedCapacity?: number;
  }) => {
    setFormData((prev) => {
      const updated = { ...prev };
      if (latitude !== undefined) updated.latitude = latitude;
      if (longitude !== undefined) updated.longitude = longitude;
      if (suggestedAddress) updated.address = suggestedAddress;
      if (suggestedName) updated.name = suggestedName;
      if (suggestedCapacity && !prev.capacity) {
        updated.capacity = suggestedCapacity.toString();
      }
      return updated;
    });

    // Clear coordinate errors if resolved
    setFormErrors((prev) => {
      const errs = { ...prev };
      if (latitude) delete errs.latitude;
      if (longitude) delete errs.longitude;
      if (suggestedAddress) delete errs.address;
      return errs;
    });
  };

  if (loading && venues.length === 0) {
    return (
      <DashboardLayout>
        <PageHeader
          title={t('managementTitle')}
          subtitle={t('managementSubtitle')}
          icon={Building2}
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-28 rounded-2xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-80 w-full rounded-2xl" />
          ))}
        </div>
      </DashboardLayout>
    );
  }

  if (error && venues.length === 0) {
    return (
      <DashboardLayout>
        <PageHeader
          title={t('managementTitle')}
          subtitle={t('managementSubtitle')}
          icon={Building2}
        />
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-300">
          <p className="font-semibold text-base mb-1">Error loading venues</p>
          <p>{error}</p>
          <Button onClick={fetchVenues} variant="outline" className="mt-4">
            Try Again
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <PageHeader
        title={t('managementTitle')}
        subtitle={t('managementSubtitle')}
        badge={`${venues.length} ${t('title')}`}
        icon={Building2}
        actions={
          isAdmin && (
            <Button
              onClick={handleOpenAdd}
              className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-semibold shadow-sm transition-all hover:scale-[1.02]"
            >
              <Plus className="mr-1.5 h-4 w-4" /> {t('addVenue')}
            </Button>
          )
        }
      />

      {/* KPI Stat Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          title={t('totalVenues')}
          value={stats.total}
          icon={Building2}
          accent="gold"
        />
        <StatCard
          title={t('totalCapacity')}
          value={
            stats.totalCap > 0
              ? `${stats.totalCap.toLocaleString()} ${t('seats')}`
              : '--'
          }
          icon={Users}
          accent="purple"
        />
        <StatCard
          title={t('avgCapacity')}
          value={
            stats.avgCap > 0
              ? `${stats.avgCap.toLocaleString()} ${t('seats')}`
              : '--'
          }
          icon={Trophy}
          accent="blue"
        />
        <StatCard
          title={t('activeDistricts')}
          value={stats.districtText}
          icon={MapPin}
          accent="emerald"
        />
      </div>

      {/* Search & Filter Bar */}
      <div className="mb-6 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-slate-900/90 p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('searchVenues')}
            className="pl-10 text-xs sm:text-sm h-9 rounded-xl bg-slate-50/70 dark:bg-slate-800/60 border-slate-200/80 dark:border-slate-800"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          <Button
            size="sm"
            variant={typeFilter === 'all' ? 'default' : 'ghost'}
            onClick={() => setTypeFilter('all')}
            className={`text-xs h-8 rounded-lg ${
              typeFilter === 'all'
                ? 'bg-amber-500 hover:bg-amber-600 text-slate-950 font-semibold'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            {t('filterAll')}
          </Button>
          <Button
            size="sm"
            variant={typeFilter === 'indoor' ? 'default' : 'ghost'}
            onClick={() => setTypeFilter('indoor')}
            className={`text-xs h-8 rounded-lg ${
              typeFilter === 'indoor'
                ? 'bg-amber-500 hover:bg-amber-600 text-slate-950 font-semibold'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            {t('filterIndoor')}
          </Button>
          <Button
            size="sm"
            variant={typeFilter === 'outdoor' ? 'default' : 'ghost'}
            onClick={() => setTypeFilter('outdoor')}
            className={`text-xs h-8 rounded-lg ${
              typeFilter === 'outdoor'
                ? 'bg-amber-500 hover:bg-amber-600 text-slate-950 font-semibold'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            {t('filterOutdoor')}
          </Button>
          <Button
            size="sm"
            variant={typeFilter === 'training_facility' ? 'default' : 'ghost'}
            onClick={() => setTypeFilter('training_facility')}
            className={`text-xs h-8 rounded-lg ${
              typeFilter === 'training_facility'
                ? 'bg-amber-500 hover:bg-amber-600 text-slate-950 font-semibold'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            {t('filterTraining')}
          </Button>
        </div>
      </div>

      {/* Add / Edit Venue Modal with Interactive Map */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[560px] max-h-[90vh] overflow-y-auto rounded-2xl p-6">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <Building2 className="h-5 w-5 text-amber-500" />
              {isEditing ? t('editVenueTitle') : t('createVenueTitle')}
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              {isEditing ? t('editVenueDescription') : t('createVenueDescription')}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* 1. Interactive Map and Location Search */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5 text-amber-500" />
                  {t('venueLocation')} & Map Search
                </Label>
                <span className="text-[11px] text-slate-400">
                  Search address or click on court
                </span>
              </div>

              <VenueLocationPicker
                latitude={formData.latitude}
                longitude={formData.longitude}
                address={formData.address}
                name={formData.name}
                onLocationChange={handleLocationChange}
              />
              {(formErrors.latitude || formErrors.longitude) && (
                <p className="text-xs text-rose-500">
                  {formErrors.latitude || formErrors.longitude}
                </p>
              )}
            </div>

            {/* 2. Venue Name */}
            <div className="space-y-1.5">
              <Label htmlFor="venue-name" className="text-xs font-semibold">
                {t('venueName')} *
              </Label>
              <Input
                id="venue-name"
                value={formData.name}
                onChange={(e) => {
                  setFormData((prev) => ({ ...prev, name: e.target.value }));
                  if (formErrors.name) {
                    setFormErrors((prev) => ({ ...prev, name: undefined }));
                  }
                }}
                placeholder="e.g. BBA Main Court - Olympic Palace"
                className="h-9.5 text-xs sm:text-sm rounded-xl"
              />
              {formErrors.name && (
                <p className="text-xs text-rose-500">{formErrors.name}</p>
              )}
            </div>

            {/* 3. Address */}
            <div className="space-y-1.5">
              <Label htmlFor="venue-address" className="text-xs font-semibold">
                Address / Street *
              </Label>
              <Input
                id="venue-address"
                value={formData.address}
                onChange={(e) => {
                  setFormData((prev) => ({ ...prev, address: e.target.value }));
                  if (formErrors.address) {
                    setFormErrors((prev) => ({ ...prev, address: undefined }));
                  }
                }}
                placeholder="e.g. 15 University St, Saburtalo, Tbilisi"
                className="h-9.5 text-xs sm:text-sm rounded-xl"
              />
              {formErrors.address && (
                <p className="text-xs text-rose-500">{formErrors.address}</p>
              )}
            </div>

            {/* 4. Type & Seating Capacity Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="space-y-1.5">
                <Label htmlFor="venue-type" className="text-xs font-semibold">
                  {t('venueType')}
                </Label>
                <Select
                  value={formData.type}
                  onValueChange={(val) =>
                    setFormData((prev) => ({ ...prev, type: val }))
                  }
                >
                  <SelectTrigger id="venue-type" className="h-9.5 text-xs rounded-xl">
                    <SelectValue placeholder="Select facility type..." />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="indoor">{t('indoorArena')}</SelectItem>
                    <SelectItem value="outdoor">{t('outdoorCourt')}</SelectItem>
                    <SelectItem value="training_facility">
                      {t('trainingFacility')}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="venue-capacity" className="text-xs font-semibold">
                  {t('capacity')}
                </Label>
                <Input
                  id="venue-capacity"
                  type="number"
                  value={formData.capacity}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, capacity: e.target.value }))
                  }
                  placeholder="e.g. 3600"
                  className="h-9.5 text-xs sm:text-sm rounded-xl"
                />
              </div>
            </div>

            {/* 5. Optional Description / Court specs */}
            <div className="space-y-1.5">
              <Label htmlFor="venue-desc" className="text-xs font-semibold">
                Facility Specifications / Notes
              </Label>
              <Textarea
                id="venue-desc"
                value={formData.description}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, description: e.target.value }))
                }
                placeholder="e.g. Hardwood floor, FIBA certified hoops, 2 locker rooms, public parking."
                className="text-xs rounded-xl resize-none h-18"
              />
            </div>
          </div>

          <DialogFooter className="pt-3 border-t border-slate-100 dark:border-slate-800 gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setDialogOpen(false)}
              className="rounded-xl"
            >
              {t('cancel')}
            </Button>
            <Button
              type="button"
              onClick={handleSaveVenue}
              disabled={submitting}
              className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-semibold rounded-xl shadow-sm"
            >
              {submitting ? 'Saving...' : isEditing ? 'Save Changes' : t('saveVenue')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Alert Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-rose-600">
              <AlertTriangle className="h-5 w-5" />
              {t('deleteVenueTitle')}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-slate-500">
              {t('deleteVenueConfirm')}
              {venueToDelete && (
                <span className="block mt-2 font-semibold text-slate-800 dark:text-slate-200">
                  &ldquo;{venueToDelete.name}&rdquo;
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting} className="rounded-xl">
              {t('cancel')}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteVenue}
              disabled={deleting}
              className="bg-rose-600 hover:bg-rose-700 text-white font-semibold rounded-xl"
            >
              {deleting ? 'Deleting...' : t('confirmDelete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Venues Grid */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {filteredVenues.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredVenues.map((venue) => {
              const venueType = venue.type || 'indoor';
              const typeConfig =
                venueType === 'outdoor'
                  ? {
                      label: t('outdoorCourt'),
                      style:
                        'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20',
                    }
                  : venueType === 'training_facility'
                  ? {
                      label: t('trainingFacility'),
                      style:
                        'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20',
                    }
                  : {
                      label: t('indoorArena'),
                      style:
                        'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20',
                    };

              return (
                <div
                  key={venue._id}
                  className="group relative flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-amber-500/30 hover:shadow-lg dark:border-slate-800 dark:bg-slate-900/90"
                >
                  <div>
                    {/* Card Header: Name + Badges */}
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors truncate">
                          {venue.name}
                        </h3>
                        <div className="flex items-center gap-1.5 mt-1">
                          <Badge
                            variant="outline"
                            className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 ${typeConfig.style}`}
                          >
                            {typeConfig.label}
                          </Badge>
                        </div>
                      </div>

                      <Badge
                        variant="outline"
                        className="text-[11px] font-semibold shrink-0 bg-slate-50 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700"
                      >
                        {venue.capacity
                          ? `${venue.capacity.toLocaleString()} ${t('seats')}`
                          : 'Arena'}
                      </Badge>
                    </div>

                    {/* Address */}
                    <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mb-3.5 line-clamp-1">
                      <MapPin className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                      <span className="truncate">
                        {venue.address || 'Tbilisi, Georgia'}
                      </span>
                    </p>

                    {/* Interactive Map Preview */}
                    <MapPreview
                      latitude={venue.location?.coordinates?.[1]}
                      longitude={venue.location?.coordinates?.[0]}
                      name={venue.name}
                    />

                    {/* Description if present */}
                    {venue.description && (
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2.5 line-clamp-2 italic">
                        &ldquo;{venue.description}&rdquo;
                      </p>
                    )}
                  </div>

                  {/* Card Actions Footer */}
                  <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                    <span className="font-mono text-[10px] text-slate-400 dark:text-slate-500">
                      {venue.location?.coordinates
                        ? `${venue.location.coordinates[1].toFixed(4)}, ${venue.location.coordinates[0].toFixed(4)}`
                        : 'Coordinates set'}
                    </span>

                    <div className="flex items-center gap-1.5">
                      {/* External Maps Directions */}
                      {venue.location?.coordinates && (
                        <a
                          href={`https://www.google.com/maps/search/?api=1&query=${venue.location.coordinates[1]},${venue.location.coordinates[0]}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium text-slate-600 hover:text-amber-600 hover:bg-amber-500/10 dark:text-slate-400 dark:hover:text-amber-400 transition-colors"
                          title="Open directions in Google Maps"
                        >
                          <Navigation className="h-3 w-3" />
                          <span>{t('directions')}</span>
                        </a>
                      )}

                      {isAdmin && (
                        <>
                          {/* Edit Button */}
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleOpenEdit(venue)}
                            className="h-7 px-2 text-xs text-slate-600 hover:text-amber-600 dark:text-slate-400 dark:hover:text-amber-400 hover:bg-amber-500/10"
                            title={t('editVenue')}
                          >
                            <Edit2 className="h-3.5 w-3.5 mr-1" />
                            Edit
                          </Button>

                          {/* Delete Button */}
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleOpenDelete(venue)}
                            className="h-7 px-2 text-xs text-rose-500 hover:text-rose-700 hover:bg-rose-500/10 dark:hover:bg-rose-500/20"
                            title={t('deleteVenue')}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <EmptyState
            icon={Building2}
            title={t('noVenuesFound')}
            description={
              searchQuery || typeFilter !== 'all'
                ? 'No facilities match your search query. Try clearing filters.'
                : t('noVenuesDesc')
            }
            actionText={
              searchQuery || typeFilter !== 'all'
                ? 'Clear Filters'
                : t('addVenue')
            }
            onAction={
              searchQuery || typeFilter !== 'all'
                ? () => {
                    setSearchQuery('');
                    setTypeFilter('all');
                  }
                : handleOpenAdd
            }
          />
        )}
      </motion.div>
    </DashboardLayout>
  );
}
