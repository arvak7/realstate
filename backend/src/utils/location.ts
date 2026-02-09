/**
 * Obfuscates a location by applying a random offset within the specified radius.
 * This protects property owner privacy by showing an approximate location.
 *
 * @param lat - Original latitude
 * @param lon - Original longitude
 * @param radiusMeters - Maximum offset radius in meters
 * @returns Obfuscated coordinates
 */
export function obfuscateLocation(
    lat: number,
    lon: number,
    radiusMeters: number
): { latitude: number; longitude: number } {
    // Generate random angle and distance
    const angle = Math.random() * 2 * Math.PI;
    const distance = Math.random() * radiusMeters;

    // Earth's radius in meters
    // 1 degree latitude ≈ 111,320 meters
    const metersPerDegreeLat = 111320;

    // Longitude degrees vary by latitude (cos adjustment)
    const metersPerDegreeLon = metersPerDegreeLat * Math.cos(lat * Math.PI / 180);

    // Calculate offset in degrees
    const dLat = (distance * Math.cos(angle)) / metersPerDegreeLat;
    const dLon = (distance * Math.sin(angle)) / metersPerDegreeLon;

    return {
        latitude: lat + dLat,
        longitude: lon + dLon,
    };
}

/**
 * Removes street number from an address to protect exact location.
 * Handles common address formats.
 *
 * @param address - Full address string
 * @returns Address without street number
 */
export function sanitizeAddress(address: string): string {
    if (!address) return '';

    // Remove leading numbers (e.g., "123 Main Street" -> "Main Street")
    let sanitized = address.replace(/^\d+\s*,?\s*/, '');

    // Remove numbers after street name (e.g., "Carrer Major, 45" -> "Carrer Major")
    sanitized = sanitized.replace(/,\s*\d+\s*(,|$)/, '$1');

    // Remove standalone numbers at the end
    sanitized = sanitized.replace(/\s+\d+\s*$/, '');

    return sanitized.trim();
}

/**
 * Validates that coordinates are within valid ranges.
 *
 * @param lat - Latitude (-90 to 90)
 * @param lon - Longitude (-180 to 180)
 * @returns True if coordinates are valid
 */
export function isValidCoordinates(lat: number, lon: number): boolean {
    return (
        !isNaN(lat) &&
        !isNaN(lon) &&
        lat >= -90 &&
        lat <= 90 &&
        lon >= -180 &&
        lon <= 180
    );
}

/**
 * Calculates the distance between two points using the Haversine formula.
 *
 * @param lat1 - First point latitude
 * @param lon1 - First point longitude
 * @param lat2 - Second point latitude
 * @param lon2 - Second point longitude
 * @returns Distance in meters
 */
export function calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
): number {
    const R = 6371000; // Earth's radius in meters
    const phi1 = lat1 * Math.PI / 180;
    const phi2 = lat2 * Math.PI / 180;
    const deltaPhi = (lat2 - lat1) * Math.PI / 180;
    const deltaLambda = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
        Math.cos(phi1) * Math.cos(phi2) *
        Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
}

/**
 * Generates a deterministic privacy circle center for a property.
 * The center is offset from the real location by 30-70% of the privacy radius,
 * ensuring the real location is always inside the circle but not at the center.
 *
 * This function should be called once when creating/updating a property,
 * and the result stored in the database for consistent display.
 *
 * @param lat - Real property latitude
 * @param lon - Real property longitude
 * @param radiusMeters - Privacy radius in meters
 * @returns Privacy circle center coordinates
 */
export function generatePrivacyCircleCenter(
    lat: number,
    lon: number,
    radiusMeters: number
): { centerLat: number; centerLon: number } {
    // Offset between 30-70% of the radius to ensure property is inside but not centered
    const offsetFactor = 0.3 + Math.random() * 0.4;
    const offsetDistance = radiusMeters * offsetFactor;
    const angle = Math.random() * 2 * Math.PI;

    // Earth's radius in meters - 1 degree latitude ≈ 111,320 meters
    const metersPerDegreeLat = 111320;
    const metersPerDegreeLon = metersPerDegreeLat * Math.cos(lat * Math.PI / 180);

    // Calculate offset in degrees
    const latOffset = (offsetDistance * Math.cos(angle)) / metersPerDegreeLat;
    const lonOffset = (offsetDistance * Math.sin(angle)) / metersPerDegreeLon;

    return {
        centerLat: lat + latOffset,
        centerLon: lon + lonOffset
    };
}
