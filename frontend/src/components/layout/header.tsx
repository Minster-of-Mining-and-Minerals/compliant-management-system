"use client";

import { SidebarTrigger } from "@/components/ui/sidebar";
import NotificationDropdown from "./NotificationDropdown";
import HeaderBreadcrumb from "../common/HeaderBreadcrumb";

interface HeaderProps {
  title?: string;
}

/**
 * Navy admin top bar (layout A4): sidebar toggle, breadcrumb + page title, notifications.
 * The profile lives in the sidebar footer (SidebarUserCard).
 */
export function Header({ title }: HeaderProps) {
  return (
    <header className="sticky top-0 z-30 flex shrink-0 flex-col bg-primary text-white">
      {/* Matches the height of the sidebar's flag stripe */}
      <div aria-hidden className="h-1" />
      <div className="flex h-16 items-center gap-3 border-b-[3px] border-golden-bright px-4 sm:px-6">
        <SidebarTrigger className="h-10 w-10 shrink-0 rounded-lg bg-white/10 text-white hover:bg-white/20 hover:text-white" />
        <HeaderBreadcrumb variant="dark" />
        <div className="ml-auto flex items-center gap-2">
          <NotificationDropdown variant="dark" />
        </div>
      </div>
    </header>
  );
}
