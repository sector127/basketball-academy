import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/authGuard';

export interface GeocodeItem {
  id: string;
  name: string;
  address: string;
  lat: number;
  lon: number;
  type: string;
  capacity?: number;
  category?: string;
}

interface OsmAddress {
  amenity?: string;
  leisure?: string;
  sports_centre?: string;
  road?: string;
  house_number?: string;
  suburb?: string;
  neighbourhood?: string;
  district?: string;
  city?: string;
  town?: string;
  country?: string;
}

interface OsmReverseResponse {
  display_name?: string;
  name?: string;
  address?: OsmAddress;
}

interface OsmSearchItem {
  place_id: number | string;
  name?: string;
  display_name: string;
  lat: string;
  lon: string;
  type: string;
  class: string;
  address?: OsmAddress;
}

interface ReverseResult {
  address: string;
  rawName?: string;
  city?: string;
  lat: number;
  lon: number;
}

// In-memory cache for recent queries to minimize external rate limits
const cache = new Map<string, unknown>();
const CACHE_MAX_SIZE = 100;

// Curated prominent basketball and athletic facilities in Tbilisi & academy locations
const POPULAR_PRESETS: GeocodeItem[] = [
  {
    id: 'preset-olympic-palace',
    name: 'Olympic Palace (ოლიმპიური სასახლე)',
    address: '15 University St, Saburtalo, Tbilisi, Georgia',
    lat: 41.7182,
    lon: 44.7282,
    type: 'sports_centre',
    capacity: 3600,
  },
  {
    id: 'preset-tbilisi-arena',
    name: 'Tbilisi Arena (თბილისი არენა)',
    address: '6 University St, Saburtalo, Tbilisi, Georgia',
    lat: 41.7225,
    lon: 44.7788,
    type: 'sports_centre',
    capacity: 10000,
  },
  {
    id: 'preset-vake-facility',
    name: 'BBA Practice Facility - Vake',
    address: '24 Chavchavadze Ave, Vake, Tbilisi, Georgia',
    lat: 41.7105,
    lon: 44.7612,
    type: 'indoor_court',
    capacity: 800,
  },
  {
    id: 'preset-sports-complex',
    name: 'Tbilisi Sports Palace (სპორტის სასახლე)',
    address: '26 May Square, Saburtalo, Tbilisi, Georgia',
    lat: 41.7208,
    lon: 44.7786,
    type: 'arena',
    capacity: 9700,
  },
  {
    id: 'preset-dinamo-arena',
    name: 'Dinamo Arena Sports Complex',
    address: '2 Akaki Tsereteli Ave, Didube, Tbilisi, Georgia',
    lat: 41.7231,
    lon: 44.7894,
    type: 'sports_complex',
    capacity: 54000,
  },
  {
    id: 'preset-vera-park',
    name: 'Vera Park Basketball Courts',
    address: 'Vera Park, Kostava St, Tbilisi, Georgia',
    lat: 41.7088,
    lon: 44.7885,
    type: 'outdoor_court',
    capacity: 300,
  },
  {
    id: 'preset-brooklyn-bridge',
    name: 'Brooklyn Bridge Park Pier 2 Courts',
    address: 'Pier 2, Furman St, Brooklyn, NY 11201, USA',
    lat: 40.6993,
    lon: -73.9984,
    type: 'outdoor_court',
    capacity: 500,
  },
  {
    id: 'preset-barclays-center',
    name: 'Barclays Center',
    address: '620 Atlantic Ave, Brooklyn, NY 11217, USA',
    lat: 40.6826,
    lon: -73.9754,
    type: 'arena',
    capacity: 17732,
  },
];

function formatDisplayName(displayName?: string, address?: OsmAddress): string {
  if (!displayName) return '';
  if (!address) return displayName;
  const parts: string[] = [];
  if (address.leisure || address.amenity || address.sports_centre) {
    const val = address.leisure || address.amenity || address.sports_centre;
    if (val) parts.push(val);
  }
  if (address.road) {
    parts.push(`${address.house_number ? address.house_number + ' ' : ''}${address.road}`);
  }
  if (address.suburb || address.neighbourhood || address.district) {
    const val = address.suburb || address.neighbourhood || address.district;
    if (val) parts.push(val);
  }
  if (address.city || address.town) {
    const val = address.city || address.town;
    if (val) parts.push(val);
  }
  if (address.country) {
    parts.push(address.country);
  }
  return parts.length > 1 ? parts.join(', ') : displayName;
}

export async function GET(request: NextRequest | Request): Promise<NextResponse> {
  const { errorResponse } = await requireAuth(['admin', 'coach', 'staff', 'player', 'guardian']);
  if (errorResponse) return errorResponse;

  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q')?.trim();
    const lat = searchParams.get('lat');
    const lon = searchParams.get('lon');
    const presetsOnly = searchParams.get('presets') === 'true';

    if (presetsOnly) {
      return NextResponse.json({ results: POPULAR_PRESETS });
    }

    // Reverse geocoding by coordinates
    if (lat && lon) {
      const cacheKey = `rev:${parseFloat(lat).toFixed(4)},${parseFloat(lon).toFixed(4)}`;
      if (cache.has(cacheKey)) {
        return NextResponse.json(cache.get(cacheKey));
      }

      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lon)}&addressdetails=1`,
          {
            headers: {
              'User-Agent': 'BrooklynBasketballAcademy/1.0 (admin-dashboard; contact@bba.ge)',
              'Accept-Language': 'en,ka',
            },
            next: { revalidate: 3600 },
          }
        );

        if (res.ok) {
          const data = (await res.json()) as OsmReverseResponse;
          const cleanAddress = formatDisplayName(data.display_name, data.address);
          const result: ReverseResult = {
            address: cleanAddress || data.display_name || `${lat}, ${lon}`,
            rawName: data.name || data.address?.amenity || data.address?.leisure || '',
            city: data.address?.city || data.address?.town || data.address?.suburb || 'Tbilisi',
            lat: parseFloat(lat),
            lon: parseFloat(lon),
          };

          if (cache.size > CACHE_MAX_SIZE) cache.clear();
          cache.set(cacheKey, result);
          return NextResponse.json(result);
        }
      } catch (revErr: unknown) {
        const msg = revErr instanceof Error ? revErr.message : 'Unknown';
        console.warn('Reverse geocode error:', msg);
      }

      return NextResponse.json({
        address: `Coordinates: ${parseFloat(lat).toFixed(4)}, ${parseFloat(lon).toFixed(4)}`,
        lat: parseFloat(lat),
        lon: parseFloat(lon),
      });
    }

    // Forward search by text query
    if (!query || query.length < 2) {
      return NextResponse.json({ results: POPULAR_PRESETS.slice(0, 5) });
    }

    const cacheKey = `search:${query.toLowerCase()}`;
    if (cache.has(cacheKey)) {
      return NextResponse.json({ results: cache.get(cacheKey) });
    }

    // Filter presets first
    const matchedPresets = POPULAR_PRESETS.filter(
      (p) =>
        p.name.toLowerCase().includes(query.toLowerCase()) ||
        p.address.toLowerCase().includes(query.toLowerCase())
    );

    let externalResults: GeocodeItem[] = [];
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&addressdetails=1&limit=6`,
        {
          headers: {
            'User-Agent': 'BrooklynBasketballAcademy/1.0 (admin-dashboard; contact@bba.ge)',
            'Accept-Language': 'en,ka',
          },
          next: { revalidate: 1800 },
        }
      );

      if (res.ok) {
        const osmData: unknown = await res.json();
        if (Array.isArray(osmData)) {
          externalResults = (osmData as OsmSearchItem[]).map((item) => ({
            id: `osm-${item.place_id}`,
            name: item.name || item.display_name.split(',')[0],
            address: item.display_name,
            lat: parseFloat(item.lat),
            lon: parseFloat(item.lon),
            type: item.type,
            category: item.class,
          }));
        }
      }
    } catch (searchErr: unknown) {
      const msg = searchErr instanceof Error ? searchErr.message : 'Unknown';
      console.warn('Nominatim search error:', msg);
    }

    // Merge matched presets at the top, followed by external OSM results (de-duplicated)
    const combined: GeocodeItem[] = [...matchedPresets];
    for (const item of externalResults) {
      const isDuplicate = combined.some(
        (existing) =>
          Math.abs(existing.lat - item.lat) < 0.001 &&
          Math.abs(existing.lon - item.lon) < 0.001
      );
      if (!isDuplicate) {
        combined.push(item);
      }
    }

    if (cache.size > CACHE_MAX_SIZE) cache.clear();
    cache.set(cacheKey, combined);

    return NextResponse.json({ results: combined });
  } catch (err: unknown) {
    console.error('Geocode route error:', err);
    const message = err instanceof Error ? err.message : 'Geocoding request failed';
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
