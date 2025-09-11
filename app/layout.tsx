// app/layout.tsx
"use client";

import Link from "next/link";

import { useEffect, useState } from "react";
import { Menu } from "lucide-react";
import "./globals.css";
import { Sidebar } from "./components/Sidebar";


export default function RootLayout({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);

  // Cerrar con ESC en móvil
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <html lang="es">
      <body>
        {/* Topbar (móvil) */}
        <header
          className="md:hidden sticky top-0 z-30 p-3 border-b backdrop-blur"
          style={{
            background: "color-mix(in oklab, var(--panel) 70%, white)",
            borderColor: "var(--ring)",
          }}
        >
          <div className="flex items-center justify-between">
            <button
              aria-label="Abrir menú"
              onClick={() => setOpen(true)}
              className="rounded-lg p-2 hover:bg-[var(--muted)] border"
              style={{ borderColor: "var(--ring)" }}
            >
              <Menu className="w-5 h-5" />
            </button>
            <Link href="/pd" className="text-sm font-semibold">
              FG MICOOPE – Suite
            </Link>
            <div className="w-9" />
          </div>
        </header>

        {/* Backdrop móvil */}
        {open && (
          <div
            className="fixed inset-0 z-30 bg-black/40 md:hidden"
            onClick={() => setOpen(false)}
            aria-hidden
          />
        )}

        <div className="grid grid-cols-1 md:grid-cols-[260px_1fr] min-h-[100dvh]">
          {/* Sidebar responsivo/colapsable */}
          <Sidebar open={open} onClose={() => setOpen(false)} />

          {/* Main */}
          <main className="p-4 md:p-6 space-y-6 z-10">{children}</main>
        </div>
      </body>
    </html>
  );
}
