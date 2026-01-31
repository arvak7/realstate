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
            try {
                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/properties`);
                if (res.ok) {
                    const data = await res.json();
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

    if (loading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="animate-pulse">
                        <div className="aspect-[4/3] bg-neutral-warm rounded-2xl mb-4"></div>
                        <div className="h-5 bg-neutral-warm rounded w-3/4 mb-2"></div>
                        <div className="h-4 bg-neutral-warm rounded w-1/2"></div>
                    </div>
                ))}
            </div>
        );
    }

    if (properties.length === 0) {
        return (
            <div className="text-center py-16">
                <p className="text-kindred-gray text-lg">
                    No hi ha propietats disponibles en aquest moment.
                </p>
                <Link href="/properties/new" className="btn-primary mt-6 inline-block">
                    Publica la primera propietat
                </Link>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {properties.map((property) => (
                <Link
                    key={property.id}
                    href={session ? `/properties/${property.id}` : "#"}
                    onClick={(e) => !session && e.preventDefault()}
                    className={`group block ${!session ? 'cursor-default' : ''}`}
                >
                    <div className="relative">
                        {/* Image */}
                        <div className="aspect-[4/3] rounded-2xl overflow-hidden bg-neutral-warm mb-4">
                            <img
                                src={property.images?.[0]?.url || "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=600&h=450&fit=crop"}
                                alt={property.basic_info.title}
                                className={`w-full h-full object-cover transition-transform duration-500 ${session ? 'group-hover:scale-105' : ''}`}
                            />
                        </div>

                        {/* Price Badge */}
                        <div className="absolute top-4 left-4 bg-white/95 backdrop-blur-sm px-3 py-1.5 rounded-pill text-sm font-semibold text-kindred-dark shadow-soft">
                            €{property.basic_info.price.toLocaleString()}
                        </div>
                    </div>

                    {/* Content */}
                    <div>
                        <h3 className="text-lg font-semibold text-kindred-dark mb-2 line-clamp-1 group-hover:underline decoration-1 underline-offset-2">
                            {property.basic_info.title}
                        </h3>

                        {/* Property Details */}
                        <div className="flex items-center gap-3 text-kindred-gray text-sm mb-2">
                            {property.basic_info.rooms && (
                                <span>{property.basic_info.rooms} hab.</span>
                            )}
                            {property.basic_info.rooms && property.basic_info.square_meters && (
                                <span className="text-gray-300">·</span>
                            )}
                            {property.basic_info.square_meters && (
                                <span>{property.basic_info.square_meters} m²</span>
                            )}
                        </div>

                        {/* Location */}
                        {property.location?.municipality && (
                            <p className="text-kindred-gray text-sm">
                                {property.location.municipality}
                                {property.location.province && `, ${property.location.province}`}
                            </p>
                        )}

                        {/* Login prompt */}
                        {!session && (
                            <p className="text-xs text-kindred-gray/60 mt-3 italic">
                                Inicia sessió per veure detalls
                            </p>
                        )}
                    </div>
                </Link>
            ))}
        </div>
    );
}
