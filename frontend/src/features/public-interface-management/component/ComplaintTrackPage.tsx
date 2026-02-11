"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Eye, FileText, X } from "lucide-react";
import { getFileUrl, getFileType } from "@/utils/fileUrl";
import { useGetComplaintByTicketingCodeQuery } from "@/redux/api/complaintApi";

/* ================= TYPES ================= */

type ComplaintStatus = "pending" | "in_progress" | "resolved";

interface Attachment {
  attachment_id: string;
  file_name: string;
  file_path: string;
  created_at?: string;
}

interface Complaint {
  complaint_id: string;
  ticketing_code: string;
  status: ComplaintStatus;
  created_at: string;
  description: string;
  request: string;
  is_anonymous: boolean;

  assignedSector: { name: string };
  category: { name: string };

  user?: {
    full_name: string;
    phone_number: string;
    email: string;
  };

  location?: {
    city: string;
    subcity: string;
    woreda: string;
  };

  attachments?: {
    attachment: Attachment;
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

/* ================= MOCK DATA ================= */

const mockComplaint: Complaint = {
  complaint_id: "cmp-001",
  ticketing_code: "CMP-2026-001",
  status: "pending",
  created_at: "2026-01-22T10:30:00Z",
  description: "There is a delay in service delivery.",
  request: "Please resolve this issue urgently.",
  is_anonymous: false,

  assignedSector: { name: "IT Department" },
  category: { name: "Service Delay" },

  user: {
    full_name: "Abel Tesfaye",
    phone_number: "0912345678",
    email: "abel@example.com",
  },

  location: {
    city: "Addis Ababa",
    subcity: "Bole",
    woreda: "03",
  },

  attachments: [
    {
      attachment: {
        attachment_id: "att-1",
        file_name: "evidence.pdf",
        file_path: "/mock/evidence.pdf",
        created_at: "2026-01-22T10:35:00Z",
      },
    },
  ],
};

/* ================= PAGE ================= */

const ComplaintTrackPage = () => {
  const t = useTranslations("ComplaintTrackPage");
  const { data, isLoading } = useGetComplaintByTicketingCodeQuery("TICK-26-MLHP16FV-36C6")

  const [trackingId, setTrackingId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [complaint, setComplaint] = useState<Complaint | null>(null);
  const [fileViewerState, setFileViewerState] = useState<any>(null);

  /* ================= TRACK HANDLER ================= */

  const handleTrack = async () => {
    if (!trackingId.trim()) {
      setError("Tracking ID is required");
      return;
    }

    setError("");
    setLoading(true);

    // 🔹 MOCK API
    setTimeout(() => {
      if (trackingId === "123") {
        setComplaint(mockComplaint);
      } else {
        setComplaint(null);
        setError("Complaint not found");
      }
      setLoading(false);
    }, 1000);
  };

  const complaintFiles =
    complaint?.attachments?.map((a) => ({
      url: getFileUrl(a.attachment.file_path),
      name: a.attachment.file_name,
      uploadedAt: a.attachment.created_at,
      type: getFileType(a.attachment.file_name),
    })) || [];

  /* ================= UI ================= */
  console.log(data)
  return (
    <main className="min-h-screen px-6 lg:px-20 pt-28 pb-16 bg-slate-50">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Track Your Complaint</h1>
        <p className="text-sm text-gray-600">
          Enter your tracking number to view complaint status
        </p>
      </div>

      <div className="flex gap-10 ">
        {/* Tracking Input */}
        <div className="max-w-xl min-w-96 h-fit bg-white rounded-md shadow p-6 mb-10">
          <label className="text-sm font-medium">Tracking ID</label>
          <Input
            value={trackingId}
            onChange={(e) => setTrackingId(e.target.value)}
            placeholder="CMP-2026-001"
            className="mt-1 h-11"
          />

          {error && <p className="mt-2 text-sm text-red-600">{error}</p>}

          <Button onClick={handleTrack} disabled={loading} className="mt-4">
            {loading ? "Checking..." : "Track Complaint"}
          </Button>
        </div>

        {/* Complaint Detail */}
        {complaint ? (
          <div className="bg-white w-full border rounded-xl p-6 shadow-sm">
            <div className="flex justify-between mb-4">
              <div>
                <h2 className="text-xl font-bold">Complaint Detail</h2>
                <p className="text-gray-500">
                  Ticket #{complaint.ticketing_code}
                </p>
              </div>
              <span className="px-3 py-1 rounded-md bg-blue-100 text-blue-900">
                {formatStatus(complaint.status)}
              </span>
            </div>

            {/* Info Grid */}
            <div className="grid md:grid-cols-4 gap-4 text-sm mb-4">
              <div>
                <p className="font-semibold">Sector</p>
                <p>{complaint.assignedSector.name}</p>
              </div>
              <div>
                <p className="font-semibold">Category</p>
                <p>{complaint.category.name}</p>
              </div>
              <div>
                <p className="font-semibold">Reported</p>
                <p>{new Date(complaint.created_at).toLocaleString()}</p>
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

            {/* Attachments */}
            {complaintFiles.length > 0 && (
              <>
                <h4 className="font-semibold mb-2">Attachments</h4>
                <div className="grid md:grid-cols-3 gap-3">
                  {complaintFiles.map((file, i) => (
                    <div
                      key={i}
                      onClick={() =>
                        setFileViewerState({ files: complaintFiles, index: i })
                      }
                      className="border rounded-lg p-3 cursor-pointer hover:bg-blue-50"
                    >
                      <div className="flex items-center gap-3">
                        <FileText className="w-5 h-5 text-red-500" />
                        <div className="flex-1">
                          <p className="font-medium text-sm truncate">
                            {file.name}
                          </p>
                          <p className="text-xs text-gray-500">
                            {file.uploadedAt &&
                              new Date(file.uploadedAt).toLocaleDateString()}
                          </p>
                        </div>
                        <Eye className="w-4 h-4 text-blue-600" />
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* Complainer Info */}
            {!complaint.is_anonymous && complaint.user && (
              <div className="bg-slate-50 p-4 rounded mt-6">
                <h4 className="font-semibold mb-3">Complainer Information</h4>
                <div className="grid md:grid-cols-4 gap-4 text-sm">
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
                  <div>
                    <p className="font-medium">Address</p>
                    <p>
                      {complaint.location?.city},{" "}
                      {complaint.location?.subcity},{" "}
                      {complaint.location?.woreda}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : <ComplaintSkeleton />}
      </div>
    </main>
  );
};

export default ComplaintTrackPage;

const ComplaintSkeleton = () => {
  return (
    <div className="bg-white w-full border rounded-xl p-6 shadow-sm animate-pulse">
      {/* Header */}
      <div className="flex justify-between mb-6">
        <div className="space-y-2">
          <div className="h-5 w-48 bg-gray-200 rounded" />
          <div className="h-4 w-32 bg-gray-200 rounded" />
        </div>
        <div className="h-6 w-24 bg-gray-200 rounded" />
      </div>

      {/* Info Grid */}
      <div className="grid md:grid-cols-4 gap-4 mb-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <div className="h-4 w-20 bg-gray-200 rounded" />
            <div className="h-4 w-full bg-gray-200 rounded" />
          </div>
        ))}
      </div>

      {/* Description */}
      <div className="grid md:grid-cols-2 gap-4 mb-6">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="space-y-2 bg-slate-50 p-4 rounded">
            <div className="h-4 w-32 bg-gray-200 rounded" />
            <div className="h-3 w-full bg-gray-200 rounded" />
            <div className="h-3 w-5/6 bg-gray-200 rounded" />
            <div className="h-3 w-4/6 bg-gray-200 rounded" />
          </div>
        ))}
      </div>

      {/* Attachments */}
      <div className="space-y-3">
        <div className="h-4 w-28 bg-gray-200 rounded" />
        <div className="grid md:grid-cols-3 gap-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="h-16 border rounded bg-gray-200"
            />
          ))}
        </div>
      </div>
    </div>
  );
};
