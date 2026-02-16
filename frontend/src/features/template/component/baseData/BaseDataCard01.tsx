"use client";

import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Eye, FileText, Users, Car, Building } from "lucide-react";
import { useRouter } from "next/navigation";
import { PermissionGuard } from "@/features/complaint-management/component/PermissionGuard";
import { useSession } from "next-auth/react";
import { hasAnyPermission, PermissionKey } from "@/lib/permissions";

const dataCards: DataCardItem[] = [
  {
    id: 1,
    title: "Sectors",
    subtitle: "All registered sectors",
    icon: Building,
    link: "/basedata/sectors",
    permission: ["SECTOR:READ", "SECTOR:UPDATE", "SECTOR:DELETE", "SECTOR:CREATE"],
  },
  {
    id: 0,
    title: "Complaint Categories",
    subtitle: "All registered complaint categories",
    icon: FileText,
    link: "/basedata/complaint-categories",
    permission: ["COMPLAINT_CATEGORIES:READ", "COMPLAINT_CATEGORIES:UPDATE", "COMPLAINT_CATEGORIES:DELETE", "COMPLAINT_CATEGORIES:CREATE"],
  },

];


function BaseDataCard01() {
  const router = useRouter();
  const { data: session } = useSession();
  const userPermissions = (session?.user?.permissions ?? []) as PermissionKey[];

  return (
    <div className="flex min-h-[calc(100vh-150px)] rounded-lg flex-col bg-white p-5 ">
      <h1 className="text-2xl font-bold text-primary">Base Data</h1>
      <p className="text-sm text-muted-foreground">Manage all your base data here</p>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 mt-6 ">
        {dataCards
          .filter((item) => hasAnyPermission(userPermissions, item.permission)) // ✅ Only show if user has at least one permission
          .map((item) => {
            const Icon = item.icon;

            return (
              <Card
                key={item.id}
                onClick={() => router.push(item.link)}
                className="flex gap-5 bg-golden-metallic shadow-md hover:shadow-xl transition-shadow duration-300  rounded-3xl justify-between items-center p-4   border border-gray-200 dark:bg-gray-800 dark:border-gray-700 w-full"
              >
                <CardContent className="flex items-center w-full px-2   py-2 justify-between">
                  {/* Left Section */}
                  <div className="flex items-center gap-2  ">
                    <div className="flex h-14 w-14 items-center justify-center rounded-xl ">
                      <Icon className="h-8 w-8 text-primary" />
                    </div>

                    <div>
                      <h4 className="text-base text-primary font-semibold">{item.title}</h4>
                      <p className="text-sm text-muted-foreground">
                        {item.subtitle}
                      </p>
                    </div>
                  </div>

                  {/* Action */}
                  <Button variant="outline" size="default" className="rounded-lg bg-golden-dark px-7 text-white gap-1 hover:bg-golden-darkHover hover:text-white ">
                    {/* <Eye className="h-4 w-4" /> */}
                    View
                  </Button>

                </CardContent>
              </Card>
            );
          })}
      </div>
    </div>
  );
}

export default BaseDataCard01;
