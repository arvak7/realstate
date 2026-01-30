"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function NewPropertyPage() {
    const { data: session } = useSession();
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const [formData, setFormData] = useState({
        title: "",
        description: "",
        price: "",
        rooms: "",
        square_meters: "",
        type: "pis",
        municipality: "",
        province: "",
        autonomous_community: "",
        floors: "",
        orientation: "",
        condition: "bon_estat",
        has_elevator: false,
        is_furnished: false,
        energy_label: "",
        tags: [] as string[],
        isPrivate: false,
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            const propertyData = {
                basic_info: {
                    title: formData.title,
                    description: formData.description,
                    price: parseFloat(formData.price),
                    rooms: parseInt(formData.rooms),
                    square_meters: parseFloat(formData.square_meters),
                    type: formData.type,
                },
                location: {
                    municipality: formData.municipality,
                    province: formData.province,
                    autonomous_community: formData.autonomous_community,
                },
                characteristics: {
                    floors: formData.floors ? parseInt(formData.floors) : undefined,
                    orientation: formData.orientation || undefined,
                    condition: formData.condition,
                    has_elevator: formData.has_elevator,
                    is_furnished: formData.is_furnished,
                },
                energy: {
                    energy_label: formData.energy_label || undefined,
                },
                tags: formData.tags,
                images: [],
                contact: {},
                isPrivate: formData.isPrivate,
            };

            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/properties`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${(session as any)?.accessToken}`,
                },
                body: JSON.stringify(propertyData),
            });

            if (response.ok) {
                const property = await response.json();
                router.push(`/properties/${property.id}`);
            } else {
                setError("Error al crear l'immoble. Si us plau, torna-ho a intentar.");
            }
        } catch (err) {
            setError("Error de connexió. Si us plau, verifica que el backend està en funcionament.");
        } finally {
            setLoading(false);
        }
    };

    if (!session) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-gray-900 mb-4">
                        Cal iniciar sessió
                    </h1>
                    <p className="text-gray-600 mb-4">
                        Has d'estar autenticat per publicar un immoble
                    </p>
                    <button
                        onClick={() => router.push("/auth/signin")}
                        className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition"
                    >
                        Iniciar Sessió
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="bg-white rounded-xl shadow-md p-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-6">
                        Publicar Nou Immoble
                    </h1>

                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Informació Bàsica */}
                        <div>
                            <h2 className="text-xl font-bold text-gray-900 mb-4">
                                Informació Bàsica
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Títol *
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.title}
                                        onChange={(e) =>
                                            setFormData({ ...formData, title: e.target.value })
                                        }
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="Ex: Pis modern al centre de Barcelona"
                                    />
                                </div>

                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Descripció *
                                    </label>
                                    <textarea
                                        required
                                        rows={4}
                                        value={formData.description}
                                        onChange={(e) =>
                                            setFormData({ ...formData, description: e.target.value })
                                        }
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="Descriu l'immoble..."
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Tipus *
                                    </label>
                                    <select
                                        required
                                        value={formData.type}
                                        onChange={(e) =>
                                            setFormData({ ...formData, type: e.target.value })
                                        }
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    >
                                        <option value="pis">Pis</option>
                                        <option value="casa">Casa</option>
                                        <option value="xalet">Xalet</option>
                                        <option value="estudi">Estudi</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Preu (€) *
                                    </label>
                                    <input
                                        type="number"
                                        required
                                        min="0"
                                        step="1000"
                                        value={formData.price}
                                        onChange={(e) =>
                                            setFormData({ ...formData, price: e.target.value })
                                        }
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="250000"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Habitacions *
                                    </label>
                                    <input
                                        type="number"
                                        required
                                        min="1"
                                        value={formData.rooms}
                                        onChange={(e) =>
                                            setFormData({ ...formData, rooms: e.target.value })
                                        }
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="3"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Metres Quadrats *
                                    </label>
                                    <input
                                        type="number"
                                        required
                                        min="1"
                                        step="0.1"
                                        value={formData.square_meters}
                                        onChange={(e) =>
                                            setFormData({ ...formData, square_meters: e.target.value })
                                        }
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="85"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Ubicació */}
                        <div>
                            <h2 className="text-xl font-bold text-gray-900 mb-4">Ubicació</h2>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Municipi *
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.municipality}
                                        onChange={(e) =>
                                            setFormData({ ...formData, municipality: e.target.value })
                                        }
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="Barcelona"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Província *
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.province}
                                        onChange={(e) =>
                                            setFormData({ ...formData, province: e.target.value })
                                        }
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="Barcelona"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Comunitat Autònoma *
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.autonomous_community}
                                        onChange={(e) =>
                                            setFormData({
                                                ...formData,
                                                autonomous_community: e.target.value,
                                            })
                                        }
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="Catalunya"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Característiques */}
                        <div>
                            <h2 className="text-xl font-bold text-gray-900 mb-4">
                                Característiques
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Plantes
                                    </label>
                                    <input
                                        type="number"
                                        min="1"
                                        value={formData.floors}
                                        onChange={(e) =>
                                            setFormData({ ...formData, floors: e.target.value })
                                        }
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="1"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Orientació
                                    </label>
                                    <select
                                        value={formData.orientation}
                                        onChange={(e) =>
                                            setFormData({ ...formData, orientation: e.target.value })
                                        }
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    >
                                        <option value="">Selecciona...</option>
                                        <option value="nord">Nord</option>
                                        <option value="sud">Sud</option>
                                        <option value="est">Est</option>
                                        <option value="oest">Oest</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Estat
                                    </label>
                                    <select
                                        value={formData.condition}
                                        onChange={(e) =>
                                            setFormData({ ...formData, condition: e.target.value })
                                        }
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    >
                                        <option value="nou">Nou</option>
                                        <option value="quasi_nou">Quasi nou</option>
                                        <option value="bon_estat">Bon estat</option>
                                        <option value="a_reformar">A reformar</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Etiqueta Energètica
                                    </label>
                                    <select
                                        value={formData.energy_label}
                                        onChange={(e) =>
                                            setFormData({ ...formData, energy_label: e.target.value })
                                        }
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    >
                                        <option value="">Selecciona...</option>
                                        <option value="A">A</option>
                                        <option value="B">B</option>
                                        <option value="C">C</option>
                                        <option value="D">D</option>
                                        <option value="E">E</option>
                                        <option value="F">F</option>
                                        <option value="G">G</option>
                                    </select>
                                </div>

                                <div className="flex items-center gap-6">
                                    <label className="flex items-center gap-2">
                                        <input
                                            type="checkbox"
                                            checked={formData.has_elevator}
                                            onChange={(e) =>
                                                setFormData({
                                                    ...formData,
                                                    has_elevator: e.target.checked,
                                                })
                                            }
                                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                        />
                                        <span className="text-sm font-medium text-gray-700">
                                            Ascensor
                                        </span>
                                    </label>

                                    <label className="flex items-center gap-2">
                                        <input
                                            type="checkbox"
                                            checked={formData.is_furnished}
                                            onChange={(e) =>
                                                setFormData({
                                                    ...formData,
                                                    is_furnished: e.target.checked,
                                                })
                                            }
                                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                        />
                                        <span className="text-sm font-medium text-gray-700">
                                            Amoblat
                                        </span>
                                    </label>
                                </div>
                            </div>
                        </div>

                        {/* Privacitat */}
                        <div>
                            <h2 className="text-xl font-bold text-gray-900 mb-4">Privacitat</h2>
                            <label className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    checked={formData.isPrivate}
                                    onChange={(e) =>
                                        setFormData({ ...formData, isPrivate: e.target.checked })
                                    }
                                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                />
                                <span className="text-sm font-medium text-gray-700">
                                    Immoble privat (amb requisits d'accés)
                                </span>
                            </label>
                        </div>

                        {/* Submit Button */}
                        <div className="flex gap-4 pt-6 border-t">
                            <button
                                type="button"
                                onClick={() => router.back()}
                                className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-300 transition"
                            >
                                Cancel·lar
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? "Publicant..." : "Publicar Immoble"}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
