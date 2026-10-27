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
import { useGetSectorNodesQuery } from "@/redux/api/sectorNodeApi";
import { useEffect, useState } from "react";
import { FileUploadField } from "@/components/ui/FileUploadField";
import { useGetComplaintCategoriesQuery } from "@/redux/api/complaintCategoryApi";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { useCreateComplaintMutation } from "@/redux/api/complaintApi";
import TicketSuccessModal from "@/components/common/modals/ComplaintSuccess";
import { todayDateInputValue } from "@/utils/date";
import { ArrowRight, Check, ChevronLeft, ChevronRight, EyeOff, ShieldCheck } from "lucide-react";
import PublicPageBanner from "@/components/layout/PublicPageBanner";
import { Link } from "@/i18n/navigation";

interface ComplaintFormValues {
  attachment_id: File[];
}

type FieldErrors = Partial<
  Record<
    | "fullName"
    | "email"
    | "phoneNumber"
    | "category"
    | "sector"
    | "description"
    | "personConcerned",
    string
  >
>;

const DESCRIPTION_MIN = 10;
const DESCRIPTION_MAX = 2000;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// text-base on phones: iOS zooms into any field with text smaller than 16px
const inputClass =
  "mt-1 w-full h-12 rounded-md text-base sm:text-sm border-golden-dark focus:border-none";
// Form sections sit inside the single white page card, so they carry no frame of their own
const cardClass = "flex flex-col w-full";

const FieldError = ({ message }: { message?: string }) =>
  message ? (
    <p role="alert" className="mt-1 text-xs text-red-600">
      {message}
    </p>
  ) : null;

const ComplaintPage = () => {
  // Basic form fields
  const [sectorId, setSectorId] = useState("");
  const [departments, setDepartments] = useState([]);
  const [departmentId, setDepartmentId] = useState("");
  const [complaintDescription, setComplaintDescription] = useState("");
  const [isPersonalInfoOpen, setIsPersonalInfoOpen] = useState(true);
  const [complaintCategoryId, setComplaintCategoryId] = useState("");
  const [complaintCategoryName, setComplaintCategoryName] = useState("");
  const [formValues, setFormValues] = useState<ComplaintFormValues>({
    attachment_id: [],
  });
  const [showTicketModal, setShowTicketModal] = useState(false);
  const [ticketNumber, setTicketNumber] = useState("");
  const [submittedSectorName, setSubmittedSectorName] = useState("");

  // Personal Info Fields (matching CreateComplaintPayload)
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [city, setCity] = useState("");
  const [subCity, setSubCity] = useState("");
  const [woreda, setWoreda] = useState("");
  const [sectorName, setSectorName] = useState("");
  const [departmentName, setDepartmentName] = useState("");

  // Additional Fields (matching CreateComplaintPayload)
  const [incidentDate, setIncidentDate] = useState("");
  const [nameOfPersonConcerned, setNameOfPersonConcerned] = useState("");
  const [requestedAction, setRequestedAction] = useState("");

  // Wizard state
  const [step, setStep] = useState(0);
  const [errors, setErrors] = useState<FieldErrors>({});

  const t = useTranslations("ComplaintPage");
  const tHome = useTranslations("HomePage");
  // Labels read "… {category} …"; until a category is picked, use the generic word
  const categoryLabel = complaintCategoryName || t("details.categoryFallback");

  // Fix: Extract the data array from the sector nodes response (fetch all sectors)
  const { data: sectorNodesResponse = {} } = useGetSectorNodesQuery({ limit: 1000 });
  const sectorNodesData = sectorNodesResponse?.data || [];

  const root = sectorNodesData.filter((item) => item.parent_id === null);
  const sectors = root.flatMap((rootItem) => rootItem.children || []);

  // Fix: Extract the data array from the categories response
  const { data: complaintCategoriesResponse = {} } = useGetComplaintCategoriesQuery({
    is_active: true,
    type: "external",
  });
  const complaintCategories = complaintCategoriesResponse?.data || [];

  const [createComplaint, { isLoading: isSubmitting }] =
    useCreateComplaintMutation();

  const steps = [
    t("steps.personal"),
    t("steps.details", { category: categoryLabel }),
    t("steps.review"),
  ];
  const isLastStep = step === steps.length - 1;

  const clearError = (field: keyof FieldErrors) =>
    setErrors((prev) => ({ ...prev, [field]: undefined }));

  const handleSectorChange = (value: string) => {
    setSectorId(value);
    setDepartmentId("");
    setDepartmentName("");
    const selectedSector = sectorNodesData.find((item) => item.sector_node_id === value);
    setSectorName(selectedSector?.name || "");
    setDepartments(selectedSector?.children || []);
    clearError("sector");
  };

  const handleDepartmentChange = (value: string) => {
    setDepartmentId(value);
    const selectedDepartment = departments.find(
      (dept: any) => dept.sector_node_id === value,
    ) as any;
    setDepartmentName(selectedDepartment?.name || "");
  };

  const handleComplaintCategoryChange = (value: string) => {
    const selectedCategory = complaintCategories.find(
      (cat) => cat.category_id === value,
    );
    setComplaintCategoryId(value);
    setComplaintCategoryName(selectedCategory?.name || "");
    clearError("category");
  };

  useEffect(() => {
    // Pre-select only when there is a single category; otherwise the citizen must choose
    if (complaintCategories.length === 1 && !complaintCategoryId) {
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
    setSectorName("");
    setDepartmentId("");
    setDepartmentName("");
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
    setErrors({});
    setStep(0);
  };

  // ----------------- VALIDATION (mirrors backend complaintValidator) -----------------
  // shareDetails: whether step 1's personal details are being submitted (and so must be valid)
  const validateStep = (stepIndex: number, shareDetails = isPersonalInfoOpen): FieldErrors => {
    const next: FieldErrors = {};

    if (stepIndex === 0 && shareDetails) {
      if (fullName.trim() && fullName.trim().length < 3) {
        next.fullName = t("validation.fullNameMin");
      }
      if (email.trim() && !EMAIL_PATTERN.test(email.trim())) {
        next.email = t("validation.emailInvalid");
      }
      const phone = phoneNumber.trim();
      if (phone && (phone.length < 7 || phone.length > 20)) {
        next.phoneNumber = t("validation.phoneInvalid");
      }
    }

    if (stepIndex === 1) {
      if (!complaintCategoryId) next.category = t("validation.categoryRequired");
      if (!sectorId) next.sector = t("validation.sectorDepartmentRequired");
      if (!complaintDescription.trim()) {
        next.description = t("validation.descriptionRequired");
      } else if (complaintDescription.trim().length < DESCRIPTION_MIN) {
        next.description = t("validation.descriptionMin", { min: DESCRIPTION_MIN });
      }
      const concerned = nameOfPersonConcerned.trim();
      if (concerned && concerned.length < 10) {
        next.personConcerned = t("validation.personConcernedMin");
      }
    }

    return next;
  };

  const goNext = () => {
    // "Next" on step 1 means the citizen is sharing their details
    if (step === 0) setIsPersonalInfoOpen(true);
    const stepErrors = validateStep(step, step === 0 ? true : isPersonalInfoOpen);
    setErrors(stepErrors);
    if (Object.keys(stepErrors).length > 0) {
      toast.error(t("toast.error.errors"));
      return;
    }
    setStep((s) => Math.min(s + 1, steps.length - 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Skip personal details: the complaint is sent without name/contact/location
  const continueAnonymously = () => {
    setIsPersonalInfoOpen(false);
    setErrors({});
    setStep(1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const goBack = () => {
    setStep((s) => Math.max(s - 1, 0));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Native form submit (e.g. Enter key) only ever moves forward — the complaint is
  // sent exclusively by clicking the final Submit button (handleSubmit below).
  // Otherwise the click on "Next" can land on the Submit button that replaces it.
  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLastStep) goNext();
  };

  // ----------------- SUBMIT HANDLER -----------------
  const handleSubmit = async () => {
    if (!isLastStep || isSubmitting) return;

    // Re-check every step before sending
    for (const index of [0, 1]) {
      const stepErrors = validateStep(index);
      if (Object.keys(stepErrors).length > 0) {
        setErrors(stepErrors);
        setStep(index);
        toast.error(t("toast.error.errors"));
        return;
      }
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

      const result = await createComplaint(payload).unwrap();

      setTicketNumber(result?.ticketing_code);
      setSubmittedSectorName(sectorName);
      setShowTicketModal(true);

      toast.success(t("toast.success.submitted"));
      ResetForm();

      // Reset category to default
      // Reset the category the same way as on first load
      if (complaintCategories.length === 1) {
        setComplaintCategoryId(complaintCategories[0].category_id);
        setComplaintCategoryName(complaintCategories[0].name);
      } else {
        setComplaintCategoryId("");
        setComplaintCategoryName("");
      }
    } catch (err: any) {
      console.error("Submission error:", err);
      toast.error(
        err?.data?.message || err?.message || t("toast.error.unexpected"),
      );
    }
  };

  const reviewRows: Array<{ label: string; value: string }> = [
    {
      label: t("personalInfo.title"),
      value:
        isPersonalInfoOpen && (fullName.trim() || phoneNumber.trim() || email.trim())
          ? [fullName, phoneNumber, email].filter((v) => v.trim()).join(" · ")
          : t("review.anonymous"),
    },
    {
      label: t("personalInfo.city"),
      value:
        isPersonalInfoOpen && (city.trim() || subCity.trim() || woreda.trim())
          ? [city, subCity, woreda].filter((v) => v.trim()).join(", ")
          : "",
    },
    { label: t("details.category"), value: complaintCategoryName },
    { label: t("details.incidentDate"), value: incidentDate },
    {
      label: t("details.sector", { category: categoryLabel }),
      value: [sectorName, departmentName].filter(Boolean).join(" › "),
    },
    {
      label: t("details.personConcerned", { category: categoryLabel }),
      value: nameOfPersonConcerned,
    },
    {
      label: t("details.description", { category: categoryLabel }),
      value: complaintDescription,
    },
    {
      label: t("details.requestedAction", { category: categoryLabel }),
      value: requestedAction,
    },
  ];

  return (
    <>
      <PublicPageBanner title={t("title")} subtitle={t("subtitle")} breadcrumb={t("title")}>
        <div className="mt-6 flex flex-wrap gap-2.5 text-sm font-medium">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-golden-bright/40 bg-[#04263A]/55 px-3 py-1.5 text-golden-bright">
            <ShieldCheck className="h-4 w-4" />
            {tHome("trust.secure")}
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-golden-bright/40 bg-[#04263A]/55 px-3 py-1.5 text-golden-bright">
            <EyeOff className="h-4 w-4" />
            {tHome("trust.anonymous")}
          </span>
        </div>
      </PublicPageBanner>

      <main className="relative z-10 mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 -mt-20 pb-16">
        <div className="grid grid-cols-3 gap-6 lg:gap-8 items-start">
          <div className="col-span-3 lg:col-span-2 rounded-2xl border border-slate-200 bg-white p-5 sm:p-8 shadow-xl shadow-slate-900/10">
        {/* Step indicator */}
        <ol className="mb-6 pb-6 border-b border-slate-200 flex items-center w-full" aria-label={t("steps.label")}>
          {steps.map((label, index) => {
            const isDone = index < step;
            const isCurrent = index === step;
            return (
              <li
                key={index}
                className={`flex items-center ${index < steps.length - 1 ? "flex-1" : ""}`}
                aria-current={isCurrent ? "step" : undefined}
              >
                <div className="flex flex-col sm:flex-row items-center gap-2">
                  <span
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold transition-colors
                      ${isDone ? "bg-golden-deep text-white" : ""}
                      ${isCurrent ? "bg-golden-deep text-white ring-4 ring-golden-dark/15" : ""}
                      ${!isDone && !isCurrent ? "bg-gray-100 text-gray-500 border border-gray-200" : ""}
                    `}
                  >
                    {isDone ? <Check className="h-4 w-4" /> : index + 1}
                  </span>
                  {/* Labels don't fit side by side on phones: visible from sm, screen-reader only below */}
                  <span
                    className={`sr-only sm:not-sr-only text-sm font-medium text-center ${isCurrent ? "text-golden-deep" : "text-gray-500"}`}
                  >
                    {label}
                  </span>
                </div>
                {index < steps.length - 1 && (
                  <span
                    className={`mx-2 sm:mx-4 h-0.5 flex-1 rounded ${index < step ? "bg-golden-deep" : "bg-gray-200"}`}
                  />
                )}
              </li>
            );
          })}
        </ol>
        <p aria-hidden className="sm:hidden -mt-3 mb-6 text-sm font-semibold text-golden-deep">
          {t("steps.mobile", { current: step + 1, total: steps.length, label: steps[step] })}
        </p>

            <form className="flex-col w-full gap-8 flex" onSubmit={handleFormSubmit} noValidate>
              {/* STEP 1 — Personal information */}
              {step === 0 && (
                <section className={cardClass}>
                  <div>
                    <h2 className="block text-primary font-semibold text-lg">
                      {t("personalInfo.title")}
                      <span className="ml-2 text-sm font-normal text-gray-500">
                        {t("personalInfo.optional")}
                      </span>
                    </h2>
                    <p className="mt-1 text-sm text-gray-500">{t("personalInfo.shareHint")}</p>
                  </div>

                    <div className="mt-4 p-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 w-full">
                      <div className="w-full">
                        <label htmlFor="fullName" className="block text-sm text-golden-dark">
                          {t("personalInfo.fullName")}
                        </label>
                        <Input
                          type="text"
                          id="fullName"
                          name="fullName"
                          autoComplete="name"
                          className={inputClass}
                          placeholder={t("personalInfo.fullNamePlaceholder")}
                          value={fullName}
                          aria-invalid={!!errors.fullName}
                          onChange={(e) => {
                            setFullName(e.target.value);
                            clearError("fullName");
                          }}
                          disabled={isSubmitting}
                        />
                        <FieldError message={errors.fullName} />
                      </div>
                      <div className="w-full">
                        <label htmlFor="phoneNumber" className="block text-sm text-golden-dark">
                          {t("personalInfo.phone")}
                        </label>
                        <Input
                          type="tel"
                          id="phoneNumber"
                          name="phoneNumber"
                          autoComplete="tel"
                          inputMode="tel"
                          className={inputClass}
                          placeholder={t("personalInfo.phonePlaceholder")}
                          value={phoneNumber}
                          aria-invalid={!!errors.phoneNumber}
                          onChange={(e) => {
                            setPhoneNumber(e.target.value);
                            clearError("phoneNumber");
                          }}
                          disabled={isSubmitting}
                        />
                        <FieldError message={errors.phoneNumber} />
                      </div>
                      <div className="w-full">
                        <label htmlFor="email" className="block text-sm text-golden-dark">
                          {t("personalInfo.email")}
                        </label>
                        <Input
                          type="email"
                          id="email"
                          name="email"
                          autoComplete="email"
                          className={inputClass}
                          placeholder={t("personalInfo.emailPlaceholder")}
                          value={email}
                          aria-invalid={!!errors.email}
                          onChange={(e) => {
                            setEmail(e.target.value);
                            clearError("email");
                          }}
                          disabled={isSubmitting}
                        />
                        <FieldError message={errors.email} />
                      </div>
                      <div className="w-full">
                        <label htmlFor="city" className="block text-sm text-golden-dark">
                          {t("personalInfo.city")}
                        </label>
                        <Input
                          type="text"
                          id="city"
                          name="city"
                          className={inputClass}
                          placeholder={t("personalInfo.cityPlaceholder")}
                          value={city}
                          onChange={(e) => setCity(e.target.value)}
                          disabled={isSubmitting}
                        />
                      </div>
                      <div className="w-full">
                        <label htmlFor="subCity" className="block text-sm text-golden-dark">
                          {t("personalInfo.subCity")}
                        </label>
                        <Input
                          type="text"
                          id="subCity"
                          name="subCity"
                          className={inputClass}
                          placeholder={t("personalInfo.subCityPlaceholder")}
                          value={subCity}
                          onChange={(e) => setSubCity(e.target.value)}
                          disabled={isSubmitting}
                        />
                      </div>
                      <div className="w-full">
                        <label htmlFor="woreda" className="block text-sm text-golden-dark">
                          {t("personalInfo.woreda")}
                        </label>
                        <Input
                          type="text"
                          id="woreda"
                          name="woreda"
                          className={inputClass}
                          placeholder={t("personalInfo.woredaPlaceholder")}
                          value={woreda}
                          onChange={(e) => setWoreda(e.target.value)}
                          disabled={isSubmitting}
                        />
                      </div>
                    </div>

                  <div className="mt-6 flex items-start gap-3 rounded-lg bg-golden-dark/5 border border-golden-dark/20 p-4 text-sm text-gray-700">
                    <ShieldCheck className="h-5 w-5 shrink-0 text-golden-deep" />
                    <p>{t("personalInfo.anonymousTip")}</p>
                  </div>
                </section>
              )}

              {/* STEP 2 — Complaint details */}
              {step === 1 && (
                <section className={cardClass}>
                  <h2 className="block text-primary font-semibold text-lg mb-4">
                    {t("details.title", { category: categoryLabel })}
                  </h2>
                  <div className="gap-5 grid grid-cols-1 sm:grid-cols-2 w-full">
                    <div className="w-full">
                      <label htmlFor="category" className="block text-sm text-golden-dark">
                        {t("details.category")}
                        <span className="text-red-500"> *</span>
                      </label>
                      <Select
                        value={complaintCategoryId}
                        onValueChange={handleComplaintCategoryChange}
                        disabled={isSubmitting}
                      >
                        <SelectTrigger id="category" className="w-full h-12 mt-1" aria-invalid={!!errors.category}>
                          <SelectValue placeholder={t("details.categoryPlaceholder")} />
                        </SelectTrigger>
                        <SelectContent>
                          {complaintCategories.map((category) => (
                            <SelectItem key={category.category_id} value={category.category_id}>
                              {category.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FieldError message={errors.category} />
                    </div>
                    <div className="w-full">
                      <label htmlFor="dateOfIncident" className="block text-sm text-golden-dark">
                        {t("details.incidentDate")}
                      </label>
                      <Input
                        type="date"
                        id="dateOfIncident"
                        name="dateOfIncident"
                        max={todayDateInputValue()}
                        className="mt-1 w-full h-12 rounded-md text-base sm:text-sm border-golden-dark focus:border-none"
                        value={incidentDate}
                        onChange={(e) => setIncidentDate(e.target.value)}
                        disabled={isSubmitting}
                      />
                    </div>
                    <div className="w-full">
                      <label htmlFor="sector" className="block text-sm text-golden-dark">
                        {t("details.sector", { category: categoryLabel })}
                        <span className="text-red-500"> *</span>
                      </label>
                      <Select value={sectorId} onValueChange={handleSectorChange} disabled={isSubmitting}>
                        <SelectTrigger id="sector" className="w-full h-12 mt-1" aria-invalid={!!errors.sector}>
                          <SelectValue
                            placeholder={t("details.sectorPlaceholder", {
                              category: categoryLabel,
                            })}
                          />
                        </SelectTrigger>
                        <SelectContent>
                          {sectors.map((sector) => (
                            <SelectItem key={sector.sector_node_id} value={sector.sector_node_id}>
                              {sector.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FieldError message={errors.sector} />
                    </div>
                    <div className="w-full">
                      <label htmlFor="department" className="block text-sm text-golden-dark">
                        {t("details.department", { category: categoryLabel })}
                      </label>
                      <Select
                        value={departmentId}
                        onValueChange={handleDepartmentChange}
                        disabled={!sectorId || isSubmitting}
                      >
                        <SelectTrigger id="department" className="w-full h-12 mt-1">
                          <SelectValue
                            placeholder={t("details.departmentPlaceholder", {
                              category: categoryLabel,
                            })}
                          />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">{t("details.noDepartment")}</SelectItem>
                          {departments.map((dept: any) => (
                            <SelectItem key={dept.sector_node_id} value={dept.sector_node_id}>
                              {dept.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="w-full sm:col-span-2">
                      <label htmlFor="nameOfPersonConcerned" className="block text-sm text-golden-dark">
                        {t("details.personConcerned", { category: categoryLabel })}
                        <span className="text-gray-500"> ({t("details.optional")})</span>
                      </label>
                      <Input
                        type="text"
                        id="nameOfPersonConcerned"
                        name="nameOfPersonConcerned"
                        className={inputClass}
                        placeholder={t("details.personConcernedPlaceholder", {
                          category: categoryLabel,
                        })}
                        value={nameOfPersonConcerned}
                        aria-invalid={!!errors.personConcerned}
                        onChange={(e) => {
                          setNameOfPersonConcerned(e.target.value);
                          clearError("personConcerned");
                        }}
                        disabled={isSubmitting}
                      />
                      <FieldError message={errors.personConcerned} />
                    </div>
                    <div className="w-full sm:col-span-2">
                      <label htmlFor="complaintDescription" className="block text-sm text-golden-dark">
                        {t("details.description", { category: categoryLabel })}
                        <span className="text-red-500"> *</span>
                      </label>
                      <TextArea
                        placeholder={t("details.descriptionPlaceholder", {
                          category: categoryLabel,
                        })}
                        rows={6}
                        id="complaintDescription"
                        maxLength={DESCRIPTION_MAX}
                        className="mt-1 w-full rounded-md text-base sm:text-sm focus:border-none"
                        value={complaintDescription}
                        onChange={(val) => {
                          setComplaintDescription(val);
                          clearError("description");
                        }}
                        disabled={isSubmitting}
                      />
                      <div className="flex justify-between gap-4">
                        <FieldError message={errors.description} />
                        <span
                          className={`ml-auto mt-1 text-xs ${complaintDescription.trim().length < DESCRIPTION_MIN ? "text-gray-400" : "text-gray-500"}`}
                        >
                          {complaintDescription.length}/{DESCRIPTION_MAX}
                        </span>
                      </div>
                    </div>
                    <div className="w-full sm:col-span-2">
                      <label htmlFor="requestedAction" className="block text-sm text-golden-dark">
                        {t("details.requestedAction", { category: categoryLabel })}
                        <span className="text-gray-500"> ({t("details.optional")})</span>
                      </label>
                      <TextArea
                        placeholder={t("details.requestedActionPlaceholder", {
                          category: categoryLabel,
                        })}
                        rows={3}
                        id="requestedAction"
                        className="mt-1 w-full rounded-md text-base sm:text-sm border-golden-dark focus:border-none"
                        value={requestedAction}
                        onChange={(val) => setRequestedAction(val)}
                        disabled={isSubmitting}
                      />
                    </div>
                  </div>
                </section>
              )}

              {/* STEP 3 — Evidence & review */}
              {step === 2 && (
                <>
                  <section className={cardClass}>
                    <h2 className="block text-primary font-semibold text-lg mb-1">
                      {t("details.evidence", { category: categoryLabel })}
                      <span className="ml-2 text-sm font-normal text-gray-500">
                        ({t("details.optional")})
                      </span>
                    </h2>
                    <p className="mb-4 text-sm text-gray-500">{t("review.evidenceHint")}</p>
                    <FileUploadField
                      className=""
                      labelClass="text-sm text-start w-fit font-medium text-[#094C81]"
                      id="attachment"
                      label={t("details.evidencePlaceholder", {
                        category: categoryLabel,
                      })}
                      value={formValues.attachment_id || []}
                      onChange={(val) => handleChange("attachment_id", val)}
                      disabled={isSubmitting}
                    />
                  </section>

                  <section className={cardClass}>
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-primary font-semibold text-lg">{t("review.title")}</h2>
                      <button
                        type="button"
                        onClick={() => setStep(1)}
                        className="text-sm font-medium text-golden-dark hover:underline"
                      >
                        {t("review.edit")}
                      </button>
                    </div>
                    <dl className="divide-y divide-gray-100">
                      {reviewRows.map((row) => (
                        <div key={row.label} className="py-3 grid grid-cols-1 sm:grid-cols-3 gap-1 sm:gap-4">
                          <dt className="text-sm text-gray-500">{row.label}</dt>
                          <dd className="sm:col-span-2 text-sm text-gray-900 whitespace-pre-line break-words">
                            {row.value?.trim() ? row.value : <span className="text-gray-400">—</span>}
                          </dd>
                        </div>
                      ))}
                      <div className="py-3 grid grid-cols-1 sm:grid-cols-3 gap-1 sm:gap-4">
                        <dt className="text-sm text-gray-500">
                          {t("details.evidence", { category: categoryLabel })}
                        </dt>
                        <dd className="sm:col-span-2 text-sm text-gray-900">
                          {t("review.files", { count: formValues.attachment_id.length })}
                        </dd>
                      </div>
                    </dl>
                  </section>
                </>
              )}

              {/* Navigation */}
              <div className="flex flex-col-reverse sm:flex-row sm:justify-between gap-3">
                <div className="flex gap-3">
                  {step > 0 && (
                    <Button
                      type="button"
                      onClick={goBack}
                      disabled={isSubmitting}
                      className="flex-1 sm:flex-none bg-white border border-gray-200 min-w-32 hover:bg-gray-50 h-12 text-base text-gray-700 rounded-md"
                    >
                      <ChevronLeft className="h-4 w-4 mr-1" />
                      {t("buttons.back")}
                    </Button>
                  )}
                  <Button
                    onClick={ResetForm}
                    type="button"
                    className="flex-1 sm:flex-none bg-golden-dark20 min-w-32 hover:bg-golden-dark30 h-12 text-base text-gray-600 rounded-md disabled:opacity-70"
                    disabled={isSubmitting}
                  >
                    {t("buttons.cancel", { category: categoryLabel })}
                  </Button>
                </div>
                {isLastStep ? (
                  <Button
                    key="submit"
                    type="button"
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className="bg-golden-deep sm:min-w-52 hover:bg-golden-deep/90 h-12 text-base text-white rounded-md shadow-md disabled:opacity-70"
                  >
                    {isSubmitting
                      ? t("buttons.submitting", { category: categoryLabel })
                      : t("buttons.submit", { category: categoryLabel })}
                  </Button>
                ) : (
                  <div className="flex flex-col-reverse sm:flex-row gap-3">
                    {step === 0 && (
                      <Button
                        key="anonymous"
                        type="button"
                        onClick={continueAnonymously}
                        className="bg-white border border-primary/30 sm:min-w-48 hover:bg-slate-50 h-12 text-base text-primary rounded-md"
                      >
                        <EyeOff className="h-4 w-4 mr-2" />
                        {t("buttons.continueAnonymously")}
                      </Button>
                    )}
                    <Button
                      key="next"
                      type="button"
                      onClick={goNext}
                      className="bg-golden-deep sm:min-w-40 hover:bg-golden-deep/90 h-12 text-base text-white rounded-md shadow-md"
                    >
                      {t("buttons.next")}
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                )}
              </div>
            </form>
          </div>
          <aside className="col-span-3 lg:col-span-1 flex flex-col gap-4 lg:sticky lg:top-28">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-base font-bold text-slate-900 mb-3">{t("tips.title")}</h2>
              <ul className="list-disc pl-5 text-sm leading-relaxed text-slate-600 space-y-1.5">
                <li>{t("tips.items.0")}</li>
                <li>{t("tips.items.1")}</li>
                <li>{t("tips.items.2")}</li>
                <li>{t("tips.items.3")}</li>
                <li>{t("tips.items.4")}</li>
              </ul>
            </div>
            <div className="rounded-2xl bg-primary p-6 text-white">
              <h2 className="text-base font-bold">{tHome("quickTrack.title")}</h2>
              <p className="mt-1.5 text-sm text-slate-300">{tHome("quickTrack.subtitle")}</p>
              <Link
                href="/track-complaint"
                className="mt-3 inline-flex items-center gap-1.5 font-semibold text-golden-bright hover:underline"
              >
                {tHome("actions.track")}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </aside>
        </div>
      </main>
      <TicketSuccessModal
        open={showTicketModal}
        onClose={() => setShowTicketModal(false)}
        ticketNumber={ticketNumber}
        sectorName={submittedSectorName}
        submittedAt={todayDateInputValue()}
      />
    </>
  );
};

export default ComplaintPage;
