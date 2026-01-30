"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";

interface Property {
    id: string;
    basic_info: {
        title: string;
        description: string;
        price: number;
        rooms: number;
        square_meters: number;
    };
    location: {
        municipality: string;
        province: string;
    };
    images: Array<{
        url: string;
        is_main: boolean;
    }>;
}

export default function PropertiesPage() {
    const { data: session } = useSession();
    const [properties, setProperties] = useState<Property[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [minPrice, setMinPrice] = useState("");
    const [maxPrice, setMaxPrice] = useState("");
    const [rooms, setRooms] = useState("");

    useEffect(() => {
        fetchProperties();
    }, []);

    const fetchProperties = async () => {
        try {
            const params = new URLSearchParams();
            if (search) params.append("search", search);
            if (minPrice) params.append("minPrice", minPrice);
            if (maxPrice) params.append("maxPrice", maxPrice);
            if (rooms) params.append("rooms", rooms);

            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/properties?${params.toString()}`
            );
            const data = await response.json();
            setProperties(data.properties || []);
        } catch (error) {
            console.error("Error fetching properties:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        fetchProperties();
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <div className="flex justify-between items-center">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">
                                Immobles Disponibles
                            </h1>
                            <p className="text-gray-600 mt-1">
                                Troba la teva propera llar
                            </p>
                        </div>
                        {session && (
                            <Link
                                href="/properties/new"
                                className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition"
                            >
                                + Publicar Immoble
                            </Link>
                        )}
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white border-b">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <form onSubmit={handleSearch} className="grid grid-cols-1 md:grid-cols-5 gap-4">
                        <input
                            type="text"
                            placeholder="Cerca per ubicació o paraules clau..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="col-span-2 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        <input
                            type="number"
                            placeholder="Preu mínim"
                            value={minPrice}
                            onChange={(e) => setMinPrice(e.target.value)}
                            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        <input
                            type="number"
                            placeholder="Preu màxim"
                            value={maxPrice}
                            onChange={(e) => setMaxPrice(e.target.value)}
                            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        <div className="flex gap-2">
                            <select
                                value={rooms}
                                onChange={(e) => setRooms(e.target.value)}
                                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                                <option value="">Habitacions</option>
                                <option value="1">1</option>
                                <option value="2">2</option>
                                <option value="3">3</option>
                                <option value="4">4+</option>
                            </select>
                            <button
                                type="submit"
                                className="bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-700 transition"
                            >
                                Cercar
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            {/* Properties Grid */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {loading ? (
                    <div className="text-center py-12">
                        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                        <p className="mt-4 text-gray-600">Carregant immobles...</p>
                    </div>
                ) : properties.length === 0 ? (
                    <div className="text-center py-12">
                        <p className="text-gray-600 text-lg">
                            No s'han trobat immobles amb aquests criteris
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {properties.map((property) => (
                            <Link
                                key={property.id}
                                href={`/properties/${property.id}`}
                                className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition group"
                            >
                                <div className="relative h-48 bg-gray-200">
                                    {property.images?.[0]?.url ? (
                                        <img
                                            src={property.images[0].url}
                                            alt={property.basic_info?.title || "Immoble"}
                                            className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                                            <svg
                                                className="w-16 h-16"
                                                fill="none"
                                                stroke="currentColor"
                                                viewBox="0 0 24 24"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth={2}
                                                    d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                                                />
                                            </svg>
                                        </div>
                                    )}
                                </div>
                                <div className="p-5">
                                    <h3 className="text-xl font-bold text-gray-900 mb-2 line-clamp-1">
                                        {property.basic_info?.title || "Sense títol"}
                                    </h3>
                                    <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                                        {property.basic_info?.description || "Sense descripció"}
                                    </p>
                                    <div className="flex items-center justify-between mb-3">
                                        <span className="text-2xl font-bold text-blue-600">
                                            {property.basic_info?.price?.toLocaleString("ca-ES")}€
                                        </span>
                                        <span className="text-sm text-gray-500">
                                            {property.location?.municipality}, {property.location?.province}
                                        </span>
                                    </div>
                                    <div className="flex gap-4 text-sm text-gray-600">
                                        <span>🛏️ {property.basic_info?.rooms} hab.</span>
                                        <span>📐 {property.basic_info?.square_meters} m²</span>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
