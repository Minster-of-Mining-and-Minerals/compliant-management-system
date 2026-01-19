import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";
import React from "react";

const ComplaintDetail = () => {
  return (
    <div>
      <Card className="bg-golden-dark10 rounded-lg shadow-sm border border-[#BFD7EA] overflow-hidden">
        <CardContent className="">
          <div className="flex items-center justify-between mb- pb-3 border-b border-gray-200">
            <div className="flex items-center gap-2.5">
              <div className="p-2  rounded-lg">
                <AlertCircle className="h-5 w-5 text-golden-dark" />
              </div>
              <div>
                <CardTitle className="text-golden-dark text-lg font-semibold m-0">
                  Complain Details
                </CardTitle>
                <p className="text-sm text-gray-600">
                  Detailed information about the complaint
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ComplaintDetail;
