const allowedProtocols = new Set(["http:", "https:"]);

export const validateOptionalURL = (value: unknown): true | string => {
  if (value === undefined || value === null || value === "") return true;
  if (typeof value !== "string") return "أدخل رابطًا صالحًا / Enter a valid URL.";

  try {
    const url = new URL(value);
    return allowedProtocols.has(url.protocol)
      ? true
      : "يُسمح بروابط http وhttps فقط / Only http and https URLs are allowed.";
  } catch {
    return "أدخل رابطًا كاملًا يبدأ بـ https:// / Enter a complete URL starting with https://.";
  }
};

const arabicMap: Record<string, string> = {
  ا: "a", أ: "a", إ: "i", آ: "a", ب: "b", ت: "t", ث: "th", ج: "j",
  ح: "h", خ: "kh", د: "d", ذ: "th", ر: "r", ز: "z", س: "s", ش: "sh",
  ص: "s", ض: "d", ط: "t", ظ: "z", ع: "a", غ: "gh", ف: "f", ق: "q",
  ك: "k", ل: "l", م: "m", ن: "n", ه: "h", و: "w", ي: "y", ى: "a",
  ة: "h", ء: "", ئ: "y", ؤ: "w",
};

export const toSlug = (value: string): string =>
  value
    .trim()
    .toLowerCase()
    .split("")
    .map((character) => arabicMap[character] ?? character)
    .join("")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
