"use client";

import { useEffect, useRef, useMemo } from "react";
import { MapContainer, TileLayer, Marker, Circle, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { MapViewProps } from "./types";

// Fix for default marker icons in Next.js
const defaultIcon = L.icon({
    iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
    iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
    shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
});

L.Marker.prototype.options.icon = defaultIcon;

function MapClickHandler({ onClick }: { onClick: (lat: number, lng: number) => void }) {
    useMapEvents({
        click(e) {
            onClick(e.latlng.lat, e.latlng.lng);
        },
    });
    return null;
}

function MapCenterUpdater({ center }: { center: [number, number] }) {
    const map = useMap();
    const prevCenter = useRef(center);

    useEffect(() => {
        if (prevCenter.current[0] !== center[0] || prevCenter.current[1] !== center[1]) {
            map.setView(center, map.getZoom());
            prevCenter.current = center;
        }
    }, [center, map]);

    return null;
}

function DraggableMarker({
    position,
    onDrag,
}: {
    position: [number, number];
    onDrag: (lat: number, lng: number) => void;
}) {
    const markerRef = useRef<L.Marker>(null);

    const eventHandlers = {
        dragend() {
            const marker = markerRef.current;
            if (marker) {
                const pos = marker.getLatLng();
                onDrag(pos.lat, pos.lng);
            }
        },
    };

    return (
        <Marker
            draggable
            eventHandlers={eventHandlers}
            position={position}
            ref={markerRef}
        />
    );
}

export default function MapView({
    center,
    zoom,
    markerPosition,
    privacyRadius,
    onMapClick,
    onMarkerDrag,
}: MapViewProps) {
    // Generate a stable random seed based on marker position
    // This ensures the offset stays consistent for the same location
    // but changes when the marker moves
    const offsetSeedRef = useRef<number>(Math.random());
    const lastMarkerRef = useRef<string | null>(null);

    // Calculate the privacy circle center with offset
    // The circle is NOT centered on the real location to protect privacy
    const privacyCircleCenter = useMemo(() => {
        if (!markerPosition) return null;

        const markerKey = `${markerPosition[0].toFixed(6)},${markerPosition[1].toFixed(6)}`;

        // Generate new seed when marker position changes
        if (lastMarkerRef.current !== markerKey) {
            offsetSeedRef.current = Math.random();
            lastMarkerRef.current = markerKey;
        }

        // Use seeded random for consistent offset
        const seed = offsetSeedRef.current;
        const angle = seed * 2 * Math.PI;
        const minDistance = privacyRadius * 0.3;
        const maxDistance = privacyRadius * 0.7;
        const distance = minDistance + ((seed * 7919) % 1) * (maxDistance - minDistance);

        const latOffset = (distance * Math.cos(angle)) / 111320;
        const lngOffset = (distance * Math.sin(angle)) / (111320 * Math.cos(markerPosition[0] * Math.PI / 180));

        return [markerPosition[0] + latOffset, markerPosition[1] + lngOffset] as [number, number];
    }, [markerPosition, privacyRadius]);

    return (
        <div className="h-[400px] w-full rounded-xl overflow-hidden border border-neutral-warm">
            <MapContainer
                center={center}
                zoom={zoom}
                className="h-full w-full"
                scrollWheelZoom={true}
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <MapClickHandler onClick={onMapClick} />
                <MapCenterUpdater center={center} />

                {markerPosition && privacyCircleCenter && (
                    <>
                        <DraggableMarker
                            position={markerPosition}
                            onDrag={onMarkerDrag}
                        />
                        {/* Privacy circle is offset from the real location */}
                        <Circle
                            center={privacyCircleCenter}
                            radius={privacyRadius}
                            pathOptions={{
                                color: "#4a5568",
                                fillColor: "#4a5568",
                                fillOpacity: 0.15,
                                weight: 2,
                                dashArray: "5, 5",
                            }}
                        />
                    </>
                )}
            </MapContainer>
        </div>
    );
}
