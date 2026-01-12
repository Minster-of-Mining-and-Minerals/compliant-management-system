"use client";

import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useGetRolesQuery } from "@/redux/api/roleApi";
import {
  useCreateUserMutation,
  useGetExternalUserTypesQuery,
  useGetUserTypesQuery,
} from "@/redux/api/userApi";
import { CreateUserPayload } from "@/redux/types/user";
import { Check, ChevronDown, XIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useGetStructureNodesQuery } from "@/redux/api/structureNodeApi";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface CreateUserModalProps {
  user_type?: string;
  structure_node_id?: string;
  isOpen: boolean;
  onClose: () => void;
}

export const CreateUserModal: React.FC<CreateUserModalProps> = ({
  user_type,
  structure_node_id,
  isOpen,
  onClose,
}) => {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [selectedStructure, setSelectedStructure] = useState<string>("");
  const [selectedType, setSelectedType] = useState<string>("");

  const { data: userTypeResponse } = useGetExternalUserTypesQuery();
  const { data: rolesResponse } = useGetRolesQuery();
  const { data: structureResponse = [] } = useGetStructureNodesQuery(
    undefined,
    { skip: !!structure_node_id }
  );
  const types = userTypeResponse || [];
  const roles = rolesResponse || [];
  const structures = structureResponse || [];

  const {
    data: userTypes = [],
    isLoading: isLoadingType,
    isError: typeError,
    refetch: refetchType,
  } = useGetUserTypesQuery();

  const [createUser, { isLoading }] = useCreateUserMutation();
  const userTypeId = userTypes?.find(
    (type: any) => type.name === user_type
  )?.user_type_id;

  const handleSubmit = async () => {
    if (!fullName || !email || !selectedRoles.length) {
      toast.error("Please fill all required fields");
      return;
    }

    if (user_type && !userTypeId) {
      toast.error("User type not resolved yet");
      return;
    }

    const payload: CreateUserPayload = {
      full_name: fullName,
      email,
      role_ids: selectedRoles,
      // external_user_type_id: selectedType,
      // structure_node_id: structure_node_id
      //   ? structure_node_id
      //   : selectedStructure,
      ...(phoneNumber && { phone_number: phoneNumber }),
      ...(userTypeId && { user_type_id: userTypeId }),
    };

    try {
      await createUser(payload).unwrap();
      toast.success("User created successfully!");
      handleClose();
    } catch (error: any) {
      toast.error(error?.data?.message || "Failed to create user");
    }
  };

  const handleClose = () => {
    setFullName("");
    setEmail("");
    setPhoneNumber("");
    setSelectedType("");
    setSelectedRoles([]);
    onClose();
  };

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) handleClose();
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={handleBackdropClick}
    >
      <div className="bg-white p-6 rounded-2xl w-full max-w-[700px] shadow-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-[#094C81]">Create User</h2>
          <button
            onClick={handleClose}
            className="text-[#094C81] hover:text-gray-600 transition"
          >
            <XIcon className="w-6 h-6 cursor-pointer" />
          </button>
        </div>

        {/* Content */}
        <div className="w-full flex flex-col space-y-4">
          {/* User Detail */}
          <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-4  mt-2 pr-2">
            {/* Structure Selection (only if not passed from parent) */}
            {!structure_node_id && user_type === "external" && (
              <div className="w-full space-y-2">
                <Label className="block text-sm text-[#094C81] font-medium mb-2">
                  Structure <span className="text-red-500">*</span>
                </Label>

                <Select
                  value={selectedStructure}
                  onValueChange={setSelectedStructure}
                >
                  <SelectTrigger className="w-full h-12 border border-gray-300 px-4 py-5 rounded-md focus:ring focus:ring-[#094C81] focus:border-transparent transition-all duration-200 outline-none">
                    <SelectValue placeholder="Select Structure" />
                  </SelectTrigger>

                  <SelectContent className="text-[#094C81] bg-white max-h-64 overflow-y-auto">
                    {structures.map((s: any) => (
                      <SelectItem
                        key={s.structure_node_id}
                        value={s.structure_node_id}
                      >
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            {/* External User Types */}
            {user_type === "external" && (
              <div className="w-full space-y-2">
                <Label className="block text-sm text-[#094C81] font-medium mb-2">
                  User Type <span className="text-red-500">*</span>
                </Label>

                <Select value={selectedType} onValueChange={setSelectedType}>
                  <SelectTrigger className="w-full h-12 border border-gray-300 px-4 py-5 rounded-md focus:ring focus:ring-[#094C81] focus:border-transparent transition-all duration-200 outline-none">
                    <SelectValue placeholder="Select User Type" />
                  </SelectTrigger>

                  <SelectContent className="text-[#094C81] bg-white max-h-64 overflow-y-auto">
                    {types.map((s: any) => (
                      <SelectItem
                        key={s.external_user_type_id}
                        value={s.external_user_type_id}
                      >
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <Label className="block text-sm text-[#094C81] font-medium mb-2">
                Full Name <span className="text-red-500">*</span>
              </Label>
              <Input
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="John Doe"
                className="w-full h-12 border border-gray-300 px-4 py-3 rounded-md focus:ring focus:ring-[#094C81] focus:border-transparent transition-all duration-200 outline-none"
              />
            </div>
            <div className="space-y-2">
              <Label className="block text-sm text-[#094C81] font-medium mb-2">
                Phone Number <span className="text-red-500">*</span>
              </Label>
              <Input
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="+251 9xxxxxxx"
                className="w-full h-12 border border-gray-300 px-4 py-3 rounded-md focus:ring focus:ring-[#094C81] focus:border-transparent transition-all duration-200 outline-none"
              />
            </div>
            <div className="space-y-2">
              <Label className="block text-sm text-[#094C81] font-medium mb-2">
                Email <span className="text-red-500">*</span>
              </Label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="john@example.com"
                className="w-full h-12 border border-gray-300 px-4 py-3 rounded-md focus:ring focus:ring-[#094C81] focus:border-transparent transition-all duration-200 outline-none"
              />
            </div>
            {/* ROLE */}
            {/* ROLE MULTI SELECT */}

            <div className="w-full space-y-2">
              <Label className="text-sm font-medium text-[#094C81]">
                Role <span className="text-red-500">*</span>
              </Label>
              <Popover>
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    className="w-full max-h-28 min-h-12 h-fit border border-gray-300 p-2 rounded-md mt-1 text-[#094C81] bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#094C81] focus:ring-offset-2 transition-all duration-200"
                  >
                    <div className="flex flex-wrap items-center gap-2 w-full">
                      {selectedRoles.length === 0 && (
                        <span className="text-sm w-full justify-between text-gray-400 flex items-center gap-2">
                          Select Role
                          <ChevronDown className="h-4 w-4 ml-auto" />
                        </span>
                      )}

                      {selectedRoles.map((roleId) => {
                        const r = roles.find(
                          (rr: any) => rr.role_id === roleId
                        );
                        if (!r) return null;

                        return (
                          <span
                            key={roleId}
                            className="inline-flex items-center gap-1 rounded-sm justify-center bg-[#094C81]/10 text-[#094C81] pl-2  text-xs"
                          >
                            <span className="truncate max-w-[120px] py-1">
                              {r.name}
                            </span>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedRoles((prev) =>
                                  prev.filter((id) => id !== roleId)
                                );
                              }}
                              className="flex px-1 rounded-r-sm items-center justify-center py-1  hover:text-white  hover:bg-red-500 transition-colors"
                              aria-label={`Remove ${r.name}`}
                            >
                              <XIcon className="h-3 w-3" />
                            </button>
                          </span>
                        );
                      })}
                      {selectedRoles.length > 0 && (
                        <ChevronDown className="h-4 w-4 ml-auto text-gray-400" />
                      )}
                    </div>
                  </button>
                </PopoverTrigger>

                <PopoverContent
                  className="w-[300px] p-2 bg-white"
                  align="start"
                >
                  <div className="max-h-64 overflow-y-auto">
                    {roles
                      .filter((r: any) => !selectedRoles.includes(r.role_id))
                      .map((r: any) => (
                        <button
                          key={r.role_id}
                          type="button"
                          onClick={() => {
                            setSelectedRoles((prev) => [...prev, r.role_id]);
                          }}
                          className="w-full text-left px-3 py-2 text-sm text-[#094C81] hover:bg-[#094C81]/10 rounded-md cursor-pointer transition-colors"
                        >
                          <span className="block truncate">{r.name}</span>
                        </button>
                      ))}
                    {roles.filter(
                      (r: any) => !selectedRoles.includes(r.role_id)
                    ).length === 0 && (
                      <div className="px-3 py-2 text-sm text-gray-400 text-center">
                        All roles selected
                      </div>
                    )}
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end space-x-3 mt-6 pt-4 border-t">
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isLoading}
            className="min-w-24"
          >
            {isLoading ? "Creating..." : "Create"}
          </Button>
        </div>
      </div>
    </div>
  );
};
