"use client";
import ComplaintTable from "@/features/complaint-management/component/ComplaintList";
import { Users } from "lucide-react";
import { useState } from "react";
import ExternalUserTable from "@/features/user-management/api/component/ExternalUserTable";
import { ActionButton } from "@/types/tableLayout";
function Compliants() {
  const [activeTab, setActiveTab] = useState<"complaints" | "complainants">(
    "complaints"
  );

  const sideActions: ActionButton[] = [
    {
      label: "Internal Complaints",
      icon: <Users className="h-4 w-4" />,
      variant: activeTab === "complaints" ? "default" : "outline",
      size: "default",
      onClick: () => setActiveTab("complaints"),
    },
    {
      label: "External Complaints",
      icon: <Users className="h-4 w-4" />,
      variant: activeTab === "complainants" ? "default" : "outline",
      size: "default",
      onClick: () => setActiveTab("complainants"),
    },
  ];

  return (
    <>
      {activeTab === "complaints" && (
        <ComplaintTable sideActions={sideActions} userType="internal" />
      )}
      {
        activeTab === "complainants" && (
          <ComplaintTable sideActions={sideActions} userType="external" />
        )
      }
    </>
  );
}

export default Compliants;
