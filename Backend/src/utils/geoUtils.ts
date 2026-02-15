import axios from 'axios';

/**
 * Calculate distance between two coordinates using Haversine formula
 * @param lat1 Latitude of first point
 * @param lon1 Longitude of first point
 * @param lat2 Latitude of second point
 * @param lon2 Longitude of second point
 * @returns Distance in meters
 */
export const calculateDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
};

/**
 * Calculate ETA based on distance
 * Assumes average speed of 40 km/h in urban areas
 * @param distanceInMeters Distance in meters
 * @returns ETA in minutes
 */
export const calculateETA = (distanceInMeters: number): number => {
  const averageSpeedKmh = 40;
  const distanceInKm = distanceInMeters / 1000;
  const timeInHours = distanceInKm / averageSpeedKmh;
  const timeInMinutes = Math.ceil(timeInHours * 60);
  
  // Add 2 minutes buffer for parking/finding location
  return timeInMinutes + 2;
};

/**
 * Format distance for display
 * @param distanceInMeters Distance in meters
 * @returns Formatted string (e.g., "1.5 km" or "250 m")
 */
export const formatDistance = (distanceInMeters: number): string => {
  if (distanceInMeters < 1000) {
    return `${Math.round(distanceInMeters)} m`;
  }
  return `${(distanceInMeters / 1000).toFixed(1)} km`;
};

/**
 * Format ETA for display
 * @param minutes ETA in minutes
 * @returns Formatted string (e.g., "5 min" or "1h 15min")
 */
export const formatETA = (minutes: number): string => {
  if (minutes < 60) {
    return `${minutes} min`;
  }
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`;
};

/**
 * Check if coordinates are valid
 */
export const isValidCoordinates = (latitude: number, longitude: number): boolean => {
  return (
    latitude >= -90 &&
    latitude <= 90 &&
    longitude >= -180 &&
    longitude <= 180 &&
    !isNaN(latitude) &&
    !isNaN(longitude)
  );
};

/**
 * Get bounding box for a given radius around a point
 * Useful for optimized spatial queries
 */
export const getBoundingBox = (
  latitude: number,
  longitude: number,
  radiusInMeters: number
): {
  minLat: number;
  maxLat: number;
  minLon: number;
  maxLon: number;
} => {
  const latChange = (radiusInMeters / 111000); // 1 degree latitude ≈ 111km
  const lonChange = (radiusInMeters / (111000 * Math.cos((latitude * Math.PI) / 180)));

  return {
    minLat: latitude - latChange,
    maxLat: latitude + latChange,
    minLon: longitude - lonChange,
    maxLon: longitude + lonChange,
  };
};

/**
 * Calculate bearing between two points
 * @returns Bearing in degrees (0-360)
 */
export const calculateBearing = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const y = Math.sin(Δλ) * Math.cos(φ2);
  const x =
    Math.cos(φ1) * Math.sin(φ2) -
    Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);

  const θ = Math.atan2(y, x);
  return ((θ * 180) / Math.PI + 360) % 360;
};

/**
 * Get cardinal direction from bearing
 */
export const getCardinalDirection = (bearing: number): string => {
  const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  const index = Math.round(bearing / 45) % 8;
  return directions[index];
};

/**
 * Geocoding utilities
 */
export const reverseGeocode = async (
  latitude: number,
  longitude: number
): Promise<string> => {
  const fallback = `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;

  if (!apiKey) {
    return fallback;
  }

  try {
    const response = await axios.get('https://maps.googleapis.com/maps/api/geocode/json', {
      params: {
        latlng: `${latitude},${longitude}`,
        key: apiKey,
      },
      timeout: 5000,
    });

    const formatted = response.data?.results?.[0]?.formatted_address;
    return formatted || fallback;
  } catch (_error) {
    return fallback;
  }
};

/**
 * Forward geocoding (address to coordinates)
 */
export const geocodeAddress = async (
  address: string
): Promise<{ latitude: number; longitude: number } | null> => {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;

  if (!apiKey || !address.trim()) {
    return null;
  }

  try {
    const response = await axios.get('https://maps.googleapis.com/maps/api/geocode/json', {
      params: {
        address,
        key: apiKey,
      },
      timeout: 5000,
    });

    const location = response.data?.results?.[0]?.geometry?.location;
    if (!location || typeof location.lat !== 'number' || typeof location.lng !== 'number') {
      return null;
    }

    return {
      latitude: location.lat,
      longitude: location.lng,
    };
  } catch (_error) {
    return null;
  }
};
