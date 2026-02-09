'use client';

import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface PrivacyCircleMapProps {
    centerLat: number;
    centerLon: number;
    radius: number;
    height?: string;
    className?: string;
}

export default function PrivacyCircleMap({
    centerLat,
    centerLon,
    radius,
    height = '300px',
    className = ''
}: PrivacyCircleMapProps) {
    const mapRef = useRef<HTMLDivElement>(null);
    const mapInstanceRef = useRef<L.Map | null>(null);

    useEffect(() => {
        if (!mapRef.current || mapInstanceRef.current) return;
        if (!centerLat || !centerLon) return;

        // Initialize map
        const map = L.map(mapRef.current, {
            center: [centerLat, centerLon],
            zoom: 15,
            scrollWheelZoom: false,
            dragging: true,
            zoomControl: true
        });

        // Add OpenStreetMap tiles
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(map);

        // Add privacy circle
        const circle = L.circle([centerLat, centerLon], {
            radius: radius,
            color: '#3b82f6',
            fillColor: '#3b82f6',
            fillOpacity: 0.15,
            weight: 2
        }).addTo(map);

        // Fit map to circle bounds with padding
        map.fitBounds(circle.getBounds(), { padding: [30, 30] });

        mapInstanceRef.current = map;

        return () => {
            map.remove();
            mapInstanceRef.current = null;
        };
    }, [centerLat, centerLon, radius]);

    // Update map when props change
    useEffect(() => {
        if (!mapInstanceRef.current || !centerLat || !centerLon) return;

        const map = mapInstanceRef.current;

        // Clear existing layers except tile layer
        map.eachLayer((layer) => {
            if (layer instanceof L.Circle) {
                map.removeLayer(layer);
            }
        });

        // Add new circle
        const circle = L.circle([centerLat, centerLon], {
            radius: radius,
            color: '#3b82f6',
            fillColor: '#3b82f6',
            fillOpacity: 0.15,
            weight: 2
        }).addTo(map);

        // Fit to new bounds
        map.fitBounds(circle.getBounds(), { padding: [30, 30] });
    }, [centerLat, centerLon, radius]);

    if (!centerLat || !centerLon) {
        return (
            <div
                className={`bg-gray-100 flex items-center justify-center ${className}`}
                style={{ height }}
            >
                <p className="text-gray-500">No location data available</p>
            </div>
        );
    }

    return (
        <div
            ref={mapRef}
            className={`rounded-lg overflow-hidden ${className}`}
            style={{ height }}
        />
    );
}
