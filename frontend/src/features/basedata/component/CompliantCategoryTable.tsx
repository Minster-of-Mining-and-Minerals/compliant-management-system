"use client";

import { useState } from "react";
import { DataTable } from "@/features/template/component/tableList/DataTable";
import { TableLayout } from "@/features/template/component/tableList/TableLayout";
import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus, Eye, Edit, Trash, ToggleLeft, ToggleRight } from "lucide-react";
import { toast } from "react-toastify";
import type { FilterField, ActionButton } from "@/types/tableLayout";
import {
    useGetComplaintCategoriesQuery,
    useDeleteComplaintCategoryMutation,
    useToggleComplaintCategoryStatusMutation
} from "@/redux/api/complaintCategoryApi";
import { ComplaintCategory } from "@/redux/types/complaintCategory";
import Loading01 from "@/features/template/component/Loading/Loading01";
// import { CreateComplaintCategoryModal } from "@/components/common/modals/CreateComplaintCategoryModal";
import { formatDate } from "@/utils/formatDate";
import { CreateComplaintCategoryModal } from "@/components/common/modals/CreateComplaintCategoryModal";

export const columns: ColumnDef<ComplaintCategory>[] = [
    {
        accessorKey: "type",
        header: "Type",
        cell: ({ row }) => (
            <span className="font-medium text-primary">
                {row.getValue("type")}
            </span>
        ),
    },
    {
        accessorKey: "name",
        header: "Category Name",
        cell: ({ row }) => (
            <span className="font-medium text-primary">
                {row.getValue("name")}
            </span>
        ),
    },
    {
        accessorKey: "description",
        header: "Description",
        cell: ({ row }) => (
            <div className="max-w-[300px] truncate text-muted-foreground">
                {row.getValue("description") || "—"}
            </div>
        ),
    },
    {
        accessorKey: "complaints",
        header: "Complaints",
        cell: ({ row }) => {
            const complaints = row.original.complaints || [];
            return (
                <Badge status="outline" className="text-xs">
                    {complaints.length} complaint{complaints.length !== 1 ? 's' : ''}
                </Badge>
            );
        },
    },
    {
        accessorKey: "created_at",
        header: "Created At",
        cell: ({ row }) => {
            const date = row.getValue("created_at") as string;
            return (
                <span className="text-sm text-muted-foreground">
                    {formatDate(date)}
                </span>
            );
        },
    },
    {
        accessorKey: "is_active",
        header: "Status",
        cell: ({ row }) => {
            const isActive = row.getValue("is_active") as boolean;
            return (
                <Badge status={isActive ? "default" : "secondary"}>
                    {isActive ? "Active" : "Inactive"}
                </Badge>
            );
        },
    },
    {
        id: "actions",
        header: "Actions",
        cell: ({ row }) => {
            const category = row.original;
            const [isViewModalOpen, setViewModalOpen] = useState(false);
            const [isEditModalOpen, setEditModalOpen] = useState(false);

            return (
                <>
                    <div className="flex items-center gap-1">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setViewModalOpen(true)}
                            title="View Details"
                        >
                            <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setEditModalOpen(true)}
                            title="Edit Category"
                        >
                            <Edit className="h-4 w-4" />
                        </Button>
                        <StatusToggleButton category={category} />
                        <DeleteButton category={category} />
                    </div>
                </>
            );
        },
    },
];

// Status Toggle Button Component
const StatusToggleButton = ({ category }: { category: ComplaintCategory }) => {
    const [toggleStatus, { isLoading }] =
        useToggleComplaintCategoryStatusMutation();

    const handleToggle = async () => {
        try {
            await toggleStatus(category.category_id).unwrap();

            toast.success(
                `Category ${category.is_active ? "deactivated" : "activated"
                } successfully`
            );
        } catch (error: any) {
            toast.error(error?.data?.message || "Failed to toggle status");
        }
    };

    return (
        <Button
            variant="ghost"
            size="icon"
            onClick={handleToggle}
            disabled={isLoading}
            title={category.is_active ? "Deactivate" : "Activate"}
        >
            {category.is_active ? (
                <ToggleRight className="h-4 w-4 text-green-500" />
            ) : (
                <ToggleLeft className="h-4 w-4 text-gray-400" />
            )}
        </Button>
    );
};


// Delete Button Component
const DeleteButton = ({ category }: { category: ComplaintCategory }) => {
    const [deleteCategory, { isLoading }] =
        useDeleteComplaintCategoryMutation();

    const handleDelete = async () => {
        if (!confirm(`Are you sure you want to delete "${category.name}"?`)) {
            return;
        }

        try {
            const result = await deleteCategory(category.category_id).unwrap();

            if (result.data?.complaint_count && result.data.complaint_count > 0) {
                toast.warning(
                    `This category has ${result.data.complaint_count} associated complaint(s). Please deactivate instead.`
                );
            } else {
                toast.success("Category deleted successfully");
            }
        } catch (error: any) {
            toast.error(error?.data?.message || "Failed to delete category");
        }
    };

    return (
        <Button
            variant="ghost"
            size="icon"
            onClick={handleDelete}
            disabled={isLoading}
            title="Delete Category"
        >
            <Trash className="h-4 w-4 text-destructive" />
        </Button>
    );
};


export default function ComplaintCategoryTable() {
    const {
        data = [],
        isLoading,
        isError,
        refetch,
    } = useGetComplaintCategoriesQuery(undefined);

    // const { toast } = useToast();

    // Pagination states
    const [pageIndex, setPageIndex] = useState(0);
    const [pageSize, setPageSize] = useState(10);
    const [isModalOpen, setModalOpen] = useState(false);

    // Filter states
    const [statusFilter, setStatusFilter] = useState("");
    const [searchFilter, setSearchFilter] = useState("");

    const handlePagination = (index: number, size: number) => {
        setPageIndex(index);
        setPageSize(size);
    };

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
            label: "New Category",
            icon: <Plus className="h-4 w-4" />,
            variant: "default",
            onClick: () => setModalOpen(true),
            permissions: ["COMPLAINT_CATEGORIES:CREATE"],
        },
    ];

    // Apply filters locally (client-side)
    const filteredData = data.filter((category) => {
        // Status filter
        if (statusFilter === "active" && !category.is_active) return false;
        if (statusFilter === "inactive" && category.is_active) return false;

        // Search filter
        if (searchFilter) {
            const searchLower = searchFilter.toLowerCase();
            return (
                category.name.toLowerCase().includes(searchLower) ||
                (category.description?.toLowerCase() || "").includes(searchLower)
            );
        }

        return true;
    });

    // Sort by created_at descending (newest first)
    const sortedData = [...filteredData].sort((a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    if (isLoading) {
        return <Loading01 />;
    }

    if (isError) {
        return (
            <div className="flex flex-col items-center justify-center h-64">
                <h3 className="text-lg font-semibold mb-2">Error Loading Categories</h3>
                <p className="text-muted-foreground mb-4">
                    Failed to load complaint categories. Please try again.
                </p>
                <Button onClick={() => refetch()} variant="outline">
                    Retry
                </Button>
            </div>
        );
    }

    // Pagination slice
    const paginatedData = sortedData.slice(
        pageIndex * pageSize,
        pageIndex * pageSize + pageSize
    );

    return (
        <>
            <TableLayout
                title="Complaint Categories"
                description="Manage categories for organizing complaints"
                actions={actions}
                filters={filters}
                filterColumnsPerRow={2}
            >
                <DataTable
                    columns={columns}
                    data={paginatedData}
                    totalPageCount={Math.ceil(sortedData.length / pageSize)}
                    handlePagination={handlePagination}
                    tablePageSize={pageSize}
                    currentIndex={pageIndex}
                />
            </TableLayout>

            <CreateComplaintCategoryModal
                isOpen={isModalOpen}
                onClose={() => setModalOpen(false)}
            />
        </>
    );
}