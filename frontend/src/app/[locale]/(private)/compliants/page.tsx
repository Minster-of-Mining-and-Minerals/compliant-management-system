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
      label: "Complaints",
      icon: <Users className="h-4 w-4" />,
      variant: activeTab === "complaints" ? "default" : "outline",
      size: "default",
      onClick: () => setActiveTab("complaints"),
    },
    {
      label: "Complainants",
      icon: <Users className="h-4 w-4" />,
      variant: activeTab === "complainants" ? "default" : "outline",
      size: "default",
      onClick: () => setActiveTab("complainants"),
    },
  ];

  return (
    <>
      {activeTab === "complaints" && (
        <ComplaintTable sideActions={sideActions} />
      )}
      {
        activeTab === "complainants" && (
          <ExternalUserTable sideActions={sideActions} />
        )
      }
    </>
  );
}

export default Compliants;
