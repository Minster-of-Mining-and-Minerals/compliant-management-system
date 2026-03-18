"use client";
import { useState } from "react";
import VariantStatasCard from "@/components/dashboard/VariantStatasCard";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { PermissionGuard } from "@/components/auth/PermissionGuard";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MessageSquareWarning, MessageSquareHeart } from "lucide-react";

export default function DashboardPage() {
  const [dataType, setDataType] = useState<"complaint" | "feedback">("complaint");

  return (
    <PermissionGuard anyPermissions={["DASHBOARD:VIEW"]}>
      <main className="flex flex-col space-y-6">
        {/* Toggle between Complaint and Feedback */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-primary">Dashboard</h1>
          <Tabs value={dataType} onValueChange={(v) => setDataType(v as "complaint" | "feedback")}>
            <TabsList className="bg-slate-100 p-1 rounded-lg">
              <TabsTrigger value="complaint" className="flex items-center gap-2 px-4 py-2">
                <MessageSquareWarning className="h-4 w-4" />
                Complaints
              </TabsTrigger>
              <TabsTrigger value="feedback" className="flex items-center gap-2 px-4 py-2">
                <MessageSquareHeart className="h-4 w-4" />
                Feedbacks
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {dataType === "complaint" && <VariantStatasCard dataType={dataType} />}
        <DashboardLayout dataType={dataType} />
      </main>
    </PermissionGuard>
  );
}
