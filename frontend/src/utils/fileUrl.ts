export const getFileUrl = (filePath: string) => {
  const normalized = filePath.replace(/\\/g, "/").replace(/^\//, "");

  // Same-origin in the browser — works on public or private IP
  if (typeof window !== "undefined") {
    return `/${normalized}`;
  }

  const apiBase = process.env.NEXT_PUBLIC_FILE_URL || "http://localhost:4000";
  return `${apiBase.replace(/\/$/, "")}/${normalized}`;
};

export const getFileType = (fileName: string): string => {
  const extension = fileName.toLowerCase().split(".").pop();
  if (
    ["jpg", "jpeg", "png", "gif", "bmp", "webp", "svg"].includes(
      extension || "",
    )
  ) {
    return "image";
  } else if (extension === "pdf") {
    return "pdf";
  } else if (["doc", "docx", "txt", "rtf"].includes(extension || "")) {
    return "document";
  } else {
    return "other";
  }
};
