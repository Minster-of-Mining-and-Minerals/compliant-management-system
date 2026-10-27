/**
 * Copy text to the clipboard.
 *
 * navigator.clipboard only exists in secure contexts (HTTPS or localhost). The app is
 * also served over plain HTTP on an IP address, so fall back to a hidden textarea +
 * document.execCommand("copy"), which still works there.
 */
export async function copyText(text: string): Promise<boolean> {
  if (typeof window === "undefined") return false;

  if (navigator.clipboard && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // fall through to the legacy method
    }
  }

  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "");
  // Keep it off-screen and avoid scrolling/zooming on mobile
  textarea.style.position = "fixed";
  textarea.style.top = "0";
  textarea.style.left = "-9999px";
  textarea.style.fontSize = "16px";
  document.body.appendChild(textarea);

  try {
    textarea.select();
    textarea.setSelectionRange(0, text.length); // iOS
    return document.execCommand("copy");
  } catch {
    return false;
  } finally {
    document.body.removeChild(textarea);
  }
}
