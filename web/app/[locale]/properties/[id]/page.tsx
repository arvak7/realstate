"use client";

import { useState, useEffect, use } from "react";
import dynamic from "next/dynamic";
import { useSession, signIn } from "next-auth/react";
import { useRouter, Link } from "@/i18n/navigation";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import Footer from "../../components/Footer";
import GhostImageOverlay from "@/app/components/privacy/GhostImageOverlay";
import PrivatePropertyBadge from "@/app/components/privacy/PrivatePropertyBadge";
import RequirementsModal from "@/app/components/privacy/RequirementsModal";

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
        mobile?: string;
        landline?: string;
        email?: string;
    };
    accessRequirements?: {
        clauses: string[];
    };
    photoAccess?: {
        granted: boolean;
        requiredClauses?: string[];
    };
}

export default function PropertyDetailPage({ params }: { params: Promise<{ id: string; locale: string }> }) {
    const { id } = use(params);
    const { data: session } = useSession();
    const router = useRouter();
    const pathname = usePathname();
    const [property, setProperty] = useState<PropertyDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [showRequirementsModal, setShowRequirementsModal] = useState(false);
    const [requirementsInfoMode, setRequirementsInfoMode] = useState(false);
    const [brokenImages, setBrokenImages] = useState<Set<number>>(new Set());
    const t = useTranslations("propertyDetail");
    const tCommon = useTranslations("common");
    const tNav = useTranslations("nav");
    const tPrivate = useTranslations("privatePhotos");
    const tServices = useTranslations("services");

    useEffect(() => {
        fetchProperty();
    }, [id, session]);

    const fetchProperty = async () => {
        try {
            const headers: Record<string, string> = {};
            const token = (session as any)?.accessToken;
            if (token) headers["Authorization"] = `Bearer ${token}`;

            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/properties/${id}`,
                { headers }
            );
            if (response.ok) {
                const data = await response.json();
                setProperty(data);
                setBrokenImages(new Set());
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
            signIn("zitadel", { callbackUrl: pathname });
            return;
        }
        alert(t("contactInDevelopment"));
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-white">
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
    const isOwner = session?.user?.email === property.owner.email;
    const showGhost = property.isPrivate && !isOwner && !property.photoAccess?.granted;

    return (
        <div className="min-h-screen bg-white">

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
                        {/* Image Gallery / Ghost Mode */}
                        {showGhost ? (
                            <GhostImageOverlay
                                totalImages={images.length}
                                isMainSlot={true}
                                onClick={() => {
                                    if (session) {
                                        setRequirementsInfoMode(false);
                                        setShowRequirementsModal(true);
                                    }
                                }}
                            />
                        ) : (
                            <>
                                <div className="relative">
                                    <div className="aspect-[16/10] rounded-2xl overflow-hidden bg-neutral-warm">
                                        {currentImage?.url && !brokenImages.has(currentImageIndex) ? (
                                            <img
                                                src={currentImage.url}
                                                alt={property.basic_info.title}
                                                className="w-full h-full object-cover"
                                                onError={() => setBrokenImages(prev => new Set(prev).add(currentImageIndex))}
                                            />
                                        ) : (
                                            <div className="w-full h-full flex flex-col items-center justify-center gap-3 bg-neutral-warm text-text-secondary">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="w-14 h-14 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3 3l18 18M9 9.75h.008v.008H9V9.75z" />
                                                </svg>
                                                <span className="text-sm opacity-50">{t("noImages")}</span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Private badge for owner or granted access */}
                                    {property.isPrivate && !showGhost && (
                                        <PrivatePropertyBadge variant="overlay" />
                                    )}

                                    {/* Badge: private property with granted access */}
                                    {property.isPrivate && !isOwner && property.photoAccess?.granted && (
                                        <button
                                            onClick={() => { setRequirementsInfoMode(true); setShowRequirementsModal(true); }}
                                            className="absolute top-4 right-4 bg-emerald-500/90 backdrop-blur-sm text-white px-3 py-1.5 rounded-full text-sm font-medium inline-flex items-center gap-2 shadow-sm hover:bg-emerald-600/90 transition-colors z-10"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-4 h-4" aria-hidden="true">
                                                <path d="M11 5a3 3 0 1 1-6 0v.5H4a2 2 0 0 0-2 2V12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V7.5a2 2 0 0 0-2-2h-1V5Zm-5 0a1 1 0 1 1 2 0v.5H6V5Z" />
                                            </svg>
                                            {tPrivate("accessGranted")}
                                        </button>
                                    )}

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
                                                {brokenImages.has(idx) ? (
                                                    <div className="w-full h-full bg-neutral-warm flex items-center justify-center">
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3 3l18 18" />
                                                        </svg>
                                                    </div>
                                                ) : (
                                                    <img
                                                        src={img.url}
                                                        alt={t("imageAlt", { number: idx + 1 })}
                                                        className="w-full h-full object-cover"
                                                        onError={() => setBrokenImages(prev => new Set(prev).add(idx))}
                                                    />
                                                )}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </>
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

                        {/* Services */}
                        <div className="pt-8 border-t border-gray-100">
                            <h2 className="text-xl font-semibold text-kindred-dark mb-4">
                                {tServices("availableServices")}
                            </h2>
                            <div className="rounded-2xl overflow-hidden border border-slate-200 shadow-sm">
                                {/* Header */}
                                <div className="bg-gradient-to-r from-slate-800 to-slate-700 px-5 py-4 flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center flex-shrink-0">
                                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                                        </svg>
                                    </div>
                                    <div>
                                        <p className="font-semibold text-white text-sm">
                                            {tServices("professionalPhotos.name")}
                                        </p>
                                        <p className="text-xs text-slate-300 mt-0.5">
                                            {tServices("professionalPhotos.description")}
                                        </p>
                                    </div>
                                </div>
                                {/* Contact info — tap to call */}
                                <div className="bg-white px-5 py-4 flex flex-wrap gap-3">
                                    <a href="tel:+34612345678" className="flex items-center gap-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl px-4 py-3 transition-colors group">
                                        <div className="w-8 h-8 rounded-lg bg-slate-800 group-hover:bg-slate-700 flex items-center justify-center flex-shrink-0 transition-colors">
                                            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                            </svg>
                                        </div>
                                        <div>
                                            <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wide leading-none mb-0.5">{tServices("fields.mobile")}</p>
                                            <p className="text-sm font-semibold text-slate-800 tracking-wide">+34 612 345 678</p>
                                        </div>
                                    </a>
                                    <a href="tel:+34934567890" className="flex items-center gap-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl px-4 py-3 transition-colors group">
                                        <div className="w-8 h-8 rounded-lg bg-slate-800 group-hover:bg-slate-700 flex items-center justify-center flex-shrink-0 transition-colors">
                                            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                            </svg>
                                        </div>
                                        <div>
                                            <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wide leading-none mb-0.5">{tServices("fields.landline")}</p>
                                            <p className="text-sm font-semibold text-slate-800 tracking-wide">+34 934 567 890</p>
                                        </div>
                                    </a>
                                </div>
                            </div>
                        </div>
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
                                    <button
                                        onClick={() => signIn("zitadel", { callbackUrl: pathname })}
                                        className="w-full btn-primary justify-center"
                                    >
                                        {tNav("signIn")}
                                    </button>
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

            {showRequirementsModal && property && (
                <RequirementsModal
                    propertyId={property.id}
                    requiredClauses={property.accessRequirements?.clauses || property.photoAccess?.requiredClauses || []}
                    onClose={() => { setShowRequirementsModal(false); setRequirementsInfoMode(false); }}
                    onAccessGranted={(images) => {
                        // Update property images in state
                        setProperty(prev => prev ? { ...prev, images, photoAccess: { granted: true } } : prev);
                    }}
                    infoMode={requirementsInfoMode}
                />
            )}

            <Footer />
        </div>
    );
}
