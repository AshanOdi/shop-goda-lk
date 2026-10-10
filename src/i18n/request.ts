import { getRequestConfig } from "next-intl/server";

// SPEC 3: English only in Phase 1, but every string goes through next-intl so Sinhala
// and Tamil (Phase 3) only need new message files. The locale is fixed for now; it is
// not read from cookies or headers, which keeps pages static-friendly.
export const defaultLocale = "en";

export default getRequestConfig(async () => {
  const locale = defaultLocale;
  return {
    locale,
    timeZone: "Asia/Colombo", // SPEC 5.5
    messages: (await import(`../../messages/${locale}.json`)).default,
  };
});
