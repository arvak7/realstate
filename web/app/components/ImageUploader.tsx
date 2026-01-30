"use client";

import { useState, useRef, useCallback } from "react";

export interface UploadedImage {
    url: string;
    order: number;
    is_main: boolean;
}

interface ImageFile {
    id: string;
    file: File;
    preview: string;
    progress: number;
    status: "pending" | "uploading" | "done" | "error";
    url?: string;
    error?: string;
}

interface ImageUploaderProps {
    accessToken: string;
    images: UploadedImage[];
    onChange: (images: UploadedImage[]) => void;
    maxImages?: number;
    maxSizeMB?: number;
}

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const ALLOWED_EXTENSIONS = ["jpg", "jpeg", "png", "webp"];

function getExtensionFromType(type: string): string {
    const map: Record<string, string> = {
        "image/jpeg": "jpg",
        "image/png": "png",
        "image/webp": "webp",
    };
    return map[type] || "jpg";
}

export default function ImageUploader({
    accessToken,
    images,
    onChange,
    maxImages = 10,
    maxSizeMB = 10,
}: ImageUploaderProps) {
    const [files, setFiles] = useState<ImageFile[]>([]);
    const [dragActive, setDragActive] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    const validateFile = (file: File): string | null => {
        if (!ALLOWED_TYPES.includes(file.type)) {
            return `Format no vàlid: ${file.name}. Formats permesos: JPEG, PNG, WebP`;
        }
        if (file.size > maxSizeMB * 1024 * 1024) {
            return `Fitxer massa gran: ${file.name}. Màxim ${maxSizeMB}MB`;
        }
        return null;
    };

    const uploadFile = async (imageFile: ImageFile) => {
        try {
            // Get presigned URL
            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/properties/upload-url`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${accessToken}`,
                    },
                    body: JSON.stringify({ contentType: imageFile.file.type }),
                }
            );

            if (!response.ok) {
                throw new Error("Error obtenint URL de pujada");
            }

            const { uploadUrl, viewUrl } = await response.json();

            // Upload with XHR for progress tracking
            return new Promise<string>((resolve, reject) => {
                const xhr = new XMLHttpRequest();

                xhr.upload.addEventListener("progress", (event) => {
                    if (event.lengthComputable) {
                        const progress = Math.round((event.loaded / event.total) * 100);
                        setFiles((prev) =>
                            prev.map((f) =>
                                f.id === imageFile.id ? { ...f, progress } : f
                            )
                        );
                    }
                });

                xhr.addEventListener("load", () => {
                    if (xhr.status >= 200 && xhr.status < 300) {
                        resolve(viewUrl);
                    } else {
                        reject(new Error("Error pujant imatge"));
                    }
                });

                xhr.addEventListener("error", () => {
                    reject(new Error("Error de xarxa"));
                });

                xhr.open("PUT", uploadUrl);
                xhr.setRequestHeader("Content-Type", imageFile.file.type);
                xhr.send(imageFile.file);
            });
        } catch (error) {
            throw error;
        }
    };

    const processFiles = async (selectedFiles: FileList | File[]) => {
        const fileArray = Array.from(selectedFiles);
        const currentCount = images.length + files.filter((f) => f.status !== "error").length;
        const remainingSlots = maxImages - currentCount;

        if (remainingSlots <= 0) {
            alert(`Ja has arribat al màxim de ${maxImages} imatges`);
            return;
        }

        const filesToProcess = fileArray.slice(0, remainingSlots);

        // Validate and create previews
        const newFiles: ImageFile[] = [];
        for (const file of filesToProcess) {
            const error = validateFile(file);
            if (error) {
                alert(error);
                continue;
            }

            const imageFile: ImageFile = {
                id: `${Date.now()}-${Math.random().toString(36).substring(7)}`,
                file,
                preview: URL.createObjectURL(file),
                progress: 0,
                status: "pending",
            };
            newFiles.push(imageFile);
        }

        if (newFiles.length === 0) return;

        setFiles((prev) => [...prev, ...newFiles]);

        // Upload each file
        for (const imageFile of newFiles) {
            setFiles((prev) =>
                prev.map((f) =>
                    f.id === imageFile.id ? { ...f, status: "uploading" } : f
                )
            );

            try {
                const url = await uploadFile(imageFile);

                setFiles((prev) =>
                    prev.map((f) =>
                        f.id === imageFile.id
                            ? { ...f, status: "done", url, progress: 100 }
                            : f
                    )
                );

                // Add to images array
                const newImage: UploadedImage = {
                    url,
                    order: images.length,
                    is_main: images.length === 0, // First image is main by default
                };

                onChange([...images, newImage]);
            } catch (error) {
                setFiles((prev) =>
                    prev.map((f) =>
                        f.id === imageFile.id
                            ? {
                                  ...f,
                                  status: "error",
                                  error: error instanceof Error ? error.message : "Error desconegut",
                              }
                            : f
                    )
                );
            }
        }
    };

    const handleDrag = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);

        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            processFiles(e.dataTransfer.files);
        }
    }, [images, files]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            processFiles(e.target.files);
            // Reset input so the same file can be selected again
            e.target.value = "";
        }
    };

    const removeImage = (index: number) => {
        const newImages = images.filter((_, i) => i !== index);

        // If we removed the main image, set the first one as main
        if (images[index].is_main && newImages.length > 0) {
            newImages[0].is_main = true;
        }

        // Update order
        const reordered = newImages.map((img, i) => ({ ...img, order: i }));
        onChange(reordered);
    };

    const setMainImage = (index: number) => {
        const newImages = images.map((img, i) => ({
            ...img,
            is_main: i === index,
        }));
        onChange(newImages);
    };

    const removePendingFile = (id: string) => {
        setFiles((prev) => {
            const file = prev.find((f) => f.id === id);
            if (file) {
                URL.revokeObjectURL(file.preview);
            }
            return prev.filter((f) => f.id !== id);
        });
    };

    return (
        <div className="space-y-4">
            {/* Drop zone */}
            <div
                className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                    dragActive
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-300 hover:border-gray-400"
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
            >
                <input
                    ref={inputRef}
                    type="file"
                    multiple
                    accept={ALLOWED_TYPES.join(",")}
                    onChange={handleInputChange}
                    className="hidden"
                />

                <svg
                    className="mx-auto h-12 w-12 text-gray-400"
                    stroke="currentColor"
                    fill="none"
                    viewBox="0 0 48 48"
                >
                    <path
                        d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                        strokeWidth={2}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                </svg>

                <p className="mt-4 text-sm text-gray-600">
                    <button
                        type="button"
                        onClick={() => inputRef.current?.click()}
                        className="font-medium text-blue-600 hover:text-blue-500"
                    >
                        Selecciona fitxers
                    </button>{" "}
                    o arrossega'ls aquí
                </p>
                <p className="mt-2 text-xs text-gray-500">
                    JPEG, PNG o WebP. Màxim {maxSizeMB}MB per imatge. Fins a {maxImages} imatges.
                </p>
            </div>

            {/* Uploading files */}
            {files.filter((f) => f.status === "uploading" || f.status === "pending").length > 0 && (
                <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-700">Pujant...</p>
                    {files
                        .filter((f) => f.status === "uploading" || f.status === "pending")
                        .map((file) => (
                            <div
                                key={file.id}
                                className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg"
                            >
                                <img
                                    src={file.preview}
                                    alt="Preview"
                                    className="w-12 h-12 object-cover rounded"
                                />
                                <div className="flex-1">
                                    <p className="text-sm text-gray-700 truncate">
                                        {file.file.name}
                                    </p>
                                    <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                                        <div
                                            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                            style={{ width: `${file.progress}%` }}
                                        />
                                    </div>
                                </div>
                                <span className="text-sm text-gray-500">{file.progress}%</span>
                            </div>
                        ))}
                </div>
            )}

            {/* Error files */}
            {files.filter((f) => f.status === "error").length > 0 && (
                <div className="space-y-2">
                    <p className="text-sm font-medium text-red-600">Errors</p>
                    {files
                        .filter((f) => f.status === "error")
                        .map((file) => (
                            <div
                                key={file.id}
                                className="flex items-center gap-3 p-2 bg-red-50 rounded-lg"
                            >
                                <img
                                    src={file.preview}
                                    alt="Preview"
                                    className="w-12 h-12 object-cover rounded opacity-50"
                                />
                                <div className="flex-1">
                                    <p className="text-sm text-gray-700 truncate">
                                        {file.file.name}
                                    </p>
                                    <p className="text-xs text-red-600">{file.error}</p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => removePendingFile(file.id)}
                                    className="text-red-600 hover:text-red-800"
                                >
                                    <svg
                                        className="w-5 h-5"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M6 18L18 6M6 6l12 12"
                                        />
                                    </svg>
                                </button>
                            </div>
                        ))}
                </div>
            )}

            {/* Uploaded images */}
            {images.length > 0 && (
                <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">
                        Imatges pujades ({images.length}/{maxImages})
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                        {images.map((image, index) => (
                            <div
                                key={image.url}
                                className={`relative group rounded-lg overflow-hidden border-2 ${
                                    image.is_main
                                        ? "border-blue-500"
                                        : "border-transparent"
                                }`}
                            >
                                <img
                                    src={image.url}
                                    alt={`Imatge ${index + 1}`}
                                    className="w-full h-32 object-cover"
                                />

                                {/* Main badge */}
                                {image.is_main && (
                                    <div className="absolute top-2 left-2 bg-blue-600 text-white text-xs px-2 py-1 rounded">
                                        Principal
                                    </div>
                                )}

                                {/* Hover overlay */}
                                <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                    {!image.is_main && (
                                        <button
                                            type="button"
                                            onClick={() => setMainImage(index)}
                                            className="bg-white text-gray-800 px-2 py-1 rounded text-xs font-medium hover:bg-gray-100"
                                            title="Establir com a principal"
                                        >
                                            Principal
                                        </button>
                                    )}
                                    <button
                                        type="button"
                                        onClick={() => removeImage(index)}
                                        className="bg-red-600 text-white px-2 py-1 rounded text-xs font-medium hover:bg-red-700"
                                        title="Eliminar"
                                    >
                                        Eliminar
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
