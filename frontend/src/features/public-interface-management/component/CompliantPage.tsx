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
import { useEffect, useState } from "react";
import { FileUploadField } from "@/components/ui/FileUploadField";
import { useGetComplaintCategoriesQuery } from "@/redux/api/complaintCategoryApi";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { useCreateComplaintMutation } from "@/redux/api/complaintApi";
import TicketSuccessModal from "@/components/common/modals/ComplaintSuccess";
import { todayDateInputValue } from "@/utils/date";

interface ComplaintFormValues {
  attachment_id: File[];
}

const ComplaintPage = () => {
  // Basic form fields
  const [sectorId, setSectorId] = useState("");
  const [departments, setDepartments] = useState([]);
  const [departmentId, setDepartmentId] = useState("");
  const [complaintDescription, setComplaintDescription] = useState("");
  const [isPersonalInfoOpen, setIsPersonalInfoOpen] = useState(true);
  const [isTogglingPersonalInfo, setIsTogglingPersonalInfo] = useState(false);
  const [complaintCategoryId, setComplaintCategoryId] = useState("");
  const [complaintCategoryName, setComplaintCategoryName] = useState("");
  const [formValues, setFormValues] = useState<ComplaintFormValues>({
    attachment_id: [],
  });
  const [showTicketModal, setShowTicketModal] = useState(false);
  const [ticketNumber, setTicketNumber] = useState("");

  // Personal Info Fields (matching CreateComplaintPayload)
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [city, setCity] = useState("");
  const [subCity, setSubCity] = useState("");
  const [woreda, setWoreda] = useState("");
  const [sectorName, setSectorName] = useState("");

  // Additional Fields (matching CreateComplaintPayload)
  const [incidentDate, setIncidentDate] = useState("");
  const [nameOfPersonConcerned, setNameOfPersonConcerned] = useState("");
  const [requestedAction, setRequestedAction] = useState("");

  const t = useTranslations("ComplaintPage");

  // Fix: Extract the data array from the sector nodes response (fetch all sectors)
  const { data: sectorNodesResponse = {} } = useGetSectorNodesQuery({ limit: 1000 });
  const sectorNodesData = sectorNodesResponse?.data || [];
  // console.log("sector nodes", sectorNodesData);

  const root = sectorNodesData.filter((item) => item.parent_id === null);
  const sectors = root.flatMap((rootItem) => rootItem.children || []);
  // console.log("sectors", sectors);

  // Fix: Extract the data array from the categories response
  const { data: complaintCategoriesResponse = {} } = useGetComplaintCategoriesQuery({
    is_active: true,
    type: "external",
  });
  const complaintCategories = complaintCategoriesResponse?.data || [];
  // console.log("categories", complaintCategories);

  const [createComplaint, { isLoading: isSubmitting }] =
    useCreateComplaintMutation();

  const handleSectorChange = (value: string) => {
    setSectorId(value);
    setDepartmentId("");
    setSectorName("");
    const selectedSector = sectorNodesData.find((item) => item.sector_node_id === value);
    setDepartments(selectedSector?.children || []);
  };

  const handleComplaintCategoryChange = (value: string) => {
    const selectedCategory = complaintCategories.find(
      (cat) => cat.category_id === value,
    );
    setComplaintCategoryId(value);
    setComplaintCategoryName(selectedCategory?.name || "");
  };

  const handlePersonalInfoToggle = () => {
    setIsTogglingPersonalInfo(true);
    setIsPersonalInfoOpen((prev) => !prev);
    setTimeout(() => {
      setIsTogglingPersonalInfo(false);
    }, 200);
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

  const ResetForm = () => {
    setSectorId("");
    setDepartmentId("");
    setComplaintDescription("");
    setFullName("");
    setEmail("");
    setPhoneNumber("");
    setCity("");
    setSubCity("");
    setWoreda("");
    setIncidentDate("");
    setNameOfPersonConcerned("");
    setRequestedAction("");
    setFormValues({ attachment_id: [] });
  };

  // ----------------- SUBMIT HANDLER -----------------
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!complaintDescription.trim()) {
      toast.error(t("validation.descriptionRequired"));
      return;
    }

    if (!sectorId) {
      toast.error(t("validation.sectorDepartmentRequired"));
      return;
    }

    if (!complaintCategoryId) {
      toast.error(t("validation.categoryRequired"));
      return;
    }

    try {
      // Determine if anonymous based on personal info toggle and filled fields
      const hasPersonalInfo =
        fullName.trim() ||
        email.trim() ||
        phoneNumber.trim() ||
        city.trim() ||
        subCity.trim() ||
        woreda.trim();
      const isAnonymous = !isPersonalInfoOpen || !hasPersonalInfo;

      // Create location object if any location fields are filled
      const location =
        city.trim() || subCity.trim() || woreda.trim()
          ? {
            city: city.trim(),
            subcity: subCity.trim(),
            woreda: woreda.trim(),
          }
          : null;

      // Prepare attachment_ids
      const attachment_ids =
        formValues.attachment_id.length > 0
          ? formValues.attachment_id
          : undefined;

      const payload = {
        // Personal info (only include if not anonymous)
        full_name: isAnonymous ? undefined : fullName.trim(),
        email: isAnonymous ? undefined : email.trim(),
        phone_number: isAnonymous ? undefined : phoneNumber.trim(),

        // Required fields
        category_id: complaintCategoryId,
        sector_node_id: sectorId,
        department_id: departmentId && departmentId !== "none" ? departmentId : undefined,
        description: complaintDescription.trim(),

        // Optional fields
        concern_to_user_name: nameOfPersonConcerned.trim() || "",
        request: requestedAction.trim() || "",
        location: location,
        incident_date: incidentDate || undefined,
        is_anonymous: isAnonymous,

        // File attachments (if any)
        attachment_ids: attachment_ids,
      };

      // console.log("Submitting payload:", payload);

      const result = await createComplaint(payload).unwrap();

      setTicketNumber(result?.ticketing_code);
      setShowTicketModal(true);

      toast.success(t("toast.success.submitted"));
      ResetForm();

      // Reset category to default
      if (complaintCategories.length > 0) {
        setComplaintCategoryId(complaintCategories[0].category_id);
        setComplaintCategoryName(complaintCategories[0].name);
      }
    } catch (err: any) {
      console.error("Submission error:", err);
      toast.error(
        err?.data?.message || err?.message || t("toast.error.unexpected"),
      );
    }
  };

  return (
    <>
      <main className="flex flex-col min-h-screen z-10 relative mx-auto px-4 sm:px-6 lg:px-20 pt-32 pb-16">
        <div className="mb-8 border-gray-200 pb-4">
          <h1 className="text-2xl font-bold text-gray-900">{t("title")}</h1>
          <p className="mt-2 text-sm text-gray-600 max-w-2xl">{t("subtitle")}</p>
        </div>
        <div className="grid grid-cols-3 gap-8">
          <div className="col-span-3 md:col-span-2">
            <form className="flex-col w-full gap-10 flex" onSubmit={handleSubmit}>
              <div className="flex flex-col rounded-md w-full shadow-md px-10 pt-5 pb-10">
                <div className="flex justify-between">
                  <h1 className="block text-primary font-semibold text-lg">
                    {t("personalInfo.title")}
                    <span className="ml-2 text-sm font-normal text-gray-500">
                      {t("personalInfo.optional")}
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
                      <BiToggleLeft className="h-10 w-10 transition-transform duration-300 scale-90" />
                    )}
                  </button>
                </div>
                <div
                  className={`mt-4 p-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 w-full
                  overflow-hidden transition-all duration-500 ease-in-out
                  ${isPersonalInfoOpen ? "max-h-[1000px] opacity-100" : "max-h-0 opacity-0"}
                `}
                >
                  <div className="w-full">
                    <label
                      htmlFor="fullName"
                      className="block text-sm text-golden-dark"
                    >
                      {t("personalInfo.fullName")}
                      <span className="text-gray-500"></span>
                    </label>
                    <Input
                      type="text"
                      id="fullName"
                      name="fullName"
                      className="mt-1 w-full h-10 rounded-md text-sm border-golden-dark focus:border-none"
                      placeholder={t("personalInfo.fullNamePlaceholder")}
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      disabled={isSubmitting}
                    />
                  </div>
                  <div className="w-full">
                    <label
                      htmlFor="phoneNumber"
                      className="block text-sm text-golden-dark"
                    >
                      {t("personalInfo.phone")}
                      <span className="text-gray-500"></span>
                    </label>
                    <Input
                      type="text"
                      id="phoneNumber"
                      name="phoneNumber"
                      className="mt-1 w-full h-10 rounded-md text-sm border-golden-dark focus:border-none"
                      placeholder={t("personalInfo.phonePlaceholder")}
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      disabled={isSubmitting}
                    />
                  </div>
                  <div className="w-full">
                    <label
                      htmlFor="email"
                      className="block text-sm text-golden-dark"
                    >
                      {t("personalInfo.email")}
                      <span className="text-gray-500"></span>
                    </label>
                    <Input
                      type="text"
                      id="email"
                      name="email"
                      className="mt-1 w-full h-10 rounded-md text-sm border-golden-dark focus:border-none"
                      placeholder={t("personalInfo.emailPlaceholder")}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={isSubmitting}
                    />
                  </div>
                  <div className="w-full">
                    <label
                      htmlFor="city"
                      className="block text-sm text-golden-dark"
                    >
                      {t("personalInfo.city")}
                      <span className="text-gray-500"></span>
                    </label>
                    <Input
                      type="text"
                      id="city"
                      name="city"
                      className="mt-1 w-full h-10 rounded-md text-sm border-golden-dark focus:border-none"
                      placeholder={t("personalInfo.cityPlaceholder")}
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      disabled={isSubmitting}
                    />
                  </div>
                  <div className="w-full">
                    <label
                      htmlFor="subCity"
                      className="block text-sm text-golden-dark"
                    >
                      {t("personalInfo.subCity")}
                      <span className="text-gray-500"></span>
                    </label>
                    <Input
                      type="text"
                      id="subCity"
                      name="subCity"
                      className="mt-1 w-full h-10 rounded-md text-sm border-golden-dark focus:border-none"
                      placeholder={t("personalInfo.subCityPlaceholder")}
                      value={subCity}
                      onChange={(e) => setSubCity(e.target.value)}
                      disabled={isSubmitting}
                    />
                  </div>
                  <div className="w-full">
                    <label
                      htmlFor="woreda"
                      className="block text-sm text-golden-dark"
                    >
                      {t("personalInfo.woreda")}
                      <span className="text-gray-500"></span>
                    </label>
                    <Input
                      type="text"
                      id="woreda"
                      name="woreda"
                      className="mt-1 w-full h-10 rounded-md text-sm border-golden-dark focus:border-none"
                      placeholder={t("personalInfo.woredaPlaceholder")}
                      value={woreda}
                      onChange={(e) => setWoreda(e.target.value)}
                      disabled={isSubmitting}
                    />
                  </div>
                </div>
              </div>
              <div className="flex flex-col rounded-md w-full shadow-md px-10 pt-5 pb-10">
                <div className="flex justify-between items-center mb-4">
                  <h1 className="block text-primary font-semibold text-lg">
                    {t("details.title", { category: complaintCategoryName })}
                  </h1>
                  <div className="min-w-40">
                    <label
                      htmlFor="departmentReceivingComplaint"
                      className="block text-sm text-golden-dark"
                    >
                      {t("details.category")}
                      <span className="text-red-500"> *</span>
                    </label>
                    <Select
                      value={complaintCategoryId}
                      onValueChange={handleComplaintCategoryChange}
                      disabled={isSubmitting}
                    >
                      <SelectTrigger className="w-full h-12 mt-1">
                        <SelectValue
                          placeholder={t("details.categoryPlaceholder")}
                        />
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
                    <label
                      htmlFor="woreda"
                      className="block text-sm text-golden-dark"
                    >
                      {t("details.incidentDate")}
                      <span className="text-gray-500"></span>
                    </label>
                    <Input
                      type="date"
                      id="dateOfIncident"
                      name="dateOfIncident"
                      className="mt-1 w-full h-10 rounded-md text-sm border-golden-dark focus:border-none"
                      placeholder={t("details.incidentDatePlaceholder")}
                      value={incidentDate}
                      onChange={(e) => setIncidentDate(e.target.value)}
                      disabled={isSubmitting}
                    />
                  </div>
                  <div className="w-full">
                    <label
                      htmlFor="departmentReceivingComplaint"
                      className="block text-sm text-golden-dark"
                    >
                      {t("details.sector", { category: complaintCategoryName })}
                      <span className="text-red-500"> *</span>
                    </label>
                    <Select
                      value={sectorId}
                      onValueChange={handleSectorChange}
                      disabled={isSubmitting}
                    >
                      <SelectTrigger className="w-full h-12 mt-1">
                        <SelectValue
                          placeholder={t("details.sectorPlaceholder", {
                            category: complaintCategoryName,
                          })}
                        />
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
                      className="block text-sm text-golden-dark"
                    >
                      {t("details.department", {
                        category: complaintCategoryName,
                      })}
                    </label>
                    <Select
                      value={departmentId}
                      onValueChange={setDepartmentId}
                      disabled={!sectorId || isSubmitting}
                    >
                      <SelectTrigger className="w-full h-12 mt-1">
                        <SelectValue
                          placeholder={t("details.departmentPlaceholder", {
                            category: complaintCategoryName,
                          })}
                        />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No specific department</SelectItem>
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
                      className="block text-sm text-golden-dark"
                    >
                      {t("details.personConcerned", {
                        category: complaintCategoryName,
                      })}
                      <span className="text-gray-500">
                        {" "}
                        ({t("details.optional")})
                      </span>
                    </label>
                    <Input
                      type="text"
                      id="nameOfPersonConcerned"
                      name="nameOfPersonConcerned"
                      className="mt-1 w-full h-10 rounded-md text-sm border-golden-dark focus:border-none"
                      placeholder={t("details.personConcernedPlaceholder", {
                        category: complaintCategoryName,
                      })}
                      value={nameOfPersonConcerned}
                      onChange={(e) => setNameOfPersonConcerned(e.target.value)}
                      disabled={isSubmitting}
                    />
                  </div>
                  <div className="w-full">
                    <label
                      htmlFor="complaintDescription"
                      className="block text-sm text-golden-dark"
                    >
                      {t("details.description", {
                        category: complaintCategoryName,
                      })}
                      <span className="text-red-500"> *</span>
                    </label>
                    <TextArea
                      placeholder={t("details.descriptionPlaceholder", {
                        category: complaintCategoryName,
                      })}
                      rows={3}
                      id="complaintDescription"
                      className="mt-1 w-full rounded-md text-sm focus:border-none"
                      value={complaintDescription}
                      onChange={(val) => setComplaintDescription(val)}
                      disabled={isSubmitting}
                    />
                  </div>
                  <div className="w-full">
                    <label
                      htmlFor="requestedAction"
                      className="block text-sm text-golden-dark"
                    >
                      {t("details.requestedAction", {
                        category: complaintCategoryName,
                      })}
                      <span className="text-gray-500">
                        {" "}
                        ({t("details.optional")})
                      </span>
                    </label>
                    <TextArea
                      placeholder={t("details.requestedActionPlaceholder", {
                        category: complaintCategoryName,
                      })}
                      rows={3}
                      id="requestedAction"
                      className="mt-1 w-full rounded-md text-sm border-golden-dark focus:border-none"
                      value={requestedAction}
                      onChange={(val) => setRequestedAction(val)}
                      disabled={isSubmitting}
                    />
                  </div>
                  <div className="w-full">
                    <label
                      htmlFor="evidence"
                      className="block text-sm text-golden-dark"
                    >
                      {t("details.evidence", { category: complaintCategoryName })}
                      <span className="text-gray-500"> (Optional)</span>
                    </label>
                    <FileUploadField
                      className=""
                      labelClass="text-sm text-start w-fit font-medium text-[#094C81]"
                      id="attachment"
                      label={t("details.evidencePlaceholder", {
                        category: complaintCategoryName,
                      })}
                      value={formValues.attachment_id || []}
                      onChange={(val) => handleChange("attachment_id", val)}
                      disabled={isSubmitting}
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-4 mt-6">
                <Button
                  onClick={() => {
                    ResetForm();
                  }}
                  type="button"
                  className="bg-golden-dark20 min-w-40 hover:bg-golden-dark30 h-12 text-base text-gray-600 py-2 rounded-md disabled:opacity-70"
                  disabled={isSubmitting}
                >
                  {t("buttons.cancel", { category: complaintCategoryName })}
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
                  {isSubmitting
                    ? t("buttons.submitting", { category: complaintCategoryName })
                    : t("buttons.submit", { category: complaintCategoryName })}
                </Button>
              </div>
            </form>
          </div>
          <div className="col-span-3 md:col-span-1">
            <div className="sticky top-20 border border-gray-200 rounded-lg p-6 shadow-lg">
              <h2 className="text-lg text-gray-900 mb-4">{t("tips.title")}</h2>
              <ul className="list-disc list-inside text-sm text-gray-700 space-y-2">
                <li>{t("tips.items.0")}</li>
                <li>{t("tips.items.1")}</li>
                <li>{t("tips.items.2")}</li>
                <li>{t("tips.items.3")}</li>
                <li>{t("tips.items.4")}</li>
              </ul>
            </div>
          </div>
        </div>
      </main>
      <TicketSuccessModal
        open={showTicketModal}
        onClose={() => setShowTicketModal(false)}
        ticketNumber={ticketNumber}
        sectorName={sectorName}
        submittedAt={todayDateInputValue()}
      />
    </>
  );
};

export default ComplaintPage;