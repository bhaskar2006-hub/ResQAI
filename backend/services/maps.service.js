import axios from 'axios';

const MAPS_API_KEY = process.env.MAPS_API_KEY;

/**
 * Fetch routing distance, duration, and coordinates between two points
 * Uses free OSRM (Open Source Routing Machine) by default, or Google Maps if key is present
 * @param {number} startLat
 * @param {number} startLon
 * @param {number} endLat
 * @param {number} endLon
 * @returns {Promise<Object>}
 */
export const getRoute = async (startLat, startLon, endLat, endLon) => {
  const isKeyConfigured = MAPS_API_KEY && MAPS_API_KEY !== 'your-maps-api-key';

  try {
    if (isKeyConfigured) {
      // Use Google Maps Distance Matrix
      const url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${startLat},${startLon}&destinations=${endLat},${endLon}&key=${MAPS_API_KEY}`;
      const response = await axios.get(url);
      const element = response.data.rows[0]?.elements[0];
      
      if (element && element.status === 'OK') {
        return {
          source: 'Google Maps API',
          distance: {
            text: element.distance.text,
            value: element.distance.value, // in meters
          },
          duration: {
            text: element.duration.text,
            value: element.duration.value, // in seconds
          },
        };
      }
      throw new Error('Google Maps distance calculation status not OK');
    } else {
      // Fallback: Use free OSRM Routing API (requires no keys)
      const url = `https://router.project-osrm.org/route/v1/driving/${startLon},${startLat};${endLon},${endLat}?overview=false`;
      const response = await axios.get(url);
      const route = response.data.routes[0];

      if (route) {
        return {
          source: 'OSRM (Free Fallback)',
          distance: {
            text: `${(route.distance / 1000).toFixed(2)} km`,
            value: route.distance, // in meters
          },
          duration: {
            text: `${(route.duration / 60).toFixed(1)} mins`,
            value: route.duration, // in seconds
          },
        };
      }
      throw new Error('OSRM routing request failed');
    }
  } catch (error) {
    console.error('Maps service request error:', error.message);
    // Hardcoded fallback data in case of offline/network failure
    return {
      source: 'Mock Fallback (Offline)',
      distance: {
        text: '5.2 km',
        value: 5200,
      },
      duration: {
        text: '12 mins',
        value: 720,
      },
    };
  }
};
