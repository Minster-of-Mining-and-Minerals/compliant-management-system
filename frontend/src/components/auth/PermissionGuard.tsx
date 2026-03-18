// components/auth/PermissionGuard.tsx
"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { PermissionKey } from "@/lib/permissions";
import { Loader2 } from "lucide-react";
import { usePermissions } from "@/hooks/usePermissions";

interface PermissionGuardProps {
    children: React.ReactNode;
    anyPermissions?: PermissionKey[];
    allPermissions?: PermissionKey[];
    onlyPermissions?: PermissionKey[];
    fallback?: React.ReactNode;
    redirectTo?: string;
}

export function PermissionGuard({
    children,
    anyPermissions,
    allPermissions,
    onlyPermissions,
    fallback,
    redirectTo = "/dashboard", // Default redirect if no access
}: PermissionGuardProps) {
    const { status } = useSession();
    const router = useRouter();
    const { permissions: userPermissions, isLoading: isPermissionsLoading, check } = usePermissions();

    const isLoading = status === "loading" || (status === "authenticated" && isPermissionsLoading);

    useEffect(() => {
        // Wait for session and permissions to load
        if (isLoading) return;

        // If not authenticated, let middleware handle it
        if (status === "unauthenticated") return;

        // Check permissions
        const hasAccess = check({
            anyPermissions,
            allPermissions,
            onlyPermissions,
        });

        if (!hasAccess) {
            router.push(redirectTo);
        }
    }, [isLoading, status, userPermissions, anyPermissions, allPermissions, onlyPermissions, redirectTo, router, check]);

    // Show loading state
    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
            </div>
        );
    }

    // If not authenticated, let middleware handle it (don't render anything)
    if (status === "unauthenticated") {
        return null;
    }

    // Check permissions for initial render
    const hasAccess = check({
        anyPermissions,
        allPermissions,
        onlyPermissions,
    });

    if (!hasAccess) {
        // Return fallback if provided, otherwise null (redirect will happen)
        return fallback || null;
    }

    return <>{children}</>;
}