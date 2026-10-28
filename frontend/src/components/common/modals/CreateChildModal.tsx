"use client";

import React, { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TextArea } from "@/components/ui/textarea";
import { useCreateSectorNodeMutation } from "@/redux/api/sectorNodeApi";
import { XIcon } from "lucide-react";

interface CreateChildModalProps {
  parent_id: string;
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Create Child Modal Component
 * 
 * Modal for creating a child structure node under a specified parent node.
 * Provides a simple form with name and description fields.
 * 
 * @param parent_id - The ID of the parent structure node
 * @param isOpen - Controls the visibility of the modal
 * @param onClose - Callback function to close the modal
 */
export function CreateChildModal({
  parent_id,
  isOpen,
  onClose,
}: CreateChildModalProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const [createNode, { isLoading: isCreatingNode }] =
    useCreateSectorNodeMutation();

  if (!isOpen) return null;

  /**
   * Handles form submission to create a new child structure node
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error("Structure name is required");
      return;
    }

    try {
      const response = await createNode({
        name: name.trim(),
        description: description.trim() || null,
        parent_id: parent_id || null,
      }).unwrap();

      if (response) {
        toast.success("Structure created successfully!");
        setName("");
        setDescription("");
        onClose();
      }
    } catch (error: unknown) {
      const errorMessage =
        (error as { data?: { message?: string } })?.data?.message ||
        (error as Error)?.message ||
        "Failed to create structure";
      toast.error(errorMessage);
    }
  };
  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) handleClose();
  };
  const handleClose = () => {
    setName("");
    setDescription("");
    onClose();
  };

  return (
    <div

      className="fixed inset-0 flex items-center justify-center bg-black/50 z-50"
      onClick={handleBackdropClick}
    >
      <div className="bg-white p-6 rounded-lg shadow-lg w-[400px] max-h-[85vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-primary">
            Create Child
          </h2>
          <button
            onClick={handleClose}
            className="text-primary hover:text-gray-600 transition-colors duration-200"
            aria-label="Close modal"
          >
            <XIcon className="w-6 h-6 cursor-pointer" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex flex-col gap-4">
            {/* Structure Name Field */}
            <div>
              <Label
                htmlFor="sector-name"
                className="block text-sm text-golden-dark font-medium mb-2"
              >
                Sector Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="sector-name"
                placeholder="Enter sector name"
                value={name}
                className="w-full h-10 border border-golden-dark"
                onChange={(e) => setName(e.target.value)}
                required
                disabled={isCreatingNode}
              />
            </div>

            {/* Description Field */}
            <div>
              <Label
                htmlFor="sector-description"
                className="block text-sm text-golden-dark font-medium mb-2"
              >
                Description
              </Label>
              <TextArea
                id="sector-description"
                placeholder="Enter sector description (optional)"
                value={description}
                onChange={(val) => setDescription(val)}
                className="w-full min-h-[80px] border border-gray-300 px-4 py-3 rounded-md focus:ring focus:ring-primary focus:border-transparent transition-all duration-200 outline-none resize-none"
                disabled={isCreatingNode}
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isCreatingNode}
              className="px-7 flex items-center justify-center"
            >
              Cancel
            </Button>

            <Button
              type="submit"
              disabled={isCreatingNode || !name.trim()}
              className="bg-primary px-7 flex items-center justify-center hover:bg-primary/90 text-white"
            >
              {isCreatingNode ? "Creating..." : "Create"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}