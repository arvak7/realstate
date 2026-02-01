"use client";

import { useState, useCallback, useEffect } from "react";
import dynamic from "next/dynamic";
import AddressSearch from "./AddressSearch";
import PrivacySlider from "./PrivacySlider";
import { LocationPickerProps, LocationData, GeoSearchResult } from "./types";

// Dynamic import for MapView to avoid SSR issues with Leaflet
const MapView = dynamic(() => import("./MapView"), {
    ssr: false,
    loading: () => (
        <div className="h-[400px] w-full rounded-xl bg-neutral-warm animate-pulse flex items-center justify-center">
            <span className="text-text-secondary">Carregant mapa...</span>
        </div>
    ),
});

const DEFAULT_CENTER: [number, number] = [41.3874, 2.1686]; // Barcelona
const DEFAULT_ZOOM = 13;
const DEFAULT_PRIVACY_RADIUS = 500;

export default function LocationPicker({
    value,
    onChange,
    defaultCenter = DEFAULT_CENTER,
    defaultZoom = DEFAULT_ZOOM,
}: LocationPickerProps) {
    const [mapCenter, setMapCenter] = useState<[number, number]>(
        value ? [value.latitude, value.longitude] : defaultCenter
    );
    const [markerPosition, setMarkerPosition] = useState<[number, number] | null>(
        value ? [value.latitude, value.longitude] : null
    );
    const [address, setAddress] = useState(value?.address || "");
    const [privacyRadius, setPrivacyRadius] = useState(value?.privacyRadius || DEFAULT_PRIVACY_RADIUS);
    const [zoom] = useState(defaultZoom);

    // Update internal state when value prop changes
    useEffect(() => {
        if (value) {
            setMarkerPosition([value.latitude, value.longitude]);
            setMapCenter([value.latitude, value.longitude]);
            setAddress(value.address);
            setPrivacyRadius(value.privacyRadius);
        }
    }, [value]);

    const reverseGeocode = useCallback(async (lat: number, lon: number) => {
        try {
            const params = new URLSearchParams({
                lat: lat.toString(),
                lon: lon.toString(),
                format: "json",
                addressdetails: "1",
            });

            const response = await fetch(
                `https://nominatim.openstreetmap.org/reverse?${params.toString()}`,
                {
                    headers: {
                        "Accept-Language": "ca,es,en",
                    },
                }
            );

            if (!response.ok) throw new Error("Reverse geocode failed");

            const data = await response.json();
            return data.display_name || "";
        } catch (error) {
            console.error("Reverse geocode error:", error);
            return "";
        }
    }, []);

    const updateLocation = useCallback(
        (lat: number, lon: number, addr: string, radius: number) => {
            const locationData: LocationData = {
                latitude: lat,
                longitude: lon,
                address: addr,
                privacyRadius: radius,
            };
            onChange(locationData);
        },
        [onChange]
    );

    const handleAddressSelect = useCallback(
        (result: GeoSearchResult) => {
            const newPosition: [number, number] = [result.latitude, result.longitude];
            setMarkerPosition(newPosition);
            setMapCenter(newPosition);
            setAddress(result.displayName);
            updateLocation(result.latitude, result.longitude, result.displayName, privacyRadius);
        },
        [privacyRadius, updateLocation]
    );

    const handleMapClick = useCallback(
        async (lat: number, lng: number) => {
            const newPosition: [number, number] = [lat, lng];
            setMarkerPosition(newPosition);

            const addr = await reverseGeocode(lat, lng);
            setAddress(addr);
            updateLocation(lat, lng, addr, privacyRadius);
        },
        [privacyRadius, reverseGeocode, updateLocation]
    );

    const handleMarkerDrag = useCallback(
        async (lat: number, lng: number) => {
            const newPosition: [number, number] = [lat, lng];
            setMarkerPosition(newPosition);

            const addr = await reverseGeocode(lat, lng);
            setAddress(addr);
            updateLocation(lat, lng, addr, privacyRadius);
        },
        [privacyRadius, reverseGeocode, updateLocation]
    );

    const handlePrivacyChange = useCallback(
        (newRadius: number) => {
            setPrivacyRadius(newRadius);
            if (markerPosition) {
                updateLocation(markerPosition[0], markerPosition[1], address, newRadius);
            }
        },
        [markerPosition, address, updateLocation]
    );

    return (
        <div className="space-y-4">
            <AddressSearch onSelect={handleAddressSelect} />

            <MapView
                center={mapCenter}
                zoom={zoom}
                markerPosition={markerPosition}
                privacyRadius={privacyRadius}
                onMapClick={handleMapClick}
                onMarkerDrag={handleMarkerDrag}
            />

            {markerPosition && (
                <>
                    <div className="bg-neutral-cream rounded-xl p-4">
                        <p className="text-sm text-text-secondary mb-1">Adreça seleccionada:</p>
                        <p className="text-sm font-medium text-text-primary">{address || "Sense adreça"}</p>
                        <p className="text-xs text-text-tertiary mt-1">
                            Coordenades: {markerPosition[0].toFixed(6)}, {markerPosition[1].toFixed(6)}
                        </p>
                    </div>

                    <PrivacySlider value={privacyRadius} onChange={handlePrivacyChange} />
                </>
            )}

            {!markerPosition && (
                <p className="text-sm text-text-secondary text-center py-2">
                    Cerca una adreça o fes clic al mapa per seleccionar la ubicacio de l immoble.
                </p>
            )}
        </div>
    );
}

export type { LocationData, LocationPickerProps };
