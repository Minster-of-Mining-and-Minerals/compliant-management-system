"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Eye,
  FileText,
  X,
  CheckCircle2,
  Check,
  Circle,
  Search,
  XCircle,
} from "lucide-react";
import { getFileUrl, getFileType } from "@/utils/fileUrl";
import { useGetComplaintByTicketingCodeQuery } from "@/redux/api/complaintApi";
import { useSearchParams } from "next/navigation";
import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { formatDate, formatTime } from "@/utils/date";
import PublicPageBanner from "@/components/layout/PublicPageBanner";

/* ================= TYPES ================= */

type ComplaintStatus =
  | "pending"
  | "under_review"
  | "assigned"
  | "in_progress"
  | "resolved"
  | "rejected"
  | "closed";

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
  updated_at?: string;
  description: string;
  request?: string;
  is_anonymous: boolean;

  assignedSector?: {
    name: string;
  };

  assignedTo?: { full_name: string } | null;
  acceptedBy?: { full_name: string } | null;

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

// How far along the public timeline each backend status is
const STATUS_STAGE: Record<ComplaintStatus, number> = {
  pending: 0,
  under_review: 1,
  assigned: 2,
  in_progress: 2,
  resolved: 3,
  closed: 3,
  rejected: 3,
};

const getStatusStyle = (status: ComplaintStatus) => {
  switch (status) {
    case "pending":
      return "bg-yellow-100 text-yellow-800";
    case "under_review":
      return "bg-sky-100 text-sky-800";
    case "assigned":
      return "bg-purple-100 text-purple-800";
    case "in_progress":
      return "bg-blue-100 text-blue-800";
    case "resolved":
    case "closed":
      return "bg-green-100 text-green-800";
    case "rejected":
      return "bg-red-100 text-red-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

// Only show part of contact details — anyone holding the ticket number can open this page
const maskPhone = (phone?: string) =>
  phone ? phone.replace(/.(?=.{3})/g, "•") : "";
const maskEmail = (email?: string) => {
  if (!email) return "";
  const [name, domain] = email.split("@");
  if (!domain) return email;
  return `${name.slice(0, 2)}${"•".repeat(Math.max(name.length - 2, 1))}@${domain}`;
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
  const t = useTranslations("ComplaintTrackPage");
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
              <span className="sr-only">{t("viewer.close")}</span>
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
              <p className="text-gray-600 mb-4 text-sm sm:text-base">{t("viewer.noPreview")}</p>
              <a href={selectedFile.url} download target="_blank" rel="noreferrer">
                <Button variant="default">{t("viewer.download")}</Button>
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

/* ================= TIMELINE ================= */

const StatusTimeline = ({ complaint }: { complaint: Complaint }) => {
  const t = useTranslations("ComplaintTrackPage");
  const stage = STATUS_STAGE[complaint.status] ?? 0;
  const isRejected = complaint.status === "rejected";
  const latestResolution = complaint.resolution?.[complaint.resolution.length - 1];
  const handler = complaint.assignedTo?.full_name || complaint.acceptedBy?.full_name;

  const steps = [
    {
      title: t("timeline.submitted"),
      description: t("timeline.submittedDesc"),
      date: complaint.created_at,
    },
    {
      title: t("timeline.underReview"),
      description: complaint.assignedSector?.name
        ? t("timeline.underReviewDesc", { sector: complaint.assignedSector.name })
        : t("timeline.underReviewDescNoSector"),
    },
    {
      title: t("timeline.inProgress"),
      description: handler
        ? t("timeline.inProgressDescWithName", { name: handler })
        : t("timeline.inProgressDesc"),
    },
    {
      title: isRejected ? t("timeline.rejected") : t("timeline.resolved"),
      description: isRejected ? t("timeline.rejectedDesc") : t("timeline.resolvedDesc"),
      date: latestResolution?.resolved_at,
    },
  ];

  return (
    <ol className="relative">
      {steps.map((item, index) => {
        const isDone = index < stage || (index === stage && index === steps.length - 1);
        const isCurrent = index === stage && !isDone;
        const isLast = index === steps.length - 1;
        const isFailed = isLast && isRejected && isDone;

        return (
          <li key={item.title} className="relative flex gap-4 pb-8 last:pb-0">
            {!isLast && (
              <span
                aria-hidden
                className={`absolute left-[15px] top-8 h-[calc(100%-2rem)] w-0.5 ${index < stage ? "bg-green-500" : "bg-slate-200"}`}
              />
            )}
            <span
              className={`relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full
                ${isFailed ? "bg-red-500 text-white" : ""}
                ${isDone && !isFailed ? "bg-green-500 text-white" : ""}
                ${isCurrent ? "bg-white border-2 border-blue-500 text-blue-500 ring-4 ring-blue-100" : ""}
                ${!isDone && !isCurrent ? "bg-white border-2 border-slate-200 text-slate-300" : ""}
              `}
            >
              {isFailed ? (
                <XCircle className="h-4 w-4" />
              ) : isDone ? (
                <Check className="h-4 w-4" />
              ) : (
                <Circle className={`h-2.5 w-2.5 ${isCurrent ? "fill-blue-500" : "fill-slate-200"}`} />
              )}
            </span>
            <div className="min-w-0 pt-1">
              <p
                className={`text-sm font-semibold ${isDone || isCurrent ? "text-slate-900" : "text-slate-400"}`}
              >
                {item.title}
                {isCurrent && (
                  <span className="ml-2 rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">
                    {t("timeline.current")}
                  </span>
                )}
              </p>
              {(isDone || isCurrent) && (
                <p className="mt-0.5 text-sm text-slate-500">{item.description}</p>
              )}
              {item.date && (isDone || isCurrent) && (
                <p className="mt-0.5 text-xs text-slate-400">
                  {formatDate(item.date)} · {formatTime(item.date)}
                </p>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
};

/* ================= PAGE ================= */

const ComplaintTrackPage = () => {
  const t = useTranslations("ComplaintTrackPage");
  const [trackingId, setTrackingId] = useState("");
  const [inputError, setInputError] = useState("");
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

  const { data, isFetching, error } =
    useGetComplaintByTicketingCodeQuery(ticketNumber ?? "", {
      skip: !ticketNumber,
    });

  // The public endpoint returns a richer shape than the shared Complaint type
  const complaint: Complaint | null = !error && data ? (data as unknown as Complaint) : null;

  const handleTrack = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!trackingId.trim()) {
      setInputError(t("errors.required"));
      return;
    }
    setInputError("");
    router.push(`/track-complaint?ticketNumber=${encodeURIComponent(trackingId.trim())}`);
  };

  const getFiles = (attachments: AttachmentWrapper[] = []) => {
    return attachments.map((a) => ({
      url: getFileUrl(a.attachment.file_path),
      name: a.attachment.file_name,
      uploadedAt: a.attachment.created_at,
      type: getFileType(a.attachment.file_name),
    }));
  };

  const openFile = (file: { url: string; name: string; type: string }) => {
    setSelectedFile(file);
    setIsViewerOpen(true);
  };

  const FileCard = ({ file, onClick }: { file: any; onClick: () => void }) => (
    <button
      type="button"
      onClick={onClick}
      className="w-full text-left border rounded-lg p-3 hover:bg-blue-50 flex items-center gap-3 bg-white transition-colors"
    >
      <FileText className="w-5 h-5 text-blue-500 shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm truncate" title={file.name}>
          {shortenFileName(file.name)}
        </p>
        <p className="text-xs text-gray-500">
          {file.uploadedAt && formatDate(file.uploadedAt)}
        </p>
      </div>
      <Eye className="w-4 h-4 text-blue-600 shrink-0" />
    </button>
  );

  const InfoItem = ({ label, value }: { label: string; value: React.ReactNode }) => (
    <div>
      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">{label}</p>
      <p className="text-slate-700 font-medium break-words">{value || "-"}</p>
    </div>
  );

  return (
    <>
    <PublicPageBanner title={t("title")} subtitle={t("subtitle")} breadcrumb={t("title")} align="center">
      {/* Tracking Input */}
      <form
        onSubmit={handleTrack}
        className="mx-auto mt-8 max-w-2xl text-left"
      >
        <label htmlFor="trackingId" className="sr-only">
          {t("trackingId")}
        </label>
        <div className="flex flex-col sm:flex-row gap-2 rounded-2xl bg-white p-2 shadow-2xl shadow-black/30">
          <div className="flex-1 min-w-0">
            <Input
              id="trackingId"
              value={trackingId}
              onChange={(e) => {
                setTrackingId(e.target.value);
                setInputError("");
              }}
              placeholder={`${t("trackingId")} — TICK-XXXX`}
              autoComplete="off"
              aria-invalid={!!inputError}
              className="h-12 border-0 shadow-none font-mono text-base tracking-wide text-slate-900 focus-visible:ring-2 focus-visible:ring-primary/30"
            />
          </div>
          <Button
            type="submit"
            disabled={isFetching}
            className="h-12 px-7 bg-primary hover:bg-primary/90 text-white text-base font-semibold rounded-lg"
          >
            <Search className="w-4 h-4 mr-2" />
            {isFetching ? t("loading") : t("track")}
          </Button>
        </div>
        {inputError && <p className="mt-2 text-sm font-medium text-red-200">{inputError}</p>}
      </form>
    </PublicPageBanner>

    <main className="relative z-10 mx-auto w-full max-w-5xl px-4 sm:px-6 lg:px-8 -mt-16 pb-16">
      <div className="flex flex-col gap-8">

        {/* Complaint Detail */}
        {isFetching ? (
          <ComplaintSkeleton />
        ) : complaint ? (
          <div className="flex-1 min-w-0 space-y-6">
            {/* Status & Timeline */}
            <div className="bg-white border rounded-xl p-6 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-slate-900">{t("details.title")}</h2>
                  <p className="text-slate-500 font-medium font-mono">#{complaint.ticketing_code}</p>
                </div>
                <span
                  className={`w-fit px-4 py-1.5 rounded-full text-sm font-bold shadow-sm ${getStatusStyle(complaint.status)}`}
                >
                  {t(`statusLabels.${complaint.status}`)}
                </span>
              </div>

              <div className="grid md:grid-cols-5 gap-8">
                <div className="md:col-span-2">
                  <h3 className="text-sm font-bold text-slate-900 mb-4">{t("timeline.title")}</h3>
                  <StatusTimeline complaint={complaint} />
                </div>

                <div className="md:col-span-3 grid grid-cols-2 gap-6 content-start md:border-l md:border-slate-100 md:pl-8">
                  <InfoItem label={t("details.sector")} value={complaint.assignedSector?.name} />
                  <InfoItem label={t("details.category")} value={complaint.category?.name} />
                  <InfoItem label={t("details.submittedAt")} value={formatDate(complaint.created_at)} />
                  <InfoItem label={t("details.time")} value={formatTime(complaint.created_at)} />
                </div>
              </div>
            </div>

            {/* Resolution Section */}
            {complaint.resolution && complaint.resolution.length > 0 ? (
              <div className="bg-white border border-green-100 rounded-xl overflow-hidden shadow-sm">
                <div className="bg-green-50/50 px-6 py-4 border-b border-green-100 flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                  <h3 className="text-lg font-bold text-green-900">{t("response.title")}</h3>
                </div>

                <div className="p-6 space-y-6">
                  {complaint.resolution.map((res, idx) => (
                    <div key={res.resolution_id} className={idx > 0 ? "pt-6 border-t border-slate-100" : ""}>
                      <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-4">
                        <div className="bg-slate-50 border px-4 py-3 rounded-xl flex-1 w-full">
                          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                            {t("response.description")}
                          </h4>
                          <p className="text-slate-700 text-sm leading-relaxed whitespace-pre-line">{res.reason}</p>
                        </div>
                        <div className="sm:text-right shrink-0">
                          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                            {t("response.date")}
                          </p>
                          <p className="text-slate-700 text-sm font-medium">{formatDate(res.resolved_at)}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 text-xs font-bold">
                          {res.resolver?.full_name?.charAt(0) || "R"}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                            {t("response.resolver")}
                          </p>
                          <p className="text-slate-700 text-sm font-semibold">
                            {res.resolver?.full_name || t("response.officialResponder")}
                          </p>
                        </div>
                      </div>

                      {res.attachments && res.attachments.length > 0 && (
                        <div className="mt-4">
                          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
                            {t("response.attachments")}
                          </h4>
                          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3">
                            {getFiles(res.attachments).map((file, i) => (
                              <FileCard key={i} file={file} onClick={() => openFile(file)} />
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="bg-white border border-dashed rounded-xl p-6 text-center text-sm text-slate-500">
                {t("response.noResponse")}
              </div>
            )}

            {/* Submission content */}
            <div className="bg-white border rounded-xl p-6 shadow-sm space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-slate-50 border border-slate-100 p-5 rounded-xl">
                  <h4 className="text-sm font-bold text-slate-900 mb-2">{t("details.description")}</h4>
                  <p className="text-slate-600 text-sm leading-relaxed whitespace-pre-line break-words">
                    {complaint.description || "-"}
                  </p>
                </div>
                <div className="bg-slate-50 border border-slate-100 p-5 rounded-xl">
                  <h4 className="text-sm font-bold text-slate-900 mb-2">{t("details.requestedAction")}</h4>
                  <p className="text-slate-600 text-sm leading-relaxed whitespace-pre-line break-words">
                    {complaint.request || "-"}
                  </p>
                </div>
              </div>

              {complaint.attachments && complaint.attachments.length > 0 && (
                <div>
                  <h4 className="text-sm font-bold text-slate-900 mb-3">{t("details.attachments")}</h4>
                  <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {getFiles(complaint.attachments).map((file, i) => (
                      <FileCard key={i} file={file} onClick={() => openFile(file)} />
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Complainer Info Section (masked) */}
            {!complaint.is_anonymous && complaint.user ? (
              <div className="bg-white border rounded-xl p-6 shadow-sm">
                <h3 className="text-lg font-bold text-slate-900 mb-4">{t("personalInfo.title")}</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                  <InfoItem label={t("personalInfo.fullName")} value={complaint.user.full_name} />
                  <InfoItem label={t("personalInfo.phone")} value={maskPhone(complaint.user.phone_number)} />
                  <InfoItem label={t("personalInfo.email")} value={maskEmail(complaint.user.email)} />
                </div>
              </div>
            ) : (
              <div className="bg-slate-100/50 border border-dashed rounded-xl p-6 text-center">
                <p className="text-slate-500 text-sm italic">{t("personalInfo.anonymous")}</p>
              </div>
            )}
          </div>
        ) : ticketNumber ? (
          <div className="flex-1 bg-white border border-red-100 rounded-xl p-8 sm:p-12 text-center shadow-sm">
            <X className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-slate-900">{t("notFound.title")}</h3>
            <p className="text-slate-500 mt-2">{t("notFound.message", { ticket: ticketNumber })}</p>
          </div>
        ) : (
          <div className="flex-1 bg-white border border-dashed border-slate-200 rounded-xl p-8 sm:p-12 text-center">
            <FileText className="w-12 h-12 text-golden-dark mx-auto mb-4 opacity-60" />
            <h3 className="text-lg font-semibold text-slate-900">{t("empty.title")}</h3>
            <p className="text-slate-500 mt-1">{t("empty.message")}</p>
          </div>
        )}
      </div>

    </main>

    {/* Rendered outside <main>: main's z-10 stacking context would otherwise keep
        the viewer underneath the fixed header (z-30) */}
    <AttachmentViewerModal
      isOpen={isViewerOpen}
      onClose={() => setIsViewerOpen(false)}
      selectedFile={selectedFile}
    />
    </>
  );
};

export default ComplaintTrackPage;

/* ================= SKELETON ================= */

const ComplaintSkeleton = () => {
  return (
    <div className="flex-1 space-y-6">
      <div className="bg-white border rounded-xl p-6 shadow-sm animate-pulse">
        <div className="h-8 w-48 bg-slate-100 rounded mb-6" />
        <div className="grid md:grid-cols-5 gap-8">
          <div className="md:col-span-2 space-y-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex gap-4">
                <div className="h-8 w-8 rounded-full bg-slate-100" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 w-24 bg-slate-100 rounded" />
                  <div className="h-3 w-40 bg-slate-50 rounded" />
                </div>
              </div>
            ))}
          </div>
          <div className="md:col-span-3 grid grid-cols-2 gap-6 content-start">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="h-3 w-16 bg-slate-50 rounded" />
                <div className="h-4 w-full bg-slate-50 rounded" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
