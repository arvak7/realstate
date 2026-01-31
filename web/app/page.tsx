import Link from "next/link";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import PropertyGrid from "./components/PropertyGrid";
import HowItWorks from "./components/HowItWorks";
import FAQ from "./components/FAQ";

const LOCATIONS = [
    "Barcelona", "Madrid", "València", "Girona", "Tarragona",
    "Lleida", "Costa Brava", "Costa Daurada", "Pirineus", "Mallorca",
    "Eivissa", "Menorca"
];

export default function Home() {
    return (
        <main className="min-h-screen bg-white text-kindred-dark">
            <Navbar />

            {/* Hero Section - Kindred Style */}
            <section className="py-16 md:py-24 px-6 bg-white">
                <div className="max-w-7xl mx-auto">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
                        {/* Left: Text Content */}
                        <div className="max-w-xl">
                            <h1 className="text-4xl md:text-5xl lg:text-display-sm mb-6 text-kindred-dark">
                                Troba el teu
                                <br />
                                proper llar
                            </h1>
                            <h2 className="text-lg md:text-xl text-kindred-gray mb-8 leading-relaxed font-sans font-normal">
                                Descobreix propietats úniques a Catalunya i les Illes Balears. Compra, lloga o ven amb total confiança.
                            </h2>
                            <div className="flex flex-wrap items-center gap-4">
                                <Link href="/properties" className="btn-primary">
                                    Explorar Immobles
                                </Link>
                                <span className="text-kindred-gray text-sm">
                                    Propietaris i llogaters benvinguts
                                </span>
                            </div>
                        </div>

                        {/* Right: Image Grid - Kindred Style */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-4">
                                <div className="aspect-[4/5] rounded-2xl overflow-hidden bg-neutral-warm">
                                    <img
                                        src="https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=600&h=750&fit=crop"
                                        alt="Casa moderna amb jardí"
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                                <div className="aspect-[4/3] rounded-2xl overflow-hidden bg-neutral-warm">
                                    <img
                                        src="https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=600&h=450&fit=crop"
                                        alt="Interior elegant"
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                            </div>
                            <div className="space-y-4 pt-8">
                                <div className="aspect-[4/3] rounded-2xl overflow-hidden bg-neutral-warm">
                                    <img
                                        src="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600&h=450&fit=crop"
                                        alt="Sala d'estar lluminosa"
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                                <div className="aspect-[4/5] rounded-2xl overflow-hidden bg-neutral-warm">
                                    <img
                                        src="https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?w=600&h=750&fit=crop"
                                        alt="Cuina moderna"
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Locations Section - Kindred Style Pills */}
            <section className="py-16 px-6 bg-neutral-warm/50 border-y border-gray-100">
                <div className="max-w-7xl mx-auto">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 mb-10">
                        <h2 className="text-3xl md:text-heading text-kindred-dark">
                            Immobles a les millors ubicacions
                        </h2>
                        <Link
                            href="/properties"
                            className="btn-secondary inline-flex items-center gap-2 self-start"
                        >
                            Veure tots
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                            </svg>
                        </Link>
                    </div>
                    <div className="flex flex-wrap gap-3">
                        {LOCATIONS.map((location) => (
                            <Link
                                key={location}
                                href={`/properties?location=${encodeURIComponent(location)}`}
                                className="location-pill"
                            >
                                {location}
                            </Link>
                        ))}
                        <Link href="/properties" className="location-pill">
                            + Més
                        </Link>
                    </div>
                </div>
            </section>

            {/* How It Works Section */}
            <HowItWorks />

            {/* Featured Properties Section */}
            <section className="py-20 md:py-28 px-6 bg-white">
                <div className="max-w-7xl mx-auto">
                    <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-12">
                        <div>
                            <h2 className="text-3xl md:text-heading text-kindred-dark mb-3">
                                Propietats destacades
                            </h2>
                            <p className="text-kindred-gray">
                                Descobreix les millors opcions seleccionades per a tu
                            </p>
                        </div>
                        <Link
                            href="/properties"
                            className="btn-outline self-start"
                        >
                            Veure totes
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                            </svg>
                        </Link>
                    </div>
                    <PropertyGrid />
                </div>
            </section>

            {/* Dark CTA Section - Kindred Style */}
            <section className="py-20 md:py-28 px-6 bg-kindred-dark text-white">
                <div className="max-w-4xl mx-auto text-center">
                    <h2 className="text-3xl md:text-4xl lg:text-5xl mb-6 text-white">
                        Vols publicar el teu immoble?
                    </h2>
                    <p className="text-white/60 text-lg mb-10 max-w-2xl mx-auto leading-relaxed font-sans">
                        Arriba a milers de compradors i llogaters potencials. Publica el teu immoble en minuts i comença a rebre consultes.
                    </p>
                    <Link
                        href="/properties/new"
                        className="bg-white text-kindred-dark font-medium py-3 px-8 rounded-pill hover:bg-neutral-cream transition-all duration-300 inline-flex items-center gap-2"
                    >
                        Publicar Immoble
                    </Link>
                </div>
            </section>

            {/* Trust Section - Kindred Style */}
            <section className="py-20 md:py-28 px-6 bg-white">
                <div className="max-w-7xl mx-auto">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
                        <div>
                            <h2 className="text-3xl md:text-4xl text-kindred-dark mb-8">
                                Persones reals,
                                <br />
                                llars reals
                            </h2>
                            <ul className="space-y-6">
                                <li className="flex items-start gap-4">
                                    <div className="w-6 h-6 rounded-full bg-kindred-dark/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                                        <svg className="w-3.5 h-3.5 text-kindred-dark" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                    </div>
                                    <p className="text-kindred-gray">
                                        Tots els propietaris són verificats i les propietats revisades
                                    </p>
                                </li>
                                <li className="flex items-start gap-4">
                                    <div className="w-6 h-6 rounded-full bg-kindred-dark/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                                        <svg className="w-3.5 h-3.5 text-kindred-dark" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                    </div>
                                    <p className="text-kindred-gray">
                                        Contacta directament amb els propietaris sense intermediaris
                                    </p>
                                </li>
                                <li className="flex items-start gap-4">
                                    <div className="w-6 h-6 rounded-full bg-kindred-dark/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                                        <svg className="w-3.5 h-3.5 text-kindred-dark" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                    </div>
                                    <p className="text-kindred-gray">
                                        Explora immobles reals, no anuncis genèrics
                                    </p>
                                </li>
                            </ul>
                            <div className="mt-10 p-4 bg-neutral-warm rounded-xl">
                                <p className="text-kindred-dark font-medium text-sm">
                                    Garantia de satisfacció inclosa en cada transacció
                                </p>
                            </div>
                        </div>
                        <div className="relative">
                            <div className="aspect-[4/5] rounded-3xl overflow-hidden bg-neutral-warm">
                                <img
                                    src="https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=600&h=750&fit=crop"
                                    alt="Interior d'una llar acollidora"
                                    className="w-full h-full object-cover"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* FAQ Section */}
            <FAQ />

            {/* Final CTA Banner */}
            <section className="py-6 px-6 bg-white border-t border-gray-100">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
                    <h3 className="text-xl md:text-2xl text-kindred-dark font-sans font-semibold">
                        Ara disponible a Catalunya i les Illes Balears.
                    </h3>
                    <Link href="/properties" className="btn-primary">
                        Explorar Immobles
                    </Link>
                </div>
            </section>

            <Footer />
        </main>
    );
}
