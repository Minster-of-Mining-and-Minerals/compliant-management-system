"use client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BiToggleLeft, BiToggleRight } from "react-icons/bi";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TextArea } from "@/components/ui/textarea";
import { useGetSectorNodesQuery } from "@/redux/api/sectorNodeApi";
import { useState } from "react";
import { FileUploadField } from "@/components/ui/FileUploadField";
interface ComplaintFormValues {
  attachment_id: File[];
}

const ComplaintPage = () => {
  const [sectorId, setSectorId] = useState("");
  const [departments, setDepartments] = useState([]);
  const [departmentId, setDepartmentId] = useState("");
  const [complaintDescription, setComplaintDescription] = useState("");
  const [isPersonalInfoOpen, setIsPersonalInfoOpen] = useState(true);
  const [isTogglingPersonalInfo, setIsTogglingPersonalInfo] = useState(false);

  const { data = [], isLoading, isError, refetch } = useGetSectorNodesQuery();
  const root = data.filter((item) => item.parent_id === null);

  const sectors = root.flatMap((root) => root.children || []);

  const handleSectorChange = (value: string) => {
    setSectorId(value);
    setDepartmentId("");
    const selectedSector = data.find((item) => item.sector_node_id === value);
    setDepartments(selectedSector?.children || []);
  };

  const handlePersonalInfoToggle = () => {
    setIsTogglingPersonalInfo(true);

    setIsPersonalInfoOpen((prev) => !prev);

    setIsTogglingPersonalInfo(false);
  };

  const [formValues, setFormValues] = useState<ComplaintFormValues>({
    attachment_id: [],
  });

  const handleChange = (field: keyof ComplaintFormValues, value: any) => {
    setFormValues((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  return (
    <main className="flex flex-col min-h-screen z-10 relative  mx-auto px-4 sm:px-6 lg:px-20 pt-32 pb-16">
      <div className="mb-8 border-gray-200 pb-4">
        <h1 className="text-2xl font-bold text-gray-900">Submit a Complaint</h1>
        <p className="mt-2 text-sm text-gray-600 max-w-2xl">
          Please fill out the form below to submit your complaint. Provide
          accurate and complete information to help us process your complaint
          efficiently.
        </p>
      </div>
      <div className="grid grid-cols-3 gap-8">
        <div className="col-span-3 md:col-span-2">
          <form className=" flex-col w-full gap-10 flex">
            <div className="flex flex-col rounded-md w-full shadow-md px-10 pt-5 pb-10 ">
              <div className="flex justify-between">
                <h1 className="block text-primary font-semibold text-lg ">
                  Personal Information
                  <span className="ml-2 text-sm font-normal text-gray-500">
                    (Optional)
                  </span>
                </h1>

                <button
                  type="button"
                  className={`p-0 transition-all duration-200 ${isPersonalInfoOpen ? "text-golden-dark" : "text-gray-400"
                    }`}
                  onClick={handlePersonalInfoToggle}
                  disabled={isTogglingPersonalInfo}
                  title={
                    isPersonalInfoOpen
                      ? "Hide personal information"
                      : "Show personal information"
                  }
                >
                  {isTogglingPersonalInfo ? (
                    <div className="w-10 h-10 flex items-center justify-center">
                      <div className="h-6 w-6 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    </div>
                  ) : isPersonalInfoOpen ? (
                    <BiToggleRight className="h-10 w-10 transition-transform duration-300 scale-100" />
                  ) : (
                    <BiToggleLeft className="h-10 w-10 transition-transform duration-300 scale-90 " />
                  )}
                </button>
              </div>
              <div
                className={`mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 w-full
    overflow-hidden transition-all duration-500 ease-in-out
    ${isPersonalInfoOpen ? "max-h-[1000px] opacity-100" : "max-h-0 opacity-0"}
  `}
              >
                <div className="w-full">
                  <label
                    htmlFor="fullName"
                    className="block text-sm  text-golden-dark"
                  >
                    Full Name
                    <span className="text-gray-500"> </span>
                  </label>
                  <Input
                    type="text"
                    id="fullName"
                    name="fullName"
                    className="mt-1 w-full h-10   rounded-md text-sm border-golden-dark  focus:border-none"
                    placeholder="Enter your full name"
                    error={false}
                  />
                </div>
                <div className="w-full">
                  <label
                    htmlFor="phoneNumber"
                    className="block text-sm  text-golden-dark"
                  >
                    Phone Number
                    <span className="text-gray-500"> </span>
                  </label>
                  <Input
                    type="text"
                    id="phoneNumber"
                    name="phoneNumber"
                    className="mt-1 w-full h-10   rounded-md text-sm border-golden-dark  focus:border-none"
                    placeholder="Enter your phone number"
                    error={false}
                  />
                </div>
                <div className="w-full">
                  <label
                    htmlFor="email"
                    className="block text-sm  text-golden-dark"
                  >
                    Email
                    <span className="text-gray-500"> </span>
                  </label>
                  <Input
                    type="text"
                    id="email"
                    name="email"
                    className="mt-1 w-full h-10   rounded-md text-sm border-golden-dark  focus:border-none"
                    placeholder="Enter your email address"
                    error={false}
                  />
                </div>
                <div className="w-full">
                  <label
                    htmlFor="city"
                    className="block text-sm  text-golden-dark"
                  >
                    City
                    <span className="text-gray-500"> </span>
                  </label>
                  <Input
                    type="text"
                    id="city"
                    name="city"
                    className="mt-1 w-full h-10   rounded-md text-sm border-golden-dark  focus:border-none"
                    placeholder="Enter your city"
                    error={false}
                  />
                </div>
                <div className="w-full">
                  <label
                    htmlFor="subCity"
                    className="block text-sm  text-golden-dark"
                  >
                    Subcity
                    <span className="text-gray-500"> </span>
                  </label>
                  <Input
                    type="text"
                    id="subCity"
                    name="subCity"
                    className="mt-1 w-full h-10   rounded-md text-sm border-golden-dark  focus:border-none"
                    placeholder="Enter your subcity"
                    error={false}
                  />
                </div>
                <div className="w-full">
                  <label
                    htmlFor="woreda"
                    className="block text-sm  text-golden-dark"
                  >
                    Woreda
                    <span className="text-gray-500"> </span>
                  </label>
                  <Input
                    type="text"
                    id="woreda"
                    name="woreda"
                    className="mt-1 w-full h-10   rounded-md text-sm border-golden-dark  focus:border-none"
                    placeholder="Enter your woreda"
                    error={false}
                  />
                </div>
              </div>
            </div>
            <div className="flex flex-col rounded-md w-full shadow-md px-10 pt-5 pb-10 ">
              <h1 className="block text-primary font-semibold text-lg ">
                Complaint Details
              </h1>
              <div className="mt-4  gap-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 w-full">

                <div className="w-full">
                  <label
                    htmlFor="woreda"
                    className="block text-sm  text-golden-dark"
                  >
                    Date of Incident
                    <span className="text-gray-500"> </span>
                  </label>
                  <Input
                    type="date"
                    id="dateOfIncident"
                    name="dateOfIncident"
                    className="mt-1 w-full h-10   rounded-md text-sm border-golden-dark  focus:border-none"
                    placeholder="Enter your date of incident"

                  />
                </div>
                <div className="w-full">
                  <label
                    htmlFor="departmentReceivingComplaint"
                    className="block text-sm  text-golden-dark"
                  >
                    Sector Receiving the Complaint
                    <span className="text-red-500"> *</span>
                  </label>
                  <Select value={sectorId} onValueChange={handleSectorChange}>
                    <SelectTrigger className="w-full h-12 mt-1">
                      <SelectValue placeholder="Select Sector" />
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
                <div className="w-full">
                  <label
                    htmlFor="departmentReceivingComplaint"
                    className="block text-sm  text-golden-dark"
                  >
                    Department Receiving the Complaint
                    <span className="text-red-500"> *</span>
                  </label>
                  <Select
                    value={departmentId}
                    onValueChange={setDepartmentId}
                    disabled={!sectorId}
                  >
                    <SelectTrigger className="w-full h-12 mt-1">
                      <SelectValue placeholder="Select Department" />
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
                <div className="w-full">
                  <label
                    htmlFor="nameOfPersonConcerned"
                    className="block text-sm  text-golden-dark"
                  >
                    Name of the Person Concerned
                    <span className="text-gray-500"> (Optional)</span>
                  </label>
                  <Input
                    type="text"
                    id="nameOfPersonConcerned"
                    name="nameOfPersonConcerned"
                    className="mt-1 w-full h-10   rounded-md text-sm border-golden-dark  focus:border-none"
                    placeholder="Enter the name of the person concerned"
                    error={false}
                  />
                </div>
                <div className="w-full">
                  <label
                    htmlFor="complaintDescription"
                    className="block text-sm  text-golden-dark"
                  >
                    Complaint Description
                    <span className="text-red-500"> *</span>
                  </label>
                  <TextArea
                    placeholder="Describe your complaint in detail"
                    rows={3}
                    id="complaintDescription"
                    className="mt-1 w-full rounded-md text-sm focus:border-none"
                    error={false}
                    value={complaintDescription}
                    onChange={(val) => setComplaintDescription(val)}
                  />
                </div>
                <div className="w-full">
                  <label
                    htmlFor="requestedAction"
                    className="block text-sm  text-golden-dark"
                  >
                    Requested Action
                    <span className="text-gray-500"> (Optional)</span>
                  </label>
                  <TextArea
                    placeholder="Enter your requested action"
                    rows={3}
                    id="requestedAction"
                    className="mt-1 w-full  rounded-md text-sm border-golden-dark  focus:border-none"
                    error={false}
                  />
                </div>
                <div className="w-full">
                  <label
                    htmlFor="city"
                    className="block text-sm  text-golden-dark"
                  >
                    Evidence for the Complaint
                    <span className="text-gray-500"> (Optional)</span>
                  </label>
                  <FileUploadField
                    className=""
                    labelClass="text-sm  text-start w-fit font-medium text-[#094C81]"
                    id="attachment"
                    label="Attach File"
                    value={formValues.attachment_id || []}
                    onChange={(val) => handleChange("attachment_id", val)}
                  />
                </div>

              </div>
            </div>

            <div className="flex justify-end gap-4 mt-6">
              <Button className="bg-golden-dark20 min-w-40 hover:bg-golden-dark30 h-12  text-base text-gray-600 py-2 rounded-md ">
                Cancel
              </Button>
              <Button className=" bg-golden-dark min-w-52 hover:bg-golden-darkHover h-12  text-base text-white py-1 rounded-md shadow-md">
                Submit Complaint
              </Button>
            </div>
          </form>
        </div>
        <div className="col-span-3  md:col-span-1">
          <div className="sticky top-20  border border-gray-200 rounded-lg p-6 shadow-lg">
            <h2 className="text-lg  text-gray-900 mb-4">Complaint Tips</h2>
            <ul className="list-disc list-inside text-sm text-gray-700 space-y-2">
              <li>Be clear and concise in your description.</li>
              <li>Include relevant dates and details.</li>
              <li>Attach any supporting documents if necessary.</li>
              <li>Provide your contact information for follow-up.</li>
              <li>
                Incomplete or unclear complaints may take longer to process.
              </li>
            </ul>
          </div>
        </div>
      </div>
    </main>
  );
};

export default ComplaintPage;
