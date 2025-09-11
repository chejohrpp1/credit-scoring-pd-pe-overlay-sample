// components/Sidebar.tsx
"use client";

import Link from "next/link";
import Image from "next/image";
import { Gauge, Calculator, SlidersHorizontal, PanelsTopLeft, X } from "lucide-react";
import { useEffect } from "react";

export function Sidebar({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  // Evita scroll del body cuando está abierto el drawer
  useEffect(() => {
    if (open) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const NavLink = ({
    href,
    label,
    icon,
    onClick,
  }: {
    href: string;
    label: string;
    icon: React.ReactNode;
    onClick?: () => void;
  }) => (
    <Link
      href={href}
      onClick={onClick}
      className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-[var(--muted)] border border-transparent hover:border-[var(--ring)] text-sm"
    >
      {icon}
      <span>{label}</span>
    </Link>
  );

  return (
    <>
      {/* Sidebar estático en ≥md */}
      <aside
        className="hidden md:flex md:flex-col md:gap-4 md:p-4 md:border-r"
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
          <NavLink href="/pd" label="Predictor de Riesgo (PD)" icon={<Gauge className="w-4 h-4" />} />
          <NavLink href="/pe" label="Pérdidas Esperadas (PE)" icon={<Calculator className="w-4 h-4" />} />
          <NavLink href="/overlay" label="Overlay / Ajustes" icon={<SlidersHorizontal className="w-4 h-4" />} />
        </nav>
      </aside>

      {/* Drawer móvil */}
      <aside
        role="dialog"
        aria-modal="true"
        className={`md:hidden fixed z-40 top-0 left-0 h-dvh w-[78%] max-w-[320px] transition-transform duration-300
          ${open ? "translate-x-0" : "-translate-x-full"}`}
        style={{
          background: "white",
          borderRight: `1px solid var(--ring)`,
        }}
      >
        <div className="p-3 border-b" style={{ borderColor: "var(--ring)" }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <PanelsTopLeft className="w-5 h-5" />
              <div className="font-semibold">FG MICOOPE – Suite</div>
            </div>
            <button
              aria-label="Cerrar menú"
              onClick={onClose}
              className="rounded-lg p-2 hover:bg-[var(--muted)] border"
              style={{ borderColor: "var(--ring)" }}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <nav className="flex flex-col gap-2 p-3">
          <NavLink href="/pd" label="Predictor de Riesgo (PD)" icon={<Gauge className="w-4 h-4" />} onClick={onClose} />
          <NavLink href="/pe" label="Pérdidas Esperadas (PE)" icon={<Calculator className="w-4 h-4" />} onClick={onClose} />
          <NavLink href="/overlay" label="Overlay / Ajustes" icon={<SlidersHorizontal className="w-4 h-4" />} onClick={onClose} />
        </nav>

      </aside>
    </>
  );
}
