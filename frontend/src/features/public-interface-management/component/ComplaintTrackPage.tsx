"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Eye, FileText, Download, X, CheckCircle2 } from "lucide-react";
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
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 md:p-8">
      <div className="bg-white rounded-lg shadow-2xl w-full h-full max-w-[100vw] flex flex-col overflow-hidden relative">
        <div className="flex items-center justify-between p-4 sm:p-6 border-b shrink-0 bg-white">
          <h2 className="text-lg font-semibold w-1/2 flex-1 mr-4" title={selectedFile.name}>
            {shortenFileName(selectedFile.name, 40)}
          </h2>
          <div className="flex items-center gap-2 shrink-0">
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

  const handleTrack = () => {
    if (!trackingId.trim()) return;
    router.push(`/en/track-complaint?ticketNumber=${trackingId.trim()}`);
  };

  const getFiles = (attachments: AttachmentWrapper[] = []) => {
    return attachments.map((a) => ({
      url: getFileUrl(a.attachment.file_path),
      name: a.attachment.file_name,
      uploadedAt: a.attachment.created_at,
      type: getFileType(a.attachment.file_name),
    }));
  };

  const FileCard = ({ file, onClick }: { file: any; onClick: () => void }) => (
    <div
      onClick={onClick}
      className="border rounded-lg p-3 hover:bg-blue-50 flex items-center gap-3 cursor-pointer bg-white transition-colors"
    >
      <FileText className="w-5 h-5 text-blue-500" />
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm truncate" title={file.name}>
          {shortenFileName(file.name)}
        </p>
        <p className="text-xs text-gray-500">
          {file.uploadedAt && new Date(file.uploadedAt).toLocaleDateString()}
        </p>
      </div>
      <Eye className="w-4 h-4 text-blue-600" />
    </div>
  );

  return (
    <main className="min-h-screen px-6 lg:px-20 pt-28 pb-16 bg-slate-50">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Track Your Complaint</h1>
        <p className="text-slate-600 mt-2">
          Enter your tracking number to view current status and resolution details.
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Tracking Input */}
        <div className="w-full lg:w-96 shrink-0 h-fit bg-white rounded-xl shadow-sm border p-6">
          <label className="text-sm font-semibold text-slate-700">Tracking ID</label>
          <Input
            value={trackingId}
            onChange={(e) => setTrackingId(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleTrack()}
            placeholder="TICK-XXXX"
            className="mt-2 h-11 border-slate-200 focus:ring-blue-500"
          />

          <Button
            onClick={handleTrack}
            disabled={isLoading}
            className="mt-4 w-full bg-blue-600 hover:bg-blue-700 text-white h-11"
          >
            {isLoading ? "Checking..." : "Track Complaint"}
          </Button>

          {error && (
            <p className="mt-3 text-sm text-red-600 font-medium">
              Complaint not found. Please check your ticket number.
            </p>
          )}
        </div>

        {/* Complaint Detail */}
        {isLoading ? (
          <ComplaintSkeleton />
        ) : complaint ? (
          <div className="flex-1 space-y-6">
            {/* Status & Header Section */}
            <div className="bg-white border rounded-xl p-6 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">Complaint Details</h2>
                  <p className="text-slate-500 font-medium">
                    Ticket #{complaint.ticketing_code}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className={`px-4 py-1.5 rounded-full text-sm font-bold shadow-sm ${getStatusStyle(
                      complaint.status
                    )}`}
                  >
                    {formatStatus(complaint.status)}
                  </span>
                </div>
              </div>

              {/* Basic Info Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 py-6 border-y border-slate-100 mb-6">
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Sector</p>
                  <p className="text-slate-700 font-medium">{complaint.assignedSector?.name || "-"}</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Category</p>
                  <p className="text-slate-700 font-medium">{complaint.category?.name || "-"}</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Reported</p>
                  <p className="text-slate-700 font-medium">
                    {new Date(complaint.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Time</p>
                  <p className="text-slate-700 font-medium">
                    {new Date(complaint.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>

              {/* Submission Content */}
              <div className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="bg-slate-50 border border-slate-100 p-5 rounded-xl">
                    <h4 className="text-sm font-bold text-slate-900 mb-2">Description</h4>
                    <p className="text-slate-600 text-sm leading-relaxed whitespace-pre-line">
                      {complaint.description || "No description provided."}
                    </p>
                  </div>
                  <div className="bg-slate-50 border border-slate-100 p-5 rounded-xl">
                    <h4 className="text-sm font-bold text-slate-900 mb-2">Requested Action</h4>
                    <p className="text-slate-600 text-sm leading-relaxed whitespace-pre-line">
                      {complaint.request || "No specific action requested."}
                    </p>
                  </div>
                </div>

                {/* Submission Attachments */}
                {complaint.attachments && complaint.attachments.length > 0 && (
                  <div className="pt-4">
                    <h4 className="text-sm font-bold text-slate-900 mb-3">Submission Attachments</h4>
                    <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3">
                      {getFiles(complaint.attachments).map((file, i) => (
                        <FileCard
                          key={i}
                          file={file}
                          onClick={() => {
                            setSelectedFile(file);
                            setIsViewerOpen(true);
                          }}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Resolution Section */}
            {complaint.resolution && complaint.resolution.length > 0 && (
              <div className="bg-white border border-green-100 rounded-xl overflow-hidden shadow-sm">
                <div className="bg-green-50/50 px-6 py-4 border-b border-green-100 flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                  <h3 className="text-lg font-bold text-green-900">Resolution Details</h3>
                </div>
                
                <div className="p-6 space-y-6">
                  {complaint.resolution.map((res, idx) => (
                    <div key={res.resolution_id} className={idx > 0 ? "pt-6 border-t border-slate-100" : ""}>
                      <div className="flex justify-between items-start mb-4">
                        <div className="bg-slate-50 border px-4 py-3 rounded-xl flex-1 mr-4">
                          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Resolution Summary</h4>
                          <p className="text-slate-700 text-sm leading-relaxed whitespace-pre-line">{res.reason}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Resolved At</p>
                          <p className="text-slate-700 text-sm font-medium">
                            {new Date(res.resolved_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 text-xs font-bold">
                          {res.resolver?.full_name?.charAt(0) || "R"}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Resolver</p>
                          <p className="text-slate-700 text-sm font-semibold">{res.resolver?.full_name || "Official Responder"}</p>
                        </div>
                      </div>

                      {/* Resolution Attachments */}
                      {res.attachments && res.attachments.length > 0 && (
                        <div className="mt-4">
                          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Resolution Attachments</h4>
                          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3">
                            {getFiles(res.attachments).map((file, i) => (
                              <FileCard
                                key={i}
                                file={file}
                                onClick={() => {
                                  setSelectedFile(file);
                                  setIsViewerOpen(true);
                                }}
                              />
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Complainer Info Section */}
            {!complaint.is_anonymous && complaint.user && (
              <div className="bg-white border rounded-xl p-6 shadow-sm">
                <h3 className="text-lg font-bold text-slate-900 mb-4">Complainer Information</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Full Name</p>
                    <p className="text-slate-700 font-medium">{complaint.user.full_name}</p>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Phone Number</p>
                    <p className="text-slate-700 font-medium">{complaint.user.phone_number || "Not provided"}</p>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Email Address</p>
                    <p className="text-slate-700 font-medium">{complaint.user.email || "Not provided"}</p>
                  </div>
                </div>
              </div>
            )}
            
            {complaint.is_anonymous && (
              <div className="bg-slate-100/50 border border-dashed rounded-xl p-6 text-center">
                <p className="text-slate-500 text-sm italic">This complaint was submitted anonymously.</p>
              </div>
            )}
          </div>
        ) : ticketNumber ? (
          <div className="flex-1 bg-white border border-red-100 rounded-xl p-12 text-center shadow-sm">
            <X className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-slate-900">Complaint Not Found</h3>
            <p className="text-slate-500 mt-2">
              We couldn't find any complaint with ticket number <span className="font-bold">"{ticketNumber}"</span>.
              Please check the ID and try again.
            </p>
          </div>
        ) : (
          <div className="flex-1 bg-blue-50/50 border border-dashed border-blue-200 rounded-xl p-12 text-center">
             <FileText className="w-12 h-12 text-blue-400 mx-auto mb-4 opacity-50" />
             <h3 className="text-lg font-semibold text-blue-900">Start Tracking</h3>
             <p className="text-blue-700/60 mt-1">Enter your ticket number on the left to see your complaint details.</p>
          </div>
        )}
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
    <div className="flex-1 space-y-6">
      <div className="bg-white border rounded-xl p-6 shadow-sm animate-pulse">
        <div className="h-8 w-48 bg-slate-100 rounded mb-6" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 py-6 border-y border-slate-50 mb-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <div className="h-3 w-16 bg-slate-50 rounded" />
              <div className="h-4 w-full bg-slate-50 rounded" />
            </div>
          ))}
        </div>
        <div className="grid md:grid-cols-2 gap-6">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="h-32 bg-slate-50 rounded-xl" />
          ))}
        </div>
      </div>
    </div>
  );
};