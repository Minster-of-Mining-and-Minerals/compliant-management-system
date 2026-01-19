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
import Image from "next/image";

// Navigation items - update these based on your app's needs
const navigationItems = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Feedbacks",
    url: "/feedbacks",
    icon: ClipboardCheck,
  },
  {
    title: "Compliants",
    url: "/compliants",
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
              className="flex items-center flex-col "
            >
              <Image
                src="/logo-only.png"
                alt="Minister of Mining Logo"
                width={100}
                height={100}
                className="mx-auto mb-1 rounded-xl p-2"
              />
              <div className="grid flex-1 group-data-[collapsible=icon]:opacity-0 text-center gap-1 text-sm leading-tight">
                <span className="truncate font-semibold text-golden-dark">
                  Minister of Mining
                </span>
                <span className="truncate text-golden-dark">
                  Compliance Management System
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
                    className="text-primary hover:bg-golden-metallic px-5 py-5 group-data-[collapsible=icon]:px-2 group-data-[collapsible=icon]:justify-center data-[active=true]:bg-golden-dark data-[active=true]:text-primary-foreground"
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
                      className="text-primary hover:bg-golden-metallic hover:data-[active=false]:bg-golden-metallic hover:data-[active=true]:bg-golden-dark hover:data-[active=true]:text-primary-foreground px-5 py-5 group-data-[collapsible=icon]:px-2 group-data-[collapsible=icon]:justify-center data-[active=true]:bg-golden-dark data-[active=true]:text-primary-foreground"
                    >
                      <Users className="group-data-[collapsible=icon]:size-5" />
                      <span className="text-base group-data-[collapsible=icon]:hidden">Users</span>
                      <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90 group-data-[collapsible=icon]:hidden" />
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <SidebarMenuSub className="pt-1">
                      {userManagementItems.map((subItem) => (
                        <SidebarMenuSubItem key={subItem.title}>
                          <SidebarMenuSubButton
                            asChild
                            isActive={pathname === subItem.url}
                            className="text-primary hover:bg-golden-metallic hover:data-[active=false]:bg-golden-metallic hover:data-[active=true]:bg-golden-metallic hover:data-[active=true]:text-primary-foreground group-data-[collapsible=icon]:justify-center data-[active=true]:bg-golden-metallic data-[active=true]:text-primary hover:data-[active=true]:text-primary"
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