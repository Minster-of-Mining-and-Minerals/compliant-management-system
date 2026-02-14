import { PermissionKey } from "@/lib/permissions";
import {
  LayoutDashboard,
  ClipboardCheck,
  FileText,
  User2,
  Shield,
  Key,
} from "lucide-react";

export type NavItem = {
  title: string;
  url: string;
  icon: any;
  anyPermissions?: PermissionKey[];
  allPermissions?: PermissionKey[];
  onlyPermissions?: PermissionKey[];
  children?: NavItem[];
};

export const NAVIGATION: NavItem[] = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: LayoutDashboard,
    anyPermissions: [
      //   "DASHBOARD:VIEW",
      "DASHBOARD:VIEW_ALL",
      "DASHBOARD:VIEW_OWN",
    ],
  },
  {
    title: "Feedbacks",
    url: "/feedbacks",
    icon: ClipboardCheck,
    // anyPermissions: ["FEEDBACK:VIEW"],
  },
  {
    title: "My Complaints",
    url: "/my-complaints",
    icon: ClipboardCheck,
    // anyPermissions: ["COMPLAINT:CREATE"],
  },
  {
    title: "Compliants",
    url: "/compliants",
    icon: ClipboardCheck,
    // anyPermissions: ["COMPLAINT:VIEW", "COMPLAINT:MANAGE"],
  },
  {
    title: "Base Data",
    url: "/basedata",
    icon: FileText,
    // allPermissions: ["BASEDATA:MANAGE"],
  },
  {
    title: "Users",
    url: "/users",
    icon: User2,
    // anyPermissions: ["USER:VIEW", "ROLE:VIEW", "PERMISSION:VIEW"],
    children: [
      {
        title: "Users List",
        url: "/users/list",
        icon: User2,
        // allPermissions: ["USER:VIEW"],
      },
      {
        title: "Role Management",
        url: "/users/roles",
        icon: Shield,
        // allPermissions: ["ROLE:VIEW"],
      },
      {
        title: "Permission Management",
        url: "/users/permissions",
        icon: Key,
        // allPermissions: ["PERMISSION:VIEW"],
      },
    ],
  },
];
