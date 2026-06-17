/**
 * Geographic utility functions for ELD Trip Planner
 * No React, no DOM - pure utility functions
 */

/**
 * Calculate distance between two coordinates using Haversine formula
 * @param coord1 - [lat, lng] in degrees
 * @param coord2 - [lat, lng] in degrees
 * @returns distance in miles
 */
export function haversineDistanceMiles(
  coord1: [number, number],
  coord2: [number, number]
): number {
  const R = 3958.8; // Earth radius in miles
  const [lat1, lng1] = coord1;
  const [lat2, lng2] = coord2;

  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lng2 - lng1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c;

  return d;
}

/**
 * Interpolate route between waypoints
 * Currently returns waypoints as-is (straight line).
 * Replace with OSRM routing API call if needed in future.
 * @param waypoints - array of [lat, lng] coordinates
 * @returns interpolated waypoints
 */
export function interpolateRoute(
  waypoints: [number, number][]
): [number, number][] {
  // For now, return waypoints as-is
  // In future, integrate with OSRM or similar routing service
  return waypoints;
}

/**
 * Geocode a location name to coordinates using Nominatim
 * @param locationName - location string (e.g., "Chicago, IL")
 * @returns [lat, lng] or null if not found
 */
export async function geocodeLocation(
  locationName: string
): Promise<[number, number] | null> {
  try {
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
      locationName
    )}&format=json&limit=1`;

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'ELDTripPlanner/1.0',
      },
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();

    if (!Array.isArray(data) || data.length === 0) {
      return null;
    }

    const result = data[0];
    const lat = parseFloat(result.lat);
    const lon = parseFloat(result.lon);

    if (isNaN(lat) || isNaN(lon)) {
      return null;
    }

    return [lat, lon];
  } catch (error) {
    console.error(`Error geocoding "${locationName}":`, error);
    return null;
  }
}

/**
 * Reverse geocode coordinates to a location name using Nominatim
 * @param coords - [lat, lng] coordinates
 * @returns display name string or coordinate string fallback
 */
export async function reverseGeocode(coords: [number, number]): Promise<string> {
  try {
    const [lat, lng] = coords;
    const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`;

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'ELDTripPlanner/1.0',
      },
    });

    if (!response.ok) {
      return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
    }

    const data = await response.json();

    if (data.display_name) {
      return data.display_name;
    }

    return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
  } catch (error) {
    console.error('Error reverse geocoding:', error);
    const [lat, lng] = coords;
    return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
  }
}
