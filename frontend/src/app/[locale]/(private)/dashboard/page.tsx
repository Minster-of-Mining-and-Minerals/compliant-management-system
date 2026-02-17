"use client";
import VariantStatasCard from "@/components/dashboard/VariantStatasCard";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { PermissionGuard } from "@/components/auth/PermissionGuard";

export default function DashboardPage() {
  return (
    <PermissionGuard anyPermissions={["DASHBOARD:VIEW"]}>
      <main className="flex flex-col space-y-6">
        <VariantStatasCard />
        <DashboardLayout />
      </main>
    </PermissionGuard>

  );
}
