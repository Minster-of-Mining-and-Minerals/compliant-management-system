"use client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TextArea } from "@/components/ui/textarea";
import { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowRight, Star } from "lucide-react";
import PublicPageBanner from "@/components/layout/PublicPageBanner";
import { Link } from "@/i18n/navigation";
import { useLocale, useTranslations } from "next-intl";
import { localizedName } from "@/utils/localizedName";
import { useGetSectorNodesQuery } from "@/redux/api/sectorNodeApi";
import { useCreateFeedbackMutation } from "@/redux/api/feedbackApi";
import { toast } from "sonner";

const FeedbackPage = () => {
  const [sectorId, setSectorId] = useState("");
  const [fullName, setFullName] = useState("");
  const [feedbackDescription, setFeedbackDescription] = useState("");
  const [rating, setRating] = useState<number>(0);
  const t = useTranslations("Feedback");
  const locale = useLocale();

  // RTK Queries - Fix: Extract data from response
  const { data: sectorNodesResponse = {}, isLoading: sectorsLoading, isError: sectorsError } = useGetSectorNodesQuery({ limit: 1000 }); // paginated (default 10) — the picker needs every sector
  const sectorNodesData = sectorNodesResponse?.data || [];

  const [createFeedback, { isLoading: isSubmitting }] = useCreateFeedbackMutation();

  // Filter sectors - Fix: Use sectorNodesData instead of data
  const root = sectorNodesData.filter((item) => item.parent_id === null);
  const sectors = root.flatMap((rootItem) => rootItem.children || []);

  const handleSectorChange = (value: string) => {
    setSectorId(value);
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!feedbackDescription.trim()) {
      toast.error(t("validation.feedbackRequired"));
      return;
    }

    if (rating === 0) {
      toast.error(t("validation.ratingRequired"));
      return;
    }

    try {
      const feedbackData = {
        sector_node_id: sectorId || null,
        full_name: fullName.trim() || "Anonymous",
        feedback: feedbackDescription.trim(),
        rating,
      };

      const result = await createFeedback(feedbackData).unwrap();
      toast.success(t("toast.success.submitted"));

      // Reset form
      setSectorId("");
      setFullName("");
      setFeedbackDescription("");
      setRating(0);
    } catch (error: any) {
      console.error("Error submitting feedback:", error);

      // Handle specific error messages
      if (error.data?.message) {
        toast.error(error.data.message);
      } else if (error.message) {
        toast.error(error.message);
      } else {
        toast.error(t("toast.error.errors"));
      }
    }
  };

  const handleCancel = () => {
    // Reset form
    setSectorId("");
    setFullName("");
    setFeedbackDescription("");
    setRating(0);
  };

  return (
    <>
    <PublicPageBanner title={t("title")} subtitle={t("description")} breadcrumb={t("title")} />

    <main className="relative z-10 mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 -mt-20 pb-16">
      <div className="grid grid-cols-3 gap-6 lg:gap-8 items-start">
        <div className="col-span-3 lg:col-span-2 rounded-2xl border border-slate-200 bg-white p-5 sm:p-8 shadow-xl shadow-slate-900/10">
            <form className="flex-col w-full gap-6 flex" onSubmit={handleSubmit}>
              <div className="w-full flex flex-col gap-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="w-full">
                    <label
                      htmlFor="feedbackSector"
                      className="block text-sm font-medium text-slate-700"
                    >
                      {t("fields.sector")}
                      <span className="text-gray-500"> {t("fields.sectorOptional")}</span>
                    </label>
                    <Select
                      value={sectorId}
                      onValueChange={handleSectorChange}
                      disabled={sectorsLoading || isSubmitting}
                    >
                      <SelectTrigger id="feedbackSector" className="w-full h-12 mt-1">
                        <SelectValue placeholder={
                          sectorsLoading ? t("loading.sectors") : t("fields.sectorPlaceholder")
                        } />
                      </SelectTrigger>
                      <SelectContent>
                        {sectorsError ? (
                          <SelectItem value="error" disabled>
                            {t("error.sectors")}
                          </SelectItem>
                        ) : sectors.length === 0 ? (
                          <SelectItem value="empty" disabled>
                            {t("fields.noSectors")}
                          </SelectItem>
                        ) : (
                          sectors.map((sector) => (
                            <SelectItem
                              key={sector.sector_node_id}
                              value={sector.sector_node_id}
                            >
                              {localizedName(sector, locale)}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="w-full">
                    <label
                      htmlFor="fullName"
                      className="block text-sm font-medium text-slate-700"
                    >
                      {t("fields.fullName")}
                      <span className="text-gray-500"> {t("fields.fullNameOptional")}</span>
                    </label>
                    <Input
                      type="text"
                      id="fullName"
                      name="fullName"
                      autoComplete="name"
                      className="mt-1 w-full h-12 rounded-md text-base sm:text-sm"
                      placeholder={t("fields.fullNamePlaceholder")}
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      disabled={isSubmitting}
                    />
                  </div>
                </div>
                <div className="w-full">
                  <label
                    htmlFor="feedbackDescription"
                    className="block text-sm font-medium text-slate-700"
                  >
                    {t("fields.feedbackDescription")}
                    <span className="text-red-500"> *</span>
                  </label>
                  <TextArea
                    placeholder={t("fields.feedbackPlaceholder")}
                    rows={6}
                    id="feedbackDescription"
                    className="mt-1 w-full rounded-md text-base sm:text-sm focus:border-none"
                    value={feedbackDescription}
                    onChange={(val) => setFeedbackDescription(val)}
                    disabled={isSubmitting}
                  />
                </div>
                <fieldset className="w-full">
                  <legend className="block text-sm font-medium text-slate-700 mb-2">
                    {t("fields.rating")}
                    <span className="text-red-500"> *</span>
                  </legend>

                  <div className="flex flex-wrap items-center gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        aria-label={`${star} / 5`}
                        aria-pressed={star <= rating}
                        className={`flex h-12 w-12 items-center justify-center rounded-xl border transition-colors focus:outline-none focus:ring-2 focus:ring-golden-deep disabled:opacity-50
                          ${star <= rating ? "border-golden-bright bg-golden-dark/10" : "border-slate-300 bg-white hover:bg-slate-50"}`}
                        disabled={isSubmitting}
                      >
                        <Star
                          className={`h-6 w-6 transition-colors ${star <= rating
                            ? "fill-golden-deep text-golden-deep"
                            : "text-slate-300"
                            }`}
                        />
                      </button>
                    ))}
                    <span className="ml-2 text-sm font-semibold text-golden-deep">
                      {rating > 0 ? `${rating} / 5` : ""}
                    </span>
                  </div>
                  <span className="mt-1 block text-sm text-gray-500">
                    {rating === 0 ? t("fields.selectRating") : ""}
                  </span>
                </fieldset>
              </div>

              <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 pt-6 border-t border-slate-200">
                <Button
                  type="button"
                  onClick={handleCancel}
                  className="bg-white border border-slate-300 sm:min-w-32 hover:bg-slate-50 h-12 text-base text-slate-700 rounded-md disabled:opacity-70"
                  disabled={isSubmitting}
                  variant="outline"
                >
                  {t("actions.cancel")}
                </Button>
                <Button
                  type="submit"
                  className="bg-golden-deep sm:min-w-52 hover:bg-golden-deep/90 h-12 text-base text-white rounded-md shadow-md disabled:opacity-70"
                  disabled={isSubmitting || !feedbackDescription.trim() || rating === 0}
                >
                  {isSubmitting ? t("actions.submitting") : t("actions.submit")}
                </Button>
              </div>
            </form>
        </div>

        <aside className="col-span-3 lg:col-span-1 flex flex-col gap-4 lg:sticky lg:top-28">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-base font-bold text-slate-900">{t("aside.title")}</h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">{t("aside.text")}</p>
            <Link
              href="/complaint"
              className="mt-3 inline-flex items-center gap-1.5 font-semibold text-primary hover:underline"
            >
              {t("aside.cta")}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </aside>
      </div>
    </main>
    </>
  );
};

export default FeedbackPage;