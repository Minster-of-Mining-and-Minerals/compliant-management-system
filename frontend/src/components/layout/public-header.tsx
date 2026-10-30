"use client";

import React, { useEffect, useState } from "react";
import { Link } from "@/i18n/navigation";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  AlertTriangle,
  Home,
  Menu,
  MessageSquare,
  Search,
  X,
} from "lucide-react";
import LocaleSwitcher from "@/components/common/LanguageSwitcher/LocaleSwitcher";
import { useTranslations } from "next-intl";

interface PublicHeaderProps {
  /** "dark" sits on the navy home hero; "light" is the default for inner pages */
  variant?: "light" | "dark";
}

const PublicHeader = ({ variant = "light" }: PublicHeaderProps) => {
  const pathname = usePathname(); // e.g., "/en/complaint"
  const t = useTranslations("PublicHeader");
  const [menuOpen, setMenuOpen] = useState(false);
  const isDark = variant === "dark";

  // Close the mobile menu whenever the route changes
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  // Helper to remove locale prefix from pathname
  const normalizePathname = (path: string) => {
    const segments = path.split("/").filter(Boolean); // remove empty
    if (segments[0] === "en" || segments[0] === "am") {
      segments.shift(); // remove locale
    }
    return "/" + segments.join("/");
  };

  const normalizedPath = normalizePathname(pathname);

  const tabs = [
    {
      label: t("tabs.home"),
      href: "/",
      icon: Home,
    },
    {
      label: t("tabs.complaint"),
      href: "/complaint",
      icon: AlertTriangle,
    },
    {
      label: t("tabs.feedback"),
      href: "/feedback",
      icon: MessageSquare,
    },
    {
      label: t("tabs.trackComplaint"),
      href: "/track-complaint",
      icon: Search,
    },
  ];

  return (
    <header
      className={`w-full z-30 fixed top-0 left-0 ${isDark
        ? "bg-primary text-white border-b border-white/10"
        : "bg-white/90 backdrop-blur-md shadow-md border-b border-gray-100"
        }`}
    >

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between gap-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 min-w-0">
          <span
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${isDark ? "bg-white" : ""}`}
          >
            <Image
              src="/logo-only.png"
              alt="Logo"
              width={40}
              height={40}
              className={`object-contain ${isDark ? "h-8 w-8" : "h-10 w-10"}`}
            />
          </span>
          <div className="min-w-0 leading-tight">
            <p
              className={`text-sm sm:text-[0.9375rem] font-bold tracking-wide truncate ${isDark ? "text-white" : "text-golden-deep"}`}
            >
              የማዕድን ሚኒስቴር
            </p>
            <p
              className={`text-xs sm:text-[0.8125rem] truncate ${isDark ? "text-slate-300" : "font-semibold text-golden-deep"}`}
            >
              {t("logoLine1")}
            </p>
          </div>
        </Link>

        {/* Desktop navigation */}
        <div className="hidden lg:flex items-center gap-6">
          <nav className="flex items-center gap-1">
            {tabs.map((tab) => {
              const isActive = normalizedPath === tab.href;

              return (
                <Link
                  key={tab.href}
                  href={tab.href}
                  aria-current={isActive ? "page" : undefined}
                  className={`relative px-3 py-2 text-sm font-semibold transition-colors
                    ${isDark
                      ? isActive ? "text-white" : "text-slate-300 hover:text-white"
                      : isActive ? "text-golden-deep" : "text-gray-500 hover:text-golden-deep"
                    }
                  `}
                >
                  <span>{tab.label}</span>

                  {/* Active underline */}
                  <span
                    className={`absolute bottom-0 left-3 right-3 h-[2px] transition-transform duration-300
                      ${isDark ? "bg-golden-bright" : "bg-golden-deep"}
                      ${isActive ? "scale-x-100" : "scale-x-0"}
                    `}
                  />
                </Link>
              );
            })}
          </nav>

          <LocaleSwitcher />

          <Link
            href="/login"
            className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition-colors shadow-sm
              focus:outline-none focus:ring-2 focus:ring-offset-2
              ${isDark
                ? "bg-golden-bright text-primary hover:bg-golden-bright/90 focus:ring-golden-bright focus:ring-offset-primary"
                : "bg-golden-deep text-white hover:bg-golden-deep/90 focus:ring-golden-deep"
              }`}
          >
            {t("login")}
          </Link>
        </div>

        {/* Mobile controls */}
        <div className="flex lg:hidden items-center gap-2">
          <LocaleSwitcher />
          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            aria-expanded={menuOpen}
            aria-controls="public-mobile-menu"
            aria-label={menuOpen ? t("closeMenu") : t("openMenu")}
            className={`p-2.5 rounded-lg focus:outline-none focus:ring-2 ${isDark
              ? "text-white hover:bg-white/10 focus:ring-golden-bright"
              : "text-golden-deep hover:bg-gray-100 focus:ring-primary"
              }`}
          >
            {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <nav
          id="public-mobile-menu"
          className={`lg:hidden px-4 pb-4 pt-2 shadow-lg ${isDark
            ? "border-t border-white/10 bg-primary bg-[url('/images/hero-bg-contours.svg')] bg-cover bg-center"
            : "border-t border-gray-100 bg-white"
            }`}
        >
          <ul className="flex flex-col gap-1">
            {tabs.map((tab) => {
              const isActive = normalizedPath === tab.href;
              const Icon = tab.icon;

              return (
                <li key={tab.href}>
                  <Link
                    href={tab.href}
                    aria-current={isActive ? "page" : undefined}
                    className={`flex items-center gap-3 px-3 py-3 rounded-lg text-base font-semibold transition-colors
                      ${isDark
                        ? isActive
                          ? "bg-white/10 text-golden-bright"
                          : "text-slate-200 hover:bg-white/10 hover:text-white"
                        : isActive
                          ? "bg-golden-dark/10 text-golden-deep"
                          : "text-gray-600 hover:bg-gray-50 hover:text-golden-deep"
                      }
                    `}
                  >
                    <Icon className="w-5 h-5" />
                    {tab.label}
                  </Link>
                </li>
              );
            })}
          </ul>
          <Link
            href="/login"
            className={`mt-3 block w-full text-center px-6 py-3 rounded-lg text-base font-semibold transition-colors ${isDark
              ? "bg-golden-bright text-primary hover:bg-golden-bright/90"
              : "bg-golden-deep text-white hover:bg-golden-deep/90"
              }`}
          >
            {t("login")}
          </Link>
        </nav>
      )}
    </header>
  );
};

export default PublicHeader;
