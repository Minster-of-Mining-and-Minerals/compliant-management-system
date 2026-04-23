"use client";

import { useState } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { Eye, Edit, Trash } from "lucide-react";

import { DataTable } from "@/features/template/component/tableList/DataTable";
import { TableLayout } from "@/features/template/component/tableList/TableLayout";
import { Button } from "@/components/ui/button";

import type { FilterField, ActionButton } from "@/types/tableLayout";
import {
    useGetFeedbacksQuery,
    useDeleteFeedbackMutation,
} from "@/redux/api/feedbackApi";
import { Feedback } from "@/redux/types/feedback";
import { Star } from "lucide-react";
import { formatDate } from "@/utils/formatDate";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";

/* ----------------------------------
   TABLE COLUMNS
----------------------------------- */
const columns: ColumnDef<Feedback>[] = [
    {
        accessorKey: "full_name",
        header: "Full Name",
        cell: ({ row }) => (
            <span className="font-medium">
                {row.getValue("full_name") || "Anonymous"}
            </span>
        ),
    },
    {
        id: "feedback",
        header: "Feedback",
        cell: ({ row }) => (
            <div className="max-w-xs truncate" title={row.original.feedback}>
                {row.original.feedback}
            </div>
        ),
    },
    {
        accessorKey: "rating",
        header: "Rating",
        cell: ({ row }) => {
            const rating = row.getValue("rating") as number;
            return (
                <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, index) => (
                        <Star
                            key={index}
                            className={`h-4 w-4 ${index < rating
                                ? "fill-yellow-400 text-yellow-400"
                                : "text-gray-300"
                                }`}
                        />
                    ))}
                    <span className="ml-2 text-sm font-medium">({rating}/5)</span>
                </div>
            );
        },
    },
    {
        id: "sector",
        header: "Sector",
        cell: ({ row }) => (
            <span className="text-sm">
                {row.original.sectorNode?.name ?? "—"}
            </span>
        ),
    },
    {
        accessorKey: "created_at",
        header: "Submitted On",
        cell: ({ row }) => formatDate(row.getValue("created_at")),
    },
    {
        id: "actions",
        header: "Actions",
        cell: ({ row }) => {
            const feedbackId = row.original.feedback_id;
            return (
                <div className="flex items-center gap-1">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleView(row.original)}
                    >
                        <Link href={`/feedbacks/${feedbackId}`}>
                            <Eye className="h-4 w-4" />
                        </Link>
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(row.original)}
                    >
                        <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(row.original.feedback_id)}
                        className="text-red-500 hover:text-red-700"
                    >
                        <Trash className="h-4 w-4" />
                    </Button>
                </div>
            )
        }
    },
];

/* ----------------------------------
   HANDLER FUNCTIONS
----------------------------------- */
const handleView = (feedback: Feedback) => {
    // TODO: Implement view modal or navigation
    // console.log("View feedback:", feedback);
    // You can open a modal here showing full feedback details
};

const handleEdit = (feedback: Feedback) => {
    // TODO: Implement edit functionality
    // console.log("Edit feedback:", feedback);
    // You can open an edit modal or navigate to edit page
};

const handleDelete = async (id: string) => {
    // TODO: Implement delete confirmation
    // console.log("Delete feedback:", id);
    // You can add a confirmation modal before deleting
};

/* ----------------------------------
   COMPONENT
----------------------------------- */
export default function FeedbackTable() {
    const [filters, setFilters] = useState({
        min_rating: "",
        max_rating: "",
        sector_node_id: "",
    });
    const router = useRouter();
    const searchParams = useSearchParams();
    const searchQuery = searchParams.get("search") || "";

    /* Pagination */
    const [pageIndex, setPageIndex] = useState(0);
    const [pageSize, setPageSize] = useState(10);

    // Reset page index when search changes
    useEffect(() => {
        setPageIndex(0);
    }, [searchQuery]);

    // RTK Queries
    const { data: feedbacksData, isLoading, isError, refetch } = useGetFeedbacksQuery({
        min_rating: filters.min_rating || undefined,
        max_rating: filters.max_rating || undefined,
        sector_node_id: filters.sector_node_id || undefined,
        search: searchQuery || undefined,
        page: pageIndex + 1,
        limit: pageSize,
    });

    const [deleteFeedback] = useDeleteFeedbackMutation();

    // Extract data and statistics
    const feedbacks = feedbacksData?.data || [];
    const meta = feedbacksData?.meta;
    const statistics = feedbacksData?.statistics || {
        total_count: 0,
        average_rating: "0.00",
        min_rating: 0,
        max_rating: 0,
    };

    const handlePagination = (index: number, size: number) => {
        setPageIndex(index);
        setPageSize(size);
    };

    /* Filters */
    const filterFields: FilterField[] = [
        {
            key: "min_rating",
            label: "Min Rating",
            type: "select",
            placeholder: "Minimum rating",
            value: filters.min_rating,
            onChange: (value) => setFilters(prev => ({ ...prev, min_rating: value })),
            options: [
                { label: "1 star", value: "1" },
                { label: "2 stars", value: "2" },
                { label: "3 stars", value: "3" },
                { label: "4 stars", value: "4" },
                { label: "5 stars", value: "5" },
            ],
        },
        {
            key: "max_rating",
            label: "Max Rating",
            type: "select",
            placeholder: "Maximum rating",
            value: filters.max_rating,
            onChange: (value) => setFilters(prev => ({ ...prev, max_rating: value })),
            options: [
                { label: "1 star", value: "1" },
                { label: "2 stars", value: "2" },
                { label: "3 stars", value: "3" },
                { label: "4 stars", value: "4" },
                { label: "5 stars", value: "5" },
            ],
        },
    ];

    /* Actions (top buttons) */
    const actions: ActionButton[] = [
        {
            label: "Refresh",
            onClick: () => refetch(),
            variant: "outline",
        },
        {
            label: "Export",
            onClick: () => {
                // TODO: Implement export functionality
                // console.log("Export feedbacks");
            },
            variant: "outline",
            permissions: ["DATA:EXPORT"],
        },
    ];

    /* Delete handler */
    const handleDeleteFeedback = async (id: string) => {
        if (window.confirm("Are you sure you want to delete this feedback?")) {
            try {
                await deleteFeedback(id).unwrap();
                // Show success message
                // console.log("Feedback deleted successfully");
                // You can add toast notification here
            } catch (error) {
                console.error("Failed to delete feedback:", error);
                // Show error message
            }
        }
    };

    // Update the delete handler in columns
    const updatedColumns = columns.map(col => {
        if (col.id === "actions") {
            return {
                ...col,
                cell: ({ row }) => (
                    <div className="flex items-center gap-1">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => router.push(`/feedbacks/${row.original.feedback_id}`)}
                        >
                            <Eye className="h-4 w-4" />
                        </Button>

                        {/* <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteFeedback(row.original.feedback_id)}
                            className="text-red-500 hover:text-red-700 hover:bg-red-50"
                        >
                            <Trash className="h-4 w-4" />
                        </Button> */}
                    </div>
                ),
            };
        }
        return col;
    });

    /* Statistics display */
    const StatsDisplay = () => (
        <div className="mb-4 p-4 bg-gray-50 rounded-md">
            <div className="flex flex-wrap gap-4 items-center">
                <div>
                    <span className="text-sm text-gray-600">Total Feedbacks: </span>
                    <span className="font-semibold">{statistics.total_count}</span>
                </div>
                <div>
                    <span className="text-sm text-gray-600">Average Rating: </span>
                    <span className="font-semibold">{statistics.average_rating}</span>
                </div>
                <div>
                    <span className="text-sm text-gray-600">Min Rating: </span>
                    <span className="font-semibold">{statistics.min_rating}</span>
                </div>
                <div>
                    <span className="text-sm text-gray-600">Max Rating: </span>
                    <span className="font-semibold">{statistics.max_rating}</span>
                </div>
            </div>
        </div>
    );

    return (
        <div>
            <StatsDisplay />
            <TableLayout
                actions={actions}
                filters={filterFields}
                filterColumnsPerRow={1}
            >
                <DataTable
                    columns={updatedColumns}
                    data={feedbacks}
                    totalPageCount={meta?.totalPages || 0}
                    handlePagination={handlePagination}
                    tablePageSize={pageSize}
                    currentIndex={pageIndex}
                />
            </TableLayout>
        </div>
    );
}