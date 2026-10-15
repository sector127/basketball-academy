'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Search,
  MapPin,
  Crosshair,
  Loader2,
  Check,
  ChevronDown,
  ChevronUp,
  X,
  Compass,
  Navigation,
  Building,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

// Default center: Tbilisi city center / Olympic Palace area
const DEFAULT_LAT = 41.7225;
const DEFAULT_LNG = 44.7788;
const DEFAULT_ZOOM = 14;

export default function VenueLocationPicker({
  latitude,
  longitude,
  address,
  name,
  onLocationChange,
  className = '',
}) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);
  const LRef = useRef(null);

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [presets, setPresets] = useState([]);

  // Manual coordinate panel toggle
  const [showManualCoords, setShowManualCoords] = useState(false);

  // Current values as state
  const currentLat = parseFloat(latitude) || DEFAULT_LAT;
  const currentLng = parseFloat(longitude) || DEFAULT_LNG;
  const hasCoords = !isNaN(parseFloat(latitude)) && !isNaN(parseFloat(longitude));

  // Fetch presets on mount
  useEffect(() => {
    let isMounted = true;
    fetch('/api/admin/venues/geocode?presets=true')
      .then((res) => res.json())
      .then((data) => {
        if (isMounted && data.results) {
          setPresets(data.results.slice(0, 5));
        }
      })
      .catch(() => {});
    return () => {
      isMounted = false;
    };
  }, []);

  // Initialize Leaflet Map
  useEffect(() => {
    let isMounted = true;

    async function initMap() {
      if (typeof window === 'undefined' || !mapContainerRef.current) return;

      // Dynamically load leaflet
      const leaflet = await import('leaflet');
      if (!isMounted) return;
      LRef.current = leaflet.default || leaflet;
      const L = LRef.current;

      // If map already initialized, remove old
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }

      // Initialize map
      const map = L.map(mapContainerRef.current, {
        center: [currentLat, currentLng],
        zoom: hasCoords ? 15 : DEFAULT_ZOOM,
        zoomControl: true,
        scrollWheelZoom: true,
      });
      mapInstanceRef.current = map;

      // OpenStreetMap Tiles (Clean CartoDB Positron / OSM style)
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
        maxZoom: 19,
      }).addTo(map);

      // Create Custom Basketball SVG Marker Icon
      const customIcon = L.divIcon({
        className: 'custom-basketball-marker',
        html: `
          <div style="position:relative; width:34px; height:42px; transform:translate(-17px, -42px); cursor:grab;">
            <svg width="34" height="42" viewBox="0 0 36 42" fill="none" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <filter id="bba-pin-shadow" x="-30%" y="-20%" width="160%" height="150%">
                  <feDropShadow dx="0" dy="4" stdDeviation="3.5" flood-color="#000000" flood-opacity="0.45"/>
                </filter>
              </defs>
              <path d="M18 0C8.05888 0 0 8.05888 0 18C0 28.5 14.5 40 18 42C21.5 40 36 28.5 36 18C36 8.05888 27.9411 0 18 0Z" fill="#0f172a" filter="url(#bba-pin-shadow)"/>
              <circle cx="18" cy="18" r="14.5" fill="#f59e0b"/>
              <circle cx="18" cy="18" r="13.5" stroke="#78350f" stroke-width="1.2" fill="none"/>
              <line x1="4.5" y1="18" x2="31.5" y2="18" stroke="#78350f" stroke-width="1.4"/>
              <line x1="18" y1="4.5" x2="18" y2="31.5" stroke="#78350f" stroke-width="1.4"/>
              <path d="M7 9C13 13 13 23 7 27" stroke="#78350f" stroke-width="1.2" fill="none"/>
              <path d="M29 9C23 13 23 23 29 27" stroke="#78350f" stroke-width="1.2" fill="none"/>
            </svg>
          </div>
        `,
        iconSize: [34, 42],
        iconAnchor: [17, 42],
      });

      // Add Draggable Marker
      const marker = L.marker([currentLat, currentLng], {
        icon: customIcon,
        draggable: true,
      }).addTo(map);
      markerRef.current = marker;

      // Handle marker drag end
      marker.on('dragend', async () => {
        const position = marker.getLatLng();
        handlePositionUpdate(position.lat, position.lng, true);
      });

      // Handle map click to place pin
      map.on('click', async (e) => {
        const { lat, lng } = e.latlng;
        marker.setLatLng([lat, lng]);
        handlePositionUpdate(lat, lng, true);
      });

      // Fix render size after dialog transition
      setTimeout(() => {
        if (mapInstanceRef.current) {
          mapInstanceRef.current.invalidateSize();
        }
      }, 250);
    }

    initMap();

    return () => {
      isMounted = false;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      };
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  // Update marker position when latitude/longitude props change externally
  useEffect(() => {
    if (markerRef.current && mapInstanceRef.current && hasCoords) {
      const lat = parseFloat(latitude);
      const lng = parseFloat(longitude);
      const currentPos = markerRef.current.getLatLng();

      // Only update if difference is noticeable
      if (
        Math.abs(currentPos.lat - lat) > 0.0001 ||
        Math.abs(currentPos.lng - lng) > 0.0001
      ) {
        markerRef.current.setLatLng([lat, lng]);
        mapInstanceRef.current.panTo([lat, lng], { animate: true });
      }
    }
  }, [latitude, longitude, hasCoords]);

  // Position update handler with reverse geocoding
  const handlePositionUpdate = useCallback(
    async (lat, lng, fetchAddress = false) => {
      const formattedLat = parseFloat(lat.toFixed(6));
      const formattedLng = parseFloat(lng.toFixed(6));

      if (fetchAddress) {
        try {
          const res = await fetch(
            `/api/admin/venues/geocode?lat=${formattedLat}&lon=${formattedLng}`
          );
          if (res.ok) {
            const data = await res.json();
            onLocationChange({
              latitude: formattedLat.toString(),
              longitude: formattedLng.toString(),
              address: data.address || address,
              suggestedName: data.rawName || undefined,
            });
            return;
          }
        } catch (err) {
          console.warn('Reverse geocode failed:', err);
        }
      }

      onLocationChange({
        latitude: formattedLat.toString(),
        longitude: formattedLng.toString(),
      });
    },
    [address, onLocationChange]
  );

  // Debounced search for places
  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.trim().length < 2) {
      setSearchResults([]);
      setShowDropdown(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await fetch(
          `/api/admin/venues/geocode?q=${encodeURIComponent(searchQuery.trim())}`
        );
        if (res.ok) {
          const data = await res.json();
          setSearchResults(data.results || []);
          setShowDropdown(true);
        }
      } catch (err) {
        console.error('Search places error:', err);
      } finally {
        setIsSearching(false);
      }
    }, 320);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Select a search result or preset
  const handleSelectLocation = (place) => {
    const lat = parseFloat(place.lat);
    const lng = parseFloat(place.lon);

    if (isNaN(lat) || isNaN(lng)) return;

    if (markerRef.current && mapInstanceRef.current) {
      markerRef.current.setLatLng([lat, lng]);
      mapInstanceRef.current.flyTo([lat, lng], 16, {
        duration: 1.2,
      });
    }

    onLocationChange({
      latitude: lat.toFixed(6).toString(),
      longitude: lng.toFixed(6).toString(),
      address: place.address || place.name || address,
      suggestedName: place.name || undefined,
      suggestedCapacity: place.capacity || undefined,
    });

    setSearchQuery('');
    setShowDropdown(false);
  };

  // Use Current Geolocation
  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;

        if (markerRef.current && mapInstanceRef.current) {
          markerRef.current.setLatLng([lat, lng]);
          mapInstanceRef.current.flyTo([lat, lng], 16, {
            duration: 1.2,
          });
        }

        handlePositionUpdate(lat, lng, true);
        setIsLocating(false);
      },
      (err) => {
        console.error('Geolocation error:', err);
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  // Recenter map on pin
  const handleRecenter = () => {
    if (mapInstanceRef.current && markerRef.current) {
      const pos = markerRef.current.getLatLng();
      mapInstanceRef.current.setView(pos, 16);
    }
  };

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Search Bar with Autocomplete Dropdown */}
      <div className="relative">
        <div className="relative flex items-center">
          <Search className="absolute left-3 h-4 w-4 text-slate-400 pointer-events-none" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => {
              if (searchResults.length > 0) setShowDropdown(true);
            }}
            placeholder="Search venue name, address, or landmark (e.g. Olympic Palace)..."
            className="pl-9 pr-20 text-xs sm:text-sm h-10 rounded-xl bg-slate-50/70 dark:bg-slate-800/60 border-slate-200/80 dark:border-slate-800 focus:bg-white dark:focus:bg-slate-900 transition-colors"
          />
          <div className="absolute right-2.5 flex items-center gap-1">
            {isSearching && (
              <Loader2 className="h-4 w-4 animate-spin text-amber-500 mr-1" />
            )}
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setShowDropdown(false);
                }}
                className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleUseCurrentLocation}
              disabled={isLocating}
              title="Use current GPS location"
              className="h-7 px-2 text-xs text-amber-600 dark:text-amber-400 hover:bg-amber-500/10 font-medium"
            >
              {isLocating ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Crosshair className="h-3.5 w-3.5" />
              )}
            </Button>
          </div>
        </div>

        {/* Autocomplete Dropdown */}
        {showDropdown && searchResults.length > 0 && (
          <div className="absolute z-50 mt-1 w-full rounded-xl border border-slate-200/80 bg-white/95 p-1.5 shadow-xl backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/95 max-h-64 overflow-y-auto">
            <div className="px-2 py-1 text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Matching Locations ({searchResults.length})
            </div>
            {searchResults.map((result, idx) => (
              <button
                key={result.id || idx}
                type="button"
                onClick={() => handleSelectLocation(result)}
                className="w-full text-left px-2.5 py-2 rounded-lg hover:bg-amber-500/10 dark:hover:bg-amber-500/15 transition-colors flex items-start gap-2.5 group"
              >
                <div className="h-7 w-7 rounded-lg bg-slate-100 dark:bg-slate-800 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 mt-0.5 group-hover:bg-amber-500 group-hover:text-slate-950 transition-colors">
                  <MapPin className="h-3.5 w-3.5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-slate-800 dark:text-slate-100 truncate group-hover:text-amber-600 dark:group-hover:text-amber-400">
                    {result.name}
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1">
                    {result.address}
                  </p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Quick Location Preset Chips */}
      {presets.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
          <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500 flex items-center gap-1">
            <Compass className="h-3 w-3" /> Quick Arenas:
          </span>
          {presets.map((preset) => (
            <button
              key={preset.id}
              type="button"
              onClick={() => handleSelectLocation(preset)}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-100 hover:bg-amber-500/15 text-slate-600 hover:text-amber-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:text-amber-300 dark:hover:bg-amber-500/20 border border-slate-200/60 dark:border-slate-700/60 transition-colors"
            >
              <span>{preset.name.split('(')[0].trim()}</span>
            </button>
          ))}
        </div>
      )}

      {/* Interactive Map Container */}
      <div className="relative rounded-xl overflow-hidden border border-slate-200/80 dark:border-slate-800 bg-slate-100 dark:bg-slate-800/50 shadow-inner">
        <div
          ref={mapContainerRef}
          className="h-[210px] w-full z-0"
          style={{ minHeight: '210px' }}
        />

        {/* Map Overlay Badge & Controls */}
        <div className="absolute top-2 left-2 z-[400] flex items-center gap-1.5 pointer-events-none">
          <Badge
            variant="secondary"
            className="bg-slate-900/80 text-white dark:bg-slate-950/80 backdrop-blur-md text-[10px] font-medium border-0 px-2 py-0.5 shadow-sm"
          >
            <Navigation className="h-3 w-3 mr-1 text-amber-400 animate-pulse" />
            Click map or drag pin to place venue
          </Badge>
        </div>

        {/* Recenter Button on Map */}
        <div className="absolute bottom-2 right-2 z-[400]">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={handleRecenter}
            className="h-7 text-xs bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border border-slate-200 dark:border-slate-700 shadow-md hover:bg-white text-slate-700 dark:text-slate-200 font-medium px-2"
          >
            <Crosshair className="h-3 w-3 mr-1 text-amber-500" /> Center Pin
          </Button>
        </div>
      </div>

      {/* Selected Coordinates Status & Manual Override Toggle */}
      <div className="flex items-center justify-between pt-1 text-xs">
        <div className="flex items-center gap-1.5">
          <span className="inline-flex items-center justify-center h-4 w-4 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <Check className="h-2.5 w-2.5" />
          </span>
          <span className="font-mono text-[11px] text-slate-600 dark:text-slate-300">
            {hasCoords
              ? `${parseFloat(latitude).toFixed(4)}° N, ${parseFloat(longitude).toFixed(4)}° E`
              : 'Pin location on map'}
          </span>
        </div>

        <button
          type="button"
          onClick={() => setShowManualCoords(!showManualCoords)}
          className="text-[11px] font-medium text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 flex items-center gap-1 transition-colors"
        >
          <span>{showManualCoords ? 'Hide coordinates' : 'Fine-tune coordinates'}</span>
          {showManualCoords ? (
            <ChevronUp className="h-3 w-3" />
          ) : (
            <ChevronDown className="h-3 w-3" />
          )}
        </button>
      </div>

      {/* Collapsible Manual Latitude / Longitude Inputs */}
      {showManualCoords && (
        <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 animate-in fade-in slide-in-from-top-1 duration-200">
          <div className="space-y-1">
            <Label htmlFor="manual-latitude" className="text-[11px] text-slate-500">
              Latitude
            </Label>
            <Input
              id="manual-latitude"
              value={latitude || ''}
              onChange={(e) =>
                onLocationChange({
                  latitude: e.target.value,
                  longitude: longitude,
                })
              }
              placeholder="e.g. 41.7225"
              className="h-8 text-xs font-mono"
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="manual-longitude" className="text-[11px] text-slate-500">
              Longitude
            </Label>
            <Input
              id="manual-longitude"
              value={longitude || ''}
              onChange={(e) =>
                onLocationChange({
                  latitude: latitude,
                  longitude: e.target.value,
                })
              }
              placeholder="e.g. 44.7788"
              className="h-8 text-xs font-mono"
            />
          </div>
        </div>
      )}
    </div>
  );
}
