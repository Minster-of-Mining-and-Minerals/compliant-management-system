"use client";

import { Button } from "@/components/ui/button";
import { Copy, Download, Image as ImageIcon, ShieldCheck, X } from "lucide-react";
import { toast } from "sonner";
import html2canvas from "html2canvas";
import { useRef } from "react";
import { QRCodeCanvas } from "qrcode.react";
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

    if (!open) return null;

    const handleCopy = async () => {
        await navigator.clipboard.writeText(ticketNumber);
        toast.success("Ticket number copied");
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

    const FRONTEND_URL = process.env.NEXT_PUBLIC_FRONTEND_URL;

    const trackingUrl = `${FRONTEND_URL}/en/track-complaint?ticketNumber=${ticketNumber}`;
    return (
        /* ===== OVERLAY ===== */
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
            {/* ===== MODAL ===== */}
            <div className="w-full max-w-md rounded-lg bg-white shadow-xl relative">
                {/* CLOSE BUTTON */}


                {/* ===== CAPTURE AREA (DOWNLOADED AS IMAGE) ===== */}
                <div ref={modalRef} className="p-6 text-center">
                    <div className="flex flex-row justify-between border-b py-2  mb-2">
                        <div className="flex justify-left items-center  gap-2 mb-2">
                            <ShieldCheck className="text-green-600 w-10 h-10" />
                            <h2 className="text-lg font-semibold">
                                Complaint Submitted Successfully
                            </h2>
                        </div>
                        <button
                            onClick={onClose}
                            className="flex justify-end  text-gray-500 hover:text-gray-800"
                        >
                            <X className="w-6 h-6 hover:text-gray-700" />
                        </button>
                    </div>

                    {/* TICKET NUMBER */}
                    {/* <div className="mt-4 p-4 rounded-md bg-gray-100 border text-lg font-mono tracking-wider">
                        {ticketNumber}
                    </div> */}
                    <div className=" text-left">
                        <p className="text-base text-gray-600">
                            Thank you for your complaint. your complaint to MoM on {submittedAt} has been received. We will get back to you as soon as possible.

                            Please keep this ticket number for tracking your complaint.
                            <br />
                            <div className="flex justify-between px-10 py-2 rounded-md items-center border mt-4 ">
                                <div className="flex justify-center items-center flex-col ">

                                    <span className="text-sm">Tracking Number</span> <span className="font-medium text-lg">{ticketNumber}</span>
                                </div>
                                <Button className="border-none bg-white text-black hover:bg-gray-100 hover:text-black " onClick={handleCopy}>
                                    <Copy className="w-10 h-10 " />
                                </Button>
                            </div>
                            <br />
                            {/* Use the following link to track your complaint.
                            <br />
                            <a href="http://localhost:3000/en/track-complaint" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline break-all">
                                http://localhost:3000/en/track-complaint
                            </a> */}
                            <div className=" flex flex-col items-center gap-2">
                                <QRCodeCanvas
                                    value={trackingUrl}
                                    size={140}
                                    bgColor="#ffffff"
                                    fgColor="#000000"
                                    level="H"
                                    includeMargin
                                />
                                <p className="text-xs text-gray-600">
                                    Scan to track your complaint
                                </p>
                                <p className="text-xs text-gray-600">
                                    Or Click the link below to track your complaint
                                </p>
                                <a href={trackingUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600">
                                    Track your complaint
                                </a>
                            </div>
                        </p>
                    </div>



                    {/* TRACKING INFO */}

                </div>

                {/* ===== ACTIONS (NOT INCLUDED IN IMAGE) ===== */}
                <div className="border-t flex w-fit items-center w-full px-6 py-4 flex justify-center gap-3">


                    <Button className=" bg-white text-golden-dark hover:bg-golden-dark20 hover:text-golden-dark  border-golden-dark border" onClick={handleDownloadImage}>
                        <Download className="w-4 h-4 mr-2" />
                        Download Image
                    </Button>
                    {/* <Button className="" onClick={onClose}>
                        Close
                    </Button> */}
                </div>


            </div>
        </div>
    );
};

export default TicketSuccessModal;