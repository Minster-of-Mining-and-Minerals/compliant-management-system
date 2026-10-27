"use client";

import { useState } from "react";
import { Search } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";

const QuickTrackCard = () => {
  const t = useTranslations("HomePage.quickTrack");
  const router = useRouter();
  const [ticket, setTicket] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const value = ticket.trim();
    if (!value) {
      setError(t("required"));
      return;
    }
    router.push(`/track-complaint?ticketNumber=${encodeURIComponent(value)}`);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full rounded-2xl bg-white p-6 sm:p-8 text-slate-900 shadow-2xl shadow-black/30"
    >
      <div className="flex items-center gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-golden-dark/10 text-golden-deep">
          <Search className="h-5 w-5" />
        </span>
        <div>
          <h2 className="text-lg font-bold">{t("title")}</h2>
          <p className="text-sm text-slate-600">{t("subtitle")}</p>
        </div>
      </div>

      <label htmlFor="quick-track" className="mt-6 block text-sm font-medium text-slate-700">
        {t("label")}
      </label>
      <input
        id="quick-track"
        value={ticket}
        onChange={(e) => {
          setTicket(e.target.value);
          setError("");
        }}
        placeholder="TICK-XXXX"
        autoComplete="off"
        aria-invalid={!!error}
        aria-describedby={error ? "quick-track-error" : undefined}
        className="mt-2 h-12 w-full rounded-lg border border-slate-300 bg-white px-4 font-mono text-base tracking-wide text-slate-900 placeholder:text-slate-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 aria-[invalid=true]:border-red-500"
      />
      {error && (
        <p id="quick-track-error" role="alert" className="mt-2 text-sm text-red-600">
          {error}
        </p>
      )}
      <button
        type="submit"
        className="mt-3 inline-flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-primary font-semibold text-white transition-colors hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
      >
        {t("button")}
      </button>
      <p className="mt-3 text-xs text-slate-600">{t("hint")}</p>
    </form>
  );
};

export default QuickTrackCard;
