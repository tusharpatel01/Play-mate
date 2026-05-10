/**
 * Convert kilometres to metres for MongoDB $nearSphere queries.
 */
const kmToMetres = (km) => km * 1000;

/**
 * Build a MongoDB geospatial $nearSphere filter.
 * @param {number} lat
 * @param {number} lng
 * @param {number} radiusKm
 */
const nearSphereFilter = (lat, lng, radiusKm = 10) => ({
  $nearSphere: {
    $geometry: {
      type: "Point",
      coordinates: [parseFloat(lng), parseFloat(lat)],
    },
    $maxDistance: kmToMetres(parseFloat(radiusKm)),
  },
});

/**
 * Build a MongoDB $geoWithin box filter (used for rectangular bounding-box queries).
 * bottomLeft and topRight are [lng, lat] pairs.
 */
const geoWithinBox = (swLat, swLng, neLat, neLng) => ({
  $geoWithin: {
    $box: [
      [parseFloat(swLng), parseFloat(swLat)],
      [parseFloat(neLng), parseFloat(neLat)],
    ],
  },
});

/**
 * Haversine distance (km) between two [lat, lng] pairs.
 * Useful for client-side distance labels.
 */
const haversineDistance = (lat1, lng1, lat2, lng2) => {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

module.exports = { kmToMetres, nearSphereFilter, geoWithinBox, haversineDistance };
