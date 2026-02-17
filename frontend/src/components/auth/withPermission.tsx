// components/auth/withPermission.tsx
import { PermissionKey } from "@/lib/permissions";
import { PermissionGuard } from "./PermissionGuard";

export function withPermission<P extends object>(
    Component: React.ComponentType<P>,
    permissions: {
        anyPermissions?: PermissionKey[];
        allPermissions?: PermissionKey[];
        onlyPermissions?: PermissionKey[];
        redirectTo?: string;
    }
) {
    return function ProtectedComponent(props: P) {
        return (
            <PermissionGuard {...permissions}>
                <Component {...props} />
            </PermissionGuard>
        );
    };
}