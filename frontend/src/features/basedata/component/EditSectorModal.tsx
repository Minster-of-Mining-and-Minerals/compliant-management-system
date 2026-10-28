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
import { useUpdateSectorNodeMutation } from "@/redux/api/sectorNodeApi";
import type { SectorNode } from "@/redux/types/sectorNode";

interface EditSectorModalProps {
  sector: SectorNode | null;
  onClose: () => void;
}

// Mirrors the backend updateSectorNodeSchema (English name 3–255 chars, Amharic optional)
const NAME_MIN = 3;
const NAME_MAX = 255;

const labelClass = "block text-sm font-medium text-slate-700";

export default function EditSectorModal({ sector, onClose }: EditSectorModalProps) {
  const [name, setName] = useState("");
  const [nameAm, setNameAm] = useState("");
  const [description, setDescription] = useState("");
  const [descriptionAm, setDescriptionAm] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [nameError, setNameError] = useState("");

  const [updateSectorNode, { isLoading }] = useUpdateSectorNodeMutation();

  // Load the selected sector's current values whenever the modal opens for one
  useEffect(() => {
    if (sector) {
      setName(sector.name ?? "");
      setNameAm(sector.name_am ?? "");
      setDescription(sector.description ?? "");
      setDescriptionAm(sector.description_am ?? "");
      setIsActive(sector.is_active ?? true);
      setNameError("");
    }
  }, [sector]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sector) return;

    const trimmed = name.trim();
    if (trimmed.length < NAME_MIN || trimmed.length > NAME_MAX) {
      setNameError(`English name must be between ${NAME_MIN} and ${NAME_MAX} characters.`);
      return;
    }

    try {
      await updateSectorNode({
        id: sector.sector_node_id,
        data: {
          name: trimmed,
          name_am: nameAm.trim(),
          description: description.trim(),
          description_am: descriptionAm.trim(),
          is_active: isActive,
        },
      }).unwrap();
      toast.success("Sector updated successfully.");
      onClose();
    } catch (err: any) {
      toast.error(err?.data?.message || "Could not update the sector. Please try again.");
    }
  };

  return (
    <Dialog open={!!sector} onOpenChange={(open) => !open && !isLoading && onClose()}>
      <DialogContent className="sm:max-w-2xl">
        <form onSubmit={handleSave} noValidate>
          <DialogHeader>
            <DialogTitle>Edit sector</DialogTitle>
            <DialogDescription>
              Names appear on the public pages in the visitor&apos;s language. Amharic is optional —
              if it is empty, the English name is shown.
            </DialogDescription>
          </DialogHeader>

          <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="edit-sector-name" className={labelClass}>
                Name (English) <span className="text-red-500">*</span>
              </label>
              <Input
                id="edit-sector-name"
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
              <label htmlFor="edit-sector-name-am" className={labelClass}>
                ስም (አማርኛ)
              </label>
              <Input
                id="edit-sector-name-am"
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
              <label htmlFor="edit-sector-description" className={labelClass}>
                Description (English)
              </label>
              <TextArea
                id="edit-sector-description"
                rows={3}
                value={description}
                onChange={setDescription}
                placeholder="Optional"
                className="mt-1"
                disabled={isLoading}
              />
            </div>

            <div>
              <label htmlFor="edit-sector-description-am" className={labelClass}>
                መግለጫ (አማርኛ)
              </label>
              <TextArea
                id="edit-sector-description-am"
                rows={3}
                value={descriptionAm}
                onChange={setDescriptionAm}
                placeholder="Optional"
                className="mt-1"
                disabled={isLoading}
              />
            </div>
          </div>

          <label className="mt-4 flex items-center gap-3 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              disabled={isLoading}
              className="h-4 w-4 accent-[hsl(var(--primary))]"
            />
            Active
            <span className="text-xs text-slate-500">(inactive sectors are hidden from the public forms)</span>
          </label>

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
