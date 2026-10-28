"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { FileUploadField } from "@/components/ui/FileUploadField";
import { useResolveComplaintMutation } from "@/redux/api/complaintResolutionApi";
import { TextArea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

interface ResolutionPreviewProps {
    complaint_id: string;
    onClose?: () => void;
}

export default function ResolutionPreview({
    complaint_id,
    onClose,
}: ResolutionPreviewProps) {
    const [reason, setReason] = useState("");
    const [attachmentIds, setAttachmentIds] = useState<string[]>([]);

    const [resolveIssue, { isLoading }] = useResolveComplaintMutation();

    const handleSubmit = async () => {
        if (!reason.trim()) {
            return toast.error("Please provide a resolution reason.");
        }

        try {
            await resolveIssue({
                complaint_id,
                reason,
                attachment_ids: attachmentIds,
            }).unwrap();

            toast.success("Issue resolved successfully!");
            onClose?.();
        } catch (error: any) {
            toast.error(error?.data?.message || "Failed to resolve issue.");
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 100 }}
            transition={{ duration: 0.35, ease: "easeInOut" }}
            className="absolute top-0 right-0 w-full lg:w-[360px] bg-white border-l border-[#D5E3EC] h-full rounded-r-lg flex flex-col gap-4 shadow-lg"
        >
            <div className="p-6 border-b border-[#D5E3EC] bg-gradient-to-r from-golden-dark50 to-golden-dark80">
                <h2 className="text-xl font-bold text-white">Resolve Complaint</h2>
                <p className="text-white text-sm mt-1">Upload files related to the resolution</p>
            </div>
            <div className="flex flex-col px-4 gap-3">

                <h4 className="font-semibold text-golden-dark mt-4">Summary</h4>
                <TextArea
                    className="w-fullrounded-lg p-3 text-sm  "
                    placeholder="Explain how this issue was resolved"
                    value={reason}
                    onChange={(val) => setReason(val)}
                />
                <label htmlFor="">
                    <span className="font-semibold text-golden-dark">Attachments</span>
                </label>
                <FileUploadField
                    className="flex flex-col gap-1 font-bold"
                    id="resolution_attachments"
                    label="Upload files"
                    value={attachmentIds}
                    onChange={setAttachmentIds}
                    accept="image/*,.pdf,.doc,.docx"
                    multiple={true}
                    labelClass="text-sm  text-golden-dark "
                />


                <div className="w-full flex justify-end gap-3 mt-3">
                    <Button
                        onClick={onClose}
                        disabled={isLoading}
                        className="px-5 py-2 rounded-md bg-white border border-slate-300 text-primary hover:bg-slate-50"
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        disabled={isLoading}
                        className="px-5 py-2 rounded-md bg-primary text-white hover:bg-primary/90 font-semibold disabled:opacity-50"
                    >
                        {isLoading ? "Submitting..." : "Confirm"}
                    </Button>

                </div>
            </div>
        </motion.div>
    );
}
