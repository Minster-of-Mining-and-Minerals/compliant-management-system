import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";

interface PublicPageBannerProps {
  title: string;
  subtitle?: string;
  /** Current page name shown after "Home /" */
  breadcrumb: string;
  /** Optional extra content: badges, a search form… */
  children?: React.ReactNode;
  align?: "left" | "center";
}

/**
 * Navy banner with the topographic contour background used at the top of the
 * public complaint, feedback and tracking pages. Page content placed right
 * after it should use a negative top margin (e.g. -mt-20) to overlap it.
 */
const PublicPageBanner = ({
  title,
  subtitle,
  breadcrumb,
  children,
  align = "left",
}: PublicPageBannerProps) => {
  const t = useTranslations("PublicHeader");
  const centered = align === "center";

  return (
    <section className="bg-primary bg-[url('/images/hero-bg-contours.svg')] bg-cover bg-center text-white">
      <div
        className={`mx-auto max-w-7xl px-4 pt-28 pb-28 sm:px-6 lg:px-8 lg:pt-32 lg:pb-32 ${centered ? "text-center" : ""}`}
      >
        <nav aria-label="Breadcrumb" className="text-sm text-slate-300">
          <ol className={`flex flex-wrap items-center gap-1.5 ${centered ? "justify-center" : ""}`}>
            <li>
              <Link href="/" className="hover:text-white hover:underline">
                {t("tabs.home")}
              </Link>
            </li>
            <li aria-hidden>/</li>
            <li aria-current="page" className="text-white">
              {breadcrumb}
            </li>
          </ol>
        </nav>
        {/* Fluid size: 28px on small phones up to ~42px on desktop */}
        <h1 className="mt-4 text-[length:clamp(1.75rem,5.5vw,2.6rem)] font-bold leading-tight">{title}</h1>
        {subtitle && (
          <p
            className={`mt-3 max-w-2xl text-base leading-relaxed text-slate-200 sm:text-lg ${centered ? "mx-auto" : ""}`}
          >
            {subtitle}
          </p>
        )}
        {children}
      </div>
    </section>
  );
};

export default PublicPageBanner;
