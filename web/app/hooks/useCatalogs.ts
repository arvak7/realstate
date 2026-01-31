import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';

interface CatalogItem {
    code: string;
    label: string;
    displayOrder: number;
}

interface CatalogsState {
    propertyTypes: CatalogItem[];
    conditions: CatalogItem[];
    orientations: CatalogItem[];
    energyLabels: CatalogItem[];
    loading: boolean;
    error: string | null;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export function useCatalogs(): CatalogsState {
    const t = useTranslations('catalogs');
    const [state, setState] = useState<CatalogsState>({
        propertyTypes: [],
        conditions: [],
        orientations: [],
        energyLabels: [],
        loading: true,
        error: null,
    });

    useEffect(() => {
        const fetchCatalogs = async () => {
            try {
                setState(prev => ({ ...prev, loading: true, error: null }));

                // Fetch all catalogs in parallel
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

                // Combine DB codes with i18n translations
                const propertyTypes = typesData.data.map((item: { code: string; displayOrder: number }) => ({
                    code: item.code,
                    label: t(`propertyTypes.${item.code}`),
                    displayOrder: item.displayOrder,
                }));

                const conditions = conditionsData.data.map((item: { code: string; displayOrder: number }) => ({
                    code: item.code,
                    label: t(`conditions.${item.code}`),
                    displayOrder: item.displayOrder,
                }));

                const orientations = orientationsData.data.map((item: { code: string; displayOrder: number }) => ({
                    code: item.code,
                    label: t(`orientations.${item.code}`),
                    displayOrder: item.displayOrder,
                }));

                const energyLabels = energyLabelsData.data.map((item: { code: string; displayOrder: number }) => ({
                    code: item.code,
                    label: t(`energyLabels.${item.code}`),
                    displayOrder: item.displayOrder,
                }));

                setState({
                    propertyTypes,
                    conditions,
                    orientations,
                    energyLabels,
                    loading: false,
                    error: null,
                });
            } catch (error) {
                console.error('Error fetching catalogs:', error);
                setState(prev => ({
                    ...prev,
                    loading: false,
                    error: 'Failed to load catalogs',
                }));
            }
        };

        fetchCatalogs();
    }, [t]);

    return state;
}
