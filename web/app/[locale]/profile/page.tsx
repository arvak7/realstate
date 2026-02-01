"use client";

import { useSession } from "next-auth/react";
import UserAvatar from "../../components/UserAvatar";
import ProfilePhotoUploader from "../../components/ProfilePhotoUploader";

export default function ProfilePage() {
    const { data: session } = useSession();

    if (!session) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <p className="text-kindred-gray">Has d'iniciar sessió per veure el teu perfil</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-neutral-warm/30">
            <div className="max-w-4xl mx-auto px-6 py-12">
                <h1 className="text-3xl font-bold text-kindred-dark mb-8">El meu perfil</h1>

                <div className="bg-white rounded-2xl shadow-sm p-8 space-y-8">
                    {/* Profile Photo Section */}
                    <div className="flex flex-col md:flex-row gap-8 items-start">
                        <div className="flex flex-col items-center gap-4">
                            <UserAvatar
                                photoUrl={session.user?.effectiveProfileImage}
                                name={session.user?.name}
                                size="lg"
                            />
                            <h2 className="text-xl font-semibold text-kindred-dark">
                                {session.user?.name || 'Usuari'}
                            </h2>
                        </div>

                        <div className="flex-1">
                            <h3 className="text-lg font-medium text-kindred-dark mb-4">
                                Foto de perfil
                            </h3>
                            <ProfilePhotoUploader />
                        </div>
                    </div>

                    <hr className="border-gray-200" />

                    {/* User Info Section */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-medium text-kindred-dark mb-4">
                            Informació personal
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-kindred-gray mb-1">
                                    Nom
                                </label>
                                <div className="px-4 py-3 bg-neutral-warm/50 rounded-xl text-kindred-dark">
                                    {session.user?.name || 'No especificat'}
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-kindred-gray mb-1">
                                    Email
                                </label>
                                <div className="px-4 py-3 bg-neutral-warm/50 rounded-xl text-kindred-dark">
                                    {session.user?.email}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
