import PropertyGrid from "./components/PropertyGrid";
import Navbar from "./components/Navbar";

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-50 text-gray-900 font-sans">
      <Navbar />

      {/* Hero Section */}
      <section className="relative py-20 px-6 bg-gradient-to-r from-blue-600 to-indigo-700 text-white overflow-hidden">
        <div className="absolute inset-0 bg-black/20" />
        <div className="container mx-auto relative z-10 text-center">
          <h1 className="text-5xl font-extrabold mb-6 tracking-tight">
            Find Your Dream Home
          </h1>
          <p className="text-xl opacity-90 mb-8 max-w-2xl mx-auto">
            Discover premium properties in the most exclusive locations.
            Simplicity, Security, and Style.
          </p>
          <button className="bg-white text-blue-600 font-bold py-3 px-8 rounded-full hover:bg-gray-100 transition shadow-lg">
            Explore Properties
          </button>
        </div>
      </section>

      {/* Properties Section */}
      <section className="container mx-auto px-6 py-16">
        <h2 className="text-3xl font-bold mb-8 text-center">Featured Listings</h2>
        <PropertyGrid />
      </section>

      {/* CTA Section */}
      <section className="bg-gray-900 text-white py-20 px-6 mt-12">
        <div className="container mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to move in?</h2>
          <p className="mb-8 opacity-75">Connect with our agents today and start the journey.</p>
          <button className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-8 rounded-lg transition">
            Contact Us
          </button>
        </div>
      </section>
    </main>
  );
}
