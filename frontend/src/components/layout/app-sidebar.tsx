"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  ClipboardCheck,
  Car,
  FileText,
  ChevronRight,
  Shield,
  Key,
  User2,
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
} from "@/components/ui/sidebar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"

// Navigation items - update these based on your app's needs
const navigationItems = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Evaluations",
    url: "/evaluations",
    icon: ClipboardCheck,
  },
  {
    title: "Base Data",
    url: "/basedata",
    icon: FileText,
  },
];

// Nested menu for User Management
const userManagementItems = [
  {
    title: "Users List",
    url: "/users/list",
    icon: User2,
  },
  {
    title: "Role Management",
    url: "/users/roles",
    icon: Shield,
  },
  {
    title: "Permission Management",
    url: "/users/permissions",
    icon: Key,
  },
];

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <Sidebar collapsible="icon" variant="floating" className="">
      <SidebarHeader className="py-10">
        <SidebarMenu>
          <SidebarMenuItem>
            <Link
              href="/dashboard"
              className="flex items-center flex-col gap-2"
            >
              <div className="flex aspect-square p-3 group-data-[collapsible=icon]:aspect-square group-data-[collapsible=icon]:size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                LOGO
              </div>
              <div className="grid flex-1 group-data-[collapsible=icon]:opacity-0 text-center gap-1 text-sm leading-tight">
                <span className="truncate font-semibold">
                  Driving Evaluation
                </span>
                <span className="truncate text-muted-foreground">
                  Management System
                </span>
              </div>
            </Link>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup className="px-5 group-data-[collapsible=icon]:px-0">
          <SidebarGroupContent>
            <SidebarMenu className="gap-2 group-data-[collapsible=icon]:items-center">
              {navigationItems.map((item) => (
                <SidebarMenuItem
                  key={item.title}
                  className="group-data-[collapsible=icon]:w-fit"
                >
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === item.url}
                    tooltip={item.title}
                    className="text-primary px-5 py-5 group-data-[collapsible=icon]:px-2 group-data-[collapsible=icon]:justify-center data-[active=true]:bg-primary data-[active=true]:text-primary-foreground"
                  >
                    <Link
                      href={item.url}
                      className="flex group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:items-center"
                    >
                      <item.icon className="group-data-[collapsible=icon]:size-5" />
                      <span className="text-base group-data-[collapsible=icon]:hidden">
                        {item.title}
                      </span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}

              {/* Users with nested menu */}
              <Collapsible asChild defaultOpen={pathname.startsWith("/users")} className="group/collapsible">
                <SidebarMenuItem className="group-data-[collapsible=icon]:w-fit">
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton
                      tooltip="Users"
                      isActive={pathname.startsWith("/users")}
                      className="text-primary px-5 py-5 group-data-[collapsible=icon]:px-2 group-data-[collapsible=icon]:justify-center data-[active=true]:bg-primary data-[active=true]:text-primary-foreground"
                    >
                      <Users className="group-data-[collapsible=icon]:size-5" />
                      <span className="text-base group-data-[collapsible=icon]:hidden">Users</span>
                      <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90 group-data-[collapsible=icon]:hidden" />
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <SidebarMenuSub>
                      {userManagementItems.map((subItem) => (
                        <SidebarMenuSubItem key={subItem.title}>
                          <SidebarMenuSubButton
                            asChild
                            isActive={pathname === subItem.url}
                          >
                            <Link href={subItem.url}>
                              <subItem.icon className="h-4 w-4" />
                              <span>{subItem.title}</span>
                            </Link>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      ))}
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </SidebarMenuItem>
              </Collapsible>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}