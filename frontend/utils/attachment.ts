export interface AttachmentDocument {
  document_id: string;
  filename: string;
  mime_type?: string;
  type?: string;
  content?: string;
}

const EXTENSION_LABELS: Record<string, string> = {
  pdf: "PDF",
  docx: "DOCX",
  txt: "TXT",
  md: "Markdown",
  html: "HTML",
  csv: "CSV",
  json: "JSON",
  png: "PNG",
  jpg: "JPG",
  jpeg: "JPEG",
  webp: "WEBP",
};

export function isImageAttachment(doc: AttachmentDocument): boolean {
  if (doc.type === "image") return true;
  if (doc.mime_type?.toLowerCase().startsWith("image/")) return true;
  return /\.(png|jpe?g|webp|gif)$/i.test(doc.filename || "");
}

export function getAttachmentFileType(doc: AttachmentDocument): string {
  const filename = doc.filename || "";
  const dotIndex = filename.lastIndexOf(".");
  if (dotIndex !== -1 && dotIndex < filename.length - 1) {
    const ext = filename.slice(dotIndex + 1).toLowerCase();
    if (EXTENSION_LABELS[ext]) return EXTENSION_LABELS[ext];
    return ext.toUpperCase();
  }

  if (doc.mime_type) {
    const subtype = doc.mime_type.split("/")[1]?.split(";")[0]?.trim();
    if (subtype) return subtype.toUpperCase();
  }

  return isImageAttachment(doc) ? "Image" : "Document";
}

export function getImageDataUrl(
  doc: AttachmentDocument,
  overrideContent?: string,
  overrideMimeType?: string
): string | null {
  const content = overrideContent ?? doc.content;
  if (!content) return null;

  let mimeType = (overrideMimeType || doc.mime_type || "").split(";")[0].trim().toLowerCase();
  if (mimeType === "image/jpg") {
    mimeType = "image/jpeg";
  }
  if (!mimeType.startsWith("image/")) {
    const ext = doc.filename?.split(".").pop()?.toLowerCase();
    if (ext === "jpg" || ext === "jpeg") mimeType = "image/jpeg";
    else if (ext === "webp") mimeType = "image/webp";
    else mimeType = "image/png";
  }

  return `data:${mimeType};base64,${content}`;
}
