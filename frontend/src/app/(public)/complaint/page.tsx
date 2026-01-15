"use client";
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
import { useState } from "react";
const Complaint = () => {
  const mockDepartments = [
    { id: "finance", name: "Finance" },
    { id: "hr", name: "Human Resources" },
    { id: "it", name: "IT Department" },
  ];

  // State for selected department
  const [departmentId, setDepartmentId] = useState("");

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
              <h1 className="block text-primary font-semibold text-lg ">
                Personal Information
              </h1>
              <div className="mt-4  gap-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 w-full">
                <div className="w-full">
                  <label
                    htmlFor="fullName"
                    className="block text-sm  text-golden-dark"
                  >
                    Full Name
                    <span className="text-gray-500"> (Optional)</span>
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
                    <span className="text-gray-500"> (Optional)</span>
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
                    <span className="text-gray-500"> (Optional)</span>
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
                    <span className="text-gray-500"> (Optional)</span>
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
                    <span className="text-gray-500"> (Optional)</span>
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
                    <span className="text-gray-500"> (Optional)</span>
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
                    htmlFor="complaintDescription"
                    className="block text-sm  text-golden-dark"
                  >
                    Complaint Description
                    <span className="text-red-500"> *</span>
                  </label>
                  <TextArea
                    placeholder="Describe your complaint in detail"
                    rows={4}
                    id="complaintDescription"
                    className="mt-1 w-full rounded-md text-sm focus:border-none"
                    error={false}
                  />
                </div>
                <div className="w-full">
                  <label
                    htmlFor="departmentReceivingComplaint"
                    className="block text-sm  text-golden-dark"
                  >
                    Department Receiving the Complaint
                    <span className="text-red-500"> *</span>
                  </label>
                  <Select value={departmentId} onValueChange={setDepartmentId}>
                    <SelectTrigger className="w-full h-12 mt-1 border border-golden-dark px-4 py-3 rounded-md focus:ring-1 focus:ring-golden-dark focus:border-transparent transition-all duration-200 outline-none">
                      <SelectValue
                        placeholder="Select Department"
                        className="text-sm text-gray-900 font-medium"
                      />
                    </SelectTrigger>

                    <SelectContent className="bg-white text-gray-700 font-medium text-sm">
                      {mockDepartments.map((dept) => (
                        <SelectItem
                          key={dept.id}
                          value={dept.id}
                          className="text-sm text-primary "
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
                    htmlFor="city"
                    className="block text-sm  text-golden-dark"
                  >
                    Evidence for the Complaint
                    <span className="text-gray-500"> (Optional)</span>
                  </label>
                  <Input
                    type="text"
                    id="evidenceForComplaint"
                    name="evidenceForComplaint"
                    className="mt-1 w-full h-10   rounded-md text-sm border-golden-dark  focus:border-none"
                    placeholder="Enter your evidence for the complaint"
                    error={false}
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

export default Complaint;
