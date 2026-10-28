import { PermissionKey } from "@/lib/permissions";
import {
  LayoutDashboard,
  ClipboardCheck,
  FileText,
  User2,
  Shield,
  Key,
  Building2,
  Tags,
  AlertTriangle,
  MessageSquare,
} from "lucide-react";

export type NavItem = {
  title: string;
  url: string;
  icon: any;
  /** Sidebar group heading for top-level items (consecutive items with the same section share one heading) */
  section?: string;
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
    section: "Overview",
    anyPermissions: ["DASHBOARD:VIEW"],
  },
  {
    title: "Complaints",
    url: "/compliants",
    icon: AlertTriangle,
    section: "Complaints",
    anyPermissions: ["COMPLAINT:READ_ALL"],
  },
  {
    title: "My Complaints",
    url: "/my-complaints",
    icon: ClipboardCheck,
    section: "Complaints",
    anyPermissions: ["COMPLAINT:READ_OWN"],
  },
  {
    title: "Feedbacks",
    url: "/feedbacks",
    icon: MessageSquare,
    section: "Complaints",
    anyPermissions: ["FEEDBACK:READ"],
  },
  {
    title: "Base Data",
    section: "Administration",
    url: "/basedata",
    icon: FileText,
    // Shown if the user can see either section; each child is filtered by its own permission
    anyPermissions: ["SECTOR:READ", "COMPLAINT_CATEGORIES:READ"],
    children: [
      {
        title: "Sectors",
        url: "/basedata/sectors",
        icon: Building2,
        allPermissions: ["SECTOR:READ"],
      },
      {
        title: "Complaint Categories",
        url: "/basedata/complaint-categories",
        icon: Tags,
        allPermissions: ["COMPLAINT_CATEGORIES:READ"],
      },
    ],
  },
  {
    title: "Users",
    url: "/users",
    icon: User2,
    section: "Administration",
    anyPermissions: ["USERS:READ", "ROLES:READ", "PERMISSIONS:READ"],
    children: [
      {
        title: "Users List",
        url: "/users/list",
        icon: User2,
        allPermissions: ["USERS:READ"],
      },
      {
        title: "Role Management",
        url: "/users/roles",
        icon: Shield,
        allPermissions: ["ROLES:READ"],
      },
      {
        title: "Permission Management",
        url: "/users/permissions",
        icon: Key,
        allPermissions: ["PERMISSIONS:READ"],
      },
    ],
  },
];
