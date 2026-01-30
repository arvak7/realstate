"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";

interface Property {
    id: string;
    basic_info: {
        title: string;
        description: string;
        price: number;
        rooms?: number;
        square_meters?: number;
    };
    location?: {
        municipality?: string;
        province?: string;
    };
    images: { url: string }[];
}

export default function PropertyGrid() {
    const { data: session } = useSession();
    const [properties, setProperties] = useState<Property[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchProperties() {
            // In a real app, use SWR or React Query
            try {
                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/properties`);
                if (res.ok) {
                    const data = await res.json();
                    // The API returns { properties: [], total: ..., page: ..., limit: ... }
                    // We need to extract the properties array from the response object
                    setProperties(data.properties || []);
                }
            } catch (error) {
                console.error("Failed to fetch properties", error);
            } finally {
                setLoading(false);
            }
        }
        fetchProperties();
    }, []);

    if (loading) return <div className="text-center py-12 text-text-secondary">Loading properties...</div>;

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {properties.map((property) => (
                <div
                    key={property.id}
                    className="bg-white rounded-2xl shadow-soft overflow-hidden hover:shadow-soft-lg transition-all duration-300 hover:-translate-y-1 group"
                >
                    <div className="aspect-[4/3] bg-neutral-warm relative overflow-hidden">
                        <img
                            src={property.images?.[0]?.url || "https://placehold.co/600x400?text=No+Image"}
                            alt={property.basic_info.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-sm px-4 py-2 rounded-full text-lg font-semibold shadow-soft text-primary-dark">
                            €{property.basic_info.price.toLocaleString()}
                        </div>
                    </div>
                    <div className="p-6">
                        <h3 className="text-xl font-semibold mb-3 text-text-primary tracking-tight line-clamp-1">
                            {property.basic_info.title}
                        </h3>

                        {/* Property Info Icons */}
                        <div className="flex items-center gap-4 mb-4 text-text-secondary text-sm">
                            {property.basic_info.rooms && (
                                <div className="flex items-center gap-1.5">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                                    </svg>
                                    <span className="font-medium">{property.basic_info.rooms} hab.</span>
                                </div>
                            )}
                            {property.basic_info.square_meters && (
                                <div className="flex items-center gap-1.5">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                                    </svg>
                                    <span className="font-medium">{property.basic_info.square_meters} m²</span>
                                </div>
                            )}
                            {property.location?.municipality && (
                                <div className="flex items-center gap-1.5">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                    </svg>
                                    <span className="font-medium truncate">{property.location.municipality}</span>
                                </div>
                            )}
                        </div>

                        <p className="text-text-secondary text-sm mb-5 line-clamp-2 leading-relaxed">
                            {property.basic_info.description}
                        </p>

                        {session ? (
                            <Link
                                href={`/properties/${property.id}`}
                                className="block w-full mt-2 border-2 border-primary-dark text-primary-dark rounded-xl py-2.5 text-sm font-medium hover:bg-primary-dark hover:text-white transition-all duration-300 text-center"
                            >
                                Veure Detalls
                            </Link>
                        ) : (
                            <div className="text-xs text-text-light italic text-center mt-2">Inicia sessió per veure detalls</div>
                        )}
                    </div>
                </div>
            ))}
        </div>
    );
}
