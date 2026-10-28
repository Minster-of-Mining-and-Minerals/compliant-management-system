"use client";

import { Button } from "@/components/ui/button";
import { Check, Copy, Download, Search, ShieldCheck, X } from "lucide-react";
import { toast } from "sonner";
import html2canvas from "html2canvas";
import { useEffect, useRef, useState } from "react";
import { QRCodeCanvas } from "qrcode.react";
import { useLocale, useTranslations } from "next-intl";
import { getAppOrigin } from "@/utils/apiUrl";
import { Link } from "@/i18n/navigation";
import { copyText } from "@/utils/copyText";

interface TicketSuccessModalProps {
    open: boolean;
    onClose: () => void;
    ticketNumber: string;
    sectorName: string;
    submittedAt?: string;
}

const TicketSuccessModal = ({
    open,
    onClose,
    ticketNumber,
    sectorName,
    submittedAt,
}: TicketSuccessModalProps) => {
    const modalRef = useRef<HTMLDivElement>(null);
    const [copied, setCopied] = useState(false);
    const t = useTranslations("ComplaintSuccess");
    const locale = useLocale();

    // Close with the Escape key
    useEffect(() => {
        if (!open) return;
        const onKeyDown = (e: KeyboardEvent) => e.key === "Escape" && onClose();
        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, [open, onClose]);

    if (!open) return null;

    const handleCopy = async () => {
        if (await copyText(ticketNumber)) {
            setCopied(true);
            toast.success(t("copied"));
            setTimeout(() => setCopied(false), 2000);
        } else {
            toast.error(t("copyFailed"));
        }
    };

    const handleDownloadImage = async () => {
        if (!modalRef.current) return;

        const canvas = await html2canvas(modalRef.current, {
            scale: 2,
            backgroundColor: "#ffffff",
        });

        const image = canvas.toDataURL("image/png");
        const link = document.createElement("a");
        link.href = image;
        link.download = `complaint-ticket-${ticketNumber}.png`;
        link.click();
    };

    const trackingPath = `/track-complaint?ticketNumber=${encodeURIComponent(ticketNumber)}`;
    const trackingUrl = `${getAppOrigin()}/${locale}${trackingPath}`;

    return (
        /* ===== OVERLAY ===== */
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 py-6 overflow-y-auto"
            onClick={onClose}
        >
            {/* ===== MODAL ===== */}
            <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="complaint-success-title"
                className="w-full max-w-md rounded-2xl bg-white shadow-2xl relative"
                onClick={(e) => e.stopPropagation()}
            >
                <button
                    onClick={onClose}
                    aria-label={t("close")}
                    className="absolute right-3 top-3 z-10 rounded-full p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
                >
                    <X className="w-5 h-5" />
                </button>

                {/* ===== CAPTURE AREA (DOWNLOADED AS IMAGE) ===== */}
                <div ref={modalRef} className="px-6 pt-8 pb-6 text-center bg-white rounded-t-2xl">
                    <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-green-50">
                        <ShieldCheck className="text-green-600 w-8 h-8" />
                    </div>
                    <h2 id="complaint-success-title" className="text-xl font-semibold text-gray-900">
                        {t("title")}
                    </h2>
                    <p className="mt-2 text-sm text-gray-600">
                        {t("message", { date: submittedAt ?? "" })}
                    </p>
                    {sectorName && (
                        <p className="mt-1 text-sm text-gray-600">
                            {t("sentTo")} <span className="font-medium text-gray-900">{sectorName}</span>
                        </p>
                    )}

                    {/* TICKET NUMBER */}
                    <div className="mt-5 rounded-xl border-2 border-dashed border-golden-dark/40 bg-golden-dark/5 px-4 py-4">
                        <p className="text-xs uppercase tracking-wide text-gray-500">{t("trackingNumber")}</p>
                        <div className="mt-1 flex items-center justify-center gap-2">
                            <span className="font-mono text-2xl sm:text-3xl font-bold tracking-wider text-gray-900 break-all">
                                {ticketNumber}
                            </span>
                            <button
                                type="button"
                                onClick={handleCopy}
                                aria-label={t("copy")}
                                data-html2canvas-ignore
                                className="rounded-md p-2 text-gray-500 hover:bg-white hover:text-golden-dark"
                            >
                                {copied ? <Check className="w-5 h-5 text-green-600" /> : <Copy className="w-5 h-5" />}
                            </button>
                        </div>
                        <p className="mt-1 text-xs text-gray-500">{t("keepNumber")}</p>
                    </div>

                    <div className="mt-5 flex flex-col items-center gap-1">
                        <QRCodeCanvas
                            value={trackingUrl}
                            size={132}
                            bgColor="#ffffff"
                            fgColor="#000000"
                            level="H"
                            includeMargin
                        />
                        <p className="text-xs text-gray-500">{t("scanToTrack")}</p>
                    </div>
                </div>

                {/* ===== ACTIONS (NOT INCLUDED IN IMAGE) ===== */}
                <div className="border-t px-6 py-4 flex flex-col sm:flex-row gap-3">
                    <Button
                        asChild
                        className="flex-1 h-11 bg-golden-deep text-white hover:bg-golden-deep/90"
                    >
                        <Link href={trackingPath}>
                            <Search className="w-4 h-4 mr-2" />
                            {t("trackNow")}
                        </Link>
                    </Button>
                    <Button
                        className="flex-1 h-11 bg-white text-golden-deep hover:bg-golden-dark/10 hover:text-golden-deep border-golden-deep border"
                        onClick={handleDownloadImage}
                    >
                        <Download className="w-4 h-4 mr-2" />
                        {t("download")}
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default TicketSuccessModal;
