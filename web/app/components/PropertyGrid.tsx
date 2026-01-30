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

    if (loading) return <div className="text-center py-12">Loading properties...</div>;

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {properties.map((property) => (
                <div key={property.id} className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-300">
                    <div className="h-48 bg-gray-200 relative">
                        {/* Using img for simplicity in POC to avoid sizing issues with Next Image for external URLs */}
                        <img
                            src={property.images?.[0]?.url || "https://placehold.co/600x400?text=No+Image"}
                            alt={property.basic_info.title}
                            className="w-full h-full object-cover"
                        />
                        <div className="absolute top-4 right-4 bg-white/90 backdrop-blur px-3 py-1 rounded-full text-sm font-bold shadow-sm">
                            €{property.basic_info.price.toLocaleString()}
                        </div>
                    </div>
                    <div className="p-6">
                        <h3 className="text-xl font-bold mb-2 text-gray-800">{property.basic_info.title}</h3>
                        <p className="text-gray-600 text-sm mb-4 line-clamp-2">{property.basic_info.description}</p>
                        {session ? (
                            <Link
                                href={`/properties/${property.id}`}
                                className="block w-full mt-2 border-primary text-primary border rounded-lg py-2 text-sm hover:bg-blue-50 transition text-center"
                            >
                                View Details
                            </Link>
                        ) : (
                            <div className="text-xs text-gray-400 italic text-center mt-2">Sign in to view details</div>
                        )}
                    </div>
                </div>
            ))}
        </div>
    );
}
