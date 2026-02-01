/**
 * Feature flags and configuration constants for the application.
 * These can be overridden via environment variables.
 */

export const FEATURES = {
    // Geocoding provider: 'nominatim' or future providers
    GEOCODING_PROVIDER: process.env.GEOCODING_PROVIDER || 'nominatim',

    // Allow users to manually place a pin on the map
    MANUAL_PIN_ENABLED: process.env.MANUAL_PIN_ENABLED !== 'false',

    // Default privacy radius in meters (shown on public listings)
    DEFAULT_PRIVACY_RADIUS: parseInt(process.env.DEFAULT_PRIVACY_RADIUS || '500', 10),

    // Minimum allowed privacy radius in meters
    MIN_PRIVACY_RADIUS: parseInt(process.env.MIN_PRIVACY_RADIUS || '100', 10),

    // Maximum allowed privacy radius in meters
    MAX_PRIVACY_RADIUS: parseInt(process.env.MAX_PRIVACY_RADIUS || '2000', 10),
};

/**
 * Validates and clamps a privacy radius to allowed range.
 */
export function validatePrivacyRadius(radius: number | undefined): number {
    if (radius === undefined || isNaN(radius)) {
        return FEATURES.DEFAULT_PRIVACY_RADIUS;
    }
    return Math.max(
        FEATURES.MIN_PRIVACY_RADIUS,
        Math.min(FEATURES.MAX_PRIVACY_RADIUS, radius)
    );
}
