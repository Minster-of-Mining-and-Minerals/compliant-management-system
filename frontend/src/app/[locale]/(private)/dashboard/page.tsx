"use client";
import VariantStatasCard from "@/components/dashboard/VariantStatasCard";
import DashboardLayout from "@/components/dashboard/DashboardLayout";

export default function DashboardPage() {
  return (
    <main className="flex flex-col space-y-6">
      <VariantStatasCard />
      <DashboardLayout />
    </main>
  );
}
