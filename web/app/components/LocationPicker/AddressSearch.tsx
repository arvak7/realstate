"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { AddressSearchProps, GeoSearchResult } from "./types";

const NOMINATIM_URL = "https://nominatim.openstreetmap.org/search";

export default function AddressSearch({ onSelect, placeholder = "Cerca una adreça..." }: AddressSearchProps) {
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<GeoSearchResult[]>([]);
    const [loading, setLoading] = useState(false);
    const [showDropdown, setShowDropdown] = useState(false);
    const debounceRef = useRef<NodeJS.Timeout | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    const searchAddress = useCallback(async (searchQuery: string) => {
        if (searchQuery.length < 3) {
            setResults([]);
            return;
        }

        setLoading(true);
        try {
            const params = new URLSearchParams({
                q: searchQuery,
                format: "json",
                addressdetails: "1",
                limit: "5",
            });

            const response = await fetch(`${NOMINATIM_URL}?${params.toString()}`, {
                headers: {
                    "Accept-Language": "ca,es,en",
                },
            });

            if (!response.ok) throw new Error("Search failed");

            const data = await response.json();
            const searchResults: GeoSearchResult[] = data.map((item: any) => ({
                latitude: parseFloat(item.lat),
                longitude: parseFloat(item.lon),
                displayName: item.display_name,
            }));

            setResults(searchResults);
            setShowDropdown(searchResults.length > 0);
        } catch (error) {
            console.error("Address search error:", error);
            setResults([]);
        } finally {
            setLoading(false);
        }
    }, []);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setQuery(value);

        if (debounceRef.current) {
            clearTimeout(debounceRef.current);
        }

        debounceRef.current = setTimeout(() => {
            searchAddress(value);
        }, 300);
    };

    const handleSelect = (result: GeoSearchResult) => {
        setQuery(result.displayName);
        setShowDropdown(false);
        onSelect(result);
    };

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setShowDropdown(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <div ref={containerRef} className="relative">
            <div className="relative">
                <input
                    type="text"
                    value={query}
                    onChange={handleInputChange}
                    onFocus={() => results.length > 0 && setShowDropdown(true)}
                    placeholder={placeholder}
                    className="w-full px-4 py-3 pl-10 border border-neutral-warm rounded-xl focus:ring-2 focus:ring-primary-dark focus:border-primary-dark transition-all duration-200"
                />
                <svg
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-secondary"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                </svg>
                {loading && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <div className="w-5 h-5 border-2 border-primary-dark border-t-transparent rounded-full animate-spin" />
                    </div>
                )}
            </div>

            {showDropdown && results.length > 0 && (
                <ul className="absolute z-50 w-full mt-1 bg-white border border-neutral-warm rounded-xl shadow-lg max-h-60 overflow-auto">
                    {results.map((result, index) => (
                        <li key={index}>
                            <button
                                type="button"
                                onClick={() => handleSelect(result)}
                                className="w-full px-4 py-3 text-left hover:bg-neutral-cream transition-colors text-sm text-text-primary"
                            >
                                {result.displayName}
                            </button>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
