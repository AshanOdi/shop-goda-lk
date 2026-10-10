import { ArrowRight, Banknote, Link2, Printer, Store, Truck } from "lucide-react";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Button } from "@/components/ui/button";
import { env } from "@/env";

// Placeholder marketing home page. Ape Kade's own look (SPEC 11), not the reference ads.
export default async function HomePage() {
  const t = await getTranslations("HomePage");
  const domain = new URL(env.NEXT_PUBLIC_APP_URL).host;

  const features = [
    { key: "link", icon: Link2 },
    { key: "payments", icon: Banknote },
    { key: "documents", icon: Printer },
    { key: "tracking", icon: Truck },
  ] as const;

  return (
    <div className="flex min-h-dvh flex-col bg-brand-sand text-brand-ink">
      <header className="mx-auto flex w-full max-w-5xl items-center gap-2 px-4 py-4 sm:px-8">
        <span className="flex size-9 items-center justify-center rounded-xl bg-brand-maroon text-white">
          <Store className="size-5" aria-hidden />
        </span>
        <span className="text-lg font-bold tracking-tight">{t("brand")}</span>
      </header>

      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-12 px-4 pt-8 pb-16 sm:px-8 sm:pt-16">
        <section className="flex max-w-2xl flex-col gap-5">
          <p className="text-sm font-semibold tracking-wide text-brand-maroon uppercase">
            {t("eyebrow")}
          </p>
          <h1 className="text-4xl leading-tight font-extrabold tracking-tight sm:text-5xl">
            {t.rich("title", {
              mark: (chunks) => (
                <mark className="rounded-md bg-brand-peach px-1 text-inherit">{chunks}</mark>
              ),
            })}
          </h1>
          <p className="text-lg text-brand-ink/75">{t("subtitle")}</p>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <Button
              asChild
              size="lg"
              className="h-12 rounded-full bg-brand-orange px-6 text-base font-bold text-brand-ink hover:bg-brand-orange/90"
            >
              <Link href="/signup">
                {t("cta")}
                <ArrowRight aria-hidden />
              </Link>
            </Button>
            <p className="text-sm text-brand-ink/70">{t("trial")}</p>
          </div>
        </section>

        <section className="flex flex-col gap-4" aria-labelledby="features-title">
          <h2 id="features-title" className="text-xl font-bold">
            {t("featuresTitle")}
          </h2>
          <ul className="grid gap-3 sm:grid-cols-2">
            {features.map(({ key, icon: Icon }) => (
              <li key={key} className="flex gap-4 rounded-xl border bg-card p-4">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-brand-peach text-brand-maroon">
                  <Icon className="size-5" aria-hidden />
                </span>
                <div>
                  <p className="font-semibold">{t(`features.${key}.title`)}</p>
                  <p className="text-sm text-brand-ink/70">
                    {t(`features.${key}.body`, { domain })}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </section>
      </main>

      <footer className="border-t border-brand-ink/10 py-6 text-center text-sm text-brand-ink/60">
        {t("footer")}
      </footer>
    </div>
  );
}
