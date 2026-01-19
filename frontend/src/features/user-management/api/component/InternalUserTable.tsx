"use client";

import { useState } from "react";
import { DataTable } from "@/features/template/component/tableList/DataTable";
import { TableLayout } from "@/features/template/component/tableList/TableLayout";
import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Download, Plus, Eye, Edit, Trash, Users } from "lucide-react";

import type { FilterField, ActionButton } from "@/types/tableLayout";
import {
    useExportUsersMutation,
    useGetUsersQuery,
    useGetUserTypesQuery,
} from "@/redux/api/userApi";
import { User } from "@/redux/types/user";
import { formatStatus } from "@/utils/statusFormatter";
import { CreateUserModal } from "@/components/common/modals/CreateUserModal";

const columns: ColumnDef<User>[] = [
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
    // {
    //     id: "internalUserType",
    //     header: "User Type",
    //     cell: ({ row }) => {
    //         const type = row.original.internalUserType;
    //         return <span className="text-sm font-medium">{type?.name ?? "—"}</span>;
    //     },
    // },
    {
        id: "sector",
        header: "Sector",
        cell: ({ row }) => {
            const sector = row.original.sectorNode;
            return (
                <span className="text-sm font-medium">{sector?.name ?? "—"}</span>
            );
        },
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
            <div className="flex items-center">
                <Button variant="ghost" size="icon">
                    <Eye className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon">
                    <Edit className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon">
                    <Trash className="h-4 w-4" />
                </Button>
            </div>
        ),
    },
];

export interface UserTableProps {
    sideActions?: ActionButton[];
}

export default function InternalUserTable({ sideActions }: UserTableProps) {
    const {
        data: userTypes = [],
        isLoading: isLoadingType,
        isError: typeError,
        refetch: refetchType,
    } = useGetUserTypesQuery();
    const userTypeId = userTypes?.find(
        (type: any) => type.name === "internal"
    )?.user_type_id;
    const {
        data = [],
        isLoading,
        isError,
        refetch,
    } = useGetUsersQuery({ user_type_id: userTypeId });
    const [exportUsers, { isLoading: exportLoading }] = useExportUsersMutation();

    // Pagination states
    const [pageIndex, setPageIndex] = useState(0);
    const [pageSize, setPageSize] = useState(10);
    const [isModalOpen, setModalOpen] = useState(false);
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

        {
            label: "Create User",
            icon: <Plus className="h-4 w-4" />,
            variant: "default",
            onClick: () => setModalOpen(true),
        },
    ];

    // Apply filters locally (client-side)
    const filteredData = data.filter((role) => {
        if (statusFilter === "active") return role.is_active === true;
        if (statusFilter === "inactive") return role.is_active === false;
        return true;
    });

    // Pagination slice
    const paginatedData = filteredData.slice(
        pageIndex * pageSize,
        pageIndex * pageSize + pageSize
    );
    return (
        <>
            <TableLayout
                actions={actions}
                sideActions={sideActions}
                filters={filters}
                filterColumnsPerRow={1}
            >
                <DataTable
                    columns={columns}
                    data={paginatedData}
                    totalPageCount={Math.ceil(filteredData.length / pageSize)}
                    handlePagination={handlePagination}
                    tablePageSize={pageSize}
                    currentIndex={pageIndex}
                />
            </TableLayout>
            <CreateUserModal
                user_type="internal"
                isOpen={isModalOpen}
                onClose={() => setModalOpen(false)}
            />
        </>
    );
}