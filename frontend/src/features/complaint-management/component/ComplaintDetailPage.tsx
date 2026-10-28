"use client";

import { useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { useParams } from "next/navigation";
import { usePermissions } from "@/hooks/usePermissions";
import { motion, AnimatePresence } from "framer-motion";
import {
  Upload,
  CheckCircle2,
  X,
  ChevronLeft,
  ChevronRight,
  FileText,
  Image as ImageIcon,
  Eye,
  Lock,
  ChevronUp,
  ChevronDown,
  Check,
} from "lucide-react";

// import FileViewer from "../../components/common/FileView";
import { getFileType, getFileUrl } from "@/utils/fileUrl";

import {
  canAssign,
  canConfirm,
  canEscalate,
  canInternallyMarkInProgress,
  canInternallyResolve,
} from "@/utils/taskHelper";
import { toast } from "sonner";
import CompliantHistoryLog from "./CompliantHistoryLog";
import TimelineOpener from "./TimelineOpener";
import FileViewer from "@/components/common/FileView";
import { formatStatus } from "@/utils/statusFormatter";
import { formatDate, formatDateTime } from "@/utils/date";
import ResolutionPreview from "./ResolutionPreview"; 
import AssignmentPreview from "./AssignmentPreview";
import {
  useAcceptCompliantMutation,
  useGetComplaintByIdQuery,
} from "@/redux/api/complaintApi";
import { useBreadcrumbTitleEffect } from "@/hooks/useBreadcrumbTitleEffect";
import { hasAnyPermission, PermissionKey } from "@/lib/permissions";
type PreviewFile = {
  name: string;
  url: string;
  type: "image" | "pdf" | "document" | "other";
};

export default function ComplaintDetailPage() {
  const { data: session, status } = useSession();
  const params = useParams();
  const id = params?.complaintId as string;
  const { data: complaint, isLoading, isError } = useGetComplaintByIdQuery(id!);
  const [selectedAction, setSelectedAction] = useState<string | null>(null);
  const [acceptCompliant, { isLoading: isAccepting }] =
    useAcceptCompliantMutation();
  const [escalateComplaint, setEscalateComplaint] = useState(false);
  const [assignComplaint, setAssignComplaint] = useState(false);
  const [resolveComplaint, setResolveComplaint] = useState(false);
  const [markComplaint, setMarkComplaint] = useState(false);
  const [openTimeline, setOpenTimeline] = useState(true);
  const [project_id, setProjectId] = useState("");
  const [internal_node_id, setInternalNodeId] = useState("");
  const [fileViewerState, setFileViewerState] = useState<{
    files: PreviewFile[];
    index: number;
  } | null>(null);



  const { permissions: userPermissions } = usePermissions();

  const userId = session?.user?.id || "";

  useEffect(() => {
    setEscalateComplaint(canEscalate(userId, complaint?.status, complaint));
  }, [userId, complaint?.status, complaint]);

  useEffect(() => {
    setAssignComplaint(canAssign(userId, complaint?.status, complaint));
  }, [userId, complaint?.status, complaint]);

  useEffect(() => {
    setResolveComplaint(
      canInternallyResolve(userId, complaint?.status, complaint),
    );
  }, [userId, complaint?.status, complaint]);

  useEffect(() => {
    setMarkComplaint(
      canInternallyMarkInProgress(userId, complaint?.status, complaint),
    );
  }, [userId, complaint?.status, complaint]);

  useEffect(() => {
    setProjectId(complaint?.project_id);
  }, [complaint?.project_id, complaint]);
  useBreadcrumbTitleEffect(
    complaint?.ticketing_code,
    complaint?.complaint_id
  );

  // Map complaint attachments to files array with proper URLs and file info
  const complaintFiles =
    complaint?.attachments?.map((attachment) => ({
      url: getFileUrl(attachment.attachment.file_path),
      name: attachment.attachment.file_name,
      path: attachment.attachment.file_path,
      type: getFileType(attachment.attachment.file_name),
      uploadedAt: attachment.attachment.created_at,
    })) || [];

  // Get file icon based on type
  const getFileIcon = (fileType: string) => {
    switch (fileType) {
      case "image":
        return <ImageIcon className="w-5 h-5 text-blue-500" />;
      case "pdf":
        return <FileText className="w-5 h-5 text-red-500" />;
      case "document":
        return <FileText className="w-5 h-5 text-blue-600" />;
      default:
        return <FileText className="w-5 h-5 text-gray-500" />;
    }
  };

  // File card component for consistent styling
  const FileCard = ({ file, onOpen }: { file: any; onOpen: () => void }) => (
    <div
      className="border border-[#BFD7EA] rounded-lg p-3 hover:shadow-md transition-all duration-200 cursor-pointer group bg-white hover:bg-blue-50"
      onClick={onOpen}
    >
      <div className="flex items-center gap-3">
        <div className="flex-shrink-0">{getFileIcon(file.type)}</div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm text-gray-800 truncate">
            {file.name}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {file.type} • {formatDate(file.uploadedAt)}
          </p>
        </div>
        <Eye className="w-4 h-4 text-blue-600 opacity-70 group-hover:opacity-100 transition-opacity" />
      </div>
    </div>
  );

  const openFileViewer = (files: any[], index: number) =>
    setFileViewerState({ files, index });
  const closeFileViewer = () => setFileViewerState(null);

  const handleMarkAsInProgress = async () => {
    if (!id) return;
    try {
      const res = await acceptCompliant({ complaint_id: id }).unwrap();
      toast.success(res.message || "Complaint status updated to In Progress!");
    } catch (error: any) {
      toast.error(error?.data?.message || "Error updating complaint status.");
      console.error(error);
    }
  };

  const handleActions = async (value: string) => {
    setOpenTimeline(false);
    setSelectedAction(value);
  };

  // Action buttons configuration with permissions
  const actionButtons = [
    {
      key: "mark_as_inprogress",
      label: "Mark as In Progress",
      desc: markComplaint
        ? 'Start working on this complaint. It will update the status to "In progress"'
        : "Cannot mark in progress - complaint is already in progress or you have escalated it",
      color: "#c2b56cff",
      bg: "#E7F3FF",
      border: "#BFD7EA",
      enabled: markComplaint,
      onClick: () => {
        if (markComplaint) {
          handleMarkAsInProgress();
        }
      },
      permission: ["COMPLAINT:ACCEPT"],
    },
    {
      key: "resolve",
      label: "Resolve Complaint",
      desc: resolveComplaint
        ? "You have fixed the complaint. Provide resolution detail to close the complaint."
        : "Cannot resolve - only the user who last accepted this complaint can resolve it",
      color: "#073A55", // system navy
      bg: "#E7F3FF",
      border: "#BFD7EA",
      enabled: resolveComplaint,
      onClick: () => resolveComplaint && handleActions("resolve"),
      permission: ["COMPLAINT:RESOLVE"],
    },
    {
      key: "assign",
      label: "Assign Complaint",
      desc: assignComplaint
        ? "Assign this complaint to the next responsible user in the workflow."
        : "Cannot assign - complaint is not in progress or assignment is not allowed.",
      color: "#073A55", // system navy
      bg: "#E6F3F9",
      border: "#BFD7EA",
      enabled: assignComplaint,
      onClick: () => assignComplaint && handleActions("assign"),
      permission: ["COMPLAINT:ASSIGN"],
    },
  ];

  if (isLoading) return <div>Loading...</div>;
  if (isError || !complaint) return <div>Error loading complaint details</div>;

  return (
    <>
      <div className="bg-gradient-to-b from-white via-slate-50 to-white relative overflow-hidden font-sans  py-6 pb-24 flex flex-col items-start">
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-blue-500/5 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-teal-500/5 rounded-full blur-3xl" />
        </div>
        <div
          className={`w-full min-h-[80vh] mx-auto shadow-md rounded-xl  border-dashed border-[#BFD7EA] p-6 relative overflow-hidden`}
        >
          <div
            className={`w-full transition-all duration-500 ease-in-out  ${selectedAction || openTimeline ? "lg:pr-[360px]" : ""
              } `}
          >
            <div className="flex flex-col w-full">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4">
                <div>
                  <h2 className="text-golden-dark text-xl font-bold mb-1">
                    Complaint Detail
                  </h2>
                  <p className="text-gray-600">
                    Review complaint details and take appropriate action
                  </p>
                </div>
                <div className="flex items-center gap-20">
                  <span
                    className={`text-base px-2 py-1 rounded-md ${complaint.status === "resolved"
                      ? "bg-green-100 text-green-900"
                      : complaint.status === "pending"
                        ? "bg-blue-100 text-blue-900"
                        : complaint.status === "closed"
                          ? "bg-red-100 text-red-900"
                          : "bg-gray-100 text-gray-900"
                      }`}
                  >
                    {formatStatus(complaint.status)}
                  </span>
                  {!openTimeline && (
                    <TimelineOpener onOpen={() => setOpenTimeline(true)} />
                  )}
                </div>
              </div>

              <div className="border border-[#BFD7EA] rounded-xl p-6 mb-6  shadow-sm">
                {/* Top Info Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 text-base lg:grid-cols-4 gap-6">
                  <div>
                    <p className="font-semibold text-golden-dark   mb-1">
                      Assigned Sector
                    </p>
                    <p className="text-gray-700 text-sm">
                      {complaint.assignedSector?.name}
                    </p>
                  </div>

                  <div>
                    <p className="font-semibold text-golden-dark  mb-1">
                      Category
                    </p>
                    <p className="text-gray-700 text-sm">
                      {complaint.category?.name}
                    </p>
                  </div>

                  <div>
                    <p className="font-semibold text-golden-dark  mb-1">
                      Reported Time
                    </p>
                    <p className="text-gray-700 text-sm">
                      {formatDateTime(complaint.created_at)}
                    </p>
                  </div>

                  {/* Ticket Number */}
                  <div>
                    <p className="font-semibold text-golden-dark mb-1">
                      Ticket Number
                    </p>
                    <span className="text-gray-700   rounded-md text-sm">
                      {complaint.ticketing_code}
                    </span>
                  </div>
                </div>

                {/* Description + Action Taken */}
                <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-slate-50 border border-[#DCE7F1] rounded-lg p-4">
                    <p className="font-semibold text-golden-dark text-sm mb-2">
                      Description
                    </p>
                    <p className="text-gray-500 text-wrap whitespace-pre-line">
                      {complaint.description || "No description provided"}
                    </p>
                  </div>

                  <div className="bg-slate-50 border border-[#DCE7F1] rounded-lg p-4">
                    <p className="font-semibold text-golden-dark text-sm mb-2">
                      Requested Action
                    </p>
                    <p className="text-gray-500 text-wrap whitespace-pre-line">
                      {complaint.request || "No requested action provided"}
                    </p>
                  </div>
                </div>

                {/* Attachments */}
                {complaintFiles.length > 0 && (
                  <div className="bg-white   border-[#BFD7EA] rounded-lg py-4">
                    <h4 className="font-semibold text-primary mb-3">
                      Complaint Attachments ({complaintFiles.length})
                    </h4>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {complaintFiles.map((file, idx) => (
                        <FileCard
                          key={idx}
                          file={file}
                          onOpen={() => openFileViewer(complaintFiles, idx)}
                        />
                      ))}
                    </div>
                  </div>
                )}

                <div className="mt-5 p-4 border border-[#DCE7F1] rounded-lg bg-slate-50">
                  <h4 className="font-semibold text-golden-dark mb-3">
                    Complainer Information
                  </h4>
                  {complaint.is_anonymous && (
                    <p className="text-gray-600 mb-3 italic">
                      This complaint was submitted anonymously.
                    </p>
                  )}
                  {!complaint.is_anonymous && (
                    <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-4 gap-4 text-sm">
                      {/* Full Name */}
                      <div>
                        <p className="font-medium text-golden-dark mb-1">
                          Full Name
                        </p>
                        <p className="text-gray-700">
                          {complaint.user?.full_name || "Anonymous User"}
                        </p>
                      </div>
                      {/* Phone Number */}
                      <div>
                        <p className="font-medium text-golden-dark mb-1">
                          Phone Number
                        </p>
                        <p className="text-gray-700">
                          {complaint.user?.phone_number || "Not provided"}
                        </p>
                      </div>

                      {/* Email */}
                      <div>
                        <p className="font-medium text-golden-dark mb-1">
                          Email
                        </p>
                        <p className="text-gray-700">
                          {complaint.user?.email || "Not provided"}
                        </p>
                      </div>

                      {/* City */}
                      <div>
                        <p className="font-medium text-golden-dark mb-1">
                          Address
                        </p>
                        <p className="text-gray-700">
                          {complaint.location?.city || "N/A"},{" "}
                          {complaint.location?.subcity || "N/A"},{" "}
                          {complaint.location?.woreda || "N/A"}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Complaint Resolutions */}
              {complaint.resolution && complaint.resolution.length > 0 && (
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-4 p-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
                    <div className="flex items-center gap-3">
                      <div>
                        <h3 className="text-primary font-bold text-lg">
                          Resolutions
                        </h3>
                        <p className="text-sm text-gray-600">
                          All resolution attempts
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {complaint.resolution.map(
                      (resolution: any, resolutionIndex: number) => {
                        const resolutionFiles =
                          resolution.attachments?.map((attachment: any) => ({
                            url: getFileUrl(attachment.attachment.file_path),
                            name: attachment.attachment.file_name,
                            type: getFileType(attachment.attachment.file_name),
                            uploadedAt: attachment.attachment.created_at,
                          })) || [];

                        return (
                          <div
                            key={resolution.resolution_id}
                            className="border border-[#BFD7EA] rounded-xl p-5 bg-white shadow-sm"
                          >
                            <div className="flex items-start justify-between mb-4">
                              <p className="text-sm text-gray-600 mt-1">
                                Resolved on {formatDateTime(resolution.resolved_at)}
                              </p><span className="px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                {formatStatus(resolution.status) || "Resolved"}

                              </span>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                              <div className="bg-slate-50 border border-[#DCE7F1] rounded-lg p-4">
                                <p className="font-semibold text-primary text-sm mb-1">
                                  Resolution Summary
                                </p>
                                <p className="text-gray-600 text-sm">
                                  {resolution.reason || "No reason provided"}

                                </p>
                              </div>

                              <div className="bg-slate-50 border border-[#DCE7F1] rounded-lg p-4">
                                <p className="font-semibold text-primary text-sm mb-1">
                                  Resolver Contact
                                </p>
                                <p className="text-gray-700 text-sm">
                                  {resolution.resolver?.full_name || "N/A"}
                                </p>
                                <p className="text-gray-500 text-xs mt-1">
                                  {resolution.resolver?.phone_number || "No phone number"}
                                </p>
                              </div>
                            </div>

                            {/* Attachments (same style as complaint attachments) */}
                            {resolutionFiles.length > 0 && (
                              <div>
                                <h5 className="font-semibold text-primary mb-3">
                                  Attachments ({resolutionFiles.length})
                                </h5>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                  {resolutionFiles.map((file: any, idx: number) => (
                                    <FileCard
                                      key={idx}
                                      file={file}
                                      onOpen={() =>
                                        openFileViewer(resolutionFiles, idx)
                                      }
                                    />
                                  ))}
                                </div>
                              </div>
                            )}

                          </div>
                        );
                      },
                    )}
                  </div>
                </div>
              )}


              {complaint?.status !== "resolved" ? (
                <>
                  {hasAnyPermission(userPermissions, ["COMPLAINT:ACCEPT", "COMPLAINT:RESOLVE", "COMPLAINT:ASSIGN"]) && <h3 className="text-primary font-semibold text-lg mt-4 mb-3 flex items-center gap-2">
                    🎯 Select Action
                  </h3>}

                  <div className="flex flex-col md:flex-row gap-4 mb-6">
                    {actionButtons.filter((action) => hasAnyPermission(userPermissions, action.permission))
                      .map((action) => (
                        <button
                          key={action.key}
                          onClick={() => {
                            if (action.enabled) setSelectedAction(action.key);
                            action.onClick();
                          }}
                          disabled={!action.enabled}
                          className={`flex-1 text-left border rounded-lg p-4 transition-all relative ${selectedAction === action.key
                            ? `border-[${action.border}] bg-[${action.bg}]`
                            : action.enabled
                              ? "border-[#D5E3EC] bg-white hover:bg-gray-50 cursor-pointer"
                              : "border-gray-200 bg-gray-50 cursor-not-allowed opacity-60"
                            }`}
                        >
                          {!action.enabled && (
                            <div className="absolute top-2 right-2">
                              <Lock className="w-4 h-4 text-golden-dark" />
                            </div>
                          )}
                          <div className="flex items-center gap-2 mb-1">
                            <div
                              className={`w-5 h-5 rounded-full flex items-center justify-center ${selectedAction === action.key
                                ? "bg-golden-dark" // Primary background
                                : action.enabled
                                  ? "border-2 border-gray-300"
                                  : "border-2 border-gray-200 bg-gray-100"
                                }`}
                            >
                              {selectedAction === action.key && (
                                <Check className="w-3 h-3 bg-golden text-white" />
                              )}
                            </div>
                            <p
                              className={`font-semibold ${action.enabled
                                ? "text-golden-dark"
                                : "text-gray-500"
                                }`}
                            >
                              {action.label}
                            </p>
                          </div>
                          <p
                            className={`text-sm ${action.enabled ? "text-gray-600" : "text-gray-400"
                              }`}
                          >
                            {action.desc}
                          </p>
                        </button>
                      ))}
                  </div>
                </>
              ) : null}
            </div>
          </div>

          {/* File Viewer Modal with next/prev navigation */}
          {fileViewerState && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
              <div className="bg-white rounded-lg w-full max-w-6xl h-[90vh] flex flex-col">
                {/* Header */}
                <div className="flex justify-between items-center p-4 border-b">
                  <h3 className="text-lg font-semibold text-primary">
                    {fileViewerState.files[fileViewerState.index].name}
                  </h3>
                  <button
                    onClick={() => setFileViewerState(null)}
                    className="p-2 hover:bg-gray-100 rounded-full"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Body */}
                <div className="flex-1 p-4">
                  <FileViewer
                    fileUrl={fileViewerState.files[fileViewerState.index].url}
                  />
                </div>

                {/* Navigation */}
                {fileViewerState.files.length > 1 && (
                  <div className="p-4 border-t flex items-center justify-between">
                    <button
                      onClick={() =>
                        setFileViewerState((prev) =>
                          !prev
                            ? prev
                            : {
                              ...prev,
                              index:
                                (prev.index - 1 + prev.files.length) %
                                prev.files.length,
                            },
                        )
                      }
                      className="flex items-center gap-1 px-3 py-1 border rounded-md"
                    >
                      <ChevronLeft className="w-4 h-4" /> Previous
                    </button>

                    <span className="text-sm text-gray-500">
                      {fileViewerState.index + 1} /{" "}
                      {fileViewerState.files.length}
                    </span>

                    <button
                      onClick={() =>
                        setFileViewerState((prev) =>
                          !prev
                            ? prev
                            : {
                              ...prev,
                              index: (prev.index + 1) % prev.files.length,
                            },
                        )
                      }
                      className="flex items-center gap-1 px-3 py-1 border rounded-md"
                    >
                      Next <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          <AnimatePresence>
            {selectedAction === "resolve" && (
              <ResolutionPreview
                complaint_id={id || ""}
                onClose={() => setSelectedAction("")}
              />
            )}
            {selectedAction === "assign" && (
              <AssignmentPreview
                complaint_id={id || ""}
                onClose={() => setSelectedAction("")}
              />
            )}
            {openTimeline && (
              <CompliantHistoryLog
                logs={complaint?.history || []}
                onClose={() => setOpenTimeline(false)}
              />
            )}
          </AnimatePresence>
        </div>
      </div>
    </>
  );
}

