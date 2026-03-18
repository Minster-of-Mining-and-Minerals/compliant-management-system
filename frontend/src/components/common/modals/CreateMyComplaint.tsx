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
import { useGetSectorNodesQuery, useGetSectorNodesWithFlatChildrenQuery } from "@/redux/api/sectorNodeApi";
import { useGetComplaintCategoriesQuery } from "@/redux/api/complaintCategoryApi";
import { useCreateComplaintMutation } from "@/redux/api/complaintApi";
import { toast } from "sonner";
import { useSession } from "next-auth/react";
import { SectorNode } from "@/redux/types/sectorNode";
import { useGetUserTypesQuery } from "@/redux/api/userApi";

interface CreateMyComplaintProps {
    isOpen: boolean;
    onClose: () => void;
    sector_node_id?: string;
}

interface ComplaintFormValues {
    attachment_id: File[];
}

const CreateMyComplaint = ({ isOpen, onClose, sector_node_id }: CreateMyComplaintProps) => {
    const { data: session } = useSession();
    const { data: userTypes = [] } = useGetUserTypesQuery();
    const complaint_type_id = userTypes?.find(
        (type: any) => type.name === "internal"
    )?.user_type_id;

    const [sectorId, setSectorId] = useState("");
    const [departments, setDepartments] = useState<SectorNode[]>([]);
    const [departmentId, setDepartmentId] = useState("");
    const [complaintDescription, setComplaintDescription] = useState("");
    const [complaintCategoryId, setComplaintCategoryId] = useState("");
    const [complaintCategoryName, setComplaintCategoryName] = useState("");
    const [formValues, setFormValues] = useState<ComplaintFormValues>({
        attachment_id: [],
    });

    // Additional Fields
    const [incidentDate, setIncidentDate] = useState("");
    const [nameOfPersonConcerned, setNameOfPersonConcerned] = useState("");
    const [requestedAction, setRequestedAction] = useState("");

    // API queries
    const { data: sectorNodesData = [] } = useGetSectorNodesWithFlatChildrenQuery();
    const sectors = sectorNodesData.map((item) => ({
        ...item.sector,
        children: item.children || [],
    }));

    const { data: complaintCategories = [] } = useGetComplaintCategoriesQuery({
        is_active: true,
        type: "internal",
    });

    const [createComplaint, { isLoading: isSubmitting }] =
        useCreateComplaintMutation();

    // Initialize sector from prop when component opens or prop changes
    useEffect(() => {
        if (isOpen && sector_node_id && sectors.length > 0) {
            const selectedSector = sectors.find(
                (item) => item.sector_node_id === sector_node_id
            );

            if (selectedSector) {
                setSectorId(sector_node_id);
                setDepartments(selectedSector?.children || []);
                setDepartmentId(""); // Reset department when sector changes
            }
        }
    }, [sector_node_id, sectors, isOpen]);

    const handleSectorChange = (value: string) => {
        setSectorId(value);
        setDepartmentId("");
        const selectedSector = sectors.find(
            (item) => item.sector_node_id === value
        );
        setDepartments(selectedSector?.children || []);
    };

    const handleComplaintCategoryChange = (value: string) => {
        const selectedCategory = complaintCategories.find(
            (cat) => cat.category_id === value
        );
        setComplaintCategoryId(value);
        setComplaintCategoryName(selectedCategory?.name || "");
    };

    useEffect(() => {
        if (complaintCategories.length > 0 && !complaintCategoryId) {
            setComplaintCategoryId(complaintCategories[0].category_id);
            setComplaintCategoryName(complaintCategories[0].name);
        }
    }, [complaintCategories, complaintCategoryId]);

    const handleChange = (field: keyof ComplaintFormValues, value: any) => {
        setFormValues((prev) => ({
            ...prev,
            [field]: value,
        }));
    };

    const resetForm = () => {
        setSectorId("");
        setDepartmentId("");
        setDepartments([]);
        setComplaintDescription("");
        setIncidentDate("");
        setNameOfPersonConcerned("");
        setRequestedAction("");
        setFormValues({ attachment_id: [] });

        // Reset category to first option
        if (complaintCategories.length > 0) {
            setComplaintCategoryId(complaintCategories[0].category_id);
            setComplaintCategoryName(complaintCategories[0].name);
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

        // Validation
        if (!complaintDescription.trim()) {
            toast.error("Please provide a description for your complaint");
            return;
        }

        if (!sectorId) {
            toast.error("Please select a sector");
            return;
        }

        if (!complaintCategoryId) {
            toast.error("Please select a category");
            return;
        }

        try {
            const attachment_ids =
                formValues.attachment_id.length > 0
                    ? formValues.attachment_id
                    : undefined;

            const payload = {
                // User info from session
                complaint_type_id,
                full_name: session?.user?.name || undefined,
                email: session?.user?.email || undefined,
                phone_number: session?.user?.phone_number || undefined,

                // Required fields
                category_id: complaintCategoryId,
                sector_node_id: sectorId, // Always use the state value
                department_id: departmentId || undefined,
                description: complaintDescription.trim(),

                // Optional fields
                concern_to_user_name: nameOfPersonConcerned.trim() || "",
                request: requestedAction.trim() || "",
                incident_date: incidentDate || undefined,
                is_anonymous: false,

                // File attachments (if any)
                attachment_ids: attachment_ids,
            };

            await createComplaint(payload).unwrap();
            toast.success("Complaint submitted successfully!");

            // Reset form and close modal
            resetForm();
            onClose();
        } catch (err: any) {
            toast.error(
                err?.data?.message || err?.message || "An unexpected error occurred"
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
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold text-[#094C81]">
                        Create My Complaint
                    </h2>
                    <button
                        onClick={handleClose}
                        className="text-[#094C81] hover:text-gray-600 transition"
                    >
                        <XIcon className="w-6 h-6 cursor-pointer" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit}>
                    <div className="flex justify-between items-center mb-4">
                        <h1 className="block text-primary font-semibold text-lg">

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
                                    {complaintCategories?.map((category) => (
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
                        {/* Incident Date */}
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
                                name="dateOfIncident"
                                className="mt-1 w-full h-10 rounded-md text-sm border-golden-dark focus:border-none"
                                placeholder="Select date"
                                value={incidentDate}
                                onChange={(e) => setIncidentDate(e.target.value)}
                                disabled={isSubmitting}
                            />
                        </div>

                        {/* Sector - Always show but disable if sector_node_id is provided */}
                        <div className="w-full">
                            <label
                                htmlFor="sector"
                                className="block text-sm text-golden-dark"
                            >
                                Sector
                                <span className="text-red-500"> *</span>
                            </label>
                            <Select
                                value={sectorId}
                                onValueChange={handleSectorChange}
                                disabled={isSubmitting || !!sector_node_id} // Disable if sector_node_id is provided
                            >
                                <SelectTrigger className="w-full h-12 mt-1">
                                    <SelectValue placeholder="Select sector" />
                                </SelectTrigger>
                                <SelectContent>
                                    {sectors.map((sector) => (
                                        <SelectItem
                                            key={sector.sector_node_id}
                                            value={sector.sector_node_id}
                                        >
                                            {sector.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Department */}
                        <div className="w-full">
                            <label
                                htmlFor="department"
                                className="block text-sm text-golden-dark"
                            >
                                Department
                            </label>
                            <Select
                                value={departmentId}
                                onValueChange={setDepartmentId}
                                disabled={!sectorId || isSubmitting}
                            >
                                <SelectTrigger className="w-full h-12 mt-1">
                                    <SelectValue placeholder="Select department" />
                                </SelectTrigger>
                                <SelectContent>
                                    {departments.map((dept) => (
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

                        {/* Person Concerned */}
                        <div className="w-full">
                            <label
                                htmlFor="nameOfPersonConcerned"
                                className="block text-sm text-golden-dark"
                            >
                                Name of Person Concerned
                                <span className="text-gray-500"> (Optional)</span>
                            </label>
                            <Input
                                type="text"
                                id="nameOfPersonConcerned"
                                name="nameOfPersonConcerned"
                                className="mt-1 w-full h-10 rounded-md text-sm border-golden-dark focus:border-none"
                                placeholder="Enter name"
                                value={nameOfPersonConcerned}
                                onChange={(e) => setNameOfPersonConcerned(e.target.value)}
                                disabled={isSubmitting}
                            />
                        </div>

                        {/* Description */}
                        <div className="w-full">
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

                        {/* Requested Action */}
                        <div className="w-full">
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

                        {/* Evidence/Attachments */}
                        <div className="w-full">
                            <label
                                htmlFor="evidence"
                                className="block text-sm text-golden-dark"
                            >
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

                    {/* Action Buttons */}
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
                                !sectorId ||
                                !complaintDescription.trim()
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