"use client";
import { motion } from "framer-motion";
import { toast } from "sonner";
import {
    useAssignComplaintMutation,
    useGetAssignmentsByComplaintIdQuery,
    useRemoveComplaintAssignmentMutation
} from "@/redux/api/complaintAssignmentApi";
import { ComplaintAssignment } from "@/redux/types/complaintAssignment";
import { useGetUsersQuery } from "@/redux/api/userApi";
import { User } from "@/redux/types/user";
import { Button } from "@/components/ui/button";
import { useSession } from "next-auth/react";

interface AssignmentPreviewProps {
    complaint_id: string;
    onClose?: () => void;
}


export default function UserAssignmentPreview({
    complaint_id,
    onClose,
}: AssignmentPreviewProps) {
    // Get users data
    const { data: session } = useSession();
    // console.log("session", session);
    const sector_node_id = session?.user?.sector?.sector_node_id || "";
    const department_id = session?.user?.department?.sector_node_id || "";

    const queryParams = {
        ...(sector_node_id && { sector_node_id }),
        ...(department_id && { department_id }),
    };

    const {
        data: usersResponse,
        isLoading: isLoadingUsers,
        isError,
    } = useGetUsersQuery(
        Object.keys(queryParams).length ? queryParams : undefined
    );

    // Get latest assignment for this complaint
    const {
        data: assignmentResponse,
        isLoading: isLoadingAssignments,
        isError: assignmentsError,
        refetch // Add refetch to manually refresh after mutations
    } = useGetAssignmentsByComplaintIdQuery(complaint_id, {
        refetchOnMountOrArgChange: true,
    });

    // Mutation hooks
    const [assignComplaint, { isLoading: isAssigning }] = useAssignComplaintMutation();
    const [removeAssignment, { isLoading: isRemoving }] = useRemoveComplaintAssignmentMutation();

    // Extract data from responses - adjust based on your actual API response structure
    const users: User[] = usersResponse?.data || usersResponse || [];
    const assignments: ComplaintAssignment[] | [] = assignmentResponse || assignmentResponse?.data || [];

    // Function to check if a user is assigned
    const isUserAssigned = (userId: string): boolean => {
        return assignments?.some(
            (assignment) => assignment.assignee_id === userId
        );
    };

    const assignmentIdByUserId = (userId: string): string | undefined => {
        return assignments?.find(
            (assignment) => assignment.assignee_id === userId
        )?.assignment_id;
    };


    const handleAssign = async (user: User) => {
        try {
            // Call the assign complaint mutation
            await assignComplaint({
                complaint_id,
                assignee_id: user.user_id,
                // remarks: `Assigned to ${user.full_name} from ${user?.sectorNode?.name}`,
            }).unwrap();

            toast.success(`Successfully assigned to ${user.full_name}`);

            // Refetch the latest assignment to update the UI
            refetch();
        } catch (error: any) {
            console.error("Assignment error:", error);
            toast.error(
                error?.data?.message ||
                error?.message ||
                `Failed to assign to ${user.full_name}`
            );
        }
    };

    const handleRemove = async (user: User) => {
        const assignment_id = assignmentIdByUserId(user.user_id);
        // Need assignment_id to remove
        if (!assignment_id) {
            toast.error("No assignment found to remove");
            return;
        }


        try {
            await removeAssignment({
                assignment_id: assignment_id,
            }).unwrap();

            toast.success(`Successfully removed ${user.full_name}`);

            // Refetch the latest assignment to update the UI
            refetch();
        } catch (error: any) {
            console.error("Removal error:", error);
            toast.error(
                error?.data?.message ||
                error?.message ||
                `Failed to remove ${user.full_name}`
            );
        }
    };

    return (
        <div className="flex-1 overflow-y-auto">
            {/* Users List */}
            <div className="mb-6">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="font-semibold text-golden-dark80 text-lg">
                        Available Users
                    </h3>
                    <span className="text-sm text-golden-dark80 bg-golden-light50 px-2 py-1 rounded">
                        {users.length} users
                    </span>
                </div>

                {isLoadingUsers || isLoadingAssignments ? (
                    <div className="flex justify-center items-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    </div>
                ) : isError ? (
                    <div className="text-center py-8 text-red-500">
                        Failed to load users
                    </div>
                ) : users.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                        No users available for assignment
                    </div>
                ) : (
                    <div className="space-y-4">
                        {users.map((userAssignment) => {
                            const isAssigned = isUserAssigned(userAssignment.user_id);

                            return (
                                <motion.div
                                    key={userAssignment.user_id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className={`bg-golden-dark10 rounded-lg border transition-all duration-200 ${isAssigned
                                        ? ""
                                        : " "
                                        }`}
                                >
                                    <div className="p-2 w-full gap-1 relative grid grid-cols-2">
                                        {/* User Info */}
                                        <div className="flex w-full  justify-between items-start mb-3">
                                            <div className="flex-1 w-full ">
                                                <div className="flex items-center w-full justify-between gap-2">
                                                    <h4 className="font-semibold   text-gray-800">
                                                        {userAssignment.full_name}
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
                                                <p className="text-sm text-gray-600 mt-1">
                                                    {userAssignment.email}
                                                </p>
                                                {/* <div className="flex items-center gap-2 mt-2">
                                                        <span className="inline-block px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                                                            {userAssignment.role.name}
                                                        </span>

                                                    </div> */}

                                            </div>
                                        </div>

                                        {/* Action Buttons */}
                                        <div className="flex justify-end mt-8 items-end">
                                            <div className="flex gap-2 border-t flex-col justify-center items-end h-fit border-gray-100">
                                                {isAssigned ? (
                                                    <Button
                                                        onClick={() => handleRemove(userAssignment)}
                                                        disabled={isRemoving}
                                                        className="flex-1   bg-red-100 text-red-700 py-2 px-3 rounded-md text-sm font-medium hover:bg-red-200 transition-colors duration-200 flex items-center justify-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
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
                                                        onClick={() => handleAssign(userAssignment)}
                                                        disabled={isAssigning}
                                                        className="flex-1     text-white py-2 px-3 rounded-md text-sm font-medium  transition-colors duration-200 flex items-center justify-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
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