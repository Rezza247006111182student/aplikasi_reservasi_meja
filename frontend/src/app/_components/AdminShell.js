"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const navItems = [
  { label: "Dashboard", href: "/admin", icon: "fa-solid fa-chart-line", ready: true },
  { label: "Data Reservasi", href: "/admin/reservasi", icon: "fa-regular fa-calendar-check", ready: true },
  { label: "Kelola Meja", href: "/admin/meja", icon: "fa-solid fa-chair", ready: true },
  { label: "Kelola Hidangan", href: "/admin/hidangan", icon: "fa-solid fa-bowl-food", ready: true },
  { label: "Zona & Lantai", href: "/admin/zona", icon: "fa-solid fa-layer-group", ready: true },
  { label: "Editor Denah", href: "/admin/denah", icon: "fa-solid fa-object-group", ready: true },
  { label: "Data Pengguna", href: "/admin/pengguna", icon: "fa-regular fa-user", ready: true },
  { label: "Laporan Okupansi", href: "/admin/laporan", icon: "fa-solid fa-chart-pie", ready: true },
];

export default function AdminShell({ title, description, children }) {
  const pathname = usePathname();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const sidebar = (
    <aside className="flex h-full w-72 flex-col border-r border-slate-200 bg-white">
      <div className="border-b border-slate-200 p-5">
        <Link href="/" className="flex items-center gap-3 font-semibold text-slate-950">
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-teal-600 text-white">
            <i className="fa-solid fa-utensils" aria-hidden="true" />
          </span>
          <span className="leading-tight">
            Nusantara Table
            <span className="block text-xs font-medium text-slate-500">
              Admin Panel
            </span>
          </span>
        </Link>
      </div>

      <nav className="grid gap-1 p-4">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const baseClass =
            "flex items-center justify-between rounded-md px-4 py-3 text-sm font-semibold transition";
          const stateClass = isActive
            ? "bg-teal-50 text-teal-700"
            : "text-slate-700 hover:bg-slate-100 hover:text-teal-700";

          if (!item.ready) {
            return (
              <button
                key={item.label}
                type="button"
                className={`${baseClass} ${stateClass} text-left`}
                title="Halaman akan dibuat pada tahap berikutnya"
              >
                <span className="flex items-center gap-3">
                  <i className={`${item.icon} w-4`} aria-hidden="true" />
                  {item.label}
                </span>
                <span className="rounded-md bg-slate-100 px-2 py-1 text-[10px] font-bold uppercase text-slate-500">
                  Soon
                </span>
              </button>
            );
          }

          return (
            <Link key={item.href} href={item.href} className={`${baseClass} ${stateClass}`}>
              <span className="flex items-center gap-3">
                <i className={`${item.icon} w-4`} aria-hidden="true" />
                {item.label}
              </span>
              {isActive ? <span className="h-2 w-2 rounded-full bg-teal-600" /> : null}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto border-t border-slate-200 p-4">
        <div className="rounded-lg bg-slate-50 p-4">
          <p className="text-sm font-semibold text-slate-950">Admin Restoran</p>
          <p className="mt-1 text-xs leading-5 text-slate-500">
            Panel terhubung ke backend TiDB.
          </p>
        </div>
      </div>
    </aside>
  );

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <div className="hidden fixed inset-y-0 left-0 z-30 lg:block">{sidebar}</div>

      <div
        className={`fixed inset-0 z-40 bg-slate-950/40 transition-opacity lg:hidden ${
          isSidebarOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={() => setIsSidebarOpen(false)}
      />
      <div
        className={`fixed inset-y-0 left-0 z-50 transition-transform lg:hidden ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {sidebar}
      </div>

      <section className="lg:pl-72">
        <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur">
          <div className="flex min-h-16 items-center justify-between gap-4 px-5 py-3">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setIsSidebarOpen(true)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-700 shadow-sm lg:hidden"
                aria-label="Buka sidebar admin"
              >
                <i className="fa-solid fa-bars-staggered" aria-hidden="true" />
              </button>
              <div>
                <p className="text-xs font-semibold uppercase text-teal-700">
                  Admin
                </p>
                <h1 className="text-xl font-bold text-slate-950">{title}</h1>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Link
                href="/"
                className="hidden h-10 items-center justify-center rounded-md border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-800 transition hover:border-teal-300 hover:text-teal-700 sm:inline-flex"
              >
                Lihat Website
              </Link>
              <button className="flex h-10 w-10 items-center justify-center rounded-md bg-teal-50 text-teal-700">
                <i className="fa-regular fa-user" aria-hidden="true" />
              </button>
            </div>
          </div>
        </header>

        <div className="mx-auto w-full max-w-7xl px-5 py-8">
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-slate-950">{title}</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
              {description}
            </p>
          </div>
          {children}
        </div>
      </section>
    </main>
  );
}
