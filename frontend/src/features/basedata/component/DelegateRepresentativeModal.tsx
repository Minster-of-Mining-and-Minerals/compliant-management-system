"use client";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useUpdateRepresentativeMutation } from "@/redux/api/sectorRepresentativeApi";
import { toast } from "sonner";
import {
  parseUtcDate,
  todayDateInputValue,
  tomorrowDateInputValue,
  toUtc,
} from "@/utils/date";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  representativeId: string | null;
}

export function DelegateRepresentativeModal({ isOpen, onClose, representativeId }: Props) {
  const [updateRepresentative, { isLoading }] = useUpdateRepresentativeMutation();
  const [validUntil, setValidUntil] = useState<string>("");

  const handleDelegate = async () => {
    if (!representativeId) return;
    if (!validUntil) {
      toast.error("Please specify a valid until date.");
      return;
    }
    
    const selectedDate = parseUtcDate(`${validUntil}T00:00:00.000Z`);
    const todayStart = parseUtcDate(`${todayDateInputValue()}T00:00:00.000Z`);

    if (!selectedDate || !todayStart || selectedDate.getTime() <= todayStart.getTime()) {
        toast.error("Valid until date must be in the future.");
        return;
    }

    try {
      await updateRepresentative({
        id: representativeId,
        body: {
          can_manage: true,
          valid_until: toUtc(selectedDate) ?? undefined,
        },
      }).unwrap();
      toast.success("Representative successfully delegated as Acting Head.");
      onClose();
      setValidUntil("");
    } catch (error: any) {
      toast.error(error?.data?.message || "Failed to delegate representative");
    }
  };

  const handleClose = () => {
    setValidUntil("");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delegate Acting Head</DialogTitle>
          <DialogDescription>
            Specify until when this representative will act as the sector head.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Valid Until Date</label>
            <Input 
              type="date" 
              value={validUntil}
              onChange={(e) => setValidUntil(e.target.value)}
              min={tomorrowDateInputValue()}
              disabled={isLoading}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isLoading}>Cancel</Button>
          <Button onClick={handleDelegate} disabled={!validUntil || isLoading} className="bg-primary">
            {isLoading ? "Delegating..." : "Delegate"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
