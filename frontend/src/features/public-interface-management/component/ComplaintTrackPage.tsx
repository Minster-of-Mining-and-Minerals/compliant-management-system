"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Eye, FileText, Download, X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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

const shortenFileName = (name: string, maxLength: number = 25) => {
  if (!name) return "Unknown Document";
  if (name.length <= maxLength) return name;
  const extIndex = name.lastIndexOf(".");
  const ext = extIndex !== -1 ? name.substring(extIndex) : "";
  const nameWithoutExt = extIndex !== -1 ? name.substring(0, extIndex) : name;
  const keepLength = maxLength - ext.length - 3; // 3 for "..."
  if (keepLength <= 0) return name.substring(0, maxLength - 3) + "...";
  return nameWithoutExt.substring(0, keepLength) + "..." + ext;
};

/* ================= COMPONENTS ================= */

interface AttachmentViewerProps {
  isOpen: boolean;
  onClose: () => void;
  selectedFile: { url: string; name: string; type: string } | null;
}

const AttachmentViewerModal = ({ isOpen, onClose, selectedFile }: AttachmentViewerProps) => {
  if (!isOpen || !selectedFile) return null;

  return (
    <div className="fixed  inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 md:p-8">
      <div className="bg-white rounded-lg shadow-2xl w-full h-full max-w-[100vw] flex flex-col overflow-hidden relative">
        <div className="flex items-center justify-between p-4 sm:p-6 border-b shrink-0 bg-white">
          <h2 className="text-lg font-semibold w-1/2 flex-1 mr-4" title={selectedFile.name}>
            {shortenFileName(selectedFile.name, 40)}
          </h2>
          <div className="flex items-center gap-2 shrink-0">
            {/* <a href={selectedFile.url} download target="_blank" rel="noreferrer">
              <Button variant="outline" size="sm" className="gap-2">
                <Download className="w-4 h-4" /> <span className="hidden sm:inline">Download</span>
              </Button>
            </a> */}
            <Button variant="ghost" size="sm" onClick={onClose} className="rounded-full h-10 w-10 p-0">
              <span className="sr-only">Close</span>
              <X className="w-8 h-8" />
            </Button>
          </div>
        </div>
        <div className="flex-1 w-full bg-slate-50 flex items-center justify-center p-2 sm:p-4 overflow-hidden relative min-h-0">
          {selectedFile.url.toLowerCase().match(/\.(jpeg|jpg|gif|png|webp)$/) || selectedFile.type.startsWith('image/') ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={selectedFile.url}
              alt={selectedFile.name}
              className="max-w-full max-h-full object-contain"
            />
          ) : selectedFile.url.toLowerCase().endsWith('.pdf') || selectedFile.type === 'application/pdf' ? (
            <iframe
              src={selectedFile.url}
              className="w-full h-full border-0 absolute inset-0"
              title={selectedFile.name}
            />
          ) : (
            <div className="text-center p-8 overflow-y-auto w-full h-full flex flex-col items-center justify-center">
              <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-4 text-sm sm:text-base">Preview not available for this file type.</p>
              <a href={selectedFile.url} download target="_blank" rel="noreferrer">
                <Button variant="default">Download File Instead</Button>
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

/* ================= PAGE ================= */

const ComplaintTrackPage = () => {
  const [trackingId, setTrackingId] = useState("");
  const [selectedFile, setSelectedFile] = useState<{ url: string; name: string; type: string } | null>(null);
  const [isViewerOpen, setIsViewerOpen] = useState(false);

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
    <main className="min-h-screen flex items-center  w-full flex-col px-6 lg:px-20 pt-28 pb-16 bg-slate-50">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Track Your Complaint</h1>
        <p className="text-sm text-gray-600">
          Enter your tracking number to view complaint status
        </p>
      </div>

      <div className="flex gap-10">
        {/* Tracking Input */}
        <div className=" min-w-96 h-fit bg-white rounded-md shadow p-6 mb-10">
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
                className={`px-3 py-1 rounded-md text-sm flex justify-center items-center ${getStatusStyle(
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
                    <div
                      key={i}
                      onClick={() => {
                        setSelectedFile(file);
                        setIsViewerOpen(true);
                      }}
                      className="border rounded-lg p-3 hover:bg-blue-50 flex items-center gap-3 cursor-pointer"
                    >
                      <FileText className="w-5 h-5 text-red-500" />
                      <div className="flex-1">
                        <p className="font-medium text-sm truncate" title={file.name}>
                          {shortenFileName(file.name)}
                        </p>
                        <p className="text-xs text-gray-500">
                          {file.uploadedAt &&
                            new Date(
                              file.uploadedAt
                            ).toLocaleDateString()}
                        </p>
                      </div>
                      <Eye className="w-4 h-4 text-blue-600" />
                    </div>
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
          <p className="text-red-600 mt-6"> </p>
        ) : null}
      </div>

      {/* Attachment Viewer Modal Component */}
      <AttachmentViewerModal
        isOpen={isViewerOpen}
        onClose={() => setIsViewerOpen(false)}
        selectedFile={selectedFile}
      />
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