"use client";

import { useState } from "react";
import { useSession, signIn } from "next-auth/react";
import { useRouter } from "@/i18n/navigation";
import { usePathname } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import ImageUploader, { UploadedImage } from "@/app/[locale]/components/ImageUploader";
import { useCatalogs } from "@/app/hooks/useCatalogs";
import LocationPicker, { LocationData } from "@/app/components/LocationPicker";
import ClauseSelectorPopup from "@/app/components/privacy/ClauseSelectorPopup";

export default function NewPropertyPage() {
    const { data: session } = useSession();
    const router = useRouter();
    const pathname = usePathname();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const t = useTranslations("newProperty");
    const tNav = useTranslations("nav");
    const tServices = useTranslations("services");
    const locale = useLocale();
    const catalogs = useCatalogs();
    const [formData, setFormData] = useState({
        title: "",
        description: "",
        price: "",
        rooms: "",
        square_meters: "",
        type: "",
        floors: "",
        orientation: "",
        condition: "",
        has_elevator: false,
        is_furnished: false,
        energy_label: "",
        tags: [] as string[],
        isPrivate: false,
    });
    const [showClauseSelector, setShowClauseSelector] = useState(false);
    const [selectedClauses, setSelectedClauses] = useState<string[]>([]);
    const [location, setLocation] = useState<LocationData | null>(null);
    const [images, setImages] = useState<UploadedImage[]>([]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        if (!location) {
            setError(t("location.requiredError") || "Ubicació requerida");
            return;
        }

        setLoading(true);

        try {
            const propertyData = {
                basic_info: {
                    title: formData.title,
                    description: formData.description,
                    price: parseFloat(formData.price),
                    rooms: parseInt(formData.rooms),
                    square_meters: parseFloat(formData.square_meters),
                    type: formData.type,
                },
                location: {
                    latitude: location.latitude,
                    longitude: location.longitude,
                    address: location.address,
                    privacyRadius: location.privacyRadius,
                },
                characteristics: {
                    floors: formData.floors ? parseInt(formData.floors) : undefined,
                    orientation: formData.orientation || undefined,
                    condition: formData.condition,
                    has_elevator: formData.has_elevator,
                    is_furnished: formData.is_furnished,
                },
                energy: {
                    energy_label: formData.energy_label || undefined,
                },
                tags: formData.tags,
                images: images,
                contact: {},
                isPrivate: formData.isPrivate,
                accessRequirements: formData.isPrivate
                    ? { clauses: selectedClauses }
                    : null,
                services: [],
            };

            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/properties`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${session?.accessToken}`,
                },
                body: JSON.stringify(propertyData),
            });

            if (response.ok) {
                const property = await response.json();
                router.push(`/properties/${property.id}`);
            } else {
                setError(t("errorCreate"));
            }
        } catch (err) {
            setError(t("errorConnection"));
        } finally {
            setLoading(false);
        }
    };

    if (!session) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-neutral-cream">
                <div className="text-center">
                    <h1 className="text-2xl font-semibold text-text-primary mb-4">
                        {t("loginRequired")}
                    </h1>
                    <p className="text-text-secondary mb-6">
                        {t("loginRequiredHint")}
                    </p>
                    <button
                        onClick={() => signIn("zitadel", { callbackUrl: pathname })}
                        className="bg-primary-dark text-white px-8 py-3 rounded-full font-semibold hover:bg-primary transition-all duration-300 shadow-soft"
                    >
                        {tNav("signIn")}
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-neutral-cream py-12">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="lg:grid lg:grid-cols-3 lg:gap-8">

                    {/* LEFT: form card — col-span-2 */}
                    <div className="lg:col-span-2">
                        <div className="bg-white rounded-2xl shadow-soft-lg p-10">
                            <h1 className="text-4xl font-semibold text-text-primary mb-8 tracking-tight">
                                {t("title")}
                            </h1>

                            {error && (
                                <div className="bg-red-50 border border-red-200 text-red-700 px-5 py-4 rounded-xl mb-6">
                                    {error}
                                </div>
                            )}

                            {catalogs.error && (
                                <div className="bg-red-50 border border-red-200 text-red-700 px-5 py-4 rounded-xl mb-6">
                                    {catalogs.error}
                                </div>
                            )}

                            <form onSubmit={handleSubmit} className="space-y-6">
                                {/* Informació Bàsica */}
                                <div>
                                    <h2 className="text-2xl font-semibold text-text-primary mb-5 tracking-tight">
                                        {t("basicInfo.title")}
                                    </h2>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="md:col-span-2">
                                            <label className="block text-sm font-medium text-text-primary mb-2">
                                                {t("basicInfo.propertyTitle")} *
                                            </label>
                                            <input
                                                type="text"
                                                required
                                                value={formData.title}
                                                onChange={(e) =>
                                                    setFormData({ ...formData, title: e.target.value })
                                                }
                                                className="w-full px-4 py-3 border border-neutral-warm rounded-xl focus:ring-2 focus:ring-primary-dark focus:border-primary-dark transition-all duration-200"
                                                placeholder={t("basicInfo.propertyTitlePlaceholder")}
                                            />
                                        </div>

                                        <div className="md:col-span-2">
                                            <label className="block text-sm font-medium text-text-primary mb-2">
                                                {t("basicInfo.description")} *
                                            </label>
                                            <textarea
                                                required
                                                rows={4}
                                                value={formData.description}
                                                onChange={(e) =>
                                                    setFormData({ ...formData, description: e.target.value })
                                                }
                                                className="w-full px-4 py-3 border border-neutral-warm rounded-xl focus:ring-2 focus:ring-primary-dark focus:border-primary-dark"
                                                placeholder={t("basicInfo.descriptionPlaceholder")}
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-text-primary mb-2">
                                                {t("basicInfo.type")} *
                                            </label>
                                            <div className="relative">
                                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-text-secondary">
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                                        <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
                                                    </svg>
                                                </div>
                                                <select
                                                    required
                                                    value={formData.type}
                                                    onChange={(e) =>
                                                        setFormData({ ...formData, type: e.target.value })
                                                    }
                                                    disabled={catalogs.loading}
                                                    className="w-full pl-11 pr-4 py-3 border border-neutral-warm rounded-xl focus:ring-2 focus:ring-primary-dark focus:border-primary-dark disabled:opacity-50"
                                                >
                                                    <option value="">{t("basicInfo.select")}</option>
                                                    {catalogs.propertyTypes.map((type) => (
                                                        <option key={type.code} value={type.code}>
                                                            {type.label}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-text-primary mb-2">
                                                {t("basicInfo.price")} *
                                            </label>
                                            <div className="relative">
                                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                                    <span className="text-text-secondary font-medium">&euro;</span>
                                                </div>
                                                <input
                                                    type="number"
                                                    required
                                                    min="0"
                                                    step="1000"
                                                    value={formData.price}
                                                    onChange={(e) =>
                                                        setFormData({ ...formData, price: e.target.value })
                                                    }
                                                    className="w-full pl-10 pr-4 py-3 border border-neutral-warm rounded-xl focus:ring-2 focus:ring-primary-dark focus:border-primary-dark"
                                                    placeholder="250.000"
                                                />
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-text-primary mb-2">
                                                {t("basicInfo.rooms")} *
                                            </label>
                                            <div className="relative">
                                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-text-secondary">
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                                        <path d="M7 8a3 3 0 100-6 3 3 0 000 6zM14.5 9a2.5 2.5 0 100-5 2.5 2.5 0 000 5zM1.615 16.428a1.224 1.224 0 01-.569-1.175 6.002 6.002 0 0111.908 0c.058.467-.172.92-.57 1.174A9.953 9.953 0 017 18a9.953 9.953 0 01-5.385-1.572zM14.5 16h-.106c.07-.297.088-.611.048-.933a7.47 7.47 0 00-1.588-3.755 4.502 4.502 0 015.874 2.636.818.818 0 01-.36.98A7.465 7.465 0 0114.5 16z" />
                                                    </svg>
                                                </div>
                                                <input
                                                    type="number"
                                                    required
                                                    min="1"
                                                    value={formData.rooms}
                                                    onChange={(e) =>
                                                        setFormData({ ...formData, rooms: e.target.value })
                                                    }
                                                    className="w-full pl-11 pr-4 py-3 border border-neutral-warm rounded-xl focus:ring-2 focus:ring-primary-dark focus:border-primary-dark"
                                                    placeholder="3"
                                                />
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-text-primary mb-2">
                                                {t("basicInfo.squareMeters")} *
                                            </label>
                                            <div className="relative">
                                                <input
                                                    type="number"
                                                    required
                                                    min="1"
                                                    step="1"
                                                    value={formData.square_meters}
                                                    onChange={(e) =>
                                                        setFormData({ ...formData, square_meters: e.target.value })
                                                    }
                                                    className="w-full pl-4 pr-14 py-3 border border-neutral-warm rounded-xl focus:ring-2 focus:ring-primary-dark focus:border-primary-dark"
                                                    placeholder="85"
                                                />
                                                <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                                                    <span className="text-text-secondary font-medium">m&sup2;</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Ubicació */}
                                <div>
                                    <h2 className="text-2xl font-semibold text-text-primary mb-5 tracking-tight">{t("location.title")}</h2>
                                    <p className="text-sm text-text-secondary mb-4">
                                        {t("location.privacyHint")}
                                    </p>
                                    <LocationPicker
                                        value={location}
                                        onChange={setLocation}
                                    />
                                </div>

                                {/* Característiques */}
                                <div>
                                    <h2 className="text-2xl font-semibold text-text-primary mb-5 tracking-tight">
                                        {t("characteristics.title")}
                                    </h2>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-text-primary mb-2">
                                                {t("characteristics.floors")}
                                            </label>
                                            <div className="relative">
                                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-text-secondary">
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                                        <path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a1 1 0 110 2H4a1 1 0 110-2V4zm3 1h2v2H7V5zm2 4H7v2h2V9zm2-4h2v2h-2V5zm2 4h-2v2h2V9z" clipRule="evenodd" />
                                                    </svg>
                                                </div>
                                                <input
                                                    type="number"
                                                    min="0"
                                                    value={formData.floors}
                                                    onChange={(e) =>
                                                        setFormData({ ...formData, floors: e.target.value })
                                                    }
                                                    className="w-full pl-11 pr-4 py-3 border border-neutral-warm rounded-xl focus:ring-2 focus:ring-primary-dark focus:border-primary-dark"
                                                    placeholder="1"
                                                />
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-text-primary mb-2">
                                                {t("characteristics.orientation")}
                                            </label>
                                            <div className="relative">
                                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-text-secondary">
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                                        <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                                                    </svg>
                                                </div>
                                                <select
                                                    value={formData.orientation}
                                                    onChange={(e) =>
                                                        setFormData({ ...formData, orientation: e.target.value })
                                                    }
                                                    disabled={catalogs.loading}
                                                    className="w-full pl-11 pr-4 py-3 border border-neutral-warm rounded-xl focus:ring-2 focus:ring-primary-dark focus:border-primary-dark disabled:opacity-50"
                                                >
                                                    <option value="">{t("characteristics.select")}</option>
                                                    {catalogs.orientations.map((orientation) => (
                                                        <option key={orientation.code} value={orientation.code}>
                                                            {orientation.label}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-text-primary mb-2">
                                                {t("characteristics.condition")}
                                            </label>
                                            <div className="relative">
                                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-text-secondary">
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                                        <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                                                    </svg>
                                                </div>
                                                <select
                                                    value={formData.condition}
                                                    onChange={(e) =>
                                                        setFormData({ ...formData, condition: e.target.value })
                                                    }
                                                    disabled={catalogs.loading}
                                                    className="w-full pl-11 pr-4 py-3 border border-neutral-warm rounded-xl focus:ring-2 focus:ring-primary-dark focus:border-primary-dark disabled:opacity-50"
                                                >
                                                    <option value="">{t("characteristics.select")}</option>
                                                    {catalogs.conditions.map((condition) => (
                                                        <option key={condition.code} value={condition.code}>
                                                            {condition.label}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-text-primary mb-2">
                                                {t("characteristics.energyLabel")}
                                            </label>
                                            <div className="relative">
                                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-text-secondary">
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                                        <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
                                                    </svg>
                                                </div>
                                                <select
                                                    value={formData.energy_label}
                                                    onChange={(e) =>
                                                        setFormData({ ...formData, energy_label: e.target.value })
                                                    }
                                                    disabled={catalogs.loading}
                                                    className="w-full pl-11 pr-4 py-3 border border-neutral-warm rounded-xl focus:ring-2 focus:ring-primary-dark focus:border-primary-dark disabled:opacity-50"
                                                >
                                                    <option value="">{t("characteristics.select")}</option>
                                                    {catalogs.energyLabels.map((label) => (
                                                        <option key={label.code} value={label.code}>
                                                            {label.label}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>

                                        <div className="md:col-span-2 flex items-center gap-8 pt-2">
                                            <label className="flex items-center gap-3 cursor-pointer group">
                                                <input
                                                    type="checkbox"
                                                    checked={formData.has_elevator}
                                                    onChange={(e) =>
                                                        setFormData({
                                                            ...formData,
                                                            has_elevator: e.target.checked,
                                                        })
                                                    }
                                                    className="w-5 h-5 text-primary-dark border-neutral-warm rounded focus:ring-primary-dark"
                                                />
                                                <span className="text-sm font-medium text-text-primary group-hover:text-primary-dark transition-colors">
                                                    {t("characteristics.elevator")}
                                                </span>
                                            </label>

                                            <label className="flex items-center gap-3 cursor-pointer group">
                                                <input
                                                    type="checkbox"
                                                    checked={formData.is_furnished}
                                                    onChange={(e) =>
                                                        setFormData({
                                                            ...formData,
                                                            is_furnished: e.target.checked,
                                                        })
                                                    }
                                                    className="w-5 h-5 text-primary-dark border-neutral-warm rounded focus:ring-primary-dark"
                                                />
                                                <span className="text-sm font-medium text-text-primary group-hover:text-primary-dark transition-colors">
                                                    {t("characteristics.furnished")}
                                                </span>
                                            </label>
                                        </div>
                                    </div>
                                </div>

                                {/* Imatges */}
                                <div>
                                    <h2 className="text-2xl font-semibold text-text-primary mb-5 tracking-tight">{t("images.title")}</h2>
                                    <ImageUploader
                                        accessToken={session?.accessToken || ""}
                                        images={images}
                                        onChange={setImages}
                                    />
                                </div>

                                {/* Privacitat */}
                                <div>
                                    <h2 className="text-2xl font-semibold text-text-primary mb-5 tracking-tight">{t("privacy.title")}</h2>
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={formData.isPrivate}
                                            onChange={(e) => {
                                                const isPrivate = e.target.checked;
                                                setFormData({ ...formData, isPrivate });
                                                if (isPrivate) {
                                                    setShowClauseSelector(true);
                                                } else {
                                                    setSelectedClauses([]);
                                                }
                                            }}
                                            className="w-4 h-4 text-primary-dark border-neutral-warm rounded focus:ring-primary-dark"
                                        />
                                        <span className="text-sm font-medium text-text-primary">
                                            {t("privacy.privateProperty")}
                                        </span>
                                    </label>
                                    {formData.isPrivate && selectedClauses.length > 0 && (
                                        <div className="mt-3 p-3 bg-amber-50 rounded-xl">
                                            <p className="text-sm text-amber-800 font-medium mb-1">
                                                {selectedClauses.length} {selectedClauses.length === 1 ? 'requisit' : 'requisits'} seleccionat{selectedClauses.length !== 1 ? 's' : ''}
                                            </p>
                                            <button
                                                type="button"
                                                onClick={() => setShowClauseSelector(true)}
                                                className="text-xs text-amber-700 underline hover:text-amber-900"
                                            >
                                                Modificar requisits
                                            </button>
                                        </div>
                                    )}
                                </div>

                                {/* Submit Button */}
                                <div className="flex gap-4 pt-6 border-t">
                                    <button
                                        type="button"
                                        onClick={() => router.back()}
                                        className="flex-1 bg-neutral-warm text-text-primary py-3 rounded-xl font-semibold hover:bg-neutral-beige transition"
                                    >
                                        {t("submit.cancel")}
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="flex-1 bg-primary-dark text-white py-3 rounded-xl font-semibold hover:bg-primary transition disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {loading ? t("submit.publishing") : t("submit.publish")}
                                    </button>
                                </div>
                                {showClauseSelector && (
                                    <ClauseSelectorPopup
                                        selectedClauses={selectedClauses}
                                        onChange={setSelectedClauses}
                                        onClose={() => setShowClauseSelector(false)}
                                    />
                                )}
                            </form>
                        </div>
                    </div>

                    {/* RIGHT: sticky sidebar — col-span-1 */}
                    <div className="mt-8 lg:mt-0 lg:col-span-1 order-last lg:self-start lg:sticky lg:top-6">
                        <div className="space-y-4">
                            <h2 className="text-xl font-semibold text-text-primary tracking-tight">
                                {tServices("title")}
                            </h2>
                            <p className="text-sm text-text-secondary">
                                {tServices("subtitle")}
                            </p>
                            {/* services card */}
                            <div className="rounded-2xl overflow-hidden border border-slate-200 shadow-sm">
                                {/* Header */}
                                <div className="flex items-center gap-4 bg-gradient-to-r from-slate-800 to-slate-700 px-5 py-4">
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
                                {/* Contacte fix */}
                                <div className="bg-white px-5 py-4 flex flex-wrap gap-3">
                                    <div className="flex items-center gap-2.5 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 flex-1 min-w-[160px]">
                                        <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center flex-shrink-0">
                                            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                            </svg>
                                        </div>
                                        <div>
                                            <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wide leading-none mb-1">
                                                {tServices("fields.mobile")}
                                            </p>
                                            <p className="text-sm font-semibold text-slate-800 tracking-wide">+34 612 345 678</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2.5 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 flex-1 min-w-[160px]">
                                        <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center flex-shrink-0">
                                            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                            </svg>
                                        </div>
                                        <div>
                                            <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wide leading-none mb-1">
                                                {tServices("fields.landline")}
                                            </p>
                                            <p className="text-sm font-semibold text-slate-800 tracking-wide">+34 934 567 890</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}
