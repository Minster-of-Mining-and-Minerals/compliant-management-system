"use client";

import React, { useMemo, useState } from "react";
import { Bell, AlertCircle, User, Shield } from "lucide-react";
import clsx from "clsx";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

/* =========================
   API IMPORTS (COMMENTED)
========================= */
import {
    useGetMyNotificationsQuery,
    useMarkAsReadMutation,
    useMarkAllAsReadMutation,
} from "@/redux/api/notificationApi";
import { Notification } from "@/redux/types/notification";

/* =========================
   CATEGORY CONFIG
========================= */

export const CATEGORY_MAP = {
    COMPLAINT: [
        "COMPLAINT_SUBMITTED",
        "COMPLAINT_ASSIGNED",
        "COMPLAINT_RESOLVED",
        "COMPLAINT_ASSIGNMENT_UPDATE",
        "SUBMISSION_SUCCESS",
    ],
    FEEDBACK: ["FEEDBACK_SUBMITTED"],
    SYSTEM: ["SYSTEM_ALERT", "BROADCAST_MESSAGE"],
} as const;

type Category = keyof typeof CATEGORY_MAP;
type StatusFilter = "ALL" | "UNREAD" | "READ";

const CATEGORY_ICONS: Record<Category, React.ReactNode> = {
    COMPLAINT: <AlertCircle className="h-4 w-4" />,
    FEEDBACK: <User className="h-4 w-4" />,
    SYSTEM: <Shield className="h-4 w-4" />,
};

/* =========================
   HELPERS
======================== */

const getIcon = (type: string) => {
    if (CATEGORY_MAP.COMPLAINT.includes(type as any)) {
        return <AlertCircle className="h-5 w-5 text-[#073954]" />;
    }

    if (CATEGORY_MAP.FEEDBACK.includes(type as any)) {
        return <User className="h-5 w-5 text-[#073954]" />;
    }

    return <Shield className="h-5 w-5 text-[#073954]" />;
};

const formatDateLabel = (date: Date) => {
    return date.toLocaleDateString("en-GB");
};

/* =========================
   COMPONENT
========================= */
import { usePermissions } from "@/hooks/usePermissions";

/* =========================
   COMPONENT
========================= */
const Notifications = () => {
    const router = useRouter();
    const { can } = usePermissions();

    const [activeCategory, setActiveCategory] = useState<Category>("COMPLAINT");
    const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");

    // Queries & Mutations
    const { data: notifications = [], isLoading } = useGetMyNotificationsQuery(undefined, {
        pollingInterval: 60000, // Refresh every minute
    });
    const [markAsRead] = useMarkAsReadMutation();
    const [markAllAsRead] = useMarkAllAsReadMutation();

    /* =========================
       HANDLERS
    ========================= */
    const handleMarkAllAsRead = async () => {
        try {
            await markAllAsRead().unwrap();
        } catch (err) {
            console.error("Failed to mark all as read:", err);
        }
    };

    const handleNotificationClick = async (notification: Notification) => {
        if (!notification.is_read) {
            await markAsRead(notification.notification_id).unwrap();
        }

        // Navigation logic based on role and entity
        if (notification.related_entity_type === "complaint" && notification.related_entity_id) {
            const baseUrl = can("COMPLAINT:READ_ALL") ? "/compliants" : "/my-complaints";
            router.push(`${baseUrl}/${notification.related_entity_id}`);
        } else if (notification.related_entity_type === "feedback") {
            router.push("/feedbacks");
        }
    };

    const matchesCategory = (category: Category, type: string): boolean => {
        return (CATEGORY_MAP[category] as readonly string[]).includes(type);
    };

    const filteredNotifications = useMemo(() => {
        return notifications
            .filter((n) => {
                const categoryMatch = matchesCategory(activeCategory, n.type);

                const statusMatch =
                    statusFilter === "ALL" ||
                    (statusFilter === "UNREAD" && !n.is_read) ||
                    (statusFilter === "READ" && n.is_read);

                return categoryMatch && statusMatch;
            })
            .sort(
                (a, b) =>
                    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
            );
    }, [notifications, activeCategory, statusFilter]);

    return (
        <>
            <div className="bg-white p-6 pb-1 rounded-2xl shadow-sm mb-6 border border-gray-100">
                <h1 className="text-2xl font-bold pb-4 text-gray-900 flex items-center gap-3 mb-5">
                    <div className="p-2 bg-blue-50 rounded-xl">
                        <Bell className="h-6 w-6 text-blue-600" />
                    </div>
                    Notifications
                </h1>
            </div>

            <div className="p-8 pt-4 bg-white rounded-2xl shadow-sm border border-gray-100 min-h-[calc(100vh-12rem)]">
                <div className="flex items-center py-4 justify-between flex-wrap gap-6 mb-8 border-b border-gray-50 pb-6">
                    <div className="flex gap-2 p-1.5 bg-gray-50 rounded-2xl border border-gray-100">
                        {(Object.keys(CATEGORY_MAP) as Category[]).map((category) => (
                            <Button
                                key={category}
                                onClick={() => setActiveCategory(category)}
                                className={clsx(
                                    "px-6 py-2 text-sm font-semibold rounded-xl transition-all duration-200 shadow-none",
                                    activeCategory === category
                                        ? "bg-white text-blue-600 shadow-sm border border-gray-200"
                                        : "bg-transparent text-gray-500 hover:text-gray-900 border-transparent"
                                )}
                            >
                                <span className="flex items-center gap-2">
                                    {CATEGORY_ICONS[category]}
                                    {category.charAt(0) + category.slice(1).toLowerCase()}
                                </span>
                            </Button>
                        ))}
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-gray-500">Filter:</span>
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
                                className="bg-white border border-gray-200 rounded-xl px-4 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all cursor-pointer"
                            >
                                <option value="ALL">All Alerts</option>
                                <option value="UNREAD">Unread Only</option>
                                <option value="READ">Read Already</option>
                            </select>
                        </div>

                        <button
                            onClick={handleMarkAllAsRead}
                            className="text-sm px-5 py-2 rounded-xl bg-gray-900 hover:bg-gray-800 text-white font-semibold transition-all shadow-lg shadow-gray-200 active:scale-95"
                        >
                            Mark all as read
                        </button>
                    </div>
                </div>

                <div className="max-w-4xl mx-auto space-y-4">
                    {isLoading ? (
                        <div className="text-center text-gray-400 py-20 flex flex-col items-center gap-4">
                            <div className="h-8 w-8 border-4 border-blue-500 border-t-transparent animate-spin rounded-full"></div>
                            <p className="font-medium">Loading your notifications...</p>
                        </div>
                    ) : filteredNotifications.length === 0 ? (
                        <div className="text-center text-gray-400 py-24 flex flex-col items-center gap-4">
                            <div className="p-6 bg-gray-50 rounded-full">
                                <Bell className="h-12 w-12 opacity-20" />
                            </div>
                            <p className="text-lg font-medium text-gray-500">No notifications found</p>
                            <p className="text-sm">We'll let you know when something happens!</p>
                        </div>
                    ) : (
                        filteredNotifications.map((n, index) => {
                            const currentDate = formatDateLabel(new Date(n.created_at));
                            const prevDate =
                                index > 0
                                    ? formatDateLabel(
                                        new Date(filteredNotifications[index - 1].created_at)
                                    )
                                    : null;

                            const showDateSeparator = currentDate !== prevDate;

                            return (
                                <React.Fragment key={n.notification_id}>
                                    {showDateSeparator && (
                                        <div className="flex items-center gap-6 my-8 first:mt-2">
                                            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent" />
                                            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                                                {currentDate}
                                            </span>
                                            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent" />
                                        </div>
                                    )}

                                    <div
                                        onClick={() => handleNotificationClick(n)}
                                        className={clsx(
                                            "group flex gap-5 p-5 rounded-2xl cursor-pointer transition-all duration-200 border",
                                            n.is_read
                                                ? "bg-white border-gray-100 opacity-80"
                                                : "bg-gradient-to-br from-blue-50/50 to-white border-blue-100 shadow-sm hover:shadow-md"
                                        )}
                                    >
                                        <div className={clsx(
                                            "mt-1 p-3 rounded-xl transition-colors",
                                            n.is_read ? "bg-gray-100 text-gray-400" : "bg-blue-100 text-blue-600"
                                        )}>
                                            {getIcon(n.type)}
                                        </div>

                                        <div className="flex-1">
                                            <div className="flex justify-between items-start mb-2">
                                                <h3 className={clsx(
                                                    "text-base transition-colors",
                                                    n.is_read ? "font-semibold text-gray-700" : "font-bold text-gray-900 group-hover:text-blue-600"
                                                )}>
                                                    {n.title}
                                                </h3>
                                                {!n.is_read && (
                                                    <span className="bg-blue-500 text-white text-[10px] px-2 py-0.5 rounded-full font-bold">NEW</span>
                                                )}
                                            </div>

                                            <p className="text-sm text-gray-600 mb-3 leading-relaxed">
                                                {n.complaint?.ticketing_code ? (
                                                    <>
                                                        {n.message.split(n.complaint.ticketing_code)[0]}
                                                        <span className="text-blue-600 font-bold bg-blue-50 px-1.5 py-0.5 rounded-lg mx-0.5">
                                                            {n.complaint.ticketing_code}
                                                        </span>
                                                        {n.message.split(n.complaint.ticketing_code)[1]}
                                                    </>
                                                ) : (
                                                    n.message
                                                )}
                                            </p>

                                            <div className="flex items-center gap-3 text-xs text-gray-400 font-medium">
                                                <span className="flex items-center gap-1">
                                                    <Bell className="h-3 w-3" />
                                                    {n.type.replace(/_/g, " ")}
                                                </span>
                                                <span>•</span>
                                                <span>{new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                            </div>
                                        </div>
                                    </div>
                                </React.Fragment>
                            );
                        })
                    )}
                </div>
            </div>
        </>
    );
};

export default Notifications;
