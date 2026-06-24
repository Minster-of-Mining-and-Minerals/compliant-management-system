"use client";
import { XIcon } from "lucide-react";
import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { TextArea } from "@/components/ui/textarea";
import { FileUploadField } from "@/components/ui/FileUploadField";
import { useGetSectorNodesWithFlatChildrenQuery } from "@/redux/api/sectorNodeApi";
import { useGetComplaintCategoriesQuery } from "@/redux/api/complaintCategoryApi";
import { useCreateInternalComplaintMutation } from "@/redux/api/complaintApi";
import { useGetSameSectorUsersQuery } from "@/redux/api/userApi";
import { useGetMySectorDepartmentsQuery } from "@/redux/api/sectorNodeApi";
import { toast } from "sonner";
import { useSession } from "next-auth/react";
import { SectorNode } from "@/redux/types/sectorNode";

interface CreateMyComplaintProps {
    isOpen: boolean;
    onClose: () => void;
    sector_node_id?: string;
}

interface ComplaintFormValues {
    attachment_id: File[];
}

type TargetType = "person" | "department";

const CreateMyComplaint = ({ isOpen, onClose, sector_node_id }: CreateMyComplaintProps) => {
    const { data: session } = useSession();

    const sessionSectorId =
        sector_node_id ||
        session?.user?.sector?.sector_node_id ||
        "";

    const [sectorId, setSectorId] = useState("");
    const [targetType, setTargetType] = useState<TargetType>("person");
    const [targetUserId, setTargetUserId] = useState("");
    const [targetDepartmentId, setTargetDepartmentId] = useState("");
    const [complaintDescription, setComplaintDescription] = useState("");
    const [complaintCategoryId, setComplaintCategoryId] = useState("");
    const [formValues, setFormValues] = useState<ComplaintFormValues>({
        attachment_id: [],
    });

    const [incidentDate, setIncidentDate] = useState("");
    const [requestedAction, setRequestedAction] = useState("");

    const { data: sectorNodesData = [] } = useGetSectorNodesWithFlatChildrenQuery(undefined, {
        skip: !isOpen,
    });
    const sectors = sectorNodesData.map((item) => ({
        ...item.sector,
        children: item.children || [],
    }));

    const selectedSector = sectors.find((s) => s.sector_node_id === sectorId);

    const { data: categoriesResponse } = useGetComplaintCategoriesQuery(
        { is_active: true, type: "internal" },
        { skip: !isOpen },
    );
    const complaintCategories = Array.isArray(categoriesResponse?.data)
        ? categoriesResponse.data
        : [];

    const { data: sameSectorUsersResponse, isError: sameSectorUsersError } =
        useGetSameSectorUsersQuery(
            { limit: 100 },
            { skip: !isOpen || targetType !== "person" },
        );
    const sameSectorUsers = Array.isArray(sameSectorUsersResponse?.data)
        ? sameSectorUsersResponse.data
        : [];

    const { data: sectorDepartments = [] } = useGetMySectorDepartmentsQuery(undefined, {
        skip: !isOpen || targetType !== "department",
    });
    const departmentOptions = Array.isArray(sectorDepartments)
        ? sectorDepartments
        : [];

    const [createInternalComplaint, { isLoading: isSubmitting }] =
        useCreateInternalComplaintMutation();

    useEffect(() => {
        if (isOpen && sessionSectorId) {
            setSectorId(sessionSectorId);
        }
    }, [sessionSectorId, isOpen]);

    useEffect(() => {
        if (isOpen && sessionSectorId && sectors.length > 0 && !sectorId) {
            const foundSector = sectors.find(
                (item) => item.sector_node_id === sessionSectorId,
            );
            if (foundSector) {
                setSectorId(sessionSectorId);
            }
        }
    }, [sessionSectorId, sectors, isOpen, sectorId]);

    const handleComplaintCategoryChange = (value: string) => {
        setComplaintCategoryId(value);
    };

    useEffect(() => {
        if (complaintCategories.length > 0 && !complaintCategoryId) {
            setComplaintCategoryId(complaintCategories[0].category_id);
        }
    }, [complaintCategories, complaintCategoryId]);

    const handleChange = (field: keyof ComplaintFormValues, value: any) => {
        setFormValues((prev) => ({
            ...prev,
            [field]: value,
        }));
    };

    const handleTargetTypeChange = (value: TargetType) => {
        setTargetType(value);
        setTargetUserId("");
        setTargetDepartmentId("");
    };

    const resetForm = () => {
        setSectorId("");
        setTargetType("person");
        setTargetUserId("");
        setTargetDepartmentId("");
        setComplaintDescription("");
        setIncidentDate("");
        setRequestedAction("");
        setFormValues({ attachment_id: [] });

        if (complaintCategories.length > 0) {
            setComplaintCategoryId(complaintCategories[0].category_id);
        }
    };

    const handleClose = () => {
        resetForm();
        onClose();
    };

    const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (e.target === e.currentTarget) handleClose();
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!complaintDescription.trim()) {
            toast.error("Please provide a description for your complaint");
            return;
        }

        if (!sectorId && !session?.user?.department?.sector_node_id) {
            toast.error(
                "Your account must be assigned to a sector or department before filing internal complaints",
            );
            return;
        }

        if (!complaintCategoryId) {
            toast.error("Please select a category");
            return;
        }

        if (targetType === "person" && !targetUserId) {
            toast.error("Please select the person you are raising this complaint against");
            return;
        }

        if (targetType === "department" && !targetDepartmentId) {
            toast.error("Please select the department you are raising this complaint against");
            return;
        }

        try {
            const attachment_ids =
                formValues.attachment_id.length > 0
                    ? formValues.attachment_id
                    : undefined;

            const selectedUser = sameSectorUsers.find(
                (u) => u.user_id === targetUserId,
            );

            await createInternalComplaint({
                target_type: targetType,
                target_user_id: targetType === "person" ? targetUserId : undefined,
                department_id:
                    targetType === "department" ? targetDepartmentId : undefined,
                category_id: complaintCategoryId,
                description: complaintDescription.trim(),
                concern_to_user_name: selectedUser?.full_name || undefined,
                request: requestedAction.trim() || "",
                incident_date: incidentDate || undefined,
                attachment_ids,
            }).unwrap();

            toast.success("Internal complaint submitted and routed successfully!");
            resetForm();
            onClose();
        } catch (err: any) {
            toast.error(
                err?.data?.message || err?.message || "An unexpected error occurred",
            );
        }
    };

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
            onClick={handleBackdropClick}
        >
            <div className="bg-white p-6 rounded-2xl w-full max-w-[800px] shadow-2xl max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold text-[#094C81]">
                        Create Internal Complaint
                    </h2>
                    <button
                        onClick={handleClose}
                        className="text-[#094C81] hover:text-gray-600 transition"
                    >
                        <XIcon className="w-6 h-6 cursor-pointer" />
                    </button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="flex justify-between items-center mb-4">
                        <h1 className="block text-primary font-semibold text-lg">
                            {selectedSector?.name ?? session?.user?.sector?.name ?? "Your sector"}
                        </h1>
                        <div className="min-w-40">
                            <label
                                htmlFor="complaintCategory"
                                className="block text-sm text-golden-dark"
                            >
                                Category
                                <span className="text-red-500"> *</span>
                            </label>
                            <Select
                                value={complaintCategoryId}
                                onValueChange={handleComplaintCategoryChange}
                                disabled={isSubmitting}
                            >
                                <SelectTrigger className="w-full h-12 mt-1">
                                    <SelectValue placeholder="Select category" />
                                </SelectTrigger>
                                <SelectContent>
                                    {complaintCategories.map((category) => (
                                        <SelectItem
                                            key={category.category_id}
                                            value={category.category_id}
                                        >
                                            {category.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="mt-4 gap-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 w-full">
                        <div className="w-full">
                            <label className="block text-sm text-golden-dark">
                                Raise Against
                                <span className="text-red-500"> *</span>
                            </label>
                            <Select
                                value={targetType}
                                onValueChange={(v) => handleTargetTypeChange(v as TargetType)}
                                disabled={isSubmitting}
                            >
                                <SelectTrigger className="w-full h-12 mt-1">
                                    <SelectValue placeholder="Select target type" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="person">Person</SelectItem>
                                    <SelectItem value="department">Department</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {targetType === "person" ? (
                            <div className="w-full md:col-span-2">
                                <label className="block text-sm text-golden-dark">
                                    Person in your sector
                                    <span className="text-red-500"> *</span>
                                </label>
                                <Select
                                    value={targetUserId}
                                    onValueChange={setTargetUserId}
                                    disabled={isSubmitting}
                                >
                                    <SelectTrigger className="w-full h-12 mt-1">
                                        <SelectValue placeholder="Select colleague" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {sameSectorUsers.map((user) => (
                                            <SelectItem key={user.user_id} value={user.user_id}>
                                                {user.full_name}
                                                {user.department?.name
                                                    ? ` — ${user.department.name}`
                                                    : ""}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {sameSectorUsersError && (
                                    <p className="text-xs text-amber-700 mt-1">
                                        Could not load colleagues. Ensure your account has a sector or department assigned.
                                    </p>
                                )}
                            </div>
                        ) : (
                            <div className="w-full md:col-span-2">
                                <label className="block text-sm text-golden-dark">
                                    Department in your sector
                                    <span className="text-red-500"> *</span>
                                </label>
                                <Select
                                    value={targetDepartmentId}
                                    onValueChange={setTargetDepartmentId}
                                    disabled={isSubmitting}
                                >
                                    <SelectTrigger className="w-full h-12 mt-1">
                                        <SelectValue placeholder="Select department" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {departmentOptions.map((dept: SectorNode) => (
                                            <SelectItem
                                                key={dept.sector_node_id}
                                                value={dept.sector_node_id}
                                            >
                                                {dept.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}

                        <div className="w-full">
                            <label
                                htmlFor="dateOfIncident"
                                className="block text-sm text-golden-dark"
                            >
                                Incident Date
                            </label>
                            <Input
                                type="date"
                                id="dateOfIncident"
                                className="mt-1 w-full h-10 rounded-md text-sm border-golden-dark focus:border-none"
                                value={incidentDate}
                                onChange={(e) => setIncidentDate(e.target.value)}
                                disabled={isSubmitting}
                            />
                        </div>

                        <div className="w-full md:col-span-2">
                            <label
                                htmlFor="complaintDescription"
                                className="block text-sm text-golden-dark"
                            >
                                Description
                                <span className="text-red-500"> *</span>
                            </label>
                            <TextArea
                                placeholder="Describe your complaint"
                                rows={3}
                                id="complaintDescription"
                                className="mt-1 w-full rounded-md text-sm focus:border-none"
                                value={complaintDescription}
                                onChange={(val) => setComplaintDescription(val)}
                                disabled={isSubmitting}
                            />
                        </div>

                        <div className="w-full md:col-span-2">
                            <label
                                htmlFor="requestedAction"
                                className="block text-sm text-golden-dark"
                            >
                                Requested Action
                                <span className="text-gray-500"> (Optional)</span>
                            </label>
                            <TextArea
                                placeholder="Enter requested action"
                                rows={3}
                                id="requestedAction"
                                className="mt-1 w-full rounded-md text-sm border-golden-dark focus:border-none"
                                value={requestedAction}
                                onChange={(val) => setRequestedAction(val)}
                                disabled={isSubmitting}
                            />
                        </div>

                        <div className="w-full">
                            <label className="block text-sm text-golden-dark">
                                Evidence
                                <span className="text-gray-500"> (Optional)</span>
                            </label>
                            <FileUploadField
                                className=""
                                labelClass="text-sm text-start w-fit font-medium text-[#094C81]"
                                id="attachment"
                                label="Upload files"
                                value={formValues.attachment_id || []}
                                onChange={(val) => handleChange("attachment_id", val)}
                                disabled={isSubmitting}
                            />
                        </div>
                    </div>

                    <div className="flex justify-end gap-4 mt-6">
                        <Button
                            onClick={handleClose}
                            type="button"
                            className="bg-golden-dark20 min-w-40 hover:bg-golden-dark30 h-12 text-base text-gray-600 py-2 rounded-md disabled:opacity-70"
                            disabled={isSubmitting}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={
                                isSubmitting ||
                                !complaintCategoryId ||
                                !complaintDescription.trim() ||
                                (targetType === "person" && !targetUserId) ||
                                (targetType === "department" && !targetDepartmentId)
                            }
                            className="bg-golden-dark min-w-52 hover:bg-golden-darkHover h-12 text-base text-white py-1 rounded-md shadow-md disabled:opacity-70"
                        >
                            {isSubmitting ? "Submitting..." : "Submit Complaint"}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreateMyComplaint;
