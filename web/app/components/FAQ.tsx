"use client";

import { useState } from "react";
import Link from "next/link";

const FAQS = [
    {
        question: "Com puc publicar el meu immoble?",
        answer: "Registra't a la plataforma, verifica el teu compte i després podràs publicar el teu immoble en pocs minuts. Afegeix fotos, descripció i preu. El nostre equip revisarà la publicació per garantir la qualitat."
    },
    {
        question: "Quins costos té la plataforma?",
        answer: "Explorar immobles és completament gratuït. Per als propietaris, oferim diferents plans segons les seves necessitats. El pla bàsic és gratuït i els plans premium ofereixen més visibilitat i funcionalitats."
    },
    {
        question: "Com es verifica la identitat dels propietaris?",
        answer: "Tots els propietaris han de verificar la seva identitat mitjançant un procés segur que inclou verificació de documents i número de telèfon. Això garanteix la seguretat de tots els usuaris."
    },
    {
        question: "Puc llogar i vendre alhora?",
        answer: "Sí, pots indicar si el teu immoble està disponible per lloguer, venda o ambdues opcions. Així arribes a més públic interessat."
    },
    {
        question: "Com funciona el contacte amb els propietaris?",
        answer: "Un cop trobis un immoble interessant, pots enviar un missatge directament al propietari a través de la plataforma. Rebràs notificacions quan et respongui."
    }
];

export default function FAQ() {
    const [openIndex, setOpenIndex] = useState<number | null>(0);

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
                            Preguntes?
                            <br />
                            Estem aquí per ajudar
                        </h2>
                    </div>

                    {/* Right: FAQ Accordion */}
                    <div className="space-y-0">
                        {FAQS.map((faq, index) => (
                            <div
                                key={index}
                                className={`border-t border-gray-200 ${index === FAQS.length - 1 ? 'border-b' : ''}`}
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
                                Més preguntes i respostes
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
