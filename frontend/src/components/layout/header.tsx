"use client";

import { SidebarTrigger } from "@/components/ui/sidebar";
import { NavUser } from "./nav-user";
import { Button } from "@/components/ui/button";
import { Bell } from "lucide-react";
import { useSession } from "next-auth/react";
import NotificationDropdown from "./NotificationDropdown";
import HeaderBreadcrumb from "../common/HeaderBreadcrumb";
import { useGetProfileQuery } from "@/redux/api/profileApi";

interface HeaderProps {
  title?: string;
}



export function Header({ title }: HeaderProps) {
  const notificationCount = 3; // Replace with actual notification count
  const { data: session } = useSession();
  const { data: profileResponse, isLoading: isLoadingProfile } = useGetProfileQuery();
  const userData = {
    name: session?.user?.name ?? "User",
    email: session?.user?.email ?? "",
    avatar: profileResponse?.data?.profileImage?.file_path ?? undefined,
  };
  console.log(profileResponse);

  return (
    <header className="flex z-30 sticky shadow-md top-2 border h-16 shrink-0 items-center gap-2 px-4 rounded-xl bg-sidebar text-sidebar-foreground m-2 mb-0">
      <SidebarTrigger className="-ml-1" />
      <HeaderBreadcrumb />
      <div className="ml-auto flex items-center gap-2">
        {/* Notification Button */}
        <div className="flex items-center gap-2 2xsm:gap-3">
          {/* <ThemeToggleButton /> */}
          <NotificationDropdown />
        </div>
        <NavUser user={userData} />
      </div>
    </header>
  );
}