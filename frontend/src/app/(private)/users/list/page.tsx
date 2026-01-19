"use client";
import ExternalUserTable from "@/features/user-management/api/component/ExternalUserTable";
import InternalUserTable from "@/features/user-management/api/component/InternalUserTable";
import { ActionButton } from "@/types/tableLayout";
import { Users } from "lucide-react";
import { useState } from "react";

function UsersList() {
    const [activeTab, setActiveTab] = useState<"internal" | "external">(
        "internal"
    );
    const sideActions: ActionButton[] = [
        {
            label: "Internal Users",
            icon: <Users className="h-4 w-4" />,
            variant: activeTab === "internal" ? "default" : "outline",
            size: "default",
            onClick: () => setActiveTab("internal"),
        },
        {
            label: "External Users",
            icon: <Users className="h-4 w-4" />,
            variant: activeTab === "external" ? "default" : "outline",
            size: "default",
            onClick: () => setActiveTab("external"),
        },
    ];
    return (
        <>
            {/* Pass sideActions to your layout/header if needed */}
            {activeTab === "internal" && (
                <InternalUserTable sideActions={sideActions} />
            )}
            {activeTab === "external" && (
                <ExternalUserTable sideActions={sideActions} />
            )}
        </>
    );
}

export default UsersList;