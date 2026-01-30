"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import ImageUploader, { UploadedImage } from "@/app/components/ImageUploader";

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
        municipality: "Barcelona",
        province: "Barcelona",
        autonomous_community: "Catalunya",
        floors: "",
        orientation: "",
        condition: "bon_estat",
        has_elevator: false,
        is_furnished: false,
        energy_label: "",
        tags: [] as string[],
        isPrivate: false,
    });
    const [images, setImages] = useState<UploadedImage[]>([]);

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
                images: images,
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
            <div className="min-h-screen flex items-center justify-center bg-neutral-cream">
                <div className="text-center">
                    <h1 className="text-2xl font-semibold text-text-primary mb-4">
                        Cal iniciar sessió
                    </h1>
                    <p className="text-text-secondary mb-6">
                        Has d'estar autenticat per publicar un immoble
                    </p>
                    <button
                        onClick={() => router.push("/auth/signin")}
                        className="bg-primary-dark text-white px-8 py-3 rounded-full font-semibold hover:bg-primary transition-all duration-300 shadow-soft"
                    >
                        Iniciar Sessió
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-neutral-cream py-12">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="bg-white rounded-2xl shadow-soft-lg p-10">
                    <h1 className="text-4xl font-semibold text-text-primary mb-8 tracking-tight">
                        Publicar Nou Immoble
                    </h1>

                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-700 px-5 py-4 rounded-xl mb-6">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Informació Bàsica */}
                        <div>
                            <h2 className="text-2xl font-semibold text-text-primary mb-5 tracking-tight">
                                Informació Bàsica
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-text-primary mb-2">
                                        Títol *
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.title}
                                        onChange={(e) =>
                                            setFormData({ ...formData, title: e.target.value })
                                        }
                                        className="w-full px-4 py-3 border border-neutral-warm rounded-xl focus:ring-2 focus:ring-primary-dark focus:border-primary-dark transition-all duration-200"
                                        placeholder="Ex: Pis modern al centre de Barcelona"
                                    />
                                </div>

                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-text-primary mb-2">
                                        Descripció *
                                    </label>
                                    <textarea
                                        required
                                        rows={4}
                                        value={formData.description}
                                        onChange={(e) =>
                                            setFormData({ ...formData, description: e.target.value })
                                        }
                                        className="w-full px-4 py-3 border border-neutral-warm rounded-xl focus:ring-2 focus:ring-primary-dark focus:border-primary-dark"
                                        placeholder="Descriu l'immoble..."
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-text-primary mb-2">
                                        Tipus *
                                    </label>
                                    <select
                                        required
                                        value={formData.type}
                                        onChange={(e) =>
                                            setFormData({ ...formData, type: e.target.value })
                                        }
                                        className="w-full px-4 py-3 border border-neutral-warm rounded-xl focus:ring-2 focus:ring-primary-dark focus:border-primary-dark"
                                    >
                                        <option value="pis">Pis</option>
                                        <option value="casa">Casa</option>
                                        <option value="xalet">Xalet</option>
                                        <option value="estudi">Estudi</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-text-primary mb-2">
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
                                        className="w-full px-4 py-3 border border-neutral-warm rounded-xl focus:ring-2 focus:ring-primary-dark focus:border-primary-dark"
                                        placeholder="250000"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-text-primary mb-2">
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
                                        className="w-full px-4 py-3 border border-neutral-warm rounded-xl focus:ring-2 focus:ring-primary-dark focus:border-primary-dark"
                                        placeholder="3"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-text-primary mb-2">
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
                                        className="w-full px-4 py-3 border border-neutral-warm rounded-xl focus:ring-2 focus:ring-primary-dark focus:border-primary-dark"
                                        placeholder="85"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Ubicació */}
                        <div>
                            <h2 className="text-2xl font-semibold text-text-primary mb-5 tracking-tight">Ubicació</h2>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-text-primary mb-2">
                                        Municipi *
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.municipality}
                                        onChange={(e) =>
                                            setFormData({ ...formData, municipality: e.target.value })
                                        }
                                        className="w-full px-4 py-3 border border-neutral-warm rounded-xl focus:ring-2 focus:ring-primary-dark focus:border-primary-dark"
                                        placeholder="Barcelona"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-text-primary mb-2">
                                        Província *
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.province}
                                        onChange={(e) =>
                                            setFormData({ ...formData, province: e.target.value })
                                        }
                                        className="w-full px-4 py-3 border border-neutral-warm rounded-xl focus:ring-2 focus:ring-primary-dark focus:border-primary-dark"
                                        placeholder="Barcelona"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-text-primary mb-2">
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
                                        className="w-full px-4 py-3 border border-neutral-warm rounded-xl focus:ring-2 focus:ring-primary-dark focus:border-primary-dark"
                                        placeholder="Catalunya"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Característiques */}
                        <div>
                            <h2 className="text-2xl font-semibold text-text-primary mb-5 tracking-tight">
                                Característiques
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-text-primary mb-2">
                                        Plantes
                                    </label>
                                    <input
                                        type="number"
                                        min="1"
                                        value={formData.floors}
                                        onChange={(e) =>
                                            setFormData({ ...formData, floors: e.target.value })
                                        }
                                        className="w-full px-4 py-3 border border-neutral-warm rounded-xl focus:ring-2 focus:ring-primary-dark focus:border-primary-dark"
                                        placeholder="1"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-text-primary mb-2">
                                        Orientació
                                    </label>
                                    <select
                                        value={formData.orientation}
                                        onChange={(e) =>
                                            setFormData({ ...formData, orientation: e.target.value })
                                        }
                                        className="w-full px-4 py-3 border border-neutral-warm rounded-xl focus:ring-2 focus:ring-primary-dark focus:border-primary-dark"
                                    >
                                        <option value="">Selecciona...</option>
                                        <option value="nord">Nord</option>
                                        <option value="sud">Sud</option>
                                        <option value="est">Est</option>
                                        <option value="oest">Oest</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-text-primary mb-2">
                                        Estat
                                    </label>
                                    <select
                                        value={formData.condition}
                                        onChange={(e) =>
                                            setFormData({ ...formData, condition: e.target.value })
                                        }
                                        className="w-full px-4 py-3 border border-neutral-warm rounded-xl focus:ring-2 focus:ring-primary-dark focus:border-primary-dark"
                                    >
                                        <option value="nou">Nou</option>
                                        <option value="quasi_nou">Quasi nou</option>
                                        <option value="bon_estat">Bon estat</option>
                                        <option value="a_reformar">A reformar</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-text-primary mb-2">
                                        Etiqueta Energètica
                                    </label>
                                    <select
                                        value={formData.energy_label}
                                        onChange={(e) =>
                                            setFormData({ ...formData, energy_label: e.target.value })
                                        }
                                        className="w-full px-4 py-3 border border-neutral-warm rounded-xl focus:ring-2 focus:ring-primary-dark focus:border-primary-dark"
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
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={formData.has_elevator}
                                            onChange={(e) =>
                                                setFormData({
                                                    ...formData,
                                                    has_elevator: e.target.checked,
                                                })
                                            }
                                            className="w-4 h-4 text-primary-dark border-neutral-warm rounded focus:ring-primary-dark"
                                        />
                                        <span className="text-sm font-medium text-text-primary">
                                            Ascensor
                                        </span>
                                    </label>

                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={formData.is_furnished}
                                            onChange={(e) =>
                                                setFormData({
                                                    ...formData,
                                                    is_furnished: e.target.checked,
                                                })
                                            }
                                            className="w-4 h-4 text-primary-dark border-neutral-warm rounded focus:ring-primary-dark"
                                        />
                                        <span className="text-sm font-medium text-text-primary">
                                            Amoblat
                                        </span>
                                    </label>
                                </div>
                            </div>
                        </div>

                        {/* Imatges */}
                        <div>
                            <h2 className="text-2xl font-semibold text-text-primary mb-5 tracking-tight">Imatges</h2>
                            <ImageUploader
                                accessToken={(session as any)?.accessToken || ""}
                                images={images}
                                onChange={setImages}
                            />
                        </div>

                        {/* Privacitat */}
                        <div>
                            <h2 className="text-2xl font-semibold text-text-primary mb-5 tracking-tight">Privacitat</h2>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={formData.isPrivate}
                                    onChange={(e) =>
                                        setFormData({ ...formData, isPrivate: e.target.checked })
                                    }
                                    className="w-4 h-4 text-primary-dark border-neutral-warm rounded focus:ring-primary-dark"
                                />
                                <span className="text-sm font-medium text-text-primary">
                                    Immoble privat (amb requisits d'accés)
                                </span>
                            </label>
                        </div>

                        {/* Submit Button */}
                        <div className="flex gap-4 pt-6 border-t">
                            <button
                                type="button"
                                onClick={() => router.back()}
                                className="flex-1 bg-neutral-warm text-text-primary py-3 rounded-xl font-semibold hover:bg-neutral-beige transition"
                            >
                                Cancel·lar
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className="flex-1 bg-primary-dark text-white py-3 rounded-xl font-semibold hover:bg-primary transition disabled:opacity-50 disabled:cursor-not-allowed"
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
