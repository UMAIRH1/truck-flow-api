const axios = require('axios');

// Cache for geocoding results (in-memory cache)
const geocodeCache = new Map();
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

// Simple rate limiting to avoid hitting API limits
let lastRequestTime = 0;
const MIN_REQUEST_INTERVAL = 500; // 500ms between requests

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Check if a string is a coordinate pair (lat,lng)
 */
const isCoordinateString = (str) => {
  if (typeof str !== 'string') return false;
  // If it's a long address, it's not a simple coordinate pair
  if (str.length > 50) return false; 
  const parts = str.split(',');
  if (parts.length !== 2) return false;
  const lat = parseFloat(parts[0]);
  const lng = parseFloat(parts[1]);
  // Basic range check for lat/lng
  return !isNaN(lat) && !isNaN(lng) && 
         Math.abs(lat) <= 90 && Math.abs(lng) <= 180;
};

/**
 * Calculate distance using Google Maps Distance Matrix API
 * @param {string} origin - Origin location string
 * @param {string} destination - Destination location string
 * @returns {Promise<{distance: number, unit: string, duration: number}>}
 */
const calculateRouteDistanceWithGoogle = async (origin, destination) => {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  
  if (!apiKey || apiKey === 'your-google-maps-api-key-here') {
    console.log('⚠️ Google Maps API key not configured, using fallback method');
    return calculateRouteDistanceFallback(origin, destination);
  }

  try {
    console.log(`🚚 Calculating route with Google Maps: ${origin} → ${destination}`);
    
    const url = 'https://maps.googleapis.com/maps/api/distancematrix/json';
    const response = await axios.get(url, {
      params: {
        origins: origin,
        destinations: destination,
        mode: 'driving',
        units: 'metric',
        key: apiKey,
      },
      timeout: 10000,
    });

    if (response.data.status === 'OK' && response.data.rows && response.data.rows.length > 0) {
      const element = response.data.rows[0].elements[0];
      
      if (element.status === 'OK') {
        const distanceInMeters = element.distance.value;
        const durationInSeconds = element.duration.value;
        const distanceInKm = Math.round((distanceInMeters / 1000) * 10) / 10;

        console.log(`✅ Google Maps distance: ${distanceInKm} km (${Math.round(durationInSeconds / 60)} min)`);

        return {
          distance: distanceInKm,
          unit: 'km',
          duration: Math.round(durationInSeconds / 60), // duration in minutes
          distanceText: element.distance.text,
          durationText: element.duration.text,
          origin: response.data.origin_addresses[0],
          destination: response.data.destination_addresses[0],
        };
      }
    }

    // If Google Maps fails, use fallback
    console.log('⚠️ Google Maps API returned no results, using fallback');
    return calculateRouteDistanceFallback(origin, destination);
    
  } catch (error) {
    console.error('❌ Google Maps API error:', error.message);
    console.log('⚠️ Falling back to alternative method');
    return calculateRouteDistanceFallback(origin, destination);
  }
};

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
  // If location is already coordinates, return them directly
  if (isCoordinateString(location)) {
    const [lat, lon] = location.split(',').map(s => parseFloat(s.trim()));
    return { lat, lon };
  }

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
 * Fallback: Calculate distance using OSRM (road distance)
 * @param {string} pickupLocation - Pickup location string
 * @param {string} dropoffLocation - Dropoff location string
 * @returns {Promise<{distance: number, unit: string, duration: number}>}
 */
const calculateRouteDistanceFallback = async (pickupLocation, dropoffLocation) => {
  try {
    console.log(`🚚 Calculating route (fallback): ${pickupLocation} → ${dropoffLocation}`);
    
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

/**
 * Calculate route distance with multiple waypoints using Google Maps Directions API
 * @param {string} origin - Starting location
 * @param {string} destination - Ending location
 * @param {Array<string>} waypoints - Array of waypoint locations
 * @returns {Promise<{distance: number, unit: string, duration: number}>}
 */
const calculateRouteDistanceWithWaypoints = async (origin, destination, waypoints = []) => {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  
  if (!apiKey || apiKey === 'your-google-maps-api-key-here') {
    console.log('⚠️ Google Maps API key not configured, using fallback method');
    return calculateRouteDistanceWithWaypointsFallback(origin, destination, waypoints);
  }

  try {
    console.log(`🚚 Calculating route with waypoints: ${origin} → [${waypoints.length} stops] → ${destination}`);
    
    const url = 'https://maps.googleapis.com/maps/api/directions/json';
    const params = {
      origin: origin,
      destination: destination,
      mode: 'driving',
      units: 'metric',
      key: apiKey,
    };

    // Add waypoints if provided
    if (waypoints && waypoints.length > 0) {
      params.waypoints = waypoints.join('|');
    }

    const response = await axios.get(url, {
      params,
      timeout: 15000,
    });

    if (response.data.status === 'OK' && response.data.routes && response.data.routes.length > 0) {
      const route = response.data.routes[0];
      const leg = route.legs[0];
      
      // Calculate total distance and duration across all legs
      let totalDistanceMeters = 0;
      let totalDurationSeconds = 0;
      
      route.legs.forEach(leg => {
        totalDistanceMeters += leg.distance.value;
        totalDurationSeconds += leg.duration.value;
      });

      const distanceInKm = Math.round((totalDistanceMeters / 1000) * 10) / 10;

      console.log(`✅ Google Maps distance with waypoints: ${distanceInKm} km (${Math.round(totalDurationSeconds / 60)} min)`);

      return {
        distance: distanceInKm,
        unit: 'km',
        duration: Math.round(totalDurationSeconds / 60),
        origin: route.legs[0].start_address,
        destination: route.legs[route.legs.length - 1].end_address,
        waypoints: route.legs.slice(0, -1).map(leg => leg.end_address),
      };
    }

    // If Google Maps fails, use fallback
    console.log('⚠️ Google Maps Directions API returned no results, using fallback');
    return calculateRouteDistanceWithWaypointsFallback(origin, destination, waypoints);
    
  } catch (error) {
    console.error('❌ Google Maps Directions API error:', error.message);
    console.log('⚠️ Falling back to alternative method');
    return calculateRouteDistanceWithWaypointsFallback(origin, destination, waypoints);
  }
};

/**
 * Fallback: Calculate route distance with waypoints using OSRM
 * @param {string} origin - Starting location
 * @param {string} destination - Ending location
 * @param {Array<string>} waypoints - Array of waypoint locations
 * @returns {Promise<{distance: number, unit: string, duration: number}>}
 */
const calculateRouteDistanceWithWaypointsFallback = async (origin, destination, waypoints = []) => {
  try {
    console.log(`🚚 Calculating route with waypoints (fallback): ${origin} → [${waypoints.length} stops] → ${destination}`);
    
    // Geocode all locations
    const locations = [origin, ...waypoints, destination];
    const coords = await Promise.all(locations.map(loc => getCachedGeocode(loc)));

    console.log(`📍 Geocoded ${coords.length} locations`);

    // Build OSRM URL with all coordinates
    const coordString = coords.map(c => `${c.lon},${c.lat}`).join(';');
    const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${coordString}?overview=false`;
    
    let response;
    let retries = 2;
    
    while (retries > 0) {
      try {
        response = await axios.get(osrmUrl, { 
          timeout: 15000,
          headers: { 'User-Agent': 'TruckFlow/1.0' }
        });
        break;
      } catch (err) {
        retries--;
        if (retries === 0) throw err;
        console.log(`⚠️ OSRM request failed, retrying... (${retries} attempts left)`);
        await delay(1000);
      }
    }

    if (response.data && response.data.routes && response.data.routes.length > 0) {
      const route = response.data.routes[0];
      const distanceInMeters = route.distance;
      const durationInSeconds = route.duration;
      const distanceInKm = Math.round((distanceInMeters / 1000) * 10) / 10;

      console.log(`✅ Route distance with waypoints: ${distanceInKm} km (${Math.round(durationInSeconds / 60)} min)`);

      return {
        distance: distanceInKm,
        unit: 'km',
        duration: Math.round(durationInSeconds / 60),
        fallback: true,
      };
    }

    // Last resort: sum of straight-line distances
    console.log('⚠️ OSRM routing failed, using straight-line distance approximation');
    let totalDistance = 0;
    for (let i = 0; i < coords.length - 1; i++) {
      totalDistance += calculateDistance(
        coords[i].lat,
        coords[i].lon,
        coords[i + 1].lat,
        coords[i + 1].lon
      );
    }

    const approximateRoadDistance = Math.round(totalDistance * 1.3 * 10) / 10;

    return {
      distance: approximateRoadDistance,
      unit: 'km',
      duration: null,
      fallback: true,
    };
  } catch (error) {
    console.error('❌ Distance calculation with waypoints error:', error.message);
    throw error;
  }
};

/**
 * Main function to calculate route distance (tries Google Maps first, then fallback)
 * @param {string} pickupLocation - Pickup location string
 * @param {string} dropoffLocation - Dropoff location string
 * @returns {Promise<{distance: number, unit: string, duration: number}>}
 */
const calculateRouteDistance = async (pickupLocation, dropoffLocation) => {
  return calculateRouteDistanceWithGoogle(pickupLocation, dropoffLocation);
};

module.exports = {
  geocodeLocation,
  calculateDistance,
  calculateRouteDistance,
  calculateRouteDistanceWithWaypoints,
};
