"use client";

import { useState, useEffect } from "react";
import { DataTable } from "@/features/template/component/tableList/DataTable";
import { TableLayout } from "@/features/template/component/tableList/TableLayout";
import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Download, Plus, Eye, Edit, Users } from "lucide-react";

import type { FilterField, ActionButton } from "@/types/tableLayout";
import { useExportUsersMutation, useGetUsersQuery, useGetUserTypesQuery } from "@/redux/api/userApi";
import { User } from "@/redux/types/user";
import { CreateUserModal } from "@/components/common/modals/CreateUserModal";
import Link from "next/link";
import { EditUserModal } from "@/components/common/modals/EditUserModal";
import { formatStatus } from "@/utils/statusFormatter";
import { useSearchParams } from "next/navigation";

const getColumns = (onEdit: (user: User) => void): ColumnDef<User>[] => [
    {
        accessorKey: "full_name",
        header: "Full Name",
        cell: ({ row }) => (
            <span className="font-medium text-primary">
                {row.getValue("full_name")}
            </span>
        ),
    },
    {
        accessorKey: "email",
        header: "Email",
        cell: ({ row }: any) => <div>{row.getValue("email")}</div>,
    },
    {
        accessorKey: "phone_number",
        header: "Phone Number",
        cell: ({ row }: any) => <div>{row.getValue("phone_number")}</div>,
    },
    {
        accessorKey: "is_active",
        header: "Status",
        cell: ({ row }) => {
            const isActive = row.getValue("is_active") as boolean;
            return (
                <Badge className="text-white" status={isActive ? "active" : "inactive"}>
                    {formatStatus(isActive ? "Active" : "Inactive")}
                </Badge>
            );
        },
    },
    {
        id: "actions",
        header: "Actions",
        cell: ({ row }) => (
            <div className="flex items-center gap-1">
                <Link href={`/users/list/${row.original.user_id}`}>
                    <Button variant="ghost" size="icon" title="View" aria-label="View user">
                        <Eye className="h-4 w-4" />
                    </Button>
                </Link>
                <Button variant="ghost" size="icon" title="Edit" aria-label="Edit user" onClick={() => onEdit(row.original)}>
                    <Edit className="h-4 w-4" />
                </Button>
            </div>
        ),
    },
];
export interface UserTableProps {
    sideActions?: ActionButton[];
}
// structure_node_id
export default function ExternalUserTable({ sideActions }: UserTableProps) {
    const {
        data: userTypes = [],
        isLoading: isLoadingType,
        isError: typeError,
        refetch: refetchType,
    } = useGetUserTypesQuery();
    const userTypeId = userTypes?.find(
        (type: any) => type.name === "external"
    )?.user_type_id;
    const searchParams = useSearchParams();
    const searchQuery = searchParams.get("search") || "";

    // Pagination states
    const [pageIndex, setPageIndex] = useState(0);
    const [pageSize, setPageSize] = useState(10);

    const {
        data: response,
        isLoading,
        isError,
        refetch,
    } = useGetUsersQuery({
        user_type_id: userTypeId,
        page: pageIndex + 1,
        limit: pageSize,
        search: searchQuery,
    });

    const users = response?.data ?? [];
    const totalPages = response?.meta?.totalPages ?? 0;
    const [exportUsers, { isLoading: exportLoading }] = useExportUsersMutation();

    // Reset page index when search changes
    useEffect(() => {
        setPageIndex(0);
    }, [searchQuery]);

    const [isModalOpen, setModalOpen] = useState(false);
    const [editUserId, setEditUserId] = useState<string | null>(null);
    const handlePagination = (index: number, size: number) => {
        setPageIndex(index);
        setPageSize(size);
    };

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
            label: "Export",
            icon: <Download className="h-4 w-4" />,
            variant: "outline",
            loading: exportLoading,
            // permissions: ["USER:EXPORT"],
            onClick: async () => {
                try {
                    const blob = await exportUsers().unwrap();
                    // Create download link
                    const url = window.URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = "users.csv";
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    window.URL.revokeObjectURL(url);
                } catch (err) {
                    console.error("Export failed", err);
                }
            },
        },

        // {
        //     label: "New External User",
        //     icon: <Plus className="h-4 w-4" />,
        //     variant: "default",
        //     onClick: () => setModalOpen(true),
        //     permissions: ["USER:CREATE"],
        // },
    ];

    // Apply filters locally
    const filteredData = users.filter((role) => {
        if (statusFilter === "active") return role.is_active === true;
        if (statusFilter === "inactive") return role.is_active === false;
        return true;
    });

    return (
        <>
            <TableLayout
                actions={actions}
                sideActions={sideActions}
                filters={filters}
                filterColumnsPerRow={1}
            >
                <DataTable
                    columns={getColumns((user) => setEditUserId(user.user_id))}
                    data={filteredData}
                    totalPageCount={totalPages}
                    handlePagination={handlePagination}
                    tablePageSize={pageSize}
                    currentIndex={pageIndex}
                />
            </TableLayout>
            <CreateUserModal
                user_type="external"
                isOpen={isModalOpen}
                onClose={() => setModalOpen(false)}
            />
            <EditUserModal
                userId={editUserId}
                userType="external"
                onClose={() => setEditUserId(null)}
            />
        </>
    );
} 