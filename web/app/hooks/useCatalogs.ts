import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';

interface RawCatalogItem {
    code: string;
    displayOrder: number;
}

interface CatalogItem {
    code: string;
    label: string;
    displayOrder: number;
}

interface RawCatalogsData {
    types: RawCatalogItem[];
    conditions: RawCatalogItem[];
    orientations: RawCatalogItem[];
    energyLabels: RawCatalogItem[];
}

interface CatalogsState {
    propertyTypes: CatalogItem[];
    conditions: CatalogItem[];
    orientations: CatalogItem[];
    energyLabels: CatalogItem[];
    loading: boolean;
    error: string | null;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://localhost/api';

export function useCatalogs(): CatalogsState {
    const t = useTranslations('catalogs');
    const [raw, setRaw] = useState<RawCatalogsData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Fetch raw codes once on mount — no dependency on `t` to avoid infinite refetch loop
    useEffect(() => {
        const fetchCatalogs = async () => {
            try {
                setLoading(true);
                setError(null);

                const [typesRes, conditionsRes, orientationsRes, energyLabelsRes] = await Promise.all([
                    fetch(`${API_BASE_URL}/catalogs/property-types`),
                    fetch(`${API_BASE_URL}/catalogs/conditions`),
                    fetch(`${API_BASE_URL}/catalogs/orientations`),
                    fetch(`${API_BASE_URL}/catalogs/energy-labels`),
                ]);

                if (!typesRes.ok || !conditionsRes.ok || !orientationsRes.ok || !energyLabelsRes.ok) {
                    throw new Error('Failed to fetch catalogs');
                }

                const [typesData, conditionsData, orientationsData, energyLabelsData] = await Promise.all([
                    typesRes.json(),
                    conditionsRes.json(),
                    orientationsRes.json(),
                    energyLabelsRes.json(),
                ]);

                setRaw({
                    types: typesData.data,
                    conditions: conditionsData.data,
                    orientations: orientationsData.data,
                    energyLabels: energyLabelsData.data,
                });
            } catch (err) {
                console.error('Error fetching catalogs:', err);
                setError('Failed to load catalogs');
            } finally {
                setLoading(false);
            }
        };

        fetchCatalogs();
    }, []); // fetch once — translations applied at render time below

    // Apply translations at render time so locale changes are reflected without refetching
    if (!raw) return { propertyTypes: [], conditions: [], orientations: [], energyLabels: [], loading, error };

    return {
        propertyTypes: raw.types.map(i => ({ ...i, label: t(`propertyTypes.${i.code}`) })),
        conditions: raw.conditions.map(i => ({ ...i, label: t(`conditions.${i.code}`) })),
        orientations: raw.orientations.map(i => ({ ...i, label: t(`orientations.${i.code}`) })),
        energyLabels: raw.energyLabels.map(i => ({ ...i, label: t(`energyLabels.${i.code}`) })),
        loading,
        error,
    };
}
