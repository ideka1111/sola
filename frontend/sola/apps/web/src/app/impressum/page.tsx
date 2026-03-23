import Link from "next/link";

const APP_VARIANT =
  process.env.NEXT_PUBLIC_APP_VARIANT === "apotheken" ? "apotheken" : "general";

export default function ImpressumPage() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_50%_-20%,#1c2c45_0%,#101a2b_42%,#0b1220_100%)] px-4 py-8 text-slate-100 sm:px-6">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold tracking-[0.16em] text-slate-400">
              HELPSOLA
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-50 sm:text-4xl">
              Impressum
            </h1>
          </div>
          <Link
            href="/"
            className="rounded-xl border border-slate-500/40 bg-slate-800/60 px-4 py-2 text-sm text-slate-100 transition hover:bg-slate-700/70"
          >
            Zurück
          </Link>
        </div>

        <section className="rounded-2xl border border-amber-300/35 bg-amber-100/10 p-4 text-sm text-amber-50">
          <p className="font-medium">Wichtiger Hinweis</p>
          <p className="mt-2">
            Diese Anwendung befindet sich aktuell in einem Testbetrieb und wird nicht
            öffentlich beworben. Die Angaben geben den derzeitigen Teststand wieder und
            sollten vor einem öffentlichen Livegang erneut rechtlich geprüft werden.
          </p>
        </section>

        <section className="rounded-2xl border border-slate-500/30 bg-slate-900/35 p-5 backdrop-blur-xl">
          <h2 className="text-xl font-semibold text-slate-50">Angaben gemäß § 5 DDG</h2>
          <div className="mt-3 space-y-2 text-sm leading-6 text-slate-300">
            <p>Gustave Bekono Enama</p>
            <p>In der Lies 10</p>
            <p>53129 Bonn</p>
            <p>Deutschland</p>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-500/30 bg-slate-900/35 p-5 backdrop-blur-xl">
          <h2 className="text-xl font-semibold text-slate-50">Kontakt</h2>
          <div className="mt-3 space-y-2 text-sm leading-6 text-slate-300">
            <p>E-Mail: gustave.enama@helpsola.com</p>
            <p>Telefon: 015256257136</p>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-500/30 bg-slate-900/35 p-5 backdrop-blur-xl">
          <h2 className="text-xl font-semibold text-slate-50">Rechtsform / Status</h2>
          <div className="mt-3 space-y-2 text-sm leading-6 text-slate-300">
            <p>Aktuell privater Testbetrieb.</p>
            <p>Es besteht derzeit keine eingetragene Gesellschaft oder Handelsregistereintragung.</p>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-500/30 bg-slate-900/35 p-5 backdrop-blur-xl">
          <h2 className="text-xl font-semibold text-slate-50">Umsatzsteuer-ID</h2>
          <div className="mt-3 space-y-2 text-sm leading-6 text-slate-300">
            <p>Keine Umsatzsteuer-Identifikationsnummer vorhanden.</p>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-500/30 bg-slate-900/35 p-5 backdrop-blur-xl">
          <h2 className="text-xl font-semibold text-slate-50">Haftungsausschluss</h2>
          <div className="mt-3 space-y-3 text-sm leading-6 text-slate-300">
            <p>Die Inhalte dieser Anwendung dienen ausschließlich allgemeinen Informationszwecken.</p>
            <p>
              Für die Richtigkeit, Vollständigkeit, Aktualität oder Verfügbarkeit der
              bereitgestellten Informationen wird keine Gewähr übernommen.
            </p>
            <p>
              Eine Haftung für Schäden oder Nachteile, die aus der Nutzung oder dem Vertrauen
              auf die bereitgestellten Informationen entstehen, ist im gesetzlich zulässigen
              Umfang ausgeschlossen.
            </p>
            <p>
              {APP_VARIANT === "apotheken"
                ? "Die Anwendung unterstützt bei der Suche nach Notdienst-Apotheken, ersetzt aber keine verbindliche Auskunft einer Apotheke oder medizinischen Stelle."
                : "Die Anwendung unterstützt bei Such- und Orientierungsvorgängen, ersetzt aber keine medizinische, rechtliche oder sonstige fachliche Beratung."}
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
