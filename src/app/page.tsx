import {
  ArrowUpRight,
  Banknote,
  Check,
  Link2,
  PackageCheck,
  Printer,
  Store,
  Truck,
} from "lucide-react";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Button } from "@/components/ui/button";
import { env } from "@/env";

// Placeholder marketing home page in Ape Kade's own look (SPEC 11).
// First drafted with v0, then reviewed: strings moved to messages, contrast and
// tap targets checked, the sample dashboard card marked as an example.
export default async function HomePage() {
  const t = await getTranslations("HomePage");
  const domain = new URL(env.NEXT_PUBLIC_APP_URL).host;
  const features = [
    { key: "link", icon: Link2, number: "01" },
    { key: "payments", icon: Banknote, number: "02" },
    { key: "documents", icon: Printer, number: "03" },
    { key: "tracking", icon: Truck, number: "04" },
  ] as const;

  return (
    <div className="flex min-h-dvh flex-col bg-brand-ink text-brand-sand">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-5 py-5 sm:px-8">
        <Link href="/" className="flex items-center gap-3" aria-label={t("brand")}>
          <span className="flex size-9 items-center justify-center rounded-full bg-brand-orange text-brand-ink">
            <Store className="size-4" aria-hidden />
          </span>
          <span className="font-semibold tracking-tight">{t("brand")}</span>
        </Link>
        <Link
          href="/signup"
          className="group flex min-h-11 items-center gap-2 text-sm text-brand-sand/80 hover:text-brand-orange"
        >
          {t("navCta")}
          <ArrowUpRight
            className="size-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
            aria-hidden
          />
        </Link>
      </header>

      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-20 px-5 pt-12 pb-20 sm:px-8 sm:pt-20">
        <section className="grid items-end gap-12 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="flex flex-col gap-7">
            <p className="flex items-center gap-3 text-xs font-semibold tracking-[0.22em] text-brand-orange uppercase">
              <span className="h-px w-8 bg-brand-orange" aria-hidden />
              {t("eyebrow")}
            </p>
            <h1 className="max-w-3xl text-5xl leading-[0.98] font-semibold tracking-[-0.055em] sm:text-7xl">
              {t.rich("title", {
                accent: (chunks) => <span className="text-brand-orange">{chunks}</span>,
              })}
            </h1>
            <p className="max-w-xl text-lg leading-8 text-brand-sand/75">{t("subtitle")}</p>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <Button
                asChild
                size="lg"
                className="h-13 rounded-full bg-brand-orange px-7 text-base font-semibold text-brand-ink hover:bg-brand-peach"
              >
                <Link href="/signup">
                  {t("cta")}
                  <ArrowUpRight aria-hidden />
                </Link>
              </Button>
              <span className="text-sm text-brand-sand/70">{t("trial")}</span>
            </div>
          </div>

          {/* A sample of the seller dashboard. Decorative, and labelled "Example"
              so the number isn't mistaken for a real statistic. */}
          <div className="relative min-h-72 overflow-hidden rounded-[2rem] border border-brand-sand/10 bg-brand-maroon p-6 shadow-2xl shadow-black/20 sm:min-h-80">
            <div
              className="absolute -right-20 -bottom-24 size-64 rounded-full border border-brand-orange/25"
              aria-hidden
            />
            <div
              className="absolute -right-10 -bottom-14 size-44 rounded-full border border-brand-orange/20"
              aria-hidden
            />
            <div className="relative flex h-full flex-col justify-between gap-12">
              <div className="flex items-center justify-between text-xs text-brand-sand/90">
                <span>{t("preview.label")}</span>
                <span className="rounded-full bg-brand-ink/30 px-2 py-0.5">
                  {t("preview.example")}
                </span>
              </div>
              <div>
                <p className="text-sm text-brand-sand/90">{t("preview.ordersLabel")}</p>
                <p className="mt-1 text-6xl font-semibold tracking-[-0.06em]">
                  {t("preview.ordersValue")}
                </p>
                <div className="mt-5 flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2 text-brand-peach">
                    <PackageCheck className="size-4" aria-hidden />
                    {t("preview.ordersNote")}
                  </span>
                  <span className="flex items-center gap-2 text-brand-sand/90">
                    <span className="size-2 rounded-full bg-brand-orange" aria-hidden />
                    {t("preview.status")}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section
          className="grid gap-8 border-t border-brand-sand/15 pt-8 lg:grid-cols-[0.75fr_1.25fr]"
          aria-labelledby="features-title"
        >
          <div>
            <p className="text-xs font-semibold tracking-[0.2em] text-brand-orange uppercase">
              {t("featuresEyebrow")}
            </p>
            <h2
              id="features-title"
              className="mt-4 max-w-xs text-3xl leading-tight font-semibold tracking-tight"
            >
              {t("featuresTitle")}
            </h2>
          </div>
          <ul className="grid gap-px overflow-hidden rounded-2xl border border-brand-sand/10 bg-brand-sand/10 sm:grid-cols-2">
            {features.map(({ key, icon: Icon, number }) => (
              <li
                key={key}
                className="flex min-h-44 flex-col justify-between bg-brand-ink p-5 transition-colors hover:bg-brand-maroon"
              >
                <div className="flex items-start justify-between">
                  <Icon className="size-5 text-brand-orange" aria-hidden />
                  <span className="text-xs text-brand-sand/40" aria-hidden>
                    {number}
                  </span>
                </div>
                <div>
                  <p className="font-semibold">{t(`features.${key}.title`)}</p>
                  <p className="mt-2 text-sm leading-6 text-brand-sand/70">
                    {t(`features.${key}.body`, { domain })}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section className="flex flex-col gap-5 rounded-3xl bg-brand-orange p-7 text-brand-ink sm:flex-row sm:items-center sm:justify-between sm:p-10">
          <div>
            <p className="text-sm font-semibold uppercase">{t("closing.eyebrow")}</p>
            <p className="mt-2 text-2xl font-semibold tracking-tight">{t("closing.title")}</p>
          </div>
          <p className="flex items-center gap-3 text-sm font-semibold">
            <Check className="size-4" aria-hidden />
            {t("closing.noCard")}
          </p>
        </section>
      </main>

      <footer className="border-t border-brand-sand/10 px-5 py-6 text-center text-sm text-brand-sand/60">
        {t("footer")}
      </footer>
    </div>
  );
}
