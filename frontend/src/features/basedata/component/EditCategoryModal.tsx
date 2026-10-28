"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TextArea } from "@/components/ui/textarea";
import { useUpdateComplaintCategoryMutation } from "@/redux/api/complaintCategoryApi";
import type { ComplaintCategory } from "@/redux/types/complaintCategory";

interface EditCategoryModalProps {
  category: ComplaintCategory | null;
  onClose: () => void;
}

// Mirrors the backend updateComplaintCategorySchema
const NAME_MIN = 3;
const NAME_MAX = 100;
const DESCRIPTION_MAX = 500;
const EN_NAME_PATTERN = /^[a-zA-Z0-9\s\-_]+$/;

const labelClass = "block text-sm font-medium text-slate-700";

export default function EditCategoryModal({ category, onClose }: EditCategoryModalProps) {
  const [name, setName] = useState("");
  const [nameAm, setNameAm] = useState("");
  const [description, setDescription] = useState("");
  const [descriptionAm, setDescriptionAm] = useState("");
  const [nameError, setNameError] = useState("");

  const [updateCategory, { isLoading }] = useUpdateComplaintCategoryMutation();

  // Load the selected category's current values whenever the modal opens for one
  useEffect(() => {
    if (category) {
      setName(category.name ?? "");
      setNameAm(category.name_am ?? "");
      setDescription(category.description ?? "");
      setDescriptionAm(category.description_am ?? "");
      setNameError("");
    }
  }, [category]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!category) return;

    const trimmed = name.trim();
    if (trimmed.length < NAME_MIN || trimmed.length > NAME_MAX) {
      setNameError(`English name must be between ${NAME_MIN} and ${NAME_MAX} characters.`);
      return;
    }
    if (!EN_NAME_PATTERN.test(trimmed)) {
      setNameError("English name can only contain letters, numbers, spaces, hyphens and underscores.");
      return;
    }

    try {
      await updateCategory({
        id: category.category_id,
        data: {
          name: trimmed,
          name_am: nameAm.trim(),
          description: description.trim(),
          description_am: descriptionAm.trim(),
        },
      }).unwrap();
      toast.success("Category updated successfully.");
      onClose();
    } catch (err: any) {
      toast.error(err?.data?.message || "Could not update the category. Please try again.");
    }
  };

  return (
    <Dialog open={!!category} onOpenChange={(open) => !open && !isLoading && onClose()}>
      <DialogContent className="sm:max-w-2xl">
        <form onSubmit={handleSave} noValidate>
          <DialogHeader>
            <DialogTitle>Edit category</DialogTitle>
            <DialogDescription>
              Names appear on the public complaint form in the visitor&apos;s language. Amharic is optional —
              if it is empty, the English name is shown.
            </DialogDescription>
          </DialogHeader>

          <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="edit-category-name" className={labelClass}>
                Name (English) <span className="text-red-500">*</span>
              </label>
              <Input
                id="edit-category-name"
                value={name}
                maxLength={NAME_MAX}
                onChange={(e) => {
                  setName(e.target.value);
                  setNameError("");
                }}
                aria-invalid={!!nameError}
                className="mt-1 h-11"
                disabled={isLoading}
              />
              {nameError && <p className="mt-1 text-xs text-red-600">{nameError}</p>}
            </div>

            <div>
              <label htmlFor="edit-category-name-am" className={labelClass}>
                ስም (አማርኛ)
              </label>
              <Input
                id="edit-category-name-am"
                lang="am"
                value={nameAm}
                maxLength={NAME_MAX}
                onChange={(e) => setNameAm(e.target.value)}
                placeholder="Optional"
                className="mt-1 h-11"
                disabled={isLoading}
              />
            </div>

            <div>
              <label htmlFor="edit-category-description" className={labelClass}>
                Description (English)
              </label>
              <TextArea
                id="edit-category-description"
                rows={3}
                maxLength={DESCRIPTION_MAX}
                value={description}
                onChange={setDescription}
                placeholder="Optional"
                className="mt-1"
                disabled={isLoading}
              />
            </div>

            <div>
              <label htmlFor="edit-category-description-am" className={labelClass}>
                መግለጫ (አማርኛ)
              </label>
              <TextArea
                id="edit-category-description-am"
                rows={3}
                maxLength={DESCRIPTION_MAX}
                value={descriptionAm}
                onChange={setDescriptionAm}
                placeholder="Optional"
                className="mt-1"
                disabled={isLoading}
              />
            </div>
          </div>

          <DialogFooter className="mt-6 gap-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading} className="bg-primary text-white hover:bg-primary/90">
              {isLoading ? "Saving..." : "Save changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
