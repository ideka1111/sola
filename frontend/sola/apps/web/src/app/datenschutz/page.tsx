import Link from "next/link";

const APP_VARIANT =
  process.env.NEXT_PUBLIC_APP_VARIANT === "apotheken" ? "apotheken" : "general";

export default function DatenschutzPage() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_50%_-20%,#1c2c45_0%,#101a2b_42%,#0b1220_100%)] px-4 py-8 text-slate-100 sm:px-6">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold tracking-[0.16em] text-slate-400">
              HELPSOLA
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-50 sm:text-4xl">
              Datenschutzerklärung
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
            Diese Anwendung befindet sich aktuell in einem nicht öffentlichen Testbetrieb
            und wird nur ausgewählten Gruppen zur Verfügung gestellt. Diese Seite stellt
            eine praktische Grundlage dar, ersetzt aber keine individuelle Rechtsberatung.
          </p>
        </section>

        <section className="rounded-2xl border border-slate-500/30 bg-slate-900/35 p-5 backdrop-blur-xl">
          <h2 className="text-xl font-semibold text-slate-50">1. Verantwortliche Stelle</h2>
          <div className="mt-3 space-y-2 text-sm text-slate-300">
            <p>Gustave Bekono Enama</p>
            <p>In der Lies 10</p>
            <p>53129 Bonn</p>
            <p>E-Mail: gustave.enama@helpsola.com</p>
            <p>Telefon: 015256257136</p>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-500/30 bg-slate-900/35 p-5 backdrop-blur-xl">
          <h2 className="text-xl font-semibold text-slate-50">2. Zweck der Verarbeitung</h2>
          <div className="mt-3 space-y-3 text-sm leading-6 text-slate-300">
            <p>
              Diese Anwendung dient{" "}
              {APP_VARIANT === "apotheken"
                ? "der Suche nach Notdienst-Apotheken."
                : "der Suche nach Notdienst-Apotheken und weiteren medizinischen Suchfunktionen."}
            </p>
            <p>
              Verarbeitet werden Daten, um Nutzeranfragen technisch zu beantworten, die
              Anwendung bereitzustellen, Missbrauch zu begrenzen und freiwilliges Feedback
              auszuwerten.
            </p>
            <p>
              Der aktuelle Betrieb erfolgt als Testbetrieb und nicht als allgemein
              öffentliche Produktveröffentlichung.
            </p>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-500/30 bg-slate-900/35 p-5 backdrop-blur-xl">
          <h2 className="text-xl font-semibold text-slate-50">3. Welche Daten verarbeitet werden</h2>
          <div className="mt-3 space-y-3 text-sm leading-6 text-slate-300">
            <p>Je nach Nutzung können insbesondere folgende Daten verarbeitet werden:</p>
            <p>Chat-Inhalte und Suchanfragen</p>
            <p>
              technische Verbindungsdaten und Protokolldaten, etwa IP-Adresse,
              Browser-Informationen, Zeitstempel und User-Agent, soweit diese vom Hosting
              oder Backend verarbeitet werden
            </p>
            <p>anonyme Session-ID zur Sitzungssteuerung und Begrenzung von Missbrauch</p>
            <p>
              freiwillige Feedback-Daten wie Bewertung, Kommentar, Frage und Antwortverlauf
            </p>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-500/30 bg-slate-900/35 p-5 backdrop-blur-xl">
          <h2 className="text-xl font-semibold text-slate-50">4. Rechtsgrundlagen</h2>
          <div className="mt-3 space-y-3 text-sm leading-6 text-slate-300">
            <p>
              Die Verarbeitung erfolgt in der Regel auf Grundlage von Art. 6 Abs. 1 lit. b
              DSGVO, soweit sie zur Bereitstellung der angefragten Funktion erforderlich ist.
            </p>
            <p>
              Soweit Daten zur technischen Sicherheit, zur Missbrauchsverhinderung oder zur
              Stabilität des Dienstes verarbeitet werden, erfolgt dies auf Grundlage von
              Art. 6 Abs. 1 lit. f DSGVO.
            </p>
            <p>
              Freiwillig übermittelte Feedback-Daten können ebenfalls auf Grundlage von
              Art. 6 Abs. 1 lit. f DSGVO oder, soweit einschlägig, auf Grundlage einer
              Einwilligung verarbeitet werden.
            </p>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-500/30 bg-slate-900/35 p-5 backdrop-blur-xl">
          <h2 className="text-xl font-semibold text-slate-50">5. Empfänger und eingesetzte Dienste</h2>
          <div className="mt-3 space-y-3 text-sm leading-6 text-slate-300">
            <p>
              Zur technischen Bereitstellung und Beantwortung von Anfragen können externe
              Dienstleister eingesetzt werden, insbesondere Hosting- und Infrastruktur-Anbieter
              sowie KI-Dienstleister.
            </p>
            <p>
              Nach aktuellem Stand können insbesondere folgende Dienste eingesetzt werden:
              Hosting, OpenAI für die KI-Verarbeitung, Google-Dienste für die Übermittlung von
              Feedback, externe Apotheken-/Notdienstquellen sowie gegebenenfalls ein Redis-/
              Upstash-Dienst für technische Rate-Limits oder Sitzungssteuerung.
            </p>
            <p>
              Bei der Suche nach Notdienst-Apotheken werden Suchparameter an externe
              Apotheken-/Notdienstquellen übermittelt, soweit dies zur Beantwortung der
              Anfrage erforderlich ist.
            </p>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-500/30 bg-slate-900/35 p-5 backdrop-blur-xl">
          <h2 className="text-xl font-semibold text-slate-50">6. Speicherdauer</h2>
          <div className="mt-3 space-y-3 text-sm leading-6 text-slate-300">
            <p>
              Personenbezogene Daten werden nur so lange gespeichert, wie dies für die
              genannten Zwecke erforderlich ist oder gesetzliche Aufbewahrungspflichten bestehen.
            </p>
            <p>
              Für diesen Testbetrieb ist vorgesehen, Feedback-Daten und sonstige
              anwendungsbezogene Daten grundsätzlich nach spätestens 90 Tagen zu löschen oder
              zu anonymisieren, soweit keine längere Speicherung aus technischen oder
              rechtlichen Gründen erforderlich ist.
            </p>
            <p>
              Session-Daten werden grundsätzlich nur für die technische Sitzungssteuerung
              verwendet und nach Inaktivität oder Ablauf des jeweiligen Zeitfensters verworfen.
            </p>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-500/30 bg-slate-900/35 p-5 backdrop-blur-xl">
          <h2 className="text-xl font-semibold text-slate-50">7. Deine Rechte</h2>
          <div className="mt-3 space-y-3 text-sm leading-6 text-slate-300">
            <p>
              Du hast nach der DSGVO insbesondere das Recht auf Auskunft, Berichtigung,
              Löschung, Einschränkung der Verarbeitung, Datenübertragbarkeit und Widerspruch.
            </p>
            <p>
              Sofern eine Verarbeitung auf Einwilligung beruht, kannst du diese jederzeit mit
              Wirkung für die Zukunft widerrufen.
            </p>
            <p>
              Außerdem hast du das Recht, dich bei einer Datenschutzaufsichtsbehörde zu
              beschweren.
            </p>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-500/30 bg-slate-900/35 p-5 backdrop-blur-xl">
          <h2 className="text-xl font-semibold text-slate-50">8. Medizinischer und inhaltlicher Hinweis</h2>
          <div className="mt-3 space-y-3 text-sm leading-6 text-slate-300">
            <p>
              Die bereitgestellten Inhalte dienen ausschließlich allgemeinen
              Informationszwecken und ersetzen keine ärztliche, pharmazeutische oder rechtliche
              Beratung.
            </p>
            <p>
              Für die Richtigkeit, Vollständigkeit, Aktualität oder Verfügbarkeit der
              bereitgestellten Informationen wird keine Gewähr übernommen.
            </p>
            <p>
              Eine Haftung für Entscheidungen, Maßnahmen oder Schäden, die auf Grundlage der
              bereitgestellten Informationen getroffen oder verursacht werden, ist im gesetzlich
              zulässigen Umfang ausgeschlossen.
            </p>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-500/30 bg-slate-900/35 p-5 backdrop-blur-xl">
          <h2 className="text-xl font-semibold text-slate-50">9. Kontakt für Datenschutzanfragen</h2>
          <div className="mt-3 space-y-2 text-sm text-slate-300">
            <p>E-Mail: gustave.enama@helpsola.com</p>
            <p>Bitte richte Datenschutzanfragen an diese Adresse.</p>
          </div>
        </section>
      </div>
    </main>
  );
}
