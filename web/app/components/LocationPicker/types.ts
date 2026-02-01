export interface LocationData {
    latitude: number;
    longitude: number;
    address: string;
    privacyRadius: number;
}

export interface GeoSearchResult {
    latitude: number;
    longitude: number;
    displayName: string;
}

export interface LocationPickerProps {
    value: LocationData | null;
    onChange: (location: LocationData) => void;
    defaultCenter?: [number, number];
    defaultZoom?: number;
}

export interface AddressSearchProps {
    onSelect: (result: GeoSearchResult) => void;
    placeholder?: string;
}

export interface MapViewProps {
    center: [number, number];
    zoom: number;
    markerPosition: [number, number] | null;
    privacyRadius: number;
    onMapClick: (lat: number, lng: number) => void;
    onMarkerDrag: (lat: number, lng: number) => void;
}

export interface PrivacySliderProps {
    value: number;
    onChange: (value: number) => void;
    min?: number;
    max?: number;
}
