import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { SearchableSelect, SelectOption } from "@/components/ui/searchable-select";
import { useGetUsersQuery } from "@/redux/api/userApi";
import { useAssignRepresentativeMutation } from "@/redux/api/sectorRepresentativeApi";
import { toast } from "sonner";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  sectorNodeId: string;
  isHead: boolean;
}

export function AssignRepresentativeModal({ isOpen, onClose, sectorNodeId, isHead }: Props) {
  const { data: users, isLoading: usersLoading } = useGetUsersQuery({ is_active: true });
  const [assign, { isLoading: submitting }] = useAssignRepresentativeMutation();
  
  const [selectedUser, setSelectedUser] = useState<SelectOption | null>(null);
  
  const userOptions: SelectOption[] = users?.map(u => ({
    value: u.user_id,
    label: u.full_name,
    data: { description: u.email }
  })) || [];

  const handleAssign = async () => {
    if (!selectedUser) return;
    try {
      await assign({
        sector_node_id: sectorNodeId,
        user_id: selectedUser.value,
        can_manage: isHead,
        valid_from: new Date().toISOString().split('T')[0]
      }).unwrap();
      toast.success(isHead ? "Sector head assigned successfully" : "Representative added successfully");
      setSelectedUser(null);
      onClose();
    } catch (error: any) {
      toast.error(error?.data?.message || "Failed to assign user");
    }
  };

  const handleClose = () => {
    setSelectedUser(null);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isHead ? "Assign Sector Head" : "Add Representative"}</DialogTitle>
          <DialogDescription>
            Select a user from the list to assign them as a {isHead ? "sector head" : "representative"} for this sector.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-4">
          <div className="space-y-2">
             <label className="text-sm font-medium">Select User</label>
             <div className="min-h-[250px] relative">
               <SearchableSelect
                  options={userOptions}
                  value={selectedUser}
                  onChange={(option) => setSelectedUser(option as SelectOption)}
                  placeholder={usersLoading ? "Loading users..." : "Search user by name or email..."}
                  isDisabled={usersLoading || submitting}
               />
             </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={submitting}>Cancel</Button>
          <Button onClick={handleAssign} disabled={!selectedUser || submitting} className="bg-[#1E516A]">
            {submitting ? "Assigning..." : "Assign"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
