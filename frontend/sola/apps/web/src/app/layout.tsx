import type { Metadata } from "next";
import "./globals.css";
import { Inter } from "next/font/google";
import Link from "next/link";
import React from "react";
import { NuqsAdapter } from "nuqs/adapters/next/app";

const inter = Inter({
  subsets: ["latin"],
  preload: true,
  display: "swap",
});

const isApothekenVariant = process.env.NEXT_PUBLIC_APP_VARIANT === "apotheken";
const appTitle = isApothekenVariant
  ? "helpsola | Notdienst-Apotheken schnell finden"
  : "helpsola | Orientierung im Gesundheitssystem";
const appDescription = isApothekenVariant
  ? "Finde mit helpsola schnell passende Notdienst-Apotheken in deiner Nähe. Suche nach Ort oder PLZ und erhalte aktuelle Informationen zum Notdienstzeitraum."
  : "helpsola unterstützt bei der Orientierung im Gesundheitssystem und hilft dabei, passende medizinische Anlaufstellen schneller zu finden.";

export const metadata: Metadata = {
  title: appTitle,
  description: appDescription,
  applicationName: "helpsola",
  keywords: isApothekenVariant
    ? [
        "Notdienst Apotheke",
        "Apotheken Notdienst",
        "Notfallapotheke",
        "Apotheke in der Nähe",
        "PLZ Apotheke",
        "helpsola",
      ]
    : ["Gesundheitssystem", "medizinische Orientierung", "Kliniksuche", "helpsola"],
  openGraph: {
    title: appTitle,
    description: appDescription,
    siteName: "helpsola",
    locale: "de_DE",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: appTitle,
    description: appDescription,
  },
  icons: {
    icon: "/logo.png",
    shortcut: "/logo.png",
    apple: "/logo.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="de">
      <body className={inter.className}>
        <NuqsAdapter>
          <div className="min-h-screen">
            {children}
            <footer className="border-t border-slate-500/20 bg-slate-950/80 px-4 py-4 text-xs text-slate-400 backdrop-blur sm:px-6">
              <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-4">
                <p>Sola</p>
                <div className="flex items-center gap-4">
                  <Link
                    href="/datenschutz"
                    className="text-slate-300 underline decoration-slate-500/60 underline-offset-4 transition hover:text-slate-100"
                  >
                    Datenschutzerklärung
                  </Link>
                  <Link
                    href="/impressum"
                    className="text-slate-300 underline decoration-slate-500/60 underline-offset-4 transition hover:text-slate-100"
                  >
                    Impressum
                  </Link>
                </div>
              </div>
            </footer>
          </div>
        </NuqsAdapter>
      </body>
    </html>
  );
}
