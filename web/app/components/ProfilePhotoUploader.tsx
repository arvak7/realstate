"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";

interface ProfilePhotoUploaderProps {
    onPhotoUpdated?: (photoUrl: string) => void;
}

export default function ProfilePhotoUploader({ onPhotoUpdated }: ProfilePhotoUploaderProps) {
    const { data: session, update } = useSession();
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file type
        const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
        if (!validTypes.includes(file.type)) {
            setError('Només es permeten imatges JPG, PNG o WebP');
            return;
        }

        // Validate file size (5MB max)
        if (file.size > 5 * 1024 * 1024) {
            setError('La imatge no pot superar els 5MB');
            return;
        }

        setSelectedFile(file);
        setError(null);

        // Create preview
        const reader = new FileReader();
        reader.onloadend = () => {
            setPreview(reader.result as string);
        };
        reader.readAsDataURL(file);
    };

    const handleUpload = async () => {
        if (!selectedFile || !session?.accessToken) return;

        setUploading(true);
        setError(null);

        try {
            // Step 1: Get presigned upload URL
            const uploadUrlResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/me/profile-photo/upload-url`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.accessToken}`,
                },
                body: JSON.stringify({ filename: selectedFile.name }),
            });

            if (!uploadUrlResponse.ok) {
                throw new Error('Error obtenint URL de pujada');
            }

            const { uploadUrl, publicUrl } = await uploadUrlResponse.json();

            // Step 2: Upload file to MinIO
            const uploadResponse = await fetch(uploadUrl, {
                method: 'PUT',
                body: selectedFile,
                headers: {
                    'Content-Type': selectedFile.type,
                },
            });

            if (!uploadResponse.ok) {
                throw new Error('Error pujant la imatge');
            }

            // Step 3: Update database with photo URL
            const updateResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/me/profile-photo`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.accessToken}`,
                },
                body: JSON.stringify({ photoUrl: publicUrl }),
            });

            if (!updateResponse.ok) {
                throw new Error('Error actualitzant la foto de perfil');
            }

            // Update session
            await update();

            // Clear selection
            setSelectedFile(null);
            setPreview(null);

            if (onPhotoUpdated) {
                onPhotoUpdated(publicUrl);
            }
        } catch (err) {
            console.error('Upload error:', err);
            setError(err instanceof Error ? err.message : 'Error pujant la foto');
        } finally {
            setUploading(false);
        }
    };

    const handleDelete = async () => {
        if (!session?.accessToken) return;

        setUploading(true);
        setError(null);

        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/me/profile-photo`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${session.accessToken}`,
                },
            });

            if (!response.ok) {
                throw new Error('Error eliminant la foto');
            }

            // Update session
            await update();

            if (onPhotoUpdated) {
                onPhotoUpdated('');
            }
        } catch (err) {
            console.error('Delete error:', err);
            setError(err instanceof Error ? err.message : 'Error eliminant la foto');
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="space-y-4">
            {preview && (
                <div className="relative">
                    <img
                        src={preview}
                        alt="Preview"
                        className="w-32 h-32 rounded-full object-cover mx-auto"
                    />
                </div>
            )}

            <div className="flex flex-col gap-3">
                <label className="btn-outline cursor-pointer text-center">
                    <input
                        type="file"
                        accept="image/jpeg,image/jpg,image/png,image/webp"
                        onChange={handleFileSelect}
                        className="hidden"
                        disabled={uploading}
                    />
                    Seleccionar imatge
                </label>

                {selectedFile && (
                    <button
                        onClick={handleUpload}
                        disabled={uploading}
                        className="btn-primary justify-center disabled:opacity-50"
                    >
                        {uploading ? 'Pujant...' : 'Pujar foto'}
                    </button>
                )}

                {session?.user?.profilePhotoUrl && !selectedFile && (
                    <button
                        onClick={handleDelete}
                        disabled={uploading}
                        className="btn-outline justify-center text-red-600 border-red-600 hover:bg-red-50 disabled:opacity-50"
                    >
                        {uploading ? 'Eliminant...' : 'Eliminar foto'}
                    </button>
                )}
            </div>

            {error && (
                <div className="bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-xl text-sm">
                    {error}
                </div>
            )}

            <p className="text-xs text-kindred-gray text-center">
                Formats permesos: JPG, PNG, WebP. Mida màxima: 5MB
            </p>
        </div>
    );
}
