import { useTranslations } from "next-intl";
import { setRequestLocale } from 'next-intl/server';
import { Link } from "@/i18n/navigation";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import PropertyGrid from "./components/PropertyGrid";
import HowItWorks from "./components/HowItWorks";
import FAQ from "./components/FAQ";

const LOCATION_KEYS = [
    "barcelona", "madrid", "valencia", "girona", "tarragona",
    "lleida", "costaBrava", "costaDaurada", "pirineus", "mallorca",
    "eivissa", "menorca"
] as const;

export default function Home({ params }: { params: Promise<{ locale: string }> }) {
    const t = useTranslations();

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
                                {t("home.hero.title")}
                                <br />
                                {t("home.hero.titleLine2")}
                            </h1>
                            <h2 className="text-lg md:text-xl text-kindred-gray mb-8 leading-relaxed font-sans font-normal">
                                {t("home.hero.subtitle")}
                            </h2>
                            <div className="flex flex-wrap items-center gap-4">
                                <Link href="/properties" className="btn-primary">
                                    {t("home.hero.cta")}
                                </Link>
                                <span className="text-kindred-gray text-sm">
                                    {t("home.hero.welcome")}
                                </span>
                            </div>
                        </div>

                        {/* Right: Image Grid - Kindred Style */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-4">
                                <div className="aspect-[4/5] rounded-2xl overflow-hidden bg-neutral-warm">
                                    <img
                                        src="https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=600&h=750&fit=crop"
                                        alt={t("home.images.modernHouse")}
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                                <div className="aspect-[4/3] rounded-2xl overflow-hidden bg-neutral-warm">
                                    <img
                                        src="https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=600&h=450&fit=crop"
                                        alt={t("home.images.elegantInterior")}
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                            </div>
                            <div className="space-y-4 pt-8">
                                <div className="aspect-[4/3] rounded-2xl overflow-hidden bg-neutral-warm">
                                    <img
                                        src="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600&h=450&fit=crop"
                                        alt={t("home.images.brightLiving")}
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                                <div className="aspect-[4/5] rounded-2xl overflow-hidden bg-neutral-warm">
                                    <img
                                        src="https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?w=600&h=750&fit=crop"
                                        alt={t("home.images.modernKitchen")}
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
                            {t("home.locations.title")}
                        </h2>
                        <Link
                            href="/properties"
                            className="btn-secondary inline-flex items-center gap-2 self-start"
                        >
                            {t("home.locations.viewAll")}
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                            </svg>
                        </Link>
                    </div>
                    <div className="flex flex-wrap gap-3">
                        {LOCATION_KEYS.map((key) => (
                            <Link
                                key={key}
                                href={`/properties?location=${encodeURIComponent(t(`locations.${key}`))}`}
                                className="location-pill"
                            >
                                {t(`locations.${key}`)}
                            </Link>
                        ))}
                        <Link href="/properties" className="location-pill">
                            {t("home.locations.more")}
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
                                {t("home.featured.title")}
                            </h2>
                            <p className="text-kindred-gray">
                                {t("home.featured.subtitle")}
                            </p>
                        </div>
                        <Link
                            href="/properties"
                            className="btn-outline self-start"
                        >
                            {t("home.featured.viewAll")}
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
                        {t("home.cta.title")}
                    </h2>
                    <p className="text-white/60 text-lg mb-10 max-w-2xl mx-auto leading-relaxed font-sans">
                        {t("home.cta.subtitle")}
                    </p>
                    <Link
                        href="/properties/new"
                        className="bg-white text-kindred-dark font-medium py-3 px-8 rounded-pill hover:bg-neutral-cream transition-all duration-300 inline-flex items-center gap-2"
                    >
                        {t("home.cta.button")}
                    </Link>
                </div>
            </section>

            {/* Trust Section - Kindred Style */}
            <section className="py-20 md:py-28 px-6 bg-white">
                <div className="max-w-7xl mx-auto">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
                        <div>
                            <h2 className="text-3xl md:text-4xl text-kindred-dark mb-8">
                                {t("home.trust.title")}
                                <br />
                                {t("home.trust.titleLine2")}
                            </h2>
                            <ul className="space-y-6">
                                <li className="flex items-start gap-4">
                                    <div className="w-6 h-6 rounded-full bg-kindred-dark/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                                        <svg className="w-3.5 h-3.5 text-kindred-dark" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                    </div>
                                    <p className="text-kindred-gray">
                                        {t("home.trust.point1")}
                                    </p>
                                </li>
                                <li className="flex items-start gap-4">
                                    <div className="w-6 h-6 rounded-full bg-kindred-dark/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                                        <svg className="w-3.5 h-3.5 text-kindred-dark" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                    </div>
                                    <p className="text-kindred-gray">
                                        {t("home.trust.point2")}
                                    </p>
                                </li>
                                <li className="flex items-start gap-4">
                                    <div className="w-6 h-6 rounded-full bg-kindred-dark/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                                        <svg className="w-3.5 h-3.5 text-kindred-dark" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                    </div>
                                    <p className="text-kindred-gray">
                                        {t("home.trust.point3")}
                                    </p>
                                </li>
                            </ul>
                            <div className="mt-10 p-4 bg-neutral-warm rounded-xl">
                                <p className="text-kindred-dark font-medium text-sm">
                                    {t("home.trust.guarantee")}
                                </p>
                            </div>
                        </div>
                        <div className="relative">
                            <div className="aspect-[4/5] rounded-3xl overflow-hidden bg-neutral-warm">
                                <img
                                    src="https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=600&h=750&fit=crop"
                                    alt={t("home.images.cozyHome")}
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
                        {t("home.banner.title")}
                    </h3>
                    <Link href="/properties" className="btn-primary">
                        {t("home.banner.cta")}
                    </Link>
                </div>
            </section>

            <Footer />
        </main>
    );
}
