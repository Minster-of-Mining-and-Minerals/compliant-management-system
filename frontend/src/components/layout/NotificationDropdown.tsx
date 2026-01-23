"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
    Bell,
    CheckCircle,
    AlertCircle,
    MessageSquare,
    CheckCheck,
    X,
    User,
    Shield,
} from "lucide-react";
import { DropdownItem } from "../ui/DropdownItem";
import { useSession } from "next-auth/react";
import { Dropdown } from "../ui/Dropdown";

/* ================= MOCK TYPES ================= */

export type Notification = {
    notification_id: string;
    title: string;
    message: string;
    type:
    | "ISSUE_CREATED"
    | "ISSUE_ASSIGNED"
    | "ISSUE_RESOLVED"
    | "ISSUE_REJECTED"
    | "ISSUE_COMMENTED"
    | "SYSTEM_ALERT"
    | "USER_REGISTERED";
    is_read: boolean;
    created_at: string;
};

/* ================= MOCK DATA ================= */

const mockNotifications: Notification[] = [
    {
        notification_id: "1",
        title: "Issue Assigned",
        message: "A new issue has been assigned to you.",
        type: "ISSUE_ASSIGNED",
        is_read: false,
        created_at: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
    },
    {
        notification_id: "2",
        title: "Issue Resolved",
        message: "The reported issue has been resolved successfully.",
        type: "ISSUE_RESOLVED",
        is_read: false,
        created_at: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
    },
    {
        notification_id: "3",
        title: "New Comment",
        message: "Someone commented on your issue.",
        type: "ISSUE_COMMENTED",
        is_read: true,
        created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    },
];

/* ================= CATEGORY MAP ================= */

const CATEGORY_MAP = {
    ISSUE: [
        "ISSUE_CREATED",
        "ISSUE_ASSIGNED",
        "ISSUE_RESOLVED",
        "ISSUE_REJECTED",
        "ISSUE_COMMENTED",
    ],
    USER: ["USER_REGISTERED"],
    SYSTEM: ["SYSTEM_ALERT"],
};

/* ================= HELPERS ================= */

export const getNotificationIcon = (type: Notification["type"]) => {
    switch (true) {
        case CATEGORY_MAP.ISSUE.includes(type):
            switch (type) {
                case "ISSUE_ASSIGNED":
                case "ISSUE_CREATED":
                    return <Bell className="h-5 w-5 text-blue-500" />;
                case "ISSUE_RESOLVED":
                    return <CheckCircle className="h-5 w-5 text-green-500" />;
                case "ISSUE_REJECTED":
                    return <AlertCircle className="h-5 w-5 text-red-500" />;
                case "ISSUE_COMMENTED":
                    return <MessageSquare className="h-5 w-5 text-purple-500" />;
                default:
                    return <Bell className="h-5 w-5 text-gray-500" />;
            }

        case CATEGORY_MAP.USER.includes(type):
            return <User className="h-5 w-5 text-indigo-500" />;

        case CATEGORY_MAP.SYSTEM.includes(type):
            return <Shield className="h-5 w-5 text-gray-700" />;

        default:
            return <Bell className="h-5 w-5 text-gray-400" />;
    }
};

const formatTime = (dateString: string) => {
    try {
        return new Date(dateString).toISOString();
    } catch {
        return "Recently";
    }
};

const truncateText = (text: string, maxLength: number) =>
    text.length <= maxLength ? text : text.substring(0, maxLength) + "...";

/* ================= ITEM ================= */

const NotificationItem = ({
    notification,
    onClick,
    onXClick,
}: {
    notification: Notification;
    onClick: (n: Notification) => void;
    onXClick: (n: Notification) => void;
}) => (
    <DropdownItem
        onClick={(e) => {
            e.stopPropagation();
            onClick(notification);
        }}
        className={`group relative flex gap-3 rounded-lg border p-3 hover:bg-gray-100 ${!notification.is_read ? "bg-blue-50" : "bg-white"
            }`}
    >
        <div className="relative w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
            {getNotificationIcon(notification.type)}
            {!notification.is_read && (
                <span className="absolute top-0 right-0 w-3 h-3 bg-blue-500 border-2 border-white rounded-full" />
            )}
        </div>

        <div className="flex-1">
            <div className="flex justify-between">
                <span className="font-medium truncate">{notification.title}</span>
                <X
                    onClick={(e) => {
                        e.stopPropagation();
                        onXClick(notification);
                    }}
                    className="hidden group-hover:block w-4 h-4 text-gray-500 hover:text-red-500 cursor-pointer"
                />
            </div>
            <p className="text-sm text-gray-600">
                {truncateText(notification.message, 40)}
            </p>
            <span className="text-xs text-gray-400">
                {formatTime(notification.created_at)}
            </span>
        </div>
    </DropdownItem>
);

/* ================= DROPDOWN ================= */

export default function NotificationDropdown() {
    const user = useSession();
    const router = useRouter();

    const [isOpen, setIsOpen] = useState(false);
    const [localNotifications, setLocalNotifications] =
        useState<Notification[]>([]);

    /* ================= MOCK LOAD ================= */

    useEffect(() => {
        setLocalNotifications(mockNotifications);
    }, []);

    /* ================= HANDLERS ================= */

    const handleNotificationClick = (notification: Notification) => {
        setLocalNotifications((prev) =>
            prev.map((n) =>
                n.notification_id === notification.notification_id
                    ? { ...n, is_read: true }
                    : n
            )
        );
        setIsOpen(false);
    };

    const handleMarkAllAsRead = () => {
        setLocalNotifications((prev) =>
            prev.map((n) => ({ ...n, is_read: true }))
        );
    };

    const unreadCount = useMemo(
        () => localNotifications.filter((n) => !n.is_read).length,
        [localNotifications]
    );

    if (!user) return null;

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative h-11 w-11 rounded-full border flex items-center justify-center"
            >
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-[20px] h-5 text-xs bg-orange-500 text-white rounded-full flex items-center justify-center">
                        {unreadCount}
                    </span>
                )}
                <Bell className="w-5 h-5" />
            </button>

            <Dropdown
                isOpen={isOpen}
                onClose={() => setIsOpen(false)}
                className="absolute right-0 mt-2 w-[400px] bg-white border rounded-2xl shadow-lg p-3"
            >
                <div className="flex justify-between items-center mb-3 border-b pb-2">
                    <h5 className="font-semibold">Notifications</h5>
                    {unreadCount > 0 && (
                        <button
                            onClick={handleMarkAllAsRead}
                            className="text-xs text-blue-600 flex gap-1 items-center"
                        >
                            <CheckCheck className="w-4 h-4" />
                            Mark all as read
                        </button>
                    )}
                </div>

                <ul className="flex flex-col gap-1 max-h-[320px] overflow-y-auto">
                    {localNotifications.map((notification) => (
                        <NotificationItem
                            key={notification.notification_id}
                            notification={notification}
                            onClick={handleNotificationClick}
                            onXClick={handleNotificationClick}
                        />
                    ))}
                </ul>

                <DropdownItem
                    onClick={() => {
                        setIsOpen(false);
                        router.push("/notifications");
                    }}
                    className="mt-3 text-center border rounded-lg py-2 hover:bg-gray-100"
                >
                    View All Notifications
                </DropdownItem>
            </Dropdown>
        </div>
    );
}
