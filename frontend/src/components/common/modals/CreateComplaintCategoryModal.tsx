"use client";

import React, { useState } from "react";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { XIcon } from "lucide-react";
import {
    useCreateComplaintCategoryMutation,
} from "@/redux/api/complaintCategoryApi";
import { CreateComplaintCategoryPayload } from "@/redux/types/complaintCategory";

interface CreateComplaintCategoryModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const CreateComplaintCategoryModal: React.FC<
    CreateComplaintCategoryModalProps
> = ({ isOpen, onClose }) => {
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");

    const [createCategory, { isLoading }] =
        useCreateComplaintCategoryMutation();

    const handleSubmit = async () => {
        if (!name.trim()) {
            toast.error("Category name is required");
            return;
        }

        const payload: CreateComplaintCategoryPayload = {
            name: name.trim(),
            ...(description && { description: description.trim() }),
        };

        try {
            await createCategory(payload).unwrap();
            toast.success("Complaint category created successfully");
            handleClose();
        } catch (error: any) {
            toast.error(
                error?.data?.message || "Failed to create complaint category"
            );
        }
    };

    const handleClose = () => {
        setName("");
        setDescription("");
        onClose();
    };

    const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (e.target === e.currentTarget) handleClose();
    };

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
            onClick={handleBackdropClick}
        >
            <div className="bg-white p-6 rounded-2xl w-full max-w-[600px] shadow-2xl">
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold text-[#094C81]">
                        Create Complaint Category
                    </h2>
                    <button
                        onClick={handleClose}
                        className="text-[#094C81] hover:text-gray-600 transition"
                    >
                        <XIcon className="w-6 h-6 cursor-pointer" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex flex-col space-y-4">
                    <div className="space-y-2">
                        <Label className="text-sm font-medium text-[#094C81]">
                            Category Name <span className="text-red-500">*</span>
                        </Label>
                        <Input
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g. Service Delay"
                            className="h-12 border border-gray-300 px-4 rounded-md focus:ring focus:ring-[#094C81]"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label className="text-sm font-medium text-[#094C81]">
                            Description
                        </Label>
                        <Input
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Optional description"
                            className="h-12 border border-gray-300 px-4 rounded-md focus:ring focus:ring-[#094C81]"
                        />
                    </div>
                </div>

                {/* Footer */}
                <div className="flex justify-end space-x-3 mt-6 pt-4 border-t">
                    <Button variant="outline" onClick={handleClose}>
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        disabled={isLoading}
                        className="min-w-28"
                    >
                        {isLoading ? "Creating..." : "Create"}
                    </Button>
                </div>
            </div>
        </div>
    );
};
