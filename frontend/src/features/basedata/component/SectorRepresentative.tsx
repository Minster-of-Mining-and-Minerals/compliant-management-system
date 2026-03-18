"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useGetSectorRepresentativesQuery, useRemoveRepresentativeMutation, useUpdateRepresentativeMutation } from "@/redux/api/sectorRepresentativeApi";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/features/template/component/tableList/DataTable";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { TableLayout } from "@/features/template/component/tableList/TableLayout";
import { ColumnDef } from "@tanstack/react-table";
import { SectorRepresentative } from "@/redux/types/representative";
import Loading01 from "@/features/template/component/Loading/Loading01";
import { Button } from "@/components/ui/button";
import { Edit, Plus, Trash, ShieldAlert, ShieldMinus } from "lucide-react";
import { AssignRepresentativeModal } from "./AssignRepresentativeModal";
import { DelegateRepresentativeModal } from "./DelegateRepresentativeModal";
import { ActionButton, FilterField } from "@/types/tableLayout";
import { toast } from "sonner";
import { PermissionGuard } from "@/features/complaint-management/component/PermissionGuard";

export default function SectorRepresentativesTable({ headId }: { headId?: string | null }) {
    const params = useParams();
    const id = params?.sectorId as string;
    const { data: representatives = [], isLoading: repsLoading } = useGetSectorRepresentativesQuery(
        { sector_id: id, include_inactive: false },
        { skip: !id }
    );

    const [removeRepresentative, { isLoading: isRemoving }] = useRemoveRepresentativeMutation();
    const [updateRepresentative, { isLoading: isUpdating }] = useUpdateRepresentativeMutation();

    const [confirmAction, setConfirmAction] = useState<{ type: 'remove' | 'relegate', id: string } | null>(null);

    const handleDelete = async (repId: string) => {
        try {
            await removeRepresentative(repId).unwrap();
            toast.success("Representative removed successfully.");
        } catch (error: any) {
            toast.error(error?.data?.message || "Failed to remove representative");
        }
    };

    const handleRelegate = async (repId: string) => {
        try {
            await updateRepresentative({
                id: repId,
                body: {
                    can_manage: false,
                    valid_until: null as any,
                }
            }).unwrap();
            toast.success("Acting Head status removed successfully.");
        } catch (error: any) {
            toast.error(error?.data?.message || "Failed to relegate acting head");
        }
    };

    // Modals state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [assigningHead, setAssigningHead] = useState(false);
    const [delegateModalOpen, setDelegateModalOpen] = useState(false);
    const [selectedRepId, setSelectedRepId] = useState<string | null>(null);

    const openDelegateModal = (repId: string) => {
        setSelectedRepId(repId);
        setDelegateModalOpen(true);
    };


    // Pagination for reps table
    const [repPageIndex, setRepPageIndex] = useState(0);
    const [repPageSize, setRepPageSize] = useState(10);



    const handleRepPagination = (index: number, size: number) => {
        setRepPageIndex(index);
        setRepPageSize(size);
    };

    const repColumns: ColumnDef<SectorRepresentative>[] = [
        {
            id: "full_name",
            accessorFn: (row) => row.representative?.full_name,
            header: "Name",
            cell: ({ row }) => (
                <span className="font-medium text-primary">
                    {row.original.representative?.full_name || "Unknown"}
                </span>
            ),
        },
        {
            id: "email",
            accessorFn: (row) => row.representative?.email,
            header: "Email",
            cell: ({ row }) => (
                <span className="text-muted-foreground">
                    {row.original.representative?.email || "—"}
                </span>
            ),
        },
        {
            accessorKey: "can_manage",
            header: "Role",
            cell: ({ row }) => {
                const canManage = row.original.can_manage;
                return (
                    <Badge status={canManage ? "active" : "inactive"}>
                        {canManage ? "Delegated" : "Relegated"}
                    </Badge>
                );
            },
        },
        {
            accessorKey: "is_active",
            header: "Status",
            cell: ({ row }) => {
                const isActive = row.getValue("is_active") as boolean;
                return (
                    <Badge status={isActive ? "active" : "inactive"}>
                        {isActive ? "Active" : "Inactive"}
                    </Badge>
                );
            },
        },
        {
            id: "actions",
            header: "Actions",
            cell: ({ row }) => {
                const canManage = row.original.can_manage;
                const repId = row.original.representative_id;

                return (
                    <div className="flex items-center gap-1">
                        {!canManage && (
                            <PermissionGuard
                                requireAll={["SECTOR_REPRESENTATIVE:DELEGATE"]}
                            >
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    title="Delegate Acting Head"
                                    onClick={() => openDelegateModal(repId)}
                                    disabled={isRemoving || isUpdating}
                                >
                                    <ShieldAlert className="h-4 w-4 text-amber-500" />
                                </Button>
                            </PermissionGuard>)}
                        {canManage && (
                            <PermissionGuard
                                requireAll={["SECTOR_REPRESENTATIVE:RELEGATE"]}
                            >
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    title="Relegate Acting Head"
                                    onClick={() => setConfirmAction({ type: 'relegate', id: repId })}
                                    disabled={isRemoving || isUpdating}
                                >
                                    <ShieldMinus className="h-4 w-4 text-blue-500" />
                                </Button>
                            </PermissionGuard>

                        )}
                        <PermissionGuard
                            requireAll={["SECTOR_REPRESENTATIVE:UPDATE"]}
                        >
                            <Button variant="ghost" size="icon" disabled={isRemoving || isUpdating}>
                                <Edit className="h-4 w-4" />
                            </Button>
                        </PermissionGuard>
                        <PermissionGuard
                            requireAll={["SECTOR_REPRESENTATIVE:DELETE"]}
                        >
                            <Button
                                variant="ghost"
                                size="icon"
                                className="text-red-500 hover:text-red-600"
                                onClick={() => setConfirmAction({ type: 'remove', id: repId })}
                                disabled={isRemoving || isUpdating}
                            >
                                <Trash className="h-4 w-4" />
                            </Button>
                        </PermissionGuard>
                    </div>
                );
            },
        },
    ];


    // Filters
    const [statusFilter, setStatusFilter] = useState("");

    const filters: FilterField[] = [
        {
            key: "status",
            label: "Status",
            type: "multiselect",
            placeholder: "Select status",
            value: statusFilter,
            onChange: setStatusFilter,
            options: [
                { label: "Active", value: "active" },
                { label: "Inactive", value: "inactive" },
            ],
        },
    ];

    // Actions
    const actions: ActionButton[] = [
        {
            label: "New Representative",
            icon: <Plus className="h-4 w-4" />,
            variant: "default",
            onClick: () => setIsModalOpen(true),
            permissions: ["SECTOR_REPRESENTATIVE:CREATE"],
        },
    ];

    // Apply filters locally (client-side)
    const filteredData = representatives.filter((role) => {
        if (statusFilter === "active") return role.is_active === true;
        if (statusFilter === "inactive") return role.is_active === false;
        return true;
    });

    const paginatedReps = filteredData.slice(
        repPageIndex * repPageSize,
        repPageIndex * repPageSize + repPageSize
    );

    if (repsLoading) return <Loading01 />;

    return (
        <>

            <TableLayout
                actions={actions}
                filters={filters}
                filterColumnsPerRow={1}
            >
                <DataTable
                    columns={repColumns}
                    data={paginatedReps}
                    totalPageCount={Math.ceil(filteredData.length / repPageSize) || 1}
                    handlePagination={handleRepPagination}
                    tablePageSize={repPageSize}
                    currentIndex={repPageIndex}
                />
            </TableLayout>

            {/* Modals */}
            <AssignRepresentativeModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                sectorNodeId={id}
                isHead={assigningHead}
                headId={headId}
            />
            <DelegateRepresentativeModal
                isOpen={delegateModalOpen}
                onClose={() => {
                    setDelegateModalOpen(false);
                    setSelectedRepId(null);
                }}
                representativeId={selectedRepId}
            />

            {/* Confirmation Dialog */}
            <Dialog open={!!confirmAction} onOpenChange={(open) => !open && setConfirmAction(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Confirm Action</DialogTitle>
                        <DialogDescription>
                            {confirmAction?.type === 'remove' && "Are you sure you want to remove this representative?"}
                            {confirmAction?.type === 'relegate' && "Are you sure you want to remove this representative's Acting Head status?"}
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setConfirmAction(null)} disabled={isRemoving || isUpdating}>
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={async () => {
                                if (!confirmAction) return;
                                if (confirmAction.type === 'remove') await handleDelete(confirmAction.id);
                                if (confirmAction.type === 'relegate') await handleRelegate(confirmAction.id);
                                setConfirmAction(null);
                            }}
                            disabled={isRemoving || isUpdating}
                        >
                            {isRemoving || isUpdating ? "Processing..." : "Confirm"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

        </>
    );
}
