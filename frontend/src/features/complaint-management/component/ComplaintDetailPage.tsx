"use client";

import { useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { useParams, Link } from "next/navigation";
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
  canMarkInProgress,
  canResolve,
} from "@/utils/taskHelper";
import { toast } from "sonner";
import DetailHeader from "@/components/common/DetailHeader";
import PageMeta from "@/components/common/PageMeta";
import CompliantHistoryLog from "./CompliantHistoryLog";
import TimelineOpener from "./TimelineOpener";
import FileViewer from "@/components/common/FileView";
import { formatStatus } from "@/utils/statusFormatter";
import ResolutionPreview from "./ResolutionPreview";
import AssignmentPreview from "./AssignmentPreview";
import { useAcceptCompliantMutation, useGetComplaintByIdQuery } from "@/redux/api/complaintApi";

export default function ComplaintDetailPage() {
  const { data: session, status } = useSession();
  const params = useParams();
  const id = params?.complaintId as string;
  const { data: complaint, isLoading, isError } = useGetComplaintByIdQuery(id!);
  const [selectedAction, setSelectedAction] = useState<string | null>(null);
  const [modalImageIndex, setModalImageIndex] = useState<number | null>(null);
  const [acceptCompliant, { isLoading: isAccepting }] = useAcceptCompliantMutation();
  const [escalateComplaint, setEscalateComplaint] = useState(false);
  const [assignComplaint, setAssignComplaint] = useState(false);
  const [resolveComplaint, setResolveComplaint] = useState(false);
  const [markComplaint, setMarkComplaint] = useState(false);
  const [openTimeline, setOpenTimeline] = useState(false);
  const [project_id, setProjectId] = useState("");
  const [internal_node_id, setInternalNodeId] = useState("");
  const [fileViewerState, setFileViewerState] = useState<{
    files: any[];
    index: number;
  } | null>(null);
  const [hierarchyStructure, setHierarchyStructure] = useState<any>(null);

  // Collapsible sections state
  const [expandedEscalations, setExpandedEscalations] = useState<string[]>([]);
  const [expandedResolutions, setExpandedResolutions] = useState<string[]>([]);
  const [expandedSections, setExpandedSections] = useState({
    escalations: true,
    resolutions: true,
  });

  const userId = session?.user?.id || "";

  useEffect(() => {
    setEscalateComplaint(canEscalate(userId, complaint?.status, complaint));
  }, [userId, complaint?.status, complaint]);

  useEffect(() => {
    setAssignComplaint(canAssign(userId, complaint?.status, complaint));
  }, [userId, complaint?.status, complaint]);

  useEffect(() => {
    setResolveComplaint(canInternallyResolve(userId, complaint?.status, complaint));
  }, [userId, complaint?.status, complaint]);

  useEffect(() => {
    setMarkComplaint(canInternallyMarkInProgress(userId, complaint?.status, complaint));
  }, [userId, complaint?.status, complaint]);

  useEffect(() => {
    setProjectId(complaint?.project_id);
  }, [complaint?.project_id, complaint]);



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
            {file.type} • {new Date(file.uploadedAt).toLocaleDateString()}
          </p>
        </div>
        <Eye className="w-4 h-4 text-blue-600 opacity-70 group-hover:opacity-100 transition-opacity" />
      </div>
    </div>
  );

  const prevImage = () => {
    if (modalImageIndex !== null) {
      setModalImageIndex(
        (modalImageIndex - 1 + complaintFiles.length) % complaintFiles.length
      );
    }
  };

  const nextImage = () => {
    if (modalImageIndex !== null) {
      setModalImageIndex((modalImageIndex + 1) % complaintFiles.length);
    }
  };

  const openFileViewer = (files: any[], index: number) =>
    setFileViewerState({ files, index });
  const closeFileViewer = () => setFileViewerState(null);
  const closeModal = () => setModalImageIndex(null);

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

  // Toggle accordion sections
  const toggleSection = (section: "escalations" | "resolutions") => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const toggleEscalation = (escalationId: string) => {
    setExpandedEscalations((prev) =>
      prev.includes(escalationId)
        ? prev.filter((id) => id !== escalationId)
        : [...prev, escalationId]
    );
  };

  const toggleResolution = (resolutionId: string) => {
    setExpandedResolutions((prev) =>
      prev.includes(resolutionId)
        ? prev.filter((id) => id !== resolutionId)
        : [...prev, resolutionId]
    );
  };



  const toggleAllResolutions = () => {
    if (!complaint?.resolutions) return;
    if (expandedResolutions.length === complaint.resolutions.length) {
      setExpandedResolutions([]);
    } else {
      setExpandedResolutions(
        complaint.resolutions.map((res: any) => res.resolution_id)
      );
    }
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
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
    },
    {
      key: "resolve",
      label: "Resolve Complaint",
      desc: resolveComplaint
        ? "You have fixed the complaint. Provide resolution detail to close the complaint."
        : "Cannot resolve - only the user who last accepted this complaint can resolve it",
      color: "#1E516A",
      bg: "#E7F3FF",
      border: "#BFD7EA",
      enabled: resolveComplaint,
      onClick: () => resolveComplaint && handleActions("resolve"),
    },
    {
      key: "assign",
      label: "Assign Complaint",
      desc: assignComplaint
        ? "Assign this complaint to the next responsible user in the workflow."
        : "Cannot assign - complaint is not in progress or assignment is not allowed.",
      color: "#1E516A",
      bg: "#E6F3F9",
      border: "#BFD7EA",
      enabled: assignComplaint,
      onClick: () => assignComplaint && handleActions("assign"),
    },
  ];

  if (isLoading) return <div>Loading...</div>;
  if (isError || !complaint)
    return <div>Error loading complaint details</div>;

  return (
    <>
      <DetailHeader breadcrumbs={[
        { title: "Complaint List", link: "/complaints" },
        { title: "Complaint Detail", link: "" },
      ]} />
      <PageMeta
        title={"Complaint Detail"}
        description={"Review complaint details and take appropriate action"}
      />
      <div className="min-h-screen bg-[#F9FBFC] py-6 pb-24 flex flex-col items-start">
        <div
          className={`w-full  mx-auto bg-white shadow-md rounded-xl  border-dashed border-[#BFD7EA] p-6 relative overflow-hidden`}
        >
          <div
            className={`w-full transition-all duration-500 ease-in-out  ${selectedAction || openTimeline ? "lg:pr-[360px]" : ""
              } `}
          >
            <div className="flex flex-col w-full">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4">
                <div>
                  <h2 className="text-[#1E516A] text-xl font-bold mb-1">
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
                      : complaint.status === "in_progress"
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

              <div className="border border-[#BFD7EA] rounded-xl p-6 mb-6 bg-white shadow-sm">
                {/* Top Info Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 text-base lg:grid-cols-5 gap-6">
                  <div>
                    <p className="font-semibold text-[#1E516A]   mb-1">
                      System
                    </p>
                    <p className="text-gray-800 text-sm">
                      {complaint.project?.name || "N/A"}
                    </p>
                  </div>

                  <div>
                    <p className="font-semibold text-[#1E516A]  mb-1">
                      Category
                    </p>
                    <p className="text-gray-800 text-sm">
                      {complaint.category?.name || "N/A"}
                    </p>
                  </div>

                  <div>
                    <p className="font-semibold text-[#1E516A]  mb-1">
                      Reported By
                    </p>
                    <p className="text-gray-800 text-sm">
                      {complaint.reporter?.full_name || "N/A"}
                    </p>
                  </div>

                  <div>
                    <p className="font-semibold text-[#1E516A]  mb-1">
                      Reported On
                    </p>
                    <p className="text-gray-800 text-sm">
                      {formatDate(complaint.created_at)}
                    </p>
                  </div>

                  {/* Priority */}
                  <div>
                    <p className="font-semibold text-[#1E516A]  mb-1">
                      Priority Level
                    </p>
                    <span
                      className="font-semibold px-2 py-1 rounded-md text-sm"
                      style={{ color: complaint.priority?.color_value || "#000" }}
                    >
                      {complaint.priority?.name || "N/A"}
                    </span>
                  </div>
                </div>

                {/* Description + Action Taken */}
                <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-slate-50 border border-[#DCE7F1] rounded-lg p-4">
                    <p className="font-semibold text-[#1E516A] text-sm mb-2">
                      Description
                    </p>
                    <p className="text-gray-700 text-wrap whitespace-pre-line">
                      {complaint.description || "No description provided"}
                    </p>
                  </div>

                  <div className="bg-slate-50 border border-[#DCE7F1] rounded-lg p-4">
                    <p className="font-semibold text-[#1E516A] text-sm mb-2">
                      Action Taken
                    </p>
                    <p className="text-gray-700 text-wrap whitespace-pre-line">
                      {complaint.action_taken || "No action taken yet"}
                    </p>
                  </div>
                </div>

                {/* Attachments */}
                {complaintFiles.length > 0 && (
                  <div className="bg-white   border-[#BFD7EA] rounded-lg py-4">
                    <h4 className="font-semibold text-[#1E516A] mb-3">
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
              </div>



              {/* Complaint Resolutions */}
              {complaint?.resolutions && complaint.resolutions.length > 0 && (
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-4 p-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-8 bg-green-600 rounded-full"></div>
                      <div>
                        <h3 className="text-[#1E516A] font-bold text-lg">
                          Resolutions ({complaint.resolutions.length})
                        </h3>
                        <p className="text-sm text-gray-600">
                          All resolution attempts
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        className="border border-green-700 text-green-700 text-xs px-3 py-1 rounded-md hover:bg-green-50"
                        onClick={toggleAllResolutions}
                      >
                        {expandedResolutions.length === complaint.resolutions.length
                          ? "Collapse All"
                          : "Expand All"}
                      </button>
                      <button
                        onClick={() => toggleSection("resolutions")}
                        className="p-2 hover:bg-white rounded-lg transition-colors"
                      >
                        {expandedSections.resolutions ? (
                          <ChevronUp className="w-5 h-5 text-green-700" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-green-700" />
                        )}
                      </button>
                    </div>
                  </div>

                  <AnimatePresence>
                    {expandedSections.resolutions && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3 }}
                        className="space-y-4"
                      >
                        {complaint.resolutions.map(
                          (resolution: any, resolutionIndex: number) => {
                            const isExpanded = expandedResolutions.includes(
                              resolution.resolution_id
                            );
                            const resolutionFiles =
                              resolution.attachments?.map(
                                (attachment: any) => ({
                                  url: getFileUrl(
                                    attachment.attachment.file_path
                                  ),
                                  name: attachment.attachment.file_name,
                                  path: attachment.attachment.file_path,
                                  type: getFileType(
                                    attachment.attachment.file_name
                                  ),
                                  uploadedAt: attachment.attachment.created_at,
                                })
                              ) || [];

                            return (
                              <div
                                key={resolution.resolution_id}
                                className="border border-[#BFD7EA] rounded-lg overflow-hidden"
                              >
                                {/* Header */}
                                <div
                                  className="p-4 cursor-pointer hover:bg-green-50 transition-colors flex items-center justify-between"
                                  onClick={() =>
                                    toggleResolution(resolution.resolution_id)
                                  }
                                >
                                  <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                                      <span className="font-bold text-green-700">
                                        {resolutionIndex + 1}
                                      </span>
                                    </div>
                                    <div>
                                      <h4 className="font-semibold text-[#1E516A]">
                                        {resolution.resolver?.full_name ||
                                          "Unknown"}
                                      </h4>
                                      <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                                        <span>
                                          By{" "}
                                          {resolution.resolver?.full_name ||
                                            "N/A"}
                                        </span>
                                        <span>•</span>
                                        <span>
                                          On:{" "}
                                          {formatDate(resolution.resolved_at)}
                                        </span>
                                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                          {formatStatus(resolution.status) ||
                                            "resolved"}
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-3">
                                    {resolutionFiles.length > 0 && (
                                      <span className="text-sm text-gray-500 flex items-center gap-1">
                                        <FileText className="w-4 h-4" />
                                        {resolutionFiles.length}
                                      </span>
                                    )}
                                    {isExpanded ? (
                                      <ChevronUp className="w-5 h-5 text-green-700" />
                                    ) : (
                                      <ChevronDown className="w-5 h-5 text-green-700" />
                                    )}
                                  </div>
                                </div>

                                {/* Body */}
                                <AnimatePresence>
                                  {isExpanded && (
                                    <motion.div
                                      initial={{ opacity: 0, height: 0 }}
                                      animate={{ opacity: 1, height: "auto" }}
                                      exit={{ opacity: 0, height: 0 }}
                                      transition={{ duration: 0.2 }}
                                      className="p-4 border-t border-[#BFD7EA] bg-white"
                                    >
                                      <div className="mt-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="bg-[#094C810D] border border-[#BFD7EA] rounded-md p-3 text-gray-700">
                                          <p className="font-semibold text-[#1E516A] text-sm mb-1">
                                            Resolution Reason
                                          </p>
                                          {resolution.reason ||
                                            "No reason provided"}
                                        </div>
                                        <div className="bg-[#094C810D] border border-[#BFD7EA] rounded-md p-3 text-gray-700">
                                          <p className="font-semibold text-[#1E516A] text-sm mb-1">
                                            Resolver Contact
                                          </p>
                                          <div className="text-sm">
                                            <p className="text-gray-600">
                                              {resolution.resolver?.full_name ||
                                                "N/A"}
                                            </p>
                                            <p className="text-gray-500 text-xs mt-1">
                                              {resolution.resolver
                                                ?.phone_number ||
                                                "No phone number"}
                                            </p>
                                          </div>
                                        </div>
                                      </div>

                                      {resolutionFiles.length > 0 && (
                                        <div className="mt-4">
                                          <h5 className="font-semibold text-[#1E516A] mb-3">
                                            Attachments (
                                            {resolutionFiles.length})
                                          </h5>
                                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                            {resolutionFiles.map(
                                              (file: any, idx: number) => (
                                                <FileCard
                                                  key={`${resolution.resolution_id}-${idx}`}
                                                  file={file}
                                                  onOpen={() =>
                                                    openFileViewer(
                                                      resolutionFiles,
                                                      idx
                                                    )
                                                  }
                                                />
                                              )
                                            )}
                                          </div>
                                        </div>
                                      )}
                                    </motion.div>
                                  )}
                                </AnimatePresence>
                              </div>
                            );
                          }
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}

              {complaint?.status !== "resolved" ? (
                <>
                  <h3 className="text-[#1E516A] font-semibold text-lg mt-4 mb-3 flex items-center gap-2">
                    🎯 Select Action
                  </h3>

                  <div className="flex flex-col md:flex-row gap-4 mb-6">
                    {actionButtons.map((action) => (
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
                            <Lock className="w-4 h-4 text-gray-400" />
                          </div>
                        )}
                        <div className="flex items-center gap-2 mb-1">
                          <div
                            className={`w-5 h-5 rounded-full flex items-center justify-center ${selectedAction === action.key
                              ? "bg-[#0C4A6E]" // Primary background
                              : action.enabled
                                ? "border-2 border-gray-300"
                                : "border-2 border-gray-200 bg-gray-100"
                              }`}
                          >
                            {selectedAction === action.key && (
                              <Check className="w-3 h-3 text-white" />
                            )}
                          </div>
                          <p
                            className={`font-semibold ${action.enabled
                              ? "text-[#1E516A]"
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
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 bg-opacity-75 p-4">
              <div className="bg-white rounded-lg w-full max-w-6xl h-[90vh] flex flex-col">
                <div className="flex justify-between items-center p-4 border-b">
                  <h3 className="text-lg font-semibold text-[#1E516A]">
                    File Preview{" "}
                    <span className="text-xs text-gray-500">
                      ({fileViewerState.files[fileViewerState.index].name})
                    </span>
                  </h3>
                  <button
                    onClick={closeFileViewer}
                    className="p-2 hover:bg-gray-100 rounded-full"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="flex-1 p-4 flex flex-col">
                  <div className="flex-1">
                    <FileViewer
                      fileUrl={fileViewerState.files[fileViewerState.index].url}
                    />
                  </div>
                  {fileViewerState.files.length > 1 && (
                    <div className="mt-4 flex items-center justify-between">
                      <button
                        className="flex items-center gap-1 px-3 py-1 rounded-md border border-gray-300 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() =>
                          setFileViewerState((prev) =>
                            !prev
                              ? prev
                              : {
                                ...prev,
                                index:
                                  (prev.index - 1 + prev.files.length) %
                                  prev.files.length,
                              }
                          )
                        }
                      >
                        <ChevronLeft className="w-4 h-4" />
                        Previous
                      </button>
                      <span className="text-xs text-gray-500">
                        {fileViewerState.index + 1} /{" "}
                        {fileViewerState.files.length}
                      </span>
                      <button
                        className="flex items-center gap-1 px-3 py-1 rounded-md border border-gray-300 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() =>
                          setFileViewerState((prev) =>
                            !prev
                              ? prev
                              : {
                                ...prev,
                                index: (prev.index + 1) % prev.files.length,
                              }
                          )
                        }
                      >
                        Next
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Image Gallery Modal */}
          {modalImageIndex !== null && complaintFiles.length > 0 && (
            <div
              className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75"
              onClick={closeModal}
            >
              <div
                className="relative max-w-[90%] max-h-[90%] bg-white rounded-lg overflow-hidden"
                onClick={(e) => e.stopPropagation()}
              >
                <img
                  src={complaintFiles[modalImageIndex].url}
                  alt={`Attachment ${modalImageIndex + 1}`}
                  className="max-w-full max-h-full object-contain"
                />
                <button
                  className="absolute top-4 right-4 text-white bg-black bg-opacity-50 rounded-full p-2 hover:bg-opacity-70"
                  onClick={closeModal}
                >
                  <X className="w-5 h-5" />
                </button>
                {complaintFiles.length > 1 && (
                  <>
                    <button
                      className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white bg-black bg-opacity-50 rounded-full p-2 hover:bg-opacity-70"
                      onClick={prevImage}
                    >
                      <ChevronLeft className="w-6 h-6" />
                    </button>
                    <button
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white bg-black bg-opacity-50 rounded-full p-2 hover:bg-opacity-70"
                      onClick={nextImage}
                    >
                      <ChevronRight className="w-6 h-6" />
                    </button>
                  </>
                )}
                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-white bg-black bg-opacity-50 rounded-full px-3 py-1 text-sm">
                  {modalImageIndex + 1} / {complaintFiles.length}
                </div>
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