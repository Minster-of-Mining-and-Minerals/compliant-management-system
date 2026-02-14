"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Eye, FileText } from "lucide-react";
import { getFileUrl, getFileType } from "@/utils/fileUrl";
import { useGetComplaintByTicketingCodeQuery } from "@/redux/api/complaintApi";
import { useRouter, useSearchParams } from "next/navigation";
/* ================= TYPES ================= */

type ComplaintStatus = "pending" | "in_progress" | "resolved";

interface AttachmentFile {
  attachment_id: string;
  file_name: string;
  file_path: string;
  uploaded_by: string | null;
  created_at: string;
}

interface AttachmentWrapper {
  attachment_id: string;
  created_at: string;
  attachment: AttachmentFile;
}

interface Complaint {
  complaint_id: string;
  ticketing_code: string;
  status: ComplaintStatus;
  created_at: string;
  description: string;
  request?: string;
  is_anonymous: boolean;

  assignedSector?: {
    name: string;
  };

  category?: {
    name: string;
  };

  user?: {
    full_name: string;
    phone_number: string;
    email: string;
  } | null;

  attachments?: AttachmentWrapper[];

  resolution?: {
    resolution_id: string;
    reason: string;
    resolved_at: string;
    resolver?: {
      full_name: string;
    };
    attachments?: AttachmentWrapper[];
  }[];
}

/* ================= HELPERS ================= */

const formatStatus = (status: ComplaintStatus) => {
  switch (status) {
    case "pending":
      return "Pending";
    case "in_progress":
      return "In Progress";
    case "resolved":
      return "Resolved";
    default:
      return status;
  }
};

const getStatusStyle = (status: ComplaintStatus) => {
  switch (status) {
    case "pending":
      return "bg-yellow-100 text-yellow-800";
    case "in_progress":
      return "bg-blue-100 text-blue-800";
    case "resolved":
      return "bg-green-100 text-green-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

/* ================= PAGE ================= */

const ComplaintTrackPage = () => {
  const [trackingId, setTrackingId] = useState("");
  const router = useRouter();
  const searchParams = useSearchParams();

  const ticketNumber = searchParams.get("ticketNumber");

  useEffect(() => {
    if (ticketNumber) {
      setTrackingId(ticketNumber);
    }
  }, [ticketNumber]);
  const { data, isLoading, error } =
    useGetComplaintByTicketingCodeQuery(ticketNumber ?? "", {
      skip: !ticketNumber,
    });

  const complaint: Complaint | null = data || null;
  console.log(complaint, "complaint")
  const handleTrack = () => {
    if (!trackingId.trim()) return;

    router.push(
      `/en/track-complaint?ticketNumber=${trackingId.trim()}`
    );
  };
  const complaintFiles = complaint
    ? [
      ...(complaint.attachments?.map((a) => a.attachment) || []),
      ...(complaint.resolution?.flatMap((r) =>
        r.attachments?.map((a) => a.attachment) || []
      ) || []),
    ].map((file) => ({
      url: getFileUrl(file.file_path),
      name: file.file_name,
      uploadedAt: file.created_at,
      type: getFileType(file.file_name),
    }))
    : [];

  return (
    <main className="min-h-screen px-6 lg:px-20 pt-28 pb-16 bg-slate-50">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Track Your Complaint</h1>
        <p className="text-sm text-gray-600">
          Enter your tracking number to view complaint status
        </p>
      </div>

      <div className="flex gap-10">
        {/* Tracking Input */}
        <div className="max-w-xl min-w-96 h-fit bg-white rounded-md shadow p-6 mb-10">
          <label className="text-sm font-medium">Tracking ID</label>
          <Input
            value={trackingId}
            onChange={(e) => setTrackingId(e.target.value)}
            placeholder="TICK-XXXX"
            className="mt-1 h-11"
          />

          <Button
            onClick={handleTrack}
            disabled={isLoading}
            className="mt-4 w-full"
          >
            {isLoading ? "Checking..." : "Track Complaint"}
          </Button>

          {error && (
            <p className="mt-3 text-sm text-red-600">
              Complaint not found
            </p>
          )}
        </div>

        {/* Complaint Detail */}
        {isLoading ? (
          <ComplaintSkeleton />
        ) : complaint ? (
          <div className="bg-white w-full border rounded-xl p-6 shadow-sm">
            <div className="flex justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold">Complaint Detail</h2>
                <p className="text-gray-500">
                  Ticket #{complaint.ticketing_code}
                </p>
              </div>
              <span
                className={`px-3 py-1 rounded-md text-sm ${getStatusStyle(
                  complaint.status
                )}`}
              >
                {formatStatus(complaint.status)}
              </span>
            </div>

            {/* Info Grid */}
            <div className="grid md:grid-cols-4 gap-4 text-sm mb-6">
              <div>
                <p className="font-semibold">Sector</p>
                <p>{complaint.assignedSector?.name || "-"}</p>
              </div>
              <div>
                <p className="font-semibold">Category</p>
                <p>{complaint.category?.name || "-"}</p>
              </div>
              <div>
                <p className="font-semibold">Reported</p>
                <p>
                  {new Date(complaint.created_at).toLocaleString()}
                </p>
              </div>
              <div>
                <p className="font-semibold">Status</p>
                <p>{formatStatus(complaint.status)}</p>
              </div>
            </div>

            {/* Description */}
            <div className="grid md:grid-cols-2 gap-4 mb-6">
              <div className="bg-slate-50 p-4 rounded">
                <p className="font-semibold mb-1">Description</p>
                <p>{complaint.description}</p>
              </div>
              <div className="bg-slate-50 p-4 rounded">
                <p className="font-semibold mb-1">Requested Action</p>
                <p>{complaint.request}</p>
              </div>
            </div>

            {/* Resolution */}
            {complaint.resolution?.length > 0 && (
              <div className="bg-green-50 p-4 rounded mb-6">
                <h4 className="font-semibold mb-2">Resolution</h4>
                <p className="mb-2">
                  {complaint.resolution[0].reason}
                </p>
                <p className="text-xs text-gray-600">
                  Resolved at:{" "}
                  {new Date(
                    complaint.resolution[0].resolved_at
                  ).toLocaleString()}
                </p>
              </div>
            )}

            {/* Attachments */}
            {complaintFiles.length > 0 && (
              <>
                <h4 className="font-semibold mb-3">Attachments</h4>
                <div className="grid md:grid-cols-3 gap-3">
                  {complaintFiles.map((file, i) => (
                    <a
                      key={i}
                      href={file.url}
                      target="_blank"
                      className="border rounded-lg p-3 hover:bg-blue-50 flex items-center gap-3"
                    >
                      <FileText className="w-5 h-5 text-red-500" />
                      <div className="flex-1">
                        <p className="font-medium text-sm truncate">
                          {file.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {file.uploadedAt &&
                            new Date(
                              file.uploadedAt
                            ).toLocaleDateString()}
                        </p>
                      </div>
                      <Eye className="w-4 h-4 text-blue-600" />
                    </a>
                  ))}
                </div>
              </>
            )}

            {/* Complainer Info */}
            {!complaint.is_anonymous && complaint.user && (
              <div className="bg-slate-50 p-4 rounded mt-6">
                <h4 className="font-semibold mb-3">
                  Complainer Information
                </h4>
                <div className="grid md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="font-medium">Name</p>
                    <p>{complaint.user.full_name}</p>
                  </div>
                  <div>
                    <p className="font-medium">Phone</p>
                    <p>{complaint.user.phone_number}</p>
                  </div>
                  <div>
                    <p className="font-medium">Email</p>
                    <p>{complaint.user.email}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : ticketNumber ? (
          <p className="text-red-600 mt-6">Complaint not found</p>
        ) : null}
      </div>
    </main>
  );
};

export default ComplaintTrackPage;

/* ================= SKELETON ================= */

const ComplaintSkeleton = () => {
  return (
    <div className="bg-white w-full border rounded-xl p-6 shadow-sm animate-pulse">
      <div className="h-6 w-48 bg-gray-200 rounded mb-6" />
      <div className="grid md:grid-cols-4 gap-4 mb-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <div className="h-4 w-20 bg-gray-200 rounded" />
            <div className="h-4 w-full bg-gray-200 rounded" />
          </div>
        ))}
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="space-y-2 bg-slate-50 p-4 rounded">
            <div className="h-4 w-32 bg-gray-200 rounded" />
            <div className="h-3 w-full bg-gray-200 rounded" />
            <div className="h-3 w-5/6 bg-gray-200 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
};