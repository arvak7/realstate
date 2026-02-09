"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { Link, useRouter } from "@/i18n/navigation";
import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

// Dynamic imports for maps (SSR not supported)
const PropertyListMap = dynamic(
    () => import("@/app/components/PrivacyCircleMap/PropertyListMap"),
    { ssr: false, loading: () => <div className="h-[500px] bg-gray-100 animate-pulse rounded-lg" /> }
);

const PrivacyCircleMap = dynamic(
    () => import("@/app/components/PrivacyCircleMap/PrivacyCircleMap"),
    { ssr: false, loading: () => <div className="h-[300px] bg-gray-100 animate-pulse rounded-lg" /> }
);

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
        address?: string;
        privacyCircle?: {
            centerLat: number;
            centerLon: number;
            radius: number;
        };
    };
    images: Array<{
        url: string;
        is_main: boolean;
    }>;
}

export default function PropertiesPage() {
    const { data: session } = useSession();
    const router = useRouter();
    const [properties, setProperties] = useState<Property[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [minPrice, setMinPrice] = useState("");
    const [maxPrice, setMaxPrice] = useState("");
    const [rooms, setRooms] = useState("");
    const [viewMode, setViewMode] = useState<'grid' | 'map'>('grid');
    const [locationPopup, setLocationPopup] = useState<Property | null>(null);
    const t = useTranslations("properties");
    const tCommon = useTranslations("common");
    const tDetail = useTranslations("propertyDetail");

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
                                {t("title")}
                            </h1>
                            <p className="text-kindred-gray text-lg">
                                {t("subtitle")}
                            </p>
                        </div>
                        {session && (
                            <Link
                                href="/properties/new"
                                className="btn-primary self-start"
                            >
                                {t("publishButton")}
                            </Link>
                        )}
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-neutral-warm/50 border-b border-gray-100">
                <div className="max-w-7xl mx-auto px-6 lg:px-8 py-6">
                    <form onSubmit={handleSearch} className="flex flex-wrap gap-4 items-center">
                        <div className="flex-1 min-w-[200px]">
                            <input
                                type="text"
                                placeholder={t("searchPlaceholder")}
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-kindred-dark/20 focus:border-kindred-dark outline-none transition-all"
                            />
                        </div>
                        <input
                            type="number"
                            placeholder={t("minPrice")}
                            value={minPrice}
                            onChange={(e) => setMinPrice(e.target.value)}
                            className="w-32 px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-kindred-dark/20 focus:border-kindred-dark outline-none transition-all"
                        />
                        <input
                            type="number"
                            placeholder={t("maxPrice")}
                            value={maxPrice}
                            onChange={(e) => setMaxPrice(e.target.value)}
                            className="w-32 px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-kindred-dark/20 focus:border-kindred-dark outline-none transition-all"
                        />
                        <select
                            value={rooms}
                            onChange={(e) => setRooms(e.target.value)}
                            className="w-36 px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-kindred-dark/20 focus:border-kindred-dark outline-none transition-all"
                        >
                            <option value="">{t("rooms")}</option>
                            {[1, 2, 3, 4, 5].map((num) => (
                                <option key={num} value={num}>
                                    {num}{num === 5 ? '+' : ''} {tCommon("rooms")}
                                </option>
                            ))}
                        </select>
                        <button
                            type="submit"
                            className="btn-primary"
                        >
                            {t("searchButton")}
                        </button>

                        {/* View Mode Toggle */}
                        <div className="flex rounded-xl overflow-hidden border border-gray-200 bg-white">
                            <button
                                type="button"
                                onClick={() => setViewMode('grid')}
                                className={`px-4 py-3 flex items-center gap-2 transition-colors ${
                                    viewMode === 'grid'
                                        ? 'bg-kindred-dark text-white'
                                        : 'text-kindred-gray hover:bg-gray-50'
                                }`}
                                title={t("gridView")}
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                                </svg>
                            </button>
                            <button
                                type="button"
                                onClick={() => setViewMode('map')}
                                className={`px-4 py-3 flex items-center gap-2 transition-colors ${
                                    viewMode === 'map'
                                        ? 'bg-kindred-dark text-white'
                                        : 'text-kindred-gray hover:bg-gray-50'
                                }`}
                                title={t("mapView")}
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                                </svg>
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            {/* Properties Grid/Map */}
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
                            {t("noResults")}
                        </h3>
                        <p className="text-kindred-gray mb-8">
                            {t("noResultsHint")}
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
                            {t("clearFilters")}
                        </button>
                    </div>
                ) : (
                    <>
                        <p className="text-kindred-gray mb-8">
                            {properties.length} {properties.length === 1 ? t("resultsCount", { count: 1 }) : t("resultsCount", { count: properties.length })}
                        </p>

                        {viewMode === 'map' ? (
                            <PropertyListMap
                                properties={properties
                                    .filter(p => p.location?.privacyCircle)
                                    .map(p => ({
                                        id: p.id,
                                        centerLat: p.location.privacyCircle!.centerLat,
                                        centerLon: p.location.privacyCircle!.centerLon,
                                        radius: p.location.privacyCircle!.radius,
                                        title: p.basic_info?.title,
                                        price: p.basic_info?.price
                                    }))}
                                height="600px"
                                onPropertyClick={(id) => router.push(`/properties/${id}`)}
                            />
                        ) : (
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
                                                        alt={property.basic_info?.title || t("noTitle")}
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
                                                {property.basic_info?.title || t("noTitle")}
                                            </h3>
                                            <div className="flex items-center gap-4 text-kindred-gray text-sm">
                                                {property.basic_info?.rooms != null && (
                                                    <span className="flex items-center gap-1.5" title={tCommon("rooms")}>
                                                        <svg className="w-[18px] h-[18px] flex-shrink-0 text-kindred-gray/70" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                                            <path d="M3 21V7a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v14" />
                                                            <path d="M3 15h18" />
                                                            <path d="M3 15v-4a2 2 0 0 1 2-2h4v6" />
                                                            <path d="M9 9h6a2 2 0 0 1 2 2v4" />
                                                        </svg>
                                                        {property.basic_info.rooms} {tCommon("rooms")}
                                                    </span>
                                                )}
                                                {property.basic_info?.square_meters != null && (
                                                    <span className="flex items-center gap-1.5" title={tCommon("squareMeters")}>
                                                        <svg className="w-[18px] h-[18px] flex-shrink-0 text-kindred-gray/70" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                                            <rect x="3" y="3" width="18" height="18" rx="2" />
                                                            <path d="M3 9h18" />
                                                            <path d="M9 3v18" />
                                                        </svg>
                                                        {property.basic_info.square_meters} {tCommon("squareMeters")}
                                                    </span>
                                                )}
                                                {property.location?.privacyCircle && (
                                                    <button
                                                        onClick={(e) => {
                                                            e.preventDefault();
                                                            e.stopPropagation();
                                                            setLocationPopup(property);
                                                        }}
                                                        className="flex items-center gap-1.5 hover:text-kindred-dark transition-colors cursor-pointer"
                                                        title={t("seeLocation")}
                                                    >
                                                        <svg className="w-[18px] h-[18px] flex-shrink-0 text-blue-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                                            <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
                                                            <circle cx="12" cy="10" r="3" />
                                                        </svg>
                                                        <span className="underline decoration-dotted underline-offset-2">{t("seeLocation")}</span>
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </>
                )}
            </div>

            <Footer />

            {/* Location popup modal */}
            {locationPopup && locationPopup.location?.privacyCircle && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
                    onClick={() => setLocationPopup(null)}
                >
                    <div
                        className="bg-white rounded-2xl max-w-lg w-full overflow-hidden shadow-xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="p-6">
                            {/* Header */}
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-semibold text-kindred-dark">
                                    {tDetail("location")}
                                </h3>
                                <button
                                    onClick={() => setLocationPopup(null)}
                                    className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors text-kindred-gray"
                                    aria-label={t("close")}
                                >
                                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M18 6 6 18" />
                                        <path d="m6 6 12 12" />
                                    </svg>
                                </button>
                            </div>

                            {/* Address */}
                            {locationPopup.location?.address && (
                                <div className="flex items-center gap-2 mb-4 px-3 py-2 bg-neutral-warm rounded-xl">
                                    <svg className="w-5 h-5 flex-shrink-0 text-blue-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
                                        <circle cx="12" cy="10" r="3" />
                                    </svg>
                                    <p className="text-kindred-dark text-sm font-medium">
                                        {locationPopup.location.address}
                                    </p>
                                </div>
                            )}

                            {/* Map */}
                            <div className="rounded-xl overflow-hidden">
                                <PrivacyCircleMap
                                    centerLat={locationPopup.location.privacyCircle!.centerLat}
                                    centerLon={locationPopup.location.privacyCircle!.centerLon}
                                    radius={locationPopup.location.privacyCircle!.radius}
                                    height="300px"
                                />
                            </div>

                            {/* Approximate location note */}
                            <div className="flex items-start gap-2 mt-3 px-1">
                                <svg className="w-4 h-4 flex-shrink-0 text-kindred-gray/50 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="12" cy="12" r="10" />
                                    <path d="M12 16v-4" />
                                    <path d="M12 8h.01" />
                                </svg>
                                <p className="text-xs text-kindred-gray/70 italic">
                                    {tDetail("approximateLocation")}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
