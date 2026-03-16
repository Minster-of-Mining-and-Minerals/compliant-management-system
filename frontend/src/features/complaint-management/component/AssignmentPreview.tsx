"use client";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import UserAssignmentPreview from "./UserAssignmentPreview";
import DepartmentAssignmentPreview from "./DepartmentAssignmentPreview";
import { useState } from "react";

interface AssignmentPreviewProps {
    complaint_id: string;
    onClose?: () => void;
}

export default function AssignmentPreview({
    complaint_id,
    onClose,
}: AssignmentPreviewProps) {
    const [tab, setTab] = useState<"users" | "departments">("users");

    return (
        <motion.div
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 100 }}
            transition={{ duration: 0.35, ease: "easeInOut" }}
            className="absolute rounded-xl top-0 right-0 w-full lg:w-[360px] bg-white border-l border-[#D5E3EC] h-full flex flex-col shadow-xl"
        >
            {/* Header (Tabs) */}
            <div className="p-6 border-b border-[#D5E3EC] bg-gradient-to-r from-golden-dark50 to-golden-dark80">
                <div className="flex bg-white/20 p-1 rounded-xl w-fit mb-4 relative shadow-inner">
                    <button
                        onClick={() => setTab("users")}
                        className={`relative px-6 py-2.5 text-base font-semibold rounded-lg transition-colors w-32 text-center outline-none ${
                            tab === "users" ? "text-slate-900 shadow-sm" : "text-white hover:text-white/80"
                        }`}
                    >
                        {tab === "users" && (
                            <motion.div
                                layoutId="activeTabBackground"
                                className="absolute inset-0 bg-white rounded-lg shadow-sm"
                                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                            />
                        )}
                        <span className="relative z-10">Users</span>
                    </button>
                    <button
                        onClick={() => setTab("departments")}
                        className={`relative px-6 py-2.5 text-base font-semibold rounded-lg transition-colors w-36 text-center outline-none ${
                            tab === "departments" ? "text-slate-900 shadow-sm" : "text-white hover:text-white/80"
                        }`}
                    >
                        {tab === "departments" && (
                            <motion.div
                                layoutId="activeTabBackground"
                                className="absolute inset-0 bg-white rounded-lg shadow-sm"
                                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                            />
                        )}
                        <span className="relative z-10">Departments</span>
                    </button>
                </div>

                <p className="text-white/90 text-sm mt-2 font-medium">
                    {tab === "users"
                        ? "Select users to assign this complaint to"
                        : "Select departments to assign this complaint to"}
                </p>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
                {tab === "users" ? (
                    <UserAssignmentPreview complaint_id={complaint_id} />
                ) : (
                    <DepartmentAssignmentPreview complaint_id={complaint_id} />
                )}
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-[#D5E3EC] bg-white">
                <div className="flex gap-3">
                    <Button
                        onClick={onClose}
                        className="flex-1 h-11 bg-golden-dark20 text-gray-700 py-3 rounded-lg font-semibold hover:bg-golden-dark30 transition-colors duration-200"
                    >
                        Cancel
                    </Button>
                </div>
            </div>
        </motion.div>
    );
}