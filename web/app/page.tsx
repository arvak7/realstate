import PropertyGrid from "./components/PropertyGrid";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";

export default function Home() {
  return (
    <main className="min-h-screen bg-neutral-cream text-text-primary">
      <Navbar />

      {/* Hero Section */}
      <section className="relative py-24 px-6 bg-neutral-beige overflow-hidden">
        <div className="container mx-auto relative z-10 text-center max-w-4xl">
          <h1 className="text-5xl md:text-6xl font-semibold mb-6 tracking-tight text-text-primary">
            Troba la Teva Llar Perfecta
          </h1>
          <p className="text-xl text-text-secondary mb-10 max-w-2xl mx-auto leading-relaxed">
            Descobreix propietats premium a les ubicacions més exclusives.
            Simplicitat, seguretat i estil.
          </p>
          <button className="bg-primary-dark text-white font-semibold py-4 px-10 rounded-full hover:bg-primary transition-all duration-300 shadow-soft-lg hover:shadow-soft-xl hover:-translate-y-0.5">
            Explorar Propietats
          </button>
        </div>
      </section>

      {/* Properties Section */}
      <section className="container mx-auto px-6 py-20">
        <h2 className="text-4xl font-semibold mb-12 text-center text-text-primary tracking-tight">
          Propietats Destacades
        </h2>
        <PropertyGrid />
      </section>

      {/* CTA Section */}
      <section className="bg-primary-dark text-white py-24 px-6 mt-12">
        <div className="container mx-auto text-center max-w-3xl">
          <h2 className="text-4xl font-semibold mb-5 tracking-tight">
            Preparat per mudar-te?
          </h2>
          <p className="mb-10 text-white/70 text-lg leading-relaxed">
            Connecta amb els nostres agents avui i comença el viatge cap a la teva nova llar.
          </p>
          <button className="bg-white text-primary-dark font-semibold py-4 px-10 rounded-full hover:bg-neutral-cream transition-all duration-300 shadow-soft-lg">
            Contacta'ns
          </button>
        </div>
      </section>

      <Footer />
    </main>
  );
}
