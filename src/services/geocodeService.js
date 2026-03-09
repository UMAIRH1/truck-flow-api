const axios = require('axios');

// Cache for geocoding results (in-memory cache)
const geocodeCache = new Map();
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

// Simple rate limiting to avoid hitting API limits
let lastRequestTime = 0;
const MIN_REQUEST_INTERVAL = 500; // 500ms between requests

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Get cached geocode result or fetch new one
 */
const getCachedGeocode = async (location) => {
  const cacheKey = location.toLowerCase().trim();
  const cached = geocodeCache.get(cacheKey);
  
  if (cached && (Date.now() - cached.timestamp) < CACHE_DURATION) {
    console.log(`✅ Using cached coordinates for: ${location}`);
    return cached.data;
  }
  
  const result = await geocodeLocation(location);
  geocodeCache.set(cacheKey, {
    data: result,
    timestamp: Date.now()
  });
  
  return result;
};

/**
 * Geocode a location string to get coordinates
 * @param {string} location - Location string (e.g., "Lahore" or "New York, USA")
 * @returns {Promise<{lat: number, lon: number}>}
 */
const geocodeLocation = async (location) => {
  // Rate limiting
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;
  if (timeSinceLastRequest < MIN_REQUEST_INTERVAL) {
    await delay(MIN_REQUEST_INTERVAL - timeSinceLastRequest);
  }
  lastRequestTime = Date.now();

  // Try multiple geocoding providers in order
  const providers = [
    // Provider 1: api.latlng.work
    async () => {
      const response = await axios.get('https://api.latlng.work/api', {
        params: { q: location },
        timeout: 15000,
      });
      if (response.data?.features?.length > 0) {
        const coords = response.data.features[0].geometry.coordinates;
        return { lat: parseFloat(coords[1]), lon: parseFloat(coords[0]) };
      }
      return null;
    },
    // Provider 2: Nominatim (OpenStreetMap)
    async () => {
      const response = await axios.get('https://nominatim.openstreetmap.org/search', {
        params: { 
          q: location,
          format: 'json',
          limit: 1
        },
        headers: { 'User-Agent': 'TruckFlow/1.0' },
        timeout: 15000,
      });
      if (response.data?.length > 0) {
        return { 
          lat: parseFloat(response.data[0].lat), 
          lon: parseFloat(response.data[0].lon) 
        };
      }
      return null;
    },
  ];

  // Try each provider
  for (let i = 0; i < providers.length; i++) {
    try {
      console.log(`🔍 Trying geocoding provider ${i + 1} for: ${location}`);
      const result = await providers[i]();
      if (result) {
        console.log(`✅ Geocoded "${location}" to: ${result.lat}, ${result.lon}`);
        return result;
      }
    } catch (error) {
      console.log(`⚠️ Provider ${i + 1} failed:`, error.message);
      if (i < providers.length - 1) {
        await delay(1000); // Wait before trying next provider
      }
    }
  }

  // If all providers failed, try with just the main city
  const mainCity = location.split(',')[0].trim();
  if (mainCity !== location) {
    console.log(`🔄 Retrying with main city: ${mainCity}`);
    await delay(MIN_REQUEST_INTERVAL);
    
    for (let i = 0; i < providers.length; i++) {
      try {
        const response = await axios.get('https://nominatim.openstreetmap.org/search', {
          params: { 
            q: mainCity,
            format: 'json',
            limit: 1
          },
          headers: { 'User-Agent': 'TruckFlow/1.0' },
          timeout: 15000,
        });
        if (response.data?.length > 0) {
          const result = { 
            lat: parseFloat(response.data[0].lat), 
            lon: parseFloat(response.data[0].lon) 
          };
          console.log(`✅ Geocoded "${mainCity}" to: ${result.lat}, ${result.lon}`);
          return result;
        }
      } catch (error) {
        console.log(`⚠️ Retry failed:`, error.message);
      }
    }
  }

  throw new Error(`Location not found: ${location}`);
};

/**
 * Calculate distance between two coordinates using Haversine formula
 * @param {number} lat1 - Latitude of first point
 * @param {number} lon1 - Longitude of first point
 * @param {number} lat2 - Latitude of second point
 * @param {number} lon2 - Longitude of second point
 * @returns {number} Distance in kilometers
 */
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  
  return Math.round(distance * 10) / 10; // Round to 1 decimal place
};

const toRad = (degrees) => {
  return degrees * (Math.PI / 180);
};

/**
 * Calculate distance between two locations using OSRM (road distance)
 * @param {string} pickupLocation - Pickup location string
 * @param {string} dropoffLocation - Dropoff location string
 * @returns {Promise<{distance: number, unit: string, duration: number}>}
 */
const calculateRouteDistance = async (pickupLocation, dropoffLocation) => {
  try {
    console.log(`🚚 Calculating route: ${pickupLocation} → ${dropoffLocation}`);
    
    // Use cached geocoding for faster results
    const [pickup, dropoff] = await Promise.all([
      getCachedGeocode(pickupLocation),
      getCachedGeocode(dropoffLocation),
    ]);

    console.log(`📍 Coordinates: [${pickup.lat}, ${pickup.lon}] → [${dropoff.lat}, ${dropoff.lon}]`);

    // Use OSRM public API to get actual driving distance with retry logic
    const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${pickup.lon},${pickup.lat};${dropoff.lon},${dropoff.lat}?overview=false`;
    
    let response;
    let retries = 2;
    
    while (retries > 0) {
      try {
        response = await axios.get(osrmUrl, { 
          timeout: 15000,
          headers: { 'User-Agent': 'TruckFlow/1.0' }
        });
        break; // Success, exit retry loop
      } catch (err) {
        retries--;
        if (retries === 0) throw err;
        console.log(`⚠️ OSRM request failed, retrying... (${retries} attempts left)`);
        await delay(1000); // Wait 1 second before retry
      }
    }

    if (response.data && response.data.routes && response.data.routes.length > 0) {
      const route = response.data.routes[0];
      const distanceInMeters = route.distance;
      const durationInSeconds = route.duration;
      const distanceInKm = Math.round((distanceInMeters / 1000) * 10) / 10; // Round to 1 decimal

      console.log(`✅ Route distance: ${distanceInKm} km (${Math.round(durationInSeconds / 60)} min)`);

      return {
        distance: distanceInKm,
        unit: 'km',
        duration: Math.round(durationInSeconds / 60), // duration in minutes
        pickup: { lat: pickup.lat, lon: pickup.lon },
        dropoff: { lat: dropoff.lat, lon: dropoff.lon },
      };
    }

    // Fallback to straight-line distance if OSRM fails
    console.log('⚠️ OSRM routing failed, using straight-line distance');
    const straightLineDistance = calculateDistance(
      pickup.lat,
      pickup.lon,
      dropoff.lat,
      dropoff.lon
    );

    // Add 30% to straight-line distance to approximate road distance
    const approximateRoadDistance = Math.round(straightLineDistance * 1.3 * 10) / 10;

    return {
      distance: approximateRoadDistance,
      unit: 'km',
      duration: null,
      pickup: { lat: pickup.lat, lon: pickup.lon },
      dropoff: { lat: dropoff.lat, lon: dropoff.lon },
      fallback: true,
    };
  } catch (error) {
    console.error('❌ Distance calculation error:', error.message);
    throw error;
  }
};

module.exports = {
  geocodeLocation,
  calculateDistance,
  calculateRouteDistance,
};
