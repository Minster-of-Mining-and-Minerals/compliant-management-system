"use client";

import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { useGetFeedbackByIdQuery } from "@/redux/api/feedbackApi";
import { useParams } from "next/navigation";
import { BiCommentDetail, BiCommentX, BiSolidStar, BiStar } from "react-icons/bi";
import { formatDateTime } from "@/utils/date";

const FeedbackDetailPage = () => {
  const params = useParams();
  const feedbackId = params.feedbackId as string;

  const {
    data: feedback,
    isLoading,
    isError,
  } = useGetFeedbackByIdQuery(feedbackId);
  // 1️⃣ Loading
  if (isLoading) {
    return <div className="p-6 text-gray-500">Loading feedback...</div>;
  }

  // 2️⃣ Request failed
  if (isError) {
    return (
      <div className="p-6 text-red-600">Failed to load feedback details.</div>
    );
  }

  // 3️⃣ No data yet / invalid response
  if (!feedback) {
    return <div className="p-6 text-red-600">No feedback found.</div>;
  }

  return (
    <div className="flex flex-col space-y-10">
      <div>
        <Card className="bg-golden-dark10 rounded-lg shadow-sm border border-[#BFD7EA] overflow-hidden">
          <CardContent className="">
            <div className="flex items-center justify-between mb- pb-3 border-b border-gray-200">
              <div className="flex items-center gap-2.5">
                <div className="p-2  rounded-lg">
                  <BiCommentDetail className="h-5 w-5 text-golden-dark" />
                </div>
                <div>
                  <CardTitle className="text-golden-dark text-lg font-semibold m-0">
                    Feedback Details
                  </CardTitle>
                  <p className="text-sm text-gray-600">
                    Detailed information about the feedback
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left column */}
        <Card className="border border-gray-200 shadow-sm">
          <CardContent className=" space-y-4">
            <div>
              <p className="text-xs text-gray-500 uppercase">Full Name</p>
              <p className="text-sm font-medium text-golden-dark">
                {feedback.full_name || "Anonymous User"}
              </p>
            </div>

            <div>
              <p className="text-xs text-gray-500 uppercase">Rating</p>
             <div className="flex items-center gap-1">
  {[1, 2, 3, 4, 5].map((star) =>
    star <= feedback.rating ? (
      <BiSolidStar
        key={star}
        className="h-4 w-4 text-golden-dark"
      />
    ) : (
      <BiStar
        key={star}
        className="h-4 w-4 text-gray-300"
      />
    )
  )}

  <span className="ml-2 text-sm font-medium text-golden-dark">
    {feedback.rating} / 5
  </span>
</div>

            </div>

            <div>
              <p className="text-xs text-gray-500 uppercase">Submitted At</p>
              <p className="text-sm font-medium text-golden-dark">
                {formatDateTime(feedback.created_at)}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Right column */}
        <Card className="border border-gray-200 shadow-sm">
          <CardContent className=" space-y-4">
            <div>
              <p className="text-xs text-gray-500 uppercase">Sector</p>
              <p className="text-sm font-medium text-golden-dark">
                {feedback.sectorNode?.name || "—"}
              </p>
            </div>

            <div>
              <p className="text-xs text-gray-500 uppercase">
                Sector Description
              </p>
              <p className="text-sm text-golden-dark">
                {feedback.sectorNode?.description || "—"}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Full width feedback message */}
        <Card className="md:col-span-2 border border-gray-200 shadow-sm">
          <CardContent className="">
            <div className="flex items-center gap-2 mb-3">
              <BiCommentX className="h-5 w-5 text-golden-dark" />
              <p className="text-sm font-semibold text-gray-500">
                Feedback Message
              </p>
            </div>

            <p className="text-sm text-golden-dark leading-relaxed">
              {feedback.feedback}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default FeedbackDetailPage;
