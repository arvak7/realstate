"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import ClauseStatusItem from "./ClauseStatusItem";
import { getClauseFrontend } from "@/app/lib/clauses";

interface ClauseResult {
    id: string;
    satisfied: boolean;
}

interface RequirementsModalProps {
    propertyId: string;
    requiredClauses: string[];
    onClose: () => void;
    onAccessGranted: (images: Array<{ url: string; is_main: boolean }>) => void;
}

export default function RequirementsModal({
    propertyId,
    requiredClauses,
    onClose,
    onAccessGranted,
}: RequirementsModalProps) {
    const { data: session } = useSession();
    const t = useTranslations("clauses");
    const tPrivate = useTranslations("privatePhotos");
    const [clauseResults, setClauseResults] = useState<ClauseResult[]>([]);
    const [loading, setLoading] = useState(true);
    const [requesting, setRequesting] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        fetchAccessStatus();
    }, [propertyId]);

    const fetchAccessStatus = async () => {
        try {
            const res = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/properties/${propertyId}/photo-access`,
                {
                    headers: {
                        Authorization: `Bearer ${(session as any)?.accessToken}`,
                    },
                }
            );
            if (res.ok) {
                const data = await res.json();
                if (data.granted) {
                    // Already granted, close modal
                    onClose();
                    return;
                }
                setClauseResults(data.clauses || []);
            }
        } catch (err) {
            setError("Error loading requirements");
        } finally {
            setLoading(false);
        }
    };

    const handleRequestAccess = async () => {
        setRequesting(true);
        setError("");
        try {
            const res = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/properties/${propertyId}/photo-access`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${(session as any)?.accessToken}`,
                    },
                }
            );
            const data = await res.json();
            if (data.granted) {
                onAccessGranted(data.images || []);
                onClose();
            } else {
                setClauseResults(data.clauses || []);
                setError(t("notAllMet"));
            }
        } catch (err) {
            setError("Error requesting access");
        } finally {
            setRequesting(false);
        }
    };

    const allSatisfied = clauseResults.length > 0 && clauseResults.every((c) => c.satisfied);

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
            onClick={onClose}
        >
            <div
                className="bg-white rounded-2xl max-w-md w-full overflow-hidden shadow-xl"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="p-6 pb-0">
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="text-lg font-semibold text-kindred-dark">
                            {t("requirementsTitle")}
                        </h3>
                        <button
                            onClick={onClose}
                            className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors text-kindred-gray"
                        >
                            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M18 6 6 18" /><path d="m6 6 12 12" />
                            </svg>
                        </button>
                    </div>
                    <p className="text-sm text-kindred-gray mb-4">
                        {t("requirementsDescription")}
                    </p>
                </div>

                {/* Content */}
                <div className="px-6 pb-6">
                    {loading ? (
                        <div className="space-y-3">
                            {[1, 2].map((i) => (
                                <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse" />
                            ))}
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {clauseResults.map((clause) => {
                                const frontend = getClauseFrontend(clause.id);
                                return (
                                    <ClauseStatusItem
                                        key={clause.id}
                                        clauseId={clause.id}
                                        satisfied={clause.satisfied}
                                        icon={frontend?.icon || 'shield'}
                                    />
                                );
                            })}
                        </div>
                    )}

                    {error && (
                        <p className="text-sm text-red-600 mt-3">{error}</p>
                    )}

                    {/* Actions */}
                    <div className="mt-6 flex gap-3">
                        <button
                            onClick={onClose}
                            className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-kindred-gray hover:bg-gray-50 transition-colors"
                        >
                            {t("close")}
                        </button>
                        {allSatisfied && (
                            <button
                                onClick={handleRequestAccess}
                                disabled={requesting}
                                className="flex-1 px-4 py-2.5 bg-kindred-dark text-white rounded-xl text-sm font-medium hover:bg-kindred-dark/90 transition-colors disabled:opacity-50"
                            >
                                {requesting ? t("requesting") : t("viewPhotos")}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
