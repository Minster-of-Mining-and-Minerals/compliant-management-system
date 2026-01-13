"use client";

import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Eye, FileText, Users, Car, Building } from "lucide-react";
import { useRouter } from "next/navigation";

const dataCards: DataCardItem[] = [
  {
    id: 1,
    title: "Sectors",
    subtitle: "All registered sectors",
    icon: Building,
    link: "/basedata/sectors",
  },
  {
    id: 0,
    title: "Total Exams",
    subtitle: "All registered exams",
    icon: FileText,
    link: "/basedata/exams",
  },

  {
    id: 2,
    title: "Applicants",
    subtitle: "Registered drivers",
    icon: Users,
    link: "/basedata/applicants",
  },
  {
    id: 3,
    title: "Vehicle Categories",
    subtitle: "License classifications",
    icon: Car,
    link: "/basedata/vehicle-categories",
  },
];

{/* <div className="flex gap-5 shadow-lg hover:shadow-xl transition-shadow duration-300 bg-gradient-to-b from-[#F9FBFC] to-[#EFF6FB] rounded-[35px] justify-between items-center p-4 bg-white  border border-gray-200 dark:bg-gray-800 dark:border-gray-700 w-full ">
      <div className="flex items-center gap-5">
        {icon && <div className="text-blue-600 dark:text-blue-400 ">{icon}</div>}
        <div className="flex-1 ">
          <h3 className="text-lg font-semibold mb-1 text-black dark:text-gray-100">
            {title}
          </h3>
          <p className="text-sm text-[#094C81] dark:text-[#094C81]">
            {description}
          </p>
        </div>
      </div>
      {onClick && (
        <div className="flex justify-center h-fit items-center">
          <button
            onClick={onClick}
            className="px-5 py-1.5 bg-[#094C81] text-white text-sm font-medium rounded-lg hover:bg-[#07365c] transition"
          >
            {buttonText}
          </button>
        </div>
      )}
    </div> */}

function BaseDataCard01() {
  const router = useRouter();
  return (
    <div className="flex min-h-[calc(100vh-150px)] rounded-lg flex-col bg-white p-5 ">
      <h1 className="text-2xl font-bold text-secondary">Base Data</h1>
      <p className="text-sm text-muted-foreground">Manage all your base data here</p>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 mt-6 ">
        {dataCards.map((item) => {
          const Icon = item.icon;

          return (
            <Card
              key={item.id}
              onClick={() => router.push(item.link)}
              className="flex gap-5 bg-green-50 shadow-md hover:shadow-xl transition-shadow duration-300  rounded-3xl justify-between items-center p-4   border border-gray-200 dark:bg-gray-800 dark:border-gray-700 w-full"
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
                <Button variant="outline" size="default" className="rounded-lg bg-primary px-7 text-white gap-1 hover:bg-primary hover:text-white ">
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
