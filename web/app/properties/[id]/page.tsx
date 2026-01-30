"use client";

import { useState, useEffect, use } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface PropertyDetail {
    id: string;
    status: string;
    isPrivate: boolean;
    owner: {
        id: string;
        name: string;
        email: string;
        identityVerified: boolean;
    };
    basic_info: {
        title: string;
        description: string;
        price: number;
        rooms: number;
        square_meters: number;
        type: string;
    };
    location: {
        municipality: string;
        province: string;
        autonomous_community: string;
        address?: string;
    };
    characteristics?: {
        floors?: number;
        orientation?: string;
        condition?: string;
        has_elevator?: boolean;
        is_furnished?: boolean;
    };
    energy?: {
        energy_label?: string;
        co2_emissions?: number;
    };
    tags?: string[];
    images?: Array<{
        url: string;
        is_main: boolean;
    }>;
    contact?: {
        phone?: string;
        email?: string;
    };
}

export default function PropertyDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const { data: session } = useSession();
    const router = useRouter();
    const [property, setProperty] = useState<PropertyDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);

    useEffect(() => {
        fetchProperty();
    }, [id]);

    const fetchProperty = async () => {
        try {
            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/properties/${id}`
            );
            if (response.ok) {
                const data = await response.json();
                setProperty(data);
            } else {
                console.error("Property not found");
            }
        } catch (error) {
            console.error("Error fetching property:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleContact = () => {
        if (!session) {
            router.push("/auth/signin");
            return;
        }
        // TODO: Implement contact functionality
        alert("Funcionalitat de contacte en desenvolupament");
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (!property) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-gray-900 mb-4">Immoble no trobat</h1>
                    <Link href="/properties" className="text-blue-600 hover:underline">
                        Tornar al llistat
                    </Link>
                </div>
            </div>
        );
    }

    const images = property.images || [];
    const currentImage = images[currentImageIndex];

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Back Button */}
            <div className="bg-white border-b">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <Link
                        href="/properties"
                        className="text-blue-600 hover:text-blue-700 font-medium flex items-center gap-2"
                    >
                        ← Tornar al llistat
                    </Link>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Image Gallery */}
                        <div className="bg-white rounded-xl shadow-md overflow-hidden">
                            <div className="relative h-96 bg-gray-200">
                                {currentImage ? (
                                    <img
                                        src={currentImage.url}
                                        alt={property.basic_info.title}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                                        <svg
                                            className="w-24 h-24"
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
                                {images.length > 1 && (
                                    <>
                                        <button
                                            onClick={() =>
                                                setCurrentImageIndex((prev) =>
                                                    prev === 0 ? images.length - 1 : prev - 1
                                                )
                                            }
                                            className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white p-2 rounded-full shadow-lg"
                                        >
                                            ←
                                        </button>
                                        <button
                                            onClick={() =>
                                                setCurrentImageIndex((prev) =>
                                                    prev === images.length - 1 ? 0 : prev + 1
                                                )
                                            }
                                            className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white p-2 rounded-full shadow-lg"
                                        >
                                            →
                                        </button>
                                    </>
                                )}
                            </div>
                            {images.length > 1 && (
                                <div className="flex gap-2 p-4 overflow-x-auto">
                                    {images.map((img, idx) => (
                                        <button
                                            key={idx}
                                            onClick={() => setCurrentImageIndex(idx)}
                                            className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 ${idx === currentImageIndex
                                                    ? "border-blue-600"
                                                    : "border-gray-200"
                                                }`}
                                        >
                                            <img
                                                src={img.url}
                                                alt={`Imatge ${idx + 1}`}
                                                className="w-full h-full object-cover"
                                            />
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Property Info */}
                        <div className="bg-white rounded-xl shadow-md p-6">
                            <h1 className="text-3xl font-bold text-gray-900 mb-2">
                                {property.basic_info.title}
                            </h1>
                            <p className="text-gray-600 mb-4">
                                {property.location.municipality}, {property.location.province}
                            </p>

                            <div className="flex items-center gap-6 mb-6 pb-6 border-b">
                                <div>
                                    <span className="text-3xl font-bold text-blue-600">
                                        {property.basic_info.price.toLocaleString("ca-ES")}€
                                    </span>
                                </div>
                                <div className="flex gap-4 text-gray-600">
                                    <span>🛏️ {property.basic_info.rooms} habitacions</span>
                                    <span>📐 {property.basic_info.square_meters} m²</span>
                                </div>
                            </div>

                            <div>
                                <h2 className="text-xl font-bold text-gray-900 mb-3">Descripció</h2>
                                <p className="text-gray-700 whitespace-pre-line">
                                    {property.basic_info.description}
                                </p>
                            </div>
                        </div>

                        {/* Characteristics */}
                        {property.characteristics && (
                            <div className="bg-white rounded-xl shadow-md p-6">
                                <h2 className="text-xl font-bold text-gray-900 mb-4">
                                    Característiques
                                </h2>
                                <div className="grid grid-cols-2 gap-4">
                                    {property.characteristics.floors && (
                                        <div className="flex items-center gap-2">
                                            <span className="text-gray-600">Plantes:</span>
                                            <span className="font-semibold">
                                                {property.characteristics.floors}
                                            </span>
                                        </div>
                                    )}
                                    {property.characteristics.orientation && (
                                        <div className="flex items-center gap-2">
                                            <span className="text-gray-600">Orientació:</span>
                                            <span className="font-semibold">
                                                {property.characteristics.orientation}
                                            </span>
                                        </div>
                                    )}
                                    {property.characteristics.condition && (
                                        <div className="flex items-center gap-2">
                                            <span className="text-gray-600">Estat:</span>
                                            <span className="font-semibold">
                                                {property.characteristics.condition}
                                            </span>
                                        </div>
                                    )}
                                    {property.characteristics.has_elevator !== undefined && (
                                        <div className="flex items-center gap-2">
                                            <span className="text-gray-600">Ascensor:</span>
                                            <span className="font-semibold">
                                                {property.characteristics.has_elevator ? "Sí" : "No"}
                                            </span>
                                        </div>
                                    )}
                                    {property.characteristics.is_furnished !== undefined && (
                                        <div className="flex items-center gap-2">
                                            <span className="text-gray-600">Amoblat:</span>
                                            <span className="font-semibold">
                                                {property.characteristics.is_furnished ? "Sí" : "No"}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Tags */}
                        {property.tags && property.tags.length > 0 && (
                            <div className="bg-white rounded-xl shadow-md p-6">
                                <h2 className="text-xl font-bold text-gray-900 mb-4">Etiquetes</h2>
                                <div className="flex flex-wrap gap-2">
                                    {property.tags.map((tag, idx) => (
                                        <span
                                            key={idx}
                                            className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium"
                                        >
                                            {tag}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Sidebar */}
                    <div className="lg:col-span-1">
                        <div className="bg-white rounded-xl shadow-md p-6 sticky top-4">
                            <h2 className="text-xl font-bold text-gray-900 mb-4">Contacta</h2>

                            {session ? (
                                <>
                                    <div className="mb-4">
                                        <p className="text-sm text-gray-600 mb-2">Propietari:</p>
                                        <p className="font-semibold">{property.owner.name}</p>
                                        {property.owner.identityVerified && (
                                            <span className="inline-flex items-center gap-1 text-sm text-green-600 mt-1">
                                                ✓ Identitat verificada
                                            </span>
                                        )}
                                    </div>

                                    <button
                                        onClick={handleContact}
                                        className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition"
                                    >
                                        Contactar
                                    </button>
                                </>
                            ) : (
                                <div className="text-center">
                                    <p className="text-gray-600 mb-4">
                                        Inicia sessió per contactar amb el propietari
                                    </p>
                                    <Link
                                        href="/auth/signin"
                                        className="block w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition"
                                    >
                                        Iniciar Sessió
                                    </Link>
                                </div>
                            )}

                            {property.energy && (
                                <div className="mt-6 pt-6 border-t">
                                    <h3 className="font-semibold text-gray-900 mb-3">
                                        Eficiència Energètica
                                    </h3>
                                    {property.energy.energy_label && (
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className="text-gray-600">Etiqueta:</span>
                                            <span className="font-bold text-lg">
                                                {property.energy.energy_label}
                                            </span>
                                        </div>
                                    )}
                                    {property.energy.co2_emissions && (
                                        <div className="text-sm text-gray-600">
                                            Emissions: {property.energy.co2_emissions} kg CO₂/m²/any
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
