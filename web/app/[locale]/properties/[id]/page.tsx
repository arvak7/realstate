"use client";

import { useState, useEffect, use } from "react";
import dynamic from "next/dynamic";
import { useSession } from "next-auth/react";
import { useRouter, Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";

// Dynamic import for Leaflet (SSR not supported)
const PrivacyCircleMap = dynamic(
    () => import("@/app/components/PrivacyCircleMap/PrivacyCircleMap"),
    { ssr: false, loading: () => <div className="h-[300px] bg-gray-100 animate-pulse rounded-lg" /> }
);

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
        address?: string;
        privacyCircle?: {
            centerLat: number;
            centerLon: number;
            radius: number;
        };
        isApproximate?: boolean;
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

export default function PropertyDetailPage({ params }: { params: Promise<{ id: string; locale: string }> }) {
    const { id } = use(params);
    const { data: session } = useSession();
    const router = useRouter();
    const [property, setProperty] = useState<PropertyDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const t = useTranslations("propertyDetail");
    const tCommon = useTranslations("common");
    const tNav = useTranslations("nav");

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
        alert(t("contactInDevelopment"));
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-white">
                <Navbar />
                <div className="max-w-7xl mx-auto px-6 lg:px-8 py-20">
                    <div className="animate-pulse">
                        <div className="h-8 bg-neutral-warm rounded w-48 mb-4"></div>
                        <div className="aspect-[16/9] bg-neutral-warm rounded-2xl mb-8"></div>
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            <div className="lg:col-span-2 space-y-4">
                                <div className="h-10 bg-neutral-warm rounded w-3/4"></div>
                                <div className="h-6 bg-neutral-warm rounded w-1/2"></div>
                                <div className="h-32 bg-neutral-warm rounded"></div>
                            </div>
                        </div>
                    </div>
                </div>
                <Footer />
            </div>
        );
    }

    if (!property) {
        return (
            <div className="min-h-screen bg-white">
                <Navbar />
                <div className="max-w-4xl mx-auto px-6 lg:px-8 py-20 text-center">
                    <h1 className="text-4xl text-kindred-dark mb-4">{t("notFound")}</h1>
                    <p className="text-kindred-gray mb-8">
                        {t("notFoundHint")}
                    </p>
                    <Link href="/properties" className="btn-primary">
                        {t("backToList")}
                    </Link>
                </div>
                <Footer />
            </div>
        );
    }

    const images = property.images || [];
    const currentImage = images[currentImageIndex];

    return (
        <div className="min-h-screen bg-white">
            <Navbar />

            {/* Back Navigation */}
            <div className="bg-white border-b border-gray-100">
                <div className="max-w-7xl mx-auto px-6 lg:px-8 py-4">
                    <Link
                        href="/properties"
                        className="inline-flex items-center gap-2 text-kindred-gray hover:text-kindred-dark transition-colors"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                        {t("backToList")}
                    </Link>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 lg:px-8 py-10">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-8">
                        {/* Image Gallery */}
                        <div className="relative">
                            <div className="aspect-[16/10] rounded-2xl overflow-hidden bg-neutral-warm">
                                {currentImage ? (
                                    <img
                                        src={currentImage.url}
                                        alt={property.basic_info.title}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <img
                                        src="https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1200&h=750&fit=crop"
                                        alt="Placeholder"
                                        className="w-full h-full object-cover"
                                    />
                                )}
                            </div>

                            {images.length > 1 && (
                                <>
                                    <button
                                        onClick={() =>
                                            setCurrentImageIndex((prev) =>
                                                prev === 0 ? images.length - 1 : prev - 1
                                            )
                                        }
                                        className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white p-3 rounded-full shadow-soft transition-all"
                                    >
                                        <svg className="w-5 h-5 text-kindred-dark" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                        </svg>
                                    </button>
                                    <button
                                        onClick={() =>
                                            setCurrentImageIndex((prev) =>
                                                prev === images.length - 1 ? 0 : prev + 1
                                            )
                                        }
                                        className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white p-3 rounded-full shadow-soft transition-all"
                                    >
                                        <svg className="w-5 h-5 text-kindred-dark" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                        </svg>
                                    </button>
                                    <div className="absolute bottom-4 right-4 bg-white/90 px-3 py-1.5 rounded-pill text-sm font-medium text-kindred-dark">
                                        {currentImageIndex + 1} / {images.length}
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Thumbnails */}
                        {images.length > 1 && (
                            <div className="flex gap-3 overflow-x-auto pb-2">
                                {images.map((img, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => setCurrentImageIndex(idx)}
                                        className={`flex-shrink-0 w-24 h-16 rounded-xl overflow-hidden transition-all ${
                                            idx === currentImageIndex
                                                ? "ring-2 ring-kindred-dark ring-offset-2"
                                                : "opacity-60 hover:opacity-100"
                                        }`}
                                    >
                                        <img
                                            src={img.url}
                                            alt={t("imageAlt", { number: idx + 1 })}
                                            className="w-full h-full object-cover"
                                        />
                                    </button>
                                ))}
                            </div>
                        )}

                        {/* Property Info */}
                        <div>
                            <h1 className="text-3xl md:text-4xl text-kindred-dark mb-3">
                                {property.basic_info.title}
                            </h1>
                            {property.location?.address && (
                                <p className="text-kindred-gray text-lg mb-6">
                                    {property.location.address}
                                </p>
                            )}

                            <div className="flex flex-wrap items-center gap-6 pb-8 border-b border-gray-100">
                                <span className="text-3xl font-semibold text-kindred-dark">
                                    €{property.basic_info.price.toLocaleString("ca-ES")}
                                </span>
                                <div className="flex gap-4 text-kindred-gray">
                                    <span>{t("bedroomsCount", { count: property.basic_info.rooms })}</span>
                                    <span className="text-gray-300">·</span>
                                    <span>{property.basic_info.square_meters} {tCommon("squareMeters")}</span>
                                </div>
                            </div>
                        </div>

                        {/* Description */}
                        <div>
                            <h2 className="text-xl font-semibold text-kindred-dark mb-4">{t("description")}</h2>
                            <p className="text-kindred-gray leading-relaxed whitespace-pre-line">
                                {property.basic_info.description}
                            </p>
                        </div>

                        {/* Location Map */}
                        {property.location?.privacyCircle && (
                            <div className="pt-8 border-t border-gray-100">
                                <h2 className="text-xl font-semibold text-kindred-dark mb-4">
                                    {t("location")}
                                </h2>
                                {property.location.isApproximate && (
                                    <p className="text-sm text-kindred-gray mb-4 flex items-center gap-2">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        {t("approximateLocation")}
                                    </p>
                                )}
                                {property.location.address && (
                                    <p className="text-kindred-gray mb-4">{property.location.address}</p>
                                )}
                                <PrivacyCircleMap
                                    centerLat={property.location.privacyCircle.centerLat}
                                    centerLon={property.location.privacyCircle.centerLon}
                                    radius={property.location.privacyCircle.radius}
                                    height="350px"
                                />
                            </div>
                        )}

                        {/* Characteristics */}
                        {property.characteristics && (
                            <div className="pt-8 border-t border-gray-100">
                                <h2 className="text-xl font-semibold text-kindred-dark mb-6">{t("characteristics")}</h2>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                                    {property.characteristics.floors && (
                                        <div>
                                            <p className="text-kindred-gray text-sm mb-1">{t("floors")}</p>
                                            <p className="font-semibold text-kindred-dark">{property.characteristics.floors}</p>
                                        </div>
                                    )}
                                    {property.characteristics.orientation && (
                                        <div>
                                            <p className="text-kindred-gray text-sm mb-1">{t("orientation")}</p>
                                            <p className="font-semibold text-kindred-dark">{property.characteristics.orientation}</p>
                                        </div>
                                    )}
                                    {property.characteristics.condition && (
                                        <div>
                                            <p className="text-kindred-gray text-sm mb-1">{t("condition")}</p>
                                            <p className="font-semibold text-kindred-dark">{property.characteristics.condition}</p>
                                        </div>
                                    )}
                                    {property.characteristics.has_elevator !== undefined && (
                                        <div>
                                            <p className="text-kindred-gray text-sm mb-1">{t("elevator")}</p>
                                            <p className="font-semibold text-kindred-dark">{property.characteristics.has_elevator ? tCommon("yes") : tCommon("no")}</p>
                                        </div>
                                    )}
                                    {property.characteristics.is_furnished !== undefined && (
                                        <div>
                                            <p className="text-kindred-gray text-sm mb-1">{t("furnished")}</p>
                                            <p className="font-semibold text-kindred-dark">{property.characteristics.is_furnished ? tCommon("yes") : tCommon("no")}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Tags */}
                        {property.tags && property.tags.length > 0 && (
                            <div className="pt-8 border-t border-gray-100">
                                <h2 className="text-xl font-semibold text-kindred-dark mb-4">{t("tags")}</h2>
                                <div className="flex flex-wrap gap-2">
                                    {property.tags.map((tag, idx) => (
                                        <span
                                            key={idx}
                                            className="location-pill"
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
                        <div className="bg-neutral-warm/50 rounded-2xl p-6 sticky top-6">
                            <h2 className="text-lg font-semibold text-kindred-dark mb-6">{t("contact")}</h2>

                            {session ? (
                                <>
                                    <div className="mb-6">
                                        <p className="text-kindred-gray text-sm mb-2">{t("owner")}</p>
                                        <p className="font-semibold text-kindred-dark">{property.owner.name}</p>
                                        {property.owner.identityVerified && (
                                            <span className="inline-flex items-center gap-1.5 text-sm text-green-600 mt-2">
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                </svg>
                                                {t("identityVerified")}
                                            </span>
                                        )}
                                    </div>

                                    <button
                                        onClick={handleContact}
                                        className="w-full btn-primary justify-center"
                                    >
                                        {t("contactButton")}
                                    </button>
                                </>
                            ) : (
                                <div>
                                    <p className="text-kindred-gray mb-6">
                                        {t("loginToContact")}
                                    </p>
                                    <Link
                                        href="/auth/signin"
                                        className="w-full btn-primary justify-center block text-center"
                                    >
                                        {tNav("signIn")}
                                    </Link>
                                </div>
                            )}

                            {property.energy && (
                                <div className="mt-8 pt-6 border-t border-gray-200">
                                    <h3 className="font-semibold text-kindred-dark mb-4">
                                        {t("energyEfficiency")}
                                    </h3>
                                    {property.energy.energy_label && (
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className="text-kindred-gray text-sm">{t("energyLabel")}</span>
                                            <span className="font-bold text-lg text-kindred-dark">
                                                {property.energy.energy_label}
                                            </span>
                                        </div>
                                    )}
                                    {property.energy.co2_emissions && (
                                        <p className="text-sm text-kindred-gray">
                                            {t("emissions", { value: property.energy.co2_emissions })}
                                        </p>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <Footer />
        </div>
    );
}
