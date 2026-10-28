"use client";
import { motion } from "framer-motion";
import { toast } from "sonner";
import {
    useAssignSectorMutation,
    useGetSectorsByComplaintQuery,
    useRemoveSectorAssignmentMutation
} from "@/redux/api/complaintSectorAssignmentApi";
import { ComplaintSectorAssignment } from "@/redux/types/complaintSectorAssignment";
import { Button } from "@/components/ui/button";
import { useSession } from "next-auth/react";
import { useGetSectorNodeByIdQuery, useGetSectorNodesQuery } from "@/redux/api/sectorNodeApi";
import { SectorNode } from "@/redux/types/sectorNode";

interface DepartmentAssignmentPreviewProps {
    complaint_id: string;
    onClose?: () => void;
}

// Transform sector node to match the format expected by the UI
const transformSectorNodeToDepartmentFormat = (sectorNode: SectorNode) => {
    return {
        department_id: sectorNode.sector_node_id,
        full_name: sectorNode.name,
        email: `${sectorNode.name.toLowerCase()}@department.com`, // Placeholder email since sectors don't have emails
        role: {
            name: `Level ${sectorNode.level} Department`
        },
        sectorNode: sectorNode
    };
};

export default function DepartmentAssignmentPreview({
    complaint_id,
    onClose,
}: DepartmentAssignmentPreviewProps) {
    // Get users data
    const { data: session } = useSession();

    const sector_id = session?.user?.sector?.sector_node_id || "";

    // Call both hooks, but conditionally skip them
    const {
        data: sectorByIdResponse,
        isLoading: isLoadingById,
        isError: isErrorById,
    } = useGetSectorNodeByIdQuery(sector_id, {
        skip: !sector_id, // skip if no sector_id
    });

    const {
        data: sectorsAllResponse,
        isLoading: isLoadingAll,
        isError: isErrorAll,
    } = useGetSectorNodesQuery({ limit: 1000 }, { // paginated (default 10) — need every sector here
        skip: !!sector_id, // skip if sector_id exists
    });

    // Get sectors/assignments for this complaint
    const {
        data: assignments,
        isLoading: isLoadingAssignments,
        isError: assignmentsError,
        refetch
    } = useGetSectorsByComplaintQuery(complaint_id, {
        refetchOnMountOrArgChange: true,
    });

    // Mutation hooks
    const [assignSector, { isLoading: isAssigning }] = useAssignSectorMutation();
    const [removeAssignment, { isLoading: isRemoving }] = useRemoveSectorAssignmentMutation();

    // Extract sector nodes from responses
    let sectorNodes: SectorNode[] = [];

    if (sector_id) {
        // If we have sector_id, get that node and its children
        const rootNode = sectorByIdResponse?.data || sectorByIdResponse;
        if (rootNode) {
            sectorNodes = rootNode.children || [];
        }
    } else {
        // Get all sector nodes
        sectorNodes = sectorsAllResponse?.data || sectorsAllResponse || [];
    }

    // Transform sector nodes to department format for UI compatibility
    const departments = sectorNodes.map(transformSectorNodeToDepartmentFormat);

    // Ensure assignments is an array
    const sectorAssignments: ComplaintSectorAssignment[] = assignments || [];

    // Function to check if a department is assigned
    const isDepartmentAssigned = (departmentId: string): boolean => {
        return sectorAssignments?.some(
            (assignment) => assignment.department_id === departmentId
        );
    };

    const assignmentIdByDepartmentId = (departmentId: string): string | undefined => {
        return sectorAssignments?.find(
            (assignment) => assignment.department_id === departmentId
        )?.assignment_id;
    };

    const handleAssign = async (department: any) => {
        try {
            await assignSector({
                complaint_id,
                department_id: department.department_id,
            }).unwrap();

            toast.success(`Successfully assigned to ${department.full_name}`);

            // Refetch to update the UI
            refetch();
        } catch (error: any) {
            console.error("Assignment error:", error);
            toast.error(
                error?.data?.message ||
                error?.message ||
                `Failed to assign to ${department.full_name}`
            );
        }
    };

    const handleRemove = async (department: any) => {
        const assignment_id = assignmentIdByDepartmentId(department.department_id);

        if (!assignment_id) {
            toast.error("No assignment found to remove");
            return;
        }

        try {
            await removeAssignment(assignment_id).unwrap();

            toast.success(`Successfully removed ${department.full_name}`);

            // Refetch to update the UI
            refetch();
        } catch (error: any) {
            console.error("Removal error:", error);
            toast.error(
                error?.data?.message ||
                error?.message ||
                `Failed to remove ${department.full_name}`
            );
        }
    };

    const isLoading = sector_id ? isLoadingById : isLoadingAll;

    return (
        <div className="flex-1 overflow-y-auto">
            {/* Departments List */}
            <div className="mb-6">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="font-semibold text-golden-dark80 text-lg">
                        Available Departments
                    </h3>
                    <span className="text-sm text-golden-dark80 bg-golden-light50 px-2 py-1 rounded">
                        {departments.length} department{departments.length !== 1 ? 's' : ''}
                    </span>
                </div>

                {isLoading || isLoadingAssignments ? (
                    <div className="flex justify-center items-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1E516A]"></div>
                    </div>
                ) : isErrorById || isErrorAll ? (
                    <div className="text-center py-8 text-red-500">
                        Failed to load departments
                    </div>
                ) : departments.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                        No departments available for assignment
                    </div>
                ) : (
                    <div className="space-y-4">
                        {departments.map((department) => {
                            const isAssigned = isDepartmentAssigned(department.department_id);

                            return (
                                <motion.div
                                    key={department.department_id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className={`bg-golden-dark10 rounded-lg border transition-all duration-200 ${isAssigned
                                        ? ""
                                        : " "
                                        }`}
                                >
                                    <div className="p-2 w-full gap-1 relative grid grid-cols-2">
                                        {/* Department Info */}
                                        <div className="flex w-full justify-between items-start mb-3">
                                            <div className="flex-1 w-full ">
                                                <div className="flex items-center w-full justify-between gap-2">
                                                    <h4 className="font-semibold text-gray-800">
                                                        {department.full_name}
                                                    </h4>
                                                    {isAssigned ? (
                                                        <span className="inline-block px-2 absolute right-3 top-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">
                                                            Assigned
                                                        </span>
                                                    ) : (
                                                        <span className="inline-block px-2 absolute right-3 top-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded-full">
                                                            Not Assigned
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Action Buttons */}
                                        <div className="flex justify-end mt-8 items-end">
                                            <div className="flex gap-2 border-t flex-col justify-center items-end h-fit border-gray-100">
                                                {isAssigned ? (
                                                    <Button
                                                        onClick={() => handleRemove(department)}
                                                        disabled={isRemoving}
                                                        className="flex-1 bg-red-100 text-red-700 py-2 px-3 rounded-md text-sm font-medium hover:bg-red-200 transition-colors duration-200 flex items-center justify-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
                                                    >
                                                        {isRemoving ? (
                                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
                                                        ) : (
                                                            <>
                                                                <svg
                                                                    className="w-4 h-4"
                                                                    fill="none"
                                                                    stroke="currentColor"
                                                                    viewBox="0 0 24 24"
                                                                >
                                                                    <path
                                                                        strokeLinecap="round"
                                                                        strokeLinejoin="round"
                                                                        strokeWidth={2}
                                                                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                                                    />
                                                                </svg>
                                                                Remove
                                                            </>
                                                        )}
                                                    </Button>
                                                ) : (
                                                    <Button
                                                        onClick={() => handleAssign(department)}
                                                        disabled={isAssigning}
                                                        className="flex-1 text-white py-2 px-3 rounded-md text-sm font-medium transition-colors duration-200 flex items-center justify-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
                                                        style={{ backgroundColor: '#1E516A' }}
                                                    >
                                                        {isAssigning ? (
                                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                                        ) : (
                                                            <>
                                                                <svg
                                                                    className="w-4 h-4"
                                                                    fill="none"
                                                                    stroke="currentColor"
                                                                    viewBox="0 0 24 24"
                                                                >
                                                                    <path
                                                                        strokeLinecap="round"
                                                                        strokeLinejoin="round"
                                                                        strokeWidth={2}
                                                                        d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                                                                    />
                                                                </svg>
                                                                Assign
                                                            </>
                                                        )}
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}