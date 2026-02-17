// components/auth/RouteGuard.tsx
"use client";

import { useSession } from "next-auth/react";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { getPermissionsForPath } from "@/config/routes";
import { PermissionGuard } from "./PermissionGuard";

export function RouteGuard({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const [permissions, setPermissions] = useState<any>(null);

    useEffect(() => {
        // Get permissions for current path
        const routePermissions = getPermissionsForPath(pathname);
        setPermissions(routePermissions);
    }, [pathname]);

    // If no permissions required for this route, render children
    if (!permissions) {
        return <>{children}</>;
    }

    return (
        <PermissionGuard {...permissions}>
            {children}
        </PermissionGuard>
    );
}