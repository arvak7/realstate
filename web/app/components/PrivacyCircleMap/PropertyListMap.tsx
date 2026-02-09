'use client';

import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface PropertyCircle {
    id: string;
    centerLat: number;
    centerLon: number;
    radius: number;
    title?: string;
    price?: number;
}

interface PropertyListMapProps {
    properties: PropertyCircle[];
    height?: string;
    className?: string;
    onPropertyClick?: (id: string) => void;
}

export default function PropertyListMap({
    properties,
    height = '500px',
    className = '',
    onPropertyClick
}: PropertyListMapProps) {
    const mapRef = useRef<HTMLDivElement>(null);
    const mapInstanceRef = useRef<L.Map | null>(null);

    useEffect(() => {
        if (!mapRef.current) return;

        // Clean up existing map
        if (mapInstanceRef.current) {
            mapInstanceRef.current.remove();
            mapInstanceRef.current = null;
        }

        // Filter valid properties
        const validProperties = properties.filter(
            p => p.centerLat && p.centerLon && !isNaN(p.centerLat) && !isNaN(p.centerLon)
        );

        if (validProperties.length === 0) return;

        // Calculate center from all properties
        const avgLat = validProperties.reduce((sum, p) => sum + p.centerLat, 0) / validProperties.length;
        const avgLon = validProperties.reduce((sum, p) => sum + p.centerLon, 0) / validProperties.length;

        // Initialize map
        const map = L.map(mapRef.current, {
            center: [avgLat, avgLon],
            zoom: 10,
            scrollWheelZoom: true,
            dragging: true,
            zoomControl: true
        });

        // Add OpenStreetMap tiles
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(map);

        // Add circles for each property
        const bounds = L.latLngBounds([]);

        validProperties.forEach(property => {
            const circle = L.circle([property.centerLat, property.centerLon], {
                radius: property.radius,
                color: '#3b82f6',
                fillColor: '#3b82f6',
                fillOpacity: 0.2,
                weight: 2
            }).addTo(map);

            // Extend bounds to include this circle
            bounds.extend(circle.getBounds());

            // Add popup with property info
            if (property.title || property.price) {
                const popupContent = `
                    <div class="text-sm">
                        ${property.title ? `<p class="font-semibold mb-1">${property.title}</p>` : ''}
                        ${property.price ? `<p class="text-blue-600 font-bold">€${property.price.toLocaleString('ca-ES')}</p>` : ''}
                    </div>
                `;
                circle.bindPopup(popupContent);
            }

            // Click handler
            if (onPropertyClick) {
                circle.on('click', () => {
                    onPropertyClick(property.id);
                });
            }
        });

        // Fit map to show all circles
        if (bounds.isValid()) {
            map.fitBounds(bounds, { padding: [50, 50] });
        }

        mapInstanceRef.current = map;

        return () => {
            map.remove();
            mapInstanceRef.current = null;
        };
    }, [properties, onPropertyClick]);

    const validProperties = properties.filter(
        p => p.centerLat && p.centerLon && !isNaN(p.centerLat) && !isNaN(p.centerLon)
    );

    if (validProperties.length === 0) {
        return (
            <div
                className={`bg-gray-100 flex items-center justify-center rounded-lg ${className}`}
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
