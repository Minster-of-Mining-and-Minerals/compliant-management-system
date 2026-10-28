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
import { TextArea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface CreateComplaintCategoryModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const CreateComplaintCategoryModal: React.FC<
    CreateComplaintCategoryModalProps
> = ({ isOpen, onClose }) => {
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    // Amharic name/description — optional, the public pages fall back to English
    const [nameAm, setNameAm] = useState("");
    const [descriptionAm, setDescriptionAm] = useState("");
    const [type, setType] = useState<"internal" | "external">("internal");


    const [createCategory, { isLoading }] =
        useCreateComplaintCategoryMutation();

    const handleSubmit = async () => {
        if (!name.trim()) {
            toast.error("Category name is required");
            return;
        }

        const payload: CreateComplaintCategoryPayload = {
            name: name.trim(),
            type,
            ...(description && { description: description.trim() }),
            ...(nameAm.trim() && { name_am: nameAm.trim() }),
            ...(descriptionAm.trim() && { description_am: descriptionAm.trim() }),
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
        setNameAm("");
        setDescriptionAm("");
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
            <div className="bg-white p-6 rounded-2xl w-full max-w-[500px] shadow-2xl">
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
                    <div className="w-full flex items-center justify-between gap-4">
                        <div className="w-full space-y-2">
                            <Label className="block text-sm text-golden-dark font-medium">
                                Category Type <span className="text-red-500">*</span>
                            </Label>

                            <Select
                                value={type}
                                onValueChange={(val) => setType(val as "internal" | "external")}
                            >
                                <SelectTrigger className="w-full h-12 border border-golden-dark focus:ring focus:ring-golden-dark focus:border-transparent rounded-md transition-all duration-200 outline-none px-4 py-3 text-[#094C81] bg-white">
                                    <SelectValue placeholder="Select Category Type" />
                                </SelectTrigger>

                                <SelectContent className="text-[#094C81] bg-white">
                                    <SelectItem value="internal">Internal</SelectItem>
                                    <SelectItem value="external">External</SelectItem>
                                </SelectContent>
                            </Select>

                        </div>
                        <div className="w-full space-y-2">
                            <Label className="text-sm font-medium text-golden-dark">
                                Category Name (English) <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="e.g. Service Delay"
                                className="border border-golden-dark px-4 rounded-md focus:ring focus:ring-golden-dark"
                            />
                        </div>
                    </div>


                    <div className="space-y-2">
                        <Label htmlFor="category-name-am" className="text-sm font-medium text-golden-dark">
                            ስም (አማርኛ) <span className="font-normal text-gray-500">— optional</span>
                        </Label>
                        <Input
                            id="category-name-am"
                            lang="am"
                            value={nameAm}
                            onChange={(e) => setNameAm(e.target.value)}
                            placeholder="ለምሳሌ፦ የአገልግሎት መዘግየት"
                            className="border border-golden-dark px-4 rounded-md focus:ring focus:ring-golden-dark"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label className="text-sm font-medium text-golden-dark">
                            Description (English)
                        </Label>
                        <TextArea
                            rows={3}
                            value={description}
                            onChange={(val) => setDescription(val)}
                            placeholder="Optional description"
                            className="border border-golden-dark px-4 rounded-md focus:ring focus:ring-golden-dark"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="category-description-am" className="text-sm font-medium text-golden-dark">
                            መግለጫ (አማርኛ) <span className="font-normal text-gray-500">— optional</span>
                        </Label>
                        <TextArea
                            id="category-description-am"
                            rows={3}
                            value={descriptionAm}
                            onChange={(val) => setDescriptionAm(val)}
                            placeholder="Optional"
                            className="border border-golden-dark px-4 rounded-md focus:ring focus:ring-golden-dark"
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
