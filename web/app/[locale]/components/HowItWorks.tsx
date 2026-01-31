"use client";

import { useState } from "react";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";

const STEP_IMAGES = [
    "https://images.unsplash.com/photo-1600573472550-8090b5e0745e?w=800&h=600&fit=crop",
    "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800&h=600&fit=crop",
    "https://images.unsplash.com/photo-1560448205-4d9b3e6bb6db?w=800&h=600&fit=crop"
];

export default function HowItWorks() {
    const [activeStep, setActiveStep] = useState(1);
    const t = useTranslations("howItWorks");

    const steps = [
        { id: 1, title: t("step1.title"), description: t("step1.description") },
        { id: 2, title: t("step2.title"), description: t("step2.description") },
        { id: 3, title: t("step3.title"), description: t("step3.description") }
    ];

    return (
        <section className="py-20 md:py-28 px-6 bg-white">
            <div className="max-w-7xl mx-auto">
                <h2 className="text-3xl md:text-heading text-kindred-dark mb-12">
                    {t("title")}
                </h2>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16">
                    {/* Left: Image */}
                    <div className="aspect-[4/3] rounded-2xl overflow-hidden bg-neutral-warm">
                        <img
                            src={STEP_IMAGES[activeStep - 1]}
                            alt={steps.find(s => s.id === activeStep)?.title}
                            className="w-full h-full object-cover transition-opacity duration-300"
                        />
                    </div>

                    {/* Right: Accordion Steps */}
                    <div className="space-y-0">
                        {steps.map((step) => (
                            <div
                                key={step.id}
                                className={`border-t border-gray-200 ${step.id === steps.length ? 'border-b' : ''}`}
                            >
                                <button
                                    onClick={() => setActiveStep(step.id)}
                                    className="w-full py-6 flex items-center justify-between text-left group"
                                >
                                    <h3 className={`text-lg font-semibold transition-colors duration-200 ${
                                        activeStep === step.id ? 'text-kindred-dark' : 'text-kindred-gray'
                                    }`}>
                                        {step.title}
                                    </h3>
                                    <svg
                                        className={`w-5 h-5 transition-transform duration-200 ${
                                            activeStep === step.id ? 'rotate-180 text-kindred-dark' : 'text-kindred-gray'
                                        }`}
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                </button>

                                <div className={`overflow-hidden transition-all duration-300 ease-in-out ${
                                    activeStep === step.id ? 'max-h-40 opacity-100 pb-6' : 'max-h-0 opacity-0'
                                }`}>
                                    <p className="text-kindred-gray leading-relaxed">
                                        {step.description}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="mt-12">
                    <Link href="/about" className="btn-primary">
                        {t("moreInfo")}
                    </Link>
                </div>
            </div>
        </section>
    );
}
