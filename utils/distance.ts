/**
 * Calculate distance between two points using Haversine formula
 * @param lat1 Latitude of first point
 * @param lon1 Longitude of first point
 * @param lat2 Latitude of second point
 * @param lon2 Longitude of second point
 * @returns Distance in kilometers
 */
export function getDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) *
    Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) *
    Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/** Rough city delivery ETA from distance (km). */
export function estimateDeliveryMinutes(distanceKm: number): number {
  if (!distanceKm || distanceKm <= 0) return 30;
  const travelMinutes = Math.round((distanceKm / 18) * 60);
  return Math.max(20, travelMinutes + 15);
}

/**
 * Get user's current location
 * @returns Promise with coordinates or null if denied
 */
export function getUserLocation(): Promise<{ latitude: number; longitude: number } | null> {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      console.warn('Geolocation is not supported by this browser');
      resolve(null);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        console.log('Location obtained:', {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        });
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        });
      },
      (error) => {
        console.error('Error getting location:', error);
        // Default to Bangalore, India if location is denied
        resolve({
          latitude: 12.9716,
          longitude: 77.5946
        });
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000 // 5 minutes
      }
    );
  });
}

/**
 * Parse address to get coordinates (simplified geocoding)
 * For demo purposes, returns coordinates for major Indian cities
 */
export function parseAddressToCoordinates(address: string): { latitude: number; longitude: number } | null {
  const cityCoordinates: { [key: string]: { latitude: number; longitude: number } } = {
    'bangalore': { latitude: 12.9716, longitude: 77.5946 },
    'bengaluru': { latitude: 12.9716, longitude: 77.5946 },
    'mumbai': { latitude: 19.0760, longitude: 72.8777 },
    'delhi': { latitude: 28.7041, longitude: 77.1025 },
    'kolkata': { latitude: 22.5726, longitude: 88.3639 },
    'chennai': { latitude: 13.0827, longitude: 80.2707 },
    'hyderabad': { latitude: 17.3850, longitude: 78.4867 },
    'pune': { latitude: 18.5204, longitude: 73.8567 },
    'ahmedabad': { latitude: 23.0225, longitude: 72.5714 },
    'jaipur': { latitude: 26.9124, longitude: 75.7873 },
    'surat': { latitude: 21.1702, longitude: 72.8311 },
    'lucknow': { latitude: 26.8467, longitude: 80.9462 },
    'kanpur': { latitude: 26.4499, longitude: 80.3319 },
    'nagpur': { latitude: 21.1458, longitude: 79.0882 },
    'indore': { latitude: 22.7196, longitude: 75.8577 },
    'thane': { latitude: 19.2183, longitude: 72.9781 },
    'bhopal': { latitude: 23.2599, longitude: 77.4126 },
    'visakhapatnam': { latitude: 17.6868, longitude: 83.2185 },
    'pimpri': { latitude: 18.6298, longitude: 73.7997 },
    'patna': { latitude: 25.5941, longitude: 85.1376 }
  };

  const lowerAddress = address.toLowerCase();
  for (const [city, coords] of Object.entries(cityCoordinates)) {
    if (lowerAddress.includes(city)) {
      return coords;
    }
  }

  // If no city found, return null
  return null;
}

/**
 * Sort stores by distance from user location
 */
export function sortStoresByDistance(
  stores: any[], 
  userLat: number, 
  userLon: number
): any[] {
  return stores.map(store => {
    const storeCoords = parseAddressToCoordinates(store.address);
    if (storeCoords) {
      const distance = getDistance(userLat, userLon, storeCoords.latitude, storeCoords.longitude);
      return { ...store, distance };
    }
    return { ...store, distance: null };
  }).sort((a, b) => {
    if (a.distance === null && b.distance === null) return 0;
    if (a.distance === null) return 1;
    if (b.distance === null) return -1;
    return a.distance - b.distance;
  });
}