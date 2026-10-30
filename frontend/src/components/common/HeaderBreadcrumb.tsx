"use client";

import { useParams, usePathname } from "next/navigation";
import { ChevronRightIcon } from "lucide-react";
import { breadcrumbConfig } from "../../utils/breadcrumbConfig";
import { useBreadcrumbTitle } from "../../providers/BreadcrumbProvider";
import Link from "next/link";

// "dark" = navy admin top bar: a small trail of parent pages above the current page as a title
const HeaderBreadcrumb = ({ variant = "light" }: { variant?: "light" | "dark" } = {}) => {
    const pathname = usePathname();
    const params = useParams();
    const { dynamicBreadcrumb, dynamicTitles } = useBreadcrumbTitle();

    // ✅ extract locale from params
    const locale = params?.locale as string;

    // ✅ remove locale from pathname for matching
    const pathnameWithoutLocale =
        locale && pathname.startsWith(`/${locale}`)
            ? pathname.replace(`/${locale}`, "") || "/"
            : pathname;

    const withLocale = (path: string) =>
        path ? `/${locale}${path}` : "";

    const getBreadcrumbs = () => {
        // 1️⃣ exact match
        if (breadcrumbConfig[pathnameWithoutLocale]) {
            return breadcrumbConfig[pathnameWithoutLocale];
        }

        // 2️⃣ dynamic routes
        for (const [route, breadcrumbs] of Object.entries(breadcrumbConfig)) {
            const routePattern = route.replace(/:[^/]+/g, "[^/]+");
            const regex = new RegExp(`^${routePattern}$`);

            if (regex.test(pathnameWithoutLocale)) {
                const paramNames =
                    route.match(/:[^/]+/g)?.map(p => p.slice(1)) || [];

                return breadcrumbs.map((crumb, index) => {
                    const isLast = index === breadcrumbs.length - 1;

                    if (!crumb.path) {
                        if (isLast) {
                            return {
                                ...crumb,
                                title: dynamicBreadcrumb.title || crumb.title,
                            };
                        }
                        return crumb;
                    }

                    let resolvedPath = crumb.path;

                    paramNames.forEach(paramName => {
                        const value = params[paramName];
                        if (value) {
                            resolvedPath = resolvedPath.replace(`:${paramName}`, value as string);
                        }
                    });

                    let title = crumb.title;

                    paramNames.forEach(paramName => {
                        const value = params[paramName];
                        if (value && dynamicTitles[value as string]) {
                            if (resolvedPath.includes(`/${value}`)) {
                                title = dynamicTitles[value as string];
                            }
                        }
                    });

                    return {
                        title,
                        path: resolvedPath,
                    };
                });
            }
        }

        // 3️⃣ fallback
        const segments = pathnameWithoutLocale.split("/").filter(Boolean);
        let currentPath = "";

        return segments.map((segment, index) => {
            currentPath += `/${segment}`;
            const isLast = index === segments.length - 1;

            return {
                title:
                    isLast && dynamicBreadcrumb.title
                        ? dynamicBreadcrumb.title
                        : segment
                            .replace(/[-_]/g, " ")
                            .replace(/\b\w/g, c => c.toUpperCase()),
                path: isLast ? "" : currentPath,
            };
        });
    };

    const breadcrumbs = getBreadcrumbs();

    if (variant === "dark") {
        const parents = breadcrumbs.slice(0, -1);
        const current = breadcrumbs[breadcrumbs.length - 1];
        return (
            <div className="flex min-w-0 flex-col leading-tight">
                {parents.length > 0 && (
                    <nav aria-label="Breadcrumb" className="hidden items-center gap-1 truncate text-xs text-slate-400 sm:flex">
                        {parents.map((crumb, index) => (
                            <span key={index} className="flex items-center gap-1">
                                {crumb.path ? (
                                    <Link href={withLocale(crumb.path)} className="hover:text-white hover:underline">
                                        {crumb.title}
                                    </Link>
                                ) : (
                                    <span>{crumb.title}</span>
                                )}
                                <ChevronRightIcon aria-hidden className="h-3 w-3" />
                            </span>
                        ))}
                    </nav>
                )}
                {current && (
                    <span className="truncate text-base font-bold text-white sm:text-lg">{current.title}</span>
                )}
            </div>
        );
    }

    return (
        <nav className="flex items-center gap-1.5 text-base">
            {breadcrumbs.map((crumb, index) => (
                <div key={index} className="flex items-center gap-1.5">
                    {crumb.path ? (
                        <Link
                            href={withLocale(crumb.path)}
                            className="text-primary hover:font-medium hover:text-primary/90"
                        >
                            {crumb.title}
                        </Link>
                    ) : (
                        <span className="font-medium text-gray-800 dark:text-white/90">
                            {crumb.title}
                        </span>
                    )}
                    {index < breadcrumbs.length - 1 && (
                        <ChevronRightIcon className="h-4 w-4 text-gray-400" />
                    )}
                </div>
            ))}
        </nav>
    );
};

export default HeaderBreadcrumb;
