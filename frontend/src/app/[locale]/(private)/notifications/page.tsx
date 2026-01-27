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
// import {
//   useGetNotificationsByUserIdQuery,
//   useMarkAllNotificationsAsReadMutation,
//   useMarkNotificationAsReadMutation,
// } from "@/redux/services/notificationApi";
// import { useAuth } from "@/contexts/AuthContext";


interface IssueRef {
    issue_id: string;
    ticket_number: string;
}

type NotificationType =
    | (typeof CATEGORY_MAP.ISSUE)[number]
    | (typeof CATEGORY_MAP.USER)[number]
    | (typeof CATEGORY_MAP.SYSTEM)[number];

interface Notification {
    notification_id: string;
    type: NotificationType;
    title: string;
    message: string;
    is_read: boolean;
    created_at: string;
    issue?: IssueRef;
}

/* =========================
   CATEGORY CONFIG
========================= */


export const CATEGORY_MAP = {
    ISSUE: [
        "ISSUE_CREATED",
        "ISSUE_ASSIGNED",
        "ISSUE_UNASSIGNED",
        "ISSUE_RESOLVED",
        "ISSUE_CONFIRMED",
        "ISSUE_REJECTED",
        "ISSUE_REOPENED",
        "ISSUE_ESCALATED",
        "ISSUE_COMMENTED",
    ],
    USER: [
        "PASSWORD_UPDATED",
        "LOGIN_ALERT",
        "USER_DEACTIVATED",
        "USER_REACTIVATED",
        "PROFILE_UPDATED",
    ],
    SYSTEM: ["SYSTEM_ALERT", "BROADCAST_MESSAGE"],
} as const;

type Category = keyof typeof CATEGORY_MAP;
type StatusFilter = "ALL" | "UNREAD" | "READ";

const CATEGORY_ICONS: Record<Category, React.ReactNode> = {
    ISSUE: <AlertCircle className="h-4 w-4" />,
    USER: <User className="h-4 w-4" />,
    SYSTEM: <Shield className="h-4 w-4" />,
};

/* =========================
   MOCK DATA
========================= */
const MOCK_NOTIFICATIONS: Notification[] = [
    {
        notification_id: "1",
        type: "ISSUE_ASSIGNED",
        title: "Issue Assigned",
        message: "You have been assigned to ticket INC-1023",
        is_read: false,
        created_at: new Date().toISOString(),
        issue: {
            issue_id: "issue-1",
            ticket_number: "INC-1023",
        },
    },
    {
        notification_id: "2",
        type: "PASSWORD_UPDATED",
        title: "Password Updated",
        message: "Your password was successfully updated",
        is_read: true,
        created_at: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
    },
    {
        notification_id: "3",
        type: "SYSTEM_ALERT",
        title: "System Maintenance",
        message: "System maintenance scheduled for tonight",
        is_read: false,
        created_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    },
];

/* =========================
   HELPERS
========================= */
const isUserNotification = (
    type: NotificationType
): type is (typeof CATEGORY_MAP.USER)[number] => {
    return CATEGORY_MAP.USER.includes(type as (typeof CATEGORY_MAP.USER)[number]);
};

const getIcon = (type: NotificationType) => {
    if (type.startsWith("ISSUE")) {
        return <AlertCircle className="h-5 w-5 text-[#073954]" />;
    }

    if (isUserNotification(type)) {
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
const Notifications = () => {
    const router = useRouter();

    // const { user } = useAuth();
    // const userId = user?.user_id;

    const [activeCategory, setActiveCategory] = useState<Category>("ISSUE");
    const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
    const [notifications, setNotifications] = useState(MOCK_NOTIFICATIONS);

    /* =========================
       API LOGIC (COMMENTED)
    ========================= */
    // const { data: apiNotifications, refetch } =
    //   useGetNotificationsByUserIdQuery(
    //     { userId },
    //     { skip: !userId }
    //   );

    // const [markAllNotificationsAsRead] =
    //   useMarkAllNotificationsAsReadMutation();

    // const [markNotificationAsRead] =
    //   useMarkNotificationAsReadMutation();

    /* =========================
       MOCK HANDLERS
    ========================= */
    const handleMarkAllAsRead = () => {
        setNotifications((prev) =>
            prev.map((n) => ({ ...n, is_read: true }))
        );
    };

    const handleNotificationClick = (notification: Notification) => {
        if (!notification.is_read) {
            setNotifications((prev) =>
                prev.map((n) =>
                    n.notification_id === notification.notification_id
                        ? { ...n, is_read: true }
                        : n
                )
            );
        }

        // if (notification.issue) {
        //   router.push(`/task/${notification.issue.issue_id}`);
        // }
    };
    type IssueNotification = (typeof CATEGORY_MAP.ISSUE)[number];
    type UserNotification = (typeof CATEGORY_MAP.USER)[number];
    type SystemNotification = (typeof CATEGORY_MAP.SYSTEM)[number];

    const isIssueNotification = (
        type: NotificationType
    ): type is IssueNotification => {
        return type.startsWith("ISSUE_");
    };

    const isUserNotification = (type: NotificationType): type is UserNotification => {
        return type.startsWith("PASSWORD") || type.startsWith("LOGIN") || type.startsWith("USER") || type.startsWith("PROFILE");
    };


    const SYSTEM_NOTIFICATION_SET = new Set(CATEGORY_MAP.SYSTEM);

    const isSystemNotification = (type: NotificationType): type is SystemNotification => {
        return SYSTEM_NOTIFICATION_SET.has(type as SystemNotification);
    };

    const matchesCategory = (
        category: Category,
        type: NotificationType
    ): boolean => {
        switch (category) {
            case "ISSUE":
                return isIssueNotification(type);

            case "USER":
                return isUserNotification(type);

            case "SYSTEM":
                return isSystemNotification(type);

            default: {
                const _exhaustive: never = category;
                return _exhaustive;
            }
        }
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
                    new Date(b.created_at).getTime() -
                    new Date(a.created_at).getTime()
            );
    }, [notifications, activeCategory, statusFilter]);

    return (
        <>
            <div className="bg-white p-6 pb-1 rounded-lg shadow-md mb-6">
                <h1 className="text-2xl font-semibold border-b pb-4 text-[#073954] flex items-center gap-2 mb-5">
                    <Bell className="h-6 w-6" />
                    Notifications
                </h1>
            </div>

            <div className="p-6 pt-2 bg-white rounded-lg shadow-md min-h-[calc(100vh-10rem)]">
                <div className="flex items-center py-4 justify-between flex-wrap gap-4 mb-6">
                    <div className="flex gap-2 border p-2 px-4 rounded-lg">
                        {(Object.keys(CATEGORY_MAP) as Category[]).map((category) => (
                            <Button
                                key={category}
                                onClick={() => setActiveCategory(category)}
                                className={clsx(
                                    "px-5 py-1.5 text-sm rounded-lg transition",
                                    activeCategory === category
                                        ? "bg-golden-dark text-white"
                                        : "bg-golden-dark10 border text-gray-700 hover:bg-golden-dark20"
                                )}
                            >
                                <span className="flex items-center gap-2">
                                    {CATEGORY_ICONS[category]}
                                    {category.charAt(0) +
                                        category.slice(1).toLowerCase()}
                                </span>
                            </Button>
                        ))}
                    </div>

                    <div className="flex items-center gap-3">
                        <select
                            value={statusFilter}
                            onChange={(e) =>
                                setStatusFilter(e.target.value as StatusFilter)
                            }
                            className="border rounded-md px-3 py-1.5 text-sm"
                        >
                            <option value="ALL">All</option>
                            <option value="UNREAD">Unread</option>
                            <option value="READ">Read</option>
                        </select>

                        <button
                            onClick={handleMarkAllAsRead}
                            className="text-sm px-4 py-1.5 rounded-lg bg-golden-dark hover:bg-golden-darkHover text-white"
                        >
                            Mark all as read
                        </button>
                    </div>
                </div>

                <div className="space-y-3">
                    {filteredNotifications.length === 0 && (
                        <div className="text-center text-gray-500 py-12">
                            No notifications found
                        </div>
                    )}

                    {filteredNotifications.map((n, index) => {
                        const currentDate = formatDateLabel(
                            new Date(n.created_at)
                        );
                        const prevDate =
                            index > 0
                                ? formatDateLabel(
                                    new Date(
                                        filteredNotifications[index - 1].created_at
                                    )
                                )
                                : null;

                        const showDateSeparator = currentDate !== prevDate;

                        return (
                            <React.Fragment key={n.notification_id}>
                                {showDateSeparator && (
                                    <div className="flex items-center gap-4 my-4">
                                        <div className="flex-1 h-px bg-gray-300" />
                                        <span className="text-xs font-medium text-gray-500">
                                            {currentDate}
                                        </span>
                                        <div className="flex-1 h-px bg-gray-300" />
                                    </div>
                                )}

                                <div
                                    onClick={() => handleNotificationClick(n)}
                                    className={clsx(
                                        "flex gap-4 p-4 rounded-xl cursor-pointer transition",
                                        n.is_read
                                            ? "bg-gray-100"
                                            : "bg-blue-50 border border-blue-200"
                                    )}
                                >
                                    <div className="mt-1">{getIcon(n.type)}</div>

                                    <div className="flex-1">
                                        <h3 className="text-sm font-semibold mb-1">
                                            {n.title}
                                        </h3>

                                        <p className="text-sm text-gray-600 mb-2">
                                            {n.issue?.ticket_number ? (
                                                <>
                                                    {n.message.split(n.issue.ticket_number)[0]}
                                                    <Link
                                                        href={`/task/${n.issue.issue_id}`}
                                                        className="text-[#073954] font-medium hover:underline"
                                                    >
                                                        {n.issue.ticket_number}
                                                    </Link>
                                                    {n.message.split(n.issue.ticket_number)[1]}
                                                </>
                                            ) : (
                                                n.message
                                            )}
                                        </p>

                                        <span className="text-xs text-gray-500">
                                            {
                                                new Date(n.created_at).toLocaleString()
                                            }
                                        </span>
                                    </div>
                                </div>
                            </React.Fragment>
                        );
                    })}
                </div>
            </div>
        </>
    );
};

export default Notifications;
