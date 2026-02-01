export interface GeoResult {
    latitude: number;
    longitude: number;
    displayName: string;
    address?: {
        road?: string;
        houseNumber?: string;
        city?: string;
        town?: string;
        village?: string;
        municipality?: string;
        county?: string;
        state?: string;
        postcode?: string;
        country?: string;
    };
}

export interface GeocodingProvider {
    search(query: string): Promise<GeoResult[]>;
    reverse(lat: number, lon: number): Promise<string>;
}

export { NominatimProvider } from './nominatim';
