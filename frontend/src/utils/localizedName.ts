/**
 * Bilingual database records (categories, sectors, departments) store the English
 * text in `name` / `description` and the Amharic text in `name_am` / `description_am`.
 * Amharic is optional, so fall back to English when it is missing.
 */

interface Bilingual {
  name?: string | null;
  name_am?: string | null;
  description?: string | null;
  description_am?: string | null;
}

export const localizedName = (item: Bilingual | null | undefined, locale: string): string => {
  if (!item) return "";
  if (locale === "am" && item.name_am?.trim()) return item.name_am;
  return item.name ?? "";
};

export const localizedDescription = (item: Bilingual | null | undefined, locale: string): string => {
  if (!item) return "";
  if (locale === "am" && item.description_am?.trim()) return item.description_am;
  return item.description ?? "";
};
