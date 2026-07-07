/**
 * Calculate the distance between two sets of coordinates using the Haversine Formula.
 * @param {number} lat1 - Latitude of point 1
 * @param {number} lon1 - Longitude of point 1
 * @param {number} lat2 - Latitude of point 2
 * @param {number} lon2 - Longitude of point 2
 * @returns {number} - Distance in kilometers
 */
export const getDistanceInKm = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Earth's radius in kilometers
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) *
      Math.cos(deg2rad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c; // Distance in km

  return distance;
};

/**
 * Converts degrees to radians
 * @param {number} deg
 * @returns {number}
 */
const deg2rad = (deg) => {
  return deg * (Math.PI / 180);
};

/**
 * Checks if a point is within a specified circular geofence boundary.
 * @param {number} pointLat - Latitude of the query point
 * @param {number} pointLon - Longitude of the query point
 * @param {number} centerLat - Latitude of geofence center
 * @param {number} centerLon - Longitude of geofence center
 * @param {number} radiusInKm - Radius threshold in kilometers
 * @returns {boolean}
 */
export const isWithinRadius = (pointLat, pointLon, centerLat, centerLon, radiusInKm) => {
  const distance = getDistanceInKm(pointLat, pointLon, centerLat, centerLon);
  return distance <= radiusInKm;
};
