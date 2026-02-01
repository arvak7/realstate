"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "@/i18n/navigation";
import { useTranslations, useLocale } from "next-intl";
import ImageUploader, { UploadedImage } from "@/app/[locale]/components/ImageUploader";
import { useCatalogs } from "@/app/hooks/useCatalogs";
import LocationPicker, { LocationData } from "@/app/components/LocationPicker";

export default function NewPropertyPage() {
    const { data: session } = useSession();
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const t = useTranslations("newProperty");
    const tNav = useTranslations("nav");
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
            };

            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/properties`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${(session as any)?.accessToken}`,
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
                        onClick={() => router.push("/auth/signin")}
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
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
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
                                    <select
                                        required
                                        value={formData.type}
                                        onChange={(e) =>
                                            setFormData({ ...formData, type: e.target.value })
                                        }
                                        disabled={catalogs.loading}
                                        className="w-full px-4 py-3 border border-neutral-warm rounded-xl focus:ring-2 focus:ring-primary-dark focus:border-primary-dark disabled:opacity-50"
                                    >
                                        <option value="">{t("basicInfo.select")}</option>
                                        {catalogs.propertyTypes.map((type) => (
                                            <option key={type.code} value={type.code}>
                                                {type.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-text-primary mb-2">
                                        {t("basicInfo.price")} *
                                    </label>
                                    <input
                                        type="number"
                                        required
                                        min="0"
                                        step="1000"
                                        value={formData.price}
                                        onChange={(e) =>
                                            setFormData({ ...formData, price: e.target.value })
                                        }
                                        className="w-full px-4 py-3 border border-neutral-warm rounded-xl focus:ring-2 focus:ring-primary-dark focus:border-primary-dark"
                                        placeholder="250000"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-text-primary mb-2">
                                        {t("basicInfo.rooms")} *
                                    </label>
                                    <input
                                        type="number"
                                        required
                                        min="1"
                                        value={formData.rooms}
                                        onChange={(e) =>
                                            setFormData({ ...formData, rooms: e.target.value })
                                        }
                                        className="w-full px-4 py-3 border border-neutral-warm rounded-xl focus:ring-2 focus:ring-primary-dark focus:border-primary-dark"
                                        placeholder="3"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-text-primary mb-2">
                                        {t("basicInfo.squareMeters")} *
                                    </label>
                                    <input
                                        type="number"
                                        required
                                        min="1"
                                        step="0.1"
                                        value={formData.square_meters}
                                        onChange={(e) =>
                                            setFormData({ ...formData, square_meters: e.target.value })
                                        }
                                        className="w-full px-4 py-3 border border-neutral-warm rounded-xl focus:ring-2 focus:ring-primary-dark focus:border-primary-dark"
                                        placeholder="85"
                                    />
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
                                    <input
                                        type="number"
                                        min="1"
                                        value={formData.floors}
                                        onChange={(e) =>
                                            setFormData({ ...formData, floors: e.target.value })
                                        }
                                        className="w-full px-4 py-3 border border-neutral-warm rounded-xl focus:ring-2 focus:ring-primary-dark focus:border-primary-dark"
                                        placeholder="1"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-text-primary mb-2">
                                        {t("characteristics.orientation")}
                                    </label>
                                    <select
                                        value={formData.orientation}
                                        onChange={(e) =>
                                            setFormData({ ...formData, orientation: e.target.value })
                                        }
                                        disabled={catalogs.loading}
                                        className="w-full px-4 py-3 border border-neutral-warm rounded-xl focus:ring-2 focus:ring-primary-dark focus:border-primary-dark disabled:opacity-50"
                                    >
                                        <option value="">{t("characteristics.select")}</option>
                                        {catalogs.orientations.map((orientation) => (
                                            <option key={orientation.code} value={orientation.code}>
                                                {orientation.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-text-primary mb-2">
                                        {t("characteristics.condition")}
                                    </label>
                                    <select
                                        value={formData.condition}
                                        onChange={(e) =>
                                            setFormData({ ...formData, condition: e.target.value })
                                        }
                                        disabled={catalogs.loading}
                                        className="w-full px-4 py-3 border border-neutral-warm rounded-xl focus:ring-2 focus:ring-primary-dark focus:border-primary-dark disabled:opacity-50"
                                    >
                                        <option value="">{t("characteristics.select")}</option>
                                        {catalogs.conditions.map((condition) => (
                                            <option key={condition.code} value={condition.code}>
                                                {condition.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-text-primary mb-2">
                                        {t("characteristics.energyLabel")}
                                    </label>
                                    <select
                                        value={formData.energy_label}
                                        onChange={(e) =>
                                            setFormData({ ...formData, energy_label: e.target.value })
                                        }
                                        disabled={catalogs.loading}
                                        className="w-full px-4 py-3 border border-neutral-warm rounded-xl focus:ring-2 focus:ring-primary-dark focus:border-primary-dark disabled:opacity-50"
                                    >
                                        <option value="">{t("characteristics.select")}</option>
                                        {catalogs.energyLabels.map((label) => (
                                            <option key={label.code} value={label.code}>
                                                {label.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="flex items-center gap-6">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={formData.has_elevator}
                                            onChange={(e) =>
                                                setFormData({
                                                    ...formData,
                                                    has_elevator: e.target.checked,
                                                })
                                            }
                                            className="w-4 h-4 text-primary-dark border-neutral-warm rounded focus:ring-primary-dark"
                                        />
                                        <span className="text-sm font-medium text-text-primary">
                                            {t("characteristics.elevator")}
                                        </span>
                                    </label>

                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={formData.is_furnished}
                                            onChange={(e) =>
                                                setFormData({
                                                    ...formData,
                                                    is_furnished: e.target.checked,
                                                })
                                            }
                                            className="w-4 h-4 text-primary-dark border-neutral-warm rounded focus:ring-primary-dark"
                                        />
                                        <span className="text-sm font-medium text-text-primary">
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
                                accessToken={(session as any)?.accessToken || ""}
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
                                    onChange={(e) =>
                                        setFormData({ ...formData, isPrivate: e.target.checked })
                                    }
                                    className="w-4 h-4 text-primary-dark border-neutral-warm rounded focus:ring-primary-dark"
                                />
                                <span className="text-sm font-medium text-text-primary">
                                    {t("privacy.privateProperty")}
                                </span>
                            </label>
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
                    </form>
                </div>
            </div>
        </div>
    );
}
