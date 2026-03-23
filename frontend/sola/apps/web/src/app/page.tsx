import Link from "next/link";
import type { CSSProperties } from "react";

const sectionTitleClass =
  "font-serif text-4xl leading-tight tracking-[-0.03em] text-slate-950 sm:text-5xl";
const cardClass =
  "rounded-[28px] border border-slate-900/10 bg-white p-8 shadow-[0_24px_70px_rgba(15,23,42,0.08)]";

const fadeInStyle = {
  animation: "fadeUp 0.8s ease both",
} satisfies CSSProperties;

const heroAvatars = [
  "https://lh3.googleusercontent.com/aida-public/AB6AXuClN0oqdeABY0W43EdUcj_R-RbDrpJcKiXmBT0W1tqfreNJkoJDy5p1SFScUJqm2HCQD9i3d1rMSO08hNqmvNEceq5_yXq4UAhOMf1cX0Mw0N8UkZ_TgLMvkxelaRxf685_0bDn1sulNVh5Aqr1A36pY8kxkM59mi82oySoTTk2lUhSyGdyuW0cR0QpwdTaNhEb00rvWpewNzAhg7nB3BoTMy5XxsWOwvSmVYbYLc_q2DmbZOxliLFQT0vB20FZNPHkpq6jKacyKZaz",
  "https://lh3.googleusercontent.com/aida-public/AB6AXuBeAXoDyb2Z8ZS5Bu6N0nqefVXRe7adEPDnTNiH5h8aphXSLrAOw1SoZ-cpknkJW_uH_9QxrLAJ7tKohgd_ETsf8nBJrxBczZ-Pf362RmGYc2_LupYhgvYIuS7tOjHkKspsLMhRkW4mJoSNxG8OmfmchuJ2mlzfMQfR62P8OfPv-ETc8AVQlY3vCoLpXl4CnOo0mvFqzef3IXvk1N7-3IUNtXf2GbeUUFKYh805_nY-ThT3n_eltP6MrJ1zN6MbC7GEMtkMKAzVjyzE",
  "https://lh3.googleusercontent.com/aida-public/AB6AXuB4vUh-XoG-WXoLIFp5T7WxTvlPqk6Z2AxwwFB0_PeJ6QGjeW4BkfH-bYfXOlfhfworPDr2a1hRCKr0Kp6q51v7pe8EleNst4PsGaClwk1k4sHtqArUMfAzK1dPefnFVYXQ1O4oNeBkTXcm4Q5ERa5M89zH0IbvmwyWAiyLVTnrTE80_WYy8fJXCEB_AIVdVW-S71312lGlSsuHh0DteDy4eKTQ6CReVV1jOlsNbPMYBUOw5NwHsb759vidV1R_o_M8rf0CHkutjpEW",
];

const faqItems = [
  {
    q: "Ist helpsola ein Diagnosetool?",
    a: "Nein. helpsola dient ausschließlich der Navigation und Orientierung im Gesundheitssystem. Wir helfen dabei, passende Ansprechpartner und Einrichtungen zu finden, stellen aber keine medizinischen Diagnosen.",
  },
  {
    q: "Wie aktuell sind die Informationen?",
    a: "Die Apotheken-Suche zeigt den jeweils gültigen Notdienstzeitraum aus der angebundenen Quelle an. Trotzdem können sich Angaben kurzfristig ändern, deshalb gilt im Zweifel immer die Bestätigung der Apotheke oder Einrichtung selbst.",
  },
  {
    q: "Ist die Nutzung kostenpflichtig?",
    a: "Der Apothekensucher ist als niedrigschwellige Orientierungshilfe gedacht. Weitere Bereiche von helpsola können später in getrennten Angeboten oder erweiterten Versionen ausgebaut werden.",
  },
];

export default function HomePage() {
  return (
    <main className="overflow-hidden bg-[#f7f5f0] text-slate-950">
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -right-24 -top-24 h-[32rem] w-[32rem] rounded-full bg-[rgba(26,63,168,0.10)] blur-3xl" />
        <div className="absolute -left-20 bottom-32 h-[24rem] w-[24rem] rounded-full bg-[rgba(14,140,130,0.10)] blur-3xl" />
      </div>

      <nav className="sticky top-0 z-30 border-b border-slate-900/10 bg-[rgba(247,245,240,0.9)] backdrop-blur-xl">
        <div className="mx-auto flex h-[72px] w-full max-w-7xl items-center justify-between px-6 lg:px-10">
          <Link
            href="/"
            className="font-serif text-2xl tracking-[-0.02em] text-[#0d2870]"
          >
            help<span className="italic text-[#0e8c82]">sola</span>
          </Link>
          <div className="hidden items-center gap-9 md:flex">
            <a
              href="#funktionen"
              className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-600 transition hover:text-[#1a3fa8]"
            >
              Funktionen
            </a>
            <a
              href="#community"
              className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-600 transition hover:text-[#1a3fa8]"
            >
              Community
            </a>
            <a
              href="#anbieter"
              className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-600 transition hover:text-[#1a3fa8]"
            >
              Für Anbieter
            </a>
            <a
              href="#faq"
              className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-600 transition hover:text-[#1a3fa8]"
            >
              Fragen
            </a>
            <Link
              href="/apothekensucher"
              className="rounded-xl bg-[#0d2870] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#1a3fa8]"
            >
              Jetzt starten
            </Link>
          </div>
        </div>
      </nav>

      <section className="border-b border-slate-900/10 bg-[#eeeae1]">
        <div className="mx-auto grid min-h-[calc(100vh-72px)] w-full max-w-7xl gap-16 px-6 py-16 lg:grid-cols-[1.05fr_0.95fr] lg:px-10 lg:py-20">
          <div className="flex flex-col justify-center" style={fadeInStyle}>
            <div className="mb-8 inline-flex w-fit items-center gap-3 rounded-full bg-[#e6ecff] px-4 py-2">
              <span className="h-2 w-2 animate-pulse rounded-full bg-[#1a3fa8]" />
              <span className="text-[0.68rem] font-bold uppercase tracking-[0.18em] text-[#1a3fa8]">
                Orientierungshilfe
              </span>
            </div>
            <h1 className="max-w-3xl font-serif text-[clamp(2.8rem,5vw,4.7rem)] leading-[1.02] tracking-[-0.04em] text-slate-950">
              Ein neuer Kompass
              <br />
              für das <span className="italic text-[#1a3fa8]">Gesundheitssystem</span>
            </h1>
            <p className="mt-8 max-w-2xl text-lg leading-8 text-slate-700">
              Wir begleiten Menschen durch den klinischen Alltag. Finde
              zertifizierte Zentren, orientiere dich schneller bei dringenden
              Fragen und behalte den Überblick im Gesundheitssystem.
            </p>
            <div className="mt-10 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/apothekensucher"
                className="inline-flex items-center justify-center rounded-2xl bg-[#0d2870] px-7 py-4 text-base font-semibold text-white shadow-[0_10px_34px_rgba(13,40,112,0.3)] transition hover:-translate-y-0.5 hover:bg-[#1a3fa8]"
              >
                Navigation starten
              </Link>
              <a
                href="#funktionen"
                className="inline-flex items-center justify-center rounded-2xl border border-slate-900/10 px-7 py-4 text-base font-medium text-slate-700 transition hover:border-[#1a3fa8] hover:text-[#1a3fa8]"
              >
                Mehr erfahren
              </a>
            </div>
          </div>

          <div className="flex items-center" style={{ ...fadeInStyle, animationDelay: "0.12s" }}>
            <div className="relative w-full overflow-hidden rounded-[36px] border border-slate-900/10 bg-white p-8 shadow-[0_28px_80px_rgba(15,23,42,0.08)]">
              <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-[radial-gradient(circle,rgba(26,63,168,0.15)_0%,transparent_70%)]" />
              <div className="relative aspect-[4/5] w-full overflow-hidden rounded-[30px] bg-[linear-gradient(180deg,#f7f5f0_0%,#e8eefc_100%)]">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_25%,rgba(26,63,168,0.18),transparent_42%),radial-gradient(circle_at_50%_90%,rgba(14,140,130,0.14),transparent_30%)]" />
                <img
                  src="/20250815_2153_Transparent Background Compass_remix_01k2qmm0k0enn9ce5v6byac3v0.png"
                  alt="Kompass Illustration"
                  className="relative z-10 h-full w-full object-contain p-6"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      <hr className="mx-6 border-slate-900/10 lg:mx-10" />

      <section id="funktionen" className="mx-auto w-full max-w-7xl px-6 py-24 lg:px-10">
        <div className="max-w-3xl" style={fadeInStyle}>
          <p className="text-[0.72rem] font-bold uppercase tracking-[0.18em] text-[#1a3fa8]">
            Funktionalität
          </p>
          <h2 className={`${sectionTitleClass} mt-4`}>
            Gezielte Unterstützung, wenn sie gebraucht wird.
          </h2>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-700">
            helpsola ist dein digitaler Lotse. Wir stellen keine Diagnosen, sondern
            führen effizient zur richtigen Adresse im Medizinwesen.
          </p>
        </div>

        <div className="mt-16 space-y-14">
          <section style={fadeInStyle}>
            <div className="mb-6 flex items-center gap-4">
              <p className="text-[0.72rem] font-bold uppercase tracking-[0.16em] text-slate-500">
                Bei Notfällen
              </p>
              <span className="h-px flex-1 bg-slate-900/10" />
            </div>
            <div className="grid gap-5 lg:grid-cols-2">
              <div className={cardClass}>
                <div className="mb-5 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-[#e6ecff] text-2xl text-[#1a3fa8]">
                  +
                </div>
                <h3 className="font-serif text-3xl tracking-[-0.03em] text-slate-950">
                  Notfall-Apotheken
                </h3>
                <p className="mt-4 text-base leading-7 text-slate-700">
                  Finde sofort die nächstgelegene diensthabende Apotheke,
                  deutschlandweit und mit klar benanntem Gültigkeitszeitraum.
                </p>
              </div>

              <div className={cardClass}>
                <div className="mb-5 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-[#e0f5f3] text-2xl text-[#0e8c82]">
                  □
                </div>
                <h3 className="font-serif text-3xl tracking-[-0.03em] text-slate-950">
                  Klinik-Suche
                </h3>
                <p className="mt-4 text-base leading-7 text-slate-700">
                  Spezialisierte Fachkliniken finden, zum Beispiel für HNO,
                  Kardiologie oder andere medizinische Schwerpunkte.
                </p>
                <a
                  href="#anbieter"
                  className="mt-6 inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.14em] text-[#1a3fa8]"
                >
                  Mehr dazu
                  <span aria-hidden="true">-&gt;</span>
                </a>
              </div>
            </div>
          </section>

          <section id="community" style={fadeInStyle}>
            <div className="mb-6 flex items-center gap-4">
              <p className="text-[0.72rem] font-bold uppercase tracking-[0.16em] text-slate-500">
                Vernetzung
              </p>
              <span className="h-px flex-1 bg-slate-900/10" />
            </div>
            <div className="rounded-[30px] bg-[linear-gradient(135deg,#0d2870_0%,#0a6e66_100%)] p-8 text-white shadow-[0_24px_70px_rgba(13,40,112,0.22)]">
              <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                <div className="max-w-2xl">
                  <h3 className="font-serif text-3xl tracking-[-0.03em]">
                    Patienten-Community
                  </h3>
                  <p className="mt-4 text-base leading-7 text-white/78">
                    Ein geschützter Raum für Austausch. Vernetze dich mit Menschen
                    in ähnlichen Situationen und profitiere von kollektiver
                    Erfahrung.
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex -space-x-2">
                    {heroAvatars.map((avatar) => (
                      <img
                        key={`community-${avatar}`}
                        src={avatar}
                        alt=""
                        className="h-11 w-11 rounded-full border-[2.5px] border-white/40 object-cover"
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section id="anbieter" style={fadeInStyle}>
            <div className="mb-6 flex items-center gap-4">
              <p className="text-[0.72rem] font-bold uppercase tracking-[0.16em] text-slate-500">
                Spezialisierung
              </p>
              <span className="h-px flex-1 bg-slate-900/10" />
            </div>
            <div className="grid gap-5">
              <div className={cardClass}>
                <div className="mb-5 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-[#fff1e6] text-2xl text-[#c96b10]">
                  ✓
                </div>
                <h3 className="font-serif text-3xl tracking-[-0.03em] text-slate-950">
                  Zertifizierte Zentren
                </h3>
                <p className="mt-4 text-base leading-7 text-slate-700">
                  Von Diabetes bis Onkologie: helpsola kann Kompetenzzentren sichtbar
                  machen, die durch Fachgesellschaften geprüft und zertifiziert
                  sind.
                </p>
                <div className="mt-5 flex flex-wrap gap-2">
                  {["Diabetes", "Herz", "Krebs"].map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full bg-[#f7f5f0] px-3 py-1.5 text-xs font-bold uppercase tracking-[0.12em] text-slate-600"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </section>
        </div>
      </section>

      <section id="faq" className="bg-[#eeeae1] px-6 py-24 lg:px-10">
        <div className="mx-auto w-full max-w-4xl">
          <div className="max-w-2xl" style={fadeInStyle}>
            <p className="text-[0.72rem] font-bold uppercase tracking-[0.18em] text-[#1a3fa8]">
              Hilfe &amp; Support
            </p>
            <h2 className={`${sectionTitleClass} mt-4`}>Häufig gestellte Fragen</h2>
          </div>

          <div className="mt-14 space-y-3">
            {faqItems.map((item) => (
              <details
                key={item.q}
                className="group rounded-2xl border border-slate-900/10 bg-white px-6 py-5 shadow-[0_4px_18px_rgba(15,23,42,0.05)]"
              >
                <summary className="flex cursor-pointer list-none items-center justify-between gap-6 font-serif text-xl tracking-[-0.02em] text-slate-950">
                  <span>{item.q}</span>
                  <span className="text-[#1a3fa8] transition group-open:rotate-180">v</span>
                </summary>
                <p className="pt-4 text-base leading-7 text-slate-700">{item.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="px-6 py-24 lg:px-10">
        <div className="mx-auto w-full max-w-6xl overflow-hidden rounded-[36px] bg-[linear-gradient(135deg,#0d2870_0%,#102456_55%,#0a6e66_100%)] p-10 text-white shadow-[0_24px_80px_rgba(13,40,112,0.22)] sm:p-14">
          <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            <div>
              <p className="text-[0.72rem] font-bold uppercase tracking-[0.18em] text-white/55">
                Bereit loszulegen?
              </p>
              <h2 className="mt-4 font-serif text-4xl leading-tight tracking-[-0.03em] sm:text-5xl">
                Ihr nächster Schritt beginnt hier.
              </h2>
              <p className="mt-5 max-w-xl text-lg leading-8 text-white/72">
                Menschen suchen täglich nach Orientierung im Gesundheitswesen. Für
                den ersten Schritt kannst du direkt den Apothekensucher öffnen.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row lg:justify-end">
              <Link
                href="/apothekensucher"
                className="inline-flex items-center justify-center rounded-2xl bg-white px-7 py-4 text-base font-semibold text-[#0d2870] transition hover:-translate-y-0.5"
              >
                Apothekensucher öffnen
              </Link>
              <a
                href="#community"
                className="inline-flex items-center justify-center rounded-2xl border border-white/25 px-7 py-4 text-base font-medium text-white/85 transition hover:border-white/60 hover:text-white"
              >
                Mehr erfahren
              </a>
            </div>
          </div>
        </div>
      </section>

      <style>{`
        @keyframes fadeUp {
          from {
            opacity: 0;
            transform: translateY(24px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </main>
  );
}
