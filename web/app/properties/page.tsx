"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

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
        <div className="min-h-screen bg-white">
            <Navbar />

            {/* Header */}
            <div className="bg-white border-b border-gray-100">
                <div className="max-w-7xl mx-auto px-6 lg:px-8 py-12">
                    <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-6">
                        <div>
                            <h1 className="text-4xl md:text-5xl text-kindred-dark mb-3">
                                Immobles disponibles
                            </h1>
                            <p className="text-kindred-gray text-lg">
                                Troba la propietat perfecta per a tu
                            </p>
                        </div>
                        {session && (
                            <Link
                                href="/properties/new"
                                className="btn-primary self-start"
                            >
                                Publicar Immoble
                            </Link>
                        )}
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-neutral-warm/50 border-b border-gray-100">
                <div className="max-w-7xl mx-auto px-6 lg:px-8 py-6">
                    <form onSubmit={handleSearch} className="flex flex-wrap gap-4">
                        <div className="flex-1 min-w-[200px]">
                            <input
                                type="text"
                                placeholder="Cerca per ubicació o paraules clau..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-kindred-dark/20 focus:border-kindred-dark outline-none transition-all"
                            />
                        </div>
                        <input
                            type="number"
                            placeholder="Preu mínim"
                            value={minPrice}
                            onChange={(e) => setMinPrice(e.target.value)}
                            className="w-32 px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-kindred-dark/20 focus:border-kindred-dark outline-none transition-all"
                        />
                        <input
                            type="number"
                            placeholder="Preu màxim"
                            value={maxPrice}
                            onChange={(e) => setMaxPrice(e.target.value)}
                            className="w-32 px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-kindred-dark/20 focus:border-kindred-dark outline-none transition-all"
                        />
                        <select
                            value={rooms}
                            onChange={(e) => setRooms(e.target.value)}
                            className="w-36 px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-kindred-dark/20 focus:border-kindred-dark outline-none transition-all"
                        >
                            <option value="">Habitacions</option>
                            <option value="1">1 hab.</option>
                            <option value="2">2 hab.</option>
                            <option value="3">3 hab.</option>
                            <option value="4">4+ hab.</option>
                        </select>
                        <button
                            type="submit"
                            className="btn-primary"
                        >
                            Cercar
                        </button>
                    </form>
                </div>
            </div>

            {/* Properties Grid */}
            <div className="max-w-7xl mx-auto px-6 lg:px-8 py-12">
                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {[1, 2, 3, 4, 5, 6].map((i) => (
                            <div key={i} className="animate-pulse">
                                <div className="aspect-[4/3] bg-neutral-warm rounded-2xl mb-4"></div>
                                <div className="h-5 bg-neutral-warm rounded w-3/4 mb-2"></div>
                                <div className="h-4 bg-neutral-warm rounded w-1/2"></div>
                            </div>
                        ))}
                    </div>
                ) : properties.length === 0 ? (
                    <div className="text-center py-20">
                        <h3 className="text-2xl text-kindred-dark mb-3">
                            No s'han trobat immobles
                        </h3>
                        <p className="text-kindred-gray mb-8">
                            Prova amb uns altres criteris de cerca
                        </p>
                        <button
                            onClick={() => {
                                setSearch("");
                                setMinPrice("");
                                setMaxPrice("");
                                setRooms("");
                                fetchProperties();
                            }}
                            className="btn-outline"
                        >
                            Netejar filtres
                        </button>
                    </div>
                ) : (
                    <>
                        <p className="text-kindred-gray mb-8">
                            {properties.length} {properties.length === 1 ? 'immoble trobat' : 'immobles trobats'}
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {properties.map((property) => (
                                <Link
                                    key={property.id}
                                    href={`/properties/${property.id}`}
                                    className="group block"
                                >
                                    <div className="relative">
                                        <div className="aspect-[4/3] rounded-2xl overflow-hidden bg-neutral-warm mb-4">
                                            {property.images?.[0]?.url ? (
                                                <img
                                                    src={property.images[0].url}
                                                    alt={property.basic_info?.title || "Immoble"}
                                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                                />
                                            ) : (
                                                <img
                                                    src="https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=600&h=450&fit=crop"
                                                    alt="Placeholder"
                                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                                />
                                            )}
                                        </div>
                                        <div className="absolute top-4 left-4 bg-white/95 backdrop-blur-sm px-3 py-1.5 rounded-pill text-sm font-semibold text-kindred-dark shadow-soft">
                                            €{property.basic_info?.price?.toLocaleString("ca-ES")}
                                        </div>
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-semibold text-kindred-dark mb-2 line-clamp-1 group-hover:underline decoration-1 underline-offset-2">
                                            {property.basic_info?.title || "Sense títol"}
                                        </h3>
                                        <div className="flex items-center gap-3 text-kindred-gray text-sm mb-2">
                                            {property.basic_info?.rooms && (
                                                <span>{property.basic_info.rooms} hab.</span>
                                            )}
                                            {property.basic_info?.rooms && property.basic_info?.square_meters && (
                                                <span className="text-gray-300">·</span>
                                            )}
                                            {property.basic_info?.square_meters && (
                                                <span>{property.basic_info.square_meters} m²</span>
                                            )}
                                        </div>
                                        {property.location?.municipality && (
                                            <p className="text-kindred-gray text-sm">
                                                {property.location.municipality}
                                                {property.location.province && `, ${property.location.province}`}
                                            </p>
                                        )}
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </>
                )}
            </div>

            <Footer />
        </div>
    );
}
