"use client";

import { useState } from "react";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";

export default function FAQ() {
    const [openIndex, setOpenIndex] = useState<number | null>(0);
    const t = useTranslations("faq");

    const faqs = [
        { question: t("questions.q1.question"), answer: t("questions.q1.answer") },
        { question: t("questions.q2.question"), answer: t("questions.q2.answer") },
        { question: t("questions.q3.question"), answer: t("questions.q3.answer") },
        { question: t("questions.q4.question"), answer: t("questions.q4.answer") },
        { question: t("questions.q5.question"), answer: t("questions.q5.answer") }
    ];

    const toggleFAQ = (index: number) => {
        setOpenIndex(openIndex === index ? null : index);
    };

    return (
        <section className="py-20 md:py-28 px-6 bg-neutral-warm/30">
            <div className="max-w-7xl mx-auto">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20">
                    {/* Left: Title */}
                    <div>
                        <h2 className="text-3xl md:text-4xl text-kindred-dark">
                            {t("title")}
                            <br />
                            {t("titleLine2")}
                        </h2>
                    </div>

                    {/* Right: FAQ Accordion */}
                    <div className="space-y-0">
                        {faqs.map((faq, index) => (
                            <div
                                key={index}
                                className={`border-t border-gray-200 ${index === faqs.length - 1 ? 'border-b' : ''}`}
                            >
                                <button
                                    onClick={() => toggleFAQ(index)}
                                    className="w-full py-5 flex items-start justify-between text-left group"
                                >
                                    <h3 className={`text-base font-semibold pr-8 transition-colors duration-200 ${
                                        openIndex === index ? 'text-kindred-dark' : 'text-kindred-dark'
                                    }`}>
                                        {faq.question}
                                    </h3>
                                    <svg
                                        className={`w-5 h-5 flex-shrink-0 transition-transform duration-200 text-kindred-gray ${
                                            openIndex === index ? 'rotate-180' : ''
                                        }`}
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                </button>

                                <div className={`overflow-hidden transition-all duration-300 ease-in-out ${
                                    openIndex === index ? 'max-h-48 opacity-100 pb-5' : 'max-h-0 opacity-0'
                                }`}>
                                    <p className="text-kindred-gray text-sm leading-relaxed">
                                        {faq.answer}
                                    </p>
                                </div>
                            </div>
                        ))}

                        <div className="pt-6">
                            <Link
                                href="/faq"
                                className="inline-flex items-center gap-2 text-kindred-dark font-medium hover:underline"
                            >
                                {t("moreQuestions")}
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                                </svg>
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
