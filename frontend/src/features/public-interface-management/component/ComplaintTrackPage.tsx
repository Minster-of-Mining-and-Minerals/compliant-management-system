"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BiToggleLeft, BiToggleRight } from "react-icons/bi";
import { Eye, X } from "lucide-react";
import { getFileUrl, getFileType } from "@/utils/fileUrl";
/* ================= TYPES ================= */

type ComplaintStatus = "Submitted" | "Under Review" | "Resolved";

interface Attachment {
  attachment_id: string;
  file_name: string;
  file_path: string;
}

interface Complaint {
  trackingId: string;
  status: ComplaintStatus;
  category: string;
  sector: string;
  department: string;
  incidentDate: string;
  submittedAt: string;
  description: string;
  requestedAction: string;
  attachments?: Attachment[];
  response?: {
    respondedAt: string;
    office: string;
    description: string;
    attachments?: Attachment[];
  };
  personalInfo?: {
    fullName: string;
    phone: string;
    email: string;
    city: string;
  };
}

/* ================= STATUS COLORS ================= */

const statusColorMap: Record<ComplaintStatus, string> = {
  Submitted: "bg-gray-200 text-gray-800",
  "Under Review": "bg-yellow-100 text-yellow-800",
  Resolved: "bg-green-100 text-green-700",
};

/* ================= ATTACHMENT LIST ================= */

interface Attachment {
  attachment_id: string;
  file_name: string;
  file_path: string;
}

interface AttachmentListProps {
  title: string;
  files?: Attachment[];
}

export const AttachmentList: React.FC<AttachmentListProps> = ({
  title,
  files,
}) => {
  const [previewFile, setPreviewFile] = useState<Attachment | null>(null);

  if (!files || files.length === 0) return null;

  return (
    <div className="space-y-2">
      <p className="font-medium text-golden-dark">{title}</p>

      <div className="grid grid-cols-1 gap-2">
        {files.map((file) => {
          const previewUrl = getFileUrl(file.file_path);

          return (
            <div
              key={file.attachment_id}
              className="flex items-center justify-between border border-gray-200 rounded-md p-2 bg-gray-50"
            >
              <div className="flex items-center gap-2">
                {getFileType(file.file_name) === "image" && (
                  <img
                    src={previewUrl}
                    alt={file.file_name}
                    className="w-10 h-10 object-cover border rounded"
                  />
                )}

                <span className="text-sm text-gray-700 truncate max-w-[160px]">
                  {file.file_name}
                </span>
              </div>

              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => setPreviewFile(file)}
                className="w-8 h-8 text-[#094C81] hover:bg-gray-100"
              >
                <Eye className="w-5 h-5" />
              </Button>
            </div>
          );
        })}
      </div>

      {/* ================= Preview Modal ================= */}
      {previewFile && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] p-4 relative overflow-auto">
            <button
              className="absolute top-2 right-2 p-2 rounded-full hover:bg-gray-200"
              onClick={() => setPreviewFile(null)}
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-semibold mb-4">
              {previewFile.file_name}
            </h3>

            {getFileType(previewFile.file_name) === "image" && (
              <img
                src={getFileUrl(previewFile.file_path)}
                alt={previewFile.file_name}
                className="w-full h-auto max-h-[70vh] object-contain"
              />
            )}

            {getFileType(previewFile.file_name) === "pdf" && (
              <iframe
                src={getFileUrl(previewFile.file_path)}
                className="w-full h-[70vh]"
                title={previewFile.file_name}
              />
            )}

            {getFileType(previewFile.file_name) === "other" && (
              <p className="text-gray-600">
                Preview not available for this file type.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

/* ================= PAGE ================= */

const ComplaintTrackPage = () => {
  const t = useTranslations("ComplaintTrackPage");

  const [trackingId, setTrackingId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPersonalInfo, setShowPersonalInfo] = useState(false);
  const [complaint, setComplaint] = useState<Complaint | null>(null);

  /* ================= TRACK HANDLER ================= */

  const handleTrack = async () => {
    if (!trackingId.trim()) {
      setError(t("errors.required"));
      return;
    }

    setError("");
    setLoading(true);

    // 🔹 MOCK API (replace later)
    setTimeout(() => {
      if (trackingId === "CMP-12345") {
        setComplaint({
          trackingId: "CMP-12345",
          status: "Resolved",
          category: "Service Complaint",
          sector: "Mining License",
          department: "Licensing Directorate",
          incidentDate: "2025-01-04",
          submittedAt: "2025-01-05",
          description:
            "My mining license application has been delayed without explanation.",
          requestedAction: "Please review and provide status update.",

          // 🔹 COMPLAINT EVIDENCE
          attachments: [
            {
              attachment_id: "a1",
              file_name: "evidence_photo.jpg",
              file_path: "uploads/complaints/evidence_photo.jpg",
            },
          ],
          // 🔹 OFFICIAL RESPONSE
          response: {
            respondedAt: "2025-01-12",
            office: "Mining License Directorate",
            description:
              "After reviewing your complaint, we found missing documentation. Your application has now been processed.",
            attachments: [
              {
                attachment_id: "a1",
                file_name: "evidence_photo.jpg",
                file_path: "uploads/complaints/evidence_photo.jpg",
              },
            ],
          },

          personalInfo: {
            fullName: "Optional User",
            phone: "+2519******",
            email: "example@email.com",
            city: "Addis Ababa",
          },
        });
      } else {
        setComplaint(null);
        setError(t("errors.notFound"));
      }
      setLoading(false);
    }, 1200);
  };

  /* ================= UI ================= */

  return (
    <main className="flex flex-col min-h-screen mx-auto px-4 sm:px-6 lg:px-20 pt-32 pb-16">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">{t("title")}</h1>
        <p className="mt-2 text-sm text-gray-600 max-w-2xl">{t("subtitle")}</p>
      </div>

      {/* Tracking Input */}
      <div className="max-w-xl rounded-md shadow-md px-8 py-6 mb-10">
        <label className="block text-sm text-golden-dark mb-1">
          {t("trackingId")}
        </label>
        <Input
          value={trackingId}
          onChange={(e) => setTrackingId(e.target.value)}
          placeholder="CMP-12345"
          className="h-12"
        />

        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}

        <Button onClick={handleTrack} disabled={loading} className="mt-4 h-12">
          {loading ? t("loading") : t("track")}
        </Button>
      </div>

      {/* ================= RESULT ================= */}
      {complaint && (
        <div className="space-y-8">
          {/* ===== Complaint Details ===== */}
          <div className="rounded-md shadow-md px-10 py-8 space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold">{t("details.title")}</h2>
              <span
                className={`px-4 py-1 rounded-full text-sm font-medium ${statusColorMap[complaint.status]}`}
              >
                {complaint.status}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <p>
                <b>{t("details.trackingId")}:</b> {complaint.trackingId}
              </p>
              <p>
                <b>{t("details.category")}:</b> {complaint.category}
              </p>
              <p>
                <b>{t("details.sector")}:</b> {complaint.sector}
              </p>
              <p>
                <b>{t("details.department")}:</b> {complaint.department}
              </p>
              <p>
                <b>{t("details.incidentDate")}:</b> {complaint.incidentDate}
              </p>
              <p>
                <b>{t("details.submittedAt")}:</b> {complaint.submittedAt}
              </p>
            </div>

            <div>
              <p className="font-medium text-golden-dark mb-1">
                {t("details.description")}
              </p>
              <p className="text-sm text-gray-700">{complaint.description}</p>
            </div>

            <AttachmentList
              title={t("response.attachments")}
              files={complaint.response?.attachments}
            />

            {/* Personal Info Toggle */}
            <button
              onClick={() => setShowPersonalInfo(!showPersonalInfo)}
              className="flex items-center gap-2 text-golden-dark"
            >
              {showPersonalInfo ? (
                <BiToggleRight className="h-8 w-8" />
              ) : (
                <BiToggleLeft className="h-8 w-8" />
              )}
              {t("personalInfo.toggle")}
            </button>

            {showPersonalInfo && complaint.personalInfo && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <p>
                  <b>{t("personalInfo.fullName")}:</b>{" "}
                  {complaint.personalInfo.fullName}
                </p>
                <p>
                  <b>{t("personalInfo.phone")}:</b>{" "}
                  {complaint.personalInfo.phone}
                </p>
                <p>
                  <b>{t("personalInfo.email")}:</b>{" "}
                  {complaint.personalInfo.email}
                </p>
                <p>
                  <b>{t("personalInfo.city")}:</b> {complaint.personalInfo.city}
                </p>
              </div>
            )}
          </div>

          {/* ===== Official Response ===== */}
          <div className="rounded-md shadow-md px-10 py-8 border-l-4 border-golden-dark">
            <h2 className="text-lg font-semibold mb-4">
              {t("response.title")}
            </h2>

            {!complaint.response ? (
              <p className="text-sm text-gray-600">
                {t("response.noResponse")}
              </p>
            ) : (
              <div className="space-y-4 text-sm">
                <p>
                  <b>{t("response.date")}:</b> {complaint.response.respondedAt}
                </p>
                <p>
                  <b>{t("response.office")}:</b> {complaint.response.office}
                </p>

                <div>
                  <p className="font-medium text-golden-dark mb-1">
                    {t("response.description")}
                  </p>
                  <p className="text-gray-700">
                    {complaint.response.description}
                  </p>
                </div>

                <AttachmentList
                  title={t("response.attachments")}
                  files={complaint.response?.attachments}
                />
              </div>
            )}
          </div>
        </div>
      )}
    </main>
  );
};

export default ComplaintTrackPage;
