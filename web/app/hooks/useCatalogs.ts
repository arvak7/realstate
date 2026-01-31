import { useState, useEffect } from 'react';

interface CatalogItem {
    code: string;
    labelCa?: string;
    labelEs?: string;
    labelEn?: string;
    label?: string;
    name?: string;
    autonomousCommunity?: string;
    provinceCode?: string;
}

interface CatalogResponse {
    data: CatalogItem[];
    count: number;
}

export function useCatalogs() {
    const [propertyTypes, setPropertyTypes] = useState<CatalogItem[]>([]);
    const [conditions, setConditions] = useState<CatalogItem[]>([]);
    const [orientations, setOrientations] = useState<CatalogItem[]>([]);
    const [energyLabels, setEnergyLabels] = useState<CatalogItem[]>([]);
    const [provinces, setProvinces] = useState<CatalogItem[]>([]);
    const [municipalities, setMunicipalities] = useState<CatalogItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchCatalogs = async () => {
            try {
                setLoading(true);
                const apiUrl = process.env.NEXT_PUBLIC_API_URL;

                // Fetch all catalogs in parallel
                const [
                    typesRes,
                    conditionsRes,
                    orientationsRes,
                    energyLabelsRes,
                    provincesRes,
                    municipalitiesRes,
                ] = await Promise.all([
                    fetch(`${apiUrl}/catalogs/property-types`),
                    fetch(`${apiUrl}/catalogs/conditions`),
                    fetch(`${apiUrl}/catalogs/orientations`),
                    fetch(`${apiUrl}/catalogs/energy-labels`),
                    fetch(`${apiUrl}/catalogs/provinces`),
                    fetch(`${apiUrl}/catalogs/municipalities`),
                ]);

                if (!typesRes.ok || !conditionsRes.ok || !orientationsRes.ok ||
                    !energyLabelsRes.ok || !provincesRes.ok || !municipalitiesRes.ok) {
                    throw new Error('Failed to fetch catalogs');
                }

                const [types, conds, orients, energies, provs, munis]: CatalogResponse[] = await Promise.all([
                    typesRes.json(),
                    conditionsRes.json(),
                    orientationsRes.json(),
                    energyLabelsRes.json(),
                    provincesRes.json(),
                    municipalitiesRes.json(),
                ]);

                setPropertyTypes(types.data);
                setConditions(conds.data);
                setOrientations(orients.data);
                setEnergyLabels(energies.data);
                setProvinces(provs.data);
                setMunicipalities(munis.data);
            } catch (err) {
                console.error('Error fetching catalogs:', err);
                setError('Failed to load form options. Please refresh the page.');
            } finally {
                setLoading(false);
            }
        };

        fetchCatalogs();
    }, []);

    return {
        propertyTypes,
        conditions,
        orientations,
        energyLabels,
        provinces,
        municipalities,
        loading,
        error,
    };
}

export function useMunicipalities(provinceCode?: string) {
    const [municipalities, setMunicipalities] = useState<CatalogItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!provinceCode) {
            setMunicipalities([]);
            return;
        }

        const fetchMunicipalities = async () => {
            try {
                setLoading(true);
                const apiUrl = process.env.NEXT_PUBLIC_API_URL;
                const res = await fetch(`${apiUrl}/catalogs/municipalities?province=${provinceCode}`);

                if (!res.ok) {
                    throw new Error('Failed to fetch municipalities');
                }

                const data: CatalogResponse = await res.json();
                setMunicipalities(data.data);
            } catch (err) {
                console.error('Error fetching municipalities:', err);
                setError('Failed to load municipalities');
            } finally {
                setLoading(false);
            }
        };

        fetchMunicipalities();
    }, [provinceCode]);

    return { municipalities, loading, error };
}
