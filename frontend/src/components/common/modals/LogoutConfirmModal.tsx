"use client";

import { useState } from "react";
import { Loader2, LogOut } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { performLogout } from "@/utils/logout";

interface LogoutConfirmModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function LogoutConfirmModal({ open, onOpenChange }: LogoutConfirmModalProps) {
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleConfirm = async () => {
    setIsLoggingOut(true);
    try {
      await performLogout();
    } catch {
      setIsLoggingOut(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(next) => !isLoggingOut && onOpenChange(next)}>
      <DialogContent className="sm:max-w-sm" showCloseButton={false}>
        <DialogHeader className="items-center text-center sm:text-center">
          <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-red-600">
            <LogOut className="h-5 w-5" />
          </div>
          <DialogTitle className="text-primary">Log out?</DialogTitle>
          <DialogDescription>
            You will need to sign in again to access the system.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="mt-2 gap-2 sm:justify-center">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoggingOut}
            className="sm:min-w-28"
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={isLoggingOut}
            className="gap-2 sm:min-w-28"
          >
            {isLoggingOut ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <LogOut className="h-4 w-4" />
            )}
            Log out
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
