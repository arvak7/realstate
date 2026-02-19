"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3002";

interface MyProperty {
    id: string;
    elasticsearchId: string;
    status: string;
    isPrivate: boolean;
    address: string;
    createdAt: string;
    basic_info: {
        title?: string;
        price?: number;
        type?: string;
        rooms?: number;
        square_meters?: number;
    } | null;
    images: Array<{ url: string; is_main: boolean; order?: number }>;
    metadata: { created_at?: string; views_count?: number; favorites_count?: number } | null;
    _count: { contacts: number; propertyViews: number; favorites: number };
}

interface ContactRequest {
    id: string;
    message: string | null;
    status: string;
    createdAt: string;
    property: {
        id: string;
        address: string;
        title: string | null;
    };
    buyer: {
        id: string;
        name: string | null;
        email: string;
        profilePhotoUrl: string | null;
        oauthProfileImage: string | null;
    };
}

type Tab = "properties" | "contacts";

// Inline access requests panel for private properties.
// Extensible: clauseType param allows adding future clause types (Stripe, identity, etc.)
interface AccessRequestsPanelProps {
    clauseType: "buyerSellerMatch";
    contacts: ContactRequest[];
    propertyId: string;
    onAccept: (id: string) => void;
    onReject: (id: string) => void;
    t: ReturnType<typeof useTranslations<"dashboard">>;
}

function AccessRequestsPanel({ contacts, propertyId, onAccept, onReject, t }: AccessRequestsPanelProps) {
    const pending = contacts.filter(
        (c) => c.property.id === propertyId && c.status === "pending"
    );

    return (
        <div className="mt-3 pt-3 border-t border-gray-100">
            <div className="flex items-center gap-2 mb-2">
                <span className="text-sm font-medium text-kindred-dark flex items-center gap-1">
                    <svg className="w-4 h-4 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                    </svg>
                    {t("properties.accessRequests")}
                </span>
                {pending.length > 0 && (
                    <span className="bg-amber-100 text-amber-800 text-xs font-medium px-2 py-0.5 rounded-full">
                        {t("properties.accessRequestsPending", { count: pending.length })}
                    </span>
                )}
            </div>

            {pending.length === 0 ? (
                <p className="text-sm text-kindred-gray italic">{t("properties.accessRequestsEmpty")}</p>
            ) : (
                <div className="space-y-2">
                    {pending.map((contact) => (
                        <div
                            key={contact.id}
                            className="flex items-center justify-between gap-3 bg-indigo-50/50 rounded-lg px-3 py-2"
                        >
                            <div className="flex items-center gap-2 min-w-0">
                                <div className="w-8 h-8 rounded-full bg-kindred-primary/10 flex items-center justify-center flex-shrink-0 text-kindred-primary text-sm font-semibold">
                                    {(contact.buyer.name || contact.buyer.email).charAt(0).toUpperCase()}
                                </div>
                                <div className="min-w-0">
                                    <p className="text-sm font-medium text-kindred-dark truncate">
                                        {contact.buyer.name || contact.buyer.email}
                                    </p>
                                    <p className="text-xs text-kindred-gray truncate">{contact.buyer.email}</p>
                                    {contact.message && (
                                        <p className="text-xs text-kindred-gray italic truncate mt-0.5">
                                            &ldquo;{contact.message}&rdquo;
                                        </p>
                                    )}
                                </div>
                            </div>
                            <div className="flex gap-2 flex-shrink-0">
                                <button
                                    onClick={() => onAccept(contact.id)}
                                    className="text-xs font-medium px-3 py-1 rounded-lg bg-green-600 text-white hover:bg-green-700 transition-colors"
                                >
                                    {t("contacts.accept")}
                                </button>
                                <button
                                    onClick={() => onReject(contact.id)}
                                    className="text-xs font-medium px-3 py-1 rounded-lg bg-red-100 text-red-700 hover:bg-red-200 transition-colors"
                                >
                                    {t("contacts.reject")}
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default function DashboardPage() {
    const { data: session } = useSession();
    const t = useTranslations("dashboard");
    const tNav = useTranslations("nav");

    const [activeTab, setActiveTab] = useState<Tab>("properties");
    const [properties, setProperties] = useState<MyProperty[]>([]);
    const [contacts, setContacts] = useState<ContactRequest[]>([]);
    const [contactFilter, setContactFilter] = useState<string>("all");
    const [loading, setLoading] = useState(true);
    const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

    const getToken = useCallback(() => {
        return (session as any)?.accessToken || "demo-token";
    }, [session]);

    const fetchProperties = useCallback(async () => {
        try {
            const res = await fetch(`${API_URL}/me/properties`, {
                headers: { Authorization: `Bearer ${getToken()}` },
            });
            if (res.ok) {
                setProperties(await res.json());
            }
        } catch (e) {
            console.error("Failed to fetch properties:", e);
        }
    }, [getToken]);

    // Always fetch all contacts (no status filter in URL).
    // Client-side filtering is applied for the contacts tab display.
    // This ensures the inline access panels in the properties tab always have all pending contacts.
    const fetchContacts = useCallback(async () => {
        try {
            const res = await fetch(`${API_URL}/me/contacts`, {
                headers: { Authorization: `Bearer ${getToken()}` },
            });
            if (res.ok) {
                setContacts(await res.json());
            }
        } catch (e) {
            console.error("Failed to fetch contacts:", e);
        }
    }, [getToken]);

    useEffect(() => {
        if (!session) return;
        setLoading(true);
        Promise.all([fetchProperties(), fetchContacts()]).finally(() => setLoading(false));
    }, [session, fetchProperties, fetchContacts]);

    const showToast = (message: string, type: "success" | "error") => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    };

    const handleDeleteProperty = async (propertyId: string) => {
        if (!confirm(t("properties.confirmDelete"))) return;
        try {
            const res = await fetch(`${API_URL}/properties/${propertyId}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${getToken()}` },
            });
            if (res.ok) {
                setProperties((prev) => prev.filter((p) => p.id !== propertyId));
                showToast(t("properties.deleted"), "success");
            } else {
                showToast(t("properties.deleteError"), "error");
            }
        } catch {
            showToast(t("properties.deleteError"), "error");
        }
    };

    const handleContactAction = async (contactId: string, status: "accepted" | "rejected") => {
        try {
            const res = await fetch(`${API_URL}/properties/contacts/${contactId}/status`, {
                method: "PUT",
                headers: {
                    Authorization: `Bearer ${getToken()}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ status }),
            });
            if (res.ok) {
                setContacts((prev) =>
                    prev.map((c) => (c.id === contactId ? { ...c, status } : c))
                );
                showToast(t("contacts.statusUpdated"), "success");
            } else {
                showToast(t("contacts.statusError"), "error");
            }
        } catch {
            showToast(t("contacts.statusError"), "error");
        }
    };

    if (!session) {
        return (
            <>
                <Navbar />
                <div className="min-h-screen flex items-center justify-center">
                    <p className="text-kindred-gray">{tNav("signIn")}</p>
                </div>
                <Footer />
            </>
        );
    }

    const getMainImage = (images: MyProperty["images"]) => {
        const main = images.find((img) => img.is_main);
        return (main || images[0])?.url || null;
    };

    const statusColor = (status: string) => {
        switch (status) {
            case "active": return "bg-green-100 text-green-800";
            case "paused": return "bg-yellow-100 text-yellow-800";
            case "closed": return "bg-gray-100 text-gray-600";
            default: return "bg-gray-100 text-gray-600";
        }
    };

    const contactStatusColor = (status: string) => {
        switch (status) {
            case "pending": return "bg-yellow-100 text-yellow-800";
            case "accepted": return "bg-green-100 text-green-800";
            case "rejected": return "bg-red-100 text-red-800";
            default: return "bg-gray-100 text-gray-600";
        }
    };

    // Client-side filtering for contacts tab
    const filteredContacts = contactFilter === "all"
        ? contacts
        : contacts.filter((c) => c.status === contactFilter);

    const pendingCount = contacts.filter((c) => c.status === "pending").length;

    return (
        <>
            <Navbar />
            <div className="min-h-screen bg-neutral-warm/30">
                <div className="max-w-6xl mx-auto px-6 py-8">
                    <h1 className="text-3xl font-bold text-kindred-dark mb-6">{t("title")}</h1>

                    {/* Tabs */}
                    <div className="flex gap-1 mb-6 bg-white rounded-xl p-1 shadow-sm w-fit">
                        <button
                            onClick={() => setActiveTab("properties")}
                            className={`px-5 py-2.5 rounded-lg font-medium text-sm transition-colors ${
                                activeTab === "properties"
                                    ? "bg-kindred-primary text-white"
                                    : "text-kindred-gray hover:text-kindred-dark hover:bg-neutral-warm"
                            }`}
                        >
                            {t("tabs.properties")}
                        </button>
                        <button
                            onClick={() => setActiveTab("contacts")}
                            className={`px-5 py-2.5 rounded-lg font-medium text-sm transition-colors ${
                                activeTab === "contacts"
                                    ? "bg-kindred-primary text-white"
                                    : "text-kindred-gray hover:text-kindred-dark hover:bg-neutral-warm"
                            }`}
                        >
                            {t("tabs.contacts")}
                            {pendingCount > 0 && (
                                <span className="ml-2 bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                                    {pendingCount}
                                </span>
                            )}
                        </button>
                    </div>

                    {loading ? (
                        <div className="flex justify-center py-20">
                            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-kindred-primary" />
                        </div>
                    ) : activeTab === "properties" ? (
                        /* Properties Tab */
                        properties.length === 0 ? (
                            <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
                                <p className="text-kindred-gray mb-4">{t("properties.empty")}</p>
                                <Link href="/properties/new" className="btn-primary px-6 py-3">
                                    {t("properties.publishFirst")}
                                </Link>
                            </div>
                        ) : (
                            <div className="grid gap-4">
                                {properties.map((prop) => (
                                    <div key={prop.id} className="bg-white rounded-2xl shadow-sm overflow-hidden flex flex-col sm:flex-row">
                                        {/* Image */}
                                        <div className="sm:w-48 h-36 sm:h-auto flex-shrink-0 bg-gray-100">
                                            {getMainImage(prop.images) ? (
                                                <img
                                                    src={getMainImage(prop.images)!}
                                                    alt={prop.basic_info?.title || ""}
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-gray-400">
                                                    <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                    </svg>
                                                </div>
                                            )}
                                        </div>

                                        {/* Content */}
                                        <div className="flex-1 p-5 flex flex-col justify-between">
                                            <div>
                                                <div className="flex items-start justify-between gap-3">
                                                    <div>
                                                        <h3 className="font-semibold text-kindred-dark text-lg">
                                                            {prop.basic_info?.title || prop.address}
                                                        </h3>
                                                        <p className="text-sm text-kindred-gray mt-0.5">{prop.address}</p>
                                                    </div>
                                                    {/* Status + Private badges */}
                                                    <div className="flex flex-col items-end gap-1">
                                                        <span className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap ${statusColor(prop.status)}`}>
                                                            {t(`properties.status.${prop.status}` as any)}
                                                        </span>
                                                        {prop.isPrivate && (
                                                            <span className="px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap bg-indigo-100 text-indigo-700">
                                                                🔒 {t("properties.privateLabel")}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>

                                                {prop.basic_info?.price && (
                                                    <p className="text-xl font-bold text-kindred-dark mt-2">
                                                        {prop.basic_info.price.toLocaleString()} €
                                                    </p>
                                                )}
                                            </div>

                                            {/* Bottom section: stats + actions + access panel */}
                                            <div>
                                                {/* Stats + Actions */}
                                                <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
                                                    <div className="flex gap-4 text-sm text-kindred-gray">
                                                        <span>{t("properties.views", { count: prop._count.propertyViews })}</span>
                                                        <span>{t("properties.contacts", { count: prop._count.contacts })}</span>
                                                        <span>{t("properties.favorites", { count: prop._count.favorites })}</span>
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <Link
                                                            href={`/properties/${prop.elasticsearchId}`}
                                                            className="text-sm text-kindred-primary hover:text-kindred-primary/80 font-medium px-3 py-1.5 rounded-lg hover:bg-kindred-primary/5 transition-colors"
                                                        >
                                                            {t("properties.edit")}
                                                        </Link>
                                                        <button
                                                            onClick={() => handleDeleteProperty(prop.id)}
                                                            className="text-sm text-red-600 hover:text-red-700 font-medium px-3 py-1.5 rounded-lg hover:bg-red-50 transition-colors"
                                                        >
                                                            {t("properties.delete")}
                                                        </button>
                                                    </div>
                                                </div>

                                                {/* Inline access requests panel for private properties */}
                                                {prop.isPrivate && (
                                                    <AccessRequestsPanel
                                                        clauseType="buyerSellerMatch"
                                                        contacts={contacts}
                                                        propertyId={prop.id}
                                                        onAccept={(id) => handleContactAction(id, "accepted")}
                                                        onReject={(id) => handleContactAction(id, "rejected")}
                                                        t={t}
                                                    />
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )
                    ) : (
                        /* Contacts Tab */
                        <div>
                            {/* Filter */}
                            <div className="flex gap-2 mb-4">
                                {["all", "pending", "accepted", "rejected"].map((f) => (
                                    <button
                                        key={f}
                                        onClick={() => setContactFilter(f)}
                                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                            contactFilter === f
                                                ? "bg-kindred-dark text-white"
                                                : "bg-white text-kindred-gray hover:text-kindred-dark shadow-sm"
                                        }`}
                                    >
                                        {t(`contacts.filter${f.charAt(0).toUpperCase() + f.slice(1)}` as any)}
                                    </button>
                                ))}
                            </div>

                            {filteredContacts.length === 0 ? (
                                <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
                                    <p className="text-kindred-gray">{t("contacts.empty")}</p>
                                </div>
                            ) : (
                                <div className="grid gap-3">
                                    {filteredContacts.map((contact) => (
                                        <div key={contact.id} className="bg-white rounded-2xl shadow-sm p-5">
                                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                                <div className="flex-1 min-w-0">
                                                    {/* Buyer info */}
                                                    <div className="flex items-center gap-3 mb-2">
                                                        <div className="w-10 h-10 rounded-full bg-kindred-primary/10 flex items-center justify-center flex-shrink-0 text-kindred-primary font-semibold">
                                                            {(contact.buyer.name || contact.buyer.email).charAt(0).toUpperCase()}
                                                        </div>
                                                        <div className="min-w-0">
                                                            <p className="font-medium text-kindred-dark truncate">
                                                                {contact.buyer.name || contact.buyer.email}
                                                            </p>
                                                            <p className="text-sm text-kindred-gray truncate">{contact.buyer.email}</p>
                                                        </div>
                                                    </div>

                                                    {/* Property */}
                                                    <p className="text-sm text-kindred-gray">
                                                        <span className="font-medium">{t("contacts.property")}:</span>{" "}
                                                        {contact.property.title || contact.property.address}
                                                    </p>

                                                    {/* Message */}
                                                    {contact.message && (
                                                        <p className="text-sm text-kindred-dark mt-1 bg-neutral-warm/50 rounded-lg px-3 py-2">
                                                            {contact.message}
                                                        </p>
                                                    )}

                                                    {/* Date */}
                                                    <p className="text-xs text-kindred-gray mt-2">
                                                        {new Date(contact.createdAt).toLocaleDateString()}
                                                    </p>
                                                </div>

                                                {/* Status + Actions */}
                                                <div className="flex items-center gap-2 sm:flex-col sm:items-end">
                                                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${contactStatusColor(contact.status)}`}>
                                                        {t(`contacts.${contact.status}` as any)}
                                                    </span>

                                                    {contact.status === "pending" && (
                                                        <div className="flex gap-2">
                                                            <button
                                                                onClick={() => handleContactAction(contact.id, "accepted")}
                                                                className="text-sm font-medium px-4 py-1.5 rounded-lg bg-green-600 text-white hover:bg-green-700 transition-colors"
                                                            >
                                                                {t("contacts.accept")}
                                                            </button>
                                                            <button
                                                                onClick={() => handleContactAction(contact.id, "rejected")}
                                                                className="text-sm font-medium px-4 py-1.5 rounded-lg bg-red-100 text-red-700 hover:bg-red-200 transition-colors"
                                                            >
                                                                {t("contacts.reject")}
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Toast notification */}
                {toast && (
                    <div className={`fixed bottom-6 right-6 px-5 py-3 rounded-xl shadow-lg text-white text-sm font-medium z-50 transition-opacity ${
                        toast.type === "success" ? "bg-green-600" : "bg-red-600"
                    }`}>
                        {toast.message}
                    </div>
                )}
            </div>
            <Footer />
        </>
    );
}
