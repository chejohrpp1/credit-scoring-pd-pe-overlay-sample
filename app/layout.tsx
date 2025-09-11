import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import {
  Gauge,
  Settings,
  PanelsTopLeft,
  Calculator,
  SlidersHorizontal,
} from "lucide-react";
import "./globals.css";

export const metadata: Metadata = {
  title: "FG MICOOPE – Risk Suite",
  description: "PD / Expected Loss / Overlay",
};

function NavLink({
  href,
  label,
  icon,
}: {
  href: string;
  label: string;
  icon: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-[var(--muted)] border border-transparent hover:border-[var(--ring)] text-sm"
    >
      {icon}
      <span>{label}</span>
    </Link>
  );
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body>
        <div className="grid grid-cols-1 md:grid-cols-[260px_1fr] min-h-screen">
          {/* Sidebar */}
          <aside
            className="hidden md:flex flex-col gap-4 p-4 border-r"
            style={{ borderColor: "var(--ring)", background: "var(--panel)" }}
          >
            <div className="flex items-center gap-2 mb-2">
              <PanelsTopLeft className="w-5 h-5" />
              <div className="font-semibold">FG MICOOPE – Suite</div>
            </div>

            <div className="flex justify-center mb-4">
              <Image
                src="/images/FONDO-DE-GARANTIA-PNG.png"
                alt="Fondo de Garantía MICOOPE"
                width={200}
                height={80}
                className="object-contain"
              />
            </div>

            <nav className="flex flex-col gap-2">
              <NavLink
                href="/pd"
                label="Predictor de Riesgo (PD)"
                icon={<Gauge className="w-4 h-4" />}
              />
              <NavLink
                href="/pe"
                label="Pérdidas Esperadas (PE)"
                icon={<Calculator className="w-4 h-4" />}
              />
              <NavLink
                href="/overlay"
                label="Overlay / Ajustes"
                icon={<SlidersHorizontal className="w-4 h-4" />}
              />
            </nav>

            <div
              className="mt-auto text-xs"
              style={{ color: "var(--fg-muted)" }}
            >
              v1 • Tailwind v4 (sin config)
            </div>
          </aside>

          {/* Topbar on mobile */}
          <header
            className="md:hidden sticky top-0 z-10 p-3 border-b backdrop-blur"
            style={{
              background: "color-mix(in oklab, var(--panel) 70%, transparent)",
              borderColor: "var(--ring)",
            }}
          >
            <div className="flex items-center justify-between">
              <div className="font-semibold">FG MICOOPE – Suite</div>
              <Link href="/pd" className="btn">
                Abrir menú
              </Link>
            </div>
          </header>

          {/* Main */}
          <main className="p-4 md:p-6 space-y-6">{children}</main>
        </div>
      </body>
    </html>
  );
}
