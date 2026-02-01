"use client";

import { PrivacySliderProps } from "./types";

export default function PrivacySlider({
    value,
    onChange,
    min = 100,
    max = 2000,
}: PrivacySliderProps) {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        onChange(parseInt(e.target.value, 10));
    };

    return (
        <div className="space-y-2">
            <div className="flex justify-between items-center">
                <label className="text-sm font-medium text-text-primary">
                    Radi de privacitat
                </label>
                <span className="text-sm font-semibold text-primary-dark">
                    {value} m
                </span>
            </div>
            <input
                type="range"
                min={min}
                max={max}
                step={100}
                value={value}
                onChange={handleChange}
                className="w-full h-2 bg-neutral-warm rounded-lg appearance-none cursor-pointer accent-primary-dark"
            />
            <div className="flex justify-between text-xs text-text-secondary">
                <span>{min}m</span>
                <span>{max}m</span>
            </div>
            <p className="text-xs text-text-tertiary mt-1">
                La ubicacio exacta es mostrara de forma aproximada dins aquest radi per protegir la teva privacitat.
            </p>
        </div>
    );
}
