"use client";

import { useState } from "react";

interface UserAvatarProps {
    photoUrl?: string | null;
    name?: string | null;
    size?: 'sm' | 'md' | 'lg';
    className?: string;
}

const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-16 h-16 text-lg'
};

export default function UserAvatar({ photoUrl, name, size = 'md', className = '' }: UserAvatarProps) {
    const [imgError, setImgError] = useState(false);

    // Get initials from name
    const getInitials = (name: string | null | undefined): string => {
        if (!name) return '?';
        const parts = name.trim().split(' ');
        if (parts.length >= 2) {
            return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
        }
        return name.substring(0, 2).toUpperCase();
    };

    // Generate a consistent color based on name
    const getColorFromName = (name: string | null | undefined): string => {
        if (!name) return 'bg-kindred-dark';
        const colors = [
            'bg-blue-500',
            'bg-green-500',
            'bg-purple-500',
            'bg-pink-500',
            'bg-indigo-500',
            'bg-teal-500',
        ];
        const index = name.charCodeAt(0) % colors.length;
        return colors[index];
    };

    if (photoUrl && !imgError) {
        return (
            <img
                src={photoUrl}
                alt={name || 'User'}
                className={`${sizeClasses[size]} rounded-full object-cover ${className}`}
                onError={() => setImgError(true)}
            />
        );
    }

    return (
        <div
            className={`${sizeClasses[size]} rounded-full flex items-center justify-center text-white font-medium ${getColorFromName(name)} ${className}`}
        >
            {getInitials(name)}
        </div>
    );
}
