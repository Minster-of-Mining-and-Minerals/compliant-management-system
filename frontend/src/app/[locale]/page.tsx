import PublicHeader from "@/components/layout/public-header";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { AlertTriangle, ArrowRight, MessageSquare, Search } from "lucide-react";
import QuickTrackCard from "@/features/public-interface-management/component/QuickTrackCard";

export default function Home() {
  const t = useTranslations("HomePage");

  const services = [
    {
      key: "complaint",
      href: "/complaint",
      icon: AlertTriangle,
      featured: true,
    },
    {
      key: "track",
      href: "/track-complaint",
      icon: Search,
      featured: false,
    },
    {
      key: "feedback",
      href: "/feedback",
      icon: MessageSquare,
      featured: false,
    },
  ] as const;

  const steps = ["submit", "review", "resolve"] as const;

  return (
    <div className="min-h-screen flex flex-col bg-white font-sans">
      <PublicHeader variant="dark" />

      {/* Hero — navy with topographic contour background */}
      <section className="relative bg-primary bg-[url('/images/hero-bg-contours.svg')] bg-cover bg-center text-white">
        <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-10 px-4 pt-32 pb-20 sm:px-6 lg:grid-cols-12 lg:gap-14 lg:px-8 lg:pt-44 lg:pb-28">
          {/* Copy */}
          <div className="lg:col-span-7 text-center lg:text-left">
            <span className="inline-flex max-w-full items-center gap-2 rounded-full border border-golden-bright/50 bg-[#04263A]/50 px-3 py-1.5 text-xs font-medium text-golden-bright sm:px-4 sm:text-sm">
              <span className="h-2 w-2 shrink-0 rounded-full bg-golden-bright" />
              {t("badge")}
            </span>

            {/* Fluid size: 30px on small phones, grows with the screen up to ~58px on desktop */}
            <h1 className="mt-6 text-[length:clamp(1.875rem,7vw,3.6rem)] font-bold leading-[1.12] tracking-tight">
              {t("heading.line1")}
              <span className="mt-2 block text-golden-bright">{t("heading.line2")}</span>
            </h1>

            <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-slate-200 sm:text-lg lg:mx-0">
              {t("description")}
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center lg:justify-start">
              <Link
                href="/complaint"
                className="group inline-flex items-center justify-center gap-2 rounded-xl bg-golden-bright px-7 py-4 text-base font-bold text-primary transition-colors hover:bg-golden-bright/90 focus:outline-none focus:ring-2 focus:ring-golden-bright focus:ring-offset-2 focus:ring-offset-primary"
              >
                {t("actions.complaint")}
                <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-0.5" />
              </Link>
              <Link
                href="/feedback"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/45 bg-[#04263A]/35 px-7 py-4 text-base font-semibold text-white transition-colors hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-primary"
              >
                {t("actions.feedback")}
              </Link>
            </div>
          </div>

          {/* Quick tracking */}
          <div className="lg:col-span-5">
            <div className="mx-auto max-w-md lg:max-w-none">
              <QuickTrackCard />
            </div>
          </div>
        </div>
      </section>

      {/* Services */}
      <section className="border-b border-slate-200 bg-slate-50">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8 lg:py-16">
          <h2 className="text-[length:clamp(1.5rem,4.5vw,1.875rem)] font-bold text-slate-900">{t("services.title")}</h2>
          <p className="mt-2 text-slate-600">{t("services.subtitle")}</p>

          <div className="mt-8 grid grid-cols-1 gap-5 md:grid-cols-3 md:gap-6">
            {services.map(({ key, href, icon: Icon, featured }) => (
              <Link
                key={key}
                href={href}
                className={`group flex min-h-[13.5rem] flex-col gap-3.5 rounded-2xl p-7 transition-shadow hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2
                  ${featured
                    ? "bg-primary text-white focus:ring-primary"
                    : "border border-slate-200 bg-white text-slate-900 focus:ring-primary"
                  }`}
              >
                <span
                  className={`flex h-12 w-12 items-center justify-center rounded-xl ${featured ? "bg-white/10 text-golden-bright" : "bg-golden-dark/10 text-golden-deep"}`}
                >
                  <Icon className="h-6 w-6" />
                </span>
                <span className="text-xl font-bold">{t(`services.${key}.title`)}</span>
                <span className={`flex-1 text-[0.9375rem] leading-relaxed ${featured ? "text-slate-300" : "text-slate-600"}`}>
                  {t(`services.${key}.text`)}
                </span>
                <span
                  className={`inline-flex items-center gap-1.5 font-semibold ${featured ? "text-golden-bright" : "text-primary"}`}
                >
                  {t(`services.${key}.cta`)}
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="bg-white">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8 lg:py-16">
          <h2 className="text-center text-2xl font-bold text-slate-900">{t("howItWorks.title")}</h2>
          <ol className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-3">
            {steps.map((step, index) => (
              <li key={step} className="flex items-start gap-4">
                <span
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full font-bold text-white ${index === steps.length - 1 ? "bg-golden-deep" : "bg-primary"}`}
                >
                  {index + 1}
                </span>
                <div>
                  <h3 className="font-semibold text-slate-900">{t(`howItWorks.steps.${step}.title`)}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-slate-600">{t(`howItWorks.steps.${step}.text`)}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto bg-primary text-white">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-4 py-6 text-sm sm:flex-row sm:px-6 lg:px-8">
          <p className="text-white/80">
            © {new Date().getFullYear()} {t("footer.rights")}
          </p>
          <nav className="flex flex-wrap justify-center gap-5 text-white/80">
            <Link href="/complaint" className="hover:text-white">{t("actions.complaint")}</Link>
            <Link href="/track-complaint" className="hover:text-white">{t("actions.track")}</Link>
            <Link href="/feedback" className="hover:text-white">{t("actions.feedback")}</Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
