"use client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TextArea } from "@/components/ui/textarea";
import { useState } from "react";
import { Star } from "lucide-react";
import { useTranslations } from "next-intl";
const FeedbackPage = () => {
  const [feedbackDescription, setFeedbackDescription] = useState("");
  const t = useTranslations("Feedback");
  const [rating, setRating] = useState<number>(0);

  return (
    <main className="flex flex-col min-h-screen z-10 relative justify-center items-center border py-16">
      <div className="border px-5 md:px-10 lg:px-20 py-10 shadow-md  bg-white rounded-md">
        <div className="mb-8 border-gray-200 pb-4 ">
          <h1 className="text-2xl font-bold text-gray-900">
            {t("title")}
          </h1>
          <p className="mt-2 text-sm text-gray-600 text-break-words">
            {t("description")}
          </p>
        </div>
        <div className="">
          <div className=" ">
            <form className=" flex-col w-full gap-5 flex ">
              <div className=" md:w-3/4 gap-10">
                <div className="flex flex-col gap-2">
                  <div className="w-full  ">
                    <label
                      htmlFor="fullName"
                      className="block text-sm  text-golden-dark"
                    >
                      {t("fields.fullName")}
                      <span className="text-gray-500"> {t("fields.fullNameOptional")}</span>
                    </label>
                    <Input
                      type="text"
                      id="fullName"
                      name="fullName"
                      className="mt-1 w-full h-10   rounded-md text-sm border-golden-dark  focus:border-none"
                      placeholder={t("fields.fullNamePlaceholder")}
                      error={false}
                    />
                  </div>
                  <div className=" w-full">
                    <div className="w-full">
                      <label
                        htmlFor="feedbackDescription"
                        className="block text-sm  text-golden-dark"
                      >
                        {t("fields.feedbackDescription")}
                        <span className="text-red-500"> *</span>
                      </label>
                      <TextArea
                        placeholder={t("fields.feedbackPlaceholder")}
                        rows={6}
                        id="feedbackDescription"
                        className="mt-1 w-full rounded-md text-sm focus:border-none"
                        value={feedbackDescription}
                        onChange={(val) => setFeedbackDescription(val)}
                      />
                    </div>
                  </div>
                </div>
                <div className="w-full">
                  <label className="block text-sm text-golden-dark mb-1">
                    {t("fields.rating")}
                    <span className="text-red-500"> *</span>
                  </label>

                  <div className="flex items-center gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        className="focus:outline-none"
                      >
                        <Star
                          className={`h-7 w-7 transition-colors ${
                            star <= rating
                              ? "fill-yellow-400 text-yellow-400"
                              : "text-gray-300"
                          }`}
                        />
                      </button>
                    ))}
                    <span className="ml-2 text-sm text-gray-600">
                      {rating > 0 ? `${rating} / 5` : ""}
                    </span>
                  </div>
                  <span>{rating > 0 ? `` : t("fields.selectRating")} </span>
                </div>
              </div>

              <div className="flex justify-start gap-2 md:gap-4 mt-6 w-full flex-col md:flex-row">
                <Button className=" bg-golden-dark w-full md:w-0 md:min-w-52 hover:bg-golden-darkHover h-12  text-base text-white py-1 rounded-md shadow-md">
                  {t("actions.submit")}
                </Button>
                <Button className="bg-golden-dark20 w-full md:w-0 md:min-w-40 hover:bg-golden-dark30 h-12  text-base text-gray-600 py-2 rounded-md ">
                  {t("actions.cancel")}
                </Button>
                
              </div>
            </form>
          </div>
        </div>
      </div>
    </main>
  );
};

export default FeedbackPage;
