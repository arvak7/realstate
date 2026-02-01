import { GeocodingProvider, GeoResult } from './index';

const NOMINATIM_BASE_URL = 'https://nominatim.openstreetmap.org';
const USER_AGENT = 'RealStateApp/1.0';

interface NominatimSearchResult {
    lat: string;
    lon: string;
    display_name: string;
    address?: {
        road?: string;
        house_number?: string;
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

export class NominatimProvider implements GeocodingProvider {
    private async fetchWithRateLimit(url: string): Promise<Response> {
        // Nominatim requires max 1 request per second
        const response = await fetch(url, {
            headers: {
                'User-Agent': USER_AGENT,
                'Accept-Language': 'ca,es,en',
            },
        });

        if (!response.ok) {
            throw new Error(`Nominatim request failed: ${response.status}`);
        }

        return response;
    }

    async search(query: string): Promise<GeoResult[]> {
        const params = new URLSearchParams({
            q: query,
            format: 'json',
            addressdetails: '1',
            limit: '5',
        });

        const response = await this.fetchWithRateLimit(
            `${NOMINATIM_BASE_URL}/search?${params.toString()}`
        );

        const results: NominatimSearchResult[] = await response.json();

        return results.map((r) => ({
            latitude: parseFloat(r.lat),
            longitude: parseFloat(r.lon),
            displayName: r.display_name,
            address: r.address ? {
                road: r.address.road,
                houseNumber: r.address.house_number,
                city: r.address.city,
                town: r.address.town,
                village: r.address.village,
                municipality: r.address.municipality,
                county: r.address.county,
                state: r.address.state,
                postcode: r.address.postcode,
                country: r.address.country,
            } : undefined,
        }));
    }

    async reverse(lat: number, lon: number): Promise<string> {
        const params = new URLSearchParams({
            lat: lat.toString(),
            lon: lon.toString(),
            format: 'json',
            addressdetails: '1',
        });

        const response = await this.fetchWithRateLimit(
            `${NOMINATIM_BASE_URL}/reverse?${params.toString()}`
        );

        const result: NominatimSearchResult = await response.json();

        return result.display_name || '';
    }
}
